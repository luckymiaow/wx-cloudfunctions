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
 * @Date: 2023-05-17 20:23:57
 * @LastEditors: luckymiaow
 */
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var prettier = require("prettier");
//#region 编译
//#region 编译结构
/**
 * 获取指定目录及其子目录中的所有 TypeScript 文件名。
 * @param dir 目录路径
 * @returns TypeScript 文件名数组
 */
function getTsFileNames(dir, whitelist) {
    if (whitelist === void 0) { whitelist = []; }
    var fileNames = [];
    var files = fs.readdirSync(dir);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var filePath = path.join(dir, file);
        var stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            var nestedFileNames = getTsFileNames(filePath, whitelist);
            fileNames.push.apply(fileNames, nestedFileNames);
        }
        else if (path.extname(file) === ".ts" &&
            !whitelist.includes(file) &&
            !filePath.includes("node_modules")) {
            fileNames.push(filePath);
        }
    }
    return fileNames;
}
function readCompilerOptions(tsconfigPath) {
    var _a = ts.readConfigFile(tsconfigPath, ts.sys.readFile), config = _a.config, error = _a.error;
    if (error) {
        throw new Error("Failed to read tsconfig.json: ".concat(error.messageText));
    }
    var _b = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(tsconfigPath)), options = _b.options, errors = _b.errors;
    if (errors.length > 0) {
        throw new Error("Invalid tsconfig.json: ".concat(errors[0].messageText));
    }
    return options;
}
// 递归复制目录及文件
function copyDirectory(sd, td) {
    var sourceFile = fs.readdirSync(sd, { withFileTypes: true });
    for (var _i = 0, sourceFile_1 = sourceFile; _i < sourceFile_1.length; _i++) {
        var file = sourceFile_1[_i];
        // 源文件 地址+文件名
        var srcFile = path.resolve(sd, file.name);
        // 目标文件
        var tagFile = path.resolve(td, file.name);
        // 文件是目录且未创建
        if (file.isDirectory() && !fs.existsSync(tagFile)) {
            fs.mkdirSync(tagFile);
            copyDirectory(srcFile, tagFile);
        }
        else if (file.isDirectory() && fs.existsSync(tagFile)) {
            // 文件时目录且已存在
            copyDirectory(srcFile, tagFile);
        }
        !file.isDirectory() &&
            fs.copyFileSync(srcFile, tagFile, fs.constants.COPYFILE_FICLONE);
    }
}
function copyCommon(compilerOptions) {
    if (!compilerOptions.outDir)
        throw new Error("outDir is required");
    var root = path.join(process.cwd(), compilerOptions.outDir);
    var sourceDir = path.join(root, "common");
    var targetDirs = fs.readdirSync(path.join(root, "application"));
    for (var _i = 0, targetDirs_1 = targetDirs; _i < targetDirs_1.length; _i++) {
        var dir = targetDirs_1[_i];
        fs.mkdirSync(path.join(root, "application", dir, "common"), {
            recursive: true,
        });
        copyDirectory(sourceDir, path.join(root, "application", dir, "common"));
    }
    fs.rmdirSync(sourceDir, { recursive: true });
}
function getAppName(path) {
    var res = path.split("/");
    var i = res.findIndex(function (e) { return e === "application"; });
    return res[i + 1];
}
/* 依赖搜集器 */
var relyOnMapByApp = {};
function configureDependencies(outDir) {
    var dependencies = require("../package.json").dependencies || {};
    Object.keys(relyOnMapByApp).forEach(function (application) {
        var local = {};
        relyOnMapByApp[application].forEach(function (e) {
            if (e in dependencies) {
                local[e] = dependencies[e];
            }
        });
        var packageJsonContent = JSON.stringify({
            dependencies: local,
        });
        fs.writeFile(path.join(outDir, application, "package.json"), prettier.format(packageJsonContent, {
            parser: "json",
        }), function (err) {
            if (err) {
                console.error("".concat(application, "Failed to create package.json:"), err);
            }
            else {
                console.log("".concat(application, "package.json created successfully!"));
            }
        });
    });
}
function getRelativePath(fileName, toPath) {
    var name = getAppName(fileName);
    if (/^@\/common/.test(toPath)) {
        toPath = path.join(toPath.replace(/^@\/common\//, path.join(name, "common", "/")));
    }
    if (/^@\/application/.test(toPath)) {
        toPath = toPath.replace(/^@\/application\//, "");
    }
    var fromPath = path
        .join(path.join(process.cwd(), "/"), path.join(fileName).replace(path.join(process.cwd(), "/"), ""))
        .replace(path.join("application", "/"), "");
    var relativePath = path.relative(path.dirname(fromPath), path.dirname(toPath));
    var t = path.join(relativePath, path.basename(toPath)).replace(/\\/g, "/");
    if (!relativePath || !relativePath.startsWith('.')) {
        return "./" + t;
    }
    return t;
}
function customPath(context) {
    var factory = ts.factory;
    return function (sourceFile) {
        if (!sourceFile.fileName.endsWith(".ts"))
            return sourceFile;
        if (sourceFile.fileName.startsWith("application") ||
            path
                .join(sourceFile.fileName)
                .startsWith(path.join(process.cwd(), "application"))) {
            var visitor_1 = function (node) {
                if (ts.isImportDeclaration(node)) {
                    var moduleName = node.moduleSpecifier;
                    if (/^[",']@\//.test(moduleName.getText()) &&
                        ts.isStringLiteral(moduleName)) {
                        var importPath = moduleName.text;
                        var newImportPath = getRelativePath(sourceFile.fileName, importPath);
                        var newModuleName = factory.createStringLiteral(newImportPath);
                        var newImportDeclaration = factory.updateImportDeclaration(node, node.modifiers, node.importClause, newModuleName, node.assertClause);
                        return newImportDeclaration;
                    }
                    else if (ts.isStringLiteral(moduleName)) {
                        if (!moduleName.text.startsWith("/") &&
                            !moduleName.text.startsWith(".")) {
                            if (!relyOnMapByApp[getAppName(sourceFile.fileName)])
                                relyOnMapByApp[getAppName(sourceFile.fileName)] =
                                    new Set();
                            relyOnMapByApp[getAppName(sourceFile.fileName)].add(moduleName.text);
                        }
                    }
                }
                return ts.visitEachChild(node, visitor_1, context);
            };
            return ts.visitEachChild(sourceFile, visitor_1, context);
        }
        return sourceFile;
    };
}
/**
 * 编译 TypeScript 文件。
 * @param fileNames TypeScript 文件名数组
 * @param inputDir 输入目录路径
 * @param outputDir 输出目录路径
 */
function compileTypeScriptFiles(fileNames, compilerOptions) {
    var options = __assign({}, compilerOptions);
    if (!options.outDir)
        throw new Error("outDir is required");
    var program = ts.createProgram(fileNames, options);
    var emitResult = program.emit(undefined, undefined, undefined, undefined, {
        before: [customPath],
    });
    var diagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
    printDiagnostics(diagnostics);
    copyCommon(compilerOptions);
    var root = path.join(process.cwd(), options.outDir);
    copyDirectory(path.join(root, "application"), path.join(root));
    fs.rmdirSync(path.join(root, "application"), { recursive: true });
    configureDependencies(options.outDir);
}
/**
 * 打印 TypeScript 编译器的诊断信息。
 * @param diagnostics 诊断信息数组
 */
function printDiagnostics(diagnostics) {
    diagnostics.forEach(function (diagnostic) {
        var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        if (diagnostic.file) {
            var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
            message = "".concat(diagnostic.file.fileName, " (").concat(line + 1, ",").concat(character + 1, "): ").concat(message);
        }
        console.error(message);
    });
}
function cleanDirectory(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(function (file) {
            var filePath = path.join(dir, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                cleanDirectory(filePath);
            }
            else {
                fs.unlinkSync(filePath);
            }
        });
        fs.rmdirSync(dir);
    }
}
// 设置输入和输出目录
var tsconfigPath = "tsconfig.json";
var options = readCompilerOptions(tsconfigPath);
options.rootDir = path.join(process.cwd(), options.rootDir || "/");
if (!options.outDir)
    throw new Error("outDir is required");
fs.mkdirSync(options.outDir, { recursive: true });
cleanDirectory(options.outDir);
// // 获取所有 TypeScript 文件
var fileNames = getTsFileNames(options.rootDir, ["gen-doc.ts", "gen-doc.js"]);
// // 编译 TypeScript 文件
compileTypeScriptFiles(fileNames, options);
console.log("TypeScript compilation completed.");
// //#endregion
