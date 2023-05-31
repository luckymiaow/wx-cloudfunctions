import type { AuditMetadata } from './AuditMetadata'

/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-21 10:13:57
 * @LastEditors: luckymiaow
 */
export class Base {
  _id!: string;

  auditMetadata!: AuditMetadata;
}
