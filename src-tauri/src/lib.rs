use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use uuid::Uuid;

// ============ Data Structures ============

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub folder_path: String,
    pub created_at: String,
    pub updated_at: String,
    pub word_count: u32,
    pub is_favorite: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub id: String,
    pub title: String,
    pub order: u32,
    pub scenes: Vec<Scene>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Scene {
    pub id: String,
    pub title: String,
    pub order: u32,
    pub file_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectStructure {
    pub project: Project,
    pub chapters: Vec<Chapter>,
    pub scenes: Vec<Scene>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub folder_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateChapterRequest {
    pub project_path: String,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSceneRequest {
    pub project_path: String,
    pub folder_path: String,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTitleRequest {
    pub project_path: String,
    pub id: String,
    pub new_title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SceneContent {
    pub content: String,
    pub word_count: u32,
}

// ============ Text Statistics ============

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct TextStats {
    pub word_count: u32,             // 字数（中文字符 + 英文单词）
    pub char_count: u32,             // 字符数（不含空格）
    pub char_count_with_spaces: u32, // 字符数（含空格）
    pub paragraph_count: u32,        // 段落数
    pub line_count: u32,             // 行数
    pub reading_time_minutes: u32,   // 预计阅读时间（分钟）
}

/// 检查字符是否为 CJK 字符（中文、日文、韩文）
fn is_cjk_char(c: char) -> bool {
    // CJK Unified Ideographs (基本汉字)
    (c >= '\u{4e00}' && c <= '\u{9fff}')
    // CJK Unified Ideographs Extension A
    || (c >= '\u{3400}' && c <= '\u{4dbf}')
    // CJK Compatibility Ideographs
    || (c >= '\u{f900}' && c <= '\u{faff}')
    // CJK Unified Ideographs Extension B
    || (c >= '\u{20000}' && c <= '\u{2a6df}')
    // CJK Unified Ideographs Extension C
    || (c >= '\u{2a700}' && c <= '\u{2b73f}')
    // CJK Unified Ideographs Extension D
    || (c >= '\u{2b740}' && c <= '\u{2b81f}')
    // Hiragana (日文平假名)
    || (c >= '\u{3040}' && c <= '\u{309f}')
    // Katakana (日文片假名)
    || (c >= '\u{30a0}' && c <= '\u{30ff}')
    // Hangul Syllables (韩文)
    || (c >= '\u{ac00}' && c <= '\u{d7af}')
    // Hangul Jamo (韩文字母)
    || (c >= '\u{1100}' && c <= '\u{11ff}')
    // CJK Symbols and Punctuation
    || (c >= '\u{3000}' && c <= '\u{303f}')
    // Fullwidth ASCII variants
    || (c >= '\u{ff01}' && c <= '\u{ff5e}')
    // Halfwidth Katakana
    || (c >= '\u{ff65}' && c <= '\u{ff9f}')
}

/// 检查字符是否为单词的一部分（字母或数字）
fn is_word_char(c: char) -> bool {
    c.is_alphanumeric()
}

/// 统计文本的详细信息
fn analyze_text(content: &str) -> TextStats {
    if content.is_empty() {
        return TextStats::default();
    }

    let mut word_count = 0u32;
    let mut char_count = 0u32; // 不含空格
    let mut char_count_with_spaces = 0u32;
    let mut paragraph_count = 0u32;
    let mut line_count = 0u32;
    let mut in_word = false;
    let mut prev_was_newline = false;

    for c in content.chars() {
        char_count_with_spaces += 1;

        if c == '\n' {
            line_count += 1;
            if !prev_was_newline {
                paragraph_count += 1;
            }
            prev_was_newline = true;
            in_word = false;
        } else {
            prev_was_newline = false;
            if !c.is_whitespace() {
                char_count += 1;
            }

            if is_word_char(c) {
                if is_cjk_char(c) {
                    // CJK 字符每个算一个字
                    word_count += 1;
                    in_word = false;
                } else {
                    // 非 CJK 字符，按单词计算
                    if !in_word {
                        word_count += 1;
                        in_word = true;
                    }
                }
            } else {
                in_word = false;
            }
        }
    }

    // 如果内容不以换行符结尾，但还有内容，算作一个段落
    if !content.ends_with('\n') && !content.is_empty() {
        paragraph_count += 1;
    }

    // 如果没有换行符但有内容，至少算一行
    if line_count == 0 && !content.is_empty() {
        line_count = 1;
    }

    // 估算阅读时间：平均阅读速度约 300 字/分钟（中文）或 200 词/分钟（英文）
    // 使用保守估计 250 字/分钟
    let reading_time_minutes = ((word_count as f32) / 250.0).ceil() as u32;
    let reading_time_minutes = reading_time_minutes.max(1); // 至少 1 分钟

    TextStats {
        word_count,
        char_count,
        char_count_with_spaces,
        paragraph_count,
        line_count,
        reading_time_minutes,
    }
}

/// 兼容旧的字数统计函数
fn count_words(content: &str) -> u32 {
    analyze_text(content).word_count
}

// ============ Helper Functions ============

fn get_projects_dir() -> Result<PathBuf, String> {
    let docs_dir = dirs::document_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("Documents")))
        .unwrap_or_else(|| {
            log::warn!(
                "[get_projects_dir] Could not find documents or home dir, using current dir"
            );
            PathBuf::from(".")
        });

    let projects_dir = docs_dir.join("NovelEditor").join("projects");
    log::info!(
        "[get_projects_dir] Projects dir: {}",
        projects_dir.display()
    );

    if !projects_dir.exists() {
        log::info!("[get_projects_dir] Creating projects dir");
        if let Err(e) = fs::create_dir_all(&projects_dir) {
            log::error!("[get_projects_dir] Failed to create projects dir: {}", e);
            return Err(format!("无法创建项目目录: {}", e));
        }
        log::info!("[get_projects_dir] Created projects dir successfully");
    }

    Ok(projects_dir)
}

fn get_project_metadata_path(project_path: &str) -> PathBuf {
    PathBuf::from(project_path).join("project.json")
}

fn read_project_metadata(project_path: &str) -> Option<Project> {
    let path = get_project_metadata_path(project_path);
    if path.exists() {
        let content = fs::read_to_string(path).ok()?;
        let mut project: Project = serde_json::from_str(&content).ok()?;

        // Auto-correct path if it doesn't match the location we read from
        // This handles cases where the project folder was moved or copied
        if project.path != project_path {
            project.path = project_path.to_string();
        }

        Some(project)
    } else {
        None
    }
}

fn write_project_metadata(project: &Project) -> Result<(), String> {
    let path = get_project_metadata_path(&project.path);
    log::info!("[write_project_metadata] Writing to: {}", path.display());

    // 确保父目录存在
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            log::info!(
                "[write_project_metadata] Creating parent dir: {}",
                parent.display()
            );
            fs::create_dir_all(parent).map_err(|e| {
                log::error!("[write_project_metadata] Failed to create parent: {}", e);
                e.to_string()
            })?;
        }
    }

    let content = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
    fs::write(&path, &content).map_err(|e| {
        log::error!("[write_project_metadata] Failed to write: {}", e);
        e.to_string()
    })?;
    log::info!("[write_project_metadata] Successfully wrote metadata");
    Ok(())
}

fn scan_scenes_from_folder(folder_path: &str) -> Vec<Scene> {
    let folder = PathBuf::from(folder_path);
    if !folder.exists() || !folder.is_dir() {
        log::error!("Folder not found or not a directory: {}", folder_path);
        return Vec::new();
    }

    let mut scenes: Vec<Scene> = Vec::new();

    if let Ok(entries) = fs::read_dir(&folder) {
        let mut paths: Vec<_> = entries.flatten().map(|e| e.path()).collect();
        // Stable sort by filename
        paths.sort_by_key(|p| {
            p.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string()
        });

        for (idx, path) in paths.into_iter().enumerate() {
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                let file_name = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("未命名")
                    .to_string();

                let scene = Scene {
                    id: path.to_string_lossy().to_string(),
                    title: file_name,
                    order: (idx + 1) as u32,
                    file_path: path.to_string_lossy().to_string(),
                };
                scenes.push(scene);
            }
        }
    } else {
        log::error!("Failed to read directory: {}", folder_path);
    }

    scenes
}

fn count_words_in_project(project: &Project) -> u32 {
    let scenes = scan_scenes_from_folder(&project.folder_path);
    let mut total_words = 0u32;

    for scene in scenes {
        let scene_path = PathBuf::from(&scene.file_path);
        if scene_path.exists() {
            if let Ok(content) = fs::read_to_string(&scene_path) {
                total_words += count_words(&content);
            }
        }
    }

    total_words
}

// ============ Tauri Commands ============

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    if !path.exists() {
        return Err("路径不存在".to_string());
    }
    open::that(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_project(request: CreateProjectRequest) -> Result<Project, String> {
    log::info!(
        "[create_project] Request: name='{}', folder_path='{}'",
        request.name,
        request.folder_path
    );

    let projects_dir = get_projects_dir()?;
    log::info!("[create_project] Projects dir: {}", projects_dir.display());

    let project_id = Uuid::new_v4().to_string();
    let project_path = projects_dir.join(&project_id);

    // 创建内部项目目录（用于存储元数据）
    if let Err(e) = fs::create_dir_all(&project_path) {
        log::error!("[create_project] Failed to create project path: {}", e);
        return Err(format!("无法创建项目目录: {}", e));
    }

    // 用户选择的父目录
    let parent_folder = PathBuf::from(&request.folder_path);
    log::info!(
        "[create_project] Parent folder: {}",
        parent_folder.display()
    );
    log::info!(
        "[create_project] Parent folder exists: {}",
        parent_folder.exists()
    );

    if !parent_folder.exists() {
        // 尝试创建父目录
        if let Err(e) = fs::create_dir_all(&parent_folder) {
            log::error!("[create_project] Failed to create parent folder: {}", e);
            return Err(format!("指定的文件夹不存在且无法创建: {}", e));
        }
        log::info!("[create_project] Created parent folder");
    }

    if !parent_folder.is_dir() {
        return Err("指定的路径不是一个文件夹".to_string());
    }

    // 在父目录下创建以作品名命名的文件夹
    let project_folder_name = request.name.trim();
    if project_folder_name.is_empty() {
        fs::create_dir_all(&project_path).ok();
        return Err("作品名称不能为空".to_string());
    }

    // 清理文件名，移除不允许的字符
    let sanitized_name: String = project_folder_name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-' || *c == ' ')
        .collect();
    let project_folder_path = parent_folder.join(&sanitized_name);

    if project_folder_path.exists() {
        fs::create_dir_all(&project_path).ok();
        return Err("该文件夹已存在，请使用其他作品名".to_string());
    }

    // 创建作品文件夹
    fs::create_dir_all(&project_folder_path).map_err(|e| {
        fs::create_dir_all(&project_path).ok();
        e.to_string()
    })?;

    let now = chrono::Utc::now().to_rfc3339();

    let project = Project {
        id: project_id.clone(),
        name: request.name,
        path: project_path.to_string_lossy().to_string(),
        folder_path: project_folder_path.to_string_lossy().to_string(),
        created_at: now.clone(),
        updated_at: now,
        word_count: 0,
        is_favorite: false,
    };

    write_project_metadata(&project)?;

    log::info!(
        "[create_project] Created project: {} at path: {} folder: {}",
        project.name,
        project.path,
        project.folder_path
    );

    // 验证文件是否写入成功
    let metadata_path = get_project_metadata_path(&project.path);
    log::info!(
        "[create_project] metadata path: {}",
        metadata_path.display()
    );
    if metadata_path.exists() {
        log::info!("[create_project] metadata file exists!");
    } else {
        log::error!("[create_project] metadata file NOT found!");
    }

    Ok(project)
}

#[tauri::command]
fn list_projects() -> Result<Vec<Project>, String> {
    let projects_dir = get_projects_dir()?;
    let mut projects: Vec<Project> = Vec::new();

    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(mut project) = read_project_metadata(&path.to_string_lossy()) {
                    let word_count = count_words_in_project(&project);

                    // Override path with actual directory path to handle moved/copied projects
                    project.path = path.to_string_lossy().to_string();
                    project.word_count = word_count;

                    projects.push(project);
                }
            }
        }
    }

    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    log::info!("Listed {} projects", projects.len());

    Ok(projects)
}

#[tauri::command]
fn get_project_structure(project_path: String) -> Result<ProjectStructure, String> {
    log::info!("[get_project_structure] project_path: {}", project_path);

    let metadata_path = get_project_metadata_path(&project_path);
    log::info!(
        "[get_project_structure] metadata_path: {}",
        metadata_path.display()
    );
    log::info!(
        "[get_project_structure] metadata exists: {}",
        metadata_path.exists()
    );

    let project = read_project_metadata(&project_path).ok_or_else(|| {
        log::error!(
            "[get_project_structure] Failed to read metadata at: {}",
            metadata_path.display()
        );
        format!("Project not found at {}", project_path)
    })?;

    log::info!(
        "[get_project_structure] 读取到project: name={}, folder_path={}",
        project.name,
        project.folder_path
    );

    let scenes = scan_scenes_from_folder(&project.folder_path);
    log::info!("[get_project_structure] 扫描到 {} 个场景", scenes.len());
    let word_count = count_words_in_project(&project);

    let project_with_count = Project {
        word_count,
        ..project
    };

    log::info!(
        "Got structure for project: {} with {} scenes",
        project_with_count.name,
        scenes.len()
    );

    Ok(ProjectStructure {
        project: project_with_count,
        chapters: Vec::new(),
        scenes,
    })
}

#[tauri::command]
fn delete_project(project_path: String) -> Result<(), String> {
    fs::remove_dir_all(&project_path).map_err(|e| e.to_string())?;

    log::info!("Deleted project at: {}", project_path);

    Ok(())
}

#[tauri::command]
fn create_chapter(_request: CreateChapterRequest) -> Result<Chapter, String> {
    Err("扁平结构不支持章节，请直接在文件夹中创建markdown文件".to_string())
}

#[tauri::command]
fn delete_chapter(_project_path: String, _chapter_id: String) -> Result<(), String> {
    Err("扁平结构不支持章节".to_string())
}

#[tauri::command]
fn rename_chapter(request: UpdateTitleRequest) -> Result<Chapter, String> {
    Err("扁平结构不支持章节".to_string())
}

#[tauri::command]
fn create_scene(request: CreateSceneRequest) -> Result<Scene, String> {
    let folder_path = PathBuf::from(&request.folder_path);

    let file_name = format!("{}.md", request.title);
    let file_path = folder_path.join(&file_name);

    if file_path.exists() {
        return Err("文件已存在".to_string());
    }

    let initial_content = String::new(); // 新章节正文保持空白，不自动插入H1标题
    fs::write(&file_path, &initial_content).map_err(|e| e.to_string())?;

    let scene = Scene {
        id: file_path.to_string_lossy().to_string(),
        title: request.title,
        order: 0,
        file_path: file_path.to_string_lossy().to_string(),
    };

    if let Some(mut project) = read_project_metadata(&request.project_path) {
        project.updated_at = chrono::Utc::now().to_rfc3339();
        write_project_metadata(&project).ok();
    }

    log::info!("Created scene: {} in {}", scene.title, request.folder_path);

    Ok(scene)
}

#[tauri::command]
fn delete_scene(project_path: String, scene_id: String) -> Result<(), String> {
    let scene_path = PathBuf::from(&scene_id);

    if scene_path.exists() {
        fs::remove_file(&scene_path).map_err(|e| e.to_string())?;
    }

    if let Some(mut project) = read_project_metadata(&project_path) {
        project.updated_at = chrono::Utc::now().to_rfc3339();
        write_project_metadata(&project).ok();
    }

    log::info!("Deleted scene: {}", scene_id);

    Ok(())
}

#[tauri::command]
fn rename_scene(request: UpdateTitleRequest) -> Result<Scene, String> {
    let old_path = PathBuf::from(&request.id);

    if !old_path.exists() {
        return Err("文件不存在".to_string());
    }

    let parent = old_path.parent().ok_or("无法获取父目录")?;
    let new_file_name = format!("{}.md", request.new_title);
    let new_path = parent.join(&new_file_name);

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;

    if let Ok(content) = fs::read_to_string(&new_path) {
        let new_content = content
            .lines()
            .map(|line| {
                if line.starts_with("# ") {
                    format!("# {}", request.new_title)
                } else {
                    line.to_string()
                }
            })
            .collect::<Vec<_>>()
            .join("\n");
        fs::write(&new_path, new_content).ok();
    }

    if let Some(mut project) = read_project_metadata(&request.project_path) {
        project.updated_at = chrono::Utc::now().to_rfc3339();
        write_project_metadata(&project).ok();
    }

    let scene_title = request.new_title.clone();

    let scene = Scene {
        id: new_path.to_string_lossy().to_string(),
        title: request.new_title,
        order: 0,
        file_path: new_path.to_string_lossy().to_string(),
    };

    log::info!("Renamed scene to: {}", scene_title);

    Ok(scene)
}

#[tauri::command]
fn get_scene_content(scene_path: String) -> Result<SceneContent, String> {
    let path = PathBuf::from(&scene_path);

    if !path.exists() {
        return Err("Scene file not found".to_string());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let word_count = content.split_whitespace().count() as u32;

    Ok(SceneContent {
        content,
        word_count,
    })
}

#[tauri::command]
fn save_scene_content(scene_path: String, content: String) -> Result<u32, String> {
    let path = PathBuf::from(&scene_path);

    fs::write(&path, &content).map_err(|e| e.to_string())?;

    let word_count = count_words(&content);

    if let Ok(projects_dir) = get_projects_dir() {
        if let Ok(entries) = fs::read_dir(&projects_dir) {
            for entry in entries.flatten() {
                let project_path = entry.path();
                if project_path.is_dir() {
                    if let Some(mut project) =
                        read_project_metadata(&project_path.to_string_lossy())
                    {
                        if scene_path.starts_with(&project.folder_path) {
                            project.updated_at = chrono::Utc::now().to_rfc3339();
                            write_project_metadata(&project).ok();
                            break;
                        }
                    }
                }
            }
        }
    }

    log::info!("Saved scene: {} ({} words)", scene_path, word_count);

    Ok(word_count)
}

#[tauri::command]
fn get_text_stats(content: String) -> Result<TextStats, String> {
    Ok(analyze_text(&content))
}

#[tauri::command]
fn get_project_stats(project_path: String) -> Result<TextStats, String> {
    let project = read_project_metadata(&project_path)
        .ok_or_else(|| format!("Project not found at {}", project_path))?;

    let scenes = scan_scenes_from_folder(&project.folder_path);
    let mut total_stats = TextStats::default();

    for scene in scenes {
        let scene_path = PathBuf::from(&scene.file_path);
        if scene_path.exists() {
            if let Ok(content) = fs::read_to_string(&scene_path) {
                let stats = analyze_text(&content);
                total_stats.word_count += stats.word_count;
                total_stats.char_count += stats.char_count;
                total_stats.char_count_with_spaces += stats.char_count_with_spaces;
                total_stats.paragraph_count += stats.paragraph_count;
                total_stats.line_count += stats.line_count;
            }
        }
    }

    // 重新计算阅读时间
    total_stats.reading_time_minutes = ((total_stats.word_count as f32) / 250.0).ceil() as u32;
    total_stats.reading_time_minutes = total_stats.reading_time_minutes.max(1);

    log::info!(
        "Project stats for {}: {} words, {} chars, {} paragraphs",
        project.name,
        total_stats.word_count,
        total_stats.char_count,
        total_stats.paragraph_count
    );

    Ok(total_stats)
}

#[tauri::command]
fn rename_project(project_path: String, new_name: String) -> Result<Project, String> {
    let mut project =
        read_project_metadata(&project_path).ok_or_else(|| "Project not found".to_string())?;

    project.name = new_name;
    project.updated_at = chrono::Utc::now().to_rfc3339();

    write_project_metadata(&project)?;

    log::info!("Renamed project to: {}", project.name);

    Ok(project)
}

#[tauri::command]
fn toggle_favorite(project_path: String) -> Result<Project, String> {
    let mut project =
        read_project_metadata(&project_path).ok_or_else(|| "Project not found".to_string())?;

    project.is_favorite = !project.is_favorite;
    project.updated_at = chrono::Utc::now().to_rfc3339();

    write_project_metadata(&project)?;

    log::info!(
        "{} project {}",
        if project.is_favorite {
            "Favorited"
        } else {
            "Unfavorited"
        },
        project.name
    );

    Ok(project)
}

#[tauri::command]
fn export_project_markdown(project_path: String) -> Result<String, String> {
    let project =
        read_project_metadata(&project_path).ok_or_else(|| "Project not found".to_string())?;

    let scenes = scan_scenes_from_folder(&project.folder_path);

    let mut output = format!("# {}\n\n", project.name);
    output.push_str(&format!(
        "*Exported on {}*\n\n",
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    ));
    output.push_str("---\n\n");

    for scene in scenes {
        let scene_path = PathBuf::from(&scene.file_path);
        if scene_path.exists() {
            if let Ok(content) = fs::read_to_string(&scene_path) {
                output.push_str(&format!("## {}\n\n", scene.title));
                let content_lines: Vec<&str> = content.lines().collect();
                let start_idx = if content_lines
                    .first()
                    .map(|l| l.starts_with("# "))
                    .unwrap_or(false)
                {
                    2
                } else {
                    0
                };
                for line in content_lines.iter().skip(start_idx) {
                    output.push_str(line);
                    output.push('\n');
                }
                output.push_str("\n\n");
            }
        }
    }

    log::info!("Exported project {} as markdown", project.name);
    Ok(output)
}

#[tauri::command]
fn export_project_txt(project_path: String) -> Result<String, String> {
    let project =
        read_project_metadata(&project_path).ok_or_else(|| "Project not found".to_string())?;

    let scenes = scan_scenes_from_folder(&project.folder_path);

    let mut output = format!("{}\n", project.name);
    output.push_str(&"=".repeat(project.name.len()));
    output.push_str("\n\n");

    for scene in scenes {
        let scene_path = PathBuf::from(&scene.file_path);
        if scene_path.exists() {
            if let Ok(content) = fs::read_to_string(&scene_path) {
                let content = content
                    .lines()
                    .map(|line| {
                        if line.starts_with("# ") {
                            line.trim_start_matches("# ").to_string()
                        } else if line.starts_with("## ") {
                            line.trim_start_matches("## ").to_string()
                        } else if line.starts_with("### ") {
                            line.trim_start_matches("### ").to_string()
                        } else {
                            line.to_string()
                        }
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
                output.push_str(&format!("{}\n\n", scene.title));
                output.push_str(&content);
                output.push_str("\n\n");
            }
        }
    }

    log::info!("Exported project {} as txt", project.name);
    Ok(output)
}

#[tauri::command]
fn export_chapter_markdown(_project_path: String, _chapter_id: String) -> Result<String, String> {
    Err("扁平结构不支持章节导出".to_string())
}

// ============ App Entry Point ============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    log::info!("Starting Novel Editor application");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            open_path,
            create_project,
            list_projects,
            get_project_structure,
            delete_project,
            create_chapter,
            delete_chapter,
            rename_chapter,
            create_scene,
            delete_scene,
            rename_scene,
            get_scene_content,
            save_scene_content,
            rename_project,
            toggle_favorite,
            export_project_markdown,
            export_project_txt,
            export_chapter_markdown,
            get_text_stats,
            get_project_stats,
        ])
        .setup(|app| {
            log::info!("Application setup complete");
            let window = app.get_webview_window("main").unwrap();
            window.set_title("Aphelios ɑ").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
