import { useEffect, useState } from 'react'
import { loadProfile, saveProfile, type UserProfile } from '../../lib/profile'

export function Profile() {
  const [p, setP] = useState<UserProfile>({ name: '' })
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => { setP(loadProfile()) }, [])

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setP(prev => ({ ...prev, [key]: value }))
  }

  function onSave() {
    saveProfile(p)
    setSaved('저장되었습니다.')
    setTimeout(()=>setSaved(null), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">프로필</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">챗봇 프롬프트에 참고될 정보입니다.</p>
      </header>

      <div className="grid gap-3">
        <div>
          <label className="block text-sm font-medium">이름</label>
          <input className="mt-1 w-full rounded border px-3 py-2 focus-ring" value={p.name} onChange={e=>update('name', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">직함</label>
            <input className="mt-1 w-full rounded border px-3 py-2 focus-ring" value={p.title||''} onChange={e=>update('title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">이메일</label>
            <input className="mt-1 w-full rounded border px-3 py-2 focus-ring" value={p.email||''} onChange={e=>update('email', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">웹사이트</label>
          <input className="mt-1 w-full rounded border px-3 py-2 focus-ring" value={p.website||''} onChange={e=>update('website', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">바이오</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2 focus-ring" rows={4} value={p.bio||''} onChange={e=>update('bio', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">전문 분야(쉼표로 구분)</label>
          <input className="mt-1 w-full rounded border px-3 py-2 focus-ring" value={(p.expertise||[]).join(', ')} onChange={e=>update('expertise', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
        </div>
        <div>
          <label className="block text-sm font-medium">페르소나(어조/스타일)</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2 focus-ring" rows={3} value={p.persona||''} onChange={e=>update('persona', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">목표</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2 focus-ring" rows={3} value={p.goals||''} onChange={e=>update('goals', e.target.value)} />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!p.useInPrompts} onChange={e=>update('useInPrompts', e.target.checked)} />
          챗봇 프롬프트에 사용
        </label>
        <div>
          <button onClick={onSave} className="rounded bg-blue-600 text-white px-4 py-2 focus-ring">저장</button>
          {saved && <span className="ml-3 text-green-600 text-sm">{saved}</span>}
        </div>
      </div>
    </div>
  )
}
