import { useState } from 'react'
import { addSession, generateId, getSessions, deleteSessionById } from '../../lib/storage'
import type { SessionAction3 } from '../../lib/types'
import { Link } from 'react-router-dom'
import { ChatCapture } from '../shared/ChatCapture'

export function ActionThree() {
  const [saved, setSaved] = useState<string | null>(null)

  const recent = getSessions('action-3').slice(0, 3)
  function remove(id: string) {
    if (!confirm('이 기록을 삭제할까요?')) return
    deleteSessionById(id)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Action 3: 문제 재정의 인큐베이팅</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">대화형 입력: 질문 → 답변 → 확인 → 저장</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">대화형 입력</h2>
        <ChatCapture
          action="action-3"
          apiKey={localStorage.getItem('GEMINI_API_KEY') || ''}
          model={localStorage.getItem('GEMINI_MODEL') || 'gemini-2.5-flash'}
          onSave={(payload) => {
            const session: SessionAction3 = {
              id: generateId(),
              actionId: 'action-3',
              createdAt: new Date().toISOString(),
              problem: String(payload.problem||''),
              reframes: Array.isArray(payload.reframes) ? payload.reframes.map((x:any)=>String(x)) : []
            }
            addSession(session)
            setSaved('저장되었습니다.')
            setTimeout(() => setSaved(null), 2000)
          }}
        />
        {saved && <div role="status" className="text-green-600 text-sm">{saved}</div>}
      </section>

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
