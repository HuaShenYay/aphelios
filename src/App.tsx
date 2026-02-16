import { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@heroui/react";
import { open } from "@tauri-apps/plugin-dialog";
import { commands, Project, ProjectStructure } from "./types";
import { ProjectList } from "./pages/ProjectList";
import { EditorView } from "./pages/EditorView";
import { GlobalSettings } from "./components/GlobalSettings";

// Hooks
function useTheme() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
    document.documentElement.setAttribute("data-theme", saved);
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.documentElement.setAttribute("data-theme", newTheme);
  };
  return { theme, toggleTheme };
}

function useModalState() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}

function HeroModal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "保存",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
}) {
  if (!isOpen) return null;
  return (
    <>
      <div 
        className="fixed inset-0 z-100 bg-black/20 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-101 w-full max-w-sm px-4">
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-(--radius) shadow-2xl border border-white/50">
          <h3 className="font-serif font-semibold text-lg mb-4 text-(--novel-text-main)">
            {title}
          </h3>
          <div className="mb-6">{children}</div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onPress={onClose}
              className="text-(--novel-text-muted)"
            >
              取消
            </Button>
            <Button
              onPress={onConfirm}
              className="bg-(--novel-primary) text-white rounded-(--field-radius)"
            >
{/* ... */}
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Main App
function App() {
  const [view, setView] = useState<"list" | "editor">("list");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectStructure, setProjectStructure] =
    useState<ProjectStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  // Project List Props
  const [activeTab, setActiveTab] = useState("projects");
  const newProjectModal = useModalState();
  const settingsModal = useModalState();
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedFolderPath, setSelectedFolderPath] = useState("");

  // Editor Settings (with localStorage persistence)
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved ? parseInt(saved) : 16;
  });
  const [lineHeight, setLineHeight] = useState(() => {
    const saved = localStorage.getItem("lineHeight");
    return saved ? parseFloat(saved) : 1.6;
  });
  const [autoSaveInterval, setAutoSaveInterval] = useState(() => {
    const saved = localStorage.getItem("autoSaveInterval");
    return saved ? parseInt(saved) : 10;
  });
  const [defaultFolder, setDefaultFolder] = useState(() => {
    return localStorage.getItem("defaultFolder") || "";
  });

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("lineHeight", lineHeight.toString());
  }, [lineHeight]);

  useEffect(() => {
    localStorage.setItem("autoSaveInterval", autoSaveInterval.toString());
  }, [autoSaveInterval]);

  // 当新建作品弹窗打开时，如果没有选择路径且有默认路径，则使用默认路径
  useEffect(() => {
    if (newProjectModal.isOpen && !selectedFolderPath && defaultFolder) {
      setSelectedFolderPath(defaultFolder);
    }
  }, [newProjectModal.isOpen, defaultFolder, selectedFolderPath]);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setProjects(await commands.listProjects());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择作品存储位置",
      });
      if (selected && typeof selected === "string") {
        setSelectedFolderPath(selected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert("请输入作品名称");
      return;
    }
    if (!selectedFolderPath) {
      alert("请选择存储文件夹");
      return;
    }
    try {
      console.log("[创建作品] 开始创建:", newProjectName, "在:", selectedFolderPath);
      const project = await commands.createProject(newProjectName, selectedFolderPath);
      console.log("[创建作品] 返回的project:", project);
      
      newProjectModal.close();
      setNewProjectName("");
      setSelectedFolderPath("");
      
      // 等待一下确保文件系统操作完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await loadProjects();
      console.log("[创建作品] 准备进入编辑器, project:", project);
      handleSelectProject(project);
    } catch (err) {
      console.error("[创建作品] 失败:", err);
      alert(`创建失败: ${err}`);
    }
  };

  const handleSelectProject = async (project: Project) => {
    try {
      console.log("[选择项目] 获取结构, path:", project.path, "folder:", project.folder_path);
      const structure = await commands.getProjectStructure(project.path);
      console.log("[选择项目] 获取到的结构:", structure);
      setCurrentProject(project);
      setProjectStructure(structure);
      setView("editor");
    } catch (err) {
      console.error("[选择项目] 失败:", err);
    }
  };

  const handleDeleteProject = async (projectPath: string) => {
    if (!confirm("确定要删除这个作品吗？")) return;
    try {
      await commands.deleteProject(projectPath);
      await loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBack = () => {
    setView("list");
    setCurrentProject(null);
    setProjectStructure(null);
    loadProjects();
  };

  const handleToggleFavorite = async (project: Project) => {
    try {
      await commands.toggleFavorite(project.path);
      await loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProject = async (project: Project, newName: string) => {
    try {
      await commands.renameProject(project.path, newName);
      await loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {view === "list" ? (
        <ProjectList
          projects={projects}
          onSelectProject={handleSelectProject}
          onCreateProject={newProjectModal.open}
          onDeleteProject={handleDeleteProject}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={settingsModal.open}
          onToggleFavorite={handleToggleFavorite}
          onEditProject={handleEditProject}
        />
      ) : currentProject ? (
        <EditorView
          project={currentProject}
          structure={projectStructure}
          onBack={handleBack}
          theme={theme}
          toggleTheme={toggleTheme}
          fontSize={fontSize}
          lineHeight={lineHeight}
          autoSaveInterval={autoSaveInterval}
        />
      ) : null}

      <HeroModal
        isOpen={newProjectModal.isOpen}
        onClose={() => {
          newProjectModal.close();
          setNewProjectName("");
          setSelectedFolderPath("");
        }}
        title="新建作品"
        onConfirm={handleCreateProject}
        confirmText="创建"
      >
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-(--novel-text-muted) ml-1 block mb-2">作品名称</label>
            <Input
              placeholder="输入作品名称"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--novel-text-muted) ml-1 block mb-2">存储位置</label>
            <div className="flex gap-2">
              <div 
                className="flex-1 px-4 py-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between hover:bg-(--novel-primary)/5"
                style={{ background: 'var(--surface-secondary)' }}
                onClick={handleSelectFolder}
              >
                <span className="text-sm text-(--novel-text-muted) truncate max-w-[180px]">
                  {selectedFolderPath || "请选择存储文件夹..."}
                </span>
              </div>
              <Button
                variant="secondary"
                onPress={handleSelectFolder}
                className="bg-(--accent)/10 text-(--accent) rounded-xl"
              >
                选择
              </Button>
            </div>
          </div>
        </div>
      </HeroModal>

      <GlobalSettings 
        isOpen={settingsModal.isOpen} 
        onClose={settingsModal.close}
        theme={theme}
        toggleTheme={toggleTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        autoSaveInterval={autoSaveInterval}
        setAutoSaveInterval={setAutoSaveInterval}
        defaultFolder={defaultFolder}
        setDefaultFolder={setDefaultFolder}
      />
    </>
  );
}

export default App;
