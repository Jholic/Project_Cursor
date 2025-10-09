import { useMemo, useState } from 'react'
import { addSession, generateId, getSessions } from '../../lib/storage'
import type { SessionAction4 } from '../../lib/types'

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
              <li key={s.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.date}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{s.weightKg.toFixed(1)} kg {s.note ? `- ${s.note}` : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
