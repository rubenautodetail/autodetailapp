# HyGraph Setup Guide

HyGraph is used for **landing page + client-facing content only**.
Booking, payment, and user data stay in Supabase.

## 1. Add env vars to `frontend/.env.local`

```env
HYGRAPH_ENDPOINT=https://api-us-west-2.hygraph.com/v2/cmm9sqj43012z07wd2srizeqh/master
HYGRAPH_TOKEN=<your-permanent-auth-token>
```

> The endpoint is already configured. Generate a **Permanent Auth Token** in:
> HyGraph Dashboard → Project Settings → API Access → Permanent Auth Tokens

---

## 2. Enable locales

Dashboard → Project Settings → Locales → Add **Spanish (es)**
Set **English (en)** as default.

---

## 3. Create content models

### Model: `LandingHero` (single document)

| Field       | Type   | Localized | Required |
|-------------|--------|-----------|----------|
| heading     | String | ✅        | ✅       |
| subheading  | String | ✅        | ✅       |
| ctaText     | String | ✅        | ✅       |
| badgeText   | String | ✅        |          |

After creating the model, add one entry for each locale.

### Model: `Testimonial` (list)

| Field        | Type    | Localized | Required |
|--------------|---------|-----------|----------|
| authorName   | String  |           | ✅       |
| location     | String  |           | ✅       |
| rating       | Int     |           | ✅       |
| text         | String  |           | ✅       |
| vehicleType  | String  |           | ✅       |

Add 3–6 testimonials.

### Model: `VehicleBrand` (list)

This model controls the logo carousel between the homepage stats and “How It Works.”

| Field       | Type    | Required | Configuration |
|-------------|---------|----------|---------------|
| name        | String  | ✅       | Set as title field |
| slug        | String  | ✅       | Unique; lowercase (for example `toyota`) |
| logo        | Asset   | ✅       | Upload a transparent SVG, PNG, or WebP |
| sortOrder   | Int     | ✅       | Lower numbers appear first |
| isActive    | Boolean | ✅       | Default `true`; turn off to hide without deleting |

Add, publish, reorder, or deactivate entries in HyGraph to control the carousel. If the
model is not available, six local starter logos are shown. Once the model exists, an
empty active list intentionally hides the entire section.

---

## 4. Publish content

All entries must be **Published** (not Draft) to appear on the landing page.

---

## How it works in the app

`frontend/src/lib/hygraph.ts` queries HyGraph with a 60-second cache tag.
If HyGraph returns no data or an error, the landing page **falls back** to the dictionary
content in `frontend/src/dictionaries/en.json` and hardcoded testimonials — so the page
always renders correctly even before content is added.

The query lives in `getLandingContent()` and fetches:
```graphql
query LandingContent($locale: Locale!) {
    landingHeros(first: 1, locales: [$locale, en]) { ... }
    testimonials(first: 6, orderBy: createdAt_DESC) { ... }
}
```

Vehicle logos are intentionally isolated in `getVehicleBrands()`. A missing or invalid
`VehicleBrand` model therefore cannot break the hero, testimonials, or gallery queries.

Once you publish content in HyGraph, it will appear on the landing page within 60 seconds
(or immediately on next deploy / `next build`).
