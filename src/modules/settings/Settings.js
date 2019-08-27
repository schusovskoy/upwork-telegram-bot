import mongoose from 'mongoose'

const settingsSchema = mongoose.Schema({
  lastUpdateId: Number,
})

export default mongoose.model('Settings', settingsSchema)
