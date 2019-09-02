import Settings from './Settings'
import { pipeP } from '../../utils'
import {
  DEFAULT_DESIGN_URL,
  DEFAULT_DEVELOPMENT_URL,
} from '../../config/constants'

export const get = () =>
  pipeP(
    () => Settings.findOne(),
    x =>
      x ||
      Settings.create({
        lastUpdateId: 0,
        developmentUrl: DEFAULT_DEVELOPMENT_URL,
        designUrl: DEFAULT_DESIGN_URL,
        developmentLastPubDate: new Date().getTime(),
        designLastPubDate: new Date().getTime(),
      }),
    x => x,
  )()

export const update = settings =>
  pipeP(
    get,
    ({ _id }) => Settings.findByIdAndUpdate(_id, settings),
    x => x,
  )()
