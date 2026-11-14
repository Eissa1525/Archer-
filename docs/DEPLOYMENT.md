# Deployment

`npm run build` produces a plain static website in `dist/`. Any static host can serve it. Online
ordering additionally needs **server functions** (`server/`), which run on Cloudflare Pages
Functions, Netlify Functions or Vercel.

**All accounts belong to the client.** Nothing in this project depends on the developer's
personal accounts.

---

## Option A: Cloudflare Pages (recommended)

Cloudflare Pages has a free plan, and at the time of writing its terms did not restrict commercial
use. Check the current terms and limits before relying on it.

### A1. Static site only (no online ordering)
1. The client creates a Cloudflare account (https://dash.cloudflare.com).
2. Put the code in the client's own GitHub repository (see `docs/HANDOVER-PROCESS.md`).
3. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** →
   choose the repository.
4. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable `NODE_VERSION` = `22`
   - For a config under `clients/`: environment variable `SITE_CONFIG` =
     `clients/<name>.config.ts`
5. **Save and Deploy.** The site appears at `https://<project>.pages.dev`.
6. **Custom domain:** project → **Custom domains** → add the client's domain and follow the DNS
   steps.

No Git? Run `npm run build` locally, then **Create → Pages → Upload assets** and upload `dist/`.
Functions are not available that way.

### A2. With online ordering
Follow `docs/ACTIVATION-CHECKLIST.md`. In short:
1. Copy the adapters from `server/adapters/` into `functions/api/` (and fix the imports).
2. Add the secrets under **Settings → Variables and Secrets** (type: **Secret**).
3. For Stripe: create a **KV namespace** and bind it as `ORDERS_KV`.
4. Redeploy and run the activation tests.

---

## Option B: Netlify
1. Connect the client's repository in Netlify.
2. Build command `npm run build`, publish directory `dist`.
3. For ordering, copy `server/adapters/netlify.ts` to `netlify/functions/order.ts` and add the
   environment variables. Stripe additionally needs a payment-status function and an idempotency
   store; Netlify has no built-in KV, so a small database or Redis is required (see
   `server/README.md`).

## Option C: Vercel
Similar to Netlify, using `server/adapters/vercel.ts`. **Vercel's free Hobby plan is for personal,
non-commercial use only.** A restaurant needs a paid Vercel plan.

## Option D: any static host
Upload the contents of `dist/`. Online ordering is then limited to the `external`, `phone` or
`disabled` modes, unless a separate server provides `/api/order`.

---

## Before every production deploy
- [ ] `mode: 'client'` (or `demo` only for a portfolio demo).
- [ ] `npm run check` passes.
- [ ] `npm test` passes.
- [ ] `npm run scan:secrets` passes.
- [ ] The preview deployment was checked on a real phone.
- [ ] If ordering is enabled, the activation checklist is complete.
