import { Post } from '../modules/post'

export const up = knex =>
  knex.schema.createTable(Post.tableName, table => {
    table.increments('id').primary()
    table.string('title').notNullable()
    table.text('description').notNullable()
    table.bigInteger('pubDate').notNullable()
    table.text('apply')
    table.bigInteger('applyTime')
  })

export const down = knex => knex.schema.dropTable(Post.tableName)
