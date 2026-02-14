# Aphelios

一个优雅的、沉浸式的“果味”本地小说编辑器。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-ɑ-orange.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

Aphelios
是一款为文学创作者量身定制的桌面端编辑器，追求极致的视觉体验与专注的创作环境。它融合了现代
Web 技术的灵活性与本地应用的强大性能。

## ✨ 特性

- **🍎
  果系美学**：深度定制的磨砂玻璃（Glassmorphism）效果，温润的圆角设计，每一个细节都经过视觉推敲。
- **🧘 沉浸创作**：一键开启全屏沉浸模式，隐藏所有杂讯，让世界只剩下你和文字。
- **📁 本地优先**：基于本地文件夹的扁平化文件管理系统，支持标准 Markdown
  格式，数据永远掌握在你自己手中。
- **🌓
  极致色彩**：精心调教的浅色（奶油温润）与深色（咖啡炭黑）主题，全天候保护视力，拒绝光污染。
- **⚡ 极速统计**：专为中文优化的字数统计功能，精准识别 CJK 字符与标点。
- **🛠️ 现代架构**：基于 [Tauri v2](https://tauri.app/) +
  [React 19](https://react.dev/) + [Milkdown (Crepe)](https://milkdown.dev/)
  构建。

## 🚀 快速开始

### 环境需求

- [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/) (用于 Tauri 构建)

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-username/aphelios.git
cd aphelios

# 安装依赖 (推荐使用 Bun)
bun install

# 启动开发环境
bun run tauri dev
```

### 构建发布版本

```bash
bun run tauri build
```

## 🛠️ 技术栈

- **前端框架**: React 19 (@heroui/react)
- **跨端架构**: Tauri v2
- **编辑器核心**: Milkdown Crepe
- **包管理器**: Bun
- **样式方案**: Tailwind CSS v4

## 📂 项目结构

- `src/`: React 前端逻辑与 UI
- `src-tauri/`: Rust 后端与 Tauri 核心配置
- `knowledge/`: AI 辅助开发的知识库

## 📜 开源协议

MIT License

---

_Created with ❤️ for writers._
