/**
 * Checkout: customer-form validation, the order payload, and submission to the configured provider.
 * Never reports success unless the configured service actually confirmed the order.
 */
import type { SiteConfig } from '../config/types'
import { computeTotals, describeSelection, findItem, unitPriceCents, fromCents, type CartLine, type Fulfillment, type Totals } from './pricing'

export interface CustomerForm {
  name: string
  phone: string
  email: string
  address: string
  addressDetails: string
  notes: string
  /** Honeypot: real people never see or fill this field. */
  hp: string
}

export const emptyForm: CustomerForm = { name: '', phone: '', email: '', address: '', addressDetails: '', notes: '', hp: '' }

export type FormErrors = Partial<Record<keyof CustomerForm, string>>

const needsEmail = (cfg: Pick<SiteConfig, 'ordering'>) => cfg.ordering.requireEmail || cfg.ordering.payment.type === 'checkout-redirect'

export function validateCustomer(cfg: Pick<SiteConfig, 'ordering'>, f: CustomerForm, fulfillment: Fulfillment): FormErrors {
  const e: FormErrors = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name.'
  const digits = f.phone.replace(/[^\d]/g, '')
  if (digits.length < 7 || digits.length > 15) e.phone = 'Please enter a phone number we can call if there is a problem.'
  if (f.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = 'This email address does not look right.'
  else if (!f.email.trim() && needsEmail(cfg)) e.email = 'Please enter your email for the confirmation.'
  if (fulfillment === 'delivery' && f.address.trim().length < 6) e.address = 'Please enter the delivery address.'
  if (f.notes.length > 500) e.notes = 'Please keep notes under 500 characters.'
  return e
}

export interface OrderPayload {
  version: 1
  restaurant: string
  fulfillment: Fulfillment
  customer: { name: string; phone: string; email?: string }
  delivery?: { address: string; details?: string }
  notes?: string
  items: {
    id: string
    name: string
    qty: number
    options: Record<string, string[]>
    optionLabels: string[]
    instructions?: string
    unitPrice: number
  }[]
  /** For display only: the server recomputes everything from its own menu. */
  totals: Totals & { currency: string }
  payment: SiteConfig['ordering']['payment']['type']
  /** Where a payment provider should send the customer back to. */
  returnUrl: string
  createdAt: string
  /** Honeypot copy, so the server can drop spam. */
  hp?: string
}

export function buildPayload(cfg: SiteConfig, lines: CartLine[], fulfillment: Fulfillment, f: CustomerForm): OrderPayload {
  const totals = computeTotals(cfg, lines, fulfillment)
  return {
    version: 1,
    restaurant: cfg.business.name,
    fulfillment,
    customer: { name: f.name.trim(), phone: f.phone.trim(), ...(f.email.trim() ? { email: f.email.trim() } : {}) },
    ...(fulfillment === 'delivery' ? { delivery: { address: f.address.trim(), ...(f.addressDetails.trim() ? { details: f.addressDetails.trim() } : {}) } } : {}),
    ...(f.notes.trim() ? { notes: f.notes.trim() } : {}),
    items: lines.flatMap((l) => {
      const item = findItem(cfg, l.itemId)
      if (!item) return []
      return [
        {
          id: l.itemId,
          name: item.name,
          qty: l.qty,
          options: l.options,
          optionLabels: describeSelection(cfg, item, l.options),
          ...(l.instructions ? { instructions: l.instructions } : {}),
          unitPrice: fromCents(unitPriceCents(cfg, item, l.options)),
        },
      ]
    }),
    totals: { ...totals, currency: cfg.locale.currency },
    payment: cfg.ordering.payment.type,
    returnUrl: typeof window !== 'undefined' ? `${location.origin}${location.pathname}` : '',
    createdAt: new Date().toISOString(),
    ...(f.hp ? { hp: f.hp } : {}),
  }
}

export type SubmitResult =
  /** demo provider: nothing was sent, and the UI must say so. */
  | { kind: 'demo' }
  | { kind: 'received'; reference?: string; message?: string }
  | { kind: 'redirect'; url: string }
  | { kind: 'error'; message: string }

export async function submitOrder(cfg: SiteConfig, payload: OrderPayload, fetchImpl: typeof fetch = fetch): Promise<SubmitResult> {
  const p = cfg.ordering.provider
  if (p.type === 'demo') return { kind: 'demo' }
  if (p.type !== 'endpoint') return { kind: 'error', message: 'Online ordering is not set up for this restaurant.' }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), p.timeoutMs ?? 15000)
  try {
    const res = await fetchImpl(p.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    let data: { ok?: boolean; reference?: string; checkoutUrl?: string; message?: string; error?: string } = {}
    try {
      data = await res.json()
    } catch {
      /* non-JSON body */
    }
    if (!res.ok || data.ok !== true) {
      return { kind: 'error', message: data.error || data.message || `The restaurant's ordering service did not accept the order (error ${res.status}).` }
    }
    if (cfg.ordering.payment.type === 'checkout-redirect') {
      if (data.checkoutUrl && /^https:\/\//.test(data.checkoutUrl)) return { kind: 'redirect', url: data.checkoutUrl }
      return { kind: 'error', message: 'The payment page could not be created. Your order was not placed.' }
    }
    return { kind: 'received', reference: data.reference, message: data.message }
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError'
    return {
      kind: 'error',
      message: aborted
        ? 'The ordering service took too long to answer. Your order may not have been placed. Please call us before trying again.'
        : 'We could not reach the ordering service. Check your connection and try again.',
    }
  } finally {
    clearTimeout(timer)
  }
}
