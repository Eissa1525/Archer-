# Activation Checklist: real online ordering and Stripe payments

Work through this list **with the client**. All accounts, keys and payouts belong to the client.
The developer should never need to see a secret key: the client can paste keys into the hosting
dashboard themselves, for example on a screen-share.

Status markers: ☐ to do · ☑ done · N/A not needed

---

## Part 0: Decide the ordering mode
- ☐ **Phone only** (`phone`): no accounts needed. Stop here.
- ☐ **Existing platform** (`external`: Square, Toast, Uber Eats, DoorDash…): the client's account
  and ordering links. Stop after Part 1.
- ☐ **Orders on this website** (`endpoint`): continue with Parts 1–4.
- ☐ **Plus online card payment** (`checkout-redirect`): also do Part 5.

## Part 1: Business information (all modes)
- ☐ `mode: 'client'` in the config
- ☐ Real name, address, **Google Maps link**, phone, email, opening hours
- ☐ Real menu, prices, taxes (the client confirms their tax registration and rates)
- ☐ The client's own photos; Unsplash demo photos removed
- ☐ Reviews: real ones with a source, or none
- ☐ `npm run check` passes with **0 problems**

## Part 2: Accounts the client must own
| Account | Purpose | Cost (check current pricing) |
|---|---|---|
| ☐ Domain registrar | the website address | yearly fee |
| ☐ Cloudflare (or other host) | hosting plus server functions | free tier available |
| ☐ GitHub | owning the source code | free |
| ☐ Resend **or** a webhook service (Make, Zapier, n8n, Slack, Google Sheets…) | delivering orders to the kitchen | free tiers available |
| ☐ Stripe (Part 5 only) | card payments, paid out to the client's bank | per-transaction fees |

## Part 3: Order delivery (endpoint)
1. ☐ Config: `ordering.provider = { type: 'endpoint', url: '/api/order' }` and
   `payment = { type: 'pay-on-collection' }`.
2. ☐ Copy `server/adapters/cloudflare-pages.ts` to `functions/api/order.ts`, fix the two imports,
   and commit.
3. ☐ In Cloudflare **Settings → Variables and Secrets**, add as **Secret**:
   - `SITE_URL`
   - `ORDER_WEBHOOK_URL`, and/or `RESEND_API_KEY` + `ORDER_EMAIL_TO` + `ORDER_EMAIL_FROM`
     (sender domain verified in Resend)
4. ☐ Redeploy.
5. ☐ **Test on the live preview URL:**
   - ☐ A pickup order arrives in the kitchen inbox or channel, with correct items and options.
   - ☐ A delivery order includes the address, the fee and the minimum.
   - ☐ With the kitchen channel deliberately broken, the customer sees an error, **not** a
     confirmation.
   - ☐ The reference shown to the customer matches the kitchen ticket.

## Part 4: Before taking real orders
- ☐ The client has a **privacy policy** covering the customer data collected (name, phone, email,
  address), its use and retention. In Canada, PIPEDA applies; the client should get their own
  advice.
- ☐ Who watches the order inbox during opening hours, and how fast they respond.
- ☐ What happens when the kitchen is closed or overloaded (temporarily switch to
  `phone`/`disabled`).
- ☐ A refund and cancellation policy (required in practice for card payments).

## Part 5: Stripe card payments (optional)
1. ☐ The client creates and **activates** a Stripe account (business details, bank account).
2. ☐ Config: `payment = { type: 'checkout-redirect', statusUrl: '/api/payment-status' }`.
3. ☐ Copy these adapters to `functions/api/`, fixing the imports:
   - `cloudflare-pages-payment-status.ts` → `functions/api/payment-status.ts`
   - `cloudflare-pages-stripe-webhook.ts` → `functions/api/stripe-webhook.ts`
4. ☐ Create a KV namespace (Workers & Pages → KV) and bind it to the Pages project as
   **`ORDERS_KV`**. It prevents duplicate kitchen orders. Without it, the webhook deliberately
   refuses to run.
5. ☐ Stripe dashboard → **Developers → Webhooks** → add the endpoint
   `https://<site>/api/stripe-webhook` with the event `checkout.session.completed`.
6. ☐ Add as **Secret**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
7. ☐ **Test in Stripe test mode first** (test keys, card `4242 4242 4242 4242`):
   - ☐ The payment succeeds, the page shows "Payment complete", and the kitchen gets **one**
     "PAID" ticket.
   - ☐ Opening `https://<site>/?order=success` by hand does **not** show "Payment complete".
   - ☐ Leaving the Stripe page shows "Payment cancelled", the cart is kept, and no ticket is sent.
   - ☐ In Stripe → Webhooks → the event → **Resend**: **no second ticket** arrives.
   - ☐ The amount charged equals the site's total, including tax and delivery.
8. ☐ Switch to **live** keys, then make one small real payment and refund it.

## Part 6: Go-live sign-off
- ☐ Tested on iPhone and Android.
- ☐ `npm test` and `npm run scan:secrets` pass.
- ☐ No secret keys anywhere in the code or repository (they live only in the host dashboard).
- ☐ The client confirms in writing that ordering (and payments) work for them.
- ☐ Handover completed (`docs/HANDOVER-PROCESS.md`).
