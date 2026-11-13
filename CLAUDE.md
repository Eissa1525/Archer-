# Fire Alley — notes for Claude

Branch `claude/street-food-site` is a standalone project (separate from the AETHER hero branches).

## Rules
- **Inspiration, not a copy.** The section flow and energy follow the Hotbite Framer template.
  Never reuse its images, text, logo or name.
- Photos: Unsplash License only. Keep `public/img/CREDITS.md` in sync with any new photo.
- Content lives in `src/data.ts`. Address, phone, email and reviews are placeholders; the
  reviews section shows a "Sample reviews" tag until real ones exist.

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
