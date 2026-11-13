/**
 * Tiny mutable store shared between the DOM overlay and the WebGL scene.
 * Mutated every frame, so it intentionally lives outside React state.
 * Must stay free of `three` imports: the overlay imports it, and anything it pulls in
 * lands in the entry chunk (three.js is lazy-loaded with the scene).
 */

/** `?capture` — deterministic-ish mode for automated screenshots in slow software renderers. */
export const isCapture =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('capture')

export const sceneState = {
  /** 0 → top of hero, 1 → hero fully scrolled past. Written by GSAP ScrollTrigger. */
  scroll: 0,
  /** 0 → intro not started, 1 → intro camera move finished. Written by GSAP. */
  intro: 0,
  /** 0..1, rises when the pointer moves and decays — drives "agitation" effects. */
  pointerEnergy: 0,
}
