const R = require('ramda')
const path = require('path')
const dotenv = require('dotenv')

const defaultEnv = dotenv.config()

const current = dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}`,
  ),
})

const local = dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
})

const currentLocal = dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}.local`,
  ),
})

const ENV = R.mergeAll(
  [defaultEnv, current, local, currentLocal].map(x =>
    x.error ? {} : x.parsed,
  ),
)

module.exports = ENV
