# Restaurant Website: Fire Alley demo

An animated, client-ready restaurant website (React + Vite, GSAP, Motion, Lenis). The bundled
restaurant, **Fire Alley**, is fictional and serves as the demo.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # unit tests
npm run build     # production build → dist/
```

- **Swap in a real restaurant:** edit `src/config/site.config.ts` (or start from
  `clients/_template.config.ts`) and set `mode: 'client'`.
- **Online ordering, payments, hosting, costs:** see **[HANDOVER.md](./HANDOVER.md)** and
  **[server/README.md](./server/README.md)**.
- **Photos:** Unsplash License, see `public/img/CREDITS.md`.

Requires Node 20.19+.
