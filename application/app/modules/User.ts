/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 17:25:02
 * @LastEditors: luckymiaow
 */

import { DB } from "@/common/DB";
import { User } from "@/common/models/User";

/*
 *名则是表名，config.json
 */

export default {
  findById(id: string) {
    const user = new User();
    const db = new DB();
  },

  find(where) {},
};
