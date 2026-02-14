import { useState } from 'react'

export function useModalState() {
  const [isOpen, setIsOpen] = useState(false)
  return { 
    isOpen, 
    open: () => setIsOpen(true), 
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }
}
