import express from 'express'
import bodyParser from 'body-parser'
import * as controllers from './config/controllers'
import * as R from 'ramda'
import { prodOrDev, wait, ENV, addReqLogger } from './utils'
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
prodOrDev(undefined, () => addReqLogger(app))

R.pipe(
  () => controllers,
  R.values,
  R.chain(R.values),
  R.forEach(x => x(app)),
)()

const poll = () =>
  TelegramBot.getUpdates()
    .catch(
      // eslint-disable-next-line no-console
      x => console.log('Polling Error: ', x) || wait(POLLING_ERROR_TIMEOUT),
    )
    .then(poll)
poll()

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server is listening on port 3000')
})
