import Joi from '@hapi/joi'
import * as R from 'ramda'
import { mapIndexed } from '../utils'

const withArg = argName => ({
  name = argName,
  schema,
  validate,
} = {}) => func => ctx => {
  const { error: joiError } = schema
    ? Joi.validate(ctx.req[argName], schema, { abortEarly: false })
    : {}
  const error = validate && validate(ctx.req[argName])

  if (joiError || error) {
    return { status: 400, data: { ...error, ...formatJoiError(joiError) } }
  }

  const value = schema
    ? Joi.attempt(ctx.req[argName], schema)
    : ctx.req[argName]
  return func({ ...ctx, [name]: value })
}

export const withBody = withArg('body')
export const withParams = withArg('params')
export const withQuery = withArg('query')
export const withFile = withArg('file')
export const withFiles = withArg('files')

export const paramsToContext = (...config) => fn => (...args) =>
  R.pipe(
    () => config,
    mapIndexed((x, i) => ({ [x]: args[i] })),
    R.mergeAll,
    fn,
  )()

//TODO: Test code below
export const formatJoiError = R.pipe(
  R.propOr([], 'details'),
  R.reduce(
    (acc = {}, { path, type }) => R.assoc(R.join('.', path), type, acc),
    undefined,
  ),
)
