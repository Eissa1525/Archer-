/**
 * AETHER Studio — "Featured live demo" card for Fire Alley.
 *
 * Drop-in for the AETHER site (Vite + React). Intended placement: inside `#work`,
 * directly after the six concept rows and before the "Original studio concept
 * presentations…" footnote. Styling matches AETHER: Manrope + DM Mono, violet-black.
 *
 * Usage:
 *   import { FeaturedDemo } from './FeaturedDemo'
 *   import './featured-demo.css'
 *   <FeaturedDemo liveUrl="https://<public-fire-alley-url>/" image="/work/fire-alley.webp" />
 */
interface Props {
  /** Public HTTPS URL of the deployed Fire Alley demo. */
  liveUrl: string
  /** Preview image (copy integration/aether/fire-alley.webp into AETHER's public/work/). */
  image: string
}

export const fireAlley = {
  index: '07',
  title: 'FIRE ALLEY',
  category: 'Restaurant / Street Food',
  price: 'From $30 CAD',
  description:
    'Premium animated restaurant website with interactive menu, cinematic transitions, mobile-friendly design and GSAP-powered motion.',
  tags: ['GSAP', 'Motion', 'Interactive menu', 'Mobile-first'],
  disclaimer: 'Concept demo · fictional restaurant · photography from Unsplash',
}

export function FeaturedDemo({ liveUrl, image }: Props) {
  const p = fireAlley
  return (
    <article className="fd" aria-labelledby="fd-title">
      <a className="fd__media" href={liveUrl} target="_blank" rel="noopener" aria-label={`${p.title} live preview (opens in a new tab)`}>
        <img src={image} alt={`${p.title} restaurant website demo, hero section`} loading="lazy" />
        <span className="fd__live">
          <span className="fd__dot" aria-hidden="true" /> LIVE DEMO
        </span>
      </a>
      <div className="fd__body">
        <p className="fd__meta">
          <span>{p.index}</span>
          <span aria-hidden="true">/</span>
          <span>FEATURED DEMO</span>
          <span className="fd__rule" aria-hidden="true" />
          <span>{p.category.toUpperCase()}</span>
        </p>
        <h3 id="fd-title" className="fd__title">
          {p.title}
        </h3>
        <p className="fd__desc">{p.description}</p>
        <ul className="fd__tags" aria-label="Highlights">
          {p.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="fd__row">
          <p className="fd__price">
            <span className="fd__price-label">STARTING AT</span>
            <span className="fd__price-value">{p.price}</span>
          </p>
          <a className="fd__cta" href={liveUrl} target="_blank" rel="noopener">
            Live Preview <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="fd__note">{p.disclaimer}</p>
      </div>
    </article>
  )
}
