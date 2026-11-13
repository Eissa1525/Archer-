import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { AnimatePresence, MotionConfig, motion, useMotionValue, useSpring } from 'motion/react'
import { stage } from './store'
import { isCapture } from '../scene/store'

gsap.registerPlugin(ScrollTrigger, SplitText)
if (isCapture) gsap.ticker.lagSmoothing(0)

const LINKS = ['Work', 'Studio', 'Capabilities', 'Contact']

/* ---------------------------------------------------------------- */
/* Motion for React: micro-interactions                              */
/* ---------------------------------------------------------------- */

/** A button that leans toward the pointer (spring physics), with a sliding arrow. */
function Magnetic({ children, href, variant }: { children: ReactNode; href: string; variant: 'solid' | 'glass' }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 })
  return (
    <motion.a
      href={href}
      className={`ax-btn ax-btn--${variant}`}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * 0.25)
        y.set((e.clientY - (r.top + r.height / 2)) * 0.35)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="ax-btn__label">{children}</span>
      {variant === 'solid' && (
        <span className="ax-btn__arrow" aria-hidden="true">
          <span>→</span>
          <span>→</span>
        </span>
      )}
    </motion.a>
  )
}

function LogoMark() {
  return (
    <svg className="ax-logo__mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 28V14a7 7 0 0 1 14 0v14" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12.4 28V14.6a3.6 3.6 0 0 1 7.2 0V28" fill="none" stroke="var(--ax-gold)" strokeWidth="1.1" />
      <ellipse cx="16" cy="18" rx="14" ry="4.2" transform="rotate(-14 16 18)" fill="none" stroke="var(--ax-cyan)" strokeWidth="1.1" opacity=".9" />
    </svg>
  )
}

function Header() {
  const [hover, setHover] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const firstLink = useRef<HTMLAnchorElement>(null)
  const burger = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    // return focus to the menu button when the sheet closes
    if (!open && wasOpen.current) burger.current?.focus()
    wasOpen.current = open
    if (!open) return
    firstLink.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="ax-header">
        <a className="ax-logo" href="#" aria-label="AETHER Studio — home">
          <LogoMark />
          <span className="ax-logo__word">AETHER</span>
          <span className="ax-logo__sub">Studio</span>
        </a>
        <nav className="ax-nav" aria-label="Primary" onMouseLeave={() => setHover(null)}>
          {LINKS.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} onMouseEnter={() => setHover(l)} onFocus={() => setHover(l)}>
              {hover === l && (
                <motion.span layoutId="ax-nav-pill" className="ax-nav__pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <span className="ax-nav__label">{l}</span>
            </a>
          ))}
        </nav>
        <div className="ax-header__cta">
          <Magnetic href="#contact" variant="glass">
            Start a project
          </Magnetic>
        </div>
        <button
          ref={burger}
          className="ax-burger"
          aria-expanded={open}
          aria-controls="ax-sheet"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <motion.span animate={open ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }} />
          <motion.span animate={open ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }} />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="ax-sheet"
            className="ax-sheet"
            role="dialog"
            aria-label="Menu"
            initial={{ clipPath: 'inset(0% 0% 100% 0% round 28px)', opacity: 0.6 }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 28px)', opacity: 1 }}
            exit={{ clipPath: 'inset(0% 0% 100% 0% round 28px)', opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {LINKS.map((l, i) => (
              <motion.a
                key={l}
                ref={i === 0 ? firstLink : undefined}
                href={`#${l.toLowerCase()}`}
                onClick={() => setOpen(false)}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.12 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <span className="ax-sheet__index">0{i + 1}</span>
                {l}
              </motion.a>
            ))}
            <motion.div
              className="ax-sheet__cta"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { delay: 0.4 } }}
              exit={{ opacity: 0 }}
            >
              <Magnetic href="#contact" variant="solid">
                Start a project
              </Magnetic>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ---------------------------------------------------------------- */
/* GSAP: entrance, kinetic type, scroll choreography                 */
/* ---------------------------------------------------------------- */

interface Props {
  ready: boolean
  reducedMotion: boolean
  webgl: boolean
}

export function Overlay({ ready, reducedMotion, webgl }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready || !root.current) return
    let split: SplitText | null = null
    let cancelled = false
    let tick: (() => void) | null = null
    const ctx = gsap.context(() => {})

    document.fonts.ready.then(() => {
      if (cancelled) return
      ctx.add(() => {
        const d = reducedMotion ? 0.01 : 1
        const title = root.current!.querySelector('.ax-title') as HTMLElement

        split = SplitText.create(title, { type: 'lines,words,chars', mask: 'lines', charsClass: 'ax-char' })
        // per-letter gradient across the italic word while it is split
        const accent = Array.from(title.querySelectorAll('em .ax-char')) as HTMLElement[]
        const c0 = [79, 216, 255]
        const c1 = [255, 191, 94]
        accent.forEach((el, i) => {
          const k = accent.length > 1 ? i / (accent.length - 1) : 0
          const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k))
          el.style.color = `rgb(${c.join(',')})`
        })

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.to('.ax-veil', { autoAlpha: 0, duration: 1.6 * d + 0.2, ease: 'power2.inOut' }, 0)
          .to(stage, { intro: 1, duration: 5.2 * d + 0.01, ease: 'power2.inOut' }, 0.1)
          .from('.ax-header', { y: -20, autoAlpha: 0, duration: 1.2 * d }, 2.2 * d)
          .from('.ax-eyebrow', { y: 14, autoAlpha: 0, duration: 1.0 * d }, 2.4 * d)
          .from(
            split.chars,
            {
              yPercent: 115,
              rotateX: -70,
              autoAlpha: 0,
              filter: reducedMotion ? 'none' : 'blur(8px)',
              transformOrigin: '50% 100%',
              duration: 1.4 * d,
              stagger: { each: 0.028 * d, from: 'start' },
              ease: 'expo.out',
            },
            2.55 * d,
          )
          .from('.ax-lede', { y: 16, autoAlpha: 0, duration: 1.1 * d }, 3.3 * d)
          .from('.ax-ctas > *', { y: 18, autoAlpha: 0, duration: 1.0 * d, stagger: 0.1 }, 3.5 * d)
          .from('.ax-cue, .ax-meta', { autoAlpha: 0, duration: 1.2 * d, stagger: 0.15 }, 4.0 * d)
          .add(() => {
            // restore natural text flow (and the true gradient) once the reveal is done
            split?.revert()
            split = null
            title.classList.add('is-revealed')
          })

        // ---- scroll: the camera flies through the gate; copy peels away in layers
        ScrollTrigger.create({
          trigger: '.ax-hero',
          start: 'top top',
          end: 'bottom bottom',
          scrub: reducedMotion ? true : 1,
          onUpdate: (self) => {
            stage.scroll = self.progress
          },
        })
        const vh = (n: number) => () => `+=${window.innerHeight * n}`
        const layers: [string, number][] = [
          ['.ax-eyebrow', -70],
          ['.ax-title', -150],
          ['.ax-lede', -100],
          ['.ax-ctas', -60],
        ]
        layers.forEach(([sel, y]) =>
          gsap.to(sel, {
            y,
            autoAlpha: 0,
            ease: 'none',
            scrollTrigger: { trigger: '.ax-hero', start: 'top top', end: vh(0.55), scrub: true, invalidateOnRefresh: true },
          }),
        )
        gsap.to('.ax-chrome', {
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.ax-hero', start: 'top top', end: vh(0.15), scrub: true, invalidateOnRefresh: true },
        })
        gsap.fromTo(
          '.ax-next',
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '.ax-hero',
              start: () => `top+=${window.innerHeight * 1.65} top`,
              end: () => `top+=${window.innerHeight * 2.15} top`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
        gsap.fromTo(
          '.ax-dusk',
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.ax-hero',
              start: () => `top+=${window.innerHeight * 1.4} top`,
              end: 'bottom bottom',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
        // portal flash driven by the camera's proximity to the gate plane
        const flash = root.current!.querySelector('.ax-flash') as HTMLElement
        tick = () => {
          flash.style.opacity = String(Math.min(1, stage.portal * 0.9))
        }
        gsap.ticker.add(tick)
      })
    })

    return () => {
      cancelled = true
      if (tick) gsap.ticker.remove(tick)
      split?.revert()
      ctx.revert()
    }
  }, [ready, reducedMotion])

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className="ax">
        <div className="ax-veil" aria-hidden="true">
          <span>AETHER</span>
        </div>
        <Header />

        <section className="ax-hero" aria-label="Introduction">
          <div className="ax-sticky">
            <div className="ax-flash" aria-hidden="true" />
            <div className="ax-dusk" aria-hidden="true" />

            <div className="ax-copy">
              <p className="ax-eyebrow">
                <span>AETHER Studio</span>
                <span className="ax-eyebrow__rule" aria-hidden="true" />
                <span>Premium Digital Experiences</span>
              </p>
              <h1 className="ax-title">
                Digital worlds, <em>alive</em> with&nbsp;light.
              </h1>
              <p className="ax-lede">
                We design and engineer cinematic, interactive experiences for brands that want to be felt, not
                just seen.
              </p>
              <div className="ax-ctas">
                <Magnetic href="#contact" variant="solid">
                  Start a project
                </Magnetic>
                <Magnetic href="#work" variant="glass">
                  Explore the work
                </Magnetic>
              </div>
            </div>

            <div className="ax-chrome" aria-hidden="true">
              <div className="ax-cue">
                <span className="ax-cue__line" />
                <span>Scroll to enter</span>
              </div>
              <p className="ax-meta">{webgl ? 'Real-time · Interactive' : 'Static preview'}</p>
            </div>

            <div className="ax-next">
              <p className="ax-next__kicker">Chapter II</p>
              <p className="ax-next__title">
                Beyond the gate, <em>the work.</em>
              </p>
            </div>
          </div>
        </section>
      </div>
    </MotionConfig>
  )
}
