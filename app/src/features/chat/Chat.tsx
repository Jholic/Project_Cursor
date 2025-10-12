import { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { loadProfile } from '../../lib/profile'
import { renderRich } from '../../components/Markdown'

function getApiKey(): string | null {
  try { return localStorage.getItem('GEMINI_API_KEY') } catch { return null }
}

export function Chat() {
  const [apiKey, setApiKey] = useState<string | ''>(getApiKey() || '')
  const [input, setInput] = useState('')
  const [model, setModel] = useState<string>(() => {
    try { return localStorage.getItem('GEMINI_MODEL') || 'gemini-2.5-flash' } catch { return 'gemini-2.5-flash' }
  })
  const [messages, setMessages] = useState<{ role: 'user'|'model', text: string }[]>([])
  const [busy, setBusy] = useState(false)
  const scroller = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      if (apiKey) localStorage.setItem('GEMINI_API_KEY', apiKey)
      else localStorage.removeItem('GEMINI_API_KEY')
    } catch {}
  }, [apiKey])

  useEffect(() => {
    try { localStorage.setItem('GEMINI_MODEL', model) } catch {}
  }, [model])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages])

  async function send() {
    if (!apiKey) { alert('먼저 API Key를 입력하세요'); return }
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text }])
    setBusy(true)
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const m = genAI.getGenerativeModel({ model })
      const p = loadProfile()
      const profilePrefix = p.useInPrompts ? `다음은 사용자의 프로필입니다. 답변 시 톤/전문성을 반영하세요.\n이름:${p.name}\n직함:${p.title||''}\n전문:${(p.expertise||[]).join(', ')}\n페르소나:${p.persona||''}\n목표:${p.goals||''}\n` : ''
      const result = await m.generateContent(profilePrefix + text)
      const out = result.response.text()
      setMessages(m => [...m, { role: 'model', text: out }])
    } catch (e: any) {
      setMessages(m => [...m, { role: 'model', text: e?.message || '오류가 발생했습니다.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">대화형 챗봇</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Google Generative AI API Key가 필요합니다. (키는 로컬에 저장됨)</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto] items-end">
        <div>
          <label htmlFor="key" className="block text-sm font-medium">API Key</label>
          <input id="key" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="mt-1 w-full rounded border px-3 py-2 focus-ring"/>
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium">모델</label>
          <select id="model" value={model} onChange={e => setModel(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 focus-ring">
            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
          </select>
        </div>
        <div className="pt-6 sm:pt-0">
          <button onClick={() => setApiKey('')} className="rounded border px-3 py-2 text-sm focus-ring">키 삭제</button>
        </div>
      </div>

      <div ref={scroller} className="h-[50vh] overflow-auto rounded border p-3 bg-white dark:bg-zinc-900">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block rounded px-3 py-2 my-1 text-left max-w-full break-words ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>{renderRich(m.text)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
        <textarea value={input} onChange={e => setInput(e.target.value)} onInput={e => { const el = e.currentTarget; el.style.height = '0px'; el.style.height = Math.min(200, el.scrollHeight) + 'px'; }} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="메시지를 입력하세요" rows={1}
          className="rounded border px-3 py-2 focus-ring resize-none overflow-hidden max-h-[200px]"/>
        <button onClick={send} disabled={busy} className="rounded bg-blue-600 disabled:opacity-50 text-white px-4 py-2 focus-ring">보내기</button>
      </div>
    </div>
  )
}
