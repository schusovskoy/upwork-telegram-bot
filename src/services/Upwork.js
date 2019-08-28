import parser from 'fast-xml-parser'
import { pipeP, path, Logger, ENV } from '../utils'
import fetch from 'node-fetch'
import * as R from 'ramda'
import { inject, paramsToContext } from '../aspects'
import * as TelegramBot from './TelegramBot'
import Queue from 'bull'
import { ChatRepository } from '../modules/chat'

export const addJob = chatId =>
  upworkQueue.add(
    { chatId },
    { jobId: chatId, repeat: { every: ENV.UPWORK_POLLING_TIMEOUT } },
  )

export const removeJob = chatId =>
  pipeP(
    () => upworkQueue.getJob(chatId),
    job => job && job.remove(),
  )()

const upworkQueue = new Queue('upwork', ENV.REDIS_URL)
upworkQueue.process(job => updateFeed(job))

const updateFeed = R.compose(
  paramsToContext('data'),
  inject({ name: 'telegramBot', singleton: TelegramBot }),
  inject({ name: 'chatRepository', singleton: ChatRepository }),
)(
  //
  ({ data: { chatId }, telegramBot, chatRepository }) =>
    pipeP(
      // Fetch feed and parse
      () => chatRepository.findByChatId(chatId),
      ({ upworkUrl }) => fetch(upworkUrl),
      x => x.text(),
      x => parser.parse(x),
      path('rss.channel.item'),
      R.map(R.evolve({ pubDate: x => new Date(x).getTime() })),

      // Filter feed, leave only new
      x => Promise.all([chatRepository.findByChatId(chatId), x]),
      ([{ lastPubDate }, x]) =>
        R.filter(({ pubDate }) => lastPubDate < pubDate, x),

      // Update lastPubDate
      R.tap(
        R.pipe(
          R.head,
          R.prop('pubDate'),
          lastPubDate =>
            lastPubDate &&
            chatRepository.updateByChatId(chatId, { lastPubDate }),
        ),
      ),

      // Send posts to chat
      R.map(
        R.pipe(
          ({ title, description }) => `<b>${title}</b>\n${description}`,
          R.replace(/<br \/>/g, '\n'),
        ),
      ),
      R.map(telegramBot.sendMessageToChat(chatId)),
    )(),
)
