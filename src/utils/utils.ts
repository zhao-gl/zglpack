import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

/**
 * 读取用户配置文件
 * @returns 用户配置对象
 */
export async function getUserConfig() {
  // 尝试加载.ts配置文件
  let configPath = path.resolve(process.cwd(), 'zgl.config.ts');
  if (fs.existsSync(configPath)) {
    // 动态导入 ts-node 并注册
    const tsNode = await import('ts-node');
    tsNode.register();
    // 动态导入配置文件
    const configUrl = pathToFileURL(configPath).href; // 转换为 file:// URL
    const configModule = await import(configUrl);
    const configExport = configModule.default || configModule;
    // 如果导出的是函数，则调用它获取配置
    if (typeof configExport === 'function') {
      return configExport();
    }
    return configExport;
  }
  // 尝试加载.js配置文件
  configPath = path.resolve(process.cwd(), 'zgl.config.js');
  if (fs.existsSync(configPath)) {
    // 动态导入配置文件
    const configUrl = pathToFileURL(configPath).href; // 转换为 file:// URL
    const configModule = await import(configUrl);
    const configExport = configModule.default || configModule;
    // 如果导出的是函数，则调用它获取配置
    if (typeof configExport === 'function') {
      return configExport();
    }
    return configExport;
  }
  return {};
}


// 动态获取入口点函数
export function getEntryPoints() {
  const entryPoints: Record<string, string> = {};
  const srcDir = path.resolve(process.cwd(), 'src');

  // 检查常见的入口文件
  const possibleEntries = [
    'index.js',
    'index.jsx',
    'index.ts',
    'index.tsx',
    'main.js',
    'main.jsx',
    'main.ts',
    'main.tsx'
  ];

  for (const entryFile of possibleEntries) {
    const entryPath = path.join(srcDir, entryFile);
    if (fs.existsSync(entryPath)) {
      // 使用文件名（不含扩展名）作为入口点名称
      const entryName = path.basename(entryFile, path.extname(entryFile));
      entryPoints[entryName] = entryPath;
      break; // 找到第一个匹配的入口文件后停止
    }
  }

  // 如果没有找到常见的入口文件，使用默认的index.js
  if (Object.keys(entryPoints).length === 0) {
    entryPoints['index'] = path.resolve(process.cwd(), 'src/index.js');
  }

  return entryPoints;
}