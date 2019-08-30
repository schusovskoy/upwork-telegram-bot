import fetch from 'node-fetch'
import { BOT_TIMEOUT } from '../config/constants'
import * as R from 'ramda'
import { pipeP, ENV, pathEq, pathSatisfies, cond } from '../utils'
import { inject, paramsToContext } from '../aspects'
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
      R.tap(
        R.pipe(
          R.last,
          R.prop('update_id'),
          lastUpdateId =>
            lastUpdateId && settingsRepository.update({ lastUpdateId }),
        ),
      ),

      // Leave only commands
      R.filter(pathSatisfies(R.test(/^\/.+/), 'message.text')),

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

          pathSatisfies(R.test(/^\/changeUpworkUrl /), 'message.text'),
          ({ message: { text } }) =>
            settingsRepository.update({
              upworkUrl: R.replace(/^\/changeUpworkUrl /, '', text),
            }),
        ),
      ),
      x => Promise.all(x),
    )(),
)

export const sendMessage = R.compose(
  paramsToContext('text'),
  inject({ name: 'chatRepository', singleton: ChatRepository }),
)(
  //
  ({ text, chatRepository }) =>
    pipeP(
      () => chatRepository.getAll(),
      R.map(({ chatId: chat_id }) =>
        fetch(`${TELEGRAM_BASE}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
        }),
      ),
      x => Promise.all(x),
    )(),
)

export const sendMessageToChat = R.curry((chat_id, text) =>
  fetch(`${TELEGRAM_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
  }),
)
