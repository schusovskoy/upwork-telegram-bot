import parser from 'fast-xml-parser'
import { pipeP, path, Logger } from '../utils'
import fetch from 'node-fetch'
import * as R from 'ramda'
import { SettingsRepository } from '../modules/settings'
import { inject } from '../aspects'
import * as TelegramBot from './TelegramBot'

const UPWORK_URL =
  'https://www.upwork.com/ab/feed/jobs/rss?budget=5000-&verified_payment_only=1&q=react&subcategory2=desktop_software_development%2Cecommerce_development%2Cmobile_development%2Cweb_development%2Cother_software_development&sort=recency&paging=0%3B10&api_params=1&securityToken=d31af4cf0ca7fb45c6d73b6bf8bc224f69ef9c115778922bc2278ff4410c60eb1829a64da374ceb01e820b831a06805752a0a99876ffbf896c7f3d1c1c65808e&userUid=780053258792939520&orgUid=920310540010647552'

export const updateFeed = R.compose(
  inject({ name: 'settingsRepository', singleton: SettingsRepository }),
  inject({ name: 'telegramBot', singleton: TelegramBot }),
)(
  //
  ({ settingsRepository, telegramBot }) =>
    pipeP(
      // Fetch feed and parse
      () => fetch(UPWORK_URL),
      x => x.text(),
      x => parser.parse(x),
      path('rss.channel.item'),
      R.map(R.evolve({ pubDate: x => new Date(x).getTime() })),
      x => Logger.log('Items', x) || x,

      // Filter feed, leave only new
      x => Promise.all([settingsRepository.get(), x]),
      x => Logger.log('Settings', x) || x,
      ([{ lastPubDate }, x]) =>
        R.filter(({ pubDate }) => lastPubDate < pubDate, x),
      x => Logger.log('Filtered', x) || x,

      // Update lastPubDate
      R.tap(
        R.pipe(
          R.head,
          R.prop('pubDate'),
          lastPubDate =>
            lastPubDate && settingsRepository.update({ lastPubDate }),
        ),
      ),

      // Split on groups and send to chats
      R.splitEvery(3),
      R.map(
        R.pipe(
          R.map(({ title, description }) => `<b>${title}</b>\n${description}`),
          R.join('\n\n===========================================\n\n'),
          R.replace(/<br \/>/g, '\n'),
          text => text && telegramBot.sendMessage(text),
        ),
      ),
      x => Promise.all(x),
    )(),
)
