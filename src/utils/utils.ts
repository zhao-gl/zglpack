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
