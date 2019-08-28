import Settings from './Settings'
import { pipeP } from '../../utils'

export const get = () =>
  pipeP(
    () => Settings.findOne(),
    x => x || Settings.create({ lastUpdateId: 0 }),
    x => x,
  )()

export const update = settings =>
  pipeP(
    get,
    ({ _id }) => Settings.findByIdAndUpdate(_id, settings),
    x => x,
  )()
