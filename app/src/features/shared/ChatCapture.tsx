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
  const [errors, setErrors] = useState<string[]>([])
  const [autoSave, setAutoSave] = useState(false)
  const [hasAutoSaved, setHasAutoSaved] = useState(false)
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

  function parseJsonSafe(text: string): { data: any | null; error: string | null } {
    try { return { data: JSON.parse(text), error: null } } catch (e: any) { return { data: null, error: e?.message || 'JSON 파싱 실패' } }
  }

  function validate(action: ActionType, data: any): string[] {
    const issues: string[] = []
    if (action === 'action-1') {
      if (!data || typeof data !== 'object') { issues.push('데이터 형식이 올바르지 않습니다.'); return issues }
      if (!data.topic || String(data.topic).trim() === '') issues.push('주제(topic)를 입력하세요.')
      if (!data.coreQuestion || String(data.coreQuestion).trim() === '') issues.push('핵심 질문(coreQuestion)을 입력하세요.')
      if (data.notes != null && typeof data.notes !== 'string') issues.push('메모(notes)는 문자열이어야 합니다.')
    } else if (action === 'action-2') {
      if (!data || typeof data !== 'object') { issues.push('데이터 형식이 올바르지 않습니다.'); return issues }
      if (!data.observation || String(data.observation).trim() === '') issues.push('관찰/기록(observation)을 입력하세요.')
      if (!data.analysis || String(data.analysis).trim() === '') issues.push('패턴 분석(analysis)을 입력하세요.')
    } else if (action === 'action-3') {
      if (!data || typeof data !== 'object') { issues.push('데이터 형식이 올바르지 않습니다.'); return issues }
      if (!data.problem || String(data.problem).trim() === '') issues.push('문제(problem)를 입력하세요.')
      const list = Array.isArray(data.reframes) ? data.reframes : []
      if (list.length < 3) issues.push('재정의(reframes)는 최소 3개 필요합니다.')
      if (!list.every((x: any) => typeof x === 'string' && x.trim().length > 0)) issues.push('reframes 항목은 비어있지 않은 문자열이어야 합니다.')
    }
    return issues
  }

  useEffect(() => {
    if (!jsonText) { setErrors([]); return }
    const { data, error } = parseJsonSafe(jsonText)
    if (error) { setErrors([`JSON 파싱 오류: ${error}`]); return }
    setErrors(validate(action, data))
  }, [jsonText, action])

  // Auto-save when valid if enabled
  useEffect(() => {
    if (step === 'review' && autoSave && errors.length === 0 && !hasAutoSaved && jsonText.trim()) {
      setHasAutoSaved(true)
      confirmAndSave()
    }
  }, [step, autoSave, errors, hasAutoSaved, jsonText])

  async function autoFix() {
    if (!apiKey) { alert('API Key 필요'); return }
    const { data, error } = parseJsonSafe(jsonText)
    const hint = error ? `현재 JSON 파싱 오류: ${error}` : `현재 JSON: ${JSON.stringify(data)}`
    const constraints = action === 'action-1'
      ? '필수: topic, coreQuestion. notes는 선택. 문자열만.'
      : action === 'action-2'
      ? '필수: observation, analysis. 문자열만.'
      : '필수: problem, reframes 배열(최소 3개, 문자열).'
    const prompt = `다음 액션(${action})의 스키마에 맞도록 누락/형식을 보정한 순수 JSON만 출력하세요. 설명 금지, 마크다운 금지, JSON만.\n제약: ${constraints}\n${hint}`
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const m = genAI.getGenerativeModel({ model })
      const res = await m.generateContent(prompt)
      const out = res.response.text()
      const match = out.match(/\{[\s\S]*\}/)
      if (match) setJsonText(match[0])
      else alert('보정된 JSON을 찾을 수 없습니다. 다시 시도하세요.')
    } catch (e: any) {
      alert(e?.message || '자동 보정 중 오류')
    }
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
        {step === 'review' && (
          <div className="text-left mt-2">
            <div className="inline-flex items-center gap-2 rounded px-3 py-2 my-1 text-left max-w-full break-words bg-zinc-200 dark:bg-zinc-800">
              <span className="text-sm">정리가 완료되었어요. 저장해 볼까요?</span>
              <button onClick={confirmAndSave} disabled={errors.length>0} className="rounded bg-green-600 disabled:opacity-50 text-white px-2 py-1 text-xs focus-ring">저장</button>
            </div>
          </div>
        )}
      </div>

      {step === 'ask' && started && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onInput={e => { const el = e.currentTarget; el.style.height = '0px'; el.style.height = Math.min(200, el.scrollHeight) + 'px'; }}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="메시지를 입력하세요" rows={1}
            className="rounded border px-3 py-2 focus-ring resize-none overflow-hidden max-h-[200px]"
          />
          <button onClick={send} disabled={busy} className="rounded bg-blue-600 disabled:opacity-50 text-white px-4 py-2 focus-ring">보내기</button>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">생성된 JSON</label>
          <textarea className="w-full rounded border p-2 text-sm font-mono min-h-[160px]" value={jsonText} onChange={e => setJsonText(e.target.value)} />
          {/* 유효성 */}
          {errors.length > 0 ? (
            <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300">
              <div className="font-medium mb-1">유효성 검사</div>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((er, i) => (<li key={i}>{er}</li>))}
              </ul>
              <div className="mt-2">
                <button onClick={autoFix} className="rounded border px-3 py-2 text-sm focus-ring">자동 보정</button>
              </div>
            </div>
          ) : (
            <div className="rounded border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-800 dark:text-emerald-300">유효성 검사 통과</div>
          )}
          {/* 미리보기 카드 */}
          <div className="rounded-xl border shadow-sm bg-white dark:bg-zinc-900 p-4">
            <Preview action={action} jsonText={jsonText} />
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => setStep('ask')} className="rounded border px-3 py-2 text-sm focus-ring">대화 계속</button>
            <button onClick={confirmAndSave} disabled={errors.length>0} className="rounded bg-green-600 disabled:opacity-50 text-white px-3 py-2 text-sm focus-ring">저장</button>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoSave} onChange={e => { setAutoSave(e.target.checked); if (!e.target.checked) setHasAutoSaved(false) }} />
              자동 저장(검증 통과 시)
            </label>
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
