import { createContext, useContext, useLayoutEffect, type DependencyList, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }

/** The Lenis smooth-scroll instance (set in App), so overlays can pause page scrolling. */
export const scroller: { lenis: { stop: () => void; start: () => void } | null } = { lenis: null }

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** `?capture` — for automated screenshots: run timelines on wall-clock time. */
export const isCapture = typeof window !== 'undefined' && new URLSearchParams(location.search).has('capture')
if (isCapture) gsap.ticker.lagSmoothing(0)

/** true once fonts are loaded and the intro loader has finished. */
export const ReadyContext = createContext(false)
export const useReady = () => useContext(ReadyContext)

/**
 * Run GSAP setup scoped to a section; everything is reverted on unmount/re-run.
 * Waits for `ready` so SplitText measures the real fonts.
 */
export function useSectionAnim(scope: RefObject<HTMLElement | null>, setup: () => void, deps: DependencyList = []) {
  const ready = useReady()
  useLayoutEffect(() => {
    if (!ready || !scope.current) return
    const ctx = gsap.context(setup, scope)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ...deps])
}

/** Standard "title explodes in" for big display headings. */
export function revealTitle(target: string | Element, trigger?: Element | string) {
  const split = SplitText.create(target, { type: 'chars,words', charsClass: 'ch' })
  gsap.from(split.chars, {
    yPercent: 110,
    rotate: () => gsap.utils.random(-25, 25),
    scale: 0.6,
    autoAlpha: 0,
    duration: reducedMotion ? 0.01 : 0.9,
    ease: 'back.out(2.2)',
    stagger: { each: 0.035, from: 'random' },
    scrollTrigger: { trigger: trigger ?? target, start: 'top 85%' },
  })
  return split
}

/**
 * Fade + rise for any group of elements as they enter.
 * Uses opacity, not autoAlpha: visibility:hidden would make links/buttons unfocusable
 * until scrolled into view, so keyboard users would skip them.
 */
export function revealUp(targets: string, trigger?: Element | string, stagger = 0.08) {
  gsap.from(targets, {
    y: 40,
    opacity: 0,
    duration: reducedMotion ? 0.01 : 0.8,
    ease: 'power3.out',
    stagger,
    scrollTrigger: { trigger: trigger ?? targets, start: 'top 88%' },
  })
}
