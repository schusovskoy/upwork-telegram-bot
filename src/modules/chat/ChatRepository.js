import Chat, { CHAT_TYPE, CHAT_STATE } from './Chat'
import { pipeP } from '../../utils'

export { CHAT_TYPE, CHAT_STATE } from './Chat'

export const add = chatId =>
  pipeP(
    () =>
      Promise.resolve(
        new Chat({ chatId, type: CHAT_TYPE.NONE, state: CHAT_STATE.IDLE }),
      ),
    x => x.save(),
    x => x,
  )()

export const remove = chatId =>
  pipeP(
    () => Chat.deleteOne({ chatId }),
    x => x,
  )()

export const find = filter =>
  pipeP(
    () => Chat.find(filter),
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
