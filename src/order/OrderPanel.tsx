import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { isDemo, money, site, telHref } from '../config'
import type { MenuItem } from '../config'
import { Icon } from '../lib/Icon'
import { scroller } from '../lib/anim'
import { useOrder, hasCart } from './store'
import { defaultSelection, describeSelection, findItem, groupsFor, selectionErrors, unitPriceCents, fromCents, type Selection } from './pricing'
import { buildPayload, emptyForm, submitOrder, validateCustomer, type CustomerForm, type FormErrors, type SubmitResult } from './checkout'

type Step = 'menu' | 'cart' | 'details' | 'done'
type Done = Exclude<SubmitResult, { kind: 'error' } | { kind: 'redirect' }> | { kind: 'paid'; reference?: string } | { kind: 'cancelled' }

const ord = site.ordering
const orderable = site.menu.categories
  .map((c) => ({ ...c, items: c.items.filter((i) => i.orderable !== false) }))
  .filter((c) => c.items.length > 0)

/* ------------------------------------------------------------------ */
/* Floating cart button (only once something is in the cart)          */
/* ------------------------------------------------------------------ */
export function CartButton() {
  const { totals, isOpen, open } = useOrder()
  if (!hasCart) return null
  return (
    <AnimatePresence>
      {totals.itemCount > 0 && !isOpen && (
        <motion.button
          type="button"
          className="op-fab"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
          onClick={(e) => open(undefined, e.currentTarget)}
          aria-label={`View your order: ${totals.itemCount} items, ${money(totals.subtotal)}`}
        >
          <Icon name="bag" size={20} />
          <span className="op-fab__count">{totals.itemCount}</span>
          <span className="op-fab__total">{money(totals.subtotal)}</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Panel                                                              */
/* ------------------------------------------------------------------ */
export function OrderPanel() {
  const o = useOrder()
  const [step, setStep] = useState<Step>('menu')
  const [done, setDone] = useState<Done | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  // Coming back from a payment page (checkout-redirect): ?order=success|cancelled
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const status = q.get('order')
    if (status !== 'success' && status !== 'cancelled') return
    if (status === 'success') {
      setDone({ kind: 'paid', reference: q.get('ref') ?? undefined })
      o.clear()
    } else setDone({ kind: 'cancelled' })
    setStep('done')
    o.open()
    q.delete('order')
    q.delete('ref')
    const rest = q.toString()
    history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lock page scroll (incl. Lenis) while open, focus the heading
  useEffect(() => {
    if (!o.isOpen) return
    scroller.lenis?.stop()
    document.documentElement.classList.add('op-lock')
    const t = requestAnimationFrame(() => heading.current?.focus())
    return () => {
      cancelAnimationFrame(t)
      scroller.lenis?.start()
      document.documentElement.classList.remove('op-lock')
    }
  }, [o.isOpen])

  // a fresh open after a finished order starts at the menu again
  useEffect(() => {
    if (o.isOpen && step === 'done' && !done) setStep('menu')
  }, [o.isOpen, step, done])

  const close = () => {
    o.close()
    if (step === 'done') {
      setDone(null)
      setStep('menu')
    }
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    // keep keyboard focus inside the dialog
    const f = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([tabindex="-1"]), textarea, select, [tabindex="0"]')
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!hasCart && !done) return null

  return (
    <AnimatePresence>
      {o.isOpen && (
        <motion.div className="op" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="op__backdrop" onClick={close} aria-hidden="true" />
          <motion.div
            ref={panel}
            className="op__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="op-title"
            onKeyDown={onKeyDown}
            initial={{ y: 60, opacity: 0, rotate: -1.5 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <header className="op__head">
              <h2 id="op-title" ref={heading} tabIndex={-1} className="op__title display">
                {step === 'done' ? 'Order status' : 'Your order'}
              </h2>
              {step !== 'done' && <FulfillmentToggle />}
              <button type="button" className="round-btn op__close" aria-label="Close order" onClick={close}>
                <Icon name="close" size={18} />
              </button>
            </header>

            {isDemo && step !== 'done' && (
              <p className="op__demo" role="note">
                <Icon name="alert" size={16} /> Demo mode: try the full checkout. Orders are <strong>not sent</strong> and no payment is taken.
              </p>
            )}

            {step !== 'done' && <Steps step={step} onStep={setStep} />}

            <div className="op__body" data-lenis-prevent>
              {step === 'menu' && <MenuStep />}
              {step === 'cart' && <CartStep onBrowse={() => setStep('menu')} />}
              {step === 'details' && (
                <DetailsStep
                  onDone={(d) => {
                    setDone(d)
                    setStep('done')
                    o.clear()
                  }}
                />
              )}
              {step === 'done' && done && <DoneStep result={done} onClose={close} onBack={() => (setDone(null), setStep('cart'))} />}
            </div>

            {(step === 'menu' || step === 'cart') && <FooterBar step={step} onNext={() => setStep(step === 'menu' ? 'cart' : 'details')} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FulfillmentToggle() {
  const { fulfillment, setFulfillment } = useOrder()
  const opts = [
    { id: 'pickup' as const, label: 'Pickup', on: ord.pickup.enabled },
    { id: 'delivery' as const, label: 'Delivery', on: ord.delivery.enabled },
  ].filter((x) => x.on)
  if (opts.length < 2) return <p className="op__mode">{opts[0]?.label}</p>
  return (
    <div className="op__toggle" role="radiogroup" aria-label="Pickup or delivery">
      {opts.map((x) => (
        <button
          key={x.id}
          type="button"
          role="radio"
          aria-checked={fulfillment === x.id}
          className={`op__toggle-btn ${fulfillment === x.id ? 'is-active' : ''}`}
          onClick={() => setFulfillment(x.id)}
        >
          {fulfillment === x.id && <motion.span layoutId="op-mode-pill" className="op__toggle-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="op__toggle-label">{x.label}</span>
        </button>
      ))}
    </div>
  )
}

function Steps({ step, onStep }: { step: Step; onStep: (s: Step) => void }) {
  const { totals } = useOrder()
  const all: [Step, string][] = [
    ['menu', 'Menu'],
    ['cart', `Cart (${totals.itemCount})`],
    ['details', 'Details'],
  ]
  const idx = all.findIndex(([s]) => s === step)
  return (
    <nav className="op__steps" aria-label="Order steps">
      {all.map(([s, label], i) => (
        <button
          key={s}
          type="button"
          className={`op__step ${i === idx ? 'is-current' : ''}`}
          aria-current={i === idx ? 'step' : undefined}
          disabled={i > idx || (s !== 'menu' && totals.itemCount === 0)}
          onClick={() => onStep(s)}
        >
          <span className="op__step-n">{i + 1}</span> {label}
        </button>
      ))}
    </nav>
  )
}

/* ------------------------------ menu ------------------------------ */
function MenuStep() {
  const [tab, setTab] = useState(orderable[0]?.id)
  const [configuring, setConfiguring] = useState<MenuItem | null>(null)
  const [toast, setToast] = useState('')
  const { add } = useOrder()
  const cat = orderable.find((c) => c.id === tab) ?? orderable[0]

  const quickAdd = (item: MenuItem) => {
    if (groupsFor(site, item).length) return setConfiguring(item)
    add(item.id, 1, {})
    setToast(`Added ${item.name}`)
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  if (configuring)
    return (
      <Customize
        item={configuring}
        onCancel={() => setConfiguring(null)}
        onAdded={(name) => {
          setConfiguring(null)
          setToast(`Added ${name}`)
        }}
      />
    )

  return (
    <>
      <div className="menu__tabs op__tabs" role="tablist" aria-label="Menu categories">
        {orderable.map((m) => (
          <button
            key={m.id}
            role="tab"
            id={`op-tab-${m.id}`}
            aria-selected={tab === m.id}
            aria-controls="op-items"
            className={`menu__tab ${tab === m.id ? 'is-active' : ''}`}
            onClick={() => setTab(m.id)}
          >
            {tab === m.id && <motion.span layoutId="op-menu-pill" className="menu__tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
            <span className="menu__tab-label">{m.label}</span>
          </button>
        ))}
      </div>
      <ul id="op-items" role="tabpanel" aria-labelledby={`op-tab-${cat.id}`} className="op__items">
        {cat.items.map((it) => (
          <li key={it.id} className="op__item">
            <div className="op__item-text">
              <p className="op__item-name">
                {it.name}
                {it.spicy && <Icon name="chili" size={15} className="menu__hot" />}
              </p>
              {it.description && <p className="menu__note">{it.description}</p>}
            </div>
            <span className="menu__price">{money(it.price)}</span>
            <button type="button" className="op__add" onClick={() => quickAdd(it)} aria-label={`Add ${it.name}${groupsFor(site, it).length ? ' (choose options)' : ''}`}>
              <Icon name="plus" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <p className="op__toast" role="status" aria-live="polite">
        {toast && (
          <>
            <Icon name="check" size={16} /> {toast}
          </>
        )}
      </p>
    </>
  )
}

function Customize({ item, onCancel, onAdded }: { item: MenuItem; onCancel: () => void; onAdded: (name: string) => void }) {
  const { add } = useOrder()
  const [sel, setSel] = useState<Selection>(() => defaultSelection(site, item))
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [tried, setTried] = useState(false)
  const groups = groupsFor(site, item)
  const errs = selectionErrors(site, item, sel)
  const price = fromCents(unitPriceCents(site, item, sel) * qty)

  const toggle = (gid: string, cid: string, single: boolean, max?: number) =>
    setSel((s) => {
      const cur = s[gid] ?? []
      if (single) return { ...s, [gid]: [cid] }
      if (cur.includes(cid)) return { ...s, [gid]: cur.filter((x) => x !== cid) }
      if (max && cur.length >= max) return s
      return { ...s, [gid]: [...cur, cid] }
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (errs.length) return
    add(item.id, qty, sel, notes)
    onAdded(item.name)
  }

  return (
    <form className="op__custom" onSubmit={submit}>
      <button type="button" className="op__back" onClick={onCancel}>
        <Icon name="left" size={16} /> Back to menu
      </button>
      <h3 className="op__custom-title display">{item.name}</h3>
      {item.description && <p className="menu__note">{item.description}</p>}
      {groups.map((g) => (
        <fieldset key={g.id} className="op__group">
          <legend>
            {g.label}
            <span className="op__group-hint">{g.required ? 'Required' : g.type === 'multi' ? `Optional${g.max ? ` · up to ${g.max}` : ''}` : 'Optional'}</span>
          </legend>
          {g.choices.map((c) => {
            const id = `op-${item.id}-${g.id}-${c.id}`
            const checked = (sel[g.id] ?? []).includes(c.id)
            return (
              <label key={c.id} htmlFor={id} className={`op__choice ${checked ? 'is-checked' : ''}`}>
                <input
                  id={id}
                  type={g.type === 'single' ? 'radio' : 'checkbox'}
                  name={`${item.id}-${g.id}`}
                  checked={checked}
                  onChange={() => toggle(g.id, c.id, g.type === 'single', g.max)}
                />
                <span>{c.label}</span>
                {c.price ? <span className="op__choice-price">+{money(c.price)}</span> : null}
              </label>
            )
          })}
        </fieldset>
      ))}
      <label className="op__label" htmlFor={`op-notes-${item.id}`}>
        Special instructions <span className="op__group-hint">Optional</span>
      </label>
      <textarea
        id={`op-notes-${item.id}`}
        className="op__input"
        rows={2}
        maxLength={140}
        placeholder="No onions, sauce on the side…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {tried && errs.length > 0 && (
        <p className="op__error" role="alert">
          {errs.join(' ')}
        </p>
      )}
      <div className="op__custom-foot">
        <Qty value={qty} onChange={setQty} label={item.name} />
        <button type="submit" className="btn btn--orange">
          Add to order · {money(price)}
        </button>
      </div>
    </form>
  )
}

function Qty({ value, onChange, label, min = 1 }: { value: number; onChange: (n: number) => void; label: string; min?: number }) {
  return (
    <div className="op__qty" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(ord.maxQuantity, value + 1))} disabled={value >= ord.maxQuantity}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

/* ------------------------------ cart ------------------------------ */
function TotalsBox() {
  const { totals, fulfillment } = useOrder()
  return (
    <dl className="op__totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{money(totals.subtotal)}</dd>
      </div>
      {fulfillment === 'delivery' && (
        <div>
          <dt>Delivery</dt>
          <dd>{money(totals.deliveryFee)}</dd>
        </div>
      )}
      {totals.taxes.map((t) => (
        <div key={t.label}>
          <dt>
            {t.label} ({Math.round(t.rate * 1000) / 10}%)
          </dt>
          <dd>{money(t.amount)}</dd>
        </div>
      ))}
      <div className="op__grand">
        <dt>Total</dt>
        <dd>{money(totals.total)}</dd>
      </div>
    </dl>
  )
}

function CartStep({ onBrowse }: { onBrowse: () => void }) {
  const { lines, setQty, remove, fulfillment, totals } = useOrder()
  const est = fulfillment === 'delivery' ? ord.delivery.estimate : ord.pickup.estimate
  if (!lines.length)
    return (
      <div className="op__empty">
        <p className="display">Nothing here yet</p>
        <button type="button" className="btn btn--orange" onClick={onBrowse}>
          Browse the menu
        </button>
      </div>
    )
  return (
    <>
      <ul className="op__lines">
        {lines.map((l) => {
          const item = findItem(site, l.itemId)!
          const opts = describeSelection(site, item, l.options)
          return (
            <li key={l.key} className="op__line">
              <div className="op__item-text">
                <p className="op__item-name">{item.name}</p>
                {opts.length > 0 && <p className="menu__note">{opts.join(' · ')}</p>}
                {l.instructions && <p className="menu__note">“{l.instructions}”</p>}
              </div>
              <Qty value={l.qty} min={0} onChange={(n) => setQty(l.key, n)} label={item.name} />
              <span className="menu__price">{money(fromCents(unitPriceCents(site, item, l.options) * l.qty))}</span>
              <button type="button" className="op__remove" aria-label={`Remove ${item.name}`} onClick={() => remove(l.key)}>
                <Icon name="close" size={14} />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="op__info">
        {est && (
          <p>
            <Icon name="clock" size={16} /> {fulfillment === 'delivery' ? 'Delivery' : 'Pickup'} in about {est}
          </p>
        )}
        {fulfillment === 'delivery' && ord.delivery.area && (
          <p>
            <Icon name="truck" size={16} /> Delivery area: {ord.delivery.area}
          </p>
        )}
        {fulfillment === 'pickup' && (
          <p>
            <Icon name="pin" size={16} /> {site.contact.address}
          </p>
        )}
        {totals.belowMinimumBy > 0 && (
          <p className="op__warn" role="status">
            Add {money(totals.belowMinimumBy)} more to reach the {money(ord.delivery.minimumOrder ?? 0)} delivery minimum.
          </p>
        )}
      </div>
      <TotalsBox />
    </>
  )
}

function FooterBar({ step, onNext }: { step: Step; onNext: () => void }) {
  const { totals } = useOrder()
  const blocked = totals.itemCount === 0 || (step === 'cart' && totals.belowMinimumBy > 0)
  return (
    <footer className="op__foot">
      <p className="op__foot-sum">
        <span>{totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}</span>
        <strong>{money(totals.subtotal)}</strong>
      </p>
      <button type="button" className="btn btn--orange" disabled={blocked} onClick={onNext}>
        {step === 'menu' ? 'Review order' : 'Checkout'} <Icon name="arrow" size={18} />
      </button>
    </footer>
  )
}

/* ----------------------------- details ----------------------------- */
const FIELDS: { key: keyof CustomerForm; label: string; type?: string; auto?: string; area?: boolean; deliveryOnly?: boolean; optional?: boolean }[] = [
  { key: 'name', label: 'Name', auto: 'name' },
  { key: 'phone', label: 'Phone', type: 'tel', auto: 'tel' },
  { key: 'email', label: 'Email', type: 'email', auto: 'email' },
  { key: 'address', label: 'Delivery address', auto: 'street-address', deliveryOnly: true },
  { key: 'addressDetails', label: 'Apartment, buzzer, directions', deliveryOnly: true, optional: true },
  { key: 'notes', label: 'Notes for the kitchen', area: true, optional: true },
]

function DetailsStep({ onDone }: { onDone: (d: Done) => void }) {
  const { lines, fulfillment, totals } = useOrder()
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'redirecting'>('idle')
  const [failure, setFailure] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const emailRequired = ord.requireEmail || ord.payment.type === 'checkout-redirect'

  const fields = useMemo(() => FIELDS.filter((f) => !f.deliveryOnly || fulfillment === 'delivery'), [fulfillment])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFailure('')
    const errs = validateCustomer(site, form, fulfillment)
    setErrors(errs)
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    if (totals.belowMinimumBy > 0) return setFailure(`Delivery orders need a minimum of ${money(ord.delivery.minimumOrder ?? 0)}.`)
    setStatus('sending')
    const result = await submitOrder(site, buildPayload(site, lines, fulfillment, form))
    if (result.kind === 'redirect') {
      setStatus('redirecting')
      location.assign(result.url)
      return
    }
    setStatus('idle')
    if (result.kind === 'error') return setFailure(result.message)
    onDone(result)
  }

  return (
    <form ref={formRef} className="op__form" onSubmit={submit} noValidate>
      <div className="op__fields">
        {fields.map((f) => {
          const id = `op-field-${f.key}`
          const err = errors[f.key]
          const optional = f.optional || (f.key === 'email' && !emailRequired)
          const common = {
            id,
            name: f.key,
            className: 'op__input',
            value: form[f.key],
            autoComplete: f.auto,
            'aria-invalid': err ? true : undefined,
            'aria-describedby': err ? `${id}-err` : undefined,
            onChange: (e: { target: { value: string } }) => setForm((s) => ({ ...s, [f.key]: e.target.value })),
          }
          return (
            <div key={f.key} className={`op__field ${f.area || f.key === 'address' ? 'op__field--wide' : ''}`}>
              <label className="op__label" htmlFor={id}>
                {f.label} {optional && <span className="op__group-hint">Optional</span>}
              </label>
              {f.area ? <textarea {...common} rows={2} maxLength={500} /> : <input {...common} type={f.type ?? 'text'} />}
              {err && (
                <p id={`${id}-err`} className="op__field-err">
                  {err}
                </p>
              )}
            </div>
          )
        })}
        {/* honeypot: hidden from people and screen readers; bots fill it */}
        <div className="op__hp" aria-hidden="true">
          <label htmlFor="op-field-company">Company</label>
          <input id="op-field-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))} />
        </div>
      </div>

      <TotalsBox />
      <p className="op__pay">
        <Icon name={ord.payment.type === 'checkout-redirect' ? 'bolt' : 'combo'} size={16} />{' '}
        {ord.payment.note ?? (ord.payment.type === 'checkout-redirect' ? 'You will pay on a secure payment page.' : 'Pay when you collect your order.')}
      </p>

      {failure && (
        <div className="op__error" role="alert">
          <p>
            <Icon name="alert" size={16} /> {failure}
          </p>
          <p>
            Prefer to order by phone? <a href={telHref}>{site.contact.phoneDisplay}</a>
          </p>
        </div>
      )}

      <button type="submit" className="btn btn--orange op__submit" disabled={status !== 'idle'}>
        {status === 'sending'
          ? 'Sending order…'
          : status === 'redirecting'
            ? 'Opening secure payment…'
            : `${isDemo ? 'Place demo order' : ord.payment.type === 'checkout-redirect' ? 'Continue to payment' : 'Place order'} · ${money(totals.total)}`}
      </button>
    </form>
  )
}

/* ------------------------------- done ------------------------------- */
function DoneStep({ result, onClose, onBack }: { result: Done; onClose: () => void; onBack: () => void }) {
  const content = {
    demo: {
      icon: 'alert',
      title: 'Demo order — not sent',
      body: `This is a demo website. Your order was not sent to any restaurant and no payment was taken. On a live site with ordering connected, this is where the confirmation from ${site.business.shortName} appears.`,
    },
    received: {
      icon: 'check',
      title: 'Order received',
      body: `${site.business.shortName} has received your order${'reference' in result && result.reference ? ` (reference ${result.reference})` : ''}. ${'message' in result && result.message ? result.message : 'If anything changes, we will call you.'}`,
    },
    paid: {
      icon: 'check',
      title: 'Payment complete',
      body: `Thanks! Your payment went through${'reference' in result && result.reference ? ` (reference ${result.reference})` : ''}. ${site.business.shortName} will confirm your order by email.`,
    },
    cancelled: {
      icon: 'alert',
      title: 'Payment cancelled',
      body: 'No payment was taken and your order was not placed. Your cart is still here if you want to try again.',
    },
  }[result.kind]

  return (
    <div className={`op__done op__done--${result.kind}`}>
      <span className="op__done-icon">
        <Icon name={content.icon} size={34} />
      </span>
      <p className="op__done-title display" role="status">
        {content.title}
      </p>
      <p className="op__done-body">{content.body}</p>
      <div className="op__done-actions">
        {result.kind === 'cancelled' && (
          <button type="button" className="btn btn--orange" onClick={onBack}>
            Back to cart
          </button>
        )}
        <button type="button" className="btn btn--brown" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
