import { Post } from '../modules/post'

export const up = knex =>
  Promise.all([
    knex.schema.createTable(Post.tableName, table => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.integer('pubDate').unsigned()
    }),
  ])

export const down = knex => Promise.all([knex.schema.dropTable(Post.tableName)])
