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
| gsap (incl. ScrollTrigger, SplitText) | 3.15.1 | GSAP "Standard no-charge" licence, https://gsap.com/standard-license. Free, including commercial use; read the terms for the few restrictions |

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

## Photos
The demo photos in `public/img/` are from Unsplash, under the Unsplash License
(https://unsplash.com/license). Sources are listed in `public/img/CREDITS.md` and
`public/credits.html`. They were cropped, resized and, for the hero dishes, cut out.

They are **placeholders for the demo only**. They show other restaurants' food, and the Unsplash
License does not allow selling the images themselves. **Replace them with the client's own photos
for every client site.**

## Icons
The interface icons in `src/lib/Icon.tsx` are original drawings made for this template.
