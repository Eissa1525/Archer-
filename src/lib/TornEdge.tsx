import { useMemo } from 'react'

/** A ripped-paper edge between sections. Deterministic per seed, so it never jumps. */
export function TornEdge({ color, flip = false, seed = 1 }: { color: string; flip?: boolean; seed?: number }) {
  const d = useMemo(() => {
    let s = seed * 9301 + 49297
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    const pts: string[] = ['M0,40']
    let x = 0
    while (x < 1440) {
      x += 14 + rnd() * 34
      const y = 12 + rnd() * 22 + (rnd() < 0.12 ? -10 : 0)
      pts.push(`L${Math.min(x, 1440).toFixed(1)},${y.toFixed(1)}`)
    }
    pts.push('L1440,40 Z')
    return pts.join(' ')
  }, [seed])
  return (
    <svg
      className={`torn ${flip ? 'torn--flip' : ''}`}
      viewBox="0 0 1440 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={d} fill={color} />
    </svg>
  )
}
