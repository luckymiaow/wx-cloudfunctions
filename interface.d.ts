type RequestCtx<T extends new (...args: any[]) => any> = RouterRequest &
  InstanceType<T>;

type RouterRequest = {
  ctx: Ctx;
  next: any;
};

interface Ctx {
  _req: {
    event: {
      $url: string;
      token?: string;
      userInfo: {
        name: string;
        id: string;
      };
      params?: Record<string, any>;
      data?: Record<string, any>;
    };
  };
  [x: string]: any;
}
