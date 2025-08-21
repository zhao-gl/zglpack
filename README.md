# zglpack

一个基于 [Rspack](https://www.rspack.dev/) 的现代化打包工具，专为 React 和 Vue 项目设计。

## 特性

- **零配置启动**：预设了常用的打包配置，开箱即用
- **智能项目检测**：自动识别 React/Vue 项目类型并应用相应配置
- **多格式支持**：支持打包为 CommonJS、ES Module 和 UMD 格式
- **按需导入**：库模式下支持按需导入组件
- **样式隔离**：内置 CSS Modules 支持，避免样式冲突
- **开发服务器**：内置开发服务器，支持热更新
- **代码分割**：自动代码分割，优化加载性能
- **资源优化**：图片、字体等资源自动处理和优化

## 安装

```bash
npm install -g zglpack
```

## 使用

### 开发模式

启动开发服务器：

```bash
zgl dev
```

选项：
- `-p, --port <port>`: 指定端口号，默认 3000
- `-o, --open`: 自动打开浏览器

### 生产构建

打包项目：

```bash
zgl build
```

选项：
- `-m, --mode <mode>`: 构建模式，默认 production
- `-l, --lib`: 以库模式构建

## 配置

### 自定义配置

可以通过创建 `zgl.config.js` 或 `zgl.config.ts` 文件来自定义配置：

```javascript
// zgl.config.js
import { defineConfig } from 'zglpack';
export default defineConfig({
  // 自定义配置项
  devServer: {
    port: 8080
  }
});
```

自定义配置会与默认配置进行合并。

### 库模式

在库模式下，会根据 `package.json` 的配置自动确定打包格式：

```json
{
  "name": "my-library",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

## 支持的文件类型

- JavaScript/JSX
- TypeScript/TSX
- CSS/SCSS/LESS
- 图片资源 (png, jpg, gif, svg)
- 字体文件 (woff, woff2, eot, ttf, otf)
- 音视频文件 (mp4, webm, ogg, mp3, wav, flac, aac)

## 样式隔离

支持 CSS Modules，通过命名约定自动启用：

- `*.module.css`
- `*.module.scss`
- `*.module.less`

```css
/* Button.module.css */
.button {
  background: blue;
  color: white;
}
```

```jsx
import styles from './Button.module.css';

function Button() {
  return <button className={styles.button}>Click me</button>;
}
```