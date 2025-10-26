import { useMemo, useState } from 'react'
import { addSession, generateId, getSessions, deleteSessionById, updateSessionById } from '../../lib/storage'
import type { SessionAction4 } from '../../lib/types'
import { WeightChart } from './WeightChart'
import { ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react'

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function ActionFour() {
  const [date, setDate] = useState<string>(toYmd(new Date()))
  const [weight, setWeight] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [msg, setMsg] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState<string>("")
  const [editWeight, setEditWeight] = useState<string>("")
  const [editNote, setEditNote] = useState<string>("")

  // Get all entries and sort by date (most recent first)
  const entries = useMemo(() => {
    const sessions = getSessions('action-4') as SessionAction4[]
    return sessions.sort((a, b) => b.date.localeCompare(a.date))
  }, [])

  // Force re-render after changes
  const [, setRefreshKey] = useState(0)
  const triggerRefresh = () => setRefreshKey(k => k + 1)

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
    triggerRefresh()
    setTimeout(() => setMsg(null), 2000)
  }

  function handleEdit(id: string) {
    const session = entries.find(s => s.id === id)
    if (!session) return
    setEditingId(id)
    setEditDate(session.date)
    setEditWeight(session.weightKg.toString())
    setEditNote(session.note || '')
  }

  function handleSaveEdit() {
    if (!editingId) return
    const weightKg = Number(editWeight)
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      alert('체중을 정확히 입력하세요.')
      return
    }
    updateSessionById(editingId, {
      date: editDate,
      weightKg,
      note: editNote.trim() || undefined,
    })
    setEditingId(null)
    triggerRefresh()
    alert('수정되었습니다.')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditDate('')
    setEditWeight('')
    setEditNote('')
  }

  function handleDelete(id: string) {
    if (!confirm('이 기록을 삭제할까요?')) return
    deleteSessionById(id)
    triggerRefresh()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">체중 기록</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">날짜와 체중(kg)을 기록해 보세요.</p>
      </header>

      {/* 그래프 - 가장 상단 */}
      <section aria-labelledby="w-graph" className="space-y-2">
        <h2 id="w-graph" className="text-lg font-semibold">체중 변화 그래프</h2>
        <WeightChart />
      </section>

      {/* 입력란 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">체중 기록하기</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div>
            <label htmlFor="date" className="block text-sm font-medium">날짜</label>
            <input 
              id="date" 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 focus-ring"
            />
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium">체중(kg)</label>
            <input 
              id="weight" 
              inputMode="decimal" 
              placeholder="예: 72.4" 
              value={weight} 
              onChange={e => setWeight(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 focus-ring"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="note" className="block text-sm font-medium">메모(선택)</label>
            <input 
              id="note" 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 focus-ring"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button onClick={addEntry} className="rounded bg-blue-600 text-white px-4 py-2 focus-ring">
              저장
            </button>
            {msg && <span className="text-green-600" role="status">{msg}</span>}
          </div>
        </div>
      </section>

      {/* 기록 리스트 */}
      {entries.length > 0 && (
        <section aria-labelledby="w-recent" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="w-recent" className="text-lg font-semibold">
              전체 기록 ({entries.length}개)
            </h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 rounded border px-3 py-1.5 text-sm focus-ring"
            >
              {showHistory ? (
                <>
                  <ChevronUp size={16} /> 접기
                </>
              ) : (
                <>
                  <ChevronDown size={16} /> 펼치기
                </>
              )}
            </button>
          </div>
          
          {showHistory && (
            <ul className="divide-y rounded border overflow-hidden bg-white dark:bg-zinc-900">
              {entries.map(s => (
                <li key={s.id} className="p-3">
                  {editingId === s.id ? (
                    // 수정 모드
                    <div className="space-y-2">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          className="rounded border px-2 py-1 text-sm focus-ring"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={editWeight}
                          onChange={e => setEditWeight(e.target.value)}
                          placeholder="체중(kg)"
                          className="rounded border px-2 py-1 text-sm focus-ring"
                        />
                      </div>
                      <input
                        type="text"
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        placeholder="메모"
                        className="w-full rounded border px-2 py-1 text-sm focus-ring"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="rounded bg-blue-600 text-white px-3 py-1.5 text-sm focus-ring"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="rounded border px-3 py-1.5 text-sm focus-ring"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 표시 모드
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{s.date}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {s.weightKg.toFixed(1)} kg {s.note ? `- ${s.note}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(s.id)}
                          className="rounded border px-2 py-1 text-xs focus-ring flex items-center gap-1"
                          title="수정"
                        >
                          <Edit2 size={14} /> 수정
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="rounded border border-red-300 text-red-700 dark:text-red-400 px-2 py-1 text-xs focus-ring flex items-center gap-1"
                          title="삭제"
                        >
                          <Trash2 size={14} /> 삭제
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
