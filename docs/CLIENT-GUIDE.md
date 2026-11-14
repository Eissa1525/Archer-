# Client Guide: customising the restaurant website

Everything specific to one restaurant lives in **one configuration file**: brand colours, fonts,
name, contact details, menu, prices, photos and ordering. The design and animations never need to
be edited.

The package ships with **FIRE ALLEY**, a fictional demo restaurant, in `src/config/site.config.ts`.

---

## 1. Quick start

Requires **Node.js 20.19 or newer** (https://nodejs.org).

```bash
npm install                                   # once
npm run dev                                   # live preview at http://localhost:5173
npm run new-client -- my-restaurant           # creates clients/my-restaurant.config.ts
npm run check -- clients/my-restaurant.config.ts
SITE_CONFIG=clients/my-restaurant.config.ts npm run dev     # preview the client's site
SITE_CONFIG=clients/my-restaurant.config.ts npm run build   # production files → dist/
```
On Windows (PowerShell), set the variable first:
`$env:SITE_CONFIG="clients/my-restaurant.config.ts"; npm run build`.

**Simplest option for a single restaurant:** edit `src/config/site.config.ts` directly and set
`mode: 'client'`. Then `npm run build` needs no `SITE_CONFIG`.

---

## 2. What you can configure

| Setting | What it controls |
|---|---|
| `mode` | `'demo'` or `'client'` (section 6) |
| `theme.colors` | 14 brand colours as `#rrggbb`: backgrounds, accents, shadows, glow |
| `theme.fonts` | heading font, body font and their Google Fonts link (or `null` for system fonts) |
| `theme.favicon` | browser-tab icon; omitted, one is generated from the brand colours |
| `business` | name (header, loader, giant footer word), short name, tagline, optional logo image, Google title and description |
| `locale` | region and currency, e.g. `en-CA` + `CAD`. Prices format automatically |
| `contact` | email, phone, address, **Google Maps link**, opening hours |
| `social` | Instagram, Facebook, TikTok, X, YouTube, website. Icons appear only when listed |
| `topbar` | short items in the scrolling orange bar at the top |
| `hero` … `footer` | every heading and text, in page order |
| `menu` | categories, items, prices, descriptions, spicy flags, options with extra prices, combo promo |
| `ordering` | how customers order (section 5) |
| `reservations` | optional "Book a table" button (OpenTable, Resy, Tock…) |
| `credits` | "Website by" credit and photo-credit link |

**Brand colours:** pick the darkest colour for `brown`, the main accent for `orange` and a second
accent for `yellow`. The shadow colours should be a darker shade of the colour they sit under. A
complete recolour takes about 5 minutes; the build rejects anything that isn't a `#rrggbb` colour.

**Google Maps link:** open the restaurant on Google Maps → **Share** → **Copy link**, then paste it
into `contact.mapsUrl`.

---

## 3. Photos and menu

**Photos**
1. Put the client's photos in `public/img/`. Use `.webp` or `.jpg`, about 1200–1600 px wide.
2. Point the config at them, e.g. `img('about-kitchen')` for `public/img/about-kitchen.webp`.
3. Hero dishes look best as **cut-outs on a transparent background** (`.webp` or `.png`). Use
   `cutout: 'round'` for round plates and `'free'` for other shapes.
4. **Every image shipped in `public/img/` is a placeholder.** Each one shows its file name, size
   and the kind of photo that belongs there. Replace them all with the restaurant's own photos (or
   photos you have the rights to). If you use third-party photos that require credit, fill in
   `credits.photoCredits` and add a credits page.

**Menu and prices:** edit `menu.categories`.
- Each item needs a unique `id`; the cart and the order server use it.
- Prices are plain numbers (`12` or `9.5`) in the configured currency.
- Options (sizes, heat level, extras with prices) are defined once in `menu.optionGroups` and
  attached to items through `options`.
- `orderable: false` shows an item but blocks online orders for it.

---

## 4. Checking your work

`npm run check` and `npm run build` refuse to continue when something is wrong, for example:
- duplicate menu ids, unknown options or negative prices;
- invalid colours or fonts;
- in client mode: leftover `TODO`s, fictional `555` numbers, `.example` emails, sample reviews, a
  missing map link, or demo ordering;
- in demo mode: anything that could send a real order or take a real payment.

---

## 5. Ordering modes

| `ordering.provider` | Order buttons | Needs |
|---|---|---|
| `{ type: 'demo' }` | full cart and checkout; **nothing is ever sent**, as the site says on every step | nothing. The only mode (with `disabled`) allowed in demo mode |
| `{ type: 'disabled' }` | point to the menu and contact sections, with a note that online ordering isn't available | nothing |
| `{ type: 'phone' }` | call the restaurant | nothing |
| `{ type: 'external', pickupUrl, deliveryUrl }` | open the client's ordering page (Square, Toast, Uber Eats, DoorDash…) | the client's account there |
| `{ type: 'endpoint', url: '/api/order' }` | real cart and checkout. Orders go to the kitchen by email and/or webhook | a server function: see `docs/ACTIVATION-CHECKLIST.md` |

Payment (endpoint only): `pay-on-collection` (pay in store or to the driver), or
`checkout-redirect` (Stripe Checkout, verified server-side).

Also configurable: pickup and/or delivery, delivery fee, minimum order, area, time estimates,
taxes (e.g. HST 13%) and whether email is required.

---

## 6. Demo mode and client mode

| | `mode: 'demo'` | `mode: 'client'` |
|---|---|---|
| Orders and payments | **impossible.** Only `demo`/`disabled` ordering is allowed, and the browser and server code also refuse to send | as configured |
| Sample reviews, "demo" tags, fictional notices | shown, clearly labelled | never shown. Reviews need a real source |
| Search engines | `noindex` | indexable |
| Build | refuses anything unsafe | refuses anything fake or incomplete |

---

## 7. Next steps

- **Turning on real ordering and payments:** `docs/ACTIVATION-CHECKLIST.md`
- **Putting the site online:** `docs/DEPLOYMENT.md`
- **Ownership of hosting, domain, accounts and code:** `docs/HANDOVER-PROCESS.md`
