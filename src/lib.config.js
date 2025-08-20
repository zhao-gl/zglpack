import path from "path";
import fs from "fs";
import pkg from '@rspack/core';
// import { CssExtractRspackPlugin } from '@rspack/core';
const { ProgressPlugin, SwcJsMinimizerRspackPlugin } = pkg;
import { getEntryPoints, generateEntriesFromSourceFiles } from './utils/utils';
import { detectProjectType, ProjectType, detectBundleType, BundleType } from './utils/enhanced';

// 动态生成库模式配置
export default async function () {
    // 检测项目类型
    const projectType = detectProjectType();

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
    // 获取需要生成的打包类型
    const bundleTypes = detectBundleType(packageJson);
    // console.log('bundleTypes', bundleTypes);

    // 生成按需导入的入口点
    const srcDir = path.resolve(process.cwd(), 'src');
    const onDemandEntries = generateEntriesFromSourceFiles(srcDir);
    // ESM 配置
    if (bundleTypes.includes(BundleType.ESM)) {
        const config = {
            mode: 'production',
            entry: onDemandEntries,
            output: {
                path: path.resolve(process.cwd(), 'dist/esm'),
                filename: '[name].js',
                library: {
                    type: 'module',
                },
                environment: {
                    module: true, // 启用ESM支持
                    dynamicImport: true, // 启用动态导入
                },
            },
            devtool: false,
            resolve: {
                extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss', '.less', '.vue'],
                alias: {
                    '@': path.resolve(process.cwd(), 'src'),
                },
            },
            experiments: {
                css: true,
                outputModule: true
            },
            externals: projectType === ProjectType.React ? {
                'react': 'react',
                'react-dom': 'react-dom',
                'react/jsx-runtime': 'react/jsx-runtime',
                'react/jsx-dev-runtime': 'react/jsx-dev-runtime'
            } : projectType === ProjectType.Vue ? {
                'vue': 'vue'
            } : {},
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
                                    }
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
                        oneOf: [
                            // 处理 CSS Modules（.module.css）
                            {
                                test: /\.module\.css$/i,
                                type: 'css/module', // 使用内置CSS模块支持
                            },
                            // 处理普通 CSS（非 .module.css）
                            {
                                type: 'css'
                            },
                        ],
                    },
                    {
                        test: /\.less$/,
                        oneOf: [
                            {
                                test: /\.module\.less$/i,
                                use: ['less-loader'],
                                type: 'css/module', // 使用CSS模块
                            },
                            {
                                use: ['less-loader'],
                                type: 'css', // 使用普通CSS
                            },
                        ]
                    },
                    {
                        test: /\.sass$/,
                        oneOf: [
                            {
                                test: /\.module\.sass$/i,
                                use: ['sass-loader'],
                                type: 'css/module', // 使用CSS模块
                            },
                            {
                                use: ['sass-loader'],
                                type: 'css', // 使用普通CSS
                            },
                        ]
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
                // new CssExtractRspackPlugin({})
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
                                pure_funcs: ['console.log', 'console.info', 'console.warn'], // 移除特定函数调用
                                passes: 2, // 压缩遍历次数
                                comparisons: true,
                                conditionals: true,
                                dead_code: true,
                                evaluate: true,
                                if_return: true,
                                join_vars: true,
                                negate_iife: true,
                                side_effects: true
                            },
                            mangle: {
                                toplevel: true,
                            },
                            format: {
                                comments: false // 移除注释
                            },
                            module: true
                        }
                    })
                ]
            },
        };
        configs.push(config);
    }
    // CommonJS 配置
    if (bundleTypes.includes(BundleType.CJS)) {
        const config = {
            // CommonJS 配置
            mode: 'production',
            entry: onDemandEntries,
            output: {
                path: path.resolve(process.cwd(), 'dist/cjs'),
                filename: '[name].js',
                library: {
                    type: 'commonjs',
                },
            },
            devtool: false,
            resolve: {
                extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss', '.less', '.vue'],
                alias: {
                    '@': path.resolve(process.cwd(), 'src'),
                },
            },
            experiments: {
                css: true,
            },
            externals: projectType === ProjectType.React ? {
                'react': 'react',
                'react-dom': 'react-dom',
                'react/jsx-runtime': 'react/jsx-runtime',
                'react/jsx-dev-runtime': 'react/jsx-dev-runtime'
            } : projectType === ProjectType.Vue ? {
                'vue': 'vue'
            } : {}, // 外部依赖，将在下面根据项目类型填充
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
                                    }
                                }
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
                        oneOf: [
                            // 处理 CSS Modules（.module.css）
                            {
                                test: /\.module\.css$/i,
                                type: 'css/module', // 使用内置CSS模块支持
                            },
                            // 处理普通 CSS（非 .module.css）
                            {
                                type: 'css'
                            },
                        ],
                    },
                    {
                        test: /\.less$/,
                        oneOf: [
                            {
                                test: /\.module\.less$/i,
                                use: ['less-loader'],
                                type: 'css/module', // 使用CSS模块
                            },
                            {
                                use: ['less-loader'],
                                type: 'css', // 使用普通CSS
                            },
                        ]
                    },
                    {
                        test: /\.sass$/,
                        oneOf: [
                            {
                                test: /\.module\.sass$/i,
                                use: ['sass-loader'],
                                type: 'css/module', // 使用CSS模块
                            },
                            {
                                use: ['sass-loader'],
                                type: 'css', // 使用普通CSS
                            },
                        ]
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
                // new CssExtractRspackPlugin({})
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
                                pure_funcs: ['console.log', 'console.info', 'console.warn'], // 移除特定函数调用
                                passes: 2, // 压缩遍历次数
                                comparisons: true,
                                conditionals: true,
                                dead_code: true,
                                evaluate: true,
                                if_return: true,
                                join_vars: true,
                                negate_iife: true,
                                side_effects: true
                            },
                            mangle: {
                                toplevel: true,
                            },
                            format: {
                                comments: false // 移除注释
                            }
                        }
                    })
                ]
            },
        };
        configs.push(config);
    }
    // UMD 配置
    if (bundleTypes.includes(BundleType.UMD)) {
        const config = {
            mode: 'production',
            entry: getEntryPoints(),
            output: {
                path: path.resolve(process.cwd(), 'dist/umd'),
                filename: '[name].js',
                library: {
                    type: 'umd',
                },
            },
            devtool: false,
            resolve: {
                extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss', '.less', '.vue'],
                alias: {
                    '@': path.resolve(process.cwd(), 'src'),
                },
            },
            experiments: {
                css: true,
            },
            externals: projectType === ProjectType.React ? {
                'react': {
                    commonjs: 'react',
                    commonjs2: 'react',
                    amd: 'react',
                    root: 'React'
                },
                'react-dom': {
                    commonjs: 'react-dom',
                    commonjs2: 'react-dom',
                    amd: 'react-dom',
                    root: 'ReactDOM'
                },
                'react/jsx-runtime': {
                    commonjs: 'react/jsx-runtime',
                    commonjs2: 'react/jsx-runtime',
                    amd: 'react/jsx-runtime',
                    root: 'ReactJsxRuntime'
                },
                'react/jsx-dev-runtime': {
                    commonjs: 'react/jsx-dev-runtime',
                    commonjs2: 'react/jsx-dev-runtime',
                    amd: 'react/jsx-dev-runtime',
                    root: 'ReactJsxDevRuntime'
                }
            } : projectType === ProjectType.Vue ? {
                'vue': {
                    commonjs: 'vue',
                    commonjs2: 'vue',
                    amd: 'vue',
                    root: 'Vue'
                }
            } : {},
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
                        oneOf: [
                            // 处理 CSS Modules（.module.css）
                            {
                                test: /\.module\.css$/i,
                                type: 'css/module', // 使用内置CSS模块支持
                            },
                            // 处理普通 CSS（非 .module.css）
                            {
                                type: 'css'
                            },
                        ],
                    },
                    {
                        test: /\.less$/,
                        oneOf: [
                            {
                                test: /\.module\.less$/i,
                                use: ['less-loader'],
                                type: 'css/module', // 使用CSS模块
                            },
                            {
                                use: ['less-loader'],
                                type: 'css', // 使用普通CSS
                            },
                        ]
                    },
                    {
                        test: /\.sass$/,
                        oneOf: [
                            {
                                test: /\.module\.sass$/i,
                                use: ['sass-loader'],
                                type: 'css/module', // 使用CSS模块
                            },
                            {
                                use: ['sass-loader'],
                                type: 'css', // 使用普通CSS
                            },
                        ]
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
                // new CssExtractRspackPlugin({})
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
                                pure_funcs: ['console.log', 'console.info', 'console.warn'], // 移除特定函数调用
                                passes: 2, // 压缩遍历次数
                                comparisons: true,
                                conditionals: true,
                                dead_code: true,
                                evaluate: true,
                                if_return: true,
                                join_vars: true,
                                negate_iife: true,
                                side_effects: true
                            },
                            mangle: {
                                toplevel: true,
                            },
                            format: {
                                comments: false // 移除注释
                            }
                        }
                    })
                ]
            },
        };
        configs.push(config);
    }

    // 为每个配置设置外部依赖
    // configs.forEach(cfg => {
    //     if (projectType === ProjectType.React) {
    //         if(cfg.output.library.type === 'module' || cfg.output.library.type === 'commonjs'){
    //             cfg.externals = {
    //                 'react': 'react',
    //                 'react-dom': 'react-dom',
    //                 'react/jsx-runtime': 'react/jsx-runtime',
    //                 'react/jsx-dev-runtime': 'react/jsx-dev-runtime'
    //             };
    //         }else{
    //             cfg.externals = {
    //                 'react': {
    //                     commonjs: 'react',
    //                     commonjs2: 'react',
    //                     amd: 'react',
    //                     root: 'React'
    //                 },
    //                 'react-dom': {
    //                     commonjs: 'react-dom',
    //                     commonjs2: 'react-dom',
    //                     amd: 'react-dom',
    //                     root: 'ReactDOM'
    //                 }
    //             };
    //         }
    //     } else if (projectType === ProjectType.Vue) {
    //         if(cfg.output.library.type === 'module' || cfg.output.library.type === 'commonjs'){
    //             cfg.externals = {
    //                 'vue': 'vue'
    //             };
    //         }else{
    //             cfg.externals = {
    //                 'vue': {
    //                     commonjs: 'vue',
    //                     commonjs2: 'vue',
    //                     amd: 'vue',
    //                     root: 'Vue'
    //                 }
    //             };
    //         }
    //     } else {
    //         cfg.externals = {};
    //     }
    // });

    return configs;
}