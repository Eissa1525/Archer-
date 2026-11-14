import type { SiteConfig } from './types'
import { FONT_STACK, HEX } from './theme'

export interface ValidationResult {
  errors: string[]
  warnings: string[]
}

/** Text that only belongs to a demo. Any of these in client mode fails the build. */
const PLACEHOLDER_PATTERNS: [RegExp, string][] = [
  [/\.example\b/i, 'an ".example" placeholder domain'],
  [/\(555\)|\+1555|555-01\d\d/, 'a fictional 555 phone number'],
  [/\bfictional\b/i, 'the word "fictional"'],
  [/concept demo/i, '"concept demo" wording'],
  [/\blorem ipsum\b/i, 'lorem ipsum'],
  [/\bTODO\b/, 'a TODO marker'],
]

const isHttpUrl = (s: string) => /^https?:\/\/[^\s]+\.[^\s]+/.test(s)

/** Walk every string in the config, with its path. Skips the `demo` block (demo-only text). */
function strings(obj: unknown, path = ''): [string, string][] {
  if (typeof obj === 'string') return [[path, obj]]
  if (Array.isArray(obj)) return obj.flatMap((v, i) => strings(v, `${path}[${i}]`))
  if (obj && typeof obj === 'object')
    return Object.entries(obj).flatMap(([k, v]) => (path === '' && k === 'demo' ? [] : strings(v, path ? `${path}.${k}` : k)))
  return []
}

/**
 * Checks the config. In client mode, errors mean "this would publish fake or broken business
 * information" and the build is stopped (see vite.config.ts).
 */
export function validateConfig(c: SiteConfig): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const client = c.mode === 'client'
  const need = client ? errors : warnings

  // ---- menu integrity (both modes)
  const ids = new Set<string>()
  const groupIds = new Set(c.menu.optionGroups.map((g) => g.id))
  for (const cat of c.menu.categories) {
    for (const item of cat.items) {
      if (ids.has(item.id)) errors.push(`menu: duplicate item id "${item.id}"`)
      ids.add(item.id)
      if (!(item.price >= 0)) errors.push(`menu: "${item.name}" has an invalid price`)
      for (const g of item.options ?? []) if (!groupIds.has(g)) errors.push(`menu: "${item.name}" uses unknown option group "${g}"`)
    }
  }
  for (const g of c.menu.optionGroups) {
    const defaults = g.choices.filter((ch) => ch.default).length
    if (g.type === 'single' && defaults > 1) errors.push(`menu: option group "${g.id}" has more than one default`)
  }

  // ---- theme (both modes): values are injected into CSS, so they must be strictly well-formed
  for (const [k, v] of Object.entries(c.theme.colors)) if (!HEX.test(v)) errors.push(`theme.colors.${k} must be a #rrggbb colour (got "${v}")`)
  for (const k of ['display', 'body'] as const) if (!FONT_STACK.test(c.theme.fonts[k])) errors.push(`theme.fonts.${k} contains characters that are not allowed in a font list`)
  if (c.theme.fonts.googleFontsUrl && !c.theme.fonts.googleFontsUrl.startsWith('https://fonts.googleapis.com/'))
    errors.push('theme.fonts.googleFontsUrl must be a https://fonts.googleapis.com/ link (or null)')
  if (c.theme.favicon && !/^(\.\/|\/)?[\w\-./]+\.(png|svg|ico|webp)$/.test(c.theme.favicon)) errors.push('theme.favicon must be a path like ./favicon.png')

  // ---- SAFETY: a demo must never be able to send a real order or take a real payment
  if (c.mode === 'demo') {
    if (c.ordering.provider.type !== 'demo' && c.ordering.provider.type !== 'disabled')
      errors.push(`demo mode only allows ordering.provider "demo" or "disabled" (got "${c.ordering.provider.type}") — switch to mode: 'client' for real ordering`)
    if (c.ordering.payment.type !== 'pay-on-collection') errors.push('demo mode cannot use online payment (ordering.payment must be "pay-on-collection")')
  }

  // ---- ordering configuration (both modes)
  const p = c.ordering.provider
  if (p.type === 'endpoint' && !(isHttpUrl(p.url) || p.url.startsWith('/'))) errors.push('ordering.provider.url must be an https URL or a same-site path like /api/order')
  if (p.type === 'external' && !p.pickupUrl && !p.deliveryUrl) errors.push('ordering.provider (external) needs pickupUrl and/or deliveryUrl')
  if (p.type === 'external') for (const u of [p.pickupUrl, p.deliveryUrl]) if (u && !isHttpUrl(u)) errors.push(`ordering: "${u}" is not a valid URL`)
  if (c.ordering.payment.type === 'checkout-redirect' && p.type !== 'endpoint')
    errors.push('ordering.payment "checkout-redirect" requires the "endpoint" provider (the server creates the checkout session)')
  if (c.ordering.payment.type === 'checkout-redirect') {
    const u = c.ordering.payment.statusUrl ?? ''
    if (!(isHttpUrl(u) || u.startsWith('/'))) errors.push('ordering.payment.statusUrl must point to the payment-status endpoint, e.g. /api/payment-status')
  }
  if (!c.ordering.pickup.enabled && !c.ordering.delivery.enabled && (p.type === 'demo' || p.type === 'endpoint'))
    errors.push('ordering: enable pickup and/or delivery')
  for (const t of c.ordering.taxes) if (!(t.rate >= 0 && t.rate < 1)) errors.push(`ordering.taxes: "${t.label}" rate must be a fraction like 0.13`)
  if (c.reservations.enabled && !isHttpUrl(c.reservations.url)) errors.push('reservations.url must be a valid https URL when reservations are enabled')
  for (const s of c.social) if (!isHttpUrl(s.url)) errors.push(`social: "${s.url}" is not a valid URL`)

  // ---- real business information (required in client mode)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.contact.email)) need.push('contact.email is missing or invalid')
  if (!/^\+?\d{7,15}$/.test(c.contact.phone)) need.push('contact.phone must be digits only, e.g. +14165550123')
  if (!c.contact.address.trim()) need.push('contact.address is required')
  if (!c.contact.mapsUrl) need.push('contact.mapsUrl is missing (link to the real map location)')
  else if (!isHttpUrl(c.contact.mapsUrl)) errors.push('contact.mapsUrl is not a valid URL')
  if (!c.contact.hours.length) need.push('contact.hours is empty')

  if (client) {
    if (p.type === 'demo') errors.push('ordering.provider is "demo" — choose endpoint, external, phone or disabled for a real client')
    if (c.reviews.items.length && (!c.reviews.source || c.reviews.source.isSample))
      errors.push('reviews: sample reviews cannot be shown in client mode — remove them or set a real source with isSample: false')
    if (c.reviews.source && !c.reviews.source.isSample && !c.reviews.source.url)
      warnings.push('reviews.source.url is empty — linking to the real reviews (e.g. Google) builds trust')
    for (const [path, value] of strings(c)) {
      for (const [re, what] of PLACEHOLDER_PATTERNS) if (re.test(value)) errors.push(`${path} contains ${what}: "${value.slice(0, 60)}"`)
    }
    if (c.business.noindex) warnings.push('business.noindex is true — search engines will not index the live site')
  }

  return { errors, warnings }
}
