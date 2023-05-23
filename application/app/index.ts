/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:04:19
 * @LastEditors: luckymiaow
 */
import cloud from 'wx-server-sdk'
import { useRouter, whitelist } from '@/application/app/router'

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV as any })
/*
 *主入口
 */
export function main(event, context) {
  const app = useRouter(event, context)

  app.use(async ({ _req }, next) => {
    if (_req.event.$url in whitelist) {
      await next()
      return
    }
    await next()
  })

  return app.serve()
}
