"use strict";
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
/**
 * 编译 TypeScript 文件。
 * @param fileNames TypeScript 文件名数组
 * @param inputDir 输入目录路径
 * @param outputDir 输出目录路径
 */
function compileTypeScriptFiles(fileNames, inputDir, outputDir) {
    var options = {
        outDir: outputDir,
        rootDir: inputDir,
    };
    var program = ts.createProgram(fileNames, options);
    var emitResult = program.emit();
    var diagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
    printDiagnostics(diagnostics);
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
// 设置输入和输出目录
var inputDir = "./";
var outputDir = "dist";
fs.mkdirSync(outputDir, { recursive: true });
// 获取所有 TypeScript 文件
var fileNames = getTsFileNames(inputDir, ["gen-doc.ts", "gen-doc.js"]);
// 编译 TypeScript 文件
compileTypeScriptFiles(fileNames, inputDir, outputDir);
console.log("TypeScript compilation completed.");
