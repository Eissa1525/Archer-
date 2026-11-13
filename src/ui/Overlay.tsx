import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isCapture, sceneState } from '../scene/store'

gsap.registerPlugin(ScrollTrigger)

// `?capture` — for automated screenshots in slow software-rendered browsers:
// disable lag smoothing so the intro timeline runs on wall-clock time.
if (isCapture) {
  gsap.ticker.lagSmoothing(0)
}

interface Props {
  ready: boolean
  reducedMotion: boolean
  isMobile: boolean
  webgl: boolean
}

const NAV = ['Work', 'Studio', 'Process', 'Journal']

export function Overlay({ ready, reducedMotion, isMobile, webgl }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Intro choreography: veil lifts, camera cranes down, type rises line by line.
  useEffect(() => {
    if (!ready || !root.current) return
    const ctx = gsap.context(() => {
      const d = reducedMotion ? 0.01 : 1
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.to('.veil', { autoAlpha: 0, duration: 1.4 * d + 0.2, ease: 'power2.inOut' }, 0)
        .to(sceneState, { intro: 1, duration: 4.2 * d + 0.01, ease: 'power3.inOut' }, 0)
        .from('.nav', { y: -24, autoAlpha: 0, duration: 1.2 * d }, 1.4 * d)
        .from('.eyebrow', { y: 16, autoAlpha: 0, duration: 1 * d }, 1.8 * d)
        .from('.headline .line > span', { yPercent: 110, duration: 1.5 * d, stagger: 0.14, ease: 'expo.out' }, 2.0 * d)
        .from('.lede', { y: 18, autoAlpha: 0, duration: 1.1 * d }, 2.6 * d)
        .from('.cta-row > *', { y: 18, autoAlpha: 0, duration: 1 * d, stagger: 0.1 }, 2.8 * d)
        .from('.meta, .scroll-cue, .live', { autoAlpha: 0, duration: 1.2 * d, stagger: 0.12 }, 3.2 * d)

      // Scroll: hand camera progress to the scene and dissolve the copy.
      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: 'bottom bottom',
        scrub: reducedMotion ? true : 1.2,
        onUpdate: (self) => {
          sceneState.scroll = self.progress
        },
      })
      // Offsets are in viewport heights of scroll, so timing is identical on every screen.
      const vh = (n: number) => () => window.innerHeight * n
      gsap.to('.hero-copy', {
        yPercent: -18,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: () => `+=${vh(0.5)()}`, scrub: true, invalidateOnRefresh: true },
      })
      gsap.to('.hero-chrome', {
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: () => `+=${vh(0.2)()}`, scrub: true, invalidateOnRefresh: true },
      })
      gsap.fromTo(
        '.chapter-next',
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: () => `top+=${vh(0.75)()} top`,
            end: () => `top+=${vh(1.2)()} top`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
    }, root)
    return () => ctx.revert()
  }, [ready, reducedMotion])

  return (
    <div ref={root} className="overlay">
      <div className="veil" aria-hidden="true">
        <span className="veil-mark">AETHER</span>
      </div>

      <header className="nav glass">
        <a className="brand" href="#" aria-label="AETHER Studio home">
          <span className="brand-orb" aria-hidden="true" />
          <span className="brand-word">AETHER</span>
          <span className="brand-sub">Studio</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n} href={`#${n.toLowerCase()}`}>
              {n}
            </a>
          ))}
        </nav>
        <a className="btn btn-ghost nav-cta" href="#contact">
          Start a project
        </a>
        <button
          className="menu-btn"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span className="sr-only">Menu</span>
        </button>
      </header>
      <div id="mobile-menu" className={`mobile-menu glass ${menuOpen ? 'open' : ''}`} hidden={!menuOpen}>
        {NAV.map((n) => (
          <a key={n} href={`#${n.toLowerCase()}`} onClick={() => setMenuOpen(false)}>
            {n}
          </a>
        ))}
        <a className="btn btn-solid" href="#contact" onClick={() => setMenuOpen(false)}>
          Start a project
        </a>
      </div>

      <section className="hero" aria-label="Introduction">
        <div className="hero-sticky">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" aria-hidden="true" /> Independent studio for real-time worlds
            </p>
            <h1 className="headline">
              <span className="line">
                <span>Worlds that</span>
              </span>
              <span className="line">
                <span>
                  <em>breathe</em>, light
                </span>
              </span>
              <span className="line">
                <span>
                  that <em>listens.</em>
                </span>
              </span>
            </h1>
            <p className="lede">
              AETHER crafts cinematic, interactive 3D experiences for brands that refuse to be scrolled past —
              rendered live, in the browser, at the speed of curiosity.
            </p>
            <div className="cta-row">
              <a className="btn btn-solid" href="#contact">
                Start a project <span aria-hidden="true">→</span>
              </a>
              <a className="btn btn-ghost" href="#work">
                Explore the work
              </a>
            </div>
          </div>

          <div className="hero-chrome">
          <aside className="meta" aria-hidden="true">
            <span>N°01</span>
            <span className="meta-rule" />
            <span>{!webgl ? 'Static preview' : isMobile ? 'Touch to stir the light' : 'Move to stir the light'}</span>
          </aside>

          <div className="scroll-cue" aria-hidden="true">
            <span className="scroll-line" />
            <span>Scroll to descend</span>
          </div>
          </div>

          <p className="live" aria-hidden="true">
            <span className="live-dot" /> {webgl ? 'Rendered in real time · WebGL' : 'WebGL unavailable · static preview'}
          </p>

          <div className="chapter-next">
            <p className="eyebrow">Chapter II</p>
            <p className="chapter-title">
              The work <em>surfaces</em> soon.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
