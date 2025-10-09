import { useMemo, useRef, useState } from 'react'
import { exportState, importState, getSessions, clearAll, deleteSessionById } from '../../lib/storage'
import type { ActionId, Session } from '../../lib/types'

export function History() {
  const [filter, setFilter] = useState<ActionId | 'all'>('all')
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const sessions = useMemo(() => {
    const all = getSessions()
    return filter === 'all' ? all : all.filter(s => s.actionId === filter)
  }, [filter])

  function remove(id: string) {
    if (!confirm('이 기록을 삭제할까요?')) return
    deleteSessionById(id)
    setMessage('삭제되었습니다.')
    // trigger rerender by changing filter state (toggle twice to keep selection)
    setFilter(prev => prev)
  }

  function handleExport() {
    const data = exportState()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'action-history.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleImport(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const { imported } = importState(text)
        setMessage(`${imported}개 항목을 불러왔습니다.`)
      } catch (e: any) {
        setMessage(e?.message ?? '가져오기에 실패했습니다.')
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  function handleClear() {
    if (confirm('모든 데이터를 삭제할까요?')) {
      clearAll()
      setMessage('모든 데이터가 삭제되었습니다.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">히스토리</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">세션 내역을 필터링하고 내보내기/가져오기를 할 수 있어요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="rounded border px-3 py-2 focus-ring">
            <option value="all">전체</option>
            <option value="action-1">Action 1</option>
            <option value="action-2">Action 2</option>
            <option value="action-3">Action 3</option>
          </select>
          <button onClick={handleExport} className="rounded border px-3 py-2 focus-ring">내보내기</button>
          <label className="rounded border px-3 py-2 focus-ring cursor-pointer" htmlFor="import">가져오기</label>
          <input id="import" ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="sr-only" />
          <button onClick={handleClear} className="rounded border border-red-300 text-red-700 px-3 py-2 focus-ring">전체 삭제</button>
        </div>
      </header>

      {message && <div role="status" className="text-sm text-green-600">{message}</div>}

      <section aria-labelledby="history-list" className="space-y-2">
        <h2 id="history-list" className="text-lg font-semibold">세션 목록 ({sessions.length})</h2>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {sessions.map((s) => (
            <li key={s.id} className="p-3 grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-2">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <div>{new Date(s.createdAt).toLocaleString()}</div>
                <div>{s.actionId}</div>
              </div>
              <SessionPreview session={s} />
              <div className="flex items-start justify-end">
                <button onClick={() => remove(s.id)} className="rounded border border-red-300 text-red-700 px-2 py-1 text-xs focus-ring">삭제</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function SessionPreview({ session }: { session: Session }) {
  switch (session.actionId) {
    case 'action-1':
      return (
        <div>
          <div className="font-medium">{session.topic}</div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{session.coreQuestion} — {session.notes}</div>
        </div>
      )
    case 'action-2':
      return (
        <div>
          <div className="font-medium line-clamp-2">{session.observation}</div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{session.analysis}</div>
        </div>
      )
    case 'action-3':
      return (
        <div>
          <div className="font-medium">{session.problem}</div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{session.reframes.join(' • ')}</div>
        </div>
      )
  }
}
