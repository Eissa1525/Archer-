import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { site } from '../config'
import { computeTotals, findItem, lineKey, type CartLine, type Fulfillment, type Selection, type Totals } from './pricing'

export type { Fulfillment } from './pricing'

/** Online ordering in this site (cart + checkout) is only used by these providers. */
export const hasCart = site.ordering.provider.type === 'demo' || site.ordering.provider.type === 'endpoint'

const STORAGE_KEY = `cart:${site.business.shortName}:v1`
const defaultFulfillment: Fulfillment = site.ordering.pickup.enabled ? 'pickup' : 'delivery'

interface Saved {
  lines: CartLine[]
  fulfillment: Fulfillment
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Saved
      // drop lines whose items no longer exist on the menu
      const lines = (s.lines ?? []).filter((l) => findItem(site, l.itemId) && l.qty > 0)
      const fulfillment = s.fulfillment === 'delivery' && site.ordering.delivery.enabled ? 'delivery' : defaultFulfillment
      return { lines, fulfillment }
    }
  } catch {
    /* storage blocked (private mode) — start empty */
  }
  return { lines: [], fulfillment: defaultFulfillment }
}

interface OrderCtx {
  lines: CartLine[]
  fulfillment: Fulfillment
  totals: Totals
  isOpen: boolean
  open: (f?: Fulfillment, opener?: HTMLElement | null) => void
  close: () => void
  setFulfillment: (f: Fulfillment) => void
  add: (itemId: string, qty: number, options: Selection, instructions?: string) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
}

const Ctx = createContext<OrderCtx | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(load)
  const [lines, setLines] = useState<CartLine[]>(saved.lines)
  const [fulfillment, setFulfillment] = useState<Fulfillment>(saved.fulfillment)
  const [isOpen, setOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, fulfillment }))
    } catch {
      /* ignore */
    }
  }, [lines, fulfillment])

  const max = site.ordering.maxQuantity

  const add = useCallback(
    (itemId: string, qty: number, options: Selection, instructions?: string) => {
      const key = lineKey(itemId, options, instructions)
      setLines((ls) => {
        const i = ls.findIndex((l) => l.key === key)
        if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, qty: Math.min(max, l.qty + qty) } : l))
        return [...ls, { key, itemId, qty: Math.min(max, qty), options, ...(instructions?.trim() ? { instructions: instructions.trim() } : {}) }]
      })
    },
    [max],
  )

  const value = useMemo<OrderCtx>(
    () => ({
      lines,
      fulfillment,
      totals: computeTotals(site, lines, fulfillment),
      isOpen,
      open: (f, el) => {
        if (f && (f === 'pickup' ? site.ordering.pickup.enabled : site.ordering.delivery.enabled)) setFulfillment(f)
        opener.current = el ?? (document.activeElement as HTMLElement | null)
        setOpen(true)
      },
      close: () => {
        setOpen(false)
        // give focus back to whatever opened the panel
        requestAnimationFrame(() => opener.current?.focus?.())
      },
      setFulfillment,
      add,
      setQty: (key, qty) => setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, qty: Math.min(max, qty) } : l)))),
      remove: (key) => setLines((ls) => ls.filter((l) => l.key !== key)),
      clear: () => setLines([]),
    }),
    [lines, fulfillment, isOpen, add, max],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOrder(): OrderCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useOrder must be used inside <OrderProvider>')
  return c
}
