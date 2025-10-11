import { useEffect, useRef, useState } from 'react'

function supportsNotifications() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

type Recurrence = 'once' | 'daily' | 'date'

type ScheduledItem = { id: string; when: string; recurrence: Recurrence; title: string; nativeId?: number }

function id() { return Math.random().toString(36).slice(2,10) }

export function Meditation() {
  const [time, setTime] = useState<string>('06:30')
  const [date, setDate] = useState<string>('')
  const [recurrence, setRecurrence] = useState<Recurrence>('once')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [granted, setGranted] = useState<boolean>(false)
  const [items, setItems] = useState<ScheduledItem[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isNative, setIsNative] = useState<boolean>(false)
  const timeoutsRef = useRef<Record<string, any>>({})
  const STORAGE = 'meditation_schedules_v1'
  const [editingId, setEditingId] = useState<string>('')
  const [editRec, setEditRec] = useState<Recurrence>('once')
  const [editTime, setEditTime] = useState<string>('06:30')
  const [editDate, setEditDate] = useState<string>('')

  async function save(items: ScheduledItem[]) {
    try {
      const Pref = (window as any).Capacitor?.Plugins?.Preferences
      if (isNative && Pref?.set) await Pref.set({ key: STORAGE, value: JSON.stringify(items) })
      else localStorage.setItem(STORAGE, JSON.stringify(items))
    } catch {}
  }
  async function load(): Promise<ScheduledItem[]> {
    try {
      const Pref = (window as any).Capacitor?.Plugins?.Preferences
      if (isNative && Pref?.get) {
        const res = await Pref.get({ key: STORAGE })
        return res?.value ? JSON.parse(res.value) : []
      }
      const raw = localStorage.getItem(STORAGE)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  useEffect(() => {
    if (!supportsNotifications()) return
    Notification.requestPermission().then(p => setGranted(p === 'granted'))
    setIsNative(!!(window as any).Capacitor?.isNativePlatform?.())
  }, [])

  // On native, play audio when notification tapped
  useEffect(() => {
    if (!isNative) return
    const LN = (window as any).Capacitor?.Plugins?.LocalNotifications
    if (!LN?.addListener) return
    const sub = LN.addListener('localNotificationActionPerformed', () => {
      play()
    })
    return () => { try { sub?.remove?.() } catch {} }
  }, [isNative, fileUrl])

  // Rehydrate schedules on mount
  useEffect(() => {
    (async () => {
      const stored = await load()
      if (stored.length) setItems(stored)
      if (isNative) {
        const LN = (window as any).Capacitor?.Plugins?.LocalNotifications
        if (LN?.requestPermissions) await LN.requestPermissions()
        if (LN?.getPending) {
          try {
            const res = await LN.getPending()
            const pendingIds: number[] = (res?.notifications||[]).map((n:any)=>n.id)
            for (const it of stored) {
              if (it.recurrence === 'once' && new Date(it.when).getTime() <= Date.now()) continue
              if (it.nativeId && pendingIds.includes(it.nativeId)) continue
              await scheduleNative(it)
            }
          } catch {}
        }
      } else {
        stored.forEach(it => scheduleWeb(it))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative])

  function scheduleLocal() {
    if (!supportsNotifications()) { alert('브라우저 알림을 지원하지 않습니다.'); return }
    if (!granted) { alert('알림 권한이 필요합니다.'); return }
    const [hh, mm] = time.split(':').map(Number)
    const now = new Date()
    let target = new Date()
    if (recurrence === 'date') {
      if (!date) { alert('날짜를 선택하세요.'); return }
      const [y,m,d] = date.split('-').map(Number)
      target = new Date(y, (m-1), d, hh, mm, 0, 0)
      if (target.getTime() <= now.getTime()) { alert('과거 시간입니다.'); return }
    } else {
      target.setHours(hh, mm, 0, 0)
      if (recurrence === 'once') {
        if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
      }
      // daily는 오늘 시각이 지났으면 내일로 이동
      if (recurrence === 'daily' && target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
    }
    const scheduleOne = (at: Date) => {
      const delay = at.getTime() - Date.now()
      const title = '명상 시간'
      const item: ScheduledItem = { id: id(), when: at.toISOString(), recurrence, title }
      setItems(prev => { const next = [...prev, item]; save(next); return next })
      if (isNative) {
        scheduleNative(item, at)
      }
      if (isNative) {
        // no-op here; scheduling handled above
      } else {
        const handle = setTimeout(() => {
          navigator.serviceWorker?.getRegistration().then(reg => {
            reg?.showNotification(title, { body: '알림을 눌러 재생하세요.' })
          })
          if (recurrence === 'daily') {
            const next = new Date(at)
            next.setDate(next.getDate() + 1)
            // update stored when for daily to next
            setItems(prev => {
              const updated = prev.map(x => x.id === item.id ? { ...x, when: next.toISOString() } : x)
              save(updated)
              return updated
            })
            scheduleOne(next)
          }
        }, delay)
        timeoutsRef.current[item.id] = handle
      }
    }
    scheduleOne(target)
    alert(recurrence === 'daily' ? '매일 알림이 예약되었습니다. (브라우저 실행 중에만 동작)' : '알림이 예약되었습니다.')
  }

  async function scheduleNative(item: ScheduledItem, at?: Date) {
    try {
      const LN = (window as any).Capacitor?.Plugins?.LocalNotifications
      if (!LN?.schedule) return
      const idNum = item.nativeId ?? Math.floor(Math.random()*1e6)
      const when = at ? at : new Date(item.when)
      await LN.schedule({ notifications: [{ id: idNum, title: item.title, body: '알림을 눌러 재생됩니다.', schedule: item.recurrence === 'daily' ? { repeats: true, every: 'day', at: when } : { at: when } }] })
      if (!item.nativeId) {
        setItems(prev => { const updated = prev.map(x => x.id===item.id ? { ...x, nativeId: idNum } : x); save(updated); return updated })
      }
    } catch {}
  }

  function scheduleWeb(item: ScheduledItem) {
    const at = new Date(item.when)
    if (item.recurrence === 'once' && at.getTime() <= Date.now()) return
    const delay = Math.max(0, at.getTime() - Date.now())
    const handle = setTimeout(() => {
      navigator.serviceWorker?.getRegistration().then(reg => {
        reg?.showNotification(item.title, { body: '알림을 눌러 재생하세요.' })
      })
      if (item.recurrence === 'daily') {
        const next = new Date(at)
        next.setDate(next.getDate() + 1)
        setItems(prev => { const updated = prev.map(x => x.id===item.id ? { ...x, when: next.toISOString() } : x); save(updated); return updated })
        scheduleWeb({ ...item, when: next.toISOString() })
      }
    }, delay)
    timeoutsRef.current[item.id] = handle
  }

  function cancel(id: string) {
    const item = items.find(x => x.id === id)
    if (!item) return
    if (isNative && item.nativeId != null) {
      const LN = (window as any).Capacitor?.Plugins?.LocalNotifications
      LN?.cancel?.({ notifications: [{ id: item.nativeId }] })
    } else {
      const h = timeoutsRef.current[id]
      if (h) { clearTimeout(h); delete timeoutsRef.current[id] }
    }
    setItems(prev => { const next = prev.filter(x => x.id !== id); save(next); return next })
  }

  function formatHHmm(d: Date) {
    const hh = String(d.getHours()).padStart(2,'0')
    const mm = String(d.getMinutes()).padStart(2,'0')
    return `${hh}:${mm}`
  }

  function startEdit(it: ScheduledItem) {
    setEditingId(it.id)
    setEditRec(it.recurrence)
    const d = new Date(it.when)
    setEditTime(formatHHmm(d))
    setEditDate(d.toISOString().slice(0,10))
  }

  function stopEdit() {
    setEditingId('')
  }

  function computeNextWhen(rec: Recurrence, timeStr: string, dateStr: string): Date | null {
    const [hh, mm] = timeStr.split(':').map(Number)
    const now = new Date()
    if (rec === 'date') {
      if (!dateStr) return null
      const [y,m,d] = dateStr.split('-').map(Number)
      return new Date(y, (m-1), d, hh, mm, 0, 0)
    }
    const at = new Date()
    at.setHours(hh, mm, 0, 0)
    if (rec === 'once' && at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1)
    if (rec === 'daily' && at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1)
    return at
  }

  async function applyEdit(id: string) {
    const it = items.find(x => x.id === id)
    if (!it) return
    const at = computeNextWhen(editRec, editTime, editDate)
    if (!at) { alert('유효한 시간/날짜를 입력하세요.'); return }
    // cancel underlying schedule but keep item
    try {
      if (isNative && it.nativeId != null) {
        const LN = (window as any).Capacitor?.Plugins?.LocalNotifications
        await LN?.cancel?.({ notifications: [{ id: it.nativeId }] })
      } else {
        const h = timeoutsRef.current[id]
        if (h) { clearTimeout(h); delete timeoutsRef.current[id] }
      }
    } catch {}
    // update item
    const updated: ScheduledItem = { ...it, recurrence: editRec, when: at.toISOString(), nativeId: undefined }
    setItems(prev => { const next = prev.map(x => x.id===id ? updated : x); save(next); return next })
    // reschedule
    if (isNative) await scheduleNative(updated, at)
    else scheduleWeb(updated)
    setEditingId('')
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setFileUrl(url)
  }

  function play() {
    if (!fileUrl) { alert('먼저 파일을 선택하세요.'); return }
    audioRef.current?.play().catch(()=>{})
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">명상</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">지정된 시간에 알림을 띄우고, 알림을 누르면 선택한 오디오를 재생합니다.</p>
      </header>

      <div className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="time" className="block text-sm font-medium">시간</label>
            <input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 rounded border px-3 py-2 focus-ring" />
          </div>
          <div>
            <label htmlFor="rec" className="block text-sm font-medium">반복</label>
            <select id="rec" value={recurrence} onChange={e=>setRecurrence(e.target.value as any)} className="mt-1 rounded border px-3 py-2 focus-ring">
              <option value="once">1회</option>
              <option value="daily">매일(오늘 포함)</option>
              <option value="date">지정 날짜</option>
            </select>
          </div>
          {recurrence === 'date' && (
            <div>
              <label htmlFor="date" className="block text-sm font-medium">날짜</label>
              <input id="date" type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 rounded border px-3 py-2 focus-ring" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">오디오 파일</label>
          <div className="flex gap-2 items-center">
            <button onClick={() => document.getElementById('fileHidden')?.click()} className="rounded border px-3 py-2 focus-ring">파일 추가</button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[60%]">{fileUrl ? '선택됨' : '선택된 파일 없음'}</span>
            <input id="fileHidden" className="sr-only" type="file" accept="audio/*" onChange={onFileSelected} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={scheduleLocal} className="rounded border px-3 py-2 focus-ring">알림 예약</button>
          <button onClick={play} className="rounded bg-blue-600 text-white px-3 py-2 focus-ring">재생</button>
        </div>
        <audio ref={audioRef} src={fileUrl} controls className="w-full" />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">예약된 알림</h2>
        {items.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">예약된 항목이 없습니다.</div>
        ) : (
          <ul className="divide-y rounded border">
            {items.map(it => (
              <li key={it.id} className="p-2 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">{new Date(it.when).toLocaleString()} • {it.recurrence}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>startEdit(it)} className="rounded border px-2 py-1 text-xs focus-ring">수정</button>
                    <button onClick={()=>cancel(it.id)} className="rounded border px-2 py-1 text-xs focus-ring">삭제</button>
                  </div>
                </div>
                {editingId===it.id && (
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs">시간</label>
                      <input type="time" value={editTime} onChange={e=>setEditTime(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 focus-ring" />
                    </div>
                    <div>
                      <label className="block text-xs">반복</label>
                      <select value={editRec} onChange={e=>setEditRec(e.target.value as any)} className="mt-1 w-full rounded border px-2 py-1 focus-ring">
                        <option value="once">1회</option>
                        <option value="daily">매일</option>
                        <option value="date">지정 날짜</option>
                      </select>
                    </div>
                    {editRec==='date' && (
                      <div>
                        <label className="block text-xs">날짜</label>
                        <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 focus-ring" />
                      </div>
                    )}
                    <div className="sm:col-span-3 flex gap-2">
                      <button onClick={()=>applyEdit(it.id)} className="rounded bg-blue-600 text-white px-3 py-1 text-xs focus-ring">변경 적용</button>
                      <button onClick={stopEdit} className="rounded border px-3 py-1 text-xs focus-ring">취소</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 안내 문구 제거 요청에 따라 삭제 */}
    </div>
  )
}
