/*
 * @Description: 
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:28:26
 * @LastEditors: luckymiaow
 */
// 400 错误 - 请求参数错误
export class BadRequestError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
  }
}

export function throwBadRequestError(message: string): never {
  throw new BadRequestError(message);
}

// 401 错误 - 未授权
export class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

export function throwUnauthorizedError(message: string): never {
  throw new UnauthorizedError(message);
}

// 403 错误 - 禁止访问
export class ForbiddenError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403;
  }
}

export function throwForbiddenError(message: string): never {
  throw new ForbiddenError(message);
}

// 404 错误 - 资源未找到
export class NotFoundError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

export function throwNotFoundError(message: string): never {
  throw new NotFoundError(message);
}

// 500 错误 - 服务器内部错误
export class InternalServerError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "InternalServerError";
    this.statusCode = 500;
  }
}

export function throwInternalServerError(message: string): never {
  throw new InternalServerError(message);
}
