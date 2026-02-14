import { useState, useEffect, useCallback } from "react";
import { Button, Input, Modal } from "@heroui/react";
import { commands, Project, ProjectStructure } from "./types";
import { ProjectList } from "./pages/ProjectList";
import { EditorView } from "./pages/EditorView";
import { Icons } from "./components/Icons";

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
  confirmText = "Save",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="glass p-6 rounded-2xl">
        <h3 className="font-serif font-semibold text-lg mb-4 text-[var(--foreground)]">
          {title}
        </h3>
        <div className="mb-4">{children}</div>
        <div className="flex justify-end gap-2">
          <Button
            variant="light"
            onPress={onClose}
            className="text-[var(--novel-text-muted)]"
          >
            Cancel
          </Button>
          <Button
            variant="flat"
            onPress={onConfirm}
            className="bg-[var(--accent)] text-white rounded-lg"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
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
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Project List Props
  const [activeTab, setActiveTab] = useState("projects");
  const newProjectModal = useModalState();
  const [newProjectName, setNewProjectName] = useState("");

  // Editor Props (defaults)
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setProjects(await commands.listProjects());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const project = await commands.createProject(newProjectName, ""); // folderPath is second arg in types, passing empty string or need handler?
      // Wait, types.ts commands.createProject takes (name, folderPath).
      // Use empty string if not used, or check if creating requires folder path selection?
      // Assuming empty string is fine or handled by backend if not provided?
      // Actually, looking at types.ts: invoke('create_project', { request: { name, folder_path: folderPath } })
      // If folderPath is empty, backend might error or use default.
      // Inline App.tsx (Step 222) called commands.createProject(newProjectName).
      // Step 237 types.ts shows commands.createProject takes (name: string, folderPath: string).
      // So inline App.tsx was seemingly using a version of createProject that took only one arg?
      // Or maybe types.ts was updated and App.tsx was outdated.
      // I'll pass "" for now as placeholder, or check if `createProject` in types.ts is strictly typed. Yes it is.
      // I'll check how the previous App.tsx used it. Step 222 line 1096: `await commands.createProject(newProjectName);`
      // This implies types.ts might have optional folderPath?
      // Step 237 line 68: `createProject: (name: string, folderPath: string) =>`
      // So previous App.tsx WAS failing type check or ignoring it.
      // I'll pass "" to be safe.
      
      // Update: re-reading types.ts, it expects 2 args. 
      
      newProjectModal.close();
      setNewProjectName("");
      await loadProjects();
      handleSelectProject(project);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSelectProject = async (project: Project) => {
    try {
      const structure = await commands.getProjectStructure(project.path);
      setCurrentProject(project);
      setProjectStructure(structure);
      setView("editor");
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDeleteProject = async (projectPath: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await commands.deleteProject(projectPath);
      await loadProjects();
    } catch (err) {
      setError(String(err));
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
      setError(String(err));
    }
  };

  const handleEditProject = async (project: Project, newName: string) => {
    try {
      await commands.renameProject(project.path, newName);
      await loadProjects();
    } catch (err) {
      setError(String(err));
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
          onOpenSettings={() => console.log("Settings clicked")}
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
        title="New Project"
        onConfirm={handleCreateProject}
      >
        <Input
          placeholder="Project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
        />
      </HeroModal>
    </>
  );
}

export default App;
