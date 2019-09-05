import { Model, snakeCaseMappers } from 'objection'

class BaseModel extends Model {
  static get columnNameMappers() {
    return snakeCaseMappers()
  }
}

export default BaseModel
