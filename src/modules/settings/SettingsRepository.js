import Settings from './Settings'
import { pipeP } from '../../utils'
import { DEFAULT_UPWORK_URL } from '../../config/constants'

export const get = () =>
  pipeP(
    () => Settings.findOne(),
    x =>
      x || Settings.create({ lastUpdateId: 0, upworkUrl: DEFAULT_UPWORK_URL }),
    x => x,
  )()

export const update = settings =>
  pipeP(
    get,
    ({ _id }) => Settings.findByIdAndUpdate(_id, settings),
    x => x,
  )()
