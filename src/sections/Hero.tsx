import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, reducedMotion, SplitText, useReady } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { TornEdge } from '../lib/TornEdge'
import { slides } from '../data'

const AUTOPLAY_MS = 6500
const STICKER_SLOTS = ['hero__sticker--a', 'hero__sticker--b', 'hero__sticker--c']

export function Hero() {
  const ready = useReady()
  const root = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const dir = useRef<1 | -1>(1)
  const busy = useRef(false)
  const first = useRef(true)
  const split = useRef<SplitText | null>(null)
  const [paused, setPaused] = useState(false)
  const slide = slides[index]

  /* ---------- IN: runs on first reveal and after every slide change ---------- */
  useLayoutEffect(() => {
    if (!ready || !root.current) return
    const q = gsap.utils.selector(root)
    split.current?.revert()
    split.current = SplitText.create(q('.hero__line'), { type: 'chars', charsClass: 'hero__ch' })
    const chars = split.current.chars
    const d = reducedMotion ? 0.01 : 1
    const intro = first.current

    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false
        first.current = false
      },
    })
    if (intro) {
      // first entrance: letters fall from above and bounce, the plate spins in from nothing
      tl.from(chars, {
        yPercent: -160,
        rotate: () => gsap.utils.random(-40, 40),
        autoAlpha: 0,
        duration: 1.1 * d,
        ease: 'bounce.out',
        stagger: { each: 0.045, from: 'center' },
      })
        .from(q('.hero__plate'), { scale: 0, rotate: -220, duration: 1.3 * d, ease: 'back.out(1.6)' }, 0.35 * d)
        .from(q('.hero__tagline, .hero__ctas > *'), { y: 30, autoAlpha: 0, duration: 0.7 * d, stagger: 0.1 }, 0.9 * d)
        .from(q('.hero__arrow, .hero__dots'), { autoAlpha: 0, scale: 0.6, duration: 0.6 * d, stagger: 0.08 }, 1.1 * d)
    } else {
      // slide change: letters flip in, plate rolls in from the side it was swiped toward
      tl.from(chars, {
        rotateX: -95,
        yPercent: 60,
        autoAlpha: 0,
        transformOrigin: '50% 100%',
        duration: 0.75 * d,
        ease: 'back.out(2)',
        stagger: { each: 0.03, from: dir.current > 0 ? 'start' : 'end' },
      }).fromTo(
        q('.hero__plate'),
        { xPercent: 130 * dir.current, rotate: 200 * dir.current, scale: 0.7 },
        { xPercent: 0, rotate: 0, scale: 1, duration: 0.95 * d, ease: 'power3.out' },
        0,
      )
      // the out-tween left these hidden, so animate explicitly to the visible state
      tl.fromTo(q('.hero__tagline'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 * d }, 0.2)
    }
    tl.fromTo(
      q('.hero__sticker'),
      { scale: 0, rotate: () => gsap.utils.random(-50, 50) },
      { scale: 1, rotate: (i: number) => [-8, 6, -4][i % 3], duration: 0.6 * d, ease: 'back.out(3)', stagger: 0.12 },
      intro ? 1.2 * d : 0.35 * d,
    ).fromTo(q('.hero__badge'), { scale: 0 }, { scale: 1, duration: 0.5 * d, ease: 'back.out(3)', stagger: 0.1 }, '<0.1')
    return () => {
      tl.kill()
    }
  }, [ready, index])

  /* ---------- OUT then change slide ---------- */
  const go = useCallback(
    (step: 1 | -1) => {
      if (busy.current || !root.current) return
      busy.current = true
      dir.current = step
      const q = gsap.utils.selector(root)
      const d = reducedMotion ? 0.01 : 1
      gsap
        .timeline({ onComplete: () => setIndex((i) => (i + step + slides.length) % slides.length) })
        .to(q('.hero__ch'), { rotateX: 95, yPercent: -50, autoAlpha: 0, transformOrigin: '50% 0%', duration: 0.4 * d, ease: 'power2.in', stagger: { each: 0.018, from: step > 0 ? 'start' : 'end' } })
        .to(q('.hero__plate'), { xPercent: -130 * step, rotate: -200 * step, scale: 0.7, duration: 0.6 * d, ease: 'power3.in' }, 0)
        .to(q('.hero__sticker, .hero__badge'), { scale: 0, duration: 0.25 * d, stagger: 0.04 }, 0)
        .to(q('.hero__tagline'), { autoAlpha: 0, duration: 0.25 * d }, 0)
    },
    [],
  )

  /* ---------- autoplay (pauses on hover, hidden tab, or after interaction) ---------- */
  useEffect(() => {
    if (!ready || paused || reducedMotion) return
    const t = window.setTimeout(() => {
      if (!document.hidden) go(1)
    }, AUTOPLAY_MS)
    return () => window.clearTimeout(t)
  }, [ready, paused, index, go])

  /* ---------- mouse parallax + scroll-away scrub ---------- */
  useLayoutEffect(() => {
    if (!ready || !root.current) return
    const ctx = gsap.context(() => {
      const dish = gsap.quickTo('.hero__dish', 'x', { duration: 0.8, ease: 'power3' })
      const dishY = gsap.quickTo('.hero__dish', 'y', { duration: 0.8, ease: 'power3' })
      const tilt = gsap.quickTo('.hero__dish', 'rotate', { duration: 1, ease: 'power3' })
      const tagsX = gsap.quickTo('.hero__tags', 'x', { duration: 0.6, ease: 'power3' })
      const tagsY = gsap.quickTo('.hero__tags', 'y', { duration: 0.6, ease: 'power3' })
      const l1 = gsap.quickTo('.hero__line--1', 'x', { duration: 1, ease: 'power3' })
      const l2 = gsap.quickTo('.hero__line--2', 'x', { duration: 1, ease: 'power3' })
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        dish(nx * 50)
        dishY(ny * 36)
        tagsX(nx * 80)
        tagsY(ny * 56)
        tilt(nx * 10)
        l1(nx * -30)
        l2(nx * 30)
      }
      root.current!.addEventListener('pointermove', onMove)

      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 } })
        .to('.hero__plate-wrap', { scale: 1.3, rotate: 50, yPercent: 30, ease: 'none' }, 0)
        .to('.hero__line--1', { yPercent: -60, ease: 'none' }, 0)
        .to('.hero__line--2', { yPercent: -25, ease: 'none' }, 0)
        .to('.hero__copy', { y: -60, autoAlpha: 0, ease: 'none' }, 0)
        .to('.hero__tags', { y: -80, autoAlpha: 0, ease: 'none' }, 0)
      return () => root.current?.removeEventListener('pointermove', onMove)
    }, root)
    return () => ctx.revert()
  }, [ready])

  /* ---------- swipe ---------- */
  const start = useRef<number | null>(null)

  return (
    <section
      id="top"
      ref={root}
      className="hero"
      aria-roledescription="carousel"
      aria-label="Signature dishes"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerUp={(e) => {
        if (start.current === null) return
        const dx = e.clientX - start.current
        start.current = null
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="hero__stage">
        <h1 className="hero__title" aria-label={`${slide.lines.join(' ')}. ${slide.tagline}`}>
          {/* keyed by slide: SplitText replaces text nodes React would otherwise try to update */}
          <span key={`l1-${index}`} className="hero__line hero__line--1" aria-hidden="true">
            {slide.lines[0]}
          </span>
          <span key={`l2-${index}`} className="hero__line hero__line--2" aria-hidden="true">
            {slide.lines[1]}
          </span>
        </h1>

        <div className="hero__dish">
          <div className="hero__plate-wrap">
            <div className={`hero__plate hero__plate--${slide.cutout}`}>
              <img src={slide.image} alt={slide.alt} draggable={false} fetchPriority={index === 0 ? 'high' : 'auto'} />
            </div>
          </div>
          <div className="hero__steam" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* stickers sit above both headline lines so nothing hides them */}
        <div className="hero__tags">
          {slide.stickers.map((s, i) => (
            <span key={`${index}-${s}`} className={`hero__sticker ${STICKER_SLOTS[i]}`}>
              {s}
            </span>
          ))}
          <span className="hero__badge hero__badge--a" aria-hidden="true">
            <Icon name="flame" size={30} />
          </span>
          <span className="hero__badge hero__badge--b" aria-hidden="true">
            <Icon name="chili" size={20} />
          </span>
        </div>
      </div>

      <div className="hero__copy">
        <p className="hero__tagline" aria-live="polite">
          {slide.tagline}
        </p>
        <div className="hero__ctas">
          <a className="btn btn--orange" href="#menu" data-cursor="Hungry?">
            See the Menu
          </a>
          <a className="btn btn--cream" href="#contact" data-cursor="Let's go">
            Find Us
          </a>
        </div>
      </div>

      <button className="hero__arrow hero__arrow--prev" aria-label="Previous dish" onClick={() => go(-1)}>
        <Icon name="left" />
      </button>
      <button className="hero__arrow hero__arrow--next" aria-label="Next dish" onClick={() => go(1)}>
        <Icon name="right" />
      </button>
      <div className="hero__dots" role="tablist" aria-label="Choose a dish">
        {slides.map((s, i) => (
          <button
            key={s.lines.join()}
            role="tab"
            aria-selected={i === index}
            aria-label={s.lines.join(' ')}
            className={`hero__dot ${i === index ? 'is-active' : ''}`}
            onClick={() => i !== index && go(i > index ? 1 : -1)}
          >
            {i === index && !paused && !reducedMotion && <span className="hero__dot-fill" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />}
          </button>
        ))}
      </div>
      <TornEdge color="var(--cream)" seed={3} />
    </section>
  )
}
