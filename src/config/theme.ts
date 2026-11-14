/**
 * Turns `site.theme` into CSS variables and head tags. Used at build time by vite.config.ts,
 * so brand colours apply before any JavaScript runs (no flash of the wrong colours).
 */
import type { Theme, ThemeColors } from './types'

const VARS: Record<keyof ThemeColors, string> = {
  brown: '--brown',
  brownDeep: '--brown-deep',
  brownSoft: '--brown-soft',
  orange: '--orange',
  orangeHot: '--orange-hot',
  yellow: '--yellow',
  cream: '--cream',
  cream2: '--cream-2',
  ink: '--ink',
  chili: '--chili',
  orangeShadow: '--orange-shadow',
  creamShadow: '--cream-shadow',
  brownShadow: '--brown-shadow',
  heroGlow: '--hero-glow',
}

export const HEX = /^#[0-9a-fA-F]{6}$/
/** Font stacks: letters, digits, spaces, quotes, commas, hyphens and dots only (safe inside CSS). */
export const FONT_STACK = /^[A-Za-z0-9 '",.\-]+$/

/** `html:root { --brown: …; … }` — html:root outranks the stylesheet's :root defaults. */
export function themeCss(t: Theme): string {
  const decls = (Object.keys(VARS) as (keyof ThemeColors)[]).map((k) => `${VARS[k]}:${t.colors[k]}`)
  decls.push(`--display:${t.fonts.display}`, `--body:${t.fonts.body}`)
  return `html:root{${decls.join(';')}}`
}

/** Default favicon: the flame mark in the brand colours, as an SVG data URI. */
export function faviconHref(t: Theme): string {
  if (t.favicon) return t.favicon
  const bg = encodeURIComponent(t.colors.brown)
  const fg = encodeURIComponent(t.colors.orange)
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='${bg}'/%3E%3Cpath d='M16 5c1 5 7 7 7 14a7 7 0 0 1-14 0c0-4 2-6 3-8 1 3 2 4 3 4-1-4 0-7 1-10z' fill='${fg}'/%3E%3C/svg%3E`
}

export const themeVariableNames = VARS
