import { useRef } from 'react'
import { motion } from 'motion/react'
import { gsap, revealTitle, revealUp, useSectionAnim } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { about, specials } from '../data'

export function About() {
  const root = useRef<HTMLElement>(null)

  useSectionAnim(root, () => {
    revealTitle('.about__title')
    revealUp('.about__body > *', '.about__body', 0.12)
    // collage pieces fly in from scattered, rotated positions as the section scrolls in
    const from = [
      { x: -260, y: 120, rotate: -40 },
      { x: 220, y: -160, rotate: 35 },
      { x: -120, y: 260, rotate: 25 },
      { x: 280, y: 200, rotate: -30 },
    ]
    gsap.utils.toArray<HTMLElement>('.collage__piece').forEach((el, i) => {
      gsap.from(el, {
        ...from[i % from.length],
        scale: 0.6,
        autoAlpha: 0,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.collage', start: 'top 95%', end: 'top 35%', scrub: 0.8 },
      })
    })
    // gentle drift after landing
    gsap.to('.collage__piece', {
      yPercent: (i: number) => [-8, 6, -5, 9][i % 4],
      ease: 'none',
      scrollTrigger: { trigger: '.collage', start: 'top 35%', end: 'bottom top', scrub: true },
    })
  })

  return (
    <section id="about" ref={root} className="about section section--cream">
      <div className="about__inner">
        <div className="collage" data-cursor="Yum">
          {about.photos.map((p, i) => (
            <figure key={p.src} className={`collage__piece collage__piece--${i}`}>
              <img src={p.src} alt={p.alt} loading="lazy" />
            </figure>
          ))}
        </div>
        <div className="about__body">
          <h2 className="about__title display">{about.title}</h2>
          {about.body.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <a className="btn btn--orange" href="#difference" data-cursor="Why us">
            Taste the Difference
          </a>
        </div>
      </div>
    </section>
  )
}

export function Specials() {
  const root = useRef<HTMLElement>(null)

  useSectionAnim(root, () => {
    revealTitle('.specials__title')
    gsap.from('.dish', {
      y: 120,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'back.out(1.4)',
      stagger: 0.1,
      scrollTrigger: { trigger: '.specials__grid', start: 'top 85%' },
    })
    // plates turn with the scroll, alternating direction
    gsap.utils.toArray<HTMLElement>('.dish__plate').forEach((el, i) => {
      gsap.to(el, {
        rotate: i % 2 ? -110 : 110,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
      })
    })
  })

  return (
    <section ref={root} className="specials section section--cream">
      <h2 className="specials__title display">STREET SPECIALS</h2>
      <p className="section__lede">The ones regulars order without looking at the menu.</p>
      <div className="specials__grid">
        {specials.map((d) => (
          <motion.article key={d.name} className="dish" whileHover="hover" data-cursor="Taste">
            <motion.div className="dish__plate-wrap" variants={{ hover: { y: -14, scale: 1.05 } }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
              <div className="dish__plate">
                <img src={d.img} alt={d.name} loading="lazy" />
              </div>
              <motion.span
                className="dish__price"
                variants={{ hover: { rotate: [0, -14, 10, -6, 0], scale: 1.15 } }}
                transition={{ duration: 0.6 }}
              >
                ${d.price % 1 ? d.price.toFixed(2) : d.price}
              </motion.span>
              {d.hot && (
                <span className="dish__hot" aria-label="Spicy">
                  <Icon name="chili" size={16} />
                </span>
              )}
            </motion.div>
            <h3 className="dish__name">{d.name}</h3>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
