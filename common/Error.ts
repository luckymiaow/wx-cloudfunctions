/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:28:26
 * @LastEditors: luckymiaow
 */
/**
 * @description: 400 错误 - 请求参数错误
 * @return {*}
 * @author: luckymiaow
 */
export class BadRequestError extends Error {
  statusCode: number

  constructor(message?: string) {
    super(message || 'BadRequestError')
    this.name = 'BadRequestError'
    this.statusCode = 400
  }
}
/**
 * @description: 400 错误 - 请求参数错误
 * @return {*}
 * @author: luckymiaow
 */
export function throwBadRequestError(message?: string): never {
  throw new BadRequestError(message)
}

/**
 * @description: 401 错误 - 未授权
 * @return {*}
 * @author: luckymiaow
 */
export class UnauthorizedError extends Error {
  statusCode: number

  constructor(message?: string) {
    super(message || 'UnauthorizedError')
    this.name = 'UnauthorizedError'
    this.statusCode = 401
  }
}
/**
 * @description: 401 错误 - 未授权
 * @return {*}
 * @author: luckymiaow
 */
export function throwUnauthorizedError(message?: string): never {
  throw new UnauthorizedError(message)
}

/**
 * @description: 403 错误 - 禁止访问
 * @return {*}
 * @author: luckymiaow
 */
export class ForbiddenError extends Error {
  statusCode: number

  constructor(message?: string) {
    super(message || 'ForbiddenError')
    this.name = 'ForbiddenError'
    this.statusCode = 403
  }
}

export function throwForbiddenError(message?: string): never {
  throw new ForbiddenError(message)
}

/**
 * @description: 404 错误 - 资源未找到
 * @return {*}
 * @author: luckymiaow
 */
export class NotFoundError extends Error {
  statusCode: number

  constructor(message?: string) {
    super(message || 'NotFoundError')
    this.name = 'NotFoundError'
    this.statusCode = 404
  }
}

/**
 * @description: 404 错误 - 资源未找到
 * @return {*}
 * @author: luckymiaow
 */
export function throwNotFoundError(message?: string): never {
  throw new NotFoundError(message)
}

/**
 * @description: 500 错误 - 服务器内部错误
 * @return {*}
 * @author: luckymiaow
 */
export class InternalServerError extends Error {
  statusCode: number

  constructor(message?: string) {
    super(message || 'InternalServerError')
    this.name = 'InternalServerError'
    this.statusCode = 500
  }
}
/**
 * @description: 500 错误 - 服务器内部错误
 * @return {*}
 * @author: luckymiaow
 */
export function throwInternalServerError(message?: string): never {
  throw new InternalServerError(message)
}
