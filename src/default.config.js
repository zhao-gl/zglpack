import path from "path";
import pkg from '@rspack/core';
import { CssExtractRspackPlugin } from '@rspack/core'
const {ProgressPlugin, HtmlRspackPlugin, SwcJsMinimizerRspackPlugin} = pkg;
import {getEntryPoints} from './utils/utils';
import {detectProjectType, ProjectType} from './utils/enhanced';

// 动态生成默认配置
export default async function () {
    // 检测项目类型
    const projectType = await detectProjectType();
    const config = {
        mode: 'production',
        entry: getEntryPoints(),
        output: {
            path: path.resolve(process.cwd(), 'dist'),
            filename: 'js/[name].[contenthash].js', // 使用contenthash以实现更好的缓存策略
            assetModuleFilename: '[path][name].[contenthash][ext]',
            clean: true, // 在生成文件之前清空输出目录
        },
        experiments: {
            css: true,
        },
        devtool: false,
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss', '.less', '.vue'],
            alias: {
                '@': path.resolve(process.cwd(), 'src'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,  // 匹配.js和.jsx文件
                    exclude: /node_modules/,  // 排除node_modules目录
                    use: {
                        loader: 'builtin:swc-loader',  // 使用swc-loader处理
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
                    test: /\.ts$/,  // 匹配.ts文件
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
                    test: /\.tsx$/,  // 匹配.tsx文件
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
                    test: /\.css$/,  // 匹配.css文件
                    use: [CssExtractRspackPlugin.loader, 'css-loader'],
                    type: 'javascript/auto',
                },
                {
                    test: /\.less$/,
                    type: 'css/auto', // 👈
                    use: ['less-loader'],
                },
                {
                    test: /\.sass$/,
                    type: 'css/auto', // 👈
                    use: ['sass-loader'],
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/i,  // 匹配图片文件
                    type: 'asset/resource',  // 将图片作为资源文件处理
                    generator: {
                        filename: 'images/[name].[contenthash][ext]',  // 输出到images目录
                    },
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,  // 匹配字体文件
                    type: 'asset/resource',  // 将字体作为资源文件处理
                    generator: {
                        filename: 'fonts/[name].[contenthash][ext]',  // 输出到fonts目录
                    },
                },
                {
                    test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,  // 匹配音视频文件
                    type: 'asset/resource',  // 将音视频文件作为资源文件处理
                    generator: {
                        filename: 'media/[name].[contenthash][ext]',  // 输出到media目录
                    },
                },
            ],
        },
        plugins: [
            new ProgressPlugin({}),  // 添加打包进度条插件
            // 自动生成HTML
            new HtmlRspackPlugin({
                template: './public/index.html',
                filename: 'index.html'
            }),
            new CssExtractRspackPlugin({
                filename: 'css/[name].[contenthash].css',
            })
        ],
        // 调整性能提示阈值
        performance: {
            maxEntrypointSize: 500000, // 提高到500KB
            maxAssetSize: 200000, // 单个资源限制200KB
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                minSize: 20000, // 最小分割尺寸（20KB）
                maxSize: 200000, // 最大分割尺寸（200KB）
                minChunks: 1,
                maxAsyncRequests: 20, // 异步请求的最大数量
                maxInitialRequests: 20, // 初始请求的最大数量
                cacheGroups: {
                    // 将node_modules中的第三方库打包成一个单独的chunk
                    vendor: {
                        test: /[/]node_modules[/]/,
                        name(module) {
                            // 提取包名（如 node_modules/react → react）
                            const packageName = module.context.match(/[/]node_modules[/](.*?)([/]|$)/)[1];
                            // 替换特殊字符，避免影响文件名
                            return `vendors.${packageName.replace('@', '')}`;
                        },
                        priority: 10,
                        reuseExistingChunk: true,
                        minSize: 20000, // 最小分割尺寸（20KB）
                        maxSize: 150000, // 最大分割尺寸（150KB）
                        enforce: true // 强制分割，即使小于minSize
                    },
                    // 分割共享代码
                    common: {
                        name: 'common',
                        minChunks: 2, // 被引用至少2次的代码
                        priority: 5,
                        reuseExistingChunk: true,
                        minSize: 10000, // 最小分割尺寸（10KB）
                        maxSize: 100000, // 最大分割尺寸（100KB）
                        enforce: true // 强制分割，即使小于minSize
                    },
                    // 为大型第三方库创建单独的chunks
                    vendorLarge: {
                        test: /[/]node_modules[/]/,
                        name(module) {
                            const packageName = module.context.match(/[/]node_modules[/](.*?)([/]|$)/)[1];
                            return `vendors.large.${packageName.replace('@', '')}`;
                        },
                        priority: 20, // 更高优先级
                        minSize: 100000, // 100KB以上的模块
                        maxSize: 300000, // 最大300KB
                        chunks: 'all'
                    }
                }
            },
            minimizer: [
                new SwcJsMinimizerRspackPlugin({
                    // 生产环境启用压缩
                    include: /\.m?js$/i,
                    minimizerOptions: {
                        compress: {
                            drop_console: true, // 移除console
                            drop_debugger: true, // 移除debugger
                        },
                        mangle: {
                            toplevel: true,
                        }
                    }
                })
            ]
        },
        devServer: {
            port: 3000,
            open: false,
        },
    }
    // 根据项目类型添加特定配置
    if (projectType === ProjectType.Vue) {
        // 动态导入Vue相关模块
        const {VueLoaderPlugin} = await import('vue-loader');

        // 添加Vue loader规则
        config.module.rules.push({
            test: /\.vue$/,
            use: 'vue-loader',
        });

        // 添加Vue loader插件
        config.plugins.push(new VueLoaderPlugin());

        // 添加.vue扩展名
        config.resolve.extensions.push('.vue');
    }

    return config;
}