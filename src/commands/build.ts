import { rspack } from '@rspack/core';
import { getUserConfig } from '../utils/utils';

// 默认构建配置
// @ts-ignore 忽略找不到模块声明文件的错误
import getDefaultConfig from '../default.config.js';
// @ts-ignore 忽略找不到模块声明文件的错误
import getLibConfig from '../lib.config.js';

/**
 * 构建项目
 * @param options 构建选项
 */
const build = async (options: { mode: string, lib?: boolean }) => {
  const userConfig = await getUserConfig();
  
  // 根据lib选项选择配置
  const baseConfig = options.lib ? await getLibConfig() : await getDefaultConfig();
  
  const config = {
    ...baseConfig,
    ...userConfig,
    mode: userConfig?.mode || options.mode || baseConfig.mode,
  };

  try {
    // 执行构建
    await new Promise<void>((resolve, reject) => {
      rspack(config, (err, stats) => {
        if (err) {
          console.error('Build error:', err);
          reject(err);
          return;
        }
        
        if (stats) {
          console.log(stats.toString({
            colors: true,
            modules: false,
            chunks: false,
            chunkModules: false,
          }));
        }
        
        resolve();
      });
    });
    
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

export { build };