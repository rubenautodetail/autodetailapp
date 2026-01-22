# Backend & CMS Guidelines
**Philosophy:** API-First, Scalable, & Strictly Headless.

## 1. Tech Stack
*   **CMS Core:** **Strapi v5** (Latest Stable).
*   **Database:** Supabase (PostgreSQL).
*   **Storage:** AWS S3 or Supabase Storage (via Strapi Provider).

## 2. Strapi v5 Architecture
We use Strapi **only** as a Data API. It does not render pages.

### A. Document Service API (New in v5)
Use the new Document Service for complex business logic (like booking assignment).
*   *Draft & Publish:* Enabled for all content.
*   *Document IDs:* Use `documentId` instead of `id` for stable references across environments.

### B. Custom Controller Logic
Standard CRUD is handled by Strapi. Custom logic (Commission Calculation) lives in specific controllers.

```javascript
// src/api/booking/controllers/custom-booking.js
module.exports = {
  async calculatePrice(ctx) {
    const { serviceId, addOns, zipCode } = ctx.request.body;
    // ... logic to verify zone and sum prices ...
    return { total: 150.00, breakdown: { ... } };
  }
}
```

### C. Automated Translation Strategy (Critical)
To avoid manual double-entry (English + Spanish), we will use:
1.  **Plugin:** `strapi-plugin-translate` (Community Standard).
2.  **Provider:** DeepL API (Free Tier: 500k chars/month) for higher quality Spanish than Google.
3.  **Workflow:** Admin types English content -> Clicks "Translate to Spanish" -> Review Draft -> Publish.

## 3. Hosting & Limits Strategy
### Strapi Cloud (Free Tier)
*   **Limit:** 2,500 API requests/month.
*   **Strategy:** strictly for *Development/Admin* use.
*   **Production:** The Next.js frontend will **Cache** content (SSG/ISR) so we don't hit Strapi for every site visitor. We only hit Strapi when content changes (Revalidation). This keeps us comfortably within the free tier.

## 4. Database Schema (Supabase)
Strapi manages the schema, but we ensure optimal indexing via Supabase directly if needed.

### Core Collections
1.  **Contractors:**
    *   `performance_tier` (Enum: elite, standard)
    *   `geo_zone` (JSON: Polygon or Radius center)
2.  **Bookings:**
    *   `status` (Enum: pending, confirmed, started, completed)
    *   `payment_intent_id` (Stripe ID)
3.  **Reviews:**
    *   `photos` (Media Relation - Mandatory for 'After' shots)

## 4. API Security
*   **JWT Only:** No public write access.
*   **Role Based Access Control (RBAC):**
    *   `Public`: Can read `Services` and `Zones`.
    *   `Authenticated (Customer)`: Can create `Bookings`, read own `History`.
    *   `Contractor`: Can read `AssignedBookings`, update `JobStatus`.
