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
  const [started, setStarted] = useState(false)
  const scroller = useRef<HTMLDivElement | null>(null)

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }) }, [messages])

  function buildPrompt(userText?: string, initial: boolean = false): string {
    const history = messages
      .map(m => `${m.role === 'user' ? '사용자' : '모델'}: ${m.text}`)
      .join('\n')
    const guardrails = `규칙:
1) 이 대화는 ${action} 목적에 맞는 기록을 남기기 위한 것이며, 주제에서 벗어나면 부드럽게 원래 목표로 이끌어라.
2) 한 번에 한 질문만 해라. 길지 않게.
3) 충분히 수집되었다고 판단되면 마지막 턴에 JSON만 출력해라.`
    if (initial) {
      return `${systemPrompt(action)}\n\n${guardrails}\n\n모델: 첫 질문을 한 문장으로 해라. JSON은 아직 출력하지 마라.`
    }
    return `${systemPrompt(action)}\n\n${guardrails}\n\n대화 기록:\n${history}\n\n${userText ? `사용자: ${userText}\n` : ''}모델: 다음 응답을 해라.`
  }

  async function startChat() {
    if (!apiKey) { alert('API Key 필요'); return }
    setStarted(true)
    setBusy(true)
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const m = genAI.getGenerativeModel({ model })
      const result = await m.generateContent(buildPrompt(undefined, true))
      const out = result.response.text()
      setMessages([{ role: 'model', text: out }])
    } catch (e: any) {
      setMessages([{ role: 'model', text: e?.message || '오류가 발생했습니다.' }])
    } finally { setBusy(false) }
  }

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
      const result = await m.generateContent(buildPrompt(text))
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
      {!started && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">기록을 시작하면 챗봇이 먼저 질문합니다. 주제에서 벗어나지 않도록 안내해요.</p>
          <button onClick={startChat} disabled={busy} className="rounded bg-blue-600 disabled:opacity-50 text-white px-4 py-2 focus-ring">기록 시작</button>
        </div>
      )}
      <div className="h-[50vh] overflow-auto rounded border p-3 bg-white dark:bg-zinc-900" ref={scroller}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block rounded px-3 py-2 my-1 text-left max-w-full break-words ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>{renderRich(m.text)}</div>
          </div>
        ))}
      </div>

      {step === 'ask' && started && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} className="rounded border px-3 py-2 focus-ring" placeholder="메시지를 입력하세요"/>
          <button onClick={send} disabled={busy} className="rounded bg-blue-600 disabled:opacity-50 text-white px-4 py-2 focus-ring">보내기</button>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">생성된 JSON</label>
          <textarea className="w-full rounded border p-2 text-sm font-mono min-h-[160px]" value={jsonText} onChange={e => setJsonText(e.target.value)} />
          {/* 미리보기 */}
          <div className="rounded border p-3 bg-white dark:bg-zinc-900">
            <Preview action={action} jsonText={jsonText} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('ask')} className="rounded border px-3 py-2 text-sm focus-ring">대화 계속</button>
            <button onClick={confirmAndSave} className="rounded bg-green-600 text-white px-3 py-2 text-sm focus-ring">저장</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Preview({ action, jsonText }: { action: ActionType; jsonText: string }) {
  try {
    const data = JSON.parse(jsonText || '{}')
    switch (action) {
      case 'action-1':
        return (
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">주제:</span> {String(data.topic||'')}</div>
            <div><span className="font-medium">핵심 질문:</span> {String(data.coreQuestion||'')}</div>
            <div><span className="font-medium">메모:</span> {String(data.notes||'')}</div>
          </div>
        )
      case 'action-2':
        return (
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">관찰/기록:</span> {String(data.observation||'')}</div>
            <div><span className="font-medium">패턴 분석:</span> {String(data.analysis||'')}</div>
          </div>
        )
      case 'action-3':
        return (
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">문제:</span> {String(data.problem||'')}</div>
            <div><span className="font-medium">재정의:</span> {Array.isArray(data.reframes) ? data.reframes.join(' • ') : ''}</div>
          </div>
        )
    }
  } catch {}
  return <div className="text-sm text-zinc-600 dark:text-zinc-400">미리보기를 표시할 수 없습니다.</div>
}
