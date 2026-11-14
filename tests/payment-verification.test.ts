/**
 * Finding 1: "Payment complete" must never be shown from the URL alone.
 * The return page asks the server, and the server asks Stripe.
 */
import { describe, expect, it } from 'vitest'
import { handlePaymentStatus } from '../server/order-handler'
import { resolvePaymentReturn } from '../src/order/checkout'
import { clientConfig, demo, fakeFetch, jsonResponse } from './helpers'

const SESSION = 'cs_test_a1B2c3D4e5F6g7H8'
const payCfg = clientConfig({ ordering: { ...demo.ordering, provider: { type: 'endpoint', url: '/api/order' }, payment: { type: 'checkout-redirect', statusUrl: '/api/payment-status' } } })
const env = { STRIPE_SECRET_KEY: 'sk_test_x' }
const statusReq = (id: string) => new Request(`https://smokehouse.ca/api/payment-status?session_id=${encodeURIComponent(id)}`)

describe('server: GET /api/payment-status asks Stripe', () => {
  it('reports paid only when Stripe says complete + paid', async () => {
    const f = fakeFetch(jsonResponse({ id: SESSION, status: 'complete', payment_status: 'paid', metadata: { reference: 'SMO-77', name: 'Ana', phone: '416' } }))
    const res = await handlePaymentStatus(statusReq(SESSION), env, payCfg, f.fn)
    const body = await res.json()
    expect(body).toEqual({ ok: true, paid: true, status: 'complete', reference: 'SMO-77' })
    // asked Stripe for exactly this session, with the secret key
    expect(f.calls[0].url).toBe(`https://api.stripe.com/v1/checkout/sessions/${SESSION}`)
    expect((f.calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer sk_test_x')
    // never leaks personal data and is never cached
    expect(JSON.stringify(body)).not.toMatch(/Ana|416/)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it.each([
    ['open', 'unpaid'],
    ['expired', 'unpaid'],
    ['complete', 'unpaid'],
    ['complete', 'no_payment_required'],
  ])('status=%s payment_status=%s is NOT paid', async (status, payment_status) => {
    const res = await handlePaymentStatus(statusReq(SESSION), env, payCfg, fakeFetch(jsonResponse({ status, payment_status, metadata: {} })).fn)
    expect((await res.json()).paid).toBe(false)
  })

  it('rejects malformed session ids without calling Stripe', async () => {
    for (const bad of ['', 'cs_1', 'pi_123456789012', 'cs_test_../../v1/customers', 'cs_test_abc def ghi jkl']) {
      const f = fakeFetch(jsonResponse({ status: 'complete', payment_status: 'paid' }))
      const res = await handlePaymentStatus(statusReq(bad), env, payCfg, f.fn)
      expect(res.status).toBe(400)
      expect(f.calls).toHaveLength(0)
    }
  })

  it('returns errors (never paid) when Stripe fails or is not configured', async () => {
    expect((await handlePaymentStatus(statusReq(SESSION), {}, payCfg)).status).toBe(503)
    expect((await handlePaymentStatus(statusReq(SESSION), env, payCfg, fakeFetch(jsonResponse({ error: {} }, 404)).fn)).status).toBe(404)
    expect((await handlePaymentStatus(statusReq(SESSION), env, payCfg, fakeFetch(jsonResponse({ error: {} }, 500)).fn)).status).toBe(502)
    expect((await handlePaymentStatus(statusReq(SESSION), env, payCfg, fakeFetch(new TypeError('offline')).fn)).status).toBe(502)
  })
})

describe('browser: return from the payment page', () => {
  it('a bare ?order=success (no session id) is never treated as paid, and nothing is fetched', async () => {
    const f = fakeFetch(jsonResponse({ ok: true, paid: true }))
    expect(await resolvePaymentReturn(payCfg, '?order=success', f.fn)).toEqual({ kind: 'unverified', reason: 'missing-session' })
    expect(await resolvePaymentReturn(payCfg, '?order=success&ref=SMO-1', f.fn)).toMatchObject({ kind: 'unverified' })
    expect(await resolvePaymentReturn(payCfg, '?order=success&session_id=forged', f.fn)).toMatchObject({ kind: 'unverified' })
    expect(f.calls).toHaveLength(0)
  })

  it('shows paid only when the server confirms it', async () => {
    const f = fakeFetch(jsonResponse({ ok: true, paid: true, reference: 'SMO-77' }))
    expect(await resolvePaymentReturn(payCfg, `?order=success&session_id=${SESSION}`, f.fn)).toEqual({ kind: 'paid', reference: 'SMO-77' })
    expect(f.calls[0].url).toBe(`/api/payment-status?session_id=${SESSION}`)
  })

  it('server says not paid → unpaid', async () => {
    expect(await resolvePaymentReturn(payCfg, `?order=success&session_id=${SESSION}`, fakeFetch(jsonResponse({ ok: true, paid: false, status: 'open' })).fn)).toEqual({ kind: 'unpaid' })
  })

  it('server or network errors → unverified (never paid)', async () => {
    for (const r of [jsonResponse({ ok: false }, 502), jsonResponse({ paid: true }, 200), new Response('<html>', { status: 200 }), new TypeError('offline')]) {
      expect((await resolvePaymentReturn(payCfg, `?order=success&session_id=${SESSION}`, fakeFetch(r).fn))?.kind).toBe('unverified')
    }
  })

  it('cancelled returns are reported as cancelled, and unrelated pages are ignored', async () => {
    expect(await resolvePaymentReturn(payCfg, '?order=cancelled')).toEqual({ kind: 'cancelled' })
    expect(await resolvePaymentReturn(payCfg, '')).toBeNull()
    expect(await resolvePaymentReturn(payCfg, '?utm_source=x')).toBeNull()
  })

  it('sites without online payment ignore ?order=success entirely (e.g. the demo)', async () => {
    const f = fakeFetch(jsonResponse({ ok: true, paid: true }))
    expect(await resolvePaymentReturn(demo, `?order=success&session_id=${SESSION}`, f.fn)).toBeNull()
    expect(f.calls).toHaveLength(0)
  })
})
