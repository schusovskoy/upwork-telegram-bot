import parser from 'fast-xml-parser'
import { pipeP, pathOr } from '../utils'
import fetch from 'node-fetch'
import * as R from 'ramda'
import { inject, paramsToContext } from '../aspects'
import * as TelegramBot from './TelegramBot'
import { ChatRepository } from '../modules/chat'
import { SettingsRepository } from '../modules/settings'
import { decodeHTML } from 'entities'

const chatTypes = {
  development: ChatRepository.CHAT_TYPE.DEVELOPMENT,
  design: ChatRepository.CHAT_TYPE.DESIGN,
}

export const updateFeed = R.compose(
  paramsToContext('data'),
  inject({ name: 'telegramBot', singleton: TelegramBot }),
  inject({ name: 'chatRepository', singleton: ChatRepository }),
  inject({ name: 'settingsRepository', singleton: SettingsRepository }),
)(
  //
  ({ data: { type }, telegramBot, chatRepository, settingsRepository }) =>
    pipeP(
      // Fetch feed and parse
      () => settingsRepository.get(),
      ({ [`${type}Url`]: url }) => fetch(url),
      x => x.text(),
      x => parser.parse(x),
      pathOr([], 'rss.channel.item'),
      R.map(R.evolve({ pubDate: x => new Date(x).getTime() })),

      // Filter feed, leave only new
      x => Promise.all([settingsRepository.get(), x]),
      ([{ [`${type}LastPubDate`]: lastPubDate }, x]) =>
        R.filter(({ pubDate }) => lastPubDate < pubDate, x),

      // Update lastPubDate
      R.tap(
        R.pipe(
          R.head,
          R.prop('pubDate'),
          lastPubDate =>
            lastPubDate &&
            settingsRepository.update({ [`${type}LastPubDate`]: lastPubDate }),
        ),
      ),

      // Send posts to chats
      R.map(
        R.pipe(
          ({ title, description }) => `<b>${title}</b>\n${description}`,
          R.replace(/<br \/>/g, '\n'),
          decodeHTML,
        ),
      ),
      x => Promise.all([chatRepository.find({ type: chatTypes[type] }), x]),
      ([chats = [], posts]) =>
        R.map(
          ({ chatId }) => telegramBot.sendMessagesToChat(chatId, posts),
          chats,
        ),
      x => Promise.all(x),
    )(),
)
