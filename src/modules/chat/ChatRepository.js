import Chat from './Chat'
import { pipeP } from '../../utils'

export const add = chatId =>
  pipeP(
    () => Promise.resolve(new Chat({ chatId })),
    x => x.save(),
    x => x,
  )()

export const remove = chatId =>
  pipeP(
    () => Chat.deleteOne({ chatId }),
    x => x,
  )()

export const getAll = () =>
  pipeP(
    () => Chat.find(),
    x => x,
  )()

export const findByChatId = chatId =>
  pipeP(
    () => Chat.findOne({ chatId }),
    x => x,
  )()

export const updateByChatId = (chatId, obj) =>
  pipeP(
    () => Chat.updateOne({ chatId }, obj),
    x => x,
  )()
