# 开发约定

## 包管理器

- **必须使用 bun**，禁止使用 npm
- 所有依赖安装命令使用 `bun install` 或 `bun add`
- 构建命令使用 `bun run build` 而非 `npm run build`

## 开发状态

- 当前处于开发阶段，使用 `bun run tauri dev` 进行开发
- 不要打包 release，等待功能稳定后再打包
- 主要改动：使用本地文件夹 + markdown文件管理（扁平结构）

---

# 特殊内容与经验

## HeroUI v3 Card 组件

### 组件结构
```tsx
import { Card } from "@heroui/react";

<Card>
  <Card.Header>
    <Card.Title>标题</Card.Title>
    <Card.Description>描述</Card.Description>
  </Card.Header>
  <Card.Content>主要内容</Card.Content>
  <Card.Footer>底部内容</Card.Footer>
</Card>
```

### 变体 (variant)
- `variant="transparent"` - 透明背景，最低重要度
- `variant="default"` - 标准卡片（默认）
- `variant="secondary"` - 中等重要度
- `variant="tertiary"` - 较高重要度

### 与 v2 差异
- ❌ `CardBody` → ✅ `Card.Content`
- ❌ `variant="light"` → ✅ `variant="ghost"`
- ❌ `variant="flat"` → ✅ `variant="secondary"`
- ❌ `isReadOnly` → ✅ `readOnly`

## Milkdown 编辑器

### 主题加载
```tsx
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
```

### CSS 类名（重要！）
- ❌ `.crepe-slash-menu` → ✅ `.milkdown-slash-menu`
- Milkdown 7.x 使用新的类名前缀

### 深色模式支持
```css
/* 在 styles.css 中添加 */
html[data-theme="dark"] {
  --milkdown-theme-background: #xxx;
  --milkdown-theme-surface: #xxx;
  /* 覆盖其他必要的 CSS 变量 */
}
```

### 中文本地化
- 使用 `:nth-child()` 选择器定位 slash menu 项
- 需要覆盖 Milkdown 默认英文文本

## Tauri 2.x

### 常用 API
```tsx
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
```

### 窗口管理
```tsx
import { getCurrentWindow } from "@tauri-apps/api/window";
const win = getCurrentWindow();
win.minimize();
win.maximize();
win.close();
```

## 常见问题

### 1. 构建失败 - CSS 变量问题
Tailwind CSS 不支持某些自定义类名如 `border-white/20`，需要使用完整颜色值或 CSS 变量。

### 2. HeroUI 组件不渲染
检查是否正确导入，HeroUI v3 某些组件需要特定的包装容器。

### 3. Tauri 插件未安装
确保在 `Cargo.toml` 中添加了对应的插件依赖，并在 `lib.rs` 中初始化。

### 4. 本地存储
使用 `localStorage.setItem()` 和 `localStorage.getItem()` 进行简单持久化，适合主题、字体大小等设置。

## Git 提交规范

- 使用清晰的提交信息描述改动
- 避免提交大型二进制文件
- 保持提交原子性，一个提交只做一件事
