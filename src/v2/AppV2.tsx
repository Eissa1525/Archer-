import './v2.css'
import { lazy, Suspense, useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { Overlay } from './Overlay'
import { hasWebGL, useQuality } from '../hooks/useQuality'

// three.js + the scene load after the type and veil have painted.
const Experience = lazy(() => import('./scene/Experience').then((m) => ({ default: m.Experience })))

function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
const getLayout = () => (window.innerWidth / window.innerHeight < 0.9 ? 'tall' : 'wide')

export default function AppV2() {
  const quality = useQuality()
  const layout = useSyncExternalStore(subscribeResize, getLayout, () => 'wide' as const) as 'wide' | 'tall'
  const webgl = useMemo(hasWebGL, [])
  const [ready, setReady] = useState(!webgl)
  const onReady = useCallback(() => setReady(true), [])

  return (
    <>
      <div className="ax-stage" aria-hidden="true">
        {webgl ? (
          <Suspense fallback={null}>
            <Experience quality={quality} layout={layout} onReady={onReady} />
          </Suspense>
        ) : (
          <div className="ax-fallback" />
        )}
      </div>
      <Overlay ready={ready} reducedMotion={quality.reducedMotion} webgl={webgl} />
    </>
  )
}
