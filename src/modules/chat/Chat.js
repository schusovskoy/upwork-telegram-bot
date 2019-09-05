import mongoose from 'mongoose'
import * as R from 'ramda'

export const CHAT_TYPE = {
  NONE: 'NONE',
  DEVELOPMENT: 'DEVELOPMENT',
  DESIGN: 'DESIGN',
}

export const CHAT_STATE = {
  IDLE: 'IDLE',
  WAITING_FOR_APPLY: 'WAITING_FOR_APPLY',
}

const chatSchema = mongoose.Schema({
  chatId: { type: Number, unique: true },
  type: { type: String, enum: R.values(CHAT_TYPE) },
  state: { type: String, enum: R.values(CHAT_STATE) },
  postId: Number,
  messageId: Number,
})

export default mongoose.model('Chat', chatSchema)
