import { oneLine } from 'common-tags'

const createQueryBuilderFunc = name => (...args) => qb => qb[name](...args)

const createInnerBuilderFunc = name => (table, fn) => qb =>
  qb[name](table, function() {
    fn(this)
  })

const aggregateIf = func => (ifClause, thenClause, elseClause) =>
  oneLine`
    ${func}(
      case
        when ${ifClause} then
          ${thenClause || 1}
        else
          ${elseClause || 0}
      end
    )
  `

export const select = createQueryBuilderFunc('select')
export const insert = createQueryBuilderFunc('insert')
export const insertAndFetch = createQueryBuilderFunc('insertAndFetch')
export const leftJoinRelation = createQueryBuilderFunc('leftJoinRelation')
export const innerJoinRelation = createQueryBuilderFunc('innerJoinRelation')
export const eager = createQueryBuilderFunc('eager')
export const modifyEager = createQueryBuilderFunc('modifyEager')
export const where = createQueryBuilderFunc('where')
export const having = createQueryBuilderFunc('having')
export const whereNull = createQueryBuilderFunc('whereNull')
export const whereIn = createQueryBuilderFunc('whereIn')
export const whereNotIn = createQueryBuilderFunc('whereNotIn')
export const orderBy = createQueryBuilderFunc('orderBy')
export const limit = createQueryBuilderFunc('limit')
export const offset = createQueryBuilderFunc('offset')
export const distinct = createQueryBuilderFunc('distinct')
export const alias = createQueryBuilderFunc('alias')
export const findOne = createQueryBuilderFunc('findOne')
export const insertGraph = createQueryBuilderFunc('insertGraph')
export const upsertGraph = createQueryBuilderFunc('upsertGraph')
export const insertGraphAndFetch = createQueryBuilderFunc('insertGraphAndFetch')
export const upsertGraphAndFetch = createQueryBuilderFunc('upsertGraphAndFetch')
export const andWhere = createQueryBuilderFunc('andWhere')
export const first = createQueryBuilderFunc('first')
export const deleteById = createQueryBuilderFunc('deleteById')
export const del = createQueryBuilderFunc('del')
export const query = createQueryBuilderFunc('query')
export const count = createQueryBuilderFunc('count')
export const countDistinct = createQueryBuilderFunc('countDistinct')
export const groupBy = createQueryBuilderFunc('groupBy')
export const leftJoin = createQueryBuilderFunc('leftJoin')
export const innerJoin = createQueryBuilderFunc('innerJoin')
export const max = createQueryBuilderFunc('max')
export const as = createQueryBuilderFunc('as')
export const patch = createQueryBuilderFunc('patch')
export const joinEager = createQueryBuilderFunc('joinEager')
export const mergeJoinEager = createQueryBuilderFunc('mergeJoinEager')
export const orWhere = createQueryBuilderFunc('orWhere')
export const eagerAlgorithm = createQueryBuilderFunc('eagerAlgorithm')
export const column = createQueryBuilderFunc('column')
export const on = createQueryBuilderFunc('on')
export const andOn = createQueryBuilderFunc('andOn')
export const update = createQueryBuilderFunc('update')
export const from = createQueryBuilderFunc('from')
export const union = createQueryBuilderFunc('union')
export const whereNot = createQueryBuilderFunc('whereNot')
export const whereNotNull = createQueryBuilderFunc('whereNotNull')

export const whereBuilder = createInnerBuilderFunc('where')
export const fromBuilder = createInnerBuilderFunc('from')

export const sumIf = aggregateIf('sum')
export const maxIf = aggregateIf('max')
