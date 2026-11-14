import { describe, expect, it } from 'vitest'
import { computeTotals, defaultSelection, findItem, lineKey, selectionErrors, unitPriceCents, type CartLine } from '../src/order/pricing'
import { buildPayload, emptyForm, submitOrder, validateCustomer } from '../src/order/checkout'
import { clientConfig, demo, fakeFetch, jsonResponse } from './helpers'

const wings = findItem(demo, 'wings-buffalo')!

describe('pricing', () => {
  it('adds option prices to the base price (in cents)', () => {
    expect(unitPriceCents(demo, wings, { 'wing-size': ['10pc'], spice: ['fire'], dip: ['alley-sauce'] })).toBe(1750)
  })

  it('defaults required single-choice groups', () => {
    expect(defaultSelection(demo, wings)).toEqual({ 'wing-size': ['6pc'], spice: ['mild'], dip: ['ranch'] })
  })

  it('rejects invalid selections', () => {
    expect(selectionErrors(demo, wings, { 'wing-size': ['6pc', '10pc'], spice: ['mild'] })).toContain('Size: choose one')
    expect(selectionErrors(demo, wings, { 'wing-size': [], spice: ['mild'] })).toContain('Size: please choose')
    expect(selectionErrors(demo, wings, { 'wing-size': ['99pc'], spice: ['mild'] })).toContain('Size: invalid choice')
    expect(selectionErrors(demo, wings, { 'wing-size': ['6pc'], spice: ['mild'], hack: ['x'] })[0]).toMatch(/Unknown option/)
    const burger = findItem(demo, 'classic-smash')!
    expect(selectionErrors(demo, burger, { 'burger-extras': ['bacon', 'bacon'] })).toContain('Extras: duplicate choice')
  })

  it('computes subtotal, delivery fee, tax and total without float drift', () => {
    const lines: CartLine[] = [
      { key: 'a', itemId: 'veggie-crunch', qty: 1, options: {} },
      { key: 'b', itemId: 'wings-buffalo', qty: 2, options: { 'wing-size': ['10pc'], spice: ['fire'], dip: ['alley-sauce'] } },
    ]
    const t = computeTotals(demo, lines, 'delivery')
    expect(t).toMatchObject({ subtotal: 45, deliveryFee: 4.99, total: 56.49, itemCount: 3, belowMinimumBy: 0 })
    expect(t.taxes[0].amount).toBe(6.5)
    expect(computeTotals(demo, lines, 'pickup')).toMatchObject({ deliveryFee: 0, total: 50.85 })
  })

  it('reports the delivery minimum', () => {
    expect(computeTotals(demo, [{ key: 'x', itemId: 'fries', qty: 2, options: {} }], 'delivery').belowMinimumBy).toBe(7)
  })

  it('merges identical lines via a stable key', () => {
    expect(lineKey('x', { b: ['2', '1'], a: ['z'] }, ' No onions ')).toBe(lineKey('x', { a: ['z'], b: ['1', '2'] }, 'no onions'))
  })
})

describe('customer form', () => {
  const ok = { ...emptyForm, name: 'Ana', phone: '416 555 0123' }
  it('requires name and phone; address only for delivery', () => {
    expect(Object.keys(validateCustomer(demo, emptyForm, 'pickup'))).toEqual(['name', 'phone'])
    expect(validateCustomer(demo, ok, 'pickup')).toEqual({})
    expect(Object.keys(validateCustomer(demo, ok, 'delivery'))).toEqual(['address'])
  })
  it('requires email when online payment is used', () => {
    const cfg = clientConfig({ ordering: { ...demo.ordering, provider: { type: 'endpoint', url: '/api/order' }, payment: { type: 'checkout-redirect' } } })
    expect(validateCustomer(cfg, ok, 'pickup').email).toBeDefined()
  })
})

describe('submitOrder', () => {
  const cfg = clientConfig()
  const payload = buildPayload(cfg, [{ key: 'a', itemId: 'fries', qty: 1, options: {} }], 'pickup', { ...emptyForm, name: 'Ana', phone: '4165550123' })

  it('demo provider never sends anything', async () => {
    const f = fakeFetch(jsonResponse({ ok: true }))
    expect(await submitOrder(demo, payload, f.fn)).toEqual({ kind: 'demo' })
    expect(f.calls).toHaveLength(0)
  })

  it('reports success only when the server answers ok:true', async () => {
    const f = fakeFetch(jsonResponse({ ok: true, reference: 'SMO-1' }))
    expect(await submitOrder(cfg, payload, f.fn)).toEqual({ kind: 'received', reference: 'SMO-1', message: undefined })
    expect(f.calls[0].url).toBe('/api/order')
    expect(JSON.parse(String(f.calls[0].init?.body)).items[0]).toMatchObject({ id: 'fries', qty: 1 })
  })

  it('treats 2xx without ok:true, HTTP errors and network failures as errors', async () => {
    expect((await submitOrder(cfg, payload, fakeFetch(jsonResponse({ received: 'maybe' })).fn)).kind).toBe('error')
    const r = await submitOrder(cfg, payload, fakeFetch(jsonResponse({ ok: false, error: 'Kitchen closed' }, 503)).fn)
    expect(r).toEqual({ kind: 'error', message: 'Kitchen closed' })
    expect((await submitOrder(cfg, payload, fakeFetch(new TypeError('offline')).fn)).kind).toBe('error')
    expect((await submitOrder(cfg, payload, fakeFetch(new Response('<html>', { status: 500 })).fn)).kind).toBe('error')
  })

  it('times out instead of hanging', async () => {
    const slow = clientConfig({ ordering: { ...demo.ordering, provider: { type: 'endpoint', url: '/api/order', timeoutMs: 30 } } })
    const hang = ((_u: unknown, init?: RequestInit) =>
      new Promise((_, rej) => init?.signal?.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))))) as typeof fetch
    const r = await submitOrder(slow, payload, hang)
    expect(r.kind).toBe('error')
    expect(r.kind === 'error' && r.message).toMatch(/took too long/)
  })

  it('checkout-redirect needs an https checkout URL from the server', async () => {
    const pay = clientConfig({ ordering: { ...demo.ordering, provider: { type: 'endpoint', url: '/api/order' }, payment: { type: 'checkout-redirect' } } })
    expect(await submitOrder(pay, payload, fakeFetch(jsonResponse({ ok: true, checkoutUrl: 'https://checkout.stripe.com/c/abc' })).fn)).toEqual({ kind: 'redirect', url: 'https://checkout.stripe.com/c/abc' })
    expect((await submitOrder(pay, payload, fakeFetch(jsonResponse({ ok: true, checkoutUrl: 'javascript:alert(1)' })).fn)).kind).toBe('error')
  })
})
