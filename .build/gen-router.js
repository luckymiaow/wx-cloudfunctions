"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-20 20:16:32
 * @LastEditors: luckymiaow
 */
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var prettier = require("prettier");
var root = process.cwd();
function genRouterTemplate() {
    return "/*\n  * @Description: \u81EA\u52A8\u83B7\u53D6modules\u4E2D\u7684\u6587\u4EF6\u751F\u6210\n  * @Author: luckymiaow\n  * @Date: 2023-05-17 20:05:27\n  * @LastEditors: luckymiaow\n  */\n import TcbRouter from \"tcb-router\";\n {{ModulesImport}}\n import * as Errors from \"@/common/Error\";\n \n export const routerList = {\n  {{RouterList}}\n };\n \n export const whitelist = {{{WhiteList}}};\n\nexport function useRouter(event: any) {\n  const app = new TcbRouter({ event });\n\n  /* \u5F02\u5E38\u5904\u7406\u62E6\u622A\u5668 */\n  app.use(\n    async (\n      ctx: {\n        _req: { event: { $url: string } }\n        body: { code: number; message: any; success: boolean }\n      },\n      next: () => any,\n    ) => {\n      try {\n        if (!(ctx._req.event.$url in routerList))\n          throw new Errors.NotFoundError();\n        await next();\n      }\n      catch (err: any) {\n        let res = {\n          code: 500,\n          message: err.message,\n          success: false,\n        };\n        for (const key in Errors) {\n          if (err instanceof (Errors as any)[key]) {\n            res = {\n              code: err.statusCode,\n              message: err.message,\n              success: false,\n            };\n            break;\n          }\n        }\n        ctx.body = res;\n      }\n    },\n  );\n\n  (Object.keys(routerList) as Array<keyof typeof routerList>).forEach((key) => {\n    const { handler, model: Model } = routerList[key];\n    app.router(key, async (ctx: any, next: any) => {\n      const fn = async function (...args: unknown[]) {\n        const instance: any = new Model({ ctx, next });\n        instance.ctx = ctx;\n        instance.next = next;\n        const res = await instance[handler].bind(instance)(...args);\n        ctx.body = {\n          code: 200,\n          data: res,\n          success: true,\n        };\n      };\n\n      if (ctx._req.event.params)\n        await fn(...Object.values(ctx._req.event.params), ctx._req.event.data);\n\n      else\n        await fn(ctx._req.event.data);\n    });\n  });\n\n  return app;\n}\n ";
}
function getModule(filePath) {
    var fileContent = fs.readFileSync(filePath, "utf-8");
    var sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
    var methods = [];
    function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
            // const className = node.name.text;
            node.members.forEach(function (member) {
                if (ts.isMethodDeclaration(member) && member.name) {
                    var methodName = member.name.getText();
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
function genRouter(appPath) {
    var template = genRouterTemplate();
    var replaceDictionaries = {
        ModulesImport: "",
        RouterList: "",
        WhiteList: "",
    };
    try {
        var modules = fs.readdirSync(path.join(appPath, "modules"));
        modules.forEach(function (modulePath) {
            var moduleName = modulePath.split(".")[0];
            replaceDictionaries.ModulesImport += "import ".concat(moduleName, " from './modules/").concat(moduleName, "';\n");
            var res = getModule(path.join(appPath, "modules", modulePath));
            replaceDictionaries.RouterList += res
                .map(function (e) {
                return " \"".concat(moduleName, "/").concat(e, "\": { handler: \"").concat(e, "\", model: ").concat(moduleName, " },");
            })
                .join("\n");
        });
        Object.keys(replaceDictionaries).forEach(function (e) {
            template = template.replace(new RegExp("{{".concat(e, "}}"), "g"), replaceDictionaries[e]);
        });
        var prettierConfig = prettier.resolveConfig.sync();
        fs.writeFile(path.join(appPath, "router.ts"), prettier.format(template, __assign(__assign({}, prettierConfig), { parser: "typescript" })), function (err) {
            if (err) {
                console.error("".concat(appPath, "\u5199\u5165\u8DEF\u7531\u6587\u4EF6\u5931\u8D25:"), err);
                return;
            }
            console.log("".concat(appPath, "\u8DEF\u7531\u6587\u4EF6\u5199\u5165\u6210\u529F!"));
        });
    }
    catch (e) {
        console.log("%c [ e ]-162", "font-size:13px; background:pink; color:#bf2c9f;", e);
    }
}
function main() {
    var apps = fs.readdirSync(path.join(root, "application"));
    apps.forEach(function (app) {
        genRouter(path.join(root, "application", app));
    });
}
main();
