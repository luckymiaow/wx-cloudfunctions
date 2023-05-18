import cloud from "wx-server-sdk";

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV as any });

export class DB {
  db = cloud.database();
  service = this.db.collection("ClientUser");
}
