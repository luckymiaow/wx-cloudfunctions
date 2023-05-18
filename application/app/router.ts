/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 20:05:27
 * @LastEditors: luckymiaow
 */

import User from "./modules/User";
/* 自动获取modules中的文件生成 */
export default (app) => {

  const whitelist = [];

  app.router("user/find", User.find);


  return {whitelist}
};
