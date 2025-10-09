import { useMemo, useState } from 'react'
import { addSession, generateId, getSessions, deleteSessionById, updateSessionById } from '../../lib/storage'
import type { SessionAction4 } from '../../lib/types'
import { WeightChart } from './WeightChart'

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function ActionFour() {
  const [date, setDate] = useState<string>(toYmd(new Date()))
  const [weight, setWeight] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [msg, setMsg] = useState<string | null>(null)

  const entries = useMemo(() => getSessions('action-4'), [])

  function addEntry() {
    const weightKg = Number(weight)
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setMsg('체중을 정확히 입력하세요. 예: 72.4')
      return
    }
    const session: SessionAction4 = {
      id: generateId(),
      actionId: 'action-4',
      createdAt: new Date().toISOString(),
      date,
      weightKg,
      note: note.trim() || undefined,
    }
    addSession(session)
    setMsg('저장되었습니다.')
    setWeight('')
    setNote('')
  }

  const latest = entries.slice(0, 10)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Action 4: 체중 기록</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">날짜와 체중(kg)을 기록해 보세요.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
        <div>
          <label htmlFor="date" className="block text-sm font-medium">날짜</label>
          <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 focus-ring"/>
        </div>
        <div>
          <label htmlFor="weight" className="block text-sm font-medium">체중(kg)</label>
          <input id="weight" inputMode="decimal" placeholder="예: 72.4" value={weight} onChange={e => setWeight(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 focus-ring"/>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="note" className="block text-sm font-medium">메모(선택)</label>
          <input id="note" value={note} onChange={e => setNote(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 focus-ring"/>
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button onClick={addEntry} className="rounded bg-blue-600 text-white px-4 py-2 focus-ring">저장</button>
          {msg && <span className="text-green-600" role="status">{msg}</span>}
        </div>
      </div>

      {latest.length > 0 && (
        <section aria-labelledby="w-recent" className="space-y-2">
          <h2 id="w-recent" className="text-lg font-semibold">최근 10개</h2>
          <ul className="divide-y rounded border overflow-hidden">
            {latest.map(s => (
              <li key={s.id} className="p-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>
                  <div className="font-medium">{s.date}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{s.weightKg.toFixed(1)} kg {s.note ? `- ${s.note}` : ''}</div>
                </div>
                <button onClick={() => onEdit(s.id)} className="rounded border px-2 py-1 text-xs focus-ring">수정</button>
                <button onClick={() => onDelete(s.id)} className="rounded border border-red-300 text-red-700 px-2 py-1 text-xs focus-ring">삭제</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="w-graph" className="space-y-2">
        <h2 id="w-graph" className="text-lg font-semibold">체중 변화 그래프</h2>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">최근 기록을 기준으로 간단한 선 그래프를 표시합니다.</div>
        <div className="text-blue-600 dark:text-blue-400">
          <WeightChart />
        </div>
      </section>
    </div>
  )
}

function onDelete(id: string) {
  if (!confirm('삭제할까요?')) return
  deleteSessionById(id)
  location.reload()
}

function onEdit(id: string) {
  const d = prompt('날짜(YYYY-MM-DD) - 공백이면 유지')
  const w = prompt('체중(kg) - 공백이면 유지')
  const n = prompt('메모 - 공백이면 유지')
  const patch: any = {}
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) patch.date = d
  if (w && !isNaN(Number(w))) patch.weightKg = Number(w)
  if (n !== null && n !== '') patch.note = n
  if (Object.keys(patch).length === 0) return
  updateSessionById(id, patch)
  alert('수정되었습니다.')
  location.reload()
}
