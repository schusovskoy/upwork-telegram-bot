import mongoose from 'mongoose'

const chatSchema = mongoose.Schema({
  chatId: { type: Number, unique: true },
})

export default mongoose.model('Chat', chatSchema)
