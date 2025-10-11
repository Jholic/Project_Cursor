import { useEffect, useRef, useState } from 'react'

function supportsNotifications() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

type Recurrence = 'once' | 'daily' | 'date'

type ScheduledItem = { id: string; when: string; recurrence: Recurrence; title: string }

function id() { return Math.random().toString(36).slice(2,10) }

export function Meditation() {
  const [time, setTime] = useState<string>('06:30')
  const [date, setDate] = useState<string>('')
  const [recurrence, setRecurrence] = useState<Recurrence>('once')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [granted, setGranted] = useState<boolean>(false)
  const [items, setItems] = useState<ScheduledItem[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!supportsNotifications()) return
    Notification.requestPermission().then(p => setGranted(p === 'granted'))
  }, [])

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
      setItems(prev => [...prev, item])
      setTimeout(() => {
        navigator.serviceWorker?.getRegistration().then(reg => {
          reg?.showNotification(title, { body: '알람을 눌러 재생하세요.' })
        })
        if (recurrence === 'daily') {
          const next = new Date(at)
          next.setDate(next.getDate() + 1)
          scheduleOne(next)
        }
      }, delay)
    }
    scheduleOne(target)
    alert(recurrence === 'daily' ? '매일 알림이 예약되었습니다. (브라우저 실행 중에만 동작)' : '알림이 예약되었습니다.')
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
              <li key={it.id} className="p-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">{new Date(it.when).toLocaleString()} • {it.recurrence}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        PWA 한계로 브라우저/앱이 백그라운드에서 종료되면 알림이 동작하지 않을 수 있어요. 반복 알람/완전 오프라인 알람은 네이티브 패키징(Capacitor)로 구현을 권장합니다.
      </div>
    </div>
  )
}
