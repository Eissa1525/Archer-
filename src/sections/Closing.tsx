import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { gsap, revealTitle, revealUp, reducedMotion, SplitText, useSectionAnim } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { TornEdge } from '../lib/TornEdge'
import { brand, contact, favorites, order, whyUs } from '../data'

/** Button that leans toward the pointer with spring physics (Motion). */
function Magnetic({ href, children, variant }: { href: string; children: ReactNode; variant: 'orange' | 'brown' | 'cream' }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 250, damping: 15, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 250, damping: 15, mass: 0.6 })
  return (
    <motion.a
      href={href}
      className={`btn btn--${variant} btn--big`}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.94 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * 0.35)
        y.set((e.clientY - r.top - r.height / 2) * 0.5)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
      <Icon name="arrow" size={18} />
    </motion.a>
  )
}

export function WhyUs() {
  const root = useRef<HTMLElement>(null)
  useSectionAnim(root, () => {
    revealTitle('.why__title')
    gsap.from('.why__item', { y: 50, autoAlpha: 0, stagger: 0.07, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.why__grid', start: 'top 85%' } })
    gsap.from('.why__icon', { scale: 0, rotate: -120, stagger: 0.07, duration: 0.7, ease: 'back.out(3)', scrollTrigger: { trigger: '.why__grid', start: 'top 80%' } })
    gsap.from('.fav', { y: 120, rotate: (i: number) => (i ? 25 : -25), autoAlpha: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.15, scrollTrigger: { trigger: '.why__favs', start: 'top 85%' } })
  })
  return (
    <section ref={root} className="why section section--brown">
      <TornEdge color="var(--brown-deep)" flip seed={21} />
      <div className="why__inner">
        <div>
          <h2 className="why__title display">
            WHY WE HIT
            <br />
            DIFFERENT
          </h2>
          <div className="why__grid">
            {whyUs.map((w) => (
              <article key={w.title} className="why__item">
                <span className="why__icon">
                  <Icon name={w.icon} size={22} />
                </span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="why__favs">
          <p className="why__kicker">Chef's favorites</p>
          <div className="why__fav-row">
            {favorites.map((f) => (
              <motion.figure key={f.name} className="fav" whileHover="spin" data-cursor="Order">
                <motion.div className="fav__plate" variants={{ spin: { rotate: 360, scale: 1.06 } }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                  <img src={f.img} alt={f.name} loading="lazy" />
                </motion.div>
                <figcaption>
                  <span className="fav__name">{f.name}</span>
                  <span className="fav__price">${f.price.toFixed(2)}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
          <a className="btn btn--orange" href="#menu">
            View Full Menu
          </a>
        </div>
      </div>
    </section>
  )
}

export function Order() {
  const root = useRef<HTMLElement>(null)
  useSectionAnim(root, () => {
    const split = SplitText.create('.order__title', { type: 'chars,words', charsClass: 'ch' })
    gsap.from(split.chars, {
      yPercent: 120,
      rotateX: -90,
      autoAlpha: 0,
      transformOrigin: '50% 100%',
      stagger: 0.025,
      duration: 0.8,
      ease: 'back.out(2)',
      scrollTrigger: { trigger: '.order__title', start: 'top 85%' },
    })
    revealUp('.order__text, .order__ctas', '.order__copy', 0.12)
    // collage layers at different speeds = depth
    gsap.utils.toArray<HTMLElement>('.order__photo').forEach((el, i) => {
      gsap.fromTo(el, { yPercent: [40, 80, 20, 60][i] }, { yPercent: [-30, -60, -15, -45][i], rotate: [-8, 6, -4, 9][i], ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
    })
  })
  return (
    <section id="order" ref={root} className="order section section--cream">
      <TornEdge color="var(--brown)" flip seed={31} />
      <div className="order__inner">
        <div className="order__copy">
          <h2 className="order__title display">
            ORDER BOLD.
            <br />
            EAT LOUD.
          </h2>
          <p className="order__text">Skip the line. Order pickup or delivery and get it hot, fast, and exactly how you like it.</p>
          <div className="order__ctas">
            <Magnetic href="#contact" variant="orange">
              Order Pickup
            </Magnetic>
            <Magnetic href="#contact" variant="brown">
              Order Delivery
            </Magnetic>
          </div>
        </div>
        <div className="order__collage" aria-hidden="true">
          {order.photos.map((p, i) => (
            <div key={p} className={`order__photo order__photo--${i}`}>
              <img src={p} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Contact() {
  const root = useRef<HTMLElement>(null)
  useSectionAnim(root, () => {
    revealTitle('.contact__title')
    revealUp('.contact__block', '.contact__info', 0.1)
    gsap.from('.contact__photo', { scale: 0.4, rotate: -90, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.contact__photo', start: 'top 85%' } })
    if (!reducedMotion) gsap.to('.contact__ring', { rotate: 360, duration: 22, ease: 'none', repeat: -1 })
  })
  const ring = `${brand.name} • STREET FOOD • COOKED LOUD • `
  return (
    <section id="contact" ref={root} className="contact section section--brown">
      <TornEdge color="var(--cream)" flip seed={41} />
      <div className="contact__inner">
        <div className="contact__visual">
          <div className="contact__photo">
            <img src={contact.photo} alt="Our street-food truck" loading="lazy" />
          </div>
          <svg className="contact__ring" viewBox="0 0 300 300" aria-hidden="true">
            <defs>
              <path id="ring-path" d="M150,150 m-128,0 a128,128 0 1,1 256,0 a128,128 0 1,1 -256,0" />
            </defs>
            <text>
              <textPath href="#ring-path" textLength="796" lengthAdjust="spacing">{ring}</textPath>
            </text>
          </svg>
        </div>
        <div className="contact__info">
          <h2 className="contact__title display">COME HUNGRY</h2>
          <div className="contact__block">
            <h3>
              <Icon name="pin" size={18} /> Find us
            </h3>
            <p>{contact.address}</p>
            <p>{contact.hours}</p>
          </div>
          <div className="contact__row">
            <div className="contact__block">
              <h3>
                <Icon name="mail" size={18} /> Email us
              </h3>
              <p className="selectable">{contact.email}</p>
            </div>
            <div className="contact__block">
              <h3>
                <Icon name="phone" size={18} /> Call us
              </h3>
              <p className="selectable">{contact.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const root = useRef<HTMLElement>(null)
  useSectionAnim(root, () => {
    const split = SplitText.create('.footer__giant', { type: 'chars', charsClass: 'ch' })
    gsap.from(split.chars, {
      yPercent: 100,
      ease: 'power3.out',
      stagger: 0.04,
      scrollTrigger: { trigger: '.footer__giant', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
    })
    gsap.to('.footer__ticker-track', { xPercent: -50, duration: 30, ease: 'none', repeat: reducedMotion ? 0 : -1 })
  })
  const words = ['Smash burgers', 'Stone-fired pizza', 'Street tacos', 'Wings', 'Late-night bites', 'House sauces']
  return (
    <footer ref={root} className="footer">
      <div className="footer__ticker" aria-hidden="true">
        <div className="footer__ticker-track">
          {[...words, ...words, ...words, ...words].map((w, i) => (
            <span key={i}>
              {w} <Icon name="flame" size={16} />
            </span>
          ))}
        </div>
      </div>
      <div className="footer__inner">
        <a className="logo logo--light" href="#top">
          <Icon name="flame" size={24} className="logo__flame" />
          <span>{brand.name}</span>
        </a>
        <nav className="footer__nav" aria-label="Footer">
          <a href="#about">About</a>
          <a href="#menu">Menu</a>
          <a href="#gallery">Gallery</a>
          <a href="#order">Order</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="footer__small">Photos: Unsplash (Unsplash License). Address, phone and email are placeholders.</p>
      </div>
      <p className="footer__giant display" aria-hidden="true">
        {brand.name}
      </p>
    </footer>
  )
}
