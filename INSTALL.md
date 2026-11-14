# Install: your first 15 minutes

## 1. Install Node.js (once)
Download the **LTS** version from https://nodejs.org and install it. Version 20.19 or newer is
needed. Check it in a terminal:
```bash
node --version
```

## 2. Unzip and install
Unzip the download, open a terminal **in the unzipped folder**, then run:
```bash
npm install
```

## 3. See the demo
```bash
npm run dev
```
Open **http://localhost:5173**. You'll see the Fire Alley demo restaurant with placeholder images.
Its ordering is a safe demo: nothing is ever sent or charged.

## 4. Make it yours
```bash
npm run new-client -- my-restaurant
```
This creates `clients/my-restaurant.config.ts`. Open it in any code editor (VS Code is free) and
replace every `TODO`: name, colours, contact details, map link, hours and menu. Then check it and
preview it:
```bash
npm run check -- clients/my-restaurant.config.ts
SITE_CONFIG=clients/my-restaurant.config.ts npm run dev
```
On Windows PowerShell, use `$env:SITE_CONFIG="clients/my-restaurant.config.ts"; npm run dev`.

Put the restaurant's photos in `public/img/` using the **same file names** as the placeholders
(each placeholder shows its file name and size).

## 5. Build and publish
```bash
SITE_CONFIG=clients/my-restaurant.config.ts npm run build
```
Upload the `dist/` folder to any static host. The easiest is Cloudflare Pages:
**Workers & Pages → Create → Pages → Upload assets** → drop `dist/`. Full guide:
`docs/DEPLOYMENT.md`.

## Need more?
- Everything you can configure: `docs/CLIENT-GUIDE.md`
- Real online ordering and Stripe (needs the restaurant's own accounts):
  `docs/ACTIVATION-CHECKLIST.md`
- Your licence (one website per licence): `LICENSE.md`
