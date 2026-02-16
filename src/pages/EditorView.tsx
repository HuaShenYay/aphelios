import { useState, useEffect, useCallback, useRef } from 'react'
import { Milkdown, useEditor, useInstance, MilkdownProvider } from '@milkdown/react'
import { replaceAll } from '@milkdown/utils'
import { Crepe } from '@milkdown/crepe'
import { WindowManager } from '../components/WindowManager'
import { Icons } from '../components/Icons'
import { EditorSidebar } from '../components/EditorSidebar'
import { EditableTitle } from '../components/EditableTitle'
import { Project, ProjectStructure, Scene, TextStats, commands } from '../types'
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
  autoSaveInterval: number
}

// Milkdown Editor Component
function MilkdownEditor({ 
  content, 
  onChange,
  fontSize,
  lineHeight,
  onFocus,
  onBlur
}: { 
  content: string
  onChange: (markdown: string) => void
  fontSize: number
  lineHeight: number
  onFocus?: () => void
  onBlur?: () => void
}) {
  const [isLoading, getEditor] = useInstance()
  const prevContentRef = useRef(content)
  const isExternalChangeRef = useRef(false)
  
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: content
    })
    
    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown, prevMarkdown) => {
        // Only trigger onChange if this is NOT an external change
        if (!isExternalChangeRef.current && markdown !== prevMarkdown) {
          onChange(markdown)
        }
        isExternalChangeRef.current = false
      })
    })
    
    return crepe
  }, [])

  // Update editor content when it changes externally (e.g., scene change)
  useEffect(() => {
    if (!isLoading && content !== prevContentRef.current) {
      const editor = getEditor()
      if (editor) {
        isExternalChangeRef.current = true
        editor.action(replaceAll(content))
      }
      prevContentRef.current = content
    }
  }, [content, isLoading, getEditor])

  return (
    <div 
      className="milkyway"
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={0}
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
  lineHeight,
  autoSaveInterval
}: EditorViewProps) {
  // State
  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)

  const [wordCount, setWordCount] = useState(0)
  const [totalWordCount, setTotalWordCount] = useState(project.word_count)
  const [sceneContent, setSceneContent] = useState('')
  const [textStats, setTextStats] = useState<TextStats>({
    word_count: 0,
    char_count: 0,
    char_count_with_spaces: 0,
    paragraph_count: 0,
    line_count: 0,
    reading_time_minutes: 0,
  })
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(sceneContent)
  const saveStatusRef = useRef(saveStatus)
  const selectedSceneRef = useRef<Scene | null>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  
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

  useEffect(() => {
    saveStatusRef.current = saveStatus
  }, [saveStatus])

  useEffect(() => {
    selectedSceneRef.current = selectedScene
  }, [selectedScene])
  
  // Handle back with auto-save
  const handleBack = async () => {
    if (selectedScene && saveStatus === 'unsaved') {
      await saveSceneContent()
    }
    onBack()
  }

  // Handle scene selection
  const handleSelectScene = async (scene: Scene) => {
    // Save current scene if needed
    if (selectedScene && saveStatus === 'unsaved') {
      await saveSceneContent()
    }
    
    // Clear content first to avoid flashing old content
    setSceneContent('')
    contentRef.current = ''
    
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
  
  // Update text stats when content changes
  const updateTextStats = useCallback(async (content: string) => {
    try {
      const stats = await commands.getTextStats(content)
      setTextStats(stats)
      setWordCount(stats.word_count)
    } catch (err) {
      console.error('Failed to get text stats:', err)
    }
  }, [])
  
  // Auto-save when content changes
  const handleContentChange = useCallback((markdown: string) => {
    contentRef.current = markdown
    setSaveStatus('unsaved')
    
    // Update stats immediately
    updateTextStats(markdown)
    
    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSceneContent()
    }, Math.max(500, autoSaveInterval * 1000))
  }, [saveSceneContent, autoSaveInterval, updateTextStats])
  
  // Cleanup save timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (saveStatusRef.current === 'unsaved' && selectedSceneRef.current) {
        commands.saveSceneContent(
          selectedSceneRef.current.file_path,
          contentRef.current
        ).catch(() => {})
      }
    }
  }, [])
  
  // Create new scene
  const handleCreateScene = async (title: string) => {
    if (!title.trim() || !project) return
    
    try {
      const newScene = await commands.createScene(
        project.path,
        project.folder_path,
        title
      )
      
      setScenes(prev => [...prev, newScene].sort((a, b) => a.order - b.order))
      
      // Select the new scene
      handleSelectScene(newScene)
    } catch (err) {
      console.error('Failed to create scene:', err)
    }
  }

  // Update project name
  const handleUpdateProjectName = async (newName: string) => {
    try {
      const updatedProject = await commands.renameProject(project.path, newName)
      // Note: In a real app we might need to update the project state in parent component
      // For now we just log it or maybe we should have a way to update project prop?
      // Since project is a prop, we can't update it directly.
      // However, we can at least show it updated in the UI if we had local state for it,
      // but EditorSidebar takes project prop.
      // This might require a callback to parent or reloading.
      // For now let's assume the command works and maybe we can't reflect it immediately 
      // without parent update.
      console.log('Project renamed to:', updatedProject.name)
    } catch (err) {
      console.error('Failed to rename project:', err)
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
        <EditorSidebar
          project={project}
          scenes={scenes}
          selectedScene={selectedScene}
          totalWordCount={totalWordCount}
          isEditing={isEditing}
          onSelectScene={handleSelectScene}
          onRenameScene={handleRenameScene}
          onDeleteScene={handleDeleteScene}
          onCreateScene={handleCreateScene}
          onBack={handleBack}
          onUpdateProjectName={handleUpdateProjectName}
        />
        
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
                  <div 
                    className="max-w-[800px] mx-auto min-h-full"
                  >
                    <MilkdownProvider>
                      <MilkdownEditor
                        content={sceneContent}
                        onChange={handleContentChange}
                        fontSize={fontSize}
                        lineHeight={lineHeight}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
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
            {/* Word Count with Tooltip */}
            <div className="relative group">
              <div className="flex items-center gap-1.5 text-sm cursor-pointer">
                <span className="text-(--novel-text-muted)">字数</span>
                <span className="font-medium text-(--novel-text-main)">
                  {textStats.word_count.toLocaleString()}
                </span>
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-3 px-5 py-4 text-xs bg-(--surface) border border-(--novel-border) rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                <div className="space-y-2">
                  <div className="flex justify-between gap-6">
                    <span className="text-(--novel-text-muted)">字符（不含空格）</span>
                    <span className="font-medium text-(--novel-text-main)">{textStats.char_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-(--novel-text-muted)">字符（含空格）</span>
                    <span className="font-medium text-(--novel-text-main)">{textStats.char_count_with_spaces.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-(--novel-text-muted)">段落</span>
                    <span className="font-medium text-(--novel-text-main)">{textStats.paragraph_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-(--novel-text-muted)">行数</span>
                    <span className="font-medium text-(--novel-text-main)">{textStats.line_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-6 pt-1 border-t border-(--novel-border)/30">
                    <span className="text-(--novel-text-muted)">预计阅读时间</span>
                    <span className="font-medium text-(--novel-text-main)">{textStats.reading_time_minutes} 分钟</span>
                  </div>
                </div>
              </div>
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

      </div>
    </>
  )
}


