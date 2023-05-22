import { DB } from '@/common/DB'
import { User } from '@/common/models/User'
import { Task } from '@/common/models/Task'
import { throwBadRequestError } from '@/common/index'

export default class UserController {
  private user: DB<typeof User>
  private task: DB<typeof Task>

  constructor(req: RouterRequest) {
    this.user = new DB(req.ctx, User)
    this.task = new DB(req.ctx, Task)
  }

  findById(this: RequestCtx<typeof UserController>, id: string) {
    throw new Error('Method not implemented.')
  }

  find(this: RequestCtx<typeof UserController>) {
    return [1, 2, 3]
    // return this.user.find();
  }

  save(data: User) {
    throwBadRequestError('参数错误')
    return this.user.save(data)
  }
}
