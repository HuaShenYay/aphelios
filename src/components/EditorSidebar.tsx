import { useState } from 'react'
import { Project, Scene } from '../types'
import { Icons } from './Icons'
import { SceneListItem } from './SceneListItem'
import { EditableTitle } from './EditableTitle'

interface EditorSidebarProps {
  project: Project
  scenes: Scene[]
  selectedScene: Scene | null
  totalWordCount: number
  isEditing: boolean
  onSelectScene: (scene: Scene) => void
  onRenameScene: (scene: Scene, newTitle: string) => void
  onDeleteScene: (scene: Scene) => void
  onCreateScene: (title: string) => void
  onBack: () => void
  onUpdateProjectName: (newName: string) => void
}

export function EditorSidebar({
  project,
  scenes,
  selectedScene,
  totalWordCount,
  isEditing,
  onSelectScene,
  onRenameScene,
  onDeleteScene,
  onCreateScene,
  onBack,
  onUpdateProjectName
}: EditorSidebarProps) {
  // Local state for sidebar visibility
  const [isCollapsed, setIsCollapsed] = useState(true) // 默认隐藏
  const [isHovering, setIsHovering] = useState(false)
  const [renamingSceneId, setRenamingSceneId] = useState<string | null>(null)
  
  // Create scene state
  const [showCreateScene, setShowCreateScene] = useState(false)
  const [newSceneTitle, setNewSceneTitle] = useState('')
  
  // Calculate visibility
  // 侧边栏可见条件：
  // 1. 未收起 (用户没有手动收起)
  // 2. 鼠标悬停 (用户想要临时查看) - 但编辑时除外
  // 3. 正在重命名场景 (需要保持打开以便输入)
  // 4. 正在创建场景 (需要输入名称)
  // 编辑时自动隐藏：即使悬停也不显示
  const isVisible = (!isCollapsed || isHovering) && !isEditing || renamingSceneId !== null || showCreateScene

  // Handle create scene
  const handleCreateScene = () => {
    if (newSceneTitle.trim()) {
      onCreateScene(newSceneTitle.trim())
      setNewSceneTitle('')
      setShowCreateScene(false)
    }
  }

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateScene()
    } else if (e.key === 'Escape') {
      setShowCreateScene(false)
      setNewSceneTitle('')
    }
  }

  return (
    <>
      {/* Hover Trigger Area - Left edge of screen */}
      <div 
        className="fixed left-0 top-13 bottom-4 w-2 z-40 hover:w-4 transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
      
      {/* Sidebar Container */}
      <div 
        className={`fixed left-4 top-13 bottom-4 glass-card transition-all duration-300 ease-in-out flex flex-col z-50 ${
          isVisible ? 'w-64 opacity-100' : 'w-14 opacity-100'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--novel-border)/50 shrink-0">
          {!isVisible ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-full h-8 text-(--novel-text-muted) hover:text-(--novel-text-main) transition-colors"
              title="返回作品列表"
            >
              {Icons.back()}
            </button>
          ) : (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-(--novel-text-muted) hover:text-(--novel-text-main) transition-colors"
            >
              {Icons.back()}
              <span>返回</span>
            </button>
          )}
          
          {/* Toggle Button */}
          {isVisible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-(--novel-text-muted)"
              title={isCollapsed ? '固定侧边栏' : '收起侧边栏'}
            >
              {isCollapsed ? (
                // Pin icon (when hovering collapsed sidebar)
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                 </svg>
              ) : (
                // Collapse icon
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 12H6M6 12l6-6M6 12l6 6"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Project Title (Visible only when expanded) */}
        {isVisible && (
          <div className="px-4 py-4 shrink-0">
            <EditableTitle
              title={project.name}
              onSave={onUpdateProjectName}
              className="text-lg font-serif font-bold text-(--novel-text-main)"
              inputClassName="text-lg font-serif font-bold text-(--novel-text-main) border-b border-(--accent) w-full"
            />
            <div className="text-xs text-(--novel-text-muted) mt-1 flex justify-between">
               <span>{scenes.length} 个章节</span>
               <span>{totalWordCount} 字</span>
            </div>
          </div>
        )}

        {/* Scene List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-1">
          {isVisible ? (
            <>
              {scenes.map((scene, index) => (
                <SceneListItem
                  key={scene.id}
                  scene={scene}
                  chapterNumber={index + 1}
                  isSelected={selectedScene?.id === scene.id}
                  isRenaming={renamingSceneId === scene.id}
                  onSelect={() => onSelectScene(scene)}
                  onRenameStart={() => setRenamingSceneId(scene.id)}
                  onRenameSave={(newTitle) => {
                    onRenameScene(scene, newTitle)
                    setRenamingSceneId(null)
                  }}
                  onRenameCancel={() => setRenamingSceneId(null)}
                  onDelete={() => onDeleteScene(scene)}
                />
              ))}
              
              {/* Create New Scene Input */}
              {showCreateScene ? (
                <div className="px-3 py-2">
                  <input
                    type="text"
                    value={newSceneTitle}
                    onChange={(e) => setNewSceneTitle(e.target.value)}
                    onKeyDown={handleCreateKeyDown}
                    placeholder="输入章节标题..."
                    className="w-full text-sm bg-white/50 dark:bg-black/20 border border-(--novel-border) rounded px-2 py-1 outline-none focus:border-(--accent)"
                    autoFocus
                    onBlur={() => {
                       if (!newSceneTitle.trim()) setShowCreateScene(false)
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateScene(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-(--novel-text-muted) hover:text-(--novel-text-main) hover:bg-black/5 dark:hover:bg-white/5 rounded-(--field-radius) transition-colors dashed-border mt-2"
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    {Icons.add()}
                  </span>
                  <span>新建章节</span>
                </button>
              )}
            </>
          ) : (
            // Collapsed View: Just icons or numbers?
            // Maybe just show chapter numbers or dots?
            // For now, let's show simple indicators or nothing
            <div className="flex flex-col items-center gap-2 py-2">
               {scenes.map((scene, index) => (
                 <div 
                   key={scene.id}
                   className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium cursor-pointer transition-colors ${
                     selectedScene?.id === scene.id 
                       ? 'bg-(--accent) text-white' 
                       : 'text-(--novel-text-muted) hover:bg-black/5 dark:hover:bg-white/10'
                   }`}
                   onClick={() => onSelectScene(scene)}
                   title={scene.title}
                 >
                   {index + 1}
                 </div>
               ))}
               <button
                 onClick={() => {
                   setIsCollapsed(false)
                   setShowCreateScene(true)
                 }}
                 className="w-8 h-8 flex items-center justify-center rounded-full text-(--novel-text-muted) hover:bg-black/5 dark:hover:bg-white/10"
                 title="新建章节"
               >
                 {Icons.add()}
               </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
