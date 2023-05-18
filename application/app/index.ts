/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:04:19
 * @LastEditors: luckymiaow
 */
import cloud from "wx-server-sdk";
import TcbRouter from "tcb-router";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import router from "./router";

/*
 *主入口
 */
export const main = (event, context) => {
  const app = new TcbRouter({ event });
  const { whitelist } = router(app);

  app.use(async (ctx, next) => {
    if (whitelist.includes(ctx.event.$url)) {
      await next();
      return;
    }
  });
};
