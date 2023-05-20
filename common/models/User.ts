/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:56:09
 * @LastEditors: luckymiaow
 */
export class User {
  /**
   *openid
   * @type {string}
   * @memberof IUser
   */
  _id: string;

  /**
   *用户名
   * @type {string}
   * @memberof IUser
   */
  name: string;

  password?: string;
}
