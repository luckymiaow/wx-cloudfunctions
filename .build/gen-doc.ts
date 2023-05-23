/*
 * @Description: 
 * @Author: luckymiaow
 * @Date: 2023-05-20 20:16:32
 * @LastEditors: luckymiaow
 */
import * as fs from 'fs';



function main(){
  const root = process.cwd()
  const app = fs.readdirSync(path.join(root, 'application'))
  console.log('%c [ app ]-14', 'font-size:13px; background:pink; color:#bf2c9f;', app)


}


main()