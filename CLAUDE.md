# Fire Alley — notes for Claude

Branch `claude/street-food-site` is a standalone project (separate from the AETHER hero branches).

## Rules
- **Never change the design or animations.** The look is signed off. New features are config,
  behaviour, or isolated overlays (like the order panel). Before committing UI work, run the
  before/after pixel comparison (see Verification).
- **Inspiration, not a copy.** The section flow and energy follow the Hotbite Framer template.
  Never reuse its images, text, logo or name.
- Photos: Unsplash License only. Keep `public/img/CREDITS.md` and `public/credits.html` in sync.
- **All business content lives in `src/config/site.config.ts`** (types in `src/config/types.ts`).
  Components read `site` from `src/config`. Never hardcode business text, prices or links in a
  component.
- **Honesty rules:** demo labels show only in `mode: 'demo'`. Sample reviews never show in client
  mode. The demo ordering provider must always say orders aren't sent. "Order received" is shown
  only after the endpoint answers `{ ok: true }`. Secrets live only in server env vars.

## Layout
- `src/config/`: site config, types, `validate.ts` (client builds fail on placeholders),
  `index.ts` (`site`, `money`, links).
- `src/order/`: `pricing.ts` (pure, cents, shared with the server), `checkout.ts` (form
  validation, payload, submit), `store.tsx` (cart context with localStorage), `OrderPanel.tsx`
  (UI plus floating cart button).
- `server/`: `order-handler.ts` (re-prices, notifies by webhook/Resend, Stripe Checkout plus webhook)
  and host adapters.
- `clients/_template.config.ts`: starting point for a real client. `SITE_CONFIG=<file>` selects
  the config at build time (Vite alias `@site-config`).
- `tests/`: vitest (`npm test`). `tests/fixtures/` holds a client-mode config and a Node entry
  used for local end-to-end runs.

## Stack
React 19 + Vite 8 + TypeScript, GSAP 3.15 (ScrollTrigger, SplitText), Motion for React 14,
and Lenis for smooth scrolling (driven by GSAP's ticker, so ScrollTrigger stays in sync).

## Animation map
- **Loader:** a counter, then the orange curtain splits. `ready` flips once fonts are in, so SplitText measures the real fonts.
- **Hero:** a 3-slide carousel.
  - Letters drop in with a bounce; on slide change they flip (rotateX).
  - The plate spins in, then rolls out sideways and back in between slides.
  - Stickers pop in, steam rises, and there's mouse parallax at several depths.
  - Swipe on touch, autoplay with a progress bar, and a scroll scrub that grows and turns the plate.
  - Headline line 1 sits *behind* the dish and line 2 *in front*. The stickers have their own top layer.
- **About:** collage pieces fly in on a scrub. **Specials:** plates rotate with scroll; hover lift and a swinging price tag.
- **Statement:** letters inflate on scroll; badges orbit. **Marquee:** three rows react to scroll speed (timeScale and skew).
- **Menu:** a Motion `layoutId` tab pill; items cascade in with `AnimatePresence`.
- **Difference:** pinned on desktop; the photo opens from a circle while features land around it.
- **Reviews:** a Motion drag track. **Gallery:** pinned horizontal scroll; polaroids swing.
- **Why us, Order, Contact:** icon pops, magnetic buttons, parallax collage, a spinning text ring.
- **Footer:** the giant brand word rises letter by letter.

## Gotchas (learned the hard way)
- SplitText + React: **key** any element whose text React changes after it has been split.
  Otherwise React updates a detached text node and the old letters stay on screen.
- Reveals around links and buttons use `opacity`, **not** `autoAlpha`. `visibility:hidden` makes
  them unfocusable, so keyboard users would skip whole sections.
- An out-tween that hides an element must be paired with `fromTo` on the way back in.
  `from()` would animate *to* the hidden state.
- `?capture` disables GSAP lag smoothing, for automated screenshots only.
- The vite plugin loads the site config with `runnerImport` (not Node's `import()`), so configs can
  use extensionless TS imports.
- The order panel stops Lenis while it's open (`scroller.lenis`) and its body has
  `data-lenis-prevent`.

## Verification
- `npm run build` and `npm test` must pass.
- Visual regression: screenshot every section at 1440×900 and 412×915 with `?capture`, before and
  after, and diff them. Only the marquee, ticker and contact ring move between runs (noise up to
  about 8%); every other section must be about 0%.
- CLS after load is 0. Scripted scrolling through the pinned sections reports CLS of about 1.85;
  that's a pre-existing effect of GSAP pinning, the same on the original commit.
