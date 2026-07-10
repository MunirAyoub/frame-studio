# Frame Studio — MIRA

A live, in-browser **3D eyewear viewer**. The aviator is modelled procedurally in
Three.js (no GLB, every curve is code), and customers can spin it, relight it, and
swap the frame color, finish, and lens tint in real time.

This is the reusable **eyewear configurator template**. "MIRA" is a stand-in brand —
for a real client, swap the wordmark, copy, and catalogue presets and re-skin.

## Stack
- **React 19 + Vite**
- **Three.js / React Three Fiber / drei** — rendering, orbit, contact shadows, IBL
- **Anime.js v4** — cinematic page-load timeline + the measurement-overlay draw-in
- Self-contained studio lighting via drei `Lightformer` (no external HDR fetch)

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Where things live
- `src/components/Glasses.jsx` — the procedural aviator. One authored teardrop outline
  drives the lens (extruded), the rim (a tube swept along the *same* outline), plus the
  brow bar, double bridge, temple arms, and nose pads. Driven entirely by props:
  `frameColor`, `metalness`, `roughness`, `lensColor`, `lensOpacity`, `lensMirror`.
- `src/App.jsx` — catalogue presets (frame colors / finishes / lens tints), the `<Canvas>`
  stage, the measurement overlay (the signature), the control panel, the page sections,
  and the Anime.js orchestration.
- `src/App.css` / `src/index.css` — design tokens + component styles.

## Design notes
- Direction is an **optician's precision instrument**: cool optical-grey page, deep ink,
  a single aviator-gold accent, Archivo Expanded display + Space Mono spec captions.
- The **measurement overlay** (lens 58 · bridge 14 · temple 140) draws itself in like a
  technical drawing, then fades the moment you take control of the frame.
- The frame sits still and front-facing for its measurement moment, then drifts into a
  slow spin. `prefers-reduced-motion` disables all of this and shows everything static.

## Swapping in a real client frame
1. Replace the outline in `lensShape()` (or load a client GLB and wire the same props).
2. Update `FRAME_COLORS` / `FINISHES` / `LENS_TINTS` to their real options.
3. Re-skin tokens in `index.css`, wordmark + copy in `App.jsx`.
4. The snapshot button and mobile layout already work — nothing else to wire.
