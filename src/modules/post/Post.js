import BaseModel from '../BaseModel'

class Post extends BaseModel {
  static tableName = Post.name.toLowerCase()
}

export default Post
