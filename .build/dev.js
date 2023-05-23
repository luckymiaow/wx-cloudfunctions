"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var _a = require("child_process"), exec = _a.exec, spawn = _a.spawn;
var http = require("http");
var formidable = require("formidable");
var swaggerJsdoc = require("swagger-jsdoc");
var server;
// 监视的目录路径列表
var watchDirectories = [
    path.resolve(process.cwd(), "application"),
    path.resolve(process.cwd(), "common"),
];
var whitelist = fs
    .readdirSync(path.resolve(process.cwd(), "application"))
    .map(function (e) { return path.resolve(process.cwd(), "application", e, "router.ts"); });
// 初始化监视器
var initializeWatcher = function () {
    watchDirectories.forEach(function (directory) {
        // 监视目录变化
        fs.watch(directory, { recursive: true }, function (eventType, filename) {
            if (eventType === "change" && filename.endsWith(".ts")) {
                var filePath = path.resolve(directory, filename);
                if (!whitelist.includes(filePath)) {
                    console.log("%c [ whitelist ]-29", "font-size:13px; background:pink; color:#bf2c9f;", whitelist, filePath);
                    console.log("File ".concat(filename, " in ").concat(directory, " has changed. Recompiling..."));
                    compile();
                }
            }
        });
        console.log("Watching directory ".concat(directory, " for changes..."));
    });
};
var compilerProcess;
// 执行编译指令
var compile = function () {
    // 中断上次的编译进程
    if (compilerProcess) {
        compilerProcess.kill("SIGINT");
        compilerProcess = null;
        console.log("Compilation interrupted. Starting new compilation...");
    }
    // 启动新的编译进程
    compilerProcess = spawn("node", [".build/gen-router.js", ".build/compiler.js"], { stdio: "inherit" });
    compilerProcess.on("exit", function (code, signal) {
        if (signal === "SIGINT") {
            console.log("Compilation interrupted.");
        }
        else if (code === 0) {
            console.log("Compilation completed successfully.");
            restartServer();
        }
        else {
            console.error("Compilation failed with exit code ".concat(code, "."));
        }
    });
};
// 重启 HTTP 服务器
var restartServer = function () {
    // 清除旧的接口模块缓存
    Object.keys(require.cache).forEach(function (key) {
        delete require.cache[key];
    });
    if (server) {
        server.close(function () {
            console.log("HTTP server closed. Restarting...");
            startServer();
        });
    }
    else {
        startServer();
    }
};
// 启动 HTTP 服务器
var startServer = function () {
    server = http.createServer(function (req, res) {
        // 解析请求的 URL 和方法
        var url = req.url, method = req.method, headers = req.headers;
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) { return __awaiter(void 0, void 0, void 0, function () {
            var app, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (err) {
                            console.error("解析表单数据错误:", err);
                            res.writeHead(400, { "Content-Type": "text/plain" });
                            res.end("解析表单数据错误");
                            return [2 /*return*/];
                        }
                        if (fields.data)
                            fields.data = JSON.parse(fields.data);
                        if (fields.params)
                            fields.params = JSON.parse(fields.params);
                        app = require("../cloudfunctions/app/index");
                        return [4 /*yield*/, app.main(fields)];
                    case 1:
                        r = _a.sent();
                        console.log("%c [ r ]-23", "font-size:13px; background:pink; color:#bf2c9f;", r);
                        res.writeHead(r.code, {
                            "Content-Type": "application/json",
                            "Content-Length": Buffer.byteLength(JSON.stringify(r)),
                        });
                        // 发送响应数据
                        res.end(JSON.stringify(r));
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // 监听端口
    var port = 3000;
    server.listen(port, function () {
        console.log("Server running at http://localhost:".concat(port, "/"));
        // console.log(`Server running at http://localhost:${port}/swagger`);
    });
};
// 启动监视器
initializeWatcher();
// 启动 HTTP 服务器
startServer();
