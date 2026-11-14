/**
 * A demo must never accept real payments or send real orders — enforced at four layers:
 * the config check (which fails the build), the browser config, the submit function, and the server.
 */
import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { validateConfig } from '../src/config/validate'
import { withDemoSafety } from '../src/config/index'
import { buildPayload, emptyForm, resolvePaymentReturn, submitOrder } from '../src/order/checkout'
import { handleOrderRequest, handlePaymentStatus, handleStripeWebhook, memoryStore } from '../server/order-handler'
import type { SiteConfig } from '../src/config/types'
import { demo, fakeFetch, jsonResponse } from './helpers'

const endpoint = { type: 'endpoint', url: '/api/order' } as const
const stripe = { type: 'checkout-redirect', statusUrl: '/api/payment-status' } as const
/** a demo config that (wrongly) asks for real ordering + payment */
const unsafeDemo: SiteConfig = { ...demo, ordering: { ...demo.ordering, provider: endpoint, payment: stripe } }

describe('demo safety: config check', () => {
  it('the shipped default config is a safe demo', () => {
    expect(demo.mode).toBe('demo')
    expect(demo.ordering.provider.type).toBe('demo')
    expect(demo.ordering.payment.type).toBe('pay-on-collection')
    expect(validateConfig(demo).errors).toEqual([])
  })

  it.each([
    ['endpoint', endpoint],
    ['external', { type: 'external', pickupUrl: 'https://order.example.com' }],
    ['phone', { type: 'phone' }],
  ] as const)('rejects a demo with the "%s" ordering provider', (_name, provider) => {
    const e = validateConfig({ ...demo, ordering: { ...demo.ordering, provider } }).errors.join('\n')
    expect(e).toMatch(/demo mode only allows ordering.provider "demo" or "disabled"/)
  })

  it('rejects a demo with online payment', () => {
    expect(validateConfig(unsafeDemo).errors.join('\n')).toMatch(/demo mode cannot use online payment/)
  })

  it('allows a demo with ordering disabled', () => {
    expect(validateConfig({ ...demo, ordering: { ...demo.ordering, provider: { type: 'disabled' } } }).errors).toEqual([])
  })

  it('the production build refuses an unsafe demo config', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'unsafe-demo-'))
    const r = spawnSync('npx', ['vite', 'build', '--outDir', out], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, SITE_CONFIG: 'tests/fixtures/unsafe-demo.config.ts' },
      encoding: 'utf8',
    })
    expect(r.status).not.toBe(0)
    expect(r.stdout + r.stderr).toMatch(/demo mode only allows ordering.provider/)
  }, 60_000)
})

describe('demo safety: browser', () => {
  it('withDemoSafety forces demo ordering and turns payments off', () => {
    const safe = withDemoSafety(unsafeDemo)
    expect(safe.ordering.provider).toEqual({ type: 'demo' })
    expect(safe.ordering.payment.type).toBe('pay-on-collection')
    const disabled = withDemoSafety({ ...demo, ordering: { ...demo.ordering, provider: { type: 'disabled' } } })
    expect(disabled.ordering.provider.type).toBe('disabled')
    const client = { ...unsafeDemo, mode: 'client' as const }
    expect(withDemoSafety(client)).toBe(client)
  })

  it('submitOrder never sends in demo mode, even with an endpoint configured', async () => {
    const f = fakeFetch(jsonResponse({ ok: true, reference: 'REAL-1' }))
    const payload = buildPayload(unsafeDemo, [{ key: 'a', itemId: 'fries', qty: 1, options: {} }], 'pickup', { ...emptyForm, name: 'Ana', phone: '4163682200' })
    expect(await submitOrder(unsafeDemo, payload, f.fn)).toEqual({ kind: 'demo' })
    expect(f.calls).toHaveLength(0)
  })

  it('a demo never shows "Payment complete", whatever the URL says', async () => {
    const f = fakeFetch(jsonResponse({ ok: true, paid: true }))
    expect(await resolvePaymentReturn(unsafeDemo, '?order=success&session_id=cs_test_a1B2c3D4e5F6g7H8', f.fn)).toBeNull()
    expect(f.calls).toHaveLength(0)
  })
})

describe('demo safety: server', () => {
  const env = { ORDER_WEBHOOK_URL: 'https://kitchen.test', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x', SITE_URL: 'https://demo.test' }
  const order = { fulfillment: 'pickup', customer: { name: 'Ana', phone: '4163682200' }, items: [{ id: 'fries', qty: 1 }] }

  it('the order endpoint refuses orders for a demo config (nothing forwarded, no payment created)', async () => {
    const f = fakeFetch(new Response('ok'))
    const res = await handleOrderRequest(new Request('https://demo.test/api/order', { method: 'POST', body: JSON.stringify(order) }), env, unsafeDemo, f.fn)
    expect(res.status).toBe(403)
    expect(f.calls).toHaveLength(0)
  })

  it('payment status and the Stripe webhook are disabled for a demo config', async () => {
    const f = fakeFetch(jsonResponse({ status: 'complete', payment_status: 'paid' }))
    expect((await handlePaymentStatus(new Request('https://demo.test/api/payment-status?session_id=cs_test_a1B2c3D4e5F6g7H8'), env, unsafeDemo, f.fn)).status).toBe(403)
    const hook = await handleStripeWebhook(new Request('https://demo.test/api/stripe-webhook', { method: 'POST', body: '{}' }), env, unsafeDemo, { store: memoryStore(), fetch: f.fn })
    expect(hook.status).toBe(403)
    expect(f.calls).toHaveLength(0)
  })
})
