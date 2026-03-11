<project_context>
# Rubens Auto Detail Platform
Bilingual (en/es) marketplace connecting customers with mobile car detailers.
Location: `/Users/othmarcasilla/Rubens Auto detail platfomr/`

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL), Stripe Connect, Resend, HyGraph.
**Extended Docs (read ONLY when asked or strictly needed):** `ARCHITECTURE.md`, `PRODUCTION_READINESS_TASKS.md`, `.agent/WEEK1_CHECKLIST.md`.
</project_context>

<rules>
## Token Strategy & Operations
- **Identity:** Always address me as Omar.
- **Token Efficiency:** Be extremely concise. Do not explain basic Next.js/React concepts. Load external files or skills only when directly needed. Remind me to start new chats for distinct tasks to avoid context bloat.
- **Code Output:** Avoid outputting large blocks of code in chat; rely on direct file edits where possible.

## Project Constraints
- **Absolute Bilingual:** All UI components MUST take `locale?: "en" | "es"` and handle translations (e.g., `locale === "es" ? "Español" : "English"`).
- **Strict TypeScript & Pathing:** No `any`. Always use `/[lang]/page-name` for frontend routes. Backend is entirely in `frontend/src/app/api/` (no Strapi).
- **State Management:** React Context API (`BookingContext`, `ContractorContext`) only. NO Zustand or Redux.
- **Supabase Clients:** Use Server contexts: `createClient()` from `@/lib/supabase/server`. For admin operations needing RLS bypass, use `createServiceClient()` (requires `SUPABASE_SERVICE_ROLE_KEY`).
- **Dependencies:** Mapbox for addresses (`NEXT_PUBLIC_MAPBOX_TOKEN`), Stripe Connect for payments (`STRIPE_SECRET_KEY`, `PLATFORM_FEE_PERCENTAGE=15`). Tailwind CSS for styling (utility only, no modules).
- **Common Gotchas:** `booking/create` and `payments/create-intent` are rate-limited (5 req/min/IP). ZIP validation is handled via `SERVICE_ZIP_CODES` env var.
</rules>
