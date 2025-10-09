import { useState } from 'react'
import type { FormEvent } from 'react'
import { addSession, generateId, getSessions, deleteSessionById } from '../../lib/storage'
import type { SessionAction3 } from '../../lib/types'
import { Link } from 'react-router-dom'

export function ActionThree() {
  const [problem, setProblem] = useState('')
  const [reframes, setReframes] = useState<string[]>(['', '', ''])
  const [saved, setSaved] = useState<string | null>(null)

  function updateReframe(idx: number, value: string) {
    setReframes(prev => prev.map((v, i) => (i === idx ? value : v)))
  }

  function addReframe() {
    setReframes(prev => [...prev, ''])
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const session: SessionAction3 = {
      id: generateId(),
      actionId: 'action-3',
      createdAt: new Date().toISOString(),
      problem,
      reframes: reframes.filter(r => r.trim().length > 0),
    }
    addSession(session)
    setSaved('저장되었습니다.')
    setProblem('')
    setReframes(['', '', ''])
    setTimeout(() => setSaved(null), 2000)
  }

  const recent = getSessions('action-3').slice(0, 3)
  function remove(id: string) {
    if (!confirm('이 기록을 삭제할까요?')) return
    deleteSessionById(id)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Action 3: 문제 재정의 인큐베이팅</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">문제 선택 → 관점 회전</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="a3-help">
        <p id="a3-help" className="text-sm text-zinc-600 dark:text-zinc-400">
          하나의 사회 문제를 선택하고 최소 3개의 새로운 정의를 시도해보세요.
        </p>
        <div>
          <label htmlFor="problem" className="block text-sm font-medium">문제 선택</label>
          <input id="problem" required value={problem} onChange={e => setProblem(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-ring"/>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">관점 회전 (최소 3개)</legend>
          {reframes.map((value, idx) => (
            <div key={idx}>
              <label htmlFor={`rf-${idx}`} className="sr-only">재정의 {idx + 1}</label>
              <input id={`rf-${idx}`} value={value} onChange={e => updateReframe(idx, e.target.value)}
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-ring"/>
            </div>
          ))}
          <button type="button" onClick={addReframe} className="rounded border px-3 py-2 text-sm focus-ring">항목 추가</button>
        </fieldset>
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2 focus-ring">세션 저장</button>
          <button type="reset" onClick={() => { setProblem(''); setReframes(['', '', '']) }} className="rounded border px-3 py-2 focus-ring">초기화</button>
          {saved && <span role="status" className="text-green-600">{saved}</span>}
        </div>
      </form>

      {recent.length > 0 && (
        <section aria-labelledby="recent-a3" className="space-y-2">
          <h2 id="recent-a3" className="text-lg font-semibold">최근 기록</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {recent.map(s => (
              <li key={s.id} className="p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{s.problem}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{s.reframes.join(' • ')}</div>
                </div>
                <button onClick={() => remove(s.id)} className="rounded border border-red-300 text-red-700 px-2 py-1 text-xs focus-ring">삭제</button>
              </li>
            ))}
          </ul>
          <Link to="/history" className="text-sm text-blue-600 underline">히스토리 보기</Link>
        </section>
      )}
    </div>
  )
}
