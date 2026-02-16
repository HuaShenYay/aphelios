// Tauri API Types for Novel Editor

export interface Project {
  id: string;
  name: string;
  path: string;
  folder_path: string;  // User's selected folder for content
  created_at: string;
  updated_at: string;
  word_count: number;
  is_favorite: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
}

export interface Scene {
  id: string;
  title: string;
  order: number;
  file_path: string;
}

export interface ProjectStructure {
  project: Project;
  chapters: Chapter[];
  scenes: Scene[];  // Flat list of scenes from user's folder
}

export interface CreateProjectRequest {
  name: string;
  folder_path: string;
}

export interface CreateChapterRequest {
  project_path: string;
  title: string;
}

export interface CreateSceneRequest {
  project_path: string;
  chapter_id: string;
  title: string;
}

export interface UpdateTitleRequest {
  project_path: string;
  id: string;
  new_title: string;
}

export interface SceneContent {
  content: string;
  word_count: number;
}

export interface TextStats {
  word_count: number;              // 字数（中文字符 + 英文单词）
  char_count: number;              // 字符数（不含空格）
  char_count_with_spaces: number;  // 字符数（含空格）
  paragraph_count: number;         // 段落数
  line_count: number;              // 行数
  reading_time_minutes: number;    // 预计阅读时间（分钟）
}

// Tauri Commands
export const invoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  return tauriInvoke<T>(cmd, args);
};

export const commands = {
  createProject: (name: string, folderPath: string) => 
    invoke<Project>('create_project', { request: { name, folder_path: folderPath } }),
  
  listProjects: () => 
    invoke<Project[]>('list_projects'),

  openPath: (path: string) =>
    invoke<void>('open_path', { path }),
  
  getProjectStructure: (projectPath: string) => 
    invoke<ProjectStructure>('get_project_structure', { projectPath }),
  
  deleteProject: (projectPath: string) => 
    invoke<void>('delete_project', { projectPath }),
  
  createChapter: (projectPath: string, title: string) => 
    invoke<Chapter>('create_chapter', { request: { project_path: projectPath, title } }),
  
  deleteChapter: (projectPath: string, chapterId: string) => 
    invoke<void>('delete_chapter', { projectPath, chapterId }),
  
  renameChapter: (projectPath: string, chapterId: string, newTitle: string) => 
    invoke<Chapter>('rename_chapter', { request: { project_path: projectPath, id: chapterId, new_title: newTitle } }),
  
  createScene: (projectPath: string, folderPath: string, title: string) => 
    invoke<Scene>('create_scene', { request: { project_path: projectPath, folder_path: folderPath, title } }),
  
  deleteScene: (projectPath: string, sceneId: string) => 
    invoke<void>('delete_scene', { projectPath, sceneId }),
  
  renameScene: (projectPath: string, sceneId: string, newTitle: string) => 
    invoke<Scene>('rename_scene', { request: { project_path: projectPath, id: sceneId, new_title: newTitle } }),
  
  getSceneContent: (scenePath: string) => 
    invoke<SceneContent>('get_scene_content', { scenePath }),
  
  saveSceneContent: (scenePath: string, content: string) => 
    invoke<number>('save_scene_content', { scenePath, content }),
  
  renameProject: (projectPath: string, newName: string) => 
    invoke<Project>('rename_project', { projectPath, newName }),
  
  exportProjectMarkdown: (projectPath: string) => 
    invoke<string>('export_project_markdown', { projectPath }),
  
  exportProjectTxt: (projectPath: string) => 
    invoke<string>('export_project_txt', { projectPath }),
  
  exportChapterMarkdown: (projectPath: string, chapterId: string) => 
    invoke<string>('export_chapter_markdown', { projectPath, chapterId }),
  
  toggleFavorite: (projectPath: string) => 
    invoke<Project>('toggle_favorite', { projectPath }),
  
  getTextStats: (content: string) => 
    invoke<TextStats>('get_text_stats', { content }),
  
  getProjectStats: (projectPath: string) => 
    invoke<TextStats>('get_project_stats', { projectPath }),
};
