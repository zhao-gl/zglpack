// 自定义增强方法
import fs from 'fs';
import path from 'path';

// 定义项目类型枚举
export enum ProjectType {
  React = 'react',
  Vue = 'vue',
  Unknown = 'unknown'
}

// 定义打包类型枚举
export enum BundleType {
  CJS = 'cjs',
  ESM = 'esm',
  UMD = 'umd'
}

// 检测打包类型
export function detectBundleType(packageJson: any): BundleType[] {
  const bundleTypes: BundleType[] = [];
  
  // 默认添加CommonJS配置
  bundleTypes.push(BundleType.CJS);
  
  // 如果package.json中有type: "module"或有exports字段，则添加ESM配置
  if (packageJson.type === 'module' || packageJson.exports) {
    bundleTypes.push(BundleType.ESM);
  }
  
  // 如果package.json中有exports字段且包含browser或umd相关配置，则添加UMD配置
  if (packageJson.exports && (packageJson.exports.browser || packageJson.exports.import || packageJson.exports.require)) {
    bundleTypes.push(BundleType.UMD);
  }
  
  return bundleTypes;
}

// 检测项目类型（vue/react）
export async function detectProjectType(): Promise<ProjectType> {
  // 检查package.json依赖
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      // 检查Vue依赖
      if (dependencies['vue'] || dependencies['@vue/runtime-dom']) {
        return ProjectType.Vue;
      }
      
      // 检查React依赖
      if (dependencies['react'] || dependencies['react-dom']) {
        return ProjectType.React;
      }
    } catch (error) {
      console.warn('Failed to parse package.json:', error);
    }
  }
  
  // 检查src目录下的文件类型
  const srcDir = path.resolve(process.cwd(), 'src');
  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    
    // 检查是否存在.vue文件
    const hasVueFiles = files.some(file => file.endsWith('.vue'));
    if (hasVueFiles) {
      return ProjectType.Vue;
    }
    
    // 检查是否存在jsx/tsx文件
    const hasReactFiles = files.some(file => file.endsWith('.jsx') || file.endsWith('.tsx'));
    if (hasReactFiles) {
      return ProjectType.React;
    }
  }
  
  return ProjectType.Unknown;
}