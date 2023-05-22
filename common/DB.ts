/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:48:31
 * @LastEditors: luckymiaow
 */
import cloud from "wx-server-sdk";
import { Base } from "./models/Base/Base";
import { BadRequestError } from "./Error";

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV as any });

export class DB<T extends new (...args: any[]) => Base> {
  private db = cloud.database();
  service: cloud.DB.CollectionReference;
  ctx:Ctx;

  constructor(ctx: Ctx, model: T) {
    this.service = this.db.collection(model.name);
    this.ctx = ctx;
  }

  async create(entity: InstanceType<T>): Promise<InstanceType<T>> {
    const _id = await this.service.add({data:entity });
    return  {
      _id: _id
      ...entity
    };
  }

  async update(id: string, updateData: Partial<InstanceType<T>>): Promise<boolean> {
  
    const  data = {...updateData};
    delete data._id
    const res = await this.service.doc(id).update({
      data: {
        ...data,
        'auditMetadata.modifiedBy': this.ctx._req.event.userInfo.id,
        'auditMetadata.modifiedTime': new Date()
      },
    });
    if(typeof res ==='object') return res.stats.updated > 0
  }


  async save(entity: InstanceType<T>): Promise<InstanceType<T>> {
    if (entity._id) {
      const model = await this.update(entity._id,entity);
      
    } else {
      const model = await this.create(entity);
      if (model._id) {
        return entity;
      }
    }
    throw new BadRequestError("Failed to save entity.");
  }

  async find(where?: object){
    if(where) this.service.where(where).get()     
    else this.service.get()
  }
 
}
