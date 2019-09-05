import Post from './Post'
import * as R from 'ramda'
import { K } from '../../utils'

export const create = (...posts) =>
  R.pipe(
    () => Post,
    K.query(),
    K.insertAndFetch(posts),
  )()

export const upsert = post =>
  R.pipe(
    () => Post,
    K.query(),
    K.upsertGraphAndFetch(post),
  )()
