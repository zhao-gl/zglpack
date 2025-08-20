import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from "@rollup/plugin-json";
import shebang from 'rollup-plugin-preserve-shebang';
import del from 'rollup-plugin-delete';

export default {
  input: {
    'bin/zgl': 'src/bin/zgl',
    'commands/build': 'src/commands/build.ts',
    'commands/serve': 'src/commands/serve.ts',
    'utils/utils': 'src/utils/utils.ts',
    'default.config': 'src/default.config.js',
    'index': 'src/index.ts'
  },
  output: [
    {
      dir: 'dist',
      format: 'esm', // ES Module 格式
      preserveModules: true,
      entryFileNames: ({ name }) => {
        if (name === 'bin/zgl') {
          return 'bin/zgl';
        }
        return `${name}.js`;
      }
    }
  ],
  plugins: [
    del({ targets: 'dist/*' }), // 在打包前清理 dist 目录
    nodeResolve(), // 支持模块解析
    commonjs(), // 转换 CommonJS 模块
    json(),
    typescript({
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true // 明确告诉插件使用 tsconfig 中的 declarationDir
    }),
    shebang()
  ],
  external: [
    '@rspack/core',
    '@rspack/cli',
    '@rspack/dev-server',
    'commander',
    '@swc/core',
    'webpack',
    'loader-runner',
    'depd',
    'uglify-js',
    'tslib',
    'ts-node',
    'style-loader',
    'react',
    'react-dom',
    'react/jsx-runtime',
    'vue',
    'vue-loader',
  ],
};