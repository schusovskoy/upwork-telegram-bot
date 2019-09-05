import BaseModel from '../BaseModel'

class Post extends BaseModel {
  static tableName = Post.name.toLowerCase()

  $beforeUpdate() {
    if (this.apply) {
      this.applyTime = new Date().getTime()
    }
  }
}

export default Post
