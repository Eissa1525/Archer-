/**
 * Pure order maths, shared by the browser and the server example (server/order-handler.ts).
 * The server MUST recompute totals with these functions and never trust prices sent by a browser.
 * All arithmetic is done in integer cents.
 */
import type { MenuItem, OptionGroup, SiteConfig } from '../config/types'

export type Fulfillment = 'pickup' | 'delivery'
/** groupId → chosen choice ids */
export type Selection = Record<string, string[]>

export interface CartLine {
  /** Unique per item+options+instructions, so identical lines merge. */
  key: string
  itemId: string
  qty: number
  options: Selection
  instructions?: string
}

export type PricingConfig = Pick<SiteConfig, 'menu' | 'ordering'>

export const toCents = (n: number) => Math.round(n * 100)
export const fromCents = (c: number) => c / 100

export function findItem(cfg: PricingConfig, id: string): MenuItem | undefined {
  for (const c of cfg.menu.categories) for (const i of c.items) if (i.id === id) return i
  return undefined
}

export function groupsFor(cfg: PricingConfig, item: MenuItem): OptionGroup[] {
  return (item.options ?? []).map((g) => cfg.menu.optionGroups.find((x) => x.id === g)).filter((g): g is OptionGroup => !!g)
}

export function defaultSelection(cfg: PricingConfig, item: MenuItem): Selection {
  const sel: Selection = {}
  for (const g of groupsFor(cfg, item)) {
    const d = g.choices.filter((c) => c.default).map((c) => c.id)
    sel[g.id] = g.type === 'single' && !d.length && g.required ? [g.choices[0].id] : d
  }
  return sel
}

/** Returns human-readable problems with a selection (empty = valid). */
export function selectionErrors(cfg: PricingConfig, item: MenuItem, sel: Selection): string[] {
  const errs: string[] = []
  const groups = groupsFor(cfg, item)
  for (const key of Object.keys(sel)) if (!groups.some((g) => g.id === key)) errs.push(`Unknown option "${key}"`)
  for (const g of groups) {
    const chosen = sel[g.id] ?? []
    if (chosen.some((id) => !g.choices.some((c) => c.id === id))) errs.push(`${g.label}: invalid choice`)
    if (new Set(chosen).size !== chosen.length) errs.push(`${g.label}: duplicate choice`)
    if (g.type === 'single' && chosen.length > 1) errs.push(`${g.label}: choose one`)
    if (g.required && chosen.length === 0) errs.push(`${g.label}: please choose`)
    if (g.type === 'multi' && g.max && chosen.length > g.max) errs.push(`${g.label}: up to ${g.max}`)
  }
  return errs
}

export function unitPriceCents(cfg: PricingConfig, item: MenuItem, sel: Selection): number {
  let c = toCents(item.price)
  for (const g of groupsFor(cfg, item))
    for (const id of sel[g.id] ?? []) c += toCents(g.choices.find((x) => x.id === id)?.price ?? 0)
  return c
}

export function describeSelection(cfg: PricingConfig, item: MenuItem, sel: Selection): string[] {
  return groupsFor(cfg, item).flatMap((g) =>
    (sel[g.id] ?? []).map((id) => g.choices.find((c) => c.id === id)?.label).filter((l): l is string => !!l),
  )
}

export function lineKey(itemId: string, sel: Selection, instructions = ''): string {
  const opts = Object.keys(sel)
    .sort()
    .map((k) => `${k}=${[...sel[k]].sort().join('+')}`)
    .join('&')
  return `${itemId}|${opts}|${instructions.trim().toLowerCase()}`
}

export interface Totals {
  subtotal: number
  deliveryFee: number
  taxes: { label: string; rate: number; amount: number }[]
  total: number
  itemCount: number
  /** Amount still needed to reach the delivery minimum (0 when reached or not delivery). */
  belowMinimumBy: number
}

/** Line prices for valid lines; unknown items are skipped (validate first on the server). */
export function computeTotals(cfg: PricingConfig, lines: CartLine[], fulfillment: Fulfillment): Totals {
  let subtotal = 0
  let itemCount = 0
  for (const l of lines) {
    const item = findItem(cfg, l.itemId)
    if (!item) continue
    subtotal += unitPriceCents(cfg, item, l.options) * l.qty
    itemCount += l.qty
  }
  const d = cfg.ordering.delivery
  const deliveryFee = fulfillment === 'delivery' && subtotal > 0 ? toCents(d.fee) : 0
  const taxable = subtotal + deliveryFee
  const taxes = cfg.ordering.taxes.map((t) => ({ label: t.label, rate: t.rate, amount: Math.round(taxable * t.rate) }))
  const total = taxable + taxes.reduce((s, t) => s + t.amount, 0)
  const min = fulfillment === 'delivery' && d.minimumOrder ? toCents(d.minimumOrder) : 0
  return {
    subtotal: fromCents(subtotal),
    deliveryFee: fromCents(deliveryFee),
    taxes: taxes.map((t) => ({ ...t, amount: fromCents(t.amount) })),
    total: fromCents(total),
    itemCount,
    belowMinimumBy: fromCents(Math.max(0, min - subtotal)),
  }
}
