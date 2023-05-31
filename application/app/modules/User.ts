/*
 * @Description: ^_^
 * @Author: sharebravery
 * @Date: 2023-05-22 17:23:19
 */
import { DB } from '@/common/DB';
import { User } from '@/common/models/User';
import { Task } from '@/common/models/Task';
import { throwBadRequestError } from '@/common/index';

/**
 * 用户
 */
export default class UserController {
  private user: DB<typeof User>;
  private task: DB<typeof Task>;

  constructor(req: RouterRequest) {
    this.user = new DB(req.ctx, User);
    this.task = new DB(req.ctx, Task);
  }

  /**
   * 根据id查询
   * @param this
   * @param id
   * @whiteBook true
   */
  findById(this: RequestCtx<typeof UserController>, id: string) {
    throw new Error('Method not implemented.');
  }

  /**
   * 根据条件查询
   * @param this
   * @returns number[]
   */
  find(this: RequestCtx<typeof UserController>): number[] {
    return [1, 2, 3];
    // return this.user.find();
  }

  /**
   * 保存接口
   * @param data
   * @returns
   */
  save(data: User) {
    throwBadRequestError('参数错误');
    return this.user.save(data);
  }
}
