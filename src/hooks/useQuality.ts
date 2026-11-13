import { useEffect, useState } from 'react'

export type Tier = 'high' | 'low'

export interface Quality {
  tier: Tier
  isMobile: boolean
  reducedMotion: boolean
}

function detect(): Quality {
  if (typeof window === 'undefined') return { tier: 'high', isMobile: false, reducedMotion: false }
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 820px)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4
  const isMobile = coarse || narrow
  return { tier: isMobile || lowCores ? 'low' : 'high', isMobile, reducedMotion }
}

/** Device capability + layout hints. Re-evaluated on resize so layout adapts live. */
export function useQuality(): Quality {
  const [q, setQ] = useState<Quality>(detect)
  useEffect(() => {
    const onResize = () => setQ((prev) => {
      const next = detect()
      return prev.tier === next.tier && prev.isMobile === next.isMobile && prev.reducedMotion === next.reducedMotion
        ? prev
        : next
    })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return q
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
