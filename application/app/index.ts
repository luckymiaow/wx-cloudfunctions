/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:04:19
 * @LastEditors: luckymiaow
 */
import cloud from "wx-server-sdk";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { useRouter, whitelist, routerList } from "@/application/app/router";
import config from "./config.json";

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV as any });
/*
 *主入口
 */
export const main = (event, context) => {
  const app = useRouter(event, context);

  app.use(async ({ _req }, next) => {
    if (_req.event.$url in whitelist) {
      await next();
      return;
    }
    await next();
  });

  return app.serve();
};
