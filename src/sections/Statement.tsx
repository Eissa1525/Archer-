import { useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, reducedMotion, useSectionAnim } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { TornEdge } from '../lib/TornEdge'
import { site } from '../config'

const marqueeRows = site.marquee

/** "FLAVOR YOU CAN HEAR": letters inflate with the scroll, badges orbit the words. */
export function Statement() {
  const root = useRef<HTMLElement>(null)

  useSectionAnim(root, () => {
    const split = SplitText.create('.statement__title', { type: 'chars,words', charsClass: 'ch' })
    gsap
      .timeline({ scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'center 45%', scrub: 0.7 } })
      .from(split.chars, {
        scale: 0.2,
        yPercent: () => gsap.utils.random(-120, 120),
        rotate: () => gsap.utils.random(-60, 60),
        autoAlpha: 0,
        ease: 'back.out(1.7)',
        stagger: { each: 0.02, from: 'random' },
      })
      .from('.statement__badge', { scale: 0, rotate: -180, ease: 'back.out(2)', stagger: 0.08 }, 0.3)
      .from('.statement__sub', { y: 20, autoAlpha: 0 }, 0.5)
    if (!reducedMotion) {
      gsap.to('.statement__badge', { y: (i: number) => (i % 2 ? 14 : -14), rotate: (i: number) => (i % 2 ? 12 : -12), duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.2 })
    }
  })

  return (
    <section ref={root} className="statement section section--brown">
      <TornEdge color="var(--cream)" flip seed={5} />
      <h2 className="statement__title display">
        {site.statement.lines[0]}
        <br />
        {site.statement.lines[1]}
      </h2>
      <span className="statement__badge statement__badge--a"><Icon name="flame" size={28} /></span>
      <span className="statement__badge statement__badge--b"><Icon name="star" size={26} /></span>
      <span className="statement__badge statement__badge--c"><Icon name="chili" size={24} /></span>
      <span className="statement__badge statement__badge--d"><Icon name="heart" size={22} /></span>
      <p className="statement__sub">{site.statement.sub}</p>
    </section>
  )
}

/** Three giant rows that run on their own and react to scroll speed (faster + skewed). */
export function Marquee() {
  const root = useRef<HTMLElement>(null)

  useSectionAnim(root, () => {
    const rows = gsap.utils.toArray<HTMLElement>('.marquee__track')
    const loops = rows.map((row, i) =>
      gsap.to(row, { xPercent: i % 2 ? 0 : -50, startAt: { xPercent: i % 2 ? -50 : 0 }, duration: 26 + i * 6, ease: 'none', repeat: -1 }),
    )
    if (reducedMotion) {
      loops.forEach((l) => l.pause())
      return
    }
    const skew = gsap.quickTo('.marquee__track', 'skewX', { duration: 0.5, ease: 'power3' })
    ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity()
        const boost = 1 + Math.min(Math.abs(v) / 400, 6)
        loops.forEach((l) => gsap.to(l, { timeScale: boost * (v < 0 ? -1 : 1), duration: 0.3, overwrite: true }))
        skew(gsap.utils.clamp(-14, 14, v / -120))
      },
      onLeave: () => loops.forEach((l) => gsap.to(l, { timeScale: 1, duration: 0.6 })),
    })
    // settle back to cruising speed when the scroll stops
    let idle: number | undefined
    const settle = () => {
      window.clearTimeout(idle)
      idle = window.setTimeout(() => {
        loops.forEach((l) => gsap.to(l, { timeScale: 1, duration: 1.2, ease: 'power2.out' }))
        skew(0)
      }, 140)
    }
    window.addEventListener('scroll', settle, { passive: true })
    return () => window.removeEventListener('scroll', settle)
  })

  const icons = ['truck', 'moon', 'leaf', 'flame']
  return (
    <section ref={root} className="marquee" aria-label="What we're about">
      {marqueeRows.map((row, r) => (
        <div key={r} className={`marquee__row marquee__row--${r}`}>
          <div className="marquee__track">
            {[...row, ...row, ...row, ...row].map((w, i) => (
              <span key={i} className="marquee__item">
                {w}
                <Icon name={icons[(i + r) % icons.length]} size={42} className="marquee__icon" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
