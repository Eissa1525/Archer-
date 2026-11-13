# AETHER Studio — Cinematic 3D Website

Working notes for Claude (and humans) building the AETHER Studio site.
**Current scope: the interactive 3D hero only.** Do not start other sections until the hero is signed off.

## Two hero versions (both kept)

| URL            | Version | Code |
|----------------|---------|------|
| `/` (default)  | **v2: "The Aether Gate"**, the cinematic art-direction upgrade | `src/v2/**` |
| `/#v1`         | v1: aquatic dusk hero, unchanged | `src/AppV1.tsx`, `src/scene/**`, `src/ui/**`, `src/styles.css` |

`src/main.tsx` picks the version from the hash. Keep the two `lazy(() => import(...))` calls
**separate**: a single ternary `import()` shares one preload list and v1's CSS is then never
injected. v2 CSS classes are all `ax-*` so both stylesheets can coexist in one bundle.

## v2 art direction ("The Aether Gate")

Reference studied: the "Built for the curious" clip (`dfa0b56f…mp4`, frames at 30.6s and 31.6s).
- **Composition:** centred and symmetric. One subject, with the headline crossing it.
- **Ribbon:** a galaxy-like elliptical band of sparks, cyan with gold, that wraps the subject,
  passing behind at the top and in front at the bottom.
- **Palette:** near-black teal-blue void with warm gold flowers, a complementary blue/gold scheme.
- **Type and UI:** Instrument Serif headline, glass input and pill.
- **Background:** a looping MP4.
What makes it rich is *photographic footage of a subject*. We have no licensed footage and no
generation tool, so v2 translates the principles into real-time 3D:

- **Subject:** an obsidian gate (extruded arch, bevelled, gold inlay drawn on during the intro, cyan
  rim line) standing on a plinth over a polished black mirror floor.
- **Portal:** a parallax shader window into "another world": far horizon, nebula, stars and a
  mirrored streak. It is darker at the base so the title can sit over it.
- **Depth:** five or six echo arches recede behind, each growing faster than its distance, so they
  nest into a tunnel. They are thin on purpose: thick frames merge into a black wall in perspective.
- **Energy ribbon:** three intertwined bands of 30k sparks (27% gold) plus smooth glowing strips.
  They use true depth, so the portal hides the back of the ribbon and the front passes over the gate.
  The ribbon swells and pinches along its length, unfurls during the intro, parts around the
  pointer, and speeds up with scroll and pointer energy.
- **Light:** a thin horizon line back-lights the architecture, with a low sun at the end of the
  corridor, faint beams, dust, sparse warm bokeh in the foreground, a cyan light that follows the
  pointer, and a breathing violet light inside the gate.
- **Grade:** Bloom, then ACES, then a custom split-tone `GradeEffect` (multiplicative, so black stays
  black: indigo shadows, gold highlights, gentle S-curve), then CA, vignette and grain.
- **Scroll (320svh, sticky):** the copy peels away in four parallax layers. The camera follows a
  Catmull-Rom path through the gate (the portal floods cyan-violet and a DOM flash covers the
  crossing), then down the corridor toward the sun, ending on "Chapter II".

### Libraries (what is actually used)
- **GSAP 3.15 + ScrollTrigger + SplitText** (SplitText is free since 3.13): intro timeline,
  per-character title reveal, scroll scrub, parallax layers, Chapter II and dusk transitions.
- **Motion for React (`motion` 14.13, MIT):** shared-layout nav hover pill (`layoutId`),
  spring-driven magnetic buttons, `AnimatePresence` mobile menu with staggered links, `MotionConfig
  reducedMotion="user"`.
- **R3F / Drei / postprocessing:** scene, Environment Lightformers, MeshReflectorMaterial,
  PerformanceMonitor, custom Effect.
- **Not used:** React Bits, HorizonX and MotionSite were unreachable from the build session
  (network policy), and none of them has an npm package we could verify. The npm `react-bits`
  package is an unrelated 2022 library. Framer is not used; this stays a React/Vite project.

### Where premium footage would go (not done)
v2 has **no video and no photographic assets**. If a licensed or AI-generated loop of an original
subject becomes available, the intended integration is: a `<video autoplay muted loop playsinline>`
layer behind a transparent canvas (`gl.alpha = true`, no background), with the ribbon, dust and
grade staying real-time on top. That would close most of the remaining gap to the reference.

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

v1 checks: `npm run build` clean, no console errors; desktop 1280×800 and mobile 390×844
renders; pointer parallax; scroll descent and Chapter II reveal; mobile menu toggle;
reduced motion; no-WebGL fallback.
v2 checks: build and typecheck clean, no console errors; 1280×720, 412×915 and 360×800 renders;
pointer parallax; four scroll positions; nav pill; Tab order; menu focus and Escape; no overflow at
360px; reduced motion; no-WebGL fallback; v1 still renders at `#v1`. In SwiftShader, v2 renders at
about the same cost as v1 (75 vs 71 frames in 12s at 640×360). This is a relative measure only.
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
