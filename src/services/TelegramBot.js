import fetch from 'node-fetch'
import { BOT_TIMEOUT } from '../config/constants'
import * as R from 'ramda'
import { pipeP, ENV, pathEq } from '../utils'
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
      R.tap(
        R.pipe(
          R.last,
          R.prop('update_id'),
          lastUpdateId =>
            lastUpdateId && settingsRepository.update({ lastUpdateId }),
        ),
      ),
      R.filter(R.pathSatisfies(R.test(/^\/.+/), ['message', 'text'])),

      R.map(
        R.cond([
          [
            pathEq('message.text', '/start'),
            ({
              message: {
                chat: { id },
              },
            }) => chatRepository.add([id]),
          ],

          [
            pathEq('message.text', '/stop'),
            ({
              message: {
                chat: { id },
              },
            }) => chatRepository.remove([id]),
          ],
        ]),
      ),
      x => Promise.all(x),
    )(),
)
