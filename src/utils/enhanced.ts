// 自定义增强方法
import fs from 'fs';
import path from 'path';

// 定义项目类型枚举
export enum ProjectType {
  React = 'react',
  Vue = 'vue',
  Unknown = 'unknown'
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