import * as R from 'ramda'

const METHODS = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
}

const handle = method => url => middlewares => router => {
  const adjustMiddleware = func => (req, res, next) => {
    const catchableFunc = ctx => {
      try {
        return Promise.resolve(func(ctx))
      } catch (e) {
        return Promise.reject(e)
      }
    }

    catchableFunc({ req, res, next })
      .then(data =>
        data && data.status
          ? res.status(data.status).send(data)
          : res.send({ status: res.statusCode, data }),
      )
      .catch(
        err => (
          //eslint-disable-next-line
          console.error('Request handling error: ', err),
          err.status
            ? res.status(err.status).send(err)
            : res.status(500).send({ status: 500, data: 'Server Error' })
        ),
      )
  }

  const adjustedMiddlewares = Array.isArray(middlewares)
    ? R.adjust(adjustMiddleware, R.length(middlewares) - 1, middlewares)
    : [adjustMiddleware(middlewares)]

  router[method](url, ...adjustedMiddlewares)
}

export const get = handle(METHODS.GET)
export const post = handle(METHODS.POST)
export const put = handle(METHODS.PUT)
export const del = handle(METHODS.DELETE)

export const addMiddleware = middleware => middlewares =>
  Array.isArray(middlewares)
    ? [middleware, ...middlewares]
    : [middleware, middlewares]

export const status = code => func => ctx => {
  ctx.res.status(code)
  return func(ctx)
}
