# 开发约定

## 包管理器

- **必须使用 bun**，禁止使用 npm
- 所有依赖安装命令使用 `bun install` 或 `bun add`
- 构建命令使用 `bun run build` 而非 `npm run build`

## 开发状态

- 当前处于开发阶段，使用 `bun run tauri dev` 进行开发
- 不要打包 release，等待功能稳定后再打包
- 主要改动：使用本地文件夹 + markdown文件管理（扁平结构）
