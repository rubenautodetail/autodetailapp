# DTailWash — Image Generation Prompts (Programmatic Landing Pages)

Brand look to keep in EVERY image: **deep navy `#131835` + champagne gold `#D0B078`**, premium/editorial, golden-hour or moody studio light, glossy wet-paint reflections, shallow depth of field. No cheesy stock-photo vibe. 16:9 or 4:5. Leave calm negative space for text overlay where noted.

> The `ImagePlaceholder` component already embeds the per-page hero prompt in `data-ai-prompt`. Generate images, drop them in `frontend/public/landing/`, then pass `src` to the component (or wire a lookup by `service.id + city.slug`).

## 1. Hero (per service × city) — `aspect-[4/5]`
Template (the code fills {service}/{city} automatically):
> Premium cinematic photo of a professional mobile car detailer working on a luxury car in **{city}, Miami**. Deep navy + champagne-gold grade, golden-hour light, glossy wet-paint reflections, DTailWash-branded van softly blurred behind. Editorial, high-end, shallow depth of field.

Per-service variants:
- **Mobile Car Detailing** — detailer foam-washing a black SUV in a driveway, suds catching gold light.
- **Interior Detailing** — close-up of a steam tool on stitched leather seats, dashboard gleaming, warm interior glow.
- **Exterior Detailing** — clay-bar glide over a mirror-finish hood, reflection of palm trees + navy sky.
- **Ceramic Coating** — gloved hand applying ceramic with an applicator block, water beading into perfect spheres, dramatic rim light.

## 2. Before / After pair (optional gallery) — `aspect-[4/3]`
> Split-frame before/after of the same car panel — dull, swirled paint on the left; deep glossy reflection on the right. Navy studio backdrop, single gold key light.

## 3. "We come to you" lifestyle — `aspect-[16/9]`
> Wide shot of a clean DTailWash van parked outside a Miami condo / Brickell high-rise at dusk, detailer unloading equipment, warm building lights, navy sky with gold accents.

## 4. Trust / crew — `aspect-[1/1]`
> Portrait of a friendly, professional detailer in a branded polo, holding a microfiber towel, soft navy background, confident and approachable, gold-lit rim.

## 5. Neighborhood context (optional per city)
> Recognizable, tasteful landmark of {city} (e.g. Calle Ocho for Little Havana, Miracle Mile for Coral Gables, Hialeah Park) at golden hour, a detailed luxury car in the foreground. Editorial travel-magazine feel, navy/gold grade.

---
### Wiring images in
1. Save as `frontend/public/landing/{service-id}-{city-slug}.webp` (e.g. `ceramic-coating-coral-gables.webp`).
2. In `page.tsx`, pass `src={\`/landing/${service.id}-${neighborhood.slug}.webp\`}` to `ImagePlaceholder` (it already falls back to the branded placeholder if the file is missing).
3. Register the host in `next.config` only if using remote URLs (local `/public` needs no config).
