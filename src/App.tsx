import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { MotionConfig } from 'motion/react'
import { gsap, ReadyContext, reducedMotion, ScrollTrigger, scroller } from './lib/anim'
import { Cursor, Header, Loader } from './sections/Chrome'
import { Hero } from './sections/Hero'
import { About, Specials } from './sections/About'
import { Statement, Marquee } from './sections/Statement'
import { Menu } from './sections/Menu'
import { Difference, Reviews, showReviews } from './sections/Difference'
import { OrderProvider } from './order/store'
import { CartButton, OrderPanel } from './order/OrderPanel'
import { Gallery } from './sections/Gallery'
import { WhyUs, Order, Contact, Footer } from './sections/Closing'

export default function App() {
  const [ready, setReady] = useState(false)

  // Smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger stays in sync.
  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    scroller.lenis = lenis
    const raf = (t: number) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    return () => {
      gsap.ticker.remove(raf)
      scroller.lenis = null
      lenis.destroy()
    }
  }, [])

  // Image sizes change layout → re-measure triggers once everything has loaded.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <ReadyContext.Provider value={ready}>
        <OrderProvider>
        <Loader onDone={() => setReady(true)} />
        <Cursor />
        <Header />
        <main>
          <Hero />
          <About />
          <Specials />
          <Statement />
          <Menu />
          <Marquee />
          <Difference />
          {showReviews && <Reviews />}
          <Gallery />
          <WhyUs />
          <Order />
          <Contact />
        </main>
        <Footer />
        <OrderPanel />
        <CartButton />
        <div className="grain" aria-hidden="true" />
        </OrderProvider>
      </ReadyContext.Provider>
    </MotionConfig>
  )
}
