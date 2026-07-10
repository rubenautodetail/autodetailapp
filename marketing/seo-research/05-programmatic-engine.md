# DTailWash — Programmatic SEO Engine (built)

A data-driven engine that generates premium, bilingual, conversion + AI-answer optimized
landing pages for every **service × neighborhood × language** combination. Built to grow by
adding data rows — not by hand-coding pages.

## What shipped
| File | Role |
|---|---|
| `frontend/src/lib/seo/services.ts` | Service catalog (bilingual slugs, copy, price, includes, keywords) |
| `frontend/src/lib/seo/locations.ts` | Miami-Dade neighborhood catalog (bilingual local copy, ZIPs, landmarks) |
| `frontend/src/lib/seo/landing.ts` | Content resolver → title/meta/H1/quick-answer/intro/FAQ + hreflang + params |
| `frontend/src/lib/seo/schema.ts` | +`getCityServiceBusinessSchema`, +`getFaqSchema` (LocalBusiness/Service/FAQ/Breadcrumb) |
| `frontend/src/components/landing/programmatic/ImagePlaceholder.tsx` | Branded image slot w/ embedded gen-prompt |
| `frontend/src/app/[lang]/[service]/[city]/page.tsx` | Premium page template (9 sections) |
| `frontend/src/app/sitemap.ts` | Now enumerates all landing URLs |

## URL structure (native per language)
- EN `…/en/mobile-car-detailing/brickell`
- ES `…/es/detallado-de-autos-a-domicilio/hialeah`
- City slug is shared across locales; service slug is localized. hreflang maps EN↔ES automatically.

## Current coverage (Phase 1 + 2)
**4 services × 16 neighborhoods × 2 languages = 128 statically-generated pages.**
- Services: Mobile Detailing, Interior, Exterior, Ceramic Coating.
- Phase 1: Hialeah, Little Havana, Doral, Brickell, Miami Beach, Coral Gables, Kendall, Miami.
- Phase 2 (2026-07-09): Westchester, Sweetwater (the research's "open field" pair), Aventura, North Miami, Miami Gardens, Homestead, Cutler Bay, Pinecrest.

## Why these rank (Google + AI/GEO)
- Unique, locally-specific body copy + FAQ per page (not thin duplicates).
- **Quick-answer block** = featured-snippet / ChatGPT / Gemini citation bait.
- **FAQPage + LocalBusiness + Breadcrumb JSON-LD** on every page.
- Correct **canonical + hreflang** per combination.
- **Internal-link mesh** (other services in-city + same-service nearby cities) = crawl depth + topic authority.
- **ES pages lead with price + WhatsApp CTA** (per research finding: Spanish demand is price-first, WhatsApp-first).

## How to grow (the ongoing part)
1. **Add a neighborhood** → one object in `locations.ts` → instantly +8 pages (4 svc × 2 lang).
2. **Add a service** → one object in `services.ts` → instantly +16 pages (8 hoods × 2 lang).
3. **Enrich copy** over time in `landing.ts` (more unique paragraphs, city-specific FAQs) to strengthen thin-risk pages.
4. **Add real images** → see `IMAGE-PROMPTS.md` (drop files in `public/landing/`, pass `src`).

## Action items for Omar (off-code)
- [ ] Set `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits only) → unlocks WhatsApp CTA on ES pages.
- [ ] Set `NEXT_PUBLIC_BUSINESS_PHONE` → adds `telephone` to LocalBusiness schema.
- [ ] Confirm/adjust `priceFrom` values in `services.ts` to match real Supabase pricing.
- [ ] Create + verify **one** Google Business Profile (Service-Area Business) — biggest off-site ranking lever.
- [ ] Generate hero images (IMAGE-PROMPTS.md) so pages aren't placeholder-only before indexing.
- [ ] Note: home-page `siteName` is "Detailing on Demand" in the dictionary while the brand is **DTailWash** — align if desired.

## Verified
Rendered locally (Next 16 / Turbopack): EN + ES pages return 200, 9 sections, 5 FAQs, 3 JSON-LD blocks, 6 internal links, clean titles, correct hreflang. On-brand navy+gold LuxeDetail styling confirmed by screenshot.
