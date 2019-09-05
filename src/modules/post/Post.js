import BaseModel from '../BaseModel'

class Post extends BaseModel {
  $beforeUpdate() {
    if (this.apply) {
      this.applyTime = new Date().getTime()
    }
  }
}

export default Post
