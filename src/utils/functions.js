import * as R from 'ramda'
import Joi from '@hapi/joi'

export const mapIndexed = R.addIndex(R.map)
export const filterIndexed = R.addIndex(R.filter)
export const reduceIndexed = R.addIndex(R.reduce)

export const prodOrNot = R.curry((ifProd, ifNot) =>
  R.ifElse(
    () => process.env.NODE_ENV === 'production',
    typeof ifProd === 'function' ? ifProd : () => ifProd,
    typeof ifNot === 'function' ? ifNot : () => ifNot,
  )(),
)

export const arraySum = R.reduce((acc, x) => acc + x, 0)

export const getRandomNumber = max => Math.floor(Math.random() * (max + 1))

export const createUniqNumGenerator = () => {
  const cache = []

  const generate = max => {
    const num = getRandomNumber(max)
    if (!R.contains(num, cache)) {
      cache.push(num)
      return num
    }
    return generate(max)
  }

  return generate
}

export const randomSort = list =>
  list.length <= 1
    ? list
    : R.pipe(
        () => list,
        R.sort(() => (Math.random() >= 0.5 ? 1 : -1)),
        R.when(R.equals(list), randomSort),
      )()

export const getFileExtension = R.replace(/^.*?(\.\w+)$/, '$1')

export const validate = (obj, schema) =>
  Joi.validate(obj, schema, { abortEarly: false }).catch(x => x)

export const convertToBoolean = joi => ({
  name: 'toBoolean',
  base: joi.boolean(),
  coerce: (value, state, options) => !!value,
})

export const convertToSort = joi => ({
  name: 'toSort',
  base: joi.string(),
  coerce: (value, state, options) => (value === 'true' ? 'asc' : 'desc'),
})

const pipeWithThen = R.pipeWith(R.then)
export const pipeP = (...args) => pipeWithThen(args)

export const wait = sec => new Promise(res => setTimeout(res, sec * 1000))

export const pathEq = R.curry((path, val, obj) =>
  R.pipe(
    () => path,
    pathStrToArr,
    R.pathEq(R.__, val, obj),
  )(),
)

export const path = R.curry((path, obj) =>
  R.pipe(
    () => path,
    pathStrToArr,
    R.path(R.__, obj),
  )(),
)

export const pathSatisfies = R.curry((pred, path, obj) =>
  R.pipe(
    () => path,
    pathStrToArr,
    R.pathSatisfies(pred, R.__, obj),
  )(),
)

export const pathOr = R.curry((defaultValue, path, obj) =>
  R.pipe(
    () => path,
    pathStrToArr,
    R.pathOr(defaultValue, R.__, obj),
  )(),
)

export const hasPath = R.curry((path, obj) =>
  R.pipe(
    () => path,
    pathStrToArr,
    R.hasPath(R.__, obj),
  )(),
)

const pathStrToArr = path =>
  R.pipe(
    () => path,
    R.match(/[^[\].]+/g),
    R.map(x => parseInt(x) || x),
  )()

export const cond = (...fns) =>
  R.compose(
    R.cond,
    R.splitEvery(2),
  )(fns)

export const tapP = fn => x =>
  pipeP(
    () => Promise.resolve(fn(x)),
    () => x,
  )()
