# Handover Process: the client owns everything

The goal: once the project ends, the client can run, change, re-host or hand the site to another
developer **without needing us**. We deliver the finished website and its source code. Hosting, the
domain, third-party accounts and ongoing maintenance are the client's after handover, unless a
separate agreement says otherwise.

## Principles
1. **The client creates every account** with their own email and payment method: domain, hosting,
   GitHub, Stripe, Resend.
2. **We never hold the client's secrets.** Keys go straight from the provider into the hosting
   dashboard, entered by the client. If we must help, we do it on a screen-share or as temporary
   collaborators whose access is removed at handover.
3. **The source code is delivered in full:** a GitHub repository the client owns, plus a zip
   archive (`npm run package`).
4. **No customer data in the code.** Orders go to the client's inbox or channel and are never
   stored in the repository.

---

## Step by step

### 1. Kick-off
- ☐ Agree the ordering mode and integrations (`docs/ACTIVATION-CHECKLIST.md`, Part 0).
- ☐ Send the client the account list (Part 2) and ask them to create the accounts.
- ☐ Collect content: logo, colours, photos, menu, prices, hours, map link, socials.

### 2. Build
- ☐ `npm run new-client -- <client>` and fill in the config.
- ☐ Theme, photos, menu. `npm run check` passes.
- ☐ Share a preview (a pages.dev preview on the client's own Cloudflare account, or a private
  preview link).

### 3. Move to the client's accounts
- ☐ The client creates a **GitHub** account (or organisation) and an empty repository.
- ☐ Push the project there. Either:
  - they invite us temporarily, we push and they remove us at handover; or
  - we send the zip and they upload it to the repository.
- ☐ The client connects that repository to **their** Cloudflare Pages project
  (`docs/DEPLOYMENT.md`).
- ☐ The client adds the custom domain from **their** registrar.
- ☐ The client enters secrets in **their** host dashboard, if ordering is enabled.

### 4. Activate and test
- ☐ Complete `docs/ACTIVATION-CHECKLIST.md` on the client's own deployment.

### 5. Deliver
- ☐ Final zip from `npm run package`, with its SHA-256 checksum, sent to the client.
- ☐ The client confirms they can sign in to: registrar, host, GitHub, Stripe, Resend or webhook.
- ☐ A 30-minute walkthrough: editing the config, swapping a photo, changing a price, redeploying.
- ☐ Remove **all** of our access: GitHub collaborator, Cloudflare member, Stripe team member, and
  any temporary keys (the client rotates any key we ever saw).
- ☐ Signed handover note (below).

---

## Handover note (template)

> **Website handover: [Restaurant name]**
> Date: ____  Live URL: ____  Source commit / package checksum: ____
>
> The client confirms ownership of and access to:
> ☐ domain registrar ☐ hosting (Cloudflare) ☐ GitHub repository ☐ Stripe ☐ order email/webhook
>
> ☐ The developer's access to all of the above has been removed.
> ☐ Any secret the developer saw has been rotated by the client.
> ☐ Online ordering tested and accepted (or: not included).
> ☐ Online payments tested in test and live mode and accepted (or: not included).
> ☐ The client received the source code package and documentation.
>
> After this date, hosting, domain renewals, third-party fees, content updates and maintenance
> are the client's responsibility unless agreed separately.
>
> Client: __________  Developer: __________

---

## What the client receives
- **The website:** live on their domain, on their hosting.
- **Full source code:** in their GitHub repository, plus the zip and its checksum.
- **Documentation:** `README.md`, `docs/CLIENT-GUIDE.md`, `docs/DEPLOYMENT.md`,
  `docs/ACTIVATION-CHECKLIST.md`, `server/README.md` and `THIRD-PARTY-NOTICES.md`.
- **Tooling:** `npm run check`, `npm test` and `npm run scan:secrets` to keep future edits safe.
