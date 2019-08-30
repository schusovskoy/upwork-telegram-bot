import mongoose from 'mongoose'

const settingsSchema = mongoose.Schema({
  lastUpdateId: Number,
  upworkUrl: String,
})

export default mongoose.model('Settings', settingsSchema)
