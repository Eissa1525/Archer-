import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { gsap, reducedMotion } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { brand } from '../data'

const NAV = [
  { label: 'About', href: '#about' },
  { label: 'Menu', href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Order', href: '#order' },
]

/* ------------------------------------------------------------------ */
/* Loader: a sizzling counter, then the curtain tears open             */
/* ------------------------------------------------------------------ */
export function Loader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    let finished = false
    // signal "ready" once fonts are in (SplitText measures them), but never wait more than 2.5s
    const finish = () => {
      if (finished) return
      finished = true
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(() => done.current())
    }
    const ctx = gsap.context(() => {
      const counter = { v: 0 }
      const tl = gsap.timeline()
      tl.to(counter, {
        v: 100,
        duration: reducedMotion ? 0.01 : 0.9,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (num.current) num.current.textContent = String(Math.round(counter.v))
        },
      })
        .to('.loader__flame', { scale: 1.25, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '-=0.3')
        .add(finish)
        .to('.loader__half--top', { yPercent: -100, duration: reducedMotion ? 0.01 : 0.9, ease: 'expo.inOut' })
        .to('.loader__half--bottom', { yPercent: 100, duration: reducedMotion ? 0.01 : 0.9, ease: 'expo.inOut' }, '<')
        .to('.loader__center', { autoAlpha: 0, scale: 0.8, duration: 0.4 }, '<')
        .set(root.current, { display: 'none' })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="loader" aria-hidden="true">
      <div className="loader__half loader__half--top" />
      <div className="loader__half loader__half--bottom" />
      <div className="loader__center">
        <Icon name="flame" size={54} className="loader__flame" />
        <p className="loader__brand">{brand.name}</p>
        <p className="loader__count">
          <span ref={num}>0</span>%
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Custom cursor (desktop only): a dot plus a ring that grows on hover */
/* ------------------------------------------------------------------ */
export function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 })
  const ry = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 })
  const [label, setLabel] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    if (!fine || reducedMotion) return
    setEnabled(true)
    document.documentElement.classList.add('has-cursor')
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const t = (e.target as HTMLElement).closest('[data-cursor]') as HTMLElement | null
      setLabel(t ? t.dataset.cursor || '' : null)
    }
    window.addEventListener('pointermove', move)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [x, y])

  if (!enabled) return null
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} aria-hidden="true" />
      <motion.div
        className="cursor-ring"
        style={{ x: rx, y: ry }}
        animate={{ width: label !== null ? 86 : 34, height: label !== null ? 86 : 34 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        aria-hidden="true"
      >
        <AnimatePresence>
          {label && (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Header: ticker bar + nav that hides on the way down, returns on up  */
/* ------------------------------------------------------------------ */
export function Header() {
  const [hover, setHover] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const burger = useRef<HTMLButtonElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > 300 && y > last + 2)
      if (y < last - 2) setHidden(false)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open && wasOpen.current) burger.current?.focus()
    wasOpen.current = open
    if (!open) return
    firstLink.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const ticker = [...brand.topbar, ...brand.topbar]

  return (
    <>
      <motion.header
        className={`header ${scrolled ? 'header--scrolled' : ''}`}
        animate={{ y: hidden && !open ? '-110%' : '0%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="topbar" aria-label="Opening information">
          <div className="topbar__track">
            {ticker.map((t, i) => (
              <span key={i}>
                <Icon name={['pin', 'clock', 'truck', 'drop'][i % 4]} size={14} />
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="nav">
          <a className="logo" href="#top" aria-label={`${brand.short} home`}>
            <Icon name="flame" size={26} className="logo__flame" />
            <span>{brand.name}</span>
          </a>
          <nav className="nav__pills" aria-label="Primary" onMouseLeave={() => setHover(null)}>
            {NAV.map((n) => (
              <a key={n.label} href={n.href} onMouseEnter={() => setHover(n.label)} onFocus={() => setHover(n.label)}>
                {hover === n.label && (
                  <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
                )}
                <span className="nav__label">{n.label}</span>
              </a>
            ))}
          </nav>
          <a className="btn btn--orange nav__cta" href="#contact" data-cursor="Say hi">
            Contact Us
          </a>
          <button
            ref={burger}
            className="burger"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <motion.span animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }} />
            <motion.span animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }} />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="sheet"
            role="dialog"
            aria-label="Menu"
            initial={{ clipPath: 'circle(0% at 92% 6%)' }}
            animate={{ clipPath: 'circle(150% at 92% 6%)' }}
            exit={{ clipPath: 'circle(0% at 92% 6%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            {NAV.concat({ label: 'Contact', href: '#contact' }).map((n, i) => (
              <motion.a
                key={n.label}
                ref={i === 0 ? firstLink : undefined}
                href={n.href}
                onClick={() => setOpen(false)}
                initial={{ y: 60, opacity: 0, rotate: 4 }}
                animate={{ y: 0, opacity: 1, rotate: 0, transition: { delay: 0.25 + i * 0.07, type: 'spring', stiffness: 220, damping: 20 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {n.label}
              </motion.a>
            ))}
            <motion.p className="sheet__foot" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.6 } }}>
              {brand.topbar[1]}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
