import { useMemo, useState } from 'react'
import { getSessions } from '../../lib/storage'
import { renderRich } from '../../components/Markdown'

export function Compose() {
  const sessions = useMemo(() => getSessions(), [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [content, setContent] = useState<string>('')
  const [title, setTitle] = useState('')

  function toggle(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function injectReferences() {
    const refs = sessions.filter(s => selectedIds.includes(s.id)).map(s => {
      switch (s.actionId) {
        case 'action-1': return `- [A1] ${s.topic}: ${s.coreQuestion}\n  ${s.notes}`
        case 'action-2': return `- [A2] ${s.observation}\n  분석: ${s.analysis}`
        case 'action-3': return `- [A3] ${s.problem}\n  재정의: ${s.reframes.join(' • ')}`
        case 'action-4': return `- [A4] ${s.date} - ${s.weightKg.toFixed(1)}kg ${s.note?`(${s.note})`:''}`
      }
    }).join('\n')
    setContent(prev => prev + (prev ? '\n\n' : '') + refs)
  }

  async function postToDevTo() {
    try {
      const key = localStorage.getItem('DEVTO_API_KEY')
      if (!key) { alert('먼저 API Key를 설정하세요. 로컬스토리지 DEVTO_API_KEY.'); return }
      const payload = { article: { title, published: false, body_markdown: content, tags: ['writing','notes'] } }
      const res = await fetch('https://dev.to/api/articles', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': key }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      alert('dev.to에 초안 업로드 완료: ' + (data.url || '성공'))
    } catch (e:any) {
      alert(e?.message || '업로드 실패')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">집필하기</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">히스토리를 선택해 초안을 만들고, 마크다운으로 편집하세요.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">참고할 히스토리 선택</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {sessions.map(s => (
            <li key={s.id} className="rounded border p-2 flex items-start gap-2">
              <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} className="mt-1" />
              <div className="text-sm">
                <div className="text-xs text-zinc-600 dark:text-zinc-400">{new Date(s.createdAt).toLocaleString()} • {s.actionId}</div>
                <div>
                  {s.actionId==='action-1' && (<><strong>{s.topic}</strong> — {s.coreQuestion}</>)}
                  {s.actionId==='action-2' && (<>{s.observation}</>)}
                  {s.actionId==='action-3' && (<><strong>{s.problem}</strong> — {s.reframes.join(' • ')}</>)}
                  {s.actionId==='action-4' && (<>{s.date} — {s.weightKg.toFixed(1)}kg</>)}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={injectReferences} disabled={selectedIds.length===0} className="rounded border px-3 py-2 text-sm focus-ring">선택 항목 본문에 삽입</button>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">블로그 초안</h2>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" className="w-full rounded border px-3 py-2 focus-ring" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="마크다운 본문" className="w-full min-h-[240px] rounded border px-3 py-2 focus-ring font-mono" />
        <div className="flex gap-2 flex-wrap">
          <button className="rounded bg-blue-600 text-white px-3 py-2 focus-ring" onClick={()=>navigator.clipboard.writeText(content)}>본문 복사</button>
          <button className="rounded border px-3 py-2 focus-ring" onClick={()=>window.open('https://dev.to/new','_blank')}>dev.to에 새 글 열기</button>
          <button className="rounded border px-3 py-2 focus-ring" onClick={postToDevTo}>dev.to에 초안 업로드(API 키 필요)</button>
          <label className="text-xs text-zinc-600 dark:text-zinc-400">브라우저 저장소 DEVTO_API_KEY에 키를 저장하세요.</label>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">미리보기</h2>
        <div className="prose-basic">
          {renderRich(content)}
        </div>
      </section>
    </div>
  )
}
