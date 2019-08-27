import Settings from './Settings'
import { pipeP } from '../../utils'

export const get = () =>
  pipeP(
    () => Settings.findOne(),
    x => x || Settings.create({ lastUpdateId: 0, lastPubDate: 0 }),
  )()

export const update = settings =>
  pipeP(
    get,
    ({ _id }) => Settings.findByIdAndUpdate(_id, settings),
  )()
