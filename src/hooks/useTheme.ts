import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState('light')
  
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    setTheme(saved)
    document.documentElement.classList.toggle('dark', saved === 'dark')
    document.documentElement.setAttribute('data-theme', saved)
  }, [])
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  return { theme, toggleTheme }
}
