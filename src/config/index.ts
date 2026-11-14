// `@site-config` = src/config/site.config.ts by default, or the file in SITE_CONFIG (see vite.config.ts)
import config from '@site-config'
import type { MenuItem, OptionGroup, SiteConfig } from './types'

export type * from './types'

export const site: SiteConfig = config
export const isDemo = site.mode === 'demo'

/* ----------------------------- money ----------------------------- */

const cache = new Map<string, Intl.NumberFormat>()
function fmt(minFraction: number) {
  const key = `${minFraction}`
  if (!cache.has(key))
    cache.set(
      key,
      new Intl.NumberFormat(site.locale.locale, {
        style: 'currency',
        currency: site.locale.currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: minFraction,
        maximumFractionDigits: 2,
      }),
    )
  return cache.get(key)!
}

/** Always two decimals: $10.00 (menu lists, cart, totals). */
export const money = (n: number) => fmt(2).format(n)
/** Drops ".00" for whole amounts: $11, $9.50 (price tags and badges). */
export const moneyShort = (n: number) => fmt(n % 1 ? 2 : 0).format(n)

/* ------------------------------ menu ------------------------------ */

export const allItems: MenuItem[] = site.menu.categories.flatMap((c) => c.items)
export const itemById = new Map(allItems.map((i) => [i.id, i]))
export const groupById = new Map<string, OptionGroup>(site.menu.optionGroups.map((g) => [g.id, g]))

/* ----------------------------- links ----------------------------- */

export const telHref = `tel:${site.contact.phone}`
export const mailHref = `mailto:${site.contact.email}`
