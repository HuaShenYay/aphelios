import { useState, useEffect } from 'react'
import { Button, Input } from '@heroui/react'
import { WindowManager } from '../components/WindowManager'
import { Project } from '../types'

interface ProjectEditProps {
  project: Project
  onSave: (project: Project) => void
  onCancel: () => void
}

const coverStyles = [
  { id: 'classic', name: '经典', gradient: 'from-amber-700 to-stone-900' },
  { id: 'ocean', name: '海洋', gradient: 'from-blue-600 to-indigo-900' },
  { id: 'forest', name: '森林', gradient: 'from-green-700 to-emerald-900' },
  { id: 'sunset', name: '日落', gradient: 'from-orange-600 to-rose-900' },
  { id: 'purple', name: '紫罗兰', gradient: 'from-violet-700 to-purple-900' },
  { id: 'rose', name: '玫瑰', gradient: 'from-pink-600 to-rose-800' },
  { id: 'sky', name: '天空', gradient: 'from-sky-500 to-blue-800' },
  { id: 'mint', name: '薄荷', gradient: 'from-teal-500 to-cyan-800' },
  { id: 'crimson', name: '绯红', gradient: 'from-red-700 to-slate-900' },
  { id: 'slate', name: '石板', gradient: 'from-slate-600 to-slate-900' },
]

export function ProjectEdit({ project, onSave, onCancel }: ProjectEditProps) {
  const [name, setName] = useState(project.name)
  const [selectedCover, setSelectedCover] = useState(0)

  // Find matching cover style based on project or use default
  useEffect(() => {
    // Try to match by checking stored cover style index
    const storedIndex = localStorage.getItem(`project_cover_${project.id}`)
    if (storedIndex) {
      setSelectedCover(parseInt(storedIndex))
    }
  }, [project.id])

  const handleSave = () => {
    // Save cover style preference
    localStorage.setItem(`project_cover_${project.id}`, selectedCover.toString())
    
    onSave({
      ...project,
      name,
    })
  }

  return (
    <>
      <WindowManager title="修改作品" />
      <div className="flex h-screen bg-[var(--novel-bg-paper)] pt-9">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl text-[var(--novel-text-main)] mb-2">
                修改作品
              </h1>
              <p className="text-[var(--novel-text-muted)]">
                自定义你的作品信息
              </p>
            </div>

            <div className="space-y-8">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--novel-text-main)] mb-2">
                  作品名称
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入作品名称"
                  className="text-lg bg-white border-black/10"
                />
              </div>

              {/* Cover Style */}
              <div>
                <label className="block text-sm font-medium text-[var(--novel-text-main)] mb-3">
                  封面样式
                </label>
                <div className="grid grid-cols-5 gap-4">
                  {coverStyles.map((style, index) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedCover(index)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden transition-all ${
                        selectedCover === index 
                          ? 'ring-4 ring-[var(--accent)] scale-105' 
                          : 'hover:scale-102 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-16 bg-white/20 rounded-md backdrop-blur-sm" />
                      </div>
                      {selectedCover === index && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-[var(--accent)] rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--novel-text-muted)] mt-2 text-center">
                  {coverStyles[selectedCover].name}
                </p>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-[var(--novel-text-main)] mb-3">
                  预览
                </label>
                <div className="flex justify-center">
                  <div 
                    className="w-48 h-64 rounded-2xl overflow-hidden shadow-lg"
                    style={{
                      background: `linear-gradient(to bottom right, ${
                        coverStyles[selectedCover].gradient.split(' ')[1].replace('from-', '')
                      }, ${
                        coverStyles[selectedCover].gradient.split(' ')[3].replace('to-', '')
                      })`
                    }}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-20 bg-white/20 rounded-md mb-4 backdrop-blur-sm" />
                      <h3 className="text-white font-serif text-lg text-center font-medium">
                        {name || '作品名称'}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  variant="ghost" 
                  onPress={onCancel}
                  className="px-8"
                >
                  取消
                </Button>
                <Button 
                  onPress={handleSave}
                  className="px-8 bg-[var(--accent)] text-white"
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
