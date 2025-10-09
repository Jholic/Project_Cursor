import { useMemo } from 'react'
import { getSessions } from '../../lib/storage'

export function WeightChart() {
  const data = useMemo(() => getSessions('action-4')
    .slice()
    .reverse()
    .map(s => ({ date: s.date, weight: s.weightKg })), [])

  if (data.length < 2) {
    return <div className="text-sm text-zinc-600 dark:text-zinc-400">그래프를 보려면 최소 두 개의 기록이 필요합니다.</div>
  }

  const width = 600
  const height = 200
  const padding = 24
  const xs = data.map((_, i) => i)
  const ys = data.map(d => d.weight)
  const xMin = 0, xMax = xs.length - 1
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const scaleX = (i: number) => padding + (i - xMin) / (xMax - xMin) * (width - padding * 2)
  const scaleY = (w: number) => height - padding - (w - yMin) / (yMax - yMin) * (height - padding * 2)

  const points = xs.map((i) => `${scaleX(i)},${scaleY(ys[i])}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-3xl">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
      {xs.map((i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(ys[i])} r="3" fill="currentColor" />
      ))}
      {/* y-axis labels */}
      <text x="4" y={scaleY(yMax)} className="text-[10px] fill-current">{yMax.toFixed(1)}kg</text>
      <text x="4" y={scaleY(yMin)} className="text-[10px] fill-current">{yMin.toFixed(1)}kg</text>
    </svg>
  )
}
