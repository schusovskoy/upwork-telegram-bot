import Chat from './Chat'
import * as R from 'ramda'
import { DEFAULT_UPWORK_URL } from '../../config/constants'

export const add = chatIds =>
  R.pipe(
    () => chatIds,
    R.uniq,
    R.map(chatId => ({
      chatId,
      upworkUrl: DEFAULT_UPWORK_URL,
      lastPubDate: 0,
    })),
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

export const findByChatId = chatId => Chat.findOne({ chatId })

export const updateByChatId = (chatId, obj) => Chat.updateOne({ chatId }, obj)
