import { RspackDevServer } from '@rspack/dev-server';
import { rspack } from '@rspack/core';
import { getUserConfig } from '../utils/utils';

// 默认配置
// @ts-ignore 忽略找不到模块声明文件的错误
import getDefaultConfig from '../default.config';

const serve = async (options: { port: string; open: boolean }) => {
  const userConfig = await getUserConfig();
  const defaultConfig = await getDefaultConfig();
  const config = {
    ...defaultConfig,
    ...userConfig,
    devServer: {
      ...defaultConfig.devServer,
      ...userConfig.devServer,
      port: userConfig.devServer?.port || options.port || defaultConfig.devServer.port,
      open: userConfig.devServer?.open || options.open || defaultConfig.devServer.open,
    },
  };

  const compiler = rspack(config);
  const server = new RspackDevServer(config.devServer, compiler);

  await server.start();
  console.log(`服务器已启动: http://localhost:${config.devServer.port}`);
};

export {
  serve
};