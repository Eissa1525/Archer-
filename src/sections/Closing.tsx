import { useRef, type MouseEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { gsap, revealTitle, revealUp, reducedMotion, SplitText, useSectionAnim } from '../lib/anim'
import { Icon } from '../lib/Icon'
import { Logo } from '../lib/Logo'
import { TornEdge } from '../lib/TornEdge'
import { isDemo, mailHref, money, site, telHref } from '../config'
import type { SocialLink } from '../config'
import { useOrder, type Fulfillment } from '../order/store'

const { whyUs, order, contact, contactSection } = site

/** Button that leans toward the pointer with spring physics (Motion). */
function Magnetic({
  href,
  children,
  variant,
  onClick,
  external,
}: {
  href: string
  children: ReactNode
  variant: 'orange' | 'brown' | 'cream'
  onClick?: (e: MouseEvent) => void
  external?: boolean
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 250, damping: 15, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 250, damping: 15, mass: 0.6 })
  return (
    <motion.a
      href={href}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
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
            {whyUs.title[0]}
            <br />
            {whyUs.title[1]}
          </h2>
          <div className="why__grid">
            {whyUs.features.map((w) => (
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
          <p className="why__kicker">{whyUs.favoritesTitle}</p>
          <div className="why__fav-row">
            {whyUs.favorites.map((f) => (
              <motion.figure key={f.name} className="fav" whileHover="spin" data-cursor="Order">
                <motion.div className="fav__plate" variants={{ spin: { rotate: 360, scale: 1.06 } }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                  <img src={f.img} alt={f.name} loading="lazy" />
                </motion.div>
                <figcaption>
                  <span className="fav__name">{f.name}</span>
                  <span className="fav__price">{money(f.price)}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
          <a className="btn btn--orange" href="#menu">
            {whyUs.cta}
          </a>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Order buttons: behaviour follows site.ordering.provider            */
/* ------------------------------------------------------------------ */
function OrderButtons() {
  const { open } = useOrder()
  const p = site.ordering.provider
  const { pickup, delivery } = site.ordering

  if (p.type === 'demo' || p.type === 'endpoint') {
    const start = (f: Fulfillment) => (e: MouseEvent) => {
      e.preventDefault()
      open(f, e.currentTarget as HTMLElement)
    }
    return (
      <>
        <div className="order__ctas">
          {pickup.enabled && (
            <Magnetic href="#order" variant="orange" onClick={start('pickup')}>
              {order.pickupLabel}
            </Magnetic>
          )}
          {delivery.enabled && (
            <Magnetic href="#order" variant="brown" onClick={start('delivery')}>
              {order.deliveryLabel}
            </Magnetic>
          )}
        </div>
        {p.type === 'demo' ? <p className="order__note">{site.demo.orderNote}</p> : site.ordering.payment.note && <p className="order__note">{site.ordering.payment.note}</p>}
      </>
    )
  }
  if (p.type === 'external') {
    return (
      <div className="order__ctas">
        {p.pickupUrl && (
          <Magnetic href={p.pickupUrl} variant="orange" external>
            {order.pickupLabel}
          </Magnetic>
        )}
        {p.deliveryUrl && (
          <Magnetic href={p.deliveryUrl} variant="brown" external>
            {order.deliveryLabel}
          </Magnetic>
        )}
      </div>
    )
  }
  if (p.type === 'phone') {
    return (
      <>
        <div className="order__ctas">
          <Magnetic href={telHref} variant="orange">
            {order.pickupLabel}
          </Magnetic>
          {delivery.enabled && (
            <Magnetic href={telHref} variant="brown">
              {order.deliveryLabel}
            </Magnetic>
          )}
        </div>
        <p className="order__note">Orders by phone: {contact.phoneDisplay}</p>
      </>
    )
  }
  // disabled: no ordering, so point to things that exist
  return (
    <>
      <div className="order__ctas">
        <Magnetic href="#menu" variant="orange">
          {site.hero.menuCta}
        </Magnetic>
        <Magnetic href="#contact" variant="brown">
          {site.hero.findCta}
        </Magnetic>
      </div>
      <p className="order__note">Online ordering is not available. Visit or call us.</p>
    </>
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
            {order.title[0]}
            <br />
            {order.title[1]}
          </h2>
          <p className="order__text">{order.text}</p>
          <OrderButtons />
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

const socialIcon: Record<SocialLink['network'], string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  x: 'x',
  youtube: 'youtube',
  website: 'globe',
}
const socialName: Record<SocialLink['network'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  youtube: 'YouTube',
  website: 'Website',
}

const DemoTag = () => (isDemo ? <span className="demo-tag">demo</span> : null)

export function Contact() {
  const root = useRef<HTMLElement>(null)
  useSectionAnim(root, () => {
    revealTitle('.contact__title')
    revealUp('.contact__block', '.contact__info', 0.1)
    gsap.from('.contact__photo', { scale: 0.4, rotate: -90, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.contact__photo', start: 'top 85%' } })
    if (!reducedMotion) gsap.to('.contact__ring', { rotate: 360, duration: 22, ease: 'none', repeat: -1 })
  })
  const ring = `${site.business.name} • ${contactSection.ringText} • `
  return (
    <section id="contact" ref={root} className="contact section section--brown">
      <TornEdge color="var(--cream)" flip seed={41} />
      <div className="contact__inner">
        <div className="contact__visual">
          <div className="contact__photo">
            <img src={contactSection.photo.src} alt={contactSection.photo.alt} loading="lazy" />
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
          <h2 className="contact__title display">{contactSection.title}</h2>
          {isDemo && <p className="demo-chip">{site.demo.notice}</p>}
          <div className="contact__block">
            <h3>
              <Icon name="pin" size={18} /> Find us
            </h3>
            <p>
              {contact.mapsUrl ? (
                <a className="contact__link" href={contact.mapsUrl} target="_blank" rel="noopener" aria-label={`${contact.address} (open in maps)`}>
                  {contact.address}
                </a>
              ) : (
                contact.address
              )}{' '}
              <DemoTag />
            </p>
            <p>{contact.hoursSummary}</p>
          </div>
          <div className="contact__row">
            <div className="contact__block">
              <h3>
                <Icon name="mail" size={18} /> Email us
              </h3>
              <p>
                <a className="contact__link selectable" href={mailHref}>
                  {contact.email}
                </a>{' '}
                <DemoTag />
              </p>
            </div>
            <div className="contact__block">
              <h3>
                <Icon name="phone" size={18} /> Call us
              </h3>
              <p>
                <a className="contact__link selectable" href={telHref}>
                  {contact.phoneDisplay}
                </a>{' '}
                <DemoTag />
              </p>
            </div>
          </div>
          {(site.social.length > 0 || site.reservations.enabled || contact.mapsUrl) && (
            <div className="contact__extras">
              {contact.mapsUrl && (
                <a className="btn btn--orange" href={contact.mapsUrl} target="_blank" rel="noopener">
                  <Icon name="pin" size={18} /> Get directions
                </a>
              )}
              {site.reservations.enabled && (
                <a className="btn btn--cream" href={site.reservations.url} target="_blank" rel="noopener">
                  {site.reservations.label}
                </a>
              )}
              {site.social.length > 0 && (
                <ul className="contact__social" aria-label="Social media">
                  {site.social.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener" aria-label={s.label ?? socialName[s.network]}>
                        <Icon name={socialIcon[s.network]} size={20} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
  const words = site.footer.ticker
  const { studio, photoCredits } = site.credits
  const studioLink = studio && (
    <a href={studio.url} target="_blank" rel="noopener">
      {studio.name}
    </a>
  )
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
          <Logo size={24} />
        </a>
        <nav className="footer__nav" aria-label="Footer">
          <a href="#about">About</a>
          <a href="#menu">Menu</a>
          <a href="#gallery">Gallery</a>
          <a href="#order">Order</a>
          <a href="#contact">Contact</a>
        </nav>
        {isDemo ? (
          <p className="footer__small">
            {site.demo.footerNotice}
            {studioLink && <> designed and built by {studioLink}</>}. {site.demo.footerDisclaimer}
          </p>
        ) : (
          <p className="footer__small">
            © {new Date().getFullYear()} {site.business.shortName}
            {studioLink && <> · Website by {studioLink}</>}
          </p>
        )}
        {photoCredits && (
          <p className="footer__small">
            {photoCredits.prefix && <>{photoCredits.prefix} · </>}
            <a href={photoCredits.url}>{photoCredits.label}</a>
          </p>
        )}
      </div>
      <p className="footer__giant display" aria-hidden="true">
        {site.business.name}
      </p>
    </footer>
  )
}
