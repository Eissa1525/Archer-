import { describe, expect, it } from 'vitest'
import { validateConfig } from '../src/config/validate'
import template from '../clients/_template.config'
import { clientConfig, demo } from './helpers'

describe('config validation', () => {
  it('the Fire Alley demo config is valid (warnings only)', () => {
    expect(validateConfig(demo).errors).toEqual([])
  })

  it('a complete real-client config passes', () => {
    expect(validateConfig(clientConfig()).errors).toEqual([])
  })

  it('client mode blocks demo data: placeholders, sample reviews, demo ordering', () => {
    const errors = validateConfig({ ...demo, mode: 'client' }).errors.join('\n')
    expect(errors).toMatch(/\.example/)
    expect(errors).toMatch(/555/)
    expect(errors).toMatch(/fictional/)
    expect(errors).toMatch(/sample reviews cannot be shown/)
    expect(errors).toMatch(/ordering.provider is "demo"/)
    expect(errors).toMatch(/mapsUrl/)
  })

  it('the client template is rejected until every TODO is filled in', () => {
    const { errors } = validateConfig(template)
    expect(errors.some((e) => e.includes('TODO'))).toBe(true)
  })

  it('catches broken menus and ordering setups', () => {
    const cfg = clientConfig()
    cfg.menu = { ...cfg.menu, categories: [{ id: 'x', label: 'X', items: [{ id: 'a', name: 'A', price: 1, options: ['nope'] }, { id: 'a', name: 'B', price: -1 }] }] }
    cfg.ordering = { ...cfg.ordering, provider: { type: 'external' }, payment: { type: 'checkout-redirect' } }
    const e = validateConfig(cfg).errors.join('\n')
    expect(e).toMatch(/unknown option group "nope"/)
    expect(e).toMatch(/duplicate item id "a"/)
    expect(e).toMatch(/invalid price/)
    expect(e).toMatch(/needs pickupUrl and\/or deliveryUrl/)
    expect(e).toMatch(/requires the "endpoint" provider/)
  })

  it('real reviews need a non-sample source', () => {
    const cfg = clientConfig({ reviews: { ...demo.reviews, source: { label: 'Google reviews', url: 'https://g.page/r/x', isSample: false } } })
    expect(validateConfig(cfg).errors).toEqual([])
  })
})
