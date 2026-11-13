# AETHER Studio — Cinematic 3D Website

Working notes for Claude (and humans) building the AETHER Studio site.
**Current scope: the interactive 3D hero only.** Do not start other sections until the hero is signed off.

## Stack

- React 19 + TypeScript + Vite 8
- three.js r187, @react-three/fiber 9, @react-three/drei 10
- @react-three/postprocessing 3 (bloom, tone mapping, CA, vignette, grain)
- GSAP 3 + ScrollTrigger (intro choreography, scroll-driven camera)
- Node ≥ 20.19

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck (tsc -b) + production build → dist/
npm run preview    # serve dist/ at http://localhost:4173
```

## Design goals

1. **Surreal aquatic dusk.** A mirror-calm sea under a coral-to-indigo sky. Bioluminescent life
   (jellyfish, plankton) floats *above* the water as if the air were an ocean. That is the surreal
   twist, and it is the brand idea: worlds that breathe.
2. **Everything is real-time and procedural.** No video backgrounds, no static hero images, no
   downloaded models or HDRIs. The sky, sea, jellyfish, glass, halo and light are all geometry and
   GLSL. Keep it that way unless an asset is clearly licensed and documented here.
3. **Cinematic camera.** Crane-down intro (GSAP), handheld breathing drift, eased pointer parallax,
   and a scroll "descent" that skims the camera toward the water.
4. **The scene listens.** Pointer movement stirs plankton (push + swirl), speeds up the halo,
   nudges jellyfish away, and leans the core. Hovering the core or a bubble responds. When idle,
   or on touch devices, the "pointer" wanders on its own so the scene never feels dead.
5. **Premium editorial type.** Instrument Serif (display, italics as accent) + Inter Tight (UI),
   both free on Google Fonts. Large, quiet, with plenty of air. A glassmorphic pill nav.
6. **Legibility first.** 3D focal points are composed away from the copy: right third on desktop,
   top on portrait. A soft radial scrim sits behind the copy. Never add per-line `text-shadow`
   (the line masks clip it into visible boxes).
7. **Performance budgets.** Two tiers from `useQuality` (coarse pointer / narrow / ≤4 cores → `low`).
   `PerformanceMonitor` steps DPR down under load. The low tier gets a smaller reflector, fewer
   particles and samples, and no CA/grain/MSAA. three.js is lazy-loaded so the copy paints first.
8. **Graceful degradation.** `prefers-reduced-motion` gives near-instant intro and slowed motion.
   No WebGL gives a CSS dusk gradient with full copy and an honest "static preview" label.

## Palette (`src/scene/palette.ts`)

| token     | hex       | use                          |
|-----------|-----------|------------------------------|
| zenith    | `#060718` | top of sky, page bg          |
| upper     | `#1a1546` | upper sky                    |
| mid       | `#5a2f73` | mid sky violet               |
| horizon   | `#ff8f7a` | coral horizon band           |
| sun       | `#ffd2a8` | sun, core heart, god rays    |
| fog       | `#7a4262` | distance haze                |
| water     | `#0d0f26` | sea base colour              |
| bioCyan   | `#7fe7ff` | bioluminescence (primary)    |
| bioViolet | `#b69bff` | bioluminescence (secondary)  |
| bioCoral  | `#ffa3b8` | bioluminescence (warm)       |

## Architecture

```
src/
  App.tsx              WebGL detection, layout (wide/tall), lazy-loads the scene
  ui/Overlay.tsx       Nav, hero copy, GSAP intro timeline + ScrollTrigger
  styles.css           All DOM styling (tokens at :root)
  hooks/useQuality.ts  Tier / mobile / reduced-motion detection, WebGL check
  scene/
    Experience.tsx     <Canvas>, lights, procedural Environment, scene graph per layout
    store.ts           three-free shared state (scroll, intro, pointerEnergy, isCapture)
    pointer.ts         pointer NDC + world-space hit (THREE vectors; scene-only)
    CameraRig.tsx      intro / idle / pointer / scroll camera composition
    Sky.tsx            gradient sky + sun + clouds + stars; HorizonMist ring
    Ocean.tsx          MeshReflectorMaterial + procedural tiling ripple texture
    Jellyfish.tsx      lathe bell + line tentacles + tube oral arms, all shader-animated
    Orbs.tsx           glass Core (transmission + heart + light + Halo) and Bubbles
    Halo.tsx           orbital particle swirl (differential rotation)
    Plankton.tsx       drifting marine-snow points, pointer-stirred
    LightShafts.tsx    additive god-ray planes
    Effects.tsx        post stack per tier
```

Rules of thumb:
- `store.ts` **must not import `three`**. The overlay imports it, and anything it pulls in lands in
  the entry chunk.
- Per-frame values go through the mutable stores, never React state.
- `@react-three/postprocessing` sets the renderer to `NoToneMapping`, so tone mapping is the
  `<ToneMapping>` effect. Keep it after Bloom.
- Shader-displaced geometry needs a manual `boundingSphere` or it gets frustum-culled.
- `DataTexture` defaults to Nearest filtering. Set Linear plus mipmaps for anything smooth.

## Verification

There is no GPU in the cloud container, so screenshots use SwiftShader (~4 fps). Append
`?capture` to the URL: it disables GSAP lag smoothing and the camera dt clamp so the intro
settles on wall-clock time. Never ship behaviour that depends on `?capture`.

Checked so far: `npm run build` clean, no console errors; desktop 1280×800 and mobile 390×844
renders; pointer parallax; scroll descent and Chapter II reveal; mobile menu toggle;
reduced motion; no-WebGL fallback.
**Not yet checked:** real-GPU frame rate on actual phones and laptops, Safari/iOS, Firefox.

## Future tasks

Hero polish
- [ ] Profile on real devices (iPhone, mid Android, MacBook Air). Tune tiers and the reflector resolution.
- [ ] Safari/iOS pass: `backdrop-filter`, `svh` units, transmission material cost.
- [ ] Hide the bubbles and core from the reflector pass with layers if mirror cost is too high.
- [ ] Keyboard and focus audit; the 3D layer is `aria-hidden` and that must stay true.
- [ ] Optional ambient sound (muted by default, explicit toggle).
- [ ] Replace placeholder copy and nav anchors with the real IA.
- [ ] Self-host fonts (drop the Google Fonts request) once the type is final.
- [ ] OG image / social preview rendered from the scene.

Next chapters (only after hero sign-off)
- [ ] Chapter II "The work surfaces": camera continues under the surface into the work grid.
- [ ] Studio / process / contact sections.
- [ ] Page transitions that keep the canvas alive.
- [ ] CI: build check on PRs (GitHub Actions, free tier).

Deployment
- [ ] Nothing is deployed. Do not deploy or add paid services without explicit approval from the owner.
