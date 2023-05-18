/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 20:23:57
 * @LastEditors: luckymiaow
 */
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

/**
 * 获取指定目录及其子目录中的所有 TypeScript 文件名。
 * @param dir 目录路径
 * @returns TypeScript 文件名数组
 */
function getTsFileNames(dir: string, whitelist: string[] = []): string[] {
  const fileNames: string[] = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const nestedFileNames = getTsFileNames(filePath, whitelist);
      fileNames.push(...nestedFileNames);
    } else if (
      path.extname(file) === ".ts" &&
      !whitelist.includes(file) &&
      !filePath.includes("node_modules")
    ) {
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
function compileTypeScriptFiles(
  fileNames: string[],
  inputDir: string,
  outputDir: string
) {
  const options: ts.CompilerOptions = {
    outDir: outputDir,
    rootDir: inputDir,
  };

  const program = ts.createProgram(fileNames, options);
  const emitResult = program.emit();

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);
  printDiagnostics(diagnostics);
}

/**
 * 打印 TypeScript 编译器的诊断信息。
 * @param diagnostics 诊断信息数组
 */
function printDiagnostics(diagnostics: readonly ts.Diagnostic[]) {
  diagnostics.forEach((diagnostic) => {
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      message = `${diagnostic.file.fileName} (${line + 1},${
        character + 1
      }): ${message}`;
    }
    console.error(message);
  });
}

// 设置输入和输出目录
const inputDir = "./";
const outputDir = "dist";

fs.mkdirSync(outputDir, { recursive: true });

// 获取所有 TypeScript 文件
const fileNames = getTsFileNames(inputDir, ["gen-doc.ts", "gen-doc.js"]);

// 编译 TypeScript 文件
compileTypeScriptFiles(fileNames, inputDir, outputDir);

console.log("TypeScript compilation completed.");
