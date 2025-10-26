import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { History as HistoryIcon, NotebookPen, Scale, Lightbulb, MessageSquare, Bell, Menu, X } from 'lucide-react'

type LayoutProps = { children: ReactNode }

export function Layout({ children }: LayoutProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  // Close menu when navigating
  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  return (
    <div className="min-h-dvh">
      {/* Header with hamburger menu */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 focus-ring"
              aria-label="메뉴 열기"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="font-semibold tracking-tight text-lg">Action Manager</Link>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm focus-ring border-zinc-300 dark:border-zinc-700"
            onClick={() => setIsDark(v => !v)}
            aria-pressed={isDark}
          >
            {isDark ? '라이트' : '다크'} 모드
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar menu */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out ${
        menuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <Link to="/" className="font-semibold tracking-tight text-lg">Action Manager</Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 focus-ring"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="주요 작업" className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          <div className="px-3 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">생각 정리</div>
          <NavItem to="/action-1" icon={<NotebookPen size={18} />} label="지식 아카이브" />
          <NavItem to="/action-2" icon={<Scale size={18} />} label="행복한 가정" />
          <NavItem to="/action-3" icon={<Lightbulb size={18} />} label="소셜 벤처" />
          <div className="my-3 border-t border-zinc-200 dark:border-zinc-800" />
          <div className="px-3 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">기록</div>
          <NavItem to="/history" icon={<HistoryIcon size={18} />} label="히스토리" />
          <NavItem to="/action-4" icon={<span className="text-xs font-mono">WT</span>} label="체중 기록" />
          <NavItem to="/chat" icon={<MessageSquare size={18} />} label="챗봇" />
          <NavItem to="/meditation" icon={<Bell size={18} />} label="명상" />
          <NavItem to="/profile" icon={<span className="text-xs font-mono">PR</span>} label="프로필" />
        </nav>
      </aside>

      <main className="min-h-[calc(100vh-60px)] bg-zinc-50 dark:bg-zinc-950">
        {children}
      </main>
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded px-3 py-2 text-sm aria-[current=page]:font-semibold hover:bg-zinc-100/70 dark:hover:bg-zinc-900 ${
          isActive ? 'bg-zinc-100 dark:bg-zinc-900' : ''
        }`
      }
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}
