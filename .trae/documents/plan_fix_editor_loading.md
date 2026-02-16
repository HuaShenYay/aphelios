# 修复编辑器读取书籍内容重复的问题

## 问题分析

用户反馈“每本书都读取到同一书的章节和内容”。经过代码分析，发现 `src-tauri/src/lib.rs` 中的 `list_projects` 函数存在逻辑缺陷。

在读取项目列表时，代码直接使用了 `project.json` 中存储的 `path` 字段，而不是实际的文件系统路径。

```rust
// src-tauri/src/lib.rs

// 当前逻辑
projects.push(Project {
    word_count,
    ..project // 这会使用 json 中的 path，如果该 path 是错误的（例如复制了项目文件夹但未修改 json），就会导致指向错误的项目
});
```

如果用户通过复制文件夹的方式创建新项目，或者移动了项目文件夹但没有更新 `project.json`，那么 `list_projects` 返回的所有项目可能都会指向同一个 `path`（即原始项目的路径）。这会导致点击任何项目时，后端 `get_project_structure` 都接收到相同的 `project_path`，从而加载相同的内容。

## 解决方案

修改 `src-tauri/src/lib.rs` 中的 `list_projects` 函数，强制使用扫描到的实际目录路径作为项目的 `path`，覆盖 `project.json` 中的值。

此外，为了保证数据一致性，如果发现实际路径与 JSON 中存储的路径不一致，最好也更新一下 JSON 文件（可选，但推荐至少在内存中修正）。

## 任务列表

1.  **修改 `list_projects`**:
    -   在 `src-tauri/src/lib.rs` 中，修改 `list_projects` 函数。
    -   在构建 `Project` 结构体返回时，显式设置 `path` 为 `entry.path().to_string_lossy().to_string()`。

2.  **验证修复**:
    -   模拟问题：手动复制一个项目文件夹，验证在修复前是否会出现重复内容的问题。
    -   应用修复。
    -   验证修复后，复制的项目是否能被识别为独立的项目（虽然内容目录可能还是同一个，但项目元数据路径应该是独立的）。

## 额外优化 (可选)

检查 `create_project` 是否需要自动创建子文件夹，以避免不同项目误用同一个文件夹作为内容源。虽然这不能修复现有项目，但可以改善未来的用户体验。
