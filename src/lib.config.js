import path from "path";
import pkg from '@rspack/core';
const { ProgressPlugin, SwcJsMinimizerRspackPlugin } = pkg;
import { getEntryPoints } from './utils/utils';
import { detectProjectType, ProjectType } from './utils/enhanced';

// 动态生成库模式配置
export default async function () {
  // 检测项目类型
  const projectType = await detectProjectType();
  
  const config = {
    mode: 'production',
    entry: getEntryPoints(),
    output: {
      path: path.resolve(process.cwd(), 'dist'),
      filename: '[name].[contenthash].js',
      library: {
        type: 'commonjs2'
      },
      clean: true,
    },
    devtool: false,
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss', '.less', '.vue'],
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    externals: {}, // 外部依赖，将在下面根据项目类型填充
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  jsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                  },
                },
              },
            },
          },
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
            },
          },
        },
        {
          test: /\.tsx$/,
          exclude: /node_modules/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                  },
                },
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            'builtin:css-loader',
          ],
        },
        {
          test: /\.less$/,
          use: [
            'builtin:css-loader',
            'builtin:less-loader',
          ],
        },
        {
          test: /\.scss$/,
          use: [
            'builtin:css-loader',
            'builtin:sass-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/inline',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/inline',
        },
      ],
    },
    plugins: [
      new ProgressPlugin({}),
    ],
    optimization: {
      minimizer: [
        new SwcJsMinimizerRspackPlugin({
          include: /\.m?js$/i,
          minimizerOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
            mangle: {
              toplevel: true,
            }
          }
        })
      ]
    },
  };
  
  // 根据项目类型设置外部依赖
  if (projectType === ProjectType.React) {
    config.externals = {
      'react': 'react',
      'react-dom': 'react-dom'
    };
  } else if (projectType === ProjectType.Vue) {
    config.externals = {
      'vue': 'vue'
    };
  }
  
  return config;
}