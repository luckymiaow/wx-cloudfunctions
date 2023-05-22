/*
 * @Description:
 * @Author: luckymiaow
 * @Date: 2023-05-17 20:23:57
 * @LastEditors: luckymiaow
 */
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import * as prettier from "prettier";

//#region 编译

//#region 编译结构
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

function readCompilerOptions(tsconfigPath: string): ts.CompilerOptions {
  const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

  if (error) {
    throw new Error(`Failed to read tsconfig.json: ${error.messageText}`);
  }
  const { options, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(tsconfigPath)
  );
  if (errors.length > 0) {
    throw new Error(`Invalid tsconfig.json: ${errors[0].messageText}`);
  }

  return options;
}

// 递归复制目录及文件
function copyDirectory(sd, td) {
  const sourceFile = fs.readdirSync(sd, { withFileTypes: true });

  for (const file of sourceFile) {
    // 源文件 地址+文件名
    const srcFile = path.resolve(sd, file.name);
    // 目标文件
    const tagFile = path.resolve(td, file.name);
    // 文件是目录且未创建
    if (file.isDirectory() && !fs.existsSync(tagFile)) {
      fs.mkdirSync(tagFile);
      copyDirectory(srcFile, tagFile);
    } else if (file.isDirectory() && fs.existsSync(tagFile)) {
      // 文件时目录且已存在
      copyDirectory(srcFile, tagFile);
    }

    !file.isDirectory() &&
      fs.copyFileSync(srcFile, tagFile, fs.constants.COPYFILE_FICLONE);
  }
}

function copyCommon(compilerOptions: ts.CompilerOptions) {
  if (!compilerOptions.outDir) throw new Error("outDir is required");

  const root = path.join(process.cwd(), compilerOptions.outDir);

  const sourceDir = path.join(root, "common");

  const targetDirs = fs.readdirSync(path.join(root, "application"));

  for (const dir of targetDirs) {
    fs.mkdirSync(path.join(root, "application", dir, "common"), {
      recursive: true,
    });

    copyDirectory(sourceDir, path.join(root, "application", dir, "common"));
  }

  fs.rmdirSync(sourceDir, { recursive: true });
}

function getAppName(path: string) {
  const res = path.split("/");
  const i = res.findIndex((e) => e === "application");
  return res[i + 1];
}

/* 依赖搜集器 */
const relyOnMapByApp: Record<string, Set<string>> = {};

function configureDependencies(outDir: string) {
  const dependencies = require("../package.json").dependencies || {};
  Object.keys(relyOnMapByApp).forEach((application) => {
    const local = {};
    relyOnMapByApp[application].forEach((e) => {
      if (e in dependencies) {
        local[e] = dependencies[e];
      }
    });

    const packageJsonContent = JSON.stringify({
      dependencies: local,
    });

    fs.writeFile(
      path.join(outDir, application, "package.json"),
      prettier.format(packageJsonContent, {
        parser: "json",
      }),
      (err) => {
        if (err) {
          console.error(`${application}Failed to create package.json:`, err);
        } else {
          console.log(`${application}package.json created successfully!`);
        }
      }
    );
  });
}

function getRelativePath(fileName: string, toPath: string): string {
  const name = getAppName(fileName);

  if (/^@\/common/.test(toPath)) {
    toPath = path.join(
      toPath.replace(/^@\/common\//, path.join(name, "common", "/"))
    );
  }

  if (/^@\/application/.test(toPath)) {
    toPath = toPath.replace(/^@\/application\//, "");
  }

  const fromPath = path
    .join(
      path.join(process.cwd(), "/"),
      path.join(fileName).replace(path.join(process.cwd(), "/"), "")
    )
    .replace(path.join("application", "/"), "");

  const relativePath = path.relative(
    path.dirname(fromPath),
    path.dirname(toPath)
  );

  const t = path.join(relativePath, path.basename(toPath)).replace(/\\/g, "/");
  if (!relativePath || !relativePath.startsWith('.')) {
    return "./" + t;
  }
  return t;
}

function customPath(context: ts.TransformationContext) {
  const factory = ts.factory;

  return (sourceFile: ts.SourceFile) => {
    if (!sourceFile.fileName.endsWith(".ts")) return sourceFile;
    if (
      sourceFile.fileName.startsWith("application") ||
      path
        .join(sourceFile.fileName)
        .startsWith(path.join(process.cwd(), "application"))
    ) {
      const visitor: ts.Visitor = (node) => {
        if (ts.isImportDeclaration(node)) {
          const moduleName = node.moduleSpecifier;
          if (
            /^[",']@\//.test(moduleName.getText()) &&
            ts.isStringLiteral(moduleName)
          ) {
            const importPath = moduleName.text;

            const newImportPath = getRelativePath(
              sourceFile.fileName,
              importPath
            );

            const newModuleName = factory.createStringLiteral(newImportPath);
            const newImportDeclaration = factory.updateImportDeclaration(
              node,
              node.modifiers,
              node.importClause,
              newModuleName,
              node.assertClause
            );

            return newImportDeclaration;
          } else if (ts.isStringLiteral(moduleName)) {
            if (
              !moduleName.text.startsWith("/") &&
              !moduleName.text.startsWith(".")
            ) {
              if (!relyOnMapByApp[getAppName(sourceFile.fileName)])
                relyOnMapByApp[getAppName(sourceFile.fileName)] =
                  new Set<string>();
              relyOnMapByApp[getAppName(sourceFile.fileName)].add(
                moduleName.text
              );
            }
          }
        }
        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitEachChild(sourceFile, visitor, context);
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
function compileTypeScriptFiles(
  fileNames: string[],
  compilerOptions: ts.CompilerOptions
) {
  const options: ts.CompilerOptions = {
    ...compilerOptions,
  };

  if (!options.outDir) throw new Error("outDir is required");

  const program = ts.createProgram(fileNames, options);

  const emitResult = program.emit(undefined, undefined, undefined, undefined, {
    before: [customPath],
  });

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  printDiagnostics(diagnostics);

  copyCommon(compilerOptions);

  const root = path.join(process.cwd(), options.outDir);

  copyDirectory(path.join(root, "application"), path.join(root));

  fs.rmdirSync(path.join(root, "application"), { recursive: true });

  configureDependencies(options.outDir);
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

function cleanDirectory(dir: string) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        cleanDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dir);
  }
}

// 设置输入和输出目录

const tsconfigPath = "tsconfig.json";

const options = readCompilerOptions(tsconfigPath);

options.rootDir = path.join(process.cwd(), options.rootDir || "/");

if (!options.outDir) throw new Error("outDir is required");

fs.mkdirSync(options.outDir, { recursive: true });

cleanDirectory(options.outDir);

// // 获取所有 TypeScript 文件
const fileNames = getTsFileNames(options.rootDir, ["gen-doc.ts", "gen-doc.js"]);

// // 编译 TypeScript 文件
compileTypeScriptFiles(fileNames, options);

console.log("TypeScript compilation completed.");

// //#endregion
