/*
 * @Description: 自动获取modules中的文件生成
 * @Author: luckymiaow
 * @Date: 2023-05-17 20:05:27
 * @LastEditors: luckymiaow
 */

import User from "./modules/User";
import TcbRouter from "tcb-router";
import * as Errors from "@/common/Error";

export const routerList = {
  "user/find": { handler: "find", model: User },
  "user/save": { handler: "save", model: User },
  "user/findById": { handler: "findById", model: User },
};

export const whitelist = {};

export const useRouter = (event, context) => {
  const app = new TcbRouter({ event });

  /* 异常处理拦截器 */
  app.use(async (ctx, next) => {
    try {
      if (!(ctx._req.event.$url in routerList))
        throw new Errors.NotFoundError();
      await next();
    } catch (err) {
      let res = {
        code: 500,
        message: err.message,
        success: false,
      };
      for (const key in Errors) {
        if (err instanceof Errors[key]) {
          res = {
            code: err.statusCode,
            message: err.message,
            success: false,
          };
          break;
        }
      }
      ctx.body = res;
    }
  });

  Object.keys(routerList).forEach((key) => {
    const { handler, model } = routerList[key];
    app.router(key, async (ctx, next) => {
      const fn = async function (...args) {
        const instance = new model({ ctx: ctx, next: next });
        instance.ctx = ctx;
        instance.next = next;
        const res = await instance[handler].bind(instance)(...args);
        ctx.body = {
          code: 200,
          data: res,
          success: true,
        };
      };

      if (ctx._req.event.params) {
        await fn(...Object.values(ctx._req.event.params), ctx._req.event.data);
      } else {
        await fn(ctx._req.event.data);
      }
    });
  });

  return app;
};
