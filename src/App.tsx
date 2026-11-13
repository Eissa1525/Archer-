import { lazy, Suspense, useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { Overlay } from './ui/Overlay'
import { hasWebGL, useQuality } from './hooks/useQuality'

// Keep three.js out of the critical path so the type & veil paint immediately.
const Experience = lazy(() => import('./scene/Experience').then((m) => ({ default: m.Experience })))

function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
const getLayout = () => (window.innerWidth / window.innerHeight < 0.9 ? 'tall' : 'wide')

export default function App() {
  const quality = useQuality()
  const layout = useSyncExternalStore(subscribeResize, getLayout, () => 'wide' as const) as 'wide' | 'tall'
  const webgl = useMemo(hasWebGL, [])
  const [ready, setReady] = useState(!webgl)
  const onReady = useCallback(() => setReady(true), [])

  return (
    <>
      <div className="stage" aria-hidden="true">
        {webgl ? (
          <Suspense fallback={null}>
            <Experience quality={quality} layout={layout} onReady={onReady} />
          </Suspense>
        ) : (
          <div className="no-webgl" />
        )}
      </div>
      <Overlay ready={ready} reducedMotion={quality.reducedMotion} isMobile={quality.isMobile} webgl={webgl} />
    </>
  )
}
