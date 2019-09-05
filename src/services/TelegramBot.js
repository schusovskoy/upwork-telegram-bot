import fetch from 'node-fetch'
import { BOT_TIMEOUT, CHANGE_STATE_TIMEOUT } from '../config/constants'
import * as R from 'ramda'
import {
  pipeP,
  ENV,
  pathEq,
  pathSatisfies,
  cond,
  tapP,
  hasPath,
  path,
  jsonPathEq,
  Logger,
} from '../utils'
import { inject } from '../aspects'
import { SettingsRepository } from '../modules/settings'
import { ChatRepository } from '../modules/chat'
import { PostRepository } from '../modules/post'
import { format } from 'date-fns/fp'
import Queue from 'bull'

const TELEGRAM_BASE = `https://api.telegram.org/bot${ENV.BOT_TOKEN}`

const APPLY_SEPARATOR = '<b>==========APPLY==========</b>'

export const getUpdates = R.compose(
  inject({ name: 'settingsRepository', singleton: SettingsRepository }),
  inject({ name: 'chatRepository', singleton: ChatRepository }),
  inject({ name: 'postRepository', singleton: PostRepository }),
)(
  //
  ({ settingsRepository, chatRepository, postRepository }) =>
    pipeP(
      // Fetch new messages
      () => settingsRepository.get(),
      ({ lastUpdateId }) => lastUpdateId + 1,
      offset =>
        fetch(`${TELEGRAM_BASE}/getUpdates`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ offset, timeout: BOT_TIMEOUT }),
        }),
      x => x.json(),
      R.prop('result'),

      // Update lastUpdateId
      tapP(
        R.pipe(
          R.last,
          R.prop('update_id'),
          lastUpdateId =>
            lastUpdateId && settingsRepository.update({ lastUpdateId }),
        ),
      ),

      // Get not idling chats
      x =>
        Promise.all([
          x,
          chatRepository.find({
            state: { $ne: chatRepository.CHAT_STATE.IDLE },
          }),
        ]),
      ([x, chats]) => [x, R.pluck('chatId', chats)],

      // Leave only commands
      ([x, chats]) =>
        R.filter(
          R.anyPass([
            hasPath('callback_query'),
            pathSatisfies(R.test(/^\/.+/), 'message.text'),
            pathSatisfies(R.contains(R.__, chats), 'message.chat.id'),
          ]),
          x,
        ),

      // Process commands
      R.map(
        cond(
          pathEq('message.text', '/start'),
          ({
            message: {
              chat: { id },
            },
          }) => chatRepository.add(id),

          pathEq('message.text', '/stop'),
          ({
            message: {
              chat: { id },
            },
          }) => chatRepository.remove(id),

          pathSatisfies(R.test(/^\/setDevelopmentUrl /), 'message.text'),
          ({ message: { text } }) =>
            settingsRepository.update({
              developmentUrl: R.replace(/^\/setDevelopmentUrl /, '', text),
            }),

          pathSatisfies(R.test(/^\/setDesignUrl /), 'message.text'),
          ({ message: { text } }) =>
            settingsRepository.update({
              designUrl: R.replace(/^\/setDesignUrl /, '', text),
            }),

          pathEq('message.text', '/design'),
          ({
            message: {
              chat: { id },
            },
          }) =>
            chatRepository.updateByChatId(id, {
              type: chatRepository.CHAT_TYPE.DESIGN,
            }),

          pathEq('message.text', '/development'),
          ({
            message: {
              chat: { id },
            },
          }) =>
            chatRepository.updateByChatId(id, {
              type: chatRepository.CHAT_TYPE.DEVELOPMENT,
            }),

          R.pipe(
            path('callback_query.data'),
            jsonPathEq('type', 'APPLY'),
          ),
          ({
            callback_query: {
              id: callback_query_id,
              data,
              message: {
                message_id: messageId,
                chat: { id: chatId },
              },
            },
          }) =>
            pipeP(
              () =>
                answerCallback({
                  callback_query_id,
                  text: 'Введи текст апплая',
                }),
              () => JSON.parse(data),
              ({ id: postId }) =>
                pipeP(
                  () =>
                    chatRepository.updateByChatId(chatId, {
                      state: chatRepository.CHAT_STATE.WAITING_FOR_APPLY,
                      postId,
                      messageId,
                    }),
                  () =>
                    telegramQueue.add(
                      'setChatIdle',
                      { chatId },
                      { delay: CHANGE_STATE_TIMEOUT },
                    ),
                )(),
            )(),

          R.pipe(
            path('callback_query.data'),
            jsonPathEq('type', 'ANSWER'),
          ),
          ({
            callback_query: {
              id: callback_query_id,
              data,
              message: {
                message_id,
                chat: { id: chatId },
              },
            },
          }) =>
            pipeP(
              () =>
                answerCallback({
                  callback_query_id,
                  text: 'Ок, понял!',
                }),
              () => JSON.parse(data),
              ({ id, answered }) => postRepository.upsert({ id, answered }),
              x =>
                editMessageText({
                  message_id,
                  chat_id: chatId,
                  text: getMessageText(x),
                  reply_markup: getReplyMarkup(x),
                }),
            )(),

          R.T,
          ({
            message: {
              chat: { id: chatId },
              text,
            },
          }) =>
            pipeP(
              () => chatRepository.findByChatId(chatId),
              cond(
                R.propEq('state', chatRepository.CHAT_STATE.WAITING_FOR_APPLY),
                ({ postId: id, messageId: message_id }) =>
                  pipeP(
                    () =>
                      chatRepository.updateByChatId(chatId, {
                        state: chatRepository.CHAT_STATE.IDLE,
                      }),
                    () => postRepository.upsert({ id, apply: text }),
                    x =>
                      editMessageText({
                        message_id,
                        chat_id: chatId,
                        text: getMessageText(x),
                        reply_markup: getReplyMarkup(x),
                      }),
                  )(),
              ),
            )(),
        ),
      ),
      x => Promise.all(x),
    )(),
)

export const sendMessage = params =>
  fetch(`${TELEGRAM_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ parse_mode: 'HTML', ...params }),
  })

export const sendPostsToChat = (chatId, posts) =>
  R.pipe(
    () => posts,
    R.map(post => ({
      chat_id: chatId,
      text: getMessageText(post),
      reply_markup: getReplyMarkup(post),
    })),
    R.map(sendMessage),
    x => Promise.all(x),
  )()

export const answerCallback = params =>
  fetch(`${TELEGRAM_BASE}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })

export const editMessageText = params =>
  fetch(`${TELEGRAM_BASE}/editMessageText`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ parse_mode: 'HTML', ...params }),
  })

const getMessageText = ({ id, title, description, apply, applyTime }) =>
  `#${id}\n<b>${title}</b>\n${description}${
    !apply
      ? ''
      : `\n${APPLY_SEPARATOR}\n${apply}\n<b>${format(
          'dd.MM.yyyy HH:mm:ss',
          new Date(parseInt(applyTime)),
        )}</b>`
  }`

const getReplyMarkup = ({ id, answered }) => ({
  inline_keyboard: [
    [
      {
        text: 'Зааплаил',
        callback_data: JSON.stringify({ id, type: 'APPLY' }),
      },
      {
        text: answered ? 'Не ответил' : 'Ответил',
        callback_data: JSON.stringify({
          id,
          answered: !answered,
          type: 'ANSWER',
        }),
      },
    ],
  ],
})

const telegramQueue = new Queue('telegram', ENV.REDIS_URL)
telegramQueue.process('setChatIdle', ({ data: { chatId } }) =>
  ChatRepository.updateByChatId(chatId, {
    state: ChatRepository.CHAT_STATE.IDLE,
  }),
)
telegramQueue.on('failed', (job, err) =>
  Logger.error('TelegramBot queue error: ', job, err),
)
