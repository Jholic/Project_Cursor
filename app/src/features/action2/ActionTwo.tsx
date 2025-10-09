import { useState } from 'react'
import type { FormEvent } from 'react'
import { addSession, generateId, getSessions } from '../../lib/storage'
import type { SessionAction2 } from '../../lib/types'
import { Link } from 'react-router-dom'

export function ActionTwo() {
  const [observation, setObservation] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const session: SessionAction2 = {
      id: generateId(),
      actionId: 'action-2',
      createdAt: new Date().toISOString(),
      observation,
      analysis,
    }
    addSession(session)
    setSaved('저장되었습니다.')
    setObservation('')
    setAnalysis('')
    setTimeout(() => setSaved(null), 2000)
  }

  const recent = getSessions('action-2').slice(0, 3)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Action 2: 가정 운영 시스템(FOS) 설계</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">관찰/기록 → 패턴 분석</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="a2-help">
        <p id="a2-help" className="text-sm text-zinc-600 dark:text-zinc-400">
          사실 위주의 관찰과 시스템 관점의 분석을 기록하세요.
        </p>
        <div>
          <label htmlFor="observation" className="block text-sm font-medium">관찰/기록</label>
          <textarea id="observation" required rows={4} value={observation} onChange={e => setObservation(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-ring"/>
        </div>
        <div>
          <label htmlFor="analysis" className="block text-sm font-medium">패턴 분석</label>
          <textarea id="analysis" required rows={4} value={analysis} onChange={e => setAnalysis(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-ring"/>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2 focus-ring">세션 저장</button>
          <button type="reset" onClick={() => { setObservation(''); setAnalysis('') }} className="rounded border px-3 py-2 focus-ring">초기화</button>
          {saved && <span role="status" className="text-green-600">{saved}</span>}
        </div>
      </form>

      {recent.length > 0 && (
        <section aria-labelledby="recent-a2" className="space-y-2">
          <h2 id="recent-a2" className="text-lg font-semibold">최근 기록</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {recent.map(s => (
              <li key={s.id} className="p-3">
                <div className="text-sm font-medium line-clamp-2">{s.observation}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{s.analysis}</div>
              </li>
            ))}
          </ul>
          <Link to="/history" className="text-sm text-blue-600 underline">히스토리 보기</Link>
        </section>
      )}
    </div>
  )
}
