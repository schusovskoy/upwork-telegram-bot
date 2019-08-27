import express from 'express'
import bodyParser from 'body-parser'
import * as controllers from './config/controllers'
import * as R from 'ramda'
import { prodOrDev, wait, ENV, addReqLogger } from './utils'
import mongoose from 'mongoose'
import { TelegramBot, Upwork } from './services'
import {
  POLLING_ERROR_TIMEOUT,
  UPWORK_POLLING_TIMEOUT,
} from './config/constants'

mongoose.connect(ENV.MONGO_URL, {
  useNewUrlParser: true,
  user: ENV.MONGO_USER,
  pass: ENV.MONGO_PASS,
  dbName: ENV.MONGO_DB,
})

const app = express()
app.use(bodyParser.json({}))
prodOrDev(undefined, () => addReqLogger(app))

R.pipe(
  () => controllers,
  R.values,
  R.chain(R.values),
  R.forEach(x => x(app)),
)()

const pollTelegram = () =>
  TelegramBot.getUpdates()
    .catch(
      x =>
        // eslint-disable-next-line no-console
        console.log('Telegram polling Error: ', x) ||
        wait(POLLING_ERROR_TIMEOUT),
    )
    .then(pollTelegram)
pollTelegram()

const pollUpwork = () =>
  Upwork.updateFeed()
    .catch(
      // eslint-disable-next-line no-console
      x => console.log('Upwork polling Error: ', x),
    )
    .then(() => wait(UPWORK_POLLING_TIMEOUT))
    .then(pollUpwork)
pollUpwork()

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server is listening on port 3000')
})
