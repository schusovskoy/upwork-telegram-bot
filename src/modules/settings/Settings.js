import mongoose from 'mongoose'

const settingsSchema = mongoose.Schema({
  lastUpdateId: Number,
  developmentUrl: String,
  designUrl: String,
  developmentLastPubDate: Number,
  designLastPubDate: Number,
})

export default mongoose.model('Settings', settingsSchema)
