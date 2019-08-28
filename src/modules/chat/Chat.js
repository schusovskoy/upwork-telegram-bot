import mongoose from 'mongoose'

const chatSchema = mongoose.Schema({
  chatId: { type: Number, unique: true },
  upworkUrl: String,
  lastPubDate: Number,
})

export default mongoose.model('Chat', chatSchema)
