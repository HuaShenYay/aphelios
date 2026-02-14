import { Spinner, Button, Input, ButtonGroup } from "@heroui/react";
import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { FolderOpen, TrashBin } from "@gravity-ui/icons";
import { WindowManager } from "../components/WindowManager";
import { Sidebar } from "../components/Sidebar";
import { Icons } from "../components/Icons";
import { getBookCover } from "../utils/helpers";
import { Project } from "../types";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (path: string) => void;
  loading: boolean;
  onOpenSettings: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleFavorite: (project: Project) => void;
  onEditProject?: (project: Project, newName: string) => void;
}

const coverStyles = [
  { id: "classic", name: "经典", gradient: "from-amber-700 to-stone-900" },
  { id: "ocean", name: "海洋", gradient: "from-blue-600 to-indigo-900" },
  { id: "forest", name: "森林", gradient: "from-green-700 to-emerald-900" },
  { id: "sunset", name: "日落", gradient: "from-orange-600 to-rose-900" },
  { id: "purple", name: "紫罗兰", gradient: "from-violet-700 to-purple-900" },
];

export function ProjectList({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  loading,
  onOpenSettings,
  activeTab,
  onTabChange,
  onToggleFavorite,
  onEditProject,
}: ProjectListProps) {
  // View mode: 'all' | 'recent' | 'favorites'
  const [viewMode, setViewMode] = useState<"all" | "recent" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    project: Project | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, project: null });

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    project: Project | null;
    name: string;
    coverIndex: number;
  }>({ isOpen: false, project: null, name: "", coverIndex: 0 });

  const handleContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      project,
    });
  };

  const handleContextMenuAction = (key: React.Key) => {
    if (!contextMenu.project) return;
    if (key === "openFolder") {
      // Open project folder - use native method
      open(contextMenu.project.folder_path);
    } else if (key === "edit") {
      // Open edit modal
      const savedCover = localStorage.getItem(
        `project_cover_${contextMenu.project.id}`,
      );
      setEditModal({
        isOpen: true,
        project: contextMenu.project,
        name: contextMenu.project.name,
        coverIndex: savedCover ? parseInt(savedCover) : 0,
      });
    } else if (key === "favorite") onToggleFavorite(contextMenu.project);
    else if (key === "delete") onDeleteProject(contextMenu.project.path);
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleSaveEdit = () => {
    if (editModal.project && editModal.name.trim()) {
      localStorage.setItem(
        `project_cover_${editModal.project.id}`,
        editModal.coverIndex.toString(),
      );
      if (onEditProject) {
        onEditProject(editModal.project, editModal.name);
      }
    }
    setEditModal({ isOpen: false, project: null, name: "", coverIndex: 0 });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.isOpen]);

  const recentLimit = 5;
  const filteredProjects = (() => {
    let result = projects;

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (viewMode === "favorites")
      return result.filter((project) => project.is_favorite);
    if (viewMode === "recent") return result.slice(0, recentLimit);
    return result;
  })();

  const getTitle = () => {
    if (viewMode === "favorites") return "我的收藏";
    if (viewMode === "recent") return "最近项目";
    return "作品集";
  };

  const getSubtitle = () => {
    const count = filteredProjects.length;
    if (viewMode === "favorites") return `共 ${count} 个收藏项目`;
    if (viewMode === "recent") return `最近 ${count} 个项目`;
    return `共 ${count} 本`;
  };

  return (
    <>
      <WindowManager title="Aphelios" />
      <div className="flex h-screen min-h-screen pt-9 gradient-bg">
        <Sidebar
          onOpenSettings={onOpenSettings}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Glass Header */}
          <header className="h-16 flex items-center justify-between px-8 shrink-0 glass-card mx-4 mt-4 mb-2 z-10 transition-all duration-300">
            <div className="flex-1 max-w-lg">
              {/* Optional: Add search back here if needed, or keep it as is */}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center transition-all duration-300 ${isSearchVisible ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"}`}
              >
                <Input
                  placeholder="搜索项目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-(--field-background)/50 backdrop-blur-sm rounded-[var(--field-radius)] pl-4"
                />
              </div>

              <Button
                isIconOnly
                variant="ghost"
                onPress={() => setIsSearchVisible(!isSearchVisible)}
                className={`rounded-full ${isSearchVisible ? "bg-(--novel-primary)/10 text-(--novel-primary)" : ""}`}
              >
                {Icons.search()}
              </Button>

              <button
                onClick={onCreateProject}
                className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all hover:brightness-110 active:scale-95 shadow-sm ml-2"
                style={{
                  background: "var(--novel-primary)",
                  color: "#FFFFFF",
                }}
              >
                <span className="text-lg leading-none">+</span>
                新建项目
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
              {/* Portfolio Header with Toggle */}
              <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2
                    className="text-4xl font-serif font-medium tracking-tight mb-3"
                    style={{ color: "var(--novel-text-main)" }}
                  >
                    {getTitle()}
                  </h2>
                  <p
                    className="text-base font-light tracking-wide"
                    style={{ color: "var(--novel-text-muted)" }}
                  >
                    {getSubtitle()}
                  </p>
                </div>

                {/* View Mode Toggle - Moved here */}
                <div className="flex bg-(--novel-primary)/5 p-1 rounded-full backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode("all")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      viewMode === "all"
                        ? "bg-(--surface) shadow-sm text-(--novel-text-main)"
                        : "text-(--novel-text-muted) hover:text-(--novel-text-main)"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setViewMode("recent")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      viewMode === "recent"
                        ? "bg-(--surface) shadow-sm text-(--novel-text-main)"
                        : "text-(--novel-text-muted) hover:text-(--novel-text-main)"
                    }`}
                  >
                    最近
                  </button>
                  <button
                    onClick={() => setViewMode("favorites")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      viewMode === "favorites"
                        ? "bg-(--surface) shadow-sm text-(--novel-text-main)"
                        : "text-(--novel-text-muted) hover:text-(--novel-text-main)"
                    }`}
                  >
                    收藏
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Spinner size="lg" className="text-(--accent)" />
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="glass-card p-8 flex flex-col items-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(122, 107, 79, 0.1)" }}
                    >
                      {Icons.folder()}
                    </div>
                    <h3
                      className="font-semibold text-xl mb-2"
                      style={{ color: "var(--novel-text-main)" }}
                    >
                      {searchQuery
                        ? "未找到匹配项目"
                        : viewMode === "favorites"
                          ? "暂无收藏"
                          : "暂无项目"}
                    </h3>
                    <p
                      className="text-sm mb-6 text-center max-w-xs"
                      style={{ color: "var(--novel-text-muted)" }}
                    >
                      {searchQuery
                        ? `尝试换个关键词搜索 "${searchQuery}"`
                        : viewMode === "favorites"
                          ? "点击星标收藏项目"
                          : "创建你的第一个项目开始写作之旅"}
                    </p>
                    {!searchQuery && viewMode !== "favorites" && (
                      <button
                        onClick={onCreateProject}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 hover:shadow-lg"
                        style={{
                          background: "var(--accent)",
                          color: "var(--accent-foreground)",
                        }}
                      >
                        {Icons.add()}
                        创建第一个项目
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  {/* New Manuscript Placeholder Card */}
                  <div
                    className="group cursor-pointer flex flex-col"
                    onClick={onCreateProject}
                  >
                    <div className="aspect-3/4 border-2 border-dashed border-(--novel-border) rounded-[var(--radius)] flex flex-col items-center justify-center transition-all duration-300 group-hover:border-(--novel-primary) group-hover:bg-[rgba(107,127,127,0.05)]">
                      <div className="w-12 h-12 rounded-full bg-(--novel-primary) text-white flex items-center justify-center shadow-lg mb-4 transition-transform group-hover:scale-110">
                        <span className="text-2xl font-light">+</span>
                      </div>
                      <span className="font-serif text-(--novel-text-muted) group-hover:text-(--novel-primary) transition-colors">
                        新建手稿
                      </span>
                    </div>
                  </div>

                  {filteredProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className="group cursor-pointer flex flex-col"
                      onClick={() => onSelectProject(project)}
                      onContextMenu={(e) => handleContextMenu(e, project)}
                    >
                      {/* White Card Container */}
                      <div className="white-card mb-5 aspect-3/4 relative">
                        {/* Favorite Badge */}
                        {project.is_favorite && (
                          <div className="absolute top-4 right-4 z-20">
                            <div className="p-1.5 bg-(--surface)/90 backdrop-blur-sm rounded-full shadow-sm text-amber-500">
                              {Icons.star()}
                            </div>
                          </div>
                        )}

                        {/* Book Cover */}
                        <div className="book-frame w-full h-full shadow-sm group-hover:shadow-md transition-shadow">
                          <img
                            alt={project.name}
                            className="w-full h-full object-cover"
                            src={(() => {
                              const saved = localStorage.getItem(`project_cover_${project.id}`);
                              const coverIdx = saved ? parseInt(saved) : index;
                              return getBookCover(coverIdx);
                            })()}
                          />
                          {/* Gradient Overlay for Mood */}
                          <div className="absolute inset-0 bg-black/10 mix-blend-multiply pointer-events-none" />
                        </div>
                      </div>

                      {/* Project Info Below Card - Typography Refined */}
                      <div className="text-center px-1">
                        <h3
                          className="font-serif text-lg font-medium mb-2 line-clamp-1 group-hover:text-(--novel-primary) transition-colors"
                          style={{ color: "var(--novel-text-main)" }}
                        >
                          {project.name}
                        </h3>
                        <div
                          className="flex items-center justify-center gap-3 text-[10px] uppercase font-medium tracking-wider"
                          style={{ color: "var(--novel-text-accent)" }}
                        >
                          <span>
                            {project.word_count.toLocaleString()} 字
                          </span>
                          <span className="opacity-50">•</span>
                          <span>
                            {project.updated_at ? "刚刚" : "昨天"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Click Context Menu */}
        {contextMenu.isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() =>
                setContextMenu((prev) => ({ ...prev, isOpen: false }))
              }
            />
            <div
              className="fixed z-50 glass rounded-[1.5rem] border border-(--glass-border) py-1.5 min-w-[200px] overflow-hidden"
              style={{
                top: contextMenu.position.y,
                left: contextMenu.position.x,
                boxShadow: "0 12px 40px rgba(74, 69, 60, 0.12)",
              }}
            >
              <button
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-(--novel-text-main) hover:bg-black/5 transition-colors"
                onClick={() => handleContextMenuAction("openFolder")}
              >
                <FolderOpen className="w-4 h-4 shrink-0 text-(--novel-text-muted)" />
                打开项目文件夹
              </button>
              <button
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-(--novel-text-main) hover:bg-black/5 transition-colors"
                onClick={() => handleContextMenuAction("edit")}
              >
                <span className="w-4 h-4 shrink-0 text-(--novel-text-muted)">
                  {Icons.edit()}
                </span>
                修改项目
              </button>
              <button
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-(--novel-text-main) hover:bg-black/5 transition-colors"
                onClick={() => handleContextMenuAction("favorite")}
              >
                <span className="w-4 h-4 shrink-0 text-yellow-500">
                  {contextMenu.project?.is_favorite
                    ? Icons.star()
                    : Icons.starOutline()}
                </span>
                {contextMenu.project?.is_favorite ? "取消收藏" : "收藏"}
              </button>
              <button
                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                onClick={() => handleContextMenuAction("delete")}
              >
                <TrashBin className="w-4 h-4 shrink-0" />
                删除项目
              </button>
            </div>
          </>
        )}

        {/* Edit Project Modal */}
        {editModal.isOpen && (
          <>
            <div
              className="fixed inset-0 z-50"
              style={{
                background: "rgba(74, 69, 60, 0.4)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() =>
                setEditModal({
                  isOpen: false,
                  project: null,
                  name: "",
                  coverIndex: 0,
                })
              }
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] max-h-[80vh] overflow-auto">
              <div
                className="glass-card p-6"
                style={{ boxShadow: "0 24px 48px rgba(74, 69, 60, 0.2)" }}
              >
                <h3
                  className="font-semibold text-xl mb-4"
                  style={{ color: "var(--novel-text-main)" }}
                >
                  修改项目
                </h3>

                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium text-(--novel-text-main) mb-2">
                      项目名称
                    </label>
                    <Input
                      value={editModal.name}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="输入项目名称"
                    />
                  </div>

                  {/* Cover Style */}
                  <div>
                    <label className="block text-sm font-medium text-(--novel-text-main) mb-3">
                      封面样式
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {coverStyles.map((style, index) => (
                        <button
                          key={style.id}
                          onClick={() =>
                            setEditModal((prev) => ({
                              ...prev,
                              coverIndex: index,
                            }))
                          }
                          className={`relative aspect-3/4 rounded-lg overflow-hidden transition-all ${
                            editModal.coverIndex === index
                              ? "ring-2 ring-[var(--accent)] scale-105"
                              : "hover:scale-102 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-(--novel-text-muted) mt-2 text-center">
                      {coverStyles[editModal.coverIndex].name}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onPress={() =>
                      setEditModal({
                        isOpen: false,
                        project: null,
                        name: "",
                        coverIndex: 0,
                      })
                    }
                  >
                    取消
                  </Button>
                  <Button
                    className="bg-(--novel-primary) text-white"
                    onPress={handleSaveEdit}
                    isDisabled={!editModal.name.trim()}
                  >
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
