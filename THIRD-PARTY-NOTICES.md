# Third-party notices

This template uses the following third-party software, fonts and media. Licence summaries are
informational. The licence texts of the npm packages are in `node_modules/<package>/` after
`npm install`. Check each provider's current terms before commercial use.

## Software shipped in the website
| Package | Version | Licence |
|---|---|---|
| react, react-dom | 19.3.1 | MIT |
| motion (Motion for React) | 14.13.0 | MIT |
| lenis | 1.3.27 | MIT |
| gsap (incl. ScrollTrigger, SplitText) | 3.15.1 | GSAP "Standard no-charge" licence, https://gsap.com/standard-license. Free, including commercial use and the former bonus plugins. Read the terms: they restrict use in visual, no-code animation builders that compete with Webflow. gsap is installed from npm by you, not included in this package |

## Development tools (not shipped)
| Package | Licence |
|---|---|
| vite, @vitejs/plugin-react, vitest | MIT |
| typescript | Apache-2.0 |
| @types/* | MIT |

## Fonts
"Londrina Solid" and "DM Sans" are loaded from Google Fonts. Both are published there under the
SIL Open Font License 1.1. Loading them from Google's servers sends visitors' IP addresses to
Google. Self-hosting the fonts avoids that; set `theme.fonts.googleFontsUrl` to `null` and add the
font files yourself.

## Images
**No third-party photos are included.** The images in `public/img/` are original placeholders
generated for this template (`scripts/make-placeholders.py`) and are covered by `LICENSE.md`.
Replace them with photos you have the rights to.

## Icons
The interface icons (`src/lib/Icon.tsx`), torn-paper edges, grain texture and favicon are original
artwork, drawn in code for this template, and covered by `LICENSE.md`.
