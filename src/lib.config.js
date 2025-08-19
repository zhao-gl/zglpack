import path from "path";
import fs from "fs";
import pkg from '@rspack/core';
const {rspack, ProgressPlugin, SwcJsMinimizerRspackPlugin } = pkg;
import { getEntryPoints } from './utils/utils';
import { detectProjectType, ProjectType, detectBundleType, BundleType } from './utils/enhanced';

// 动态生成库模式配置
export default async function () {
    // 检测项目类型
    const projectType = await detectProjectType();

    // 读取package.json以确定打包类型
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    let packageJson = {};
    if (fs.existsSync(packageJsonPath)) {
        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        } catch (error) {
            console.warn('Failed to parse package.json:', error);
        }
    }
    // const configs = [];
    // 根据package.json的type字段和exports字段确定打包配置
    const config = {
        // CommonJS 配置
        mode: 'production',
        entry: getEntryPoints(),
        output: {},
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
                    test: /\.css$/i,
                    use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
                    type: 'javascript/auto',
                },
                {
                    test: /\.less$/,
                    type: 'css/auto',
                    use: ['less-loader'],
                },
                {
                    test: /\.scss$/,
                    type: 'css/auto',
                    use: ['sass-loader'],
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
            new rspack.CssExtractRspackPlugin({})
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
    };

    // 获取需要生成的打包类型
    const bundleTypes = detectBundleType(packageJson);

    if (bundleTypes.includes(BundleType.CJS)) {
        config.output = {
            path: path.resolve(process.cwd(), 'dist/cjs'),
            filename: '[name].js',
            library: {
                type: 'commonjs',
            },
        };
        // configs.push(config);
    } else if (bundleTypes.includes(BundleType.ESM)) {
        config.output = {
            path: path.resolve(process.cwd(), 'dist/esm'),
            filename: '[name].js',
            library: {
                type: 'module',
            },
        };
    } else if (bundleTypes.includes(BundleType.UMD)) {
        config.output = {
            path: path.resolve(process.cwd(), 'dist/umd'),
            filename: '[name].js',
            library: {
                type: 'umd',
            },
        };
    }

    // 为每个配置设置外部依赖
    if (projectType === ProjectType.React) {
        config.externals = {
            'react': 'react',
            'react-dom': 'react-dom'
        };
    } else if (projectType === ProjectType.Vue) {
        config.externals = {
            'vue': 'vue'
        };
    } else {
        config.externals = {};
    }

    return config;
}