import mongoose from 'mongoose'

const settingsSchema = mongoose.Schema({
  lastUpdateId: Number,
  lastPubDate: Number,
})

export default mongoose.model('Settings', settingsSchema)
