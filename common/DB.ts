/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:48:31
 * @LastEditors: Please set LastEditors
 */
import cloud from 'wx-server-sdk';
import type { Base } from './models/Base/Base';
import { BadRequestError } from './Error';

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV as any });

const db = cloud.database();

type ModelType<T> = new (...args: any[]) => Base;

type CollectionReference = cloud.DB.CollectionReference

export class DB implements cloud.DB.Database {
  public identifiers!: cloud.IRuntimeIdentifiers;
  public config!: cloud.DB.IDatabaseConfig;
  public command!: cloud.DB.DatabaseCommand;
  public Geo!: cloud.DB.IGeo;
  public serverDate!: () => cloud.DB.ServerDate;
  public RegExp!: cloud.DB.IRegExpConstructor;
  public debug?: boolean | undefined;

  ctx: Ctx;

  collection(collectionName: string): cloud.DB.CollectionReference {
    throw new Error('Method not implemented.');
  }

  getCollection<T>(Model: ModelType<T>): Collection<new (...args: any[]) => Base> {
    return new Collection(this.ctx, Model);
  }

  constructor(ctx: Ctx) {
    Object.assign(this, db)
    this.ctx = ctx;
  }
}

export class Collection<T extends new (...args: any[]) => Base> {
  private db = db;
  service: CollectionReference;
  ctx: Ctx;

  constructor(ctx: Ctx, Model: ModelType<T>) {
    this.service = this.collection(Model);
    this.ctx = ctx;
  }

  collection<T>(Model: ModelType<T>): CollectionReference;
  collection<T>(name: string): CollectionReference;
  collection<T>(Model: ModelType<T> | string): CollectionReference {
    const collectionName = typeof Model === 'string' ? Model : Model.name;
    return this.db.collection(collectionName);
  }

  async create(entity: InstanceType<T>): Promise<InstanceType<T>> {
    const _id = await this.service.add({ data: entity });
    return {
      ...entity,
      _id,
      'auditMetadata.createdBy': this.ctx._req.event.userInfo.id,
      'auditMetadata.createdOn': new Date()
    };
  }

  async update(id: string, updateData: Partial<InstanceType<T>>): Promise<boolean> {
    const data = { ...updateData };
    delete data._id
    const res = await this.service.doc(id).update({
      data: {
        ...data,
        'auditMetadata.modifiedBy': this.ctx._req.event.userInfo.id,
        'auditMetadata.modifiedTime': new Date()
      },
    });
    if (typeof res === 'object') return res.stats.updated > 0

    return false;
  }

  async save(entity: InstanceType<T>): Promise<InstanceType<T>> {
    if (entity._id) {
      const model = await this.update(entity._id, entity);
    } else {
      const model = await this.create(entity);
      if (model._id)
        return entity;
    }
    throw new BadRequestError('Failed to save entity.');
  }

  async find(where?: object) {
    if (where) this.service.where(where).get()
    else this.service.get()
  }
}
