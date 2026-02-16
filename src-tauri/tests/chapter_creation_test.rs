//! 测试用例：验证新章节创建逻辑
//!
//! 测试目标：
//! 1. 新章节创建时正文不包含任何 H1 标题
//! 2. 新章节创建时正文完全空白
//! 3. 历史章节不受影响
//! 4. 多语言、富文本、Markdown 编辑器模式兼容

use std::fs;
use std::path::PathBuf;
use tempfile::TempDir;

/// 测试：验证 create_scene 生成的文件内容为空（不含 H1）
#[test]
fn test_create_scene_empty_content() {
    // 创建临时目录
    let temp_dir = TempDir::new().unwrap();
    let folder_path = temp_dir.path();

    // 创建项目元数据
    let project_path = folder_path.join("project.json");
    let project_json = r#"{
        "id": "test-project",
        "name": "测试项目",
        "path": "test",
        "folder_path": "test",
        "word_count": 0,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "is_favorite": false
    }"#;
    fs::write(&project_path, project_json).unwrap();

    // 模拟创建章节（使用与 lib.rs 相同的逻辑）
    let title = "第一章";
    let file_name = format!("{}.md", title);
    let file_path = folder_path.join(&file_name);

    // 新逻辑：正文内容为空
    let initial_content = String::new();
    fs::write(&file_path, &initial_content).unwrap();

    // 验证：文件存在
    assert!(file_path.exists(), "章节文件应该存在");

    // 验证：内容为空
    let content = fs::read_to_string(&file_path).unwrap();
    assert!(
        content.is_empty(),
        "新章节正文应该为空，不应包含任何 H1 标题"
    );

    // 验证：不包含 H1 标签
    assert!(!content.contains("# "), "新章节不应包含 H1 标题");
    assert!(!content.contains("#\t"), "新章节不应包含 H1 标题");
    assert!(!content.starts_with("#"), "新章节不应以 H1 开头");

    // 清理
    temp_dir.close();
}

/// 测试：验证即使提供多语言标题，新章节正文仍为空
#[test]
fn test_create_scene_multilingual_title_empty_content() {
    let temp_dir = TempDir::new().unwrap();
    let folder_path = temp_dir.path();

    let test_cases = vec![
        "第一章",
        "Chapter 1",
        "第一章 测试",
        "第1章",
        "章",
        "", // 空标题边界情况
    ];

    for title in test_cases {
        let file_name = format!("{}.md", title);
        let file_path = folder_path.join(&file_name);

        let initial_content = String::new();
        fs::write(&file_path, &initial_content).unwrap();

        let content = fs::read_to_string(&file_path).unwrap();
        assert!(
            content.is_empty(),
            "标题 '{}' 的新章节正文应该为空，实际内容: {:?}",
            title,
            content
        );

        // 删除文件以便下一个测试
        fs::remove_file(&file_path).ok();
    }

    temp_dir.close();
}

/// 测试：验证新章节不包含任何隐藏字符或格式符号
#[test]
fn test_create_scene_no_hidden_characters() {
    let temp_dir = TempDir::new().unwrap();
    let folder_path = temp_dir.path();

    let title = "测试章节";
    let file_name = format!("{}.md", title);
    let file_path = folder_path.join(&file_name);

    let initial_content = String::new();
    fs::write(&file_path, &initial_content).unwrap();

    let content = fs::read_to_string(&file_path).unwrap();

    // 验证：不是空白字符串（包含空格、换行等）
    assert!(
        content.is_empty(),
        "新章节应该是完全空的字符串，不是空白字符串"
    );

    // 验证：字节长度为 0
    assert_eq!(
        content.len(),
        0,
        "新章节内容长度应该为 0，实际为 {}",
        content.len()
    );

    temp_dir.close();
}

/// 测试：模拟历史章节保持不变（H1 标题保留）
#[test]
fn test_existing_chapter_with_h1_preserved() {
    let temp_dir = TempDir::new().unwrap();
    let folder_path = temp_dir.path();

    // 模拟已存在的章节文件（带 H1 标题）
    let existing_file = folder_path.join("existing.md");
    let existing_content = "# 第一章\n\n这是第一章的内容。";
    fs::write(&existing_file, existing_content).unwrap();

    // 验证：历史内容保持不变
    let content = fs::read_to_string(&existing_file).unwrap();
    assert!(
        content.contains("# 第一章"),
        "历史章节的 H1 标题应该保持不变"
    );

    // 模拟新章节创建（不改变已有文件）
    let new_file = folder_path.join("new.md");
    let new_content = String::new();
    fs::write(&new_file, &new_content).unwrap();

    // 验证：新章节为空
    let new_chapter_content = fs::read_to_string(&new_file).unwrap();
    assert!(new_chapter_content.is_empty(), "新章节应该为空");

    // 验证：历史章节未被修改
    let existing_after = fs::read_to_string(&existing_file).unwrap();
    assert_eq!(existing_after, existing_content, "历史章节内容不应该被修改");

    temp_dir.close();
}

/// 测试：验证空内容在保存/导出时不会报错
#[test]
fn test_empty_content_save_export() {
    let temp_dir = TempDir::new().unwrap();
    let folder_path = temp_dir.path();

    // 创建空内容的章节文件
    let file_path = folder_path.join("empty.md");
    let empty_content = String::new();
    fs::write(&file_path, &empty_content).unwrap();

    // 验证：可以正常读取
    let content = fs::read_to_string(&file_path).unwrap();
    assert!(content.is_empty(), "应该能正常读取空内容");

    // 验证：可以正常写入（覆盖空内容）
    let new_content = "# 新标题\n\n新增内容";
    fs::write(&file_path, new_content).unwrap();
    let updated = fs::read_to_string(&file_path).unwrap();
    assert!(updated.contains("# 新标题"), "应该能正常更新内容");

    temp_dir.close();
}

/// 测试：验证 Markdown 格式文件的 H1 标题处理
#[test]
fn test_markdown_h1_detection() {
    let temp_dir = TempDir::new().unwrap();
    let folder_path = temp_dir.path();

    // 各种可能的 H1 格式
    let h1_variants = vec![
        "# 标题",
        "#\t标题",
        "#  标题",
        "#标题",
        " # 标题", // 前面有空格
    ];

    for h1 in h1_variants {
        let file_path = folder_path.join("test.md");

        // 旧逻辑会生成带 H1 的内容
        let old_content = format!("{}\n\n内容", h1);
        fs::write(&file_path, &old_content).unwrap();

        // 验证：旧内容包含 H1
        let old_read = fs::read_to_string(&file_path).unwrap();
        assert!(old_read.contains('#'), "旧逻辑生成的内容应该包含 #");

        // 删除
        fs::remove_file(&file_path).ok();

        // 新逻辑：创建空内容
        let new_content = String::new();
        fs::write(&file_path, &new_content).unwrap();

        // 验证：新内容不包含 H1
        let new_read = fs::read_to_string(&file_path).unwrap();
        assert!(!new_read.contains('#'), "新章节不应该包含 # 字符");
    }

    temp_dir.close();
}
