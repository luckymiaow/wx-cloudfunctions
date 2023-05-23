/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-21 22:17:26
 * @LastEditors: luckymiaow
 */
import { Base } from './Base/Base'

export class Task extends Base {
  /**
   *用户名
   * @type {string}
   * @memberof IUser
   */
  name: string

  password?: string
}
