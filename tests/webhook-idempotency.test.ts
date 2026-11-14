/**
 * Finding 2: Stripe retries / duplicate deliveries must never create a second kitchen order.
 */
import { describe, expect, it } from 'vitest'
import { claimSession, handleStripeWebhook, memoryStore, type KeyValueStore } from '../server/order-handler'
import { clientConfig } from './helpers'

const cfg = clientConfig()
const SECRET = 'whsec_test'
const ENV = { STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: SECRET, ORDER_WEBHOOK_URL: 'https://kitchen.test/hook', RESEND_API_KEY: 're_x', ORDER_EMAIL_TO: 'k@smokehouse.ca', ORDER_EMAIL_FROM: 'o@smokehouse.ca' }

async function sign(payload: string) {
  const t = Math.floor(Date.now() / 1000)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`))
  return `t=${t},v1=${[...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

function event(sessionId = 'cs_test_1', eventId = 'evt_1') {
  return JSON.stringify({
    id: eventId,
    type: 'checkout.session.completed',
    data: { object: { id: sessionId, payment_status: 'paid', amount_total: 3955, metadata: { reference: 'SMO-1', fulfillment: 'pickup', name: 'Ana', phone: '416' } } },
  })
}

async function deliver(body: string) {
  return new Request('https://smokehouse.ca/api/stripe-webhook', { method: 'POST', body, headers: { 'Stripe-Signature': await sign(body) } })
}

/** Fake upstream: Stripe line items + kitchen webhook + Resend; counts kitchen notifications. */
function upstream(opts: { kitchenDown?: () => boolean; delayMs?: number } = {}) {
  const kitchen: { url: string; headers: Record<string, string> }[] = []
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url)
    if (u.includes('/line_items')) return new Response(JSON.stringify({ data: [{ description: 'Buffalo', quantity: 2, amount_total: 3500 }] }))
    if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs))
    if (opts.kitchenDown?.()) return new Response('down', { status: 500 })
    kitchen.push({ url: u, headers: init?.headers as Record<string, string> })
    return new Response('{}')
  }) as typeof fetch
  return { fn, kitchen }
}

describe('Stripe webhook idempotency', () => {
  it('the same event delivered 5 times notifies the kitchen once', async () => {
    const store = memoryStore()
    const up = upstream()
    const statuses: number[] = []
    for (let i = 0; i < 5; i++) statuses.push((await handleStripeWebhook(await deliver(event()), ENV, cfg, { store, fetch: up.fn })).status)
    expect(statuses).toEqual([200, 200, 200, 200, 200]) // Stripe stops retrying
    expect(up.kitchen.filter((k) => k.url === ENV.ORDER_WEBHOOK_URL)).toHaveLength(1)
    expect(up.kitchen.filter((k) => k.url.includes('resend'))).toHaveLength(1)
  })

  it('a different event id for the same session is still a duplicate (keyed by Checkout Session)', async () => {
    const store = memoryStore()
    const up = upstream()
    await handleStripeWebhook(await deliver(event('cs_test_1', 'evt_A')), ENV, cfg, { store, fetch: up.fn })
    const res = await handleStripeWebhook(await deliver(event('cs_test_1', 'evt_B')), ENV, cfg, { store, fetch: up.fn })
    expect(await res.json()).toEqual({ received: true, duplicate: true })
    expect(up.kitchen).toHaveLength(2) // 1 webhook + 1 email, from the first delivery only
  })

  it('simultaneous deliveries: one notifies, the other gets 409 so Stripe retries later', async () => {
    const store = memoryStore()
    const up = upstream({ delayMs: 30 })
    const [a, b] = await Promise.all([
      handleStripeWebhook(await deliver(event()), ENV, cfg, { store, fetch: up.fn }),
      handleStripeWebhook(await deliver(event()), ENV, cfg, { store, fetch: up.fn }),
    ])
    expect([a.status, b.status].sort()).toEqual([200, 409])
    expect(up.kitchen.filter((k) => k.url === ENV.ORDER_WEBHOOK_URL)).toHaveLength(1)
    // the later retry is acknowledged as a duplicate
    const retry = await handleStripeWebhook(await deliver(event()), ENV, cfg, { store, fetch: up.fn })
    expect(await retry.json()).toEqual({ received: true, duplicate: true })
  })

  it('if the kitchen is unreachable, the claim is released and Stripe’s retry delivers exactly once', async () => {
    const store = memoryStore()
    let down = true
    const up = upstream({ kitchenDown: () => down })
    const first = await handleStripeWebhook(await deliver(event()), ENV, cfg, { store, fetch: up.fn })
    expect(first.status).toBe(500) // Stripe will retry
    expect(store.data.size).toBe(0)
    down = false
    expect((await handleStripeWebhook(await deliver(event()), ENV, cfg, { store, fetch: up.fn })).status).toBe(200)
    expect((await handleStripeWebhook(await deliver(event()), ENV, cfg, { store, fetch: up.fn })).status).toBe(200)
    expect(up.kitchen.filter((k) => k.url === ENV.ORDER_WEBHOOK_URL)).toHaveLength(1)
  })

  it('different sessions are separate orders', async () => {
    const store = memoryStore()
    const up = upstream()
    await handleStripeWebhook(await deliver(event('cs_test_1')), ENV, cfg, { store, fetch: up.fn })
    await handleStripeWebhook(await deliver(event('cs_test_2')), ENV, cfg, { store, fetch: up.fn })
    expect(up.kitchen.filter((k) => k.url === ENV.ORDER_WEBHOOK_URL)).toHaveLength(2)
  })

  it('passes the same Idempotency-Key downstream as a second layer', async () => {
    const up = upstream()
    await handleStripeWebhook(await deliver(event('cs_test_9')), ENV, cfg, { store: memoryStore(), fetch: up.fn })
    expect(up.kitchen.map((k) => k.headers['Idempotency-Key'])).toEqual(['stripe-cs_test_9', 'stripe-cs_test_9'])
  })

  it('refuses to run without an idempotency store (503, nothing sent) instead of risking duplicates', async () => {
    const up = upstream()
    const res = await handleStripeWebhook(await deliver(event()), ENV, cfg, { fetch: up.fn })
    expect(res.status).toBe(503)
    expect(up.kitchen).toHaveLength(0)
  })

  it('works with a store that has no atomic putIfAbsent (e.g. Cloudflare KV) for retries', async () => {
    const data = new Map<string, string>()
    const kv: KeyValueStore = { get: async (k) => data.get(k) ?? null, put: async (k, v) => void data.set(k, v), delete: async (k) => void data.delete(k) }
    const up = upstream()
    for (let i = 0; i < 3; i++) await handleStripeWebhook(await deliver(event()), ENV, cfg, { store: kv, fetch: up.fn })
    expect(up.kitchen.filter((k) => k.url === ENV.ORDER_WEBHOOK_URL)).toHaveLength(1)
  })

  it('a stale "processing" claim (crashed worker) is taken over after the lock expires', async () => {
    const store = memoryStore()
    const t0 = 1_000_000
    expect(await claimSession(store, 'k', t0)).toBe('new')
    expect(await claimSession(store, 'k', t0 + 60_000)).toBe('processing')
    expect(await claimSession(store, 'k', t0 + 121_000)).toBe('new')
  })
})
