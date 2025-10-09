import { useEffect } from 'react'
// @ts-expect-error provided by vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react'

export function SWPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (offlineReady) {
      const t = setTimeout(() => setOfflineReady(false), 3000)
      return () => clearTimeout(t)
    }
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div role="status" className="fixed bottom-3 left-0 right-0 mx-auto w-fit">
      <div className="flex items-center gap-3 rounded border bg-white dark:bg-zinc-900 px-4 py-2 shadow">
        {offlineReady && <span>오프라인 준비 완료</span>}
        {needRefresh && (
          <>
            <span>새 버전이 준비되었습니다.</span>
            <button
              className="rounded bg-blue-600 text-white px-3 py-1 text-sm"
              onClick={() => updateServiceWorker(true)}
            >지금 업데이트</button>
            <button
              className="rounded border px-3 py-1 text-sm"
              onClick={() => setNeedRefresh(false)}
            >나중에</button>
          </>
        )}
      </div>
    </div>
  )
}
