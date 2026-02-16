import { useState, useEffect } from 'react'

// Editable Title Component
interface EditableTitleProps {
  title: string
  onSave: (newTitle: string) => void
  className?: string
  inputClassName?: string
}

export function EditableTitle({ 
  title, 
  onSave, 
  className = "",
  inputClassName = ""
}: EditableTitleProps) {
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
        className={`bg-transparent outline-none ${inputClassName}`}
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    )
  }
  
  return (
    <h1 
      onClick={(e) => {
        e.stopPropagation()
        setIsEditing(true)
      }}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      title="点击编辑标题"
    >
      {title}
    </h1>
  )
}
