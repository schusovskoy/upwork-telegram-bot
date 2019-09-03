import { Model } from 'objection'

class Post extends Model {
  static tableName = Post.name
}

export default Post
