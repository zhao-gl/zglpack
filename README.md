一个基于rspack的打包器

默认配置了常用的打包配置

自定义配置文件会与默认配置进行合并
zgl.config.js
zgl.config.ts

命令
zgl dev 启动开发服务
-p, --port <port>, 'server port', '3000'
-o, --open, 'open browser automatically'

zgl build 打包
-m, --mode <mode>, 'build mode', 'production'
-l, --lib, 'build as library'