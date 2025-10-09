import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { History as HistoryIcon, NotebookPen, Scale, Lightbulb } from 'lucide-react'

type LayoutProps = { children: ReactNode }

export function Layout({ children }: LayoutProps) {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-zinc-950/40">
        <div className="px-4 py-4 flex items-center justify-between md:block">
          <Link to="/" className="font-semibold tracking-tight text-lg">Action Manager</Link>
          <button
            className="ml-4 md:ml-0 inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm focus-ring border-zinc-300 dark:border-zinc-700"
            onClick={() => setIsDark(v => !v)}
            aria-pressed={isDark}
          >
            {isDark ? '라이트' : '다크'} 모드
          </button>
        </div>
        <nav aria-label="주요 작업" className="px-2 pb-4">
          <NavItem to="/action-1" icon={<NotebookPen size={18} />} label="Action 1: 지식 아카이브" />
          <NavItem to="/action-2" icon={<Scale size={18} />} label="Action 2: 가정 운영" />
          <NavItem to="/action-3" icon={<Lightbulb size={18} />} label="Action 3: 소셜 벤처" />
          <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-2" />
          <NavItem to="/history" icon={<HistoryIcon size={18} />} label="히스토리" />
        </nav>
      </aside>
      <main id="main" className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
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
