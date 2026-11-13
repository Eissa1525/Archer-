# AETHER Studio — Cinematic 3D Hero

A real-time, fully procedural WebGL hero for AETHER Studio: a surreal dusk sea where
bioluminescent jellyfish, glass orbs and drifting plankton float above a mirror-calm surface.

Built with React, Vite, three.js, React Three Fiber, Drei, postprocessing and GSAP.

## Preview locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 for the v2 "Aether Gate" hero, or http://localhost:5173/#v1
for the original aquatic hero. Move the pointer to stir the scene, and scroll to fly through the gate.

Production build:

```bash
npm run build
npm run preview   # http://localhost:4173
```

Requires Node 20.19+.

See [CLAUDE.md](./CLAUDE.md) for design goals, architecture and the roadmap.
