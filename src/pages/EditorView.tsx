import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Input } from '@heroui/react'
import { Milkdown, useEditor, MilkdownProvider } from '@milkdown/react'
import { Crepe } from '@milkdown/crepe'
import { WindowManager } from '../components/WindowManager'
import { Icons } from '../components/Icons'
import { Project, ProjectStructure, Scene, commands } from '../types'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

interface EditorViewProps {
  project: Project
  structure: ProjectStructure | null
  onBack: () => void
  theme: string
  toggleTheme: () => void
  fontSize: number
  lineHeight: number
}

// Milkdown Editor Component
function MilkdownEditor({ 
  content, 
  onChange,
  fontSize,
  lineHeight
}: { 
  content: string
  onChange: (markdown: string) => void
  fontSize: number
  lineHeight: number
}) {
  const prevContentRef = useRef(content)
  
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: content
    })
    
    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          onChange(markdown)
        }
      })
    })
    
    return crepe
  }, [])

  // Update editor content when scene changes
  useEffect(() => {
    if (content !== prevContentRef.current) {
      prevContentRef.current = content
    }
  }, [content])

  return (
    <div 
      className="milkyway"
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight 
      }}
    >
      <Milkdown />
    </div>
  )
}

export function EditorView({ 
  project, 
  structure, 
  onBack, 
  theme, 
  toggleTheme,
  fontSize,
  lineHeight
}: EditorViewProps) {
  // State
  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [totalWordCount, setTotalWordCount] = useState(project.word_count)
  const [showCreateScene, setShowCreateScene] = useState(false)
  const [newSceneTitle, setNewSceneTitle] = useState('')
  const [sceneContent, setSceneContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(sceneContent)
  
  // Initialize scenes from structure
  useEffect(() => {
    if (structure) {
      let allScenes: Scene[] = []
      
      if (structure.chapters && structure.chapters.length > 0) {
        // Handle nested structure
        structure.chapters.forEach(chapter => {
          chapter.scenes.forEach(scene => {
            allScenes.push({
              ...scene,
              title: scene.title
            })
          })
        })
      } else if (structure.scenes) {
        // Handle flat structure
        allScenes = [...structure.scenes]
      }
      
      // Sort by order/name
      allScenes.sort((a, b) => a.order - b.order)
      setScenes(allScenes)
      
      // Auto-select first scene
      if (allScenes.length > 0 && !selectedScene) {
        handleSelectScene(allScenes[0])
      }
    }
  }, [structure])
  
  // Handle scene selection
  const handleSelectScene = async (scene: Scene) => {
    // Save current scene if needed
    if (selectedScene && saveStatus === 'unsaved') {
      await saveSceneContent()
    }
    
    setSelectedScene(scene)
    setSaveStatus('saved')
    
    // Load scene content
    try {
      const content = await commands.getSceneContent(scene.file_path)
      setSceneContent(content.content)
      contentRef.current = content.content
      setWordCount(content.word_count)
    } catch (err) {
      console.error('Failed to load scene content:', err)
      setSceneContent('')
      contentRef.current = ''
      setWordCount(0)
    }
  }
  
  // Save scene content
  const saveSceneContent = useCallback(async () => {
    if (!selectedScene) return
    
    setSaveStatus('saving')
    
    try {
      const newWordCount = await commands.saveSceneContent(
        selectedScene.file_path,
        contentRef.current
      )
      setWordCount(newWordCount)
      setTotalWordCount(prev => prev - wordCount + newWordCount)
      setSaveStatus('saved')
    } catch (err) {
      console.error('Failed to save scene:', err)
      setSaveStatus('unsaved')
    }
  }, [selectedScene, wordCount])
  
  // Auto-save when content changes
  const handleContentChange = useCallback((markdown: string) => {
    contentRef.current = markdown
    setSaveStatus('unsaved')
    
    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSceneContent()
    }, 2000)
  }, [saveSceneContent])
  
  // Cleanup save timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])
  
  // Create new scene
  const handleCreateScene = async () => {
    if (!newSceneTitle.trim() || !project) return
    
    try {
      const newScene = await commands.createScene(
        project.path,
        project.folder_path,
        newSceneTitle
      )
      
      setScenes(prev => [...prev, newScene].sort((a, b) => a.order - b.order))
      setNewSceneTitle('')
      setShowCreateScene(false)
      
      // Select the new scene
      handleSelectScene(newScene)
    } catch (err) {
      console.error('Failed to create scene:', err)
    }
  }
  
  // Delete scene
  const handleDeleteScene = async (scene: Scene) => {
    if (!confirm(`确定要删除 "${scene.title}" 吗？此操作无法撤销。`)) return
    
    try {
      await commands.deleteScene(project.path, scene.id)
      setScenes(prev => prev.filter(s => s.id !== scene.id))
      
      if (selectedScene?.id === scene.id) {
        setSelectedScene(null)
        setSceneContent('')
        contentRef.current = ''
      }
    } catch (err) {
      console.error('Failed to delete scene:', err)
    }
  }
  
  // Export to Markdown
  const handleExport = async () => {
    try {
      const markdown = await commands.exportProjectMarkdown(project.path)
      
      // Create and download file
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export project:', err)
    }
  }
  
  // Rename scene
  const handleRenameScene = async (scene: Scene, newTitle: string) => {
    try {
      const updated = await commands.renameScene(project.path, scene.id, newTitle)
      setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, title: updated.title } : s))
      if (selectedScene?.id === scene.id) {
        setSelectedScene({ ...selectedScene, title: updated.title })
      }
    } catch (err) {
      console.error('Failed to rename scene:', err)
    }
  }
  
  // Get chapter number for display
  const getChapterNumber = (scene: Scene) => {
    const index = scenes.findIndex(s => s.id === scene.id)
    return index + 1
  }
  
  return (
    <>
      <WindowManager title={project.name} />
      
      <div className="h-screen pt-9 gradient-bg relative overflow-hidden">
        {/* Floating Sidebar - Now truly floating/hovering */}
        <div 
          className={`fixed left-4 top-13 bottom-4 glass-card transition-all duration-500 ease-in-out flex flex-col z-50 ${
            sidebarCollapsed ? 'w-12 -translate-x-full opacity-0' : 'w-64 opacity-100 shadow-2xl'
          }`}
        >
          {/* Collapse Button - Repositioned for floating sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="fixed left-4 top-13 w-10 h-10 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 group"
            style={{ 
              opacity: sidebarCollapsed ? 1 : 0,
              pointerEvents: sidebarCollapsed ? 'auto' : 'none',
              left: sidebarCollapsed ? '1rem' : '17rem'
            }}
          >
            <svg 
              className={`w-4 h-4 text-(--novel-text-muted) transition-transform duration-500 ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`} 
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
          
          {/* Sidebar Content */}
          <div className={`flex flex-col h-full ${sidebarCollapsed ? 'items-center px-2' : 'px-4'} py-4`}>
            {/* Back Button */}
            <button
              onClick={onBack}
              className={`flex items-center gap-2 text-(--novel-text-muted) hover:text-(--novel-text-main) transition-colors ${
                sidebarCollapsed ? 'justify-center w-8 h-8' : 'mb-4'
              }`}
              title="返回项目列表"
            >
              {Icons.back()}
              {!sidebarCollapsed && <span className="text-sm">返回</span>}
            </button>
            
            {!sidebarCollapsed && (
              <>
                {/* Project Title */}
                <h2 className="font-serif text-lg font-medium text-(--novel-text-main) mb-4 truncate">
                  {project.name}
                </h2>
                
                {/* Create Scene Button */}
                <button
                  onClick={() => setShowCreateScene(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-(--field-radius) text-sm font-medium mb-4 transition-all hover:brightness-110"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  {Icons.add()}
                  新建章节
                </button>
                
                {/* Scenes List */}
                <div className="flex-1 overflow-y-auto -mx-2 px-2">
                  <div className="space-y-1">
                    {scenes.map((scene) => (
                      <SceneListItem
                        key={scene.id}
                        scene={scene}
                        chapterNumber={getChapterNumber(scene)}
                        isSelected={selectedScene?.id === scene.id}
                        onSelect={() => handleSelectScene(scene)}
                        onRename={(newTitle) => handleRenameScene(scene, newTitle)}
                        onDelete={() => handleDeleteScene(scene)}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Total Word Count */}
                <div className="mt-4 pt-4 border-t border-(--novel-border)">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-(--novel-text-muted)">总字数</span>
                    <span className="font-medium text-(--novel-text-main)">
                      {totalWordCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Immersive Main Editor Area */}
        <main 
          className="h-full overflow-hidden transition-all duration-500"
          style={{ 
            marginLeft: 0,
            marginRight: 0
          }}
        >
          <div className="h-full flex flex-col">
            {/* Editor Container - Now Borderless and Fullscreen */}
            {selectedScene ? (
              <div className="flex-1 overflow-hidden min-h-0 milkyway-container flex flex-col">
                {/* Unified Document Header */}
                <div className="flex flex-col items-center pt-16 pb-8 shrink-0">
                  <div className="text-sm text-(--novel-text-muted) mb-2 opacity-60">
                    第 {getChapterNumber(selectedScene)} 章
                  </div>
                  <EditableTitle 
                    title={selectedScene.title}
                    onSave={(newTitle) => handleRenameScene(selectedScene, newTitle)}
                  />
                  <div className="text-xs text-(--novel-text-muted) mt-2 opacity-50">
                    {wordCount.toLocaleString()} 字
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-[800px] mx-auto min-h-full">
                    <MilkdownProvider>
                      <MilkdownEditor 
                        content={sceneContent}
                        onChange={handleContentChange}
                        fontSize={fontSize}
                        lineHeight={lineHeight}
                      />
                    </MilkdownProvider>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-(--novel-text-muted)">
                <div className="w-16 h-16 rounded-(--radius) bg-(--novel-text-muted)/10 flex items-center justify-center mb-4">
                  {Icons.file()}
                </div>
                <p className="text-lg font-medium mb-2">选择一个章节开始写作</p>
                <p className="text-sm">或创建新章节</p>
              </div>
            )}
          </div>
        </main>
        
        {/* Floating Bottom Toolbar */}
        <div className="floating-toolbar">
          <div className="glass-card px-4 py-2 flex items-center gap-4">
            {/* Word Count */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-(--novel-text-muted)">字数</span>
              <span className="font-medium text-(--novel-text-main)">
                {wordCount.toLocaleString()}
              </span>
            </div>
            
            <div className="w-px h-4 bg-(--novel-border)" />
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 text-sm text-(--novel-text-muted) hover:text-(--novel-text-main) transition-colors"
            >
              {theme === 'dark' ? Icons.light() : Icons.dark()}
              <span className="hidden sm:inline">{theme === 'dark' ? '浅色' : '深色'}</span>
            </button>
            
            <div className="w-px h-4 bg-(--novel-border)" />
            
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-sm text-(--novel-text-muted) hover:text-(--novel-text-main) transition-colors"
            >
              {Icons.share()}
              <span className="hidden sm:inline">导出</span>
            </button>
            
            <div className="w-px h-4 bg-(--novel-border)" />
            
            {/* Save Status */}
            <div className="flex items-center gap-2">
              <div className={`status-dot ${saveStatus === 'saving' ? 'saving' : ''}`} />
              <span className="text-xs text-(--novel-text-muted)">
                {saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '未保存'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Create Scene Modal */}
        {showCreateScene && (
          <>
            <div 
              className="fixed inset-0 z-50" 
              style={{ background: 'rgba(74, 69, 60, 0.4)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowCreateScene(false)}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96">
              <div className="glass-card p-6" style={{ boxShadow: '0 24px 48px rgba(74, 69, 60, 0.2)' }}>
                <h3 className="font-semibold text-lg mb-4 text-(--novel-text-main)">
                  新建章节
                </h3>
                <Input
                  placeholder="章节标题"
                  value={newSceneTitle}
                  onChange={(e) => setNewSceneTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateScene()}
                  className="mb-4"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onPress={() => setShowCreateScene(false)}>
                    取消
                  </Button>
                  <Button 
                    onPress={handleCreateScene}
                    isDisabled={!newSceneTitle.trim()}
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  >
                    创建
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// Scene List Item Component
interface SceneListItemProps {
  scene: Scene
  chapterNumber: number
  isSelected: boolean
  onSelect: () => void
  onRename: (newTitle: string) => void
  onDelete: () => void
}

function SceneListItem({ scene, chapterNumber, isSelected, onSelect, onRename, onDelete }: SceneListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(scene.title)
  
  const handleSave = () => {
    if (editTitle.trim() && editTitle !== scene.title) {
      onRename(editTitle.trim())
    }
    setIsEditing(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(scene.title)
      setIsEditing(false)
    }
  }
  
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-(--field-radius) cursor-pointer transition-all ${
        isSelected 
          ? 'bg-(--accent)/10' 
          : 'hover:bg-black/5'
      }`}
      onClick={onSelect}
    >
      <span className={`chapter-number ${isSelected ? 'active' : ''}`}>
        {chapterNumber.toString().padStart(2, '0')}
      </span>
      
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm bg-white/50 border border-(--novel-border) rounded px-2 py-1 outline-none focus:border-(--accent)"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className={`flex-1 text-sm truncate ${
            isSelected ? 'text-(--novel-text-main) font-medium' : 'text-(--novel-text-muted)'
          }`}>
            {scene.title}
          </span>
          
          {/* Hover Actions */}
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="p-1 rounded hover:bg-black/10 text-(--novel-text-muted)"
            >
              {Icons.edit()}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 rounded hover:bg-red-100 text-red-500"
            >
              {Icons.delete()}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Editable Title Component
interface EditableTitleProps {
  title: string
  onSave: (newTitle: string) => void
}

function EditableTitle({ title, onSave }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  
  useEffect(() => {
    setEditTitle(title)
  }, [title])
  
  const handleSave = () => {
    if (editTitle.trim() && editTitle !== title) {
      onSave(editTitle.trim())
    }
    setIsEditing(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(title)
      setIsEditing(false)
    }
  }
  
  if (isEditing) {
    return (
      <input
        type="text"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-2xl font-serif font-medium text-center bg-transparent border-b-2 border-(--accent) outline-none px-4 py-1 text-(--novel-text-main)"
        autoFocus
      />
    )
  }
  
  return (
    <h1 
      onClick={() => setIsEditing(true)}
      className="text-2xl font-serif font-medium text-center text-(--novel-text-main) cursor-pointer hover:text-(--accent) transition-colors px-4 py-1"
    >
      {title}
    </h1>
  )
}
