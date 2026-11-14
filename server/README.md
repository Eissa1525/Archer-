# Order endpoint (optional)

The website is static. To receive **real online orders**, it needs one small server function that
checks the order and passes it to the restaurant. `order-handler.ts` is that function. It uses only
web-standard APIs, so the same code runs on most hosts.

## What it does
1. **Validates and re-prices.** Every item, quantity and option is checked against the menu in
   `src/config/site.config.ts`, and the totals are recalculated. Prices sent by the browser are
   ignored, so nobody can change a price in their browser.
2. **Notifies the restaurant** through one or both channels:
   - **Webhook:** `ORDER_WEBHOOK_URL`. Works with Slack, Discord, Make, Zapier, n8n, or a Google Apps
     Script that adds a row to a Sheet. The JSON contains `text` (a ready-to-read ticket) and
     `order` (structured data).
   - **Email via [Resend](https://resend.com):** `RESEND_API_KEY`, `ORDER_EMAIL_TO`, `ORDER_EMAIL_FROM`.
3. **Answers `{ ok: true, reference }` only when at least one channel accepted the order.**
   Otherwise the customer sees an error and is asked to call. The site never shows a confirmation
   for an order the restaurant didn't receive.

## Turning it on
1. In `src/config/site.config.ts`:
   ```ts
   ordering: { ...,
     provider: { type: 'endpoint', url: '/api/order' },
     payment: { type: 'pay-on-collection' },
   }
   ```
2. Copy the adapter for the host to where that host expects functions:

   | Host | Copy | to |
   |---|---|---|
   | Cloudflare Pages | `server/adapters/cloudflare-pages.ts` | `functions/api/order.ts` |
   | Vercel | `server/adapters/vercel.ts` | `api/order.ts` |
   | Netlify | `server/adapters/netlify.ts` | `netlify/functions/order.ts` |

   Fix the two relative imports in the copied file (one folder level deeper). Example for
   Cloudflare: `'../../server/order-handler'` and `'../../src/config/site.config'`.
3. Add the environment variables **in the host's dashboard, never in the code**:

   | Variable | Needed for |
   |---|---|
   | `ORDER_WEBHOOK_URL` | webhook notifications |
   | `RESEND_API_KEY`, `ORDER_EMAIL_TO`, `ORDER_EMAIL_FROM` | email notifications (sender domain verified in Resend) |
   | `SITE_URL` | the live site URL, e.g. `https://www.restaurant.com` (CORS and payment return pages) |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | online payment only (below) |

4. Deploy, place a real test order, and confirm it arrives. **Only then** tell the client that
   ordering works.

## Online payment (Stripe Checkout), optional
Set `payment: { type: 'checkout-redirect' }`. The flow:
1. The endpoint creates a Stripe Checkout Session with the client's secret key and server-side
   prices.
2. The customer pays on Stripe's page and returns to `SITE_URL/?order=success&ref=…` (or
   `?order=cancelled`).
3. Stripe calls `handleStripeWebhook`. The restaurant is notified **only after payment succeeded**.

To activate the webhook, create a second function that calls `handleStripeWebhook` instead of
`handleOrderRequest`, for example `functions/api/stripe-webhook.ts`. Then add the endpoint in the
Stripe dashboard (event `checkout.session.completed`) and put its signing secret in
`STRIPE_WEBHOOK_SECRET`.

**Status:** the Stripe code is unit-tested against Stripe's documented request format and
signature scheme. It has **not** been run against a live Stripe account. Test it in Stripe test
mode with the client's account before going live.

## Tests
`npm test` covers price recomputation, tampering, validation, all channels failing, honeypot, the
Stripe session request, and webhook signatures.
