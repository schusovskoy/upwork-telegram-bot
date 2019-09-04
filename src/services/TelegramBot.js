import fetch from 'node-fetch'
import { BOT_TIMEOUT } from '../config/constants'
import * as R from 'ramda'
import {
  pipeP,
  ENV,
  pathEq,
  pathSatisfies,
  cond,
  tapP,
  hasPath,
} from '../utils'
import { inject } from '../aspects'
import { SettingsRepository } from '../modules/settings'
import { ChatRepository } from '../modules/chat'

const TELEGRAM_BASE = `https://api.telegram.org/bot${ENV.BOT_TOKEN}`

export const getUpdates = R.compose(
  inject({ name: 'settingsRepository', singleton: SettingsRepository }),
  inject({ name: 'chatRepository', singleton: ChatRepository }),
)(
  //
  ({ settingsRepository, chatRepository }) =>
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

      // Leave only commands
      R.filter(
        R.anyPass([
          hasPath('callback_query'),
          pathSatisfies(R.test(/^\/.+/), 'message.text'),
        ]),
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

          hasPath('callback_query'),
          ({ callback_query: { id: callback_query_id } }) =>
            answerCallback({ callback_query_id, text: 'Введите текст апплая' }),
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
    R.map(({ id, title, description }) => ({
      text: `#${id}\n<b>${title}</b>\n${description}`,
      chat_id: chatId,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Зааплаил', callback_data: `{"id":${id},"type":"APPLY"}` }],
        ],
      },
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
