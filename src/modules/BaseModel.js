import { Model } from 'objection'

class BaseModel extends Model {
  static get tableName() {
    return this.name
  }
}

export default BaseModel
