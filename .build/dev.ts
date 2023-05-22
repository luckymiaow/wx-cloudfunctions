const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const http = require("http");
const formidable = require("formidable");

let server;
let compilerProcess;

// 监视的目录路径列表
const watchDirectories = [
  path.resolve(process.cwd(), "application"),
  path.resolve(process.cwd(), "common"),
];

// 编译指令
const compileCommand = "node .build/compiler.js";

// 初始化监视器
const initializeWatcher = () => {
  watchDirectories.forEach((directory) => {
    // 监视目录变化
    fs.watch(directory, { recursive: true }, (eventType, filename) => {
      if (eventType === "change" && filename.endsWith(".ts")) {
        console.log(
          `File ${filename} in ${directory} has changed. Recompiling...`
        );
        compile();
      }
    });

    console.log(`Watching directory ${directory} for changes...`);
  });
};

// 执行编译指令
const compile = () => {
  // 中断上次的编译进程
  if (compilerProcess) {
    compilerProcess.kill("SIGINT");
    compilerProcess = null;
    console.log("Compilation interrupted. Starting new compilation...");
  }

  // 启动新的编译进程
  compilerProcess = spawn("node", [".build/compiler.js"], { stdio: "inherit" });

  compilerProcess.on("exit", (code, signal) => {
    if (signal === "SIGINT") {
      console.log("Compilation interrupted.");
    } else if (code === 0) {
      console.log("Compilation completed successfully.");
      restartServer();
    } else {
      console.error(`Compilation failed with exit code ${code}.`);
    }
  });
};

// 重启 HTTP 服务器
const restartServer = () => {
  // 清除旧的接口模块缓存
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key];
  });

  if (server) {
    server.close(() => {
      console.log("HTTP server closed. Restarting...");
      startServer();
    });
  } else {
    startServer();
  }
};

// 启动 HTTP 服务器
const startServer = () => {
  server = http.createServer((req, res) => {
    // 解析请求的 URL 和方法
    const { url, method, headers } = req;
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("解析表单数据错误:", err);
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("解析表单数据错误");
        return;
      }
      if (fields.data) fields.data = JSON.parse(fields.data);
      if (fields.params) fields.params = JSON.parse(fields.params);
      const app = require("../cloudfunctions/app/index");

      const r = await app.main(fields);
      console.log(
        "%c [ r ]-23",
        "font-size:13px; background:pink; color:#bf2c9f;",
        r
      );

      res.writeHead(r.code, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(r)),
      });

      // 发送响应数据
      res.end(JSON.stringify(r));
    });
  });

  // 监听端口
  const port = 3000;
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
};

// 启动监视器
initializeWatcher();
// 启动 HTTP 服务器
startServer();
