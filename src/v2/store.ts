/**
 * v2 shared state between DOM (GSAP) and the scene. Three-free on purpose:
 * the overlay imports it and must not pull three.js into the entry chunk.
 */
export const stage = {
  /** 0 → 1 intro ignition (GSAP). */
  intro: 0,
  /** 0 → 1 progress through the pinned hero (ScrollTrigger). */
  scroll: 0,
  /** 0..1 how much the viewer is stirring the scene. */
  energy: 0,
  /** set by the scene when the camera is about to cross the portal (0..1). */
  portal: 0,
}
