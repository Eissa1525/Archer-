/**
 * Portable order endpoint for the restaurant site (Web-standard Request/Response).
 * Runs on Cloudflare Pages Functions, Vercel, Netlify, Deno, Bun or Node 18+ — see server/README.md.
 *
 * What it does:
 *   1. validates the order and RECOMPUTES every price from the menu (never trusts the browser),
 *   2. notifies the restaurant (webhook and/or email) — or creates a Stripe Checkout Session,
 *   3. answers { ok: true, reference } ONLY when the restaurant was actually notified.
 *
 * All secrets come from environment variables on the server. Nothing secret is ever sent to the browser.
 */
import type { SiteConfig } from '../src/config/types'
import { computeTotals, findItem, selectionErrors, unitPriceCents, describeSelection, fromCents, type CartLine, type Fulfillment } from '../src/order/pricing'

export interface Env {
  /** Required for checkout-redirect; also used as the allowed CORS origin. e.g. https://www.restaurant.com */
  SITE_URL?: string
  /** Optional: extra allowed origin for CORS (comma separated). */
  ALLOWED_ORIGINS?: string
  /** Notification channel 1: any webhook (Make, Zapier, n8n, Slack, Discord, Google Apps Script…). */
  ORDER_WEBHOOK_URL?: string
  /** Notification channel 2: email through Resend (https://resend.com). */
  RESEND_API_KEY?: string
  ORDER_EMAIL_TO?: string
  ORDER_EMAIL_FROM?: string
  /** Online payment through Stripe Checkout (payment.type = 'checkout-redirect'). */
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

/**
 * Key-value storage used to make the Stripe webhook idempotent.
 * The shape matches a Cloudflare KV namespace (get / put with expirationTtl / delete), so a KV binding
 * can be passed straight in. `putIfAbsent` is optional: provide it when the store supports an atomic
 * "create only if missing" (Durable Object, D1/Postgres unique insert, Redis SET NX) to also make
 * truly simultaneous deliveries safe. Without it, retries are still de-duplicated.
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  putIfAbsent?(key: string, value: string, options?: { expirationTtl?: number }): Promise<boolean>
}

/** In-memory store (atomic). For tests and local runs only: serverless instances do not share memory. */
export function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    async get(k) {
      return data.get(k) ?? null
    },
    async put(k, v) {
      data.set(k, v)
    },
    async delete(k) {
      data.delete(k)
    },
    async putIfAbsent(k, v) {
      if (data.has(k)) return false
      data.set(k, v)
      return true
    },
  }
}

type Fetch = typeof fetch

interface IncomingItem {
  id?: unknown
  qty?: unknown
  options?: unknown
  instructions?: unknown
}

export interface ValidOrder {
  reference: string
  fulfillment: Fulfillment
  customer: { name: string; phone: string; email?: string }
  delivery?: { address: string; details?: string }
  notes?: string
  lines: (CartLine & { name: string; optionLabels: string[]; unitPrice: number; lineTotal: number })[]
  totals: ReturnType<typeof computeTotals>
  currency: string
  createdAt: string
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin')
  const allowed = [env.SITE_URL, ...(env.ALLOWED_ORIGINS ?? '').split(',')].map((s) => s?.trim().replace(/\/$/, '')).filter(Boolean)
  if (origin && allowed.includes(origin)) return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
  return {}
}

export function makeReference(prefix: string, now = Date.now(), rand = Math.random()): string {
  const letters = prefix.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'ORD'
  return `${letters}-${now.toString(36).slice(-4).toUpperCase()}${Math.floor(rand * 1296).toString(36).toUpperCase().padStart(2, '0')}`
}

/** Validate an untrusted payload against the menu. Returns the clean order or a list of problems. */
export function validateOrder(cfg: SiteConfig, body: unknown): { order?: ValidOrder; errors: string[] } {
  const errors: string[] = []
  const b = (body ?? {}) as Record<string, unknown>
  const fulfillment = b.fulfillment === 'delivery' ? 'delivery' : b.fulfillment === 'pickup' ? 'pickup' : null
  if (!fulfillment) errors.push('Choose pickup or delivery.')
  else if (fulfillment === 'pickup' && !cfg.ordering.pickup.enabled) errors.push('Pickup is not available.')
  else if (fulfillment === 'delivery' && !cfg.ordering.delivery.enabled) errors.push('Delivery is not available.')

  const c = (b.customer ?? {}) as Record<string, unknown>
  const customer = { name: str(c.name, 80), phone: str(c.phone, 30), email: str(c.email, 120) }
  if (customer.name.length < 2) errors.push('Name is required.')
  const digits = customer.phone.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) errors.push('A valid phone number is required.')
  if (customer.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) errors.push('Email address is invalid.')
  if (!customer.email && (cfg.ordering.requireEmail || cfg.ordering.payment.type === 'checkout-redirect')) errors.push('Email is required.')

  const d = (b.delivery ?? {}) as Record<string, unknown>
  const delivery = fulfillment === 'delivery' ? { address: str(d.address, 200), details: str(d.details, 200) } : undefined
  if (delivery && delivery.address.length < 6) errors.push('Delivery address is required.')

  const rawItems = Array.isArray(b.items) ? (b.items as IncomingItem[]) : []
  if (rawItems.length === 0) errors.push('The order is empty.')
  if (rawItems.length > 50) errors.push('Too many lines in one order.')

  const lines: ValidOrder['lines'] = []
  for (const raw of rawItems.slice(0, 50)) {
    const id = str(raw.id, 80)
    const item = findItem(cfg, id)
    if (!item || item.orderable === false) {
      errors.push(`"${id}" is not on the menu.`)
      continue
    }
    const qty = Number(raw.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > cfg.ordering.maxQuantity) {
      errors.push(`Invalid quantity for ${item.name}.`)
      continue
    }
    const options: Record<string, string[]> = {}
    if (raw.options && typeof raw.options === 'object')
      for (const [k, v] of Object.entries(raw.options as Record<string, unknown>)) options[k] = Array.isArray(v) ? v.map((x) => String(x)) : []
    const problems = selectionErrors(cfg, item, options)
    if (problems.length) {
      errors.push(`${item.name}: ${problems.join(', ')}`)
      continue
    }
    const unit = unitPriceCents(cfg, item, options)
    lines.push({
      key: id,
      itemId: id,
      qty,
      options,
      instructions: str(raw.instructions, 140) || undefined,
      name: item.name,
      optionLabels: describeSelection(cfg, item, options),
      unitPrice: fromCents(unit),
      lineTotal: fromCents(unit * qty),
    })
  }

  if (errors.length || !fulfillment) return { errors }
  const totals = computeTotals(cfg, lines, fulfillment)
  if (totals.belowMinimumBy > 0) return { errors: [`Delivery orders need a minimum of ${cfg.ordering.delivery.minimumOrder} ${cfg.locale.currency}.`] }

  return {
    errors: [],
    order: {
      reference: makeReference(cfg.business.shortName),
      fulfillment,
      customer: { name: customer.name, phone: customer.phone, ...(customer.email ? { email: customer.email } : {}) },
      ...(delivery ? { delivery: { address: delivery.address, ...(delivery.details ? { details: delivery.details } : {}) } } : {}),
      ...(str(b.notes, 500) ? { notes: str(b.notes, 500) } : {}),
      lines,
      totals,
      currency: cfg.locale.currency,
      createdAt: new Date().toISOString(),
    },
  }
}

/** Plain-text ticket used for email, Slack, Discord, etc. */
export function formatTicket(cfg: SiteConfig, o: ValidOrder): string {
  const m = (n: number) => new Intl.NumberFormat(cfg.locale.locale, { style: 'currency', currency: cfg.locale.currency }).format(n)
  const rows = o.lines.map((l) => {
    const extra = [l.optionLabels.join(', '), l.instructions ? `"${l.instructions}"` : ''].filter(Boolean).join(' · ')
    return `${l.qty} × ${l.name}  ${m(l.lineTotal)}${extra ? `\n     ${extra}` : ''}`
  })
  return [
    `NEW ${o.fulfillment.toUpperCase()} ORDER ${o.reference}`,
    `${o.customer.name} · ${o.customer.phone}${o.customer.email ? ` · ${o.customer.email}` : ''}`,
    o.delivery ? `Deliver to: ${o.delivery.address}${o.delivery.details ? ` (${o.delivery.details})` : ''}` : 'Pickup',
    '',
    ...rows,
    '',
    `Subtotal ${m(o.totals.subtotal)}`,
    ...(o.totals.deliveryFee ? [`Delivery ${m(o.totals.deliveryFee)}`] : []),
    ...o.totals.taxes.map((t) => `${t.label} ${m(t.amount)}`),
    `TOTAL ${m(o.totals.total)}`,
    ...(o.notes ? ['', `Notes: ${o.notes}`] : []),
  ].join('\n')
}

/** Sends the order to every configured channel. Returns how many succeeded. */
export async function notifyRestaurant(cfg: SiteConfig, env: Env, o: ValidOrder, f: Fetch = fetch): Promise<{ sent: number; attempted: number }> {
  const ticket = formatTicket(cfg, o)
  const jobs: Promise<boolean>[] = []
  if (env.ORDER_WEBHOOK_URL) {
    jobs.push(
      f(env.ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `text` = Slack, `content` = Discord, `order` = everything for Make/Zapier/n8n/Apps Script
        body: JSON.stringify({ text: ticket, content: ticket.slice(0, 1900), order: o }),
      })
        .then((r) => r.ok)
        .catch(() => false),
    )
  }
  if (env.RESEND_API_KEY && env.ORDER_EMAIL_TO && env.ORDER_EMAIL_FROM) {
    jobs.push(
      f('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.ORDER_EMAIL_FROM,
          to: env.ORDER_EMAIL_TO.split(',').map((s) => s.trim()),
          subject: `${o.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'} order ${o.reference} — ${o.customer.name}`,
          text: ticket,
          ...(o.customer.email ? { reply_to: o.customer.email } : {}),
        }),
      })
        .then((r) => r.ok)
        .catch(() => false),
    )
  }
  const results = await Promise.all(jobs)
  return { sent: results.filter(Boolean).length, attempted: jobs.length }
}

/** Creates a Stripe Checkout Session (server-side, with the client's secret key). */
export async function createStripeCheckout(_cfg: SiteConfig, env: Env, o: ValidOrder, f: Fetch = fetch): Promise<string> {
  if (!env.STRIPE_SECRET_KEY || !env.SITE_URL) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY, SITE_URL).')
  const base = env.SITE_URL.replace(/\/$/, '')
  const p = new URLSearchParams()
  p.set('mode', 'payment')
  // return URLs come from server config, never from the browser (no open redirects)
  // {CHECKOUT_SESSION_ID} is filled in by Stripe; the page sends it to /api/payment-status, which
  // asks Stripe whether this session is really paid (the URL itself proves nothing).
  p.set('success_url', `${base}/?order=success&session_id={CHECKOUT_SESSION_ID}`)
  p.set('cancel_url', `${base}/?order=cancelled`)
  if (o.customer.email) p.set('customer_email', o.customer.email)
  const cur = o.currency.toLowerCase()
  const add = (i: number, name: string, cents: number, qty: number, description?: string) => {
    p.set(`line_items[${i}][quantity]`, String(qty))
    p.set(`line_items[${i}][price_data][currency]`, cur)
    p.set(`line_items[${i}][price_data][unit_amount]`, String(cents))
    p.set(`line_items[${i}][price_data][product_data][name]`, name)
    if (description) p.set(`line_items[${i}][price_data][product_data][description]`, description.slice(0, 300))
  }
  let i = 0
  for (const l of o.lines) add(i++, l.name, Math.round(l.unitPrice * 100), l.qty, [l.optionLabels.join(', '), l.instructions].filter(Boolean).join(' · ') || undefined)
  if (o.totals.deliveryFee) add(i++, 'Delivery', Math.round(o.totals.deliveryFee * 100), 1)
  for (const t of o.totals.taxes) if (t.amount) add(i++, t.label, Math.round(t.amount * 100), 1)
  const meta: Record<string, string> = {
    reference: o.reference,
    fulfillment: o.fulfillment,
    name: o.customer.name,
    phone: o.customer.phone,
    address: o.delivery ? `${o.delivery.address}${o.delivery.details ? ` (${o.delivery.details})` : ''}` : '',
    notes: o.notes ?? '',
  }
  for (const [k, v] of Object.entries(meta)) p.set(`metadata[${k}]`, v.slice(0, 480))
  const res = await f('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p.toString(),
  })
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: { message?: string } }
  if (!res.ok || !data.url) throw new Error(data.error?.message ?? `Stripe error ${res.status}`)
  return data.url
}

/** POST /api/order */
export async function handleOrderRequest(req: Request, env: Env, cfg: SiteConfig, f: Fetch = fetch): Promise<Response> {
  const cors = corsHeaders(req, env)
  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, cors)

  const text = await req.text()
  if (text.length > 30_000) return json({ ok: false, error: 'Order is too large.' }, 413, cors)
  let body: Record<string, unknown>
  try {
    body = JSON.parse(text)
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400, cors)
  }
  if (body.hp) return json({ ok: false, error: 'Your order could not be submitted. Please call us.' }, 400, cors)

  const { order, errors } = validateOrder(cfg, body)
  if (!order) return json({ ok: false, error: errors.join(' ') }, 422, cors)

  if (cfg.ordering.payment.type === 'checkout-redirect') {
    try {
      // the restaurant is notified by handleStripeWebhook once the payment succeeds
      return json({ ok: true, reference: order.reference, checkoutUrl: await createStripeCheckout(cfg, env, order, f) }, 200, cors)
    } catch {
      return json({ ok: false, error: 'Online payment is unavailable right now. Your order was not placed.' }, 502, cors)
    }
  }

  const { sent, attempted } = await notifyRestaurant(cfg, env, order, f)
  if (attempted === 0) return json({ ok: false, error: 'Online ordering is not set up yet. Please call us to order.' }, 503, cors)
  if (sent === 0) return json({ ok: false, error: 'We could not deliver your order to the kitchen. Please call us.' }, 502, cors)
  return json({ ok: true, reference: order.reference }, 200, cors)
}

/* ------------------------- Stripe webhook ------------------------- */

const enc = new TextEncoder()
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** Verifies the `Stripe-Signature` header (HMAC-SHA256, 5-minute tolerance). */
export async function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]))
  const t = Number(parts.t)
  const sigs = header
    .split(',')
    .filter((kv) => kv.startsWith('v1='))
    .map((kv) => kv.slice(3))
  if (!t || !sigs.length || Math.abs(nowSec - t) > 300) return false
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = toHex(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`)))
  return sigs.some((s) => s.length === expected.length && [...s].reduce((acc, ch, i) => acc | (ch.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0)
}

/* ---------------------- payment status (return page) ---------------------- */

const SESSION_ID = /^cs_(test_|live_)?[A-Za-z0-9]{10,200}$/

export interface PaymentStatus {
  ok: boolean
  /** true only when Stripe reports the session complete AND paid. */
  paid?: boolean
  /** Stripe session status: open | complete | expired */
  status?: string
  reference?: string
  error?: string
}

/**
 * GET /api/payment-status?session_id=cs_...
 * Asks Stripe (with the secret key) whether a Checkout Session was paid. The browser shows
 * "Payment complete" only when this answers { ok: true, paid: true }. No personal data is returned.
 */
export async function handlePaymentStatus(req: Request, env: Env, _cfg: SiteConfig, f: Fetch = fetch): Promise<Response> {
  const cors = corsHeaders(req, env)
  const noStore = { ...cors, 'Cache-Control': 'no-store' }
  if (req.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405, noStore)
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: 'Payments are not configured.' }, 503, noStore)
  const id = new URL(req.url).searchParams.get('session_id') ?? ''
  if (!SESSION_ID.test(id)) return json({ ok: false, error: 'Invalid payment reference.' }, 400, noStore)
  let res: Response
  try {
    res = await f(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } })
  } catch {
    return json({ ok: false, error: 'Could not reach the payment provider.' }, 502, noStore)
  }
  if (res.status === 404) return json({ ok: false, error: 'Payment not found.' }, 404, noStore)
  if (!res.ok) return json({ ok: false, error: 'Could not check the payment.' }, 502, noStore)
  const sess = (await res.json().catch(() => ({}))) as { status?: string; payment_status?: string; metadata?: Record<string, string> }
  const paid = sess.status === 'complete' && sess.payment_status === 'paid'
  return json({ ok: true, paid, status: sess.status, reference: sess.metadata?.reference } satisfies PaymentStatus, 200, noStore)
}

/* ------------------------- Stripe webhook ------------------------- */

/** How long an unfinished claim blocks other deliveries of the same session. */
const PROCESSING_LOCK_MS = 120_000
/** How long a finished session is remembered (Stripe retries for up to 3 days). */
const DONE_TTL_SECONDS = 60 * 60 * 24 * 30

type Claim = { state: 'processing' | 'done'; at: number }

/**
 * Claims a Stripe session for processing.
 * 'new'        → this delivery must notify the restaurant.
 * 'done'       → already delivered: acknowledge without notifying again.
 * 'processing' → another delivery is working on it right now: ask Stripe to retry later.
 */
export async function claimSession(store: KeyValueStore, key: string, now = Date.now()): Promise<'new' | 'done' | 'processing'> {
  const value = JSON.stringify({ state: 'processing', at: now } satisfies Claim)
  const ttl = { expirationTtl: Math.ceil((PROCESSING_LOCK_MS * 2) / 1000) }
  if (store.putIfAbsent && (await store.putIfAbsent(key, value, ttl))) return 'new'
  const existing = await store.get(key)
  if (existing) {
    let claim: Claim | null = null
    try {
      claim = JSON.parse(existing) as Claim
    } catch {
      /* corrupt entry: treat as missing */
    }
    if (claim?.state === 'done') return 'done'
    if (claim && now - claim.at < PROCESSING_LOCK_MS) return 'processing'
  }
  // stale or missing claim: take it over
  await store.put(key, value, ttl)
  return 'new'
}

/**
 * POST /api/stripe-webhook — notifies the restaurant once Stripe confirms the payment.
 * Idempotent per Checkout Session: Stripe retries and duplicate deliveries never create a second
 * kitchen order. Requires a KeyValueStore; without one it refuses (503) rather than risk duplicates.
 */
export async function handleStripeWebhook(
  req: Request,
  env: Env,
  cfg: SiteConfig,
  deps: { store?: KeyValueStore | null; fetch?: Fetch; now?: () => number } = {},
): Promise<Response> {
  const f = deps.fetch ?? fetch
  const now = deps.now ?? Date.now
  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) return json({ error: 'not configured' }, 503)
  if (!deps.store) return json({ error: 'idempotency store not configured' }, 503)
  const payload = await req.text()
  if (!(await verifyStripeSignature(payload, req.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET))) return json({ error: 'bad signature' }, 400)
  const event = JSON.parse(payload) as { id?: string; type: string; data: { object: { id: string; metadata: Record<string, string>; customer_details?: { email?: string }; amount_total?: number; payment_status?: string } } }
  if (event.type !== 'checkout.session.completed' || event.data.object.payment_status !== 'paid') return json({ received: true })

  const s = event.data.object
  const key = `stripe-session:${s.id}`
  const claim = await claimSession(deps.store, key, now())
  if (claim === 'done') return json({ received: true, duplicate: true })
  if (claim === 'processing') return json({ error: 'already processing, retry later' }, 409)

  let delivered = false
  try {
    const r = await f(`https://api.stripe.com/v1/checkout/sessions/${s.id}/line_items?limit=100`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } })
    const items = ((await r.json().catch(() => ({}))) as { data?: { description: string; quantity: number; amount_total: number }[] }).data ?? []
    const md = s.metadata
    const m = (cents: number) => new Intl.NumberFormat(cfg.locale.locale, { style: 'currency', currency: cfg.locale.currency }).format(cents / 100)
    const ticket = [
      `PAID ${md.fulfillment?.toUpperCase()} ORDER ${md.reference}`,
      `${md.name} · ${md.phone}${s.customer_details?.email ? ` · ${s.customer_details.email}` : ''}`,
      md.address ? `Deliver to: ${md.address}` : 'Pickup',
      '',
      ...items.map((i) => `${i.quantity} × ${i.description}  ${m(i.amount_total)}`),
      '',
      `PAID ${m(s.amount_total ?? 0)} (Stripe ${s.id})`,
      ...(md.notes ? [`Notes: ${md.notes}`] : []),
    ].join('\n')
    // same key downstream too, so receivers that support it can drop duplicates as a second layer
    const idempotencyKey = `stripe-${s.id}`
    const order = { reference: md.reference, paid: true, stripeSession: s.id, idempotencyKey, ticket }
    const sends: Promise<boolean>[] = []
    if (env.ORDER_WEBHOOK_URL)
      sends.push(
        f(env.ORDER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({ text: ticket, content: ticket.slice(0, 1900), order }),
        }).then((x) => x.ok, () => false),
      )
    if (env.RESEND_API_KEY && env.ORDER_EMAIL_TO && env.ORDER_EMAIL_FROM)
      sends.push(
        f('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({ from: env.ORDER_EMAIL_FROM, to: env.ORDER_EMAIL_TO.split(',').map((x) => x.trim()), subject: `PAID order ${md.reference} — ${md.name}`, text: ticket }),
        }).then((x) => x.ok, () => false),
      )
    delivered = (await Promise.all(sends)).some(Boolean)
  } catch {
    delivered = false
  }

  if (delivered) {
    await deps.store.put(key, JSON.stringify({ state: 'done', at: now() } satisfies Claim), { expirationTtl: DONE_TTL_SECONDS })
    return json({ received: true })
  }
  // release the claim so Stripe's retry can deliver it (a non-2xx makes Stripe retry)
  await deps.store.delete(key)
  return json({ error: 'notification failed' }, 500)
}
