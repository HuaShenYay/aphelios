import { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@heroui/react";
import { commands, Project, ProjectStructure } from "./types";
import { ProjectList } from "./pages/ProjectList";
import { EditorView } from "./pages/EditorView";
import { open } from "@tauri-apps/plugin-dialog";

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

function SettingsModal({
  isOpen,
  onClose,
  theme,
  toggleTheme,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  toggleTheme: () => void;
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
          <h3 className="font-serif font-semibold text-lg mb-6 text-(--novel-text-main)">
            系统设置
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-(--novel-text-main)">外观界面</p>
                <p className="text-xs text-(--novel-text-muted)">切换深色或浅色模式</p>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onPress={toggleTheme}
                className="bg-black/5 hover:bg-black/10 rounded-(--field-radius)"
              >
                {theme === "light" ? "🌙 深色" : "☀️ 浅色"}
              </Button>
            </div>

            <div className="pt-4 border-t border-black/5">
              <p className="text-xs text-center text-(--novel-text-muted)">
                Aphelios Novel Editor v1.0.0
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onPress={onClose}
              className="bg-(--novel-primary) text-white rounded-xl px-8"
            >
              完成
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

  // Editor Props (defaults)
  const [fontSize] = useState(16);
  const [lineHeight] = useState(1.6);

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
        title: "选择项目存储位置",
      });
      if (selected && typeof selected === "string") {
        setSelectedFolderPath(selected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const project = await commands.createProject(newProjectName, selectedFolderPath);
      
      newProjectModal.close();
      setNewProjectName("");
      setSelectedFolderPath("");
      await loadProjects();
      handleSelectProject(project);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProject = async (project: Project) => {
    try {
      const structure = await commands.getProjectStructure(project.path);
      setCurrentProject(project);
      setProjectStructure(structure);
      setView("editor");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectPath: string) => {
    if (!confirm("确定要删除这个项目吗？")) return;
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
        />
      ) : null}

      <HeroModal
        isOpen={newProjectModal.isOpen}
        onClose={newProjectModal.close}
        title="新建项目"
        onConfirm={handleCreateProject}
      >
        <div className="space-y-4">
          <Input
            placeholder="项目名称"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
          />
          <div className="space-y-2">
            <p className="text-xs font-medium text-(--novel-text-muted) ml-1">存储位置</p>
            <div 
              onClick={handleSelectFolder}
              className="w-full px-4 py-3 rounded-(--field-radius) cursor-pointer transition-colors border border-black/5 flex items-center justify-between group"
            >
              <span className="text-sm text-(--novel-text-main) truncate max-w-[240px]">
                {selectedFolderPath || "请选择存储文件夹..."}
              </span>
              <span className="text-xs text-(--novel-primary) font-medium group-hover:underline">
                更改
              </span>
            </div>
          </div>
        </div>
      </HeroModal>

      <SettingsModal 
        isOpen={settingsModal.isOpen} 
        onClose={settingsModal.close}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </>
  );
}

export default App;
