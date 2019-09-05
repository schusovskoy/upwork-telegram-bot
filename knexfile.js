const ENV = require('./src/utils/ENV')

const knexConfig = {
  client: 'pg',
  connection: ENV.SQL_DB_URL,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: `${__dirname}/${
      process.env.NODE_ENV === 'production' ? 'build' : 'src'
    }/migrations`,
  },
  seeds: {
    directory: `./${
      process.env.NODE_ENV === 'production' ? 'build' : 'src'
    }/seeds`,
  },
}

module.exports = knexConfig
