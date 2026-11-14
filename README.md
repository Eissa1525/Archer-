# AETHER Restaurant Website Template

An animated, mobile-first restaurant website that one configuration file turns into any
restaurant's site. It covers branding, menu, prices, contact details, ordering and payments. It
ships with **FIRE ALLEY**, a fictional demo restaurant.

**Features**
- Cinematic GSAP, Motion and Lenis animation: hero slider, scroll-driven sections, a draggable
  gallery and reviews.
- Configurable brand colours, fonts, logo and favicon.
- Every business detail in one typed config, checked before every build.
- Real email, phone and Google Maps links, social icons, a reservations button.
- Optional online ordering: cart, options, pickup or delivery, taxes and fees, checkout.
- Optional Stripe payments, verified server-side, with duplicate-proof kitchen notifications.
- **Safe demo mode:** cannot send orders or take payments, enforced in the build, the browser and
  the server.
- 69 automated tests, a secret scanner, and a packaging script.

## Quick start
```bash
npm install
npm run dev                          # http://localhost:5173 (the Fire Alley demo)
npm run new-client -- my-restaurant  # start a client config from the template
npm test                             # automated tests
npm run build                        # production build → dist/
```
Requires Node.js 20.19+.

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | live preview |
| `npm run build` | type-check, validate the config, build `dist/` |
| `npm run check -- <config>` | validate a config without building |
| `npm run new-client -- <name>` | create `clients/<name>.config.ts` from the template |
| `npm test` | all automated tests |
| `npm run scan:secrets` | fail if anything resembling a secret key or `.env` file is in the project |
| `npm run package` | verified source zip in `release/` |

Select a config with `SITE_CONFIG=clients/<name>.config.ts`; the default is the demo.

## Documentation
| Document | For |
|---|---|
| [docs/CLIENT-GUIDE.md](docs/CLIENT-GUIDE.md) | customising branding, content, photos, menu and ordering |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | hosting on Cloudflare Pages, Netlify, Vercel or anywhere |
| [docs/ACTIVATION-CHECKLIST.md](docs/ACTIVATION-CHECKLIST.md) | switching on real online ordering and Stripe |
| [docs/HANDOVER-PROCESS.md](docs/HANDOVER-PROCESS.md) | transferring hosting, domain, accounts and code to the client |
| [server/README.md](server/README.md) | the optional order, payment-status and Stripe-webhook functions |
| [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) | licences of software and fonts |
| [LICENSE.md](LICENSE.md) | your licence: one website per licence |
| [INSTALL.md](INSTALL.md) | step-by-step first install |

## Project layout
```
src/config/site.config.ts   ← the restaurant (demo by default)
src/config/                 types, validation, theme
src/sections/               the page sections (design, animations)
src/order/                  cart, pricing, checkout, order panel
server/                     optional server functions plus host adapters
clients/_template.config.ts starting point for a new client
scripts/                    check, new-client, scan:secrets, package
tests/                      vitest suites
public/img/                 original placeholder images: replace with the restaurant's photos
```

## Security
- Secret keys are **never** stored in the code. They go into the hosting dashboard only (see
  `.env.example` for the names).
- `.env`, `.dev.vars` and key files are git-ignored, and `npm run scan:secrets` fails on them.
- The template contains no customer data. Orders go only to the restaurant's own inbox or channel.
