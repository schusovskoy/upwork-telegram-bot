import express from 'express'
import bodyParser from 'body-parser'
import * as controllers from './config/controllers'
import * as R from 'ramda'
import { prodOrNot, wait, ENV, addReqLogger, Logger } from './utils'
import mongoose from 'mongoose'
import { TelegramBot } from './services'
import { POLLING_ERROR_TIMEOUT } from './config/constants'

mongoose.connect(ENV.MONGO_URL, {
  useNewUrlParser: true,
  user: ENV.MONGO_USER,
  pass: ENV.MONGO_PASS,
  dbName: ENV.MONGO_DB,
})

const app = express()
app.use(bodyParser.json({}))
prodOrNot(undefined, () => addReqLogger(app))

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
        Logger.error('Telegram polling Error: ', x) ||
        wait(POLLING_ERROR_TIMEOUT),
    )
    .then(pollTelegram)
pollTelegram()

app.listen(3000, () => Logger.info('Server is listening on port 3000'))
