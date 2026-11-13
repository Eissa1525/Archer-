import { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import { gsap, revealTitle, reducedMotion, useSectionAnim } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { TornEdge } from '../lib/TornEdge'
import { difference, reviews } from '../data'

/** Pinned: the photo opens from a small circle to fill the frame while the features land around it. */
export function Difference() {
  const root = useRef<HTMLElement>(null)

  useSectionAnim(root, () => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 900px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=140%', scrub: 0.8, pin: '.diff__stage' },
      })
      tl.fromTo('.diff__photo', { clipPath: 'circle(14% at 50% 50%)', scale: 1.25 }, { clipPath: 'circle(75% at 50% 50%)', scale: 1, ease: 'power2.inOut' })
        .from('.diff__title .ch', { yPercent: 120, autoAlpha: 0, stagger: 0.03, ease: 'back.out(2)' }, 0.1)
        .from('.diff__feature', { x: (i: number) => (i % 2 ? 260 : -260), y: (i: number) => (i < 2 ? -80 : 80), rotate: (i: number) => (i % 2 ? 20 : -20), autoAlpha: 0, stagger: 0.12, ease: 'back.out(1.4)' }, 0.35)
    })
    mm.add('(max-width: 899px)', () => {
      revealTitle('.diff__title')
      gsap.fromTo('.diff__photo', { clipPath: 'circle(20% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'none', scrollTrigger: { trigger: '.diff__photo', start: 'top 85%', end: 'center 45%', scrub: 0.6 } })
      gsap.from('.diff__feature', { y: 60, autoAlpha: 0, stagger: 0.1, duration: 0.8, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.diff__features', start: 'top 85%' } })
    })
    return () => mm.revert()
  })

  return (
    <section id="difference" ref={root} className="diff section--cream">
      <TornEdge color="var(--orange)" flip seed={9} />
      <div className="diff__stage">
        <h2 className="diff__title display" aria-label={difference.title}>
          {difference.title.split(' ').map((w, wi) => (
            <span key={wi} className="word" aria-hidden="true">
              {w.split('').map((c, i) => (
                <span key={i} className="ch">
                  {c}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <p className="section__lede">Street food done right, one order at a time.</p>
        <div className="diff__grid">
          <div className="diff__photo" data-cursor="Ooh">
            <img src={difference.photo.src} alt={difference.photo.alt} loading="lazy" />
          </div>
          <div className="diff__features">
            {difference.features.map((f, i) => (
              <article key={f.title} className={`diff__feature diff__feature--${i}`}>
                <span className="diff__icon">
                  <Icon name={f.icon} size={24} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Draggable review track (Motion). These are sample reviews to be replaced with real ones. */
export function Reviews() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const tilt = useTransform(x, [-1200, 0], [3, -3])

  useSectionAnim(root, () => {
    revealTitle('.reviews__title')
    gsap.from('.review', { y: 80, rotate: (i: number) => (i % 2 ? 8 : -8), autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.reviews__viewport', start: 'top 85%' } })
  })

  const nudge = (dir: number) => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.parentElement!.clientWidth
    animate(x, Math.max(-max, Math.min(0, x.get() - dir * 360)), { type: 'spring', stiffness: 200, damping: 26 })
  }

  return (
    <section ref={root} className="reviews section section--cream">
      <div className="reviews__head">
        <h2 className="reviews__title display">LOVED LOUDLY</h2>
        <div className="reviews__controls">
          <span className="reviews__sample">Sample reviews</span>
          <button className="round-btn" aria-label="Previous reviews" onClick={() => nudge(-1)}>
            <Icon name="left" />
          </button>
          <button className="round-btn" aria-label="Next reviews" onClick={() => nudge(1)}>
            <Icon name="right" />
          </button>
        </div>
      </div>
      <div ref={viewport} className="reviews__viewport" data-cursor="Drag">
        <motion.div
          ref={track}
          className="reviews__track"
          drag={reducedMotion ? false : 'x'}
          dragConstraints={viewport}
          dragElastic={0.12}
          style={{ x, rotate: tilt }}
        >
          {reviews.map((r, i) => (
            <article key={r.name} className={`review review--${i % 3}`}>
              <div className="review__stars" aria-label="5 out of 5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Icon key={s} name="star" size={16} />
                ))}
              </div>
              <p className="review__text">“{r.text}”</p>
              <p className="review__who">
                <span className="review__avatar" aria-hidden="true">
                  {r.initials}
                </span>
                {r.name}
              </p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
