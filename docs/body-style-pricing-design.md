# Body-Style Pricing Design

Status: APPROVED — structured review complete

## Understanding Lock

- Customers choose a vehicle body style from an illustrated, responsive selector when adding a vehicle.
- Canonical styles are sedan, coupe, SUV, large SUV, pickup, minivan, van, and other.
- Each service may define an exact price for any body style; missing entries fall back to the service base price.
- Add-on prices remain unchanged regardless of body style.
- Supabase is the pricing authority. The browser displays quotes but never supplies an authoritative amount.
- Admins edit the body-style price matrix from the existing bilingual services page.
- Stripe PaymentIntents continue using a server-derived amount and gain service/body-style metadata.

Assumptions: existing vehicles with missing or legacy types fall back to `other`; every booking vehicle has one body style before payment; existing base prices remain valid without override rows.

## Initial Design

Create one shared vehicle domain module and one reusable illustrated selector. Each option is a real radio input wrapped in a 44px-or-larger card with an original monochrome SVG silhouette, bilingual label and short definition, visible focus state, selected checkmark, subtle 150–250ms motion, and a reduced-motion fallback. Decorative SVGs are hidden from assistive technology; labels, checks, focus, and live text communicate state without relying on color. A bilingual “Not sure?” hint explains SUV/large-SUV and van/minivan distinctions. The add-vehicle experience asks for body style first, then shows make/model/year/color fields, keeping the modal scannable on mobile. Both garage routes consume the same form component so their behavior cannot drift. Legacy or unknown vehicles must confirm a body style when next used.

Add `service_body_style_prices` with `(service_id, body_style)` uniqueness, an integer `price_cents`, currency, timestamps, and the current Stripe Price ID. The table has a service FK, canonical-style check, positive-price check, lookup index, and RLS that denies browser writes. A shared server pricing function loads the active service, all requested overrides, and all add-ons in bounded batch queries; it parses legacy decimal base prices to cents without floating-point arithmetic. It returns per-vehicle line items, totals, and a deterministic pricing revision derived from authoritative IDs, prices, and timestamps. Both quote calculation and payment creation call this function without stale caching. Payment recomputes everything, uses submitted totals only to detect a stale UI, and charges only its verified result. A mismatched revision returns 409 with a refreshed quote.

Service selection always displays the active vehicle/body-style context and updates the visible service price immediately. Multi-vehicle bookings show a compact per-vehicle breakdown before continuing. A stale-price response preserves every selection, compares the previous and refreshed totals, explains the change in the active language, and requires explicit confirmation before continuing. Live regions announce quote updates and errors; invalid fields receive focus.

The admin service editor gets an expandable price matrix. Blank cells explicitly mean “inherit base price” and inherited cells display the effective price. Every mutation verifies the admin role before creating a service-role client and uses an `updated_at` precondition to reject stale editors. Each override creates an immutable Stripe Price on the service Product with `body_style`, currency, and a retry-safe operation ID in metadata; the resulting Price ID is persisted with the override. Stripe creation uses a deterministic idempotency key and retries first search for the operation ID to recover a Price created before a failed database write. Database writes occur only after Stripe succeeds, no-op saves create nothing, and the UI reports sync or archival failures. Replaced Stripe Prices are archived best-effort after the database update. The base price remains the Product default.

The matrix is a horizontally scrollable desktop table with sticky service/style context and a stacked mobile editor rather than eight cramped inputs. Each cell has an explicit “Use base price” control, localized currency formatting, inline validation, unsaved-change protection, and stateful feedback: saving, saved, failed-before-save, or saved-with-Stripe-archive-warning. Failed edits remain in place with a focused retry action.

Legacy values map deterministically: `truck` to `pickup`; `sedan`, `coupe`, `suv`, `van`, and `other` remain equivalent; null or unknown values become `other`. Existing SUV and van records are not guessed into large-SUV or minivan categories. New and edited vehicles require an explicit selection. Category descriptions reduce ambiguity, but truthful customer classification remains a documented business assumption until a VIN-backed classifier is separately authorized.

## Decision Log

| Decision | Alternatives | Objection | Resolution |
|---|---|---|---|
| Exact per-service overrides with base fallback | Global multipliers; full mandatory matrix | Full matrix creates admin burden; multipliers reduce control | Hybrid override table preserves control and backward compatibility |
| Add-ons stay flat | Body-style add-on adjustments | Adds complexity outside current scope | Locked by Omar |
| Supabase is pricing authority | Browser totals; Stripe Price IDs as transactional authority | Browser is tamperable; PaymentIntents do not consume Price IDs | One shared server resolver verifies quote and charge; Stripe stores synchronized catalog Prices |
| Shared vehicle form and type module | Patch two existing pages separately | Duplicate pages already drifted | Consolidate behavior before pricing |
| Inline original SVG silhouettes | Remote images; emoji; brand-specific assets | Remote assets add latency/licensing risk | Lightweight accessible illustrations match current visual system |
| Stable service IDs in payment flow | Existing service-name lookup | Renames break in-flight bookings | Send and validate service ID; temporarily retain name fallback |
| Integer cents for overrides and calculations | Floating-point dollars | Rounding can diverge from Stripe cents | Store overrides in cents and parse legacy decimal strings exactly at one server boundary |
| Stripe Price per explicit variant | Database-only variants | Would not satisfy automatic Stripe synchronization | Create labeled immutable Prices and persist IDs; PaymentIntent remains amount-based |
| Current add-on frequency preserved | Once per appointment | Changing semantics would alter existing pricing | Add-ons remain unchanged and are charged once per selected vehicle |
| Revision-based stale quote detection | Trust submitted total; silently charge new price | Prices can change between quote and payment | Recompute authoritative lines and return 409 when the revision changed |
| Privacy-safe Stripe metadata | Full vehicle/customer details | Metadata is visible operationally and has limits | Send only internal service ID, body-style summary, vehicle count, and pricing revision |
| Immediate customer price disclosure | Reveal at review/payment | Late price changes damage trust | Show selected style, updated service price, and per-vehicle breakdown before continue |
| Explicit stale-price recovery | Generic 409 toast/retry | Users can lose work or accept changes unknowingly | Preserve state, compare totals, explain, and require confirmation |
| Responsive admin matrix | Eight equal mobile columns | Dense inputs cause mistakes | Sticky desktop table plus stacked mobile editing and explicit inheritance |

## Review Record

### Skeptic / Challenger

- Accepted: Stripe variant synchronization, cents contract, deterministic legacy mapping, quote-race behavior, explicit inherited pricing, current multi-vehicle add-on semantics, idempotent sync, and admin failure feedback.
- Partially accepted: customer classification can be gamed; clearer definitions and persisted selection reduce ambiguity, but automated classification is outside the locked scope.
- Rejected as YAGNI: full price audit history and reconciliation worker for the first release. Existing admin authorization plus stored Stripe IDs and visible sync errors are sufficient for a reversible rollout.

### Constraint Guardian

- Accepted: explicit RLS/admin boundaries, quote revisions, recoverable Stripe retries, exact cents conversion, database invariants, optimistic concurrency, batch queries, no-op detection, archival error visibility, and privacy-safe metadata.
- Approved strengths: shared modules, SVG illustrations, cents-based overrides, immutable booking snapshots, and server-authoritative totals.

### User Advocate

- Accepted: immediate and per-vehicle price disclosure, explicit stale-quote recovery, truthful admin sync states, legacy confirmation, bilingual category help, responsive matrix controls, expanded accessibility, and complete localization of messages and currency.
- Conditional approval satisfied by the revisions above.

## Objection Traceability

| Review objection | Resolution location |
|---|---|
| Stripe variant synchronization and partial failures | Initial Design, admin paragraphs; Decision Log: Stripe Price per explicit variant |
| Money rounding and database invariants | Initial Design, pricing paragraph; Decision Log: Integer cents |
| Legacy mapping and category ambiguity | Initial Design, vehicle and legacy paragraphs |
| Quote/charge race and price transparency | Initial Design, pricing and service-selection paragraphs; Decision Log: stale quote and disclosure |
| Authorization, RLS, concurrency, batching, privacy | Initial Design, pricing/admin paragraphs; Decision Log: privacy-safe metadata |
| Admin matrix density and save truthfulness | Initial Design, admin matrix paragraph; Decision Log: responsive matrix |
| Accessibility and localization | Initial Design, vehicle/service/admin paragraphs; Exit Criteria |

## Exit Criteria

- Migration applies cleanly and rolls back by dropping only the new pricing table/columns; existing service base prices and bookings remain usable with zero override rows.
- New and edited vehicles accept only the eight canonical styles; legacy `truck` maps to `pickup`, known values remain stable, and unknown values require confirmation before booking.
- Both garage routes render the same bilingual illustrated selector at 375, 768, 1024, and 1440px without horizontal page overflow.
- Selector cards are keyboard-operable radios with visible focus, 44px targets, non-color selected state, hidden decorative SVGs, live announcements, error focus, verified contrast, and reduced-motion behavior.
- Quote calculation and payment creation use the same server resolver, batch their reads, calculate in integer cents, leave add-ons unchanged per vehicle, and never charge a client-supplied total.
- Customers see the selected style, immediate service price, and per-vehicle breakdown; a changed pricing revision produces a localized comparison/confirmation flow without losing selections.
- Admins can set, inherit, update, and remove each override; stale edits are rejected; save/sync/warning/error states are localized and preserve unsaved input.
- Each explicit override has a labeled Stripe Price ID stored in Supabase; retrying a partial failure does not create a second active price for the same operation; PaymentIntent metadata contains only internal IDs, style summary, vehicle count, and revision.
- Targeted unit/API tests cover cents parsing, fallback/override resolution, mixed multi-vehicle totals, unchanged add-ons, authorization, stale revisions, Stripe failure/retry, legacy mapping, and bilingual labels.
- TypeScript checks, focused tests, and production build pass; screenshots verify customer modal, service selection, and admin matrix on desktop and mobile.

Accepted residual risks: customers self-classify body style until a separately authorized VIN classifier exists. Deferred first-release work: full historical price audit and background Stripe reconciliation; stored Stripe IDs, retry-safe operations, and visible sync warnings provide the initial recovery path.

### Arbiter

- APPROVED: the Understanding Lock is consistent, objections are traceable, exit criteria are measurable, and residual risks/deferred work are bounded.
- Unresolved blocking objections: none.
