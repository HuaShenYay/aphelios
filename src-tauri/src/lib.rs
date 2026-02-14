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

// ============ Helper Functions ============

fn get_projects_dir() -> PathBuf {
    let docs_dir = dirs::document_dir().unwrap_or_else(|| PathBuf::from("."));
    let projects_dir = docs_dir.join("NovelEditor").join("projects");
    if !projects_dir.exists() {
        fs::create_dir_all(&projects_dir).ok();
    }
    projects_dir
}

fn get_project_metadata_path(project_path: &str) -> PathBuf {
    PathBuf::from(project_path).join("project.json")
}

fn read_project_metadata(project_path: &str) -> Option<Project> {
    let path = get_project_metadata_path(project_path);
    if path.exists() {
        let content = fs::read_to_string(path).ok()?;
        serde_json::from_str(&content).ok()
    } else {
        None
    }
}

fn write_project_metadata(project: &Project) -> Result<(), String> {
    let path = get_project_metadata_path(&project.path);
    let content = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
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
        paths.sort_by_key(|p| p.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string());

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

fn count_words(content: &str) -> u32 {
    let mut count = 0;
    let mut in_word = false;
    for c in content.chars() {
        if c.is_alphanumeric() {
            // CJK characters are counted individually
            if (c >= '\u{4e00}' && c <= '\u{9fff}') || 
               (c >= '\u{3400}' && c <= '\u{4dbf}') ||
               (c >= '\u{f900}' && c <= '\u{faff}') {
                count += 1;
                in_word = false;
            } else {
                // ASCII words are counted as one unit
                if !in_word {
                    count += 1;
                    in_word = true;
                }
            }
        } else {
            in_word = false;
        }
    }
    count
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
fn create_project(request: CreateProjectRequest) -> Result<Project, String> {
    let projects_dir = get_projects_dir();
    let project_id = Uuid::new_v4().to_string();
    let project_path = projects_dir.join(&project_id);

    fs::create_dir_all(&project_path).map_err(|e| e.to_string())?;

    let folder_path = PathBuf::from(&request.folder_path);
    if !folder_path.exists() {
        fs::remove_dir_all(&project_path).ok();
        return Err("指定的文件夹不存在".to_string());
    }
    if !folder_path.is_dir() {
        fs::remove_dir_all(&project_path).ok();
        return Err("指定的路径不是一个文件夹".to_string());
    }

    let now = chrono::Utc::now().to_rfc3339();

    let project = Project {
        id: project_id.clone(),
        name: request.name,
        path: project_path.to_string_lossy().to_string(),
        folder_path: request.folder_path,
        created_at: now.clone(),
        updated_at: now,
        word_count: 0,
        is_favorite: false,
    };

    write_project_metadata(&project)?;

    log::info!(
        "Created project: {} with folder: {}",
        project.name,
        project.folder_path
    );

    Ok(project)
}

#[tauri::command]
fn list_projects() -> Result<Vec<Project>, String> {
    let projects_dir = get_projects_dir();
    let mut projects: Vec<Project> = Vec::new();

    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(project) = read_project_metadata(&path.to_string_lossy()) {
                    let word_count = count_words_in_project(&project);
                    projects.push(Project {
                        word_count,
                        ..project
                    });
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
    let project =
        read_project_metadata(&project_path).ok_or_else(|| "Project not found".to_string())?;

    let scenes = scan_scenes_from_folder(&project.folder_path);
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

    let initial_content = format!("# {}\n\n", request.title);
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

    let projects_dir = get_projects_dir();
    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            let project_path = entry.path();
            if project_path.is_dir() {
                if let Some(mut project) = read_project_metadata(&project_path.to_string_lossy()) {
                    if scene_path.starts_with(&project.folder_path) {
                        project.updated_at = chrono::Utc::now().to_rfc3339();
                        write_project_metadata(&project).ok();
                        break;
                    }
                }
            }
        }
    }

    log::info!("Saved scene: {} ({} words)", scene_path, word_count);

    Ok(word_count)
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
        .invoke_handler(tauri::generate_handler![
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
        ])
        .setup(|app| {
            log::info!("Application setup complete");
            let window = app.get_webview_window("main").unwrap();
            window.set_title("Novel Editor").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
