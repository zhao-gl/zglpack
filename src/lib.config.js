import path from "path";
import fs from "fs";
import pkg from '@rspack/core';
import { CssExtractRspackPlugin } from '@rspack/core';
const { ProgressPlugin, SwcJsMinimizerRspackPlugin } = pkg;
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
    const configs = [];
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
                    use: [CssExtractRspackPlugin.loader, 'css-loader'],
                    type: 'javascript/auto',
                },
                // {
                //     test: /\.less$/,
                //     use: [
                //         CssExtractRspackPlugin.loader,
                //         'css-loader', // 解析 CSS
                //         { 
                //             loader: 'less-loader', 
                //             options: {
                //                 lessOptions: { javascriptEnabled: true }
                //             } 
                //         }
                //     ],
                //     // 如果你需要将 '*.module.less' 视为 CSS Modules 那么将 'type' 设置为 'css/auto' 否则设置为 'css'
                //     type: 'css/auto',
                // },
                // {
                //     test: /\.scss$/,
                //     type: 'css',
                //     use: ['sass-loader'],
                // },
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
            // new CssExtractRspackPlugin({
            //     filename: 'css/[name].[contenthash:8].css',
            //     chunkFilename: 'css/[name].[contenthash:8].chunk.css',
            // })
        ],
        // 调整性能提示阈值
        performance: {
            maxEntrypointSize: 500000, // 提高到500KB
            maxAssetSize: 200000, // 单个资源限制200KB
        },
        optimization: {
            splitChunks: false,
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
    console.log('bundleTypes', bundleTypes);

    if (bundleTypes.includes(BundleType.CJS)) {
        const output = {
            path: path.resolve(process.cwd(), 'dist/cjs'),
            filename: '[name].js',
            library: {
                type: 'commonjs',
            },
        };
        const configCopy = JSON.parse(JSON.stringify(config));
        configCopy.output = output;
        configs.push(configCopy);
    }
    if (bundleTypes.includes(BundleType.ESM)) {
        const output = {
            path: path.resolve(process.cwd(), 'dist/esm'),
            filename: '[name].js',
            library: {
                type: 'module',
            },
        };
        const configCopy = JSON.parse(JSON.stringify(config));
        configCopy.output = output;
        configs.push(configCopy);
    }
    if (bundleTypes.includes(BundleType.UMD)) {
        const output = {
            path: path.resolve(process.cwd(), 'dist/umd'),
            filename: '[name].js',
            library: {
                type: 'umd',
            },
        };
        const configCopy = JSON.parse(JSON.stringify(config));
        configCopy.output = output;
        configs.push(configCopy);
    }

    // 为每个配置设置外部依赖
    configs.forEach(cfg => {
        if (projectType === ProjectType.React) {
            cfg.externals = {
                'react': 'react',
                'react-dom': 'react-dom'
            };
        } else if (projectType === ProjectType.Vue) {
            cfg.externals = {
                'vue': 'vue'
            };
        } else {
            cfg.externals = {};
        }
    });

    return configs;
}