# Fire Alley — Street Food Website

A bold, animated street-food site: smash burgers, stone-fired pizza, street tacos and wings.
Layout and energy inspired by the "Hotbite" Framer template. All code, copy and brand are
original, and every photo is from Unsplash (see `public/img/CREDITS.md`).

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # typecheck + production build → dist/
npm run preview   # http://localhost:4173
```

Requires Node 20.19+.

## Change the content

Everything lives in **`src/data.ts`**: brand name, hero slides, menu and prices, reviews, gallery,
contact details. **The address, phone, email and reviews are placeholders.** Replace them before
going live. To change a photo, drop a `.webp` into `public/img/` and update its path in `data.ts`.
