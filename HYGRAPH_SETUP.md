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

---

## 4. Publish content

All entries must be **Published** (not Draft) to appear on the landing page.

---

## How it works in the app

`frontend/src/lib/hygraph.ts` queries HyGraph at build time (ISR, revalidates every hour).
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

Once you publish content in HyGraph, it will appear on the landing page within 1 hour
(or immediately on next deploy / `next build`).
