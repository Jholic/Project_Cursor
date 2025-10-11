import { useEffect, useRef, useState } from 'react'

function supportsNotifications() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export function Meditation() {
  const [time, setTime] = useState<string>('06:30')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [granted, setGranted] = useState<boolean>(false)
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
    const target = new Date()
    target.setHours(hh, mm, 0, 0)
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
    const delay = target.getTime() - now.getTime()
    setTimeout(() => {
      navigator.serviceWorker?.getRegistration().then(reg => {
        reg?.showNotification('명상 시간', { body: '알람을 눌러 재생하세요.' })
      })
    }, delay)
    alert('내일 같은 시간에 1회 알람이 예약되었습니다. (브라우저가 켜져 있어야 작동)')
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
        <div>
          <label htmlFor="time" className="block text-sm font-medium">시간</label>
          <input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 rounded border px-3 py-2 focus-ring" />
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium">오디오 파일</label>
          <input id="file" type="file" accept="audio/*" onChange={onFileSelected} />
        </div>
        <div className="flex gap-2">
          <button onClick={scheduleLocal} className="rounded border px-3 py-2 focus-ring">알림 예약</button>
          <button onClick={play} className="rounded bg-blue-600 text-white px-3 py-2 focus-ring">재생</button>
        </div>
        <audio ref={audioRef} src={fileUrl} controls className="w-full" />
      </div>

      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        PWA 한계로 브라우저/앱이 백그라운드에서 종료되면 알림이 동작하지 않을 수 있어요. 반복 알람/완전 오프라인 알람은 네이티브 패키징(Capacitor)로 구현을 권장합니다.
      </div>
    </div>
  )
}
