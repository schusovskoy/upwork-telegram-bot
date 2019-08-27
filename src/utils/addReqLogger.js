import morgan from 'morgan'
import chalk from 'chalk'
import { stripIndent } from 'common-tags'

morgan.token('body', req => JSON.stringify(req.body, null, 2))
morgan.token('requestHeaders', req => JSON.stringify(req.headers, null, 2))

const addReqLogger = app =>
  app.use(
    morgan(
      (tokens, req, res) =>
        '\n\n' +
        stripIndent`
        ${chalk.green(tokens.method(req, res))} ${tokens.url(
          req,
          res,
        )} ${tokens.status(req, res)}

        ${chalk.blue('request headers:')}
        ${tokens.requestHeaders(req, res).replace(/\n/g, '\n        ')}

        ${chalk.blue('request body:')}
        ${tokens.body(req, res).replace(/\n/g, '\n        ')}
        ` +
        '\n',
    ),
  )

export default addReqLogger
