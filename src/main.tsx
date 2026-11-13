import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * Two hero versions live side by side so they can be compared on the same URL:
 *   (default) v2 — "The Aether Gate" cinematic upgrade
 *   #v1       — the original aquatic dusk hero, kept intact
 */
const isV1 = window.location.hash === '#v1'
// Two separate import() calls on purpose: a single ternary import shares one
// preload dependency list, and v1's stylesheet was then never injected.
const Root = isV1 ? lazy(() => import('./AppV1')) : lazy(() => import('./v2/AppV2'))

window.addEventListener('hashchange', () => {
  if ((window.location.hash === '#v1') !== isV1) window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
