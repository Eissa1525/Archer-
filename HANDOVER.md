# Restaurant Website — Client Handover Guide

This project is a complete, animated restaurant website. The sample restaurant **FIRE ALLEY** is
fictional: it's the demo. Everything specific to a restaurant (name, contact details, menu, prices,
photos, ordering) lives in **one file**: `src/config/site.config.ts`. The design and animations
never need to be touched.

---

## 1. Quick start

```bash
npm install          # once
npm run dev          # local preview at http://localhost:5173
npm test             # unit tests (pricing, checkout, config checks, order server)
npm run build        # production build → dist/  (this is what gets uploaded)
```
Requires Node.js 20.19 or newer.

---

## 2. Replace the business information

Open `src/config/site.config.ts` and work top to bottom. Or start from
`clients/_template.config.ts`, which has a `TODO` everywhere something must change.

| Setting | What it controls |
|---|---|
| `mode` | `'demo'` or `'client'` (see section 6) |
| `business` | name (header, loader, giant footer word), short name, tagline, optional logo image, Google title/description |
| `locale` | language/region and currency, e.g. `en-CA` + `CAD`. All prices format automatically |
| `contact` | email, phone (digits for the call link + display format), address, **Google Maps link**, opening hours |
| `social` | Instagram, Facebook, TikTok, X, YouTube, website. Icons appear only when listed |
| `topbar` | short items scrolling in the orange bar at the top |
| `hero` … `footer` | all headings and text of every section, in page order |
| `menu` | categories, items, prices, descriptions, spicy flags, customisation options, combo promo |
| `ordering` | how ordering works (section 4) |
| `reservations` | optional "Book a table" button (OpenTable, Resy, Tock…) |
| `credits` | "Website by" credit and photo-credit link |

**Getting the Google Maps link:** open the restaurant on Google Maps → **Share** → **Copy link**,
then paste it into `contact.mapsUrl`. The address and a "Get directions" button then open that
exact location.

---

## 3. Replace photos and prices

**Photos**
1. Put new images in `public/img/`. Use `.webp` or `.jpg`, about 1200–1600 px wide.
2. Point the matching entry in `site.config.ts` at the new file, e.g. `img('about-kitchen')` for
   `public/img/about-kitchen.webp`.
3. Hero dishes look best as **cut-outs on a transparent background**. Use `cutout: 'round'` for
   round plates and `'free'` for anything else (e.g. a burger).
4. When all Unsplash photos are replaced, remove `credits.photoCredits` and `public/credits.html`.

**Menu and prices:** edit `menu.categories`. Each item needs a unique `id`; the cart and the
order server use it. Prices are plain numbers (`12` or `9.5`). Customisations (sizes, heat level,
extras with prices) are defined once in `menu.optionGroups` and attached to items through `options`.
Set `orderable: false` to show an item without allowing online orders for it.

`npm run build` checks the menu: duplicate ids, unknown options and negative prices are reported.

---

## 4. Ordering: choose one mode

Set `ordering.provider` in the config:

| Provider | What the Order buttons do | Needs |
|---|---|---|
| `{ type: 'demo' }` | Full cart and checkout, but **nothing is sent**. The site says so on every screen | nothing (demos only, not allowed in client mode) |
| `{ type: 'endpoint', url: '/api/order' }` | Real cart and checkout. Orders go to the restaurant by email and/or webhook | a server function, see `server/README.md` |
| `{ type: 'external', pickupUrl, deliveryUrl }` | Open the client's existing ordering page (Square Online, Toast, Uber Eats, DoorDash…) | the client's account on that platform |
| `{ type: 'phone' }` | Call the restaurant | nothing |
| `{ type: 'disabled' }` | Buttons point to the menu and contact sections, with a note that online ordering isn't available | nothing |

Other ordering settings: pickup/delivery on or off, delivery fee, minimum order, delivery area,
time estimates, taxes (e.g. HST 13%), and whether email is required.

**Payment:** with the `endpoint` provider, `payment: { type: 'pay-on-collection' }` means customers
pay in store or to the driver. `{ type: 'checkout-redirect' }` sends them to **Stripe Checkout**
with the client's own Stripe account (see `server/README.md`).

---

## 5. Optional services

All of these use the **client's own accounts**. Keys and secrets go into the hosting dashboard as
environment variables. They are **never** written into the website code, which is public.

| Service | Purpose | Where it's set |
|---|---|---|
| Resend (or the webhook) | send each order to the kitchen by email | `server/README.md` |
| Slack / Discord / Make / Zapier / n8n / Google Sheets | receive orders as messages or rows | `ORDER_WEBHOOK_URL` |
| Stripe | online card payment | `server/README.md` |
| Square / Toast / Uber Eats / DoorDash… | the client's existing online ordering | `ordering.provider` = `external` |
| OpenTable / Resy / Tock… | table reservations | `reservations` in the config |
| Content updates | edit `site.config.ts` and redeploy. There is no admin panel (see section 9) | — |

---

## 6. Demo mode vs client mode

| | `mode: 'demo'` | `mode: 'client'` |
|---|---|---|
| Sample reviews | shown, tagged "Sample reviews · not real customers" | **never shown**. Reviews appear only with a real source (`isSample: false`, ideally with a link) |
| "Demo" tags, fictional-restaurant notices | shown | hidden |
| Search engines | `noindex` (kept out of Google) | indexable |
| `npm run build` | warns about problems | **fails** while anything fake remains: `.example` emails, 555 numbers, the word "fictional", `TODO`s, demo ordering, a missing map link, sample reviews |

So a client site physically cannot be built while it still contains made-up business details.

**Several clients from one copy (optional):** keep each config as `clients/<name>.config.ts` and
build with `SITE_CONFIG=clients/<name>.config.ts npm run build`. Without `SITE_CONFIG`, the Fire
Alley demo is built.

---

## 7. Hosting and deployment

The build output (`dist/`) is a plain static website. Any static host works. The client (or their
web provider) creates the account; this project has no dependency on anyone's personal account.

**Recommended: Cloudflare Pages.** It has a free plan, and at the time of writing its terms did not
restrict commercial use (check the current terms).
1. Push the project to the client's GitHub (or upload `dist/` directly).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repository.
3. Build command `npm run build`, output folder `dist`.
4. If using online ordering: add the function (`server/README.md`) and environment variables.
5. Add the client's domain under **Custom domains**.

**Other hosts:** Netlify, Vercel, or any static web host. Note that **Vercel's free Hobby plan is
for non-commercial use only**; a restaurant site needs a paid Vercel plan.

**Before launch:**
- `mode: 'client'` and `npm run build` succeeds.
- Place a real test order end to end, if ordering is enabled.
- Check the phone, email, map and social links on a real phone.
- Check the site on iPhone and Android.

---

## 8. Accounts, costs and responsibilities

AETHER Studio builds and hands over the website. **Hosting, the domain, third-party accounts and
any ongoing maintenance are the client's responsibility after handover.** Prices change, so always
check the provider's site. Rough guide at the time of writing:

| Item | Account needed | Typical cost |
|---|---|---|
| Domain name | registrar (Cloudflare, Namecheap, GoDaddy…) | yearly fee, often about $15–30 CAD/year for a .com or .ca |
| Hosting | Cloudflare Pages / Netlify / Vercel | free tiers exist; check commercial-use rules (Vercel Hobby forbids it) |
| Order emails | Resend | free tier for low volume; paid above that |
| Online payments | Stripe | no monthly fee; a percentage plus a fixed fee per transaction |
| Ordering platforms | Square / Toast / Uber Eats… | plan fees and/or commission per order |
| Reservations | OpenTable / Resy / Tock | usually monthly and/or per-cover fees |
| Google Business Profile | Google | free |

---

## 9. Feature status

**Works immediately, with no accounts needed:**
- The full animated website: every section, slider, menu tabs, review carousel, gallery, mobile
  menu, custom cursor, smooth scrolling, reduced-motion support.
- Every business detail and all content from one config file, with build-time checks.
- Real `mailto:` email links, `tel:` call links, Google Maps address and directions, social icons,
  reservation button.
- Demo and client modes. Client builds refuse fake or placeholder data.
- Ordering UI: cart, quantities, customisations with extra prices, special instructions, pickup or
  delivery, delivery fee and minimum, taxes, customer details form with validation, order summary,
  and the success and error screens.
- The `phone`, `external` and `disabled` ordering modes.

**Built and tested, but waiting for the client's own credentials:**
- **Real order submission:** server function plus email (Resend) and/or webhook. Tested end to end
  against a local stand-in for the kitchen; needs the client's host and email/webhook account.
- **Stripe online payment:** unit-tested only. Must be tested in Stripe test mode with the client's
  account before launch.

**Not included:**
- An admin dashboard or CMS for non-technical edits. Content changes mean editing
  `site.config.ts` and redeploying. A headless CMS could feed the same config shape later.
- Order management (accepting or rejecting orders, kitchen screens). Orders arrive by email or
  webhook. For a full system, use an ordering platform with the `external` provider.
- Translations. There is one language per build.
