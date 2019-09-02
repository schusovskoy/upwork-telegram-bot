import mongoose from 'mongoose'

const settingsSchema = mongoose.Schema({
  lastUpdateId: Number,
  developmentUrl: String,
  designUrl: String,
  lastPubDate: Number,
})

export default mongoose.model('Settings', settingsSchema)
