import { useState } from 'react'
import type { FormEvent } from 'react'
import { addSession, generateId, getSessions } from '../../lib/storage'
import type { SessionAction1 } from '../../lib/types'
import { Link } from 'react-router-dom'

export function ActionOne() {
  const [topic, setTopic] = useState('')
  const [coreQuestion, setCoreQuestion] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const session: SessionAction1 = {
      id: generateId(),
      actionId: 'action-1',
      createdAt: new Date().toISOString(),
      topic,
      coreQuestion,
      notes,
    }
    addSession(session)
    setSaved('저장되었습니다.')
    setTopic('')
    setCoreQuestion('')
    setNotes('')
    setTimeout(() => setSaved(null), 2000)
  }

  const recent = getSessions('action-1').slice(0, 3)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Action 1: '시스템 사상가'의 지식 아카이브</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">주제 선정 → 핵심 질문 → 메모 작성</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="a1-help">
        <p id="a1-help" className="text-sm text-zinc-600 dark:text-zinc-400">
          30분 동안 주제와 핵심 질문을 정의하고 자유롭게 메모를 적어보세요.
        </p>
        <div>
          <label htmlFor="topic" className="block text-sm font-medium">주제 선정</label>
          <input id="topic" required value={topic} onChange={e => setTopic(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-ring"/>
        </div>
        <div>
          <label htmlFor="coreQuestion" className="block text-sm font-medium">핵심 질문</label>
          <input id="coreQuestion" required value={coreQuestion} onChange={e => setCoreQuestion(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-ring"/>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium">메모</label>
          <textarea id="notes" rows={6} value={notes} onChange={e => setNotes(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-ring"/>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2 focus-ring">세션 저장</button>
          <button type="reset" onClick={() => { setTopic(''); setCoreQuestion(''); setNotes('') }} className="rounded border px-3 py-2 focus-ring">초기화</button>
          {saved && <span role="status" className="text-green-600">{saved}</span>}
        </div>
      </form>

      {recent.length > 0 && (
        <section aria-labelledby="recent-a1" className="space-y-2">
          <h2 id="recent-a1" className="text-lg font-semibold">최근 기록</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {recent.map(s => (
              <li key={s.id} className="p-3">
                <div className="text-sm font-medium">{s.topic}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{s.coreQuestion} — {s.notes}</div>
              </li>
            ))}
          </ul>
          <Link to="/history" className="text-sm text-blue-600 underline">히스토리 보기</Link>
        </section>
      )}
    </div>
  )
}
