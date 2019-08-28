import Chat from './Chat'
import * as R from 'ramda'

export const add = chatIds =>
  R.pipe(
    () => chatIds,
    R.uniq,
    R.map(chatId => ({ chatId })),
    x =>
      Chat.insertMany(x, { ordered: false })
        .catch(() => {})
        .then(() => {}),
  )()

export const remove = chatIds =>
  R.pipe(
    () => chatIds,
    R.uniq,
    $in => Chat.deleteMany({ chatId: { $in } }).then(() => {}),
  )()

export const getAll = () => Chat.find()
