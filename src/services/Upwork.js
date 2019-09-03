import parser from 'fast-xml-parser'
import { pipeP, pathOr } from '../utils'
import fetch from 'node-fetch'
import * as R from 'ramda'
import { inject, paramsToContext } from '../aspects'
import * as TelegramBot from './TelegramBot'
import { ChatRepository } from '../modules/chat'
import { SettingsRepository } from '../modules/settings'
import { decodeHTML } from 'entities'
import { PostRepository } from '../modules/post'

const chatTypes = {
  development: ChatRepository.CHAT_TYPE.DEVELOPMENT,
  design: ChatRepository.CHAT_TYPE.DESIGN,
}

export const updateFeed = R.compose(
  paramsToContext('data'),
  inject({ name: 'telegramBot', singleton: TelegramBot }),
  inject({ name: 'chatRepository', singleton: ChatRepository }),
  inject({ name: 'settingsRepository', singleton: SettingsRepository }),
  inject({ name: 'postRepository', singleton: PostRepository }),
)(
  //
  ({
    data: { type },
    telegramBot,
    chatRepository,
    settingsRepository,
    postRepository,
  }) =>
    pipeP(
      // Fetch feed and parse
      () => settingsRepository.get(),
      ({ [`${type}Url`]: url }) => fetch(url),
      x => x.text(),
      x => parser.parse(x),
      pathOr([], 'rss.channel.item'),
      R.map(R.evolve({ pubDate: x => new Date(x).getTime() })),

      // Filter feed, leave only new in production
      // Simply take first in development
      R.ifElse(
        () => process.env.NODE_ENV === 'production',
        pipeP(
          x => Promise.all([settingsRepository.get(), x]),
          ([{ [`${type}LastPubDate`]: lastPubDate }, x]) =>
            R.filter(({ pubDate }) => lastPubDate < pubDate, x),
        ),
        R.slice(0, 1),
      ),

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

      // Save posts
      R.map(
        R.applySpec({
          title: R.prop('title'),
          pubDate: R.prop('pubDate'),
          description: R.pipe(
            R.prop('description'),
            R.replace(/<br \/>/g, '\n'),
            decodeHTML,
          ),
        }),
      ),
      R.apply(postRepository.create),

      // Send posts to chats
      x => Promise.all([chatRepository.find({ type: chatTypes[type] }), x]),
      ([chats = [], posts]) =>
        R.map(
          ({ chatId }) => telegramBot.sendPostsToChat(chatId, posts),
          chats,
        ),
      x => Promise.all(x),
    )(),
)
