import { Base } from './Base/Base'

export class User extends Base {
  /**
   *用户名
   * @type {string}
   * @memberof IUser
   */
  name: string

  password?: string
}
