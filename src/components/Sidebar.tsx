import { Icons } from './Icons'

interface SidebarProps {
  onOpenSettings: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ onOpenSettings, activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'projects', label: '全部项目', icon: Icons.grid },
  ]
  
  // Workspace items - future feature
  // const workspaceItems = [
  //   { id: 'manuscripts', label: '手稿', icon: Icons.folderOpen },
  //   { id: 'world', label: '世界观', icon: Icons.folder },
  // ]

  return (
    <aside className="w-64 flex flex-col h-full glass-sidebar z-10 transition-all duration-300">
      <div className="p-6 flex-1">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div 
            className="w-10 h-10 rounded-(--field-radius) overflow-hidden shadow-sm"
            style={{ 
              boxShadow: '0 4px 12px rgba(122, 107, 79, 0.2)'
            }}
          >
            <img 
              src="/logo.png" 
              alt="Aphelios" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--novel-text-main)' }}
          >
            Aphelios
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map(item => (
            <div
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-(--field-radius) cursor-pointer transition-all duration-200 text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-white shadow-sm text-(--novel-text-main)' 
                  : 'text-(--novel-text-muted) hover:text-(--novel-text-main) hover:bg-black/5'
              }`}
            >
              <span className={`w-5 h-5 flex items-center justify-center ${
                activeTab === item.id ? 'text-(--novel-primary)' : 'text-(--novel-text-muted)'
              }`}>
                {item.icon()}
              </span>
              {item.label}
            </div>
          ))}
        </nav>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 mx-4 mb-4">
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-3 p-3 rounded-(--radius) cursor-pointer transition-all duration-200 glass-card"
          style={{ 
            background: 'rgba(250, 249, 246, 0.6)',
          }}
        >
          <div 
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, var(--novel-primary-light) 0%, var(--novel-accent-warm) 100%)'
            }}
          >
            <span className="font-semibold text-sm" style={{ color: '#FAF9F6' }}>A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--novel-text-main)' }}>作者</p>
            <p className="text-[11px]" style={{ color: 'var(--novel-text-muted)' }}>点击设置</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
