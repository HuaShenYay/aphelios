# 字数统计优化计划

## 目标
优化字数统计功能，支持更完整的中文、日文、韩文字符识别，并添加更多统计维度。

## 当前问题
1. CJK 字符识别范围不完整（缺少扩展区和日文韩文）
2. 缺少字符数、段落数、行数、阅读时间等统计
3. 每次统计都重新读取所有文件，性能不佳

## 优化方案

### 1. 后端优化 (src-tauri/src/lib.rs)

#### 新增数据结构
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TextStats {
    pub word_count: u32,              // 字数
    pub char_count: u32,              // 字符数（不含空格）
    pub char_count_with_spaces: u32,  // 字符数（含空格）
    pub paragraph_count: u32,         // 段落数
    pub line_count: u32,              // 行数
    pub reading_time_minutes: u32,    // 预计阅读时间
}
```

#### 优化 CJK 字符检测
- 支持基本汉字 (4E00-9FFF)
- 支持扩展 A (3400-4DBF)
- 支持扩展 B-D (20000-2B81F)
- 支持日文平假名、片假名
- 支持韩文
- 支持全角标点符号

#### 新增分析函数
```rust
fn analyze_text(content: &str) -> TextStats
fn is_cjk_char(c: char) -> bool
```

#### 新增 Tauri 命令
```rust
#[tauri::command]
fn get_text_stats(content: String) -> TextStats

#[tauri::command]
fn get_project_stats(project_path: String) -> Result<TextStats, String>
```

### 2. 前端优化

#### 更新 types.ts
添加 TextStats 类型定义

#### 更新 EditorView.tsx
- 在底部工具栏显示更详细的统计信息
- 添加悬浮提示显示完整统计

#### 更新 ProjectList.tsx
- 显示项目总字数
- 可选：显示预计阅读时间

## TODOs

### 后端任务
- [ ] 1. 添加 TextStats 结构体和实现
- [ ] 2. 优化 is_cjk_char 函数，支持完整 Unicode 范围
- [ ] 3. 实现 analyze_text 函数
- [ ] 4. 新增 get_text_stats 命令
- [ ] 5. 新增 get_project_stats 命令
- [ ] 6. 更新 SceneContent 结构体包含完整统计
- [ ] 7. 更新 save_scene_content 返回完整统计

### 前端任务
- [ ] 8. 更新 types.ts 添加 TextStats 类型
- [ ] 9. 更新 EditorView 显示详细统计
- [ ] 10. 更新 ProjectList 显示项目统计
- [ ] 11. 添加统计信息悬浮提示组件

## 性能优化建议
- 在 Project 结构体中缓存总字数和最后更新时间
- 只重新统计修改过的文件
- 使用增量更新而非全量重算

## 验收标准
- [ ] 中文标点符号不计入字数
- [ ] 日文、韩文字符正确统计
- [ ] 英文单词按词统计，不是按字符
- [ ] 段落数、行数统计准确
- [ ] 阅读时间估算合理
- [ ] 前端正确显示所有统计数据
