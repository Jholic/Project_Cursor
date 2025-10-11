import { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { renderRich } from '../../components/Markdown'

type Step = 'ask' | 'review'

type ActionType = 'action-1' | 'action-2' | 'action-3'

export interface ChatCaptureProps {
  action: ActionType
  apiKey: string
  model: string
  onSave: (payload: any) => void
}

function systemPrompt(action: ActionType) {
  if (action === 'action-1') {
    return `너는 지식 아카이브 코치야. 사용자가 오늘 주제와 핵심 질문을 명확히 하고 간단한 메모를 남기도록 1~3질문으로 유도해. 마지막에는 아래 JSON 스키마에 맞춰 채워.
JSON keys: topic, coreQuestion, notes`
  }
  if (action === 'action-2') {
    return `너는 가정 운영 코치야. 사용자가 관찰/기록(사실 위주)과 패턴 분석을 남기도록 1~3질문으로 유도해. 마지막에는 아래 JSON 스키마에 맞춰 채워.
JSON keys: observation, analysis`
  }
  return `너는 소셜 벤처 코치야. 사용자가 문제와 3개 이상의 재정의 아이디어를 남기도록 1~3질문으로 유도해. 마지막에는 아래 JSON 스키마에 맞춰 채워.
JSON keys: problem, reframes[]`
}

export function ChatCapture({ action, apiKey, model, onSave }: ChatCaptureProps) {
  const [messages, setMessages] = useState<{ role: 'user'|'model', text: string }[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<Step>('ask')
  const [jsonText, setJsonText] = useState('')
  const scroller = useRef<HTMLDivElement | null>(null)

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }) }, [messages])

  async function send() {
    if (!apiKey) { alert('API Key 필요'); return }
    const text = input.trim()
    if (!text) return
    setInput('')
    setBusy(true)
    setMessages(m => [...m, { role: 'user', text }])
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const m = genAI.getGenerativeModel({ model })
      const prefix = messages.length === 0
        ? `${systemPrompt(action)}\n\n사용자: ${text}\n\n모델: 질문으로 대화를 이어가고, 마지막 턴에는 JSON 만 출력해.`
        : text
      const result = await m.generateContent(prefix)
      const out = result.response.text()
      setMessages(m => [...m, { role: 'model', text: out }])
      // JSON 추출(마지막 턴 가정)
      const match = out.match(/\{[\s\S]*\}$/)
      if (match) {
        setJsonText(match[0])
        setStep('review')
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: 'model', text: e?.message || '오류가 발생했습니다.' }])
    } finally { setBusy(false) }
  }

  function confirmAndSave() {
    try {
      const parsed = JSON.parse(jsonText)
      onSave(parsed)
    } catch {
      alert('JSON을 해석할 수 없습니다. 대화를 이어가 JSON만 다시 출력해 달라고 해보세요.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-[50vh] overflow-auto rounded border p-3 bg-white dark:bg-zinc-900" ref={scroller}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block rounded px-3 py-2 my-1 text-left max-w-full break-words ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>{renderRich(m.text)}</div>
          </div>
        ))}
      </div>

      {step === 'ask' && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} className="rounded border px-3 py-2 focus-ring" placeholder="메시지를 입력하세요"/>
          <button onClick={send} disabled={busy} className="rounded bg-blue-600 disabled:opacity-50 text-white px-4 py-2 focus-ring">보내기</button>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">생성된 JSON</label>
          <textarea className="w-full rounded border p-2 text-sm font-mono min-h-[160px]" value={jsonText} onChange={e => setJsonText(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setStep('ask')} className="rounded border px-3 py-2 text-sm focus-ring">대화 계속</button>
            <button onClick={confirmAndSave} className="rounded bg-green-600 text-white px-3 py-2 text-sm focus-ring">저장</button>
          </div>
        </div>
      )}
    </div>
  )
}
