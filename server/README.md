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
Set `payment: { type: 'checkout-redirect', statusUrl: '/api/payment-status' }`. The flow:
1. `/api/order` creates a Stripe Checkout Session with the client's secret key and server-side
   prices.
2. The customer pays on Stripe's page and returns to
   `SITE_URL/?order=success&session_id=cs_…` (or `?order=cancelled`).
3. **The return URL proves nothing.** The page calls `GET /api/payment-status?session_id=…`
   (`handlePaymentStatus`), which asks Stripe with the secret key. "Payment complete" is shown, and
   the cart cleared, only when Stripe reports the session `complete` **and** `paid`. A forged or
   unverifiable link shows "We couldn't confirm your payment" with the phone number.
4. Stripe calls `POST /api/stripe-webhook` (`handleStripeWebhook`). The restaurant is notified
   **only after payment succeeded**, and **only once per Checkout Session**.

**Three functions to activate** (Cloudflare Pages: copy to `functions/api/…` and fix imports):

| Adapter | Route |
|---|---|
| `server/adapters/cloudflare-pages.ts` | `/api/order` |
| `server/adapters/cloudflare-pages-payment-status.ts` | `/api/payment-status` |
| `server/adapters/cloudflare-pages-stripe-webhook.ts` | `/api/stripe-webhook` |

In the Stripe dashboard, add the webhook endpoint (event `checkout.session.completed`) and put its
signing secret in `STRIPE_WEBHOOK_SECRET`.

### Webhook idempotency (no duplicate kitchen orders)
Stripe can deliver the same event more than once, for example on retries or timeouts. The webhook
claims each Checkout Session in a key-value store before notifying the kitchen:
- **Already delivered:** answered `200 { duplicate: true }`, nothing is sent again.
- **Another delivery is processing it right now:** `409`, so Stripe retries later.
- **The kitchen couldn't be reached:** the claim is released and a `500` makes Stripe retry, so the
  order still arrives, exactly once.
- **No store configured:** `503`, nothing sent. It refuses rather than risk duplicates.
- As a second layer, the same `Idempotency-Key: stripe-<session>` is sent to Resend and to the
  order webhook, so receivers that support it can also drop duplicates.

**Store setup (Cloudflare):** create a KV namespace and bind it to the Pages project as
`ORDERS_KV`. KV handles retries well. Two deliveries arriving in the **same instant** in different
data centres could, rarely, both get through, because KV has no atomic "create if missing". For a
strict guarantee, give `handleStripeWebhook` a store with `putIfAbsent` backed by a Durable
Object, a database unique key (D1/Postgres) or Redis `SET NX`. The interface is `KeyValueStore`
in `order-handler.ts`. Other hosts (Vercel, Netlify) must supply such a store; there is no built-in
one.

**Status:** the Stripe code is unit-tested against Stripe's documented request format, session
statuses and signature scheme, and the return page is browser-tested against the real status
handler with Stripe simulated. It has **not** been run against a live Stripe account. Test it in
Stripe test mode with the client's account before going live, including replaying a webhook event
from the Stripe dashboard to confirm no duplicate order arrives.

## Tests
`npm test` covers price recomputation, tampering, validation, all channels failing, honeypot, the
Stripe session request, webhook signatures, payment-status verification (paid / unpaid / expired /
forged / malformed / Stripe down) and webhook idempotency (repeat, simultaneous, failure then retry,
missing store).
