import { useEffect, useState, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface WindowManagerProps {
  title?: string
}

export function WindowManager({ title = 'Aphelios' }: WindowManagerProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const appWindow = getCurrentWindow()

  useEffect(() => {
    // Check initial state
    appWindow.isMaximized().then(setIsMaximized)

    // Listen for resize events
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized()
      setIsMaximized(maximized)
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [appWindow])

  const handleMinimize = useCallback(async () => {
    await appWindow.minimize()
  }, [appWindow])

  const handleMaximize = useCallback(async () => {
    await appWindow.toggleMaximize()
  }, [appWindow])

  const handleClose = useCallback(async () => {
    await appWindow.close()
  }, [appWindow])

  return (
    <div className="fixed top-0 left-0 right-0 h-9 z-[9999] flex items-center justify-between bg-[var(--novel-bg-cream)] border-b border-black/5 select-none">
      {/* Left: App Icon & Title - Drag Region */}
      <div 
        data-tauri-drag-region 
        className="flex items-center gap-2 pl-4 flex-1 h-full cursor-default"
      >
        <img 
          src="/logo.png" 
          alt="Aphelios" 
          className="w-4 h-4 object-contain pointer-events-none"
        />
        <span className="text-xs font-medium text-[var(--novel-text-main)] opacity-80 pointer-events-none">
          {title}
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center h-full">
        <button
          onClick={handleMinimize}
          className="window-control w-12 h-full flex items-center justify-center text-[var(--novel-text-muted)] hover:bg-black/5 transition-colors"
          title="最小化"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="window-control w-12 h-full flex items-center justify-center text-[var(--novel-text-muted)] hover:bg-black/5 transition-colors"
          title={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="10" height="10" rx="1" />
              <rect x="11" y="11" width="10" height="10" rx="1" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          )}
        </button>
        <button
          onClick={handleClose}
          className="window-control w-12 h-full flex items-center justify-center text-[var(--novel-text-muted)] hover:bg-red-500 hover:text-white transition-colors"
          title="关闭"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
