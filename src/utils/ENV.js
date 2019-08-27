import * as R from 'ramda'
import path from 'path'
import dotenv from 'dotenv'

const defaultEnv = dotenv.config()

const current = dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}`,
  ),
})

const currentLocal = dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}.local`,
  ),
})

const local = dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
})

const ENV = R.mergeAll(
  [defaultEnv, current, local, currentLocal].map(x =>
    x.error ? {} : x.parsed,
  ),
)

export default ENV
