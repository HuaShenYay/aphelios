import { useState, useEffect, useRef } from 'react'
import { Scene } from '../types'
import { Icons } from './Icons'

interface SceneListItemProps {
  scene: Scene
  chapterNumber: number
  isSelected: boolean
  isRenaming: boolean
  onSelect: () => void
  onRenameStart: () => void
  onRenameSave: (newTitle: string) => void
  onRenameCancel: () => void
  onDelete: () => void
}

export function SceneListItem({ 
  scene, 
  chapterNumber, 
  isSelected, 
  isRenaming, 
  onSelect, 
  onRenameStart, 
  onRenameSave, 
  onRenameCancel, 
  onDelete 
}: SceneListItemProps) {
  const [editTitle, setEditTitle] = useState(scene.title)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Reset edit title when renaming starts or scene title changes
  useEffect(() => {
    if (isRenaming) {
      setEditTitle(scene.title)
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isRenaming, scene.title])
  
  const handleSave = () => {
    if (editTitle.trim() && editTitle !== scene.title) {
      onRenameSave(editTitle.trim())
    } else {
      onRenameCancel()
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(scene.title)
      onRenameCancel()
    }
  }
  
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-(--field-radius) cursor-pointer transition-all ${
        isSelected 
          ? 'bg-(--accent)/10' 
          : 'hover:bg-black/5 dark:hover:bg-white/5'
      }`}
      onClick={onSelect}
    >
      <span className={`chapter-number ${isSelected ? 'active' : ''}`}>
        {chapterNumber.toString().padStart(2, '0')}
      </span>
      
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm bg-white/50 dark:bg-black/20 border border-(--novel-border) rounded px-2 py-1 outline-none focus:border-(--accent)"
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
          <div className={`flex items-center gap-1 ${isSelected || isRenaming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRenameStart()
              }}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-(--novel-text-muted) hover:text-(--novel-text-main)"
              title="重命名"
            >
              {Icons.edit()}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-(--novel-text-muted) hover:text-red-500"
              title="删除"
            >
              {Icons.delete()}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
