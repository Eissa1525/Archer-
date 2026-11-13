# Fire Alley → AETHER Studio integration (proposal, not live)

Nothing here touches the production AETHER site. These files are ready to copy into the
AETHER codebase once you approve.

## Where it goes
AETHER (`https://aether-immersive-studio.vercel.app/`) is a Vite + React single-page app with
the sections `#top`, `#work`, `#studio`, `#services`, `#rating` and `#contact`.

- **Placement:** inside **`#work` ("Worlds worth exploring")**. Put it right after the six concept
  rows (01 Monolith … 06 Momentum) and before the footnote "Original studio concept
  presentations · Photography from Unsplash · No client work claimed".
- **Why there:** Work is where visitors look for examples, and the card continues the numbering as
  **07**. It also keeps the existing footnote true: Fire Alley is labelled as a concept demo of a
  fictional restaurant, not client work.

## Files
| file | purpose |
|---|---|
| `FeaturedDemo.tsx` | React component plus the portfolio data (title, category, price, description) |
| `featured-demo.css` | Styles matching AETHER: Manrope + DM Mono, violet-black, hairline borders |
| `fire-alley.webp` | 1280×800 screenshot of the Fire Alley hero, used as the card image |

## Steps (after approval)
1. Copy `fire-alley.webp` to AETHER's `public/work/`.
2. Copy `FeaturedDemo.tsx` and `featured-demo.css` next to AETHER's Work section component.
3. In the Work section, after the concept rows:
   ```tsx
   <FeaturedDemo liveUrl="https://<public-fire-alley-url>/" image="/work/fire-alley.webp" />
   ```
4. Build and preview on a Vercel **preview deployment** (a non-production branch), check it, then
   merge to production.

## Content shown
- **Project:** FIRE ALLEY
- **Category:** Restaurant / Street Food
- **Starting price:** From $30 CAD
- **Button:** Live Preview
- **Description:** Premium animated restaurant website with interactive menu, cinematic
  transitions, mobile-friendly design and GSAP-powered motion.

## Blocked on
The **public Fire Alley URL**. It is not deployed yet; see the hosting notes in the chat.
