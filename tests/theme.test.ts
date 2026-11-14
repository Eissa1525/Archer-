import { describe, expect, it } from 'vitest'
import { faviconHref, themeCss } from '../src/config/theme'
import { validateConfig } from '../src/config/validate'
import { demo } from './helpers'

describe('theme', () => {
  it('turns the theme into CSS variables', () => {
    const css = themeCss(demo.theme)
    expect(css.startsWith('html:root{')).toBe(true)
    expect(css).toContain('--orange:#ff8a00')
    expect(css).toContain('--hero-glow:#5a1d03')
    expect(css).toContain("--display:'Londrina Solid'")
  })

  it('generates the default favicon from the brand colours, or uses a configured file', () => {
    expect(faviconHref(demo.theme)).toContain("fill='%233b1200'")
    expect(faviconHref({ ...demo.theme, favicon: './favicon.png' })).toBe('./favicon.png')
  })

  it('rejects values that could break or inject into the page CSS', () => {
    const bad = { ...demo, theme: { ...demo.theme, colors: { ...demo.theme.colors, orange: 'red;}body{display:none' }, fonts: { ...demo.theme.fonts, body: 'x;}</style><script>', googleFontsUrl: 'https://evil.test/font.css' }, favicon: 'javascript:alert(1)' } }
    const e = validateConfig(bad).errors.join('\n')
    expect(e).toMatch(/theme.colors.orange must be a #rrggbb colour/)
    expect(e).toMatch(/theme.fonts.body contains characters/)
    expect(e).toMatch(/googleFontsUrl must be a https:\/\/fonts.googleapis.com/)
    expect(e).toMatch(/theme.favicon must be a path/)
  })
})
