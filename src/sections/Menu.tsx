import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { gsap, revealTitle, useSectionAnim } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { menu } from '../data'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function Menu() {
  const root = useRef<HTMLElement>(null)
  const [tab, setTab] = useState(menu[0].id)
  const current = menu.find((m) => m.id === tab)!

  useSectionAnim(root, () => {
    revealTitle('.menu__title')
    gsap.from('.menu__card', {
      y: 140,
      rotate: -3,
      opacity: 0, // not autoAlpha: the tabs inside must stay keyboard-focusable
      duration: 1.1,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.menu__card', start: 'top 90%' },
    })
    gsap.from('.menu__promo', {
      scale: 0,
      rotate: 25,
      duration: 0.9,
      ease: 'elastic.out(1, 0.5)',
      scrollTrigger: { trigger: '.menu__card', start: 'top 60%' },
    })
  })

  return (
    <section id="menu" ref={root} className="menu section section--brown">
      <div className="menu__head">
        <h2 className="menu__title display">THE MENU</h2>
        <p className="menu__rating">
          <Icon name="star" size={16} /> Made to order, every time
        </p>
      </div>

      <div className="menu__card">
        <div className="menu__tabs" role="tablist" aria-label="Menu categories">
          {menu.map((m) => (
            <button
              key={m.id}
              role="tab"
              id={`tab-${m.id}`}
              aria-selected={tab === m.id}
              aria-controls="menu-panel"
              className={`menu__tab ${tab === m.id ? 'is-active' : ''}`}
              onClick={() => setTab(m.id)}
            >
              {tab === m.id && <motion.span layoutId="menu-pill" className="menu__tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <span className="menu__tab-label">{m.label}</span>
            </button>
          ))}
        </div>

        <div id="menu-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="menu__panel">
          <AnimatePresence mode="wait">
            <motion.ul
              key={tab}
              className="menu__list"
              initial="hide"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: 0.05 } }, exit: { opacity: 0, y: -10, transition: { duration: 0.18 } } }}
            >
              {current.items.map((it) => (
                <motion.li
                  key={it.name}
                  className="menu__item"
                  variants={{ hide: { opacity: 0, y: 24, rotateX: -50 }, show: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}
                  whileHover={{ x: 6 }}
                >
                  <div className="menu__line">
                    <span className="menu__name">
                      {it.name}
                      {it.hot && <Icon name="chili" size={15} className="menu__hot" />}
                    </span>
                    <span className="menu__dots" aria-hidden="true" />
                    <span className="menu__price">{fmt(it.price)}</span>
                  </div>
                  {it.note && <p className="menu__note">{it.note}</p>}
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>

          <motion.aside className="menu__promo" whileHover={{ rotate: -3, scale: 1.04 }} data-cursor="Deal!">
            <p className="menu__promo-kicker">All day, every day</p>
            <p className="menu__promo-title display">ALLEY COMBO</p>
            <p className="menu__promo-text">Any burger + fries + a drink</p>
            <p className="menu__promo-price display">$15</p>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}
