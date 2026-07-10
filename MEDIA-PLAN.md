# MIRA — Higgsfield media plan

**What Higgsfield is (and isn't).** Higgsfield is an AI **image/video generation** tool —
cinematic camera moves, photoreal product/lifestyle shots. It produces *media assets*, not
code. Nothing here gets wired into the app the way Three.js does. We generate files, then
either drop them into the page as regular `<img>` / `<video>` or use them as **outreach
material**. The live 3D viewer stays the hero; Higgsfield media sets the mood around it and
carries the pitch into inboxes.

> Guardrail: don't let a slick AI hero video upstage the real thing. The viewer *is* the
> wow — the video's job is to get people to it. Keep generated media supporting, not louder
> than the interactive frame.

---

## 1. Where generated media slots into the site

| Slot | Asset | Purpose |
|---|---|---|
| Hero background (optional) | 6–10s loop, slow push-in on aviators against seamless studio grey | Ambient depth behind/beside the live viewer. Muted, `autoplay loop muted playsinline`, dimmed. |
| "On a face" strip (new section) | 3–4 stills: models wearing the aviator, editorial lookbook lighting | Answers "how does it *wear*" — the one thing the 3D viewer alone doesn't sell yet (until try-on). |
| Offer section proof | Short before/after clip: flat 2D PDP → the live viewer | Makes the ROI legible to brand founders in 5 seconds. |
| Social / OG card | One heroic still, gold frame on grey | Link previews + the outreach thumbnail. |

Keep everything in the site palette: **optical grey `#e7e8e4`, ink `#191817`, aviator gold
`#c79a4b`.** Reject anything warm-cream or neon — it fights the design.

## 2. Prompt starters (tune per model)

- **Hero loop:** *"Cinematic macro product shot, gold aviator sunglasses on a seamless
  cool-grey studio backdrop, slow dolly push-in, soft key light with a warm gold rim, shallow
  depth of field, editorial, no text, muted premium color grade."*
- **On-a-face still:** *"Editorial portrait, model wearing gold aviator sunglasses with
  green G-15 lenses, cool neutral studio, soft directional light, sharp focus on the frame,
  fashion-lookbook, minimal."*
- **Before/after:** generate the "flat PDP" beat as a plain product still, then the "alive"
  beat as the same frame with a subtle orbit — cut between them.

Generate 3–4 variants per slot, keep the one that matches the grade, downscale/compress for web
(hero loop < ~2–3 MB, `poster` frame set so it never flashes empty).

## 3. Outreach use (this is where it earns its keep)

Per the month-one plan, the closing asset is a **tailored 20–30s screen recording** of a target
brand's own frame rebuilt as the viewer. Higgsfield complements that:
- A polished **generic sizzle** (hero loop + a face shot) for the top of a cold email, *before*
  you've modelled their specific frame.
- **"On a face" stills** to imply the try-on upsell (Premium tier) without building it yet.

## 4. Do / don't
- ✅ Use it for mood, lifestyle, and the cold-open thumbnail.
- ✅ Keep generated frames visually consistent with the modelled aviator (gold, teardrop).
- ❌ Don't present generated video *as* the interactive product — the viewer must be the payoff.
- ❌ Don't ship a heavy autoplay video that delays the 3D canvas on mobile; lazy-load it.

## Status
Site + live viewer: **built**. Higgsfield assets: **not yet generated** — this is the shot
list to work from in a media session. Add a `public/media/` folder and an "On a face" section
component when the stills exist.
