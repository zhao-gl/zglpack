# JSX 样式隔离使用指南

## 支持的样式隔离方案

### 1. CSS Modules (推荐)
CSS Modules 通过自动生成唯一的类名来实现样式隔离，避免全局样式冲突。

#### 使用方法

**创建样式文件：**
```css
/* Button.module.css */
.button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}

.button-large {
  padding: 15px 30px;
  font-size: 18px;
}
```

**在JSX中使用：**
```jsx
import React from 'react';
import styles from './Button.module.css';

function Button({ size, children }) {
  const buttonClass = size === 'large' 
    ? `${styles.button} ${styles['button-large']}`
    : styles.button;

  return (
    <button className={buttonClass}>
      {children}
    </button>
  );
}

export default Button;
```

#### 文件命名约定
- CSS Modules: `*.module.css`
- LESS Modules: `*.module.less`
- SCSS Modules: `*.module.scss`

#### 生成的类名格式
生成的类名将遵循格式：`[name]__[local]___[hash:base64:5]`
例如：`Button__button___aBc12`

### 2. CSS-in-JS (Emotion)

项目已集成 @emotion/react，可以使用 CSS-in-JS 方案：

```jsx
import React from 'react';
import { css } from '@emotion/react';

const buttonStyle = css`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

function Button({ children }) {
  return (
    <button css={buttonStyle}>
      {children}
    </button>
  );
}

export default Button;
```

### 3. 传统命名约定 (BEM)

如果不想使用 CSS Modules，也可以使用 BEM 命名约定：

```css
/* Button.css */
.button {
  /* 基础样式 */
}

.button--large {
  /* 大尺寸样式 */
}

.button__icon {
  /* 图标样式 */
}
```

## 配置说明

### 自动检测
- 所有以 `.module.css`、`.module.less`、`.module.scss` 结尾的文件都会自动启用 CSS Modules
- 普通 `.css`、`.less`、`.scss` 文件保持全局作用域

### 自定义配置
如果需要自定义 CSS Modules 的行为，可以在项目根目录创建 `rspack.config.js` 文件进行覆盖配置。

## 最佳实践

1. **优先使用 CSS Modules**：对于组件级别的样式，推荐使用 CSS Modules
2. **全局样式单独管理**：将全局样式（如主题、重置样式）放在单独的目录中
3. **避免嵌套选择器**：CSS Modules 中尽量避免使用嵌套选择器，以保持样式的独立性
4. **使用组合类名**：通过组合多个 CSS Modules 类名来实现样式复用

## 示例项目结构

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.jsx
│   │   ├── Button.module.css
│   │   └── Button.test.js
│   └── Card/
│       ├── Card.jsx
│       ├── Card.module.less
│       └── Card.test.js
├── styles/
│   ├── global.css
│   └── variables.css
└── App.jsx
```