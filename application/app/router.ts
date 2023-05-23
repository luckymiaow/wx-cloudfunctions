/*
 * @Description: 自动获取modules中的文件生成
 * @Author: luckymiaow
 * @Date: 2023-05-17 20:05:27
 * @LastEditors: luckymiaow
 */
import TcbRouter from 'tcb-router';
import Test from './modules/Test';
import User from './modules/User';

import * as Errors from '@/common/Error';

export const routerList = {
  'Test/find': { handler: 'find', model: Test },
  'Test/save': { handler: 'save', model: Test },
  'Test/update': { handler: 'update', model: Test },
  'User/findById': { handler: 'findById', model: User },
  'User/find': { handler: 'find', model: User },
  'User/save': { handler: 'save', model: User },
};

export const whitelist = {};

export function useRouter(event: any) {
  const app = new TcbRouter({ event });

  /* 异常处理拦截器 */
  app.use(
    async (
      ctx: {
        _req: { event: { $url: string } };
        body: { code: number; message: any; success: boolean };
      },
      next: () => any
    ) => {
      try {
        if (!(ctx._req.event.$url in routerList)) throw new Errors.NotFoundError();
        await next();
      } catch (err: any) {
        let res = {
          code: 500,
          message: err.message,
          success: false,
        };
        for (const key in Errors) {
          if (err instanceof (Errors as any)[key]) {
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
    }
  );

  (Object.keys(routerList) as Array<keyof typeof routerList>).forEach(key => {
    const { handler, model: Model } = routerList[key];
    app.router(key, async (ctx: any, next: any) => {
      const fn = async function (...args: unknown[]) {
        const instance: any = new Model({ ctx, next });
        instance.ctx = ctx;
        instance.next = next;
        const res = await instance[handler].bind(instance)(...args);
        ctx.body = {
          code: 200,
          data: res,
          success: true,
        };
      };

      if (ctx._req.event.params) await fn(...Object.values(ctx._req.event.params), ctx._req.event.data);
      else await fn(ctx._req.event.data);
    });
  });

  return app;
}
