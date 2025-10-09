import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSessions, getSessionById, updateSessionById } from '../../lib/storage'
import type { Session } from '../../lib/types'

function getApiKey(): string | null {
  try { return localStorage.getItem('GEMINI_API_KEY') } catch { return null }
}

export function ChatWithContext() {
  const [apiKey, setApiKey] = useState<string | ''>(getApiKey() || '')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [messages, setMessages] = useState<{ role: 'user'|'model', text: string }[]>([])
  const sessions = useMemo<Session[]>(() => getSessions(), [])
  const scroller = useRef<HTMLDivElement | null>(null)

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }) }, [messages])
  useEffect(() => { try { apiKey ? localStorage.setItem('GEMINI_API_KEY', apiKey) : localStorage.removeItem('GEMINI_API_KEY') } catch {} }, [apiKey])

  const selected = useMemo(() => sessions.find(s => s.id === selectedId), [sessions, selectedId])

  function systemContextOf(s: Session): string {
    switch (s.actionId) {
      case 'action-1':
        return `Action1 기록\n주제: ${s.topic}\n핵심질문: ${s.coreQuestion}\n메모: ${s.notes}`
      case 'action-2':
        return `Action2 기록\n관찰: ${s.observation}\n분석: ${s.analysis}`
      case 'action-3':
        return `Action3 기록\n문제: ${s.problem}\n재정의: ${(s.reframes||[]).join('; ')}`
      case 'action-4':
        return `Action4 체중기록\n날짜: ${s.date}\n체중: ${s.weightKg}kg\n메모: ${s.note||''}`
    }
  }

  async function send() {
    if (!apiKey) { alert('먼저 API Key를 입력하세요'); return }
    const text = input.trim()
    if (!text) return
    if (!selected) { alert('먼저 기록을 선택하세요'); return }

    setInput('')
    setBusy(true)
    setMessages(m => [...m, { role: 'user', text }])
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const prompt = `다음 사용자의 기존 기록을 더 명확하고 간결하게 다듬어 주세요. 필요하면 구조화해서 제안하세요.\n\n[현재 기록]\n${systemContextOf(selected)}\n\n[사용자 요청]\n${text}`
      const result = await model.generateContent(prompt)
      const out = result.response.text()
      setMessages(m => [...m, { role: 'model', text: out }])
    } catch (e: any) {
      setMessages(m => [...m, { role: 'model', text: e?.message || '오류가 발생했습니다.' }])
    } finally {
      setBusy(false)
    }
  }

  function applyRefinement() {
    if (!selected) return
    const last = [...messages].reverse().find(m => m.role === 'model')
    if (!last) { alert('모델 응답이 없습니다'); return }
    const s = getSessionById(selected.id)
    if (!s) return
    let patch: Partial<Session> = {}
    // 단순 정책: 모델 응답 전문을 해당 필드에 덮어쓰기 (액션별 타겟 필드 상이)
    switch (s.actionId) {
      case 'action-1': patch = { notes: last.text }; break
      case 'action-2': patch = { analysis: last.text } as any; break
      case 'action-3': patch = { reframes: last.text.split(/\n|;|•/).map(t=>t.trim()).filter(Boolean) } as any; break
      case 'action-4': patch = { note: last.text } as any; break
    }
    updateSessionById(s.id, patch)
    alert('기록에 반영되었습니다.')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">기록 기반 챗봇</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">기존 기록을 선택하고, 챗봇과 대화하며 다듬은 결과를 기록에 반영하세요.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
        <div>
          <label htmlFor="key" className="block text-sm font-medium">API Key</label>
          <input id="key" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 focus-ring"/>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <label htmlFor="sel" className="block text-sm font-medium">기록 선택</label>
          <select id="sel" value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full rounded border px-3 py-2 focus-ring">
            <option value="">선택하세요</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{new Date(s.createdAt).toLocaleString()} — {s.actionId}</option>
            ))}
          </select>
          {selected && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap border rounded p-2">
              {systemContextOf(selected)}
            </div>
          )}
          <button onClick={applyRefinement} disabled={!selected} className="rounded border px-3 py-2 text-sm focus-ring">모델 응답 반영</button>
        </div>
        <div className="space-y-3">
          <div className="h-[50vh] overflow-auto rounded border p-3 bg-white dark:bg-zinc-900" ref={scroller}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block rounded px-3 py-2 my-1 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} className="rounded border px-3 py-2 focus-ring" placeholder="질문을 입력하세요"/>
            <button onClick={send} disabled={busy} className="rounded bg-blue-600 disabled:opacity-50 text-white px-4 py-2 focus-ring">보내기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
