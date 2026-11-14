import { useRef } from 'react'
import { gsap, revealTitle, useSectionAnim } from '../lib/anim'
import { TornEdge } from '../lib/TornEdge'
import { site } from '../config'

const gallery = site.gallery

/** Pinned horizontal gallery: vertical scroll drives a sideways run of tilted polaroids. */
export function Gallery() {
  const root = useRef<HTMLElement>(null)

  useSectionAnim(root, () => {
    revealTitle('.gallery__title')
    const track = root.current!.querySelector('.gallery__track') as HTMLElement
    const distance = () => track.scrollWidth - window.innerWidth + 48
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.gallery__pin',
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    })
    // each polaroid swings slightly as it travels across the screen
    gsap.utils.toArray<HTMLElement>('.polaroid').forEach((el, i) => {
      gsap.fromTo(
        el,
        { rotate: i % 2 ? 9 : -9, y: i % 2 ? 40 : -30 },
        {
          rotate: i % 2 ? -4 : 4,
          y: i % 2 ? -20 : 25,
          ease: 'none',
          scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        },
      )
    })
  })

  return (
    <section id="gallery" ref={root} className="gallery section--brown">
      <TornEdge color="var(--cream)" flip seed={13} />
      <div className="gallery__pin">
        <div className="gallery__head">
          <h2 className="gallery__title display">{gallery.title}</h2>
          <p className="section__lede section__lede--light">{gallery.lede}</p>
        </div>
        <div className="gallery__track">
          {gallery.items.map((g, i) => (
            <figure key={g.src} className={`polaroid polaroid--${i % 3}`} data-cursor="Look">
              <img src={g.src} alt={g.caption} loading="lazy" />
              <figcaption>{g.caption}</figcaption>
            </figure>
          ))}
          <div className="gallery__end display">
            {gallery.endText[0]}
            <br />
            {gallery.endText[1]}
            <br />
            {gallery.endText[2]}
          </div>
        </div>
      </div>
    </section>
  )
}
