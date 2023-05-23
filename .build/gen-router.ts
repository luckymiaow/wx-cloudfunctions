/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-20 20:16:32
 * @LastEditors: luckymiaow
 */
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import * as prettier from "prettier";

const root = process.cwd();

function genRouterTemplate(): string {
  return `/*
  * @Description: 自动获取modules中的文件生成
  * @Author: luckymiaow
  * @Date: 2023-05-17 20:05:27
  * @LastEditors: luckymiaow
  */
 import TcbRouter from "tcb-router";
 import * as Errors from "@/common/Error";
 {{ModulesImport}}
 
 export const routerList = {
  {{RouterList}}
 };
 
 export const whitelist = {{{WhiteList}}};
 
 export const useRouter = (event, context) => {
   const app = new TcbRouter({ event });
 
   /* 异常处理拦截器 */
   app.use(async (ctx, next) => {
     try {
       if (!(ctx._req.event.$url in routerList))
         throw new Errors.NotFoundError();
       await next();
     } catch (err) {
       let res = {
         code: 500,
         message: err.message,
         success: false,
       };
       for (const key in Errors) {
         if (err instanceof Errors[key]) {
           res = {
             code: err.statusCode,
             message: err.message,
             success: false,
           };
           break;
         }
       }
       ctx.body = res;
     }
   });
 
   Object.keys(routerList).forEach((key) => {
     const { handler, model } = routerList[key];
     app.router(key, async (ctx, next) => {
       const fn = async function (...args) {
         const instance = new model({ ctx: ctx, next: next });
         instance.ctx = ctx;
         instance.next = next;
         const res = await instance[handler].bind(instance)(...args);
         ctx.body = {
           code: 200,
           data: res,
           success: true,
         };
       };
 
       if (ctx._req.event.params) {
         await fn(...Object.values(ctx._req.event.params), ctx._req.event.data);
       } else {
         await fn(ctx._req.event.data);
       }
     });
   });
 
   return app;
 };
 `;
}

function getModule(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  const methods: string[] = [];

  function visit(node) {
    if (ts.isClassDeclaration(node) && node.name) {
      // const className = node.name.text;
      node.members.forEach((member) => {
        if (ts.isMethodDeclaration(member) && member.name) {
          const methodName = member.name.getText();
          methods.push(methodName);
          // console.log(
          //   "%c [ member ]-104",
          //   "font-size:13px; background:pink; color:#bf2c9f;",
          //   methodName
          // );
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return methods;
}

function genRouter(appPath: string) {
  let template = genRouterTemplate();

  const replaceDictionaries = {
    ModulesImport: "",
    RouterList: "",
    WhiteList: "",
  };
  try {
    const modules = fs.readdirSync(path.join(appPath, "modules"));

    modules.forEach((modulePath) => {
      const moduleName = modulePath.split(".")[0];
      replaceDictionaries.ModulesImport += `import ${moduleName} from './modules/${moduleName}';\n`;
      const res = getModule(path.join(appPath, "modules", modulePath));

      replaceDictionaries.RouterList += res
        .map((e) => {
          return ` "${moduleName}/${e}": { handler: "${e}", model: ${moduleName} },`;
        })
        .join("\n");
    });
    Object.keys(replaceDictionaries).forEach((e) => {
      template = template.replace(
        new RegExp(`{{${e}}}`, "g"),
        replaceDictionaries[e]
      );
    });
    fs.writeFile(
      path.join(appPath, "router.ts"),
      prettier.format(template, {
        parser: "typescript",
      }),
      (err) => {
        if (err) {
          console.error(`${appPath}写入路由文件失败:`, err);
          return;
        }

        console.log(`${appPath}路由文件写入成功!`);
      }
    );
  } catch (e) {
    console.log(
      "%c [ e ]-162",
      "font-size:13px; background:pink; color:#bf2c9f;",
      e
    );
  }
}

function main() {
  const apps = fs.readdirSync(path.join(root, "application"));

  apps.forEach((app) => {
    genRouter(path.join(root, "application", app));
  });
}

main();
