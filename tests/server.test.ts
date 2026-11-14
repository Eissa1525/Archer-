import { describe, expect, it } from 'vitest'
import { handleOrderRequest, handleStripeWebhook, validateOrder, verifyStripeSignature } from '../server/order-handler'
import { clientConfig, demo, fakeFetch, jsonResponse } from './helpers'

const cfg = clientConfig()
const order = (over: Record<string, unknown> = {}) => ({
  fulfillment: 'pickup',
  customer: { name: 'Ana Silva', phone: '416-555-0123' },
  items: [{ id: 'wings-buffalo', qty: 2, options: { 'wing-size': ['10pc'], spice: ['fire'], dip: ['alley-sauce'] }, unitPrice: 0.01 }],
  totals: { total: 0.01 },
  ...over,
})
const post = (body: unknown) => new Request('https://site.test/api/order', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

describe('order validation (server)', () => {
  it('ignores browser prices and recomputes from the menu', () => {
    const { order: o } = validateOrder(cfg, order())
    expect(o?.lines[0]).toMatchObject({ unitPrice: 17.5, lineTotal: 35 })
    expect(o?.totals.total).toBe(39.55) // 35 + 13% HST
  })

  it('rejects unknown items, bad quantities, bad options and missing details', () => {
    expect(validateOrder(cfg, order({ items: [{ id: 'caviar', qty: 1 }] })).errors[0]).toMatch(/not on the menu/)
    expect(validateOrder(cfg, order({ items: [{ id: 'fries', qty: 0 }] })).errors[0]).toMatch(/Invalid quantity/)
    expect(validateOrder(cfg, order({ items: [{ id: 'fries', qty: 1.5 }] })).errors[0]).toMatch(/Invalid quantity/)
    expect(validateOrder(cfg, order({ items: [{ id: 'wings-buffalo', qty: 1, options: { 'wing-size': ['1000pc'], spice: ['mild'] } }] })).errors[0]).toMatch(/invalid choice/)
    expect(validateOrder(cfg, order({ customer: { name: '', phone: '1' } })).errors).toHaveLength(2)
    expect(validateOrder(cfg, order({ fulfillment: 'delivery' })).errors).toContain('Delivery address is required.')
    expect(validateOrder(cfg, order({ fulfillment: 'delivery', delivery: { address: '1 Main St, Toronto' }, items: [{ id: 'fries', qty: 1 }] })).errors[0]).toMatch(/minimum/)
  })
})

describe('POST /api/order', () => {
  it('refuses to claim success when no notification channel is configured', async () => {
    const res = await handleOrderRequest(post(order()), {}, cfg, fakeFetch(jsonResponse({})).fn)
    expect(res.status).toBe(503)
    expect((await res.json()).ok).toBe(false)
  })

  it('notifies the webhook and returns a reference', async () => {
    const f = fakeFetch(new Response('ok'))
    const res = await handleOrderRequest(post(order()), { ORDER_WEBHOOK_URL: 'https://hooks.test/x' }, cfg, f.fn)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.reference).toMatch(/^SMO-/)
    const sent = JSON.parse(String(f.calls[0].init?.body))
    expect(sent.text).toContain('2 × Buffalo')
    expect(sent.text).toContain('10 pieces, Fire, Alley sauce')
    expect(sent.order.totals.total).toBe(39.55)
  })

  it('sends email through Resend when configured', async () => {
    const f = fakeFetch(jsonResponse({ id: 'em_1' }))
    const env = { RESEND_API_KEY: 're_test', ORDER_EMAIL_TO: 'kitchen@smokehouse.ca', ORDER_EMAIL_FROM: 'orders@smokehouse.ca' }
    const res = await handleOrderRequest(post(order()), env, cfg, f.fn)
    expect(res.status).toBe(200)
    expect(f.calls[0].url).toBe('https://api.resend.com/emails')
    expect((f.calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer re_test')
  })

  it('returns an error when every channel fails', async () => {
    const res = await handleOrderRequest(post(order()), { ORDER_WEBHOOK_URL: 'https://hooks.test/x' }, cfg, fakeFetch(new Response('down', { status: 500 })).fn)
    expect(res.status).toBe(502)
    expect((await res.json()).ok).toBe(false)
  })

  it('drops honeypot submissions, bad JSON and other methods', async () => {
    expect((await handleOrderRequest(post(order({ hp: 'x' })), { ORDER_WEBHOOK_URL: 'https://h.test' }, cfg, fakeFetch(new Response('ok')).fn)).status).toBe(400)
    expect((await handleOrderRequest(new Request('https://s.test', { method: 'POST', body: '{nope' }), {}, cfg)).status).toBe(400)
    expect((await handleOrderRequest(new Request('https://s.test', { method: 'GET' }), {}, cfg)).status).toBe(405)
  })

  it('creates a Stripe Checkout Session with server-side prices and fixed return URLs', async () => {
    const pay = clientConfig({ ordering: { ...demo.ordering, provider: { type: 'endpoint', url: '/api/order' }, payment: { type: 'checkout-redirect' } } })
    const f = fakeFetch(jsonResponse({ url: 'https://checkout.stripe.com/c/test' }))
    const env = { STRIPE_SECRET_KEY: 'sk_test_x', SITE_URL: 'https://smokehouse.ca' }
    const res = await handleOrderRequest(post(order({ customer: { name: 'Ana', phone: '4165550123', email: 'ana@x.ca' }, returnUrl: 'https://evil.test' })), env, pay, f.fn)
    const body = await res.json()
    expect(body).toMatchObject({ ok: true, checkoutUrl: 'https://checkout.stripe.com/c/test' })
    const form = new URLSearchParams(String(f.calls[0].init?.body))
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('1750')
    expect(form.get('line_items[0][quantity]')).toBe('2')
    expect(form.get('line_items[0][price_data][currency]')).toBe('cad')
    expect(form.get('success_url')).toMatch(/^https:\/\/smokehouse\.ca\/\?order=success&ref=SMO-/)
    expect(form.get('cancel_url')).toBe('https://smokehouse.ca/?order=cancelled')
  })
})

describe('Stripe webhook', () => {
  const secret = 'whsec_test'
  async function sign(payload: string, t: number) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`))
    return `t=${t},v1=${[...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')}`
  }

  it('verifies signatures and rejects tampering or old events', async () => {
    const now = Math.floor(Date.now() / 1000)
    const header = await sign('{"a":1}', now)
    expect(await verifyStripeSignature('{"a":1}', header, secret, now)).toBe(true)
    expect(await verifyStripeSignature('{"a":2}', header, secret, now)).toBe(false)
    expect(await verifyStripeSignature('{"a":1}', header, 'whsec_other', now)).toBe(false)
    expect(await verifyStripeSignature('{"a":1}', header, secret, now + 3600)).toBe(false)
  })

  it('notifies the restaurant only for paid checkout sessions', async () => {
    const event = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', payment_status: 'paid', amount_total: 3955, metadata: { reference: 'SMO-1', fulfillment: 'pickup', name: 'Ana', phone: '416' } } },
    })
    const f = fakeFetch(jsonResponse({ data: [{ description: 'Buffalo', quantity: 2, amount_total: 3500 }] }), new Response('ok'))
    const req = new Request('https://s.test/api/stripe-webhook', { method: 'POST', body: event, headers: { 'Stripe-Signature': await sign(event, Math.floor(Date.now() / 1000)) } })
    const res = await handleStripeWebhook(req, { STRIPE_SECRET_KEY: 'sk', STRIPE_WEBHOOK_SECRET: secret, ORDER_WEBHOOK_URL: 'https://hooks.test' }, cfg, f.fn)
    expect(res.status).toBe(200)
    expect(JSON.parse(String(f.calls[1].init?.body)).text).toContain('PAID PICKUP ORDER SMO-1')
  })
})
