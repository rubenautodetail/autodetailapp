# DTailWash — User Intent & Search Journey Research

**Scope:** Miami-Dade County mobile car detailing marketplace. Bilingual EN/ES. Two audiences: customers booking, detailers/contractors joining.
**Method:** Aaron Marketing keyword-intent-taxonomy applied to real SERP pulls (Firecrawl keyless search, Brave web search) for 12 priority queries + reasoning on EN/ES behavioral differences. Metrics labeled **Measured** (from live SERP pull, this session) or **Estimated** (inference, no volume tool connected — DataForSEO/GSC not available in this environment).

---

## 1. Intent Classification of Core Query Space

| Intent | EN examples | ES examples | Notes |
|---|---|---|---|
| **Informational** | "car detailing vs car wash", "how long does detailing take", "how to become a mobile detailer" | "diferencia entre lavado y detallado", "cuánto dura un detallado" | TOFU; answer-first content, GEO/AI-answer friendly |
| **Navigational** | "DTailWash", "DTailWash login", "DTailWash reviews" | "DTailWash iniciar sesión" | Near-zero volume pre-launch; grows post-brand-building |
| **Commercial investigation** | "best car detailing Miami", "ceramic coating worth it", "mobile detailing vs shop detailing" | "mejor detallado de autos en Miami", "vale la pena el ceramic coating" | Heavy trust-seeking: Reddit, Quora, Facebook groups dominate SERPs (Measured) |
| **Transactional** | "mobile car detailing miami", "car detailing near me", "book car detailing Kendall" | "detallado de autos a domicilio Miami", "lavado de carro a domicilio cerca de mi" | Local-service intent; "near me"/"a domicilio"/"cerca de mi" are the strongest transactional signal words |

**Mixed-intent flag:** "ceramic coating worth it" and "paint correction before selling" read as informational on the surface but the SERP (Measured, see §3) is dominated by commercial/comparison content with embedded pricing and booking CTAs — classic commercial-investigation-disguised-as-question. Build accordingly (educate, then price, then book), not a pure blog post.

---

## 2. Funnel Mapping (TOFU → MOFU → BOFU)

| Stage | What searcher wants | Signal queries (EN/ES) | Content/CTA that serves it |
|---|---|---|---|
| **TOFU — Awareness** | Understand what detailing is / whether it's needed | "car detailing vs car wash", "diferencia lavado y detallado", "what does a full detail include" | Blog/FAQ explainer; soft CTA → service page, no hard sell |
| **TOFU/MOFU — Problem-aware** | Solve a specific issue (odor, pet hair, stains, dull paint) | "pet hair removal car", "eliminar olor a mascota del carro", "restore faded headlights" | Problem-specific landing page → add-on service; CTA "See pricing" |
| **MOFU — Consideration** | Evaluate options, prices, whether premium services are worth it | "ceramic coating worth it", "vale la pena el ceramic coating", "paint correction before selling car" | Comparison/education page with transparent pricing table; CTA "Get instant quote" |
| **MOFU — Local evaluation** | Compare local providers, check trust signals | "best car detailing Miami", "mejor detallado de autos Miami", Reddit/Yelp-style browsing | Neighborhood landing page with reviews, before/after photos, contractor vetting badge; CTA "Book now" |
| **BOFU — Decision** | Ready to book now, at their location | "mobile car detailing miami", "car detailing near me", "detallado a domicilio cerca de mi" | City/service page, instant ZIP check, price + time estimate; CTA "Book in 60 seconds" |
| **Retention/Navigational** | Manage existing booking, rebook | "DTailWash my bookings", "reprogramar cita" | Account/dashboard; CTA "Rebook" / "Manage booking" |
| **Contractor funnel** | Understand opportunity, apply | "how to become a mobile car detailer", "start mobile detailing business", "cómo ser detallador independiente" | Contractor recruitment page: earnings model, requirements, zero-startup-cost angle; CTA "Apply now" |

---

## 3. SERP-Intent Analysis (12 priority queries, Measured from live pulls)

| # | Query | Language | Observed dominant SERP | Winning format | Intent |
|---|---|---|---|---|---|
| 1 | mobile car detailing miami | EN | Individual local business sites (miamimobilecardetailers.com, unickautodetailing.com, shinekingcardetailing.com), one directory-style aggregator (Panda Hub), Yelp, one Instagram profile | **Local service/booking page** with pricing + service area | Transactional |
| 2 | best car detailing Miami | EN | Reddit recommendation thread (r/Miami), Yelp Top 10, Panda Hub aggregator, several individual sites, one YouTube | **Neighborhood/city page w/ social proof** + Reddit-style trust cues (reviews, before/after) | Commercial (local) |
| 3 | car detailing near me | EN | Generic, not geo-locked in this pull — Yelp directories, national chains, individual sites across multiple cities. Confirms "near me" needs strong local signals (GBP, schema, city pages) to rank locally | **GBP-optimized local landing page** | Transactional |
| 4 | ceramic coating worth it | EN | **Overwhelmingly forums/UGC**: Reddit (r/Detailing), Facebook groups, Quora, YouTube, plus a few detailer blogs (FEYNLAB, mmautodetailing) — almost no plain "informational" content wins without an opinionated, evidence-based answer | **Long-form "honest answer" page** with pros/cons, real photos, pricing, embedded CTA | Commercial investigation (mixed w/ informational) |
| 5 | car detailing vs car wash difference | EN | Pure blog/explainer + Reddit/Quora Q&A (Elite Window Tint, Take 5, Lords of Detailing) | **Explainer/FAQ article**, TOFU, funnels to service page | Informational |
| 6 | how to become a mobile car detailer | EN | Reddit success-story thread, YouTube "start with $500/$600" videos, detailer-supply-company blogs (Fortador, Chemical Guys, DetailersA) — zero marketplace/gig-platform results | **Contractor recruitment/opportunity page** — gap: no competitor is capturing this as a "join our platform" CTA; mostly generic "start your own business" content | Informational → Contractor-transactional |
| 7 | interior car detailing cost | EN | Price-guide blogs (Housecall Pro, Chemical Guys) + Reddit pricing threads + individual shop pricing pages, wide range $50–$350 cited | **Transparent pricing page** with ranges by vehicle size | Commercial/informational (price-check) |
| 8 | paint correction before selling car worth it | EN | Detailer-shop blogs w/ ROI framing (Apex Autoworks, Gilroy Blackout, AZ Detailers) + one Reddit thread (r/carmax) | **"Sell your car" ROI landing page** — clear resale-value gap vs. current site (no such page exists) | Commercial investigation |
| 9 | cuanto cuesta detallado de autos | ES | **Social-first**: TikTok, Instagram Reels, Facebook posts/groups dominate over blogs; only 2 formal blog/price-guide pages (Waxman of Tristate, Dtailer.mx) surfaced; Reddit thread was in Spanish-translated English subreddit | **Bilingual pricing page + short-form video/social proof**, NOT a text-heavy blog | Commercial/informational |
| 10 | servicio de lavado de autos a domicilio Miami | ES | **Even more social-dominant**: TikTok, Instagram, Facebook groups (Kendall community group), individual providers advertise via social + phone/text, not websites; only 2 real business sites (Jimenez Car Wash, Acosta Mobile Detailing) and 1 directory (Yelp) | **Local landing page with WhatsApp/text CTA and Instagram/TikTok proof embeds** — text-to-book, not just a form | Transactional (local) |
| 11 | detailing antes de vender mi carro (ES) | ES | Mix of Reddit (translated), Instagram Reel, one dedicated blog (Maxiautos.co), and generic "how to sell your car safely" finance-site content (State Farm, Credit Karma en español) — no dedicated Miami detailer captures this | **Spanish "prep to sell" landing page** — open gap, low competition | Commercial investigation |
| 12 | pet hair removal car detailing | EN | (Search infrastructure error on this pull; treat as **Estimated** from pattern of other add-on queries) — typically ranks blog "how-to DIY" content + shop add-on service pages | **Add-on service page** ("Pet Hair & Odor Removal") bridging DIY-tip content to booking | Informational → Transactional (mixed) |

**Cross-cutting SERP finding (Measured):** For Spanish-language local-service queries (#9, #10), the ranking pattern is structurally different from English — social media posts (TikTok/Instagram/Facebook) and informal community groups out-rank or sit alongside formal business websites far more than in the English SERPs. This has direct content-format implications (see §5).

---

## 4. Buyer Personas & Search Journeys

### Persona 1 — "Busy Brickell Professional" (EN, high-income, time-poor)
- **Search phrases:** "mobile car detailing near me", "car detailing that comes to my office", "best car detailing Brickell"
- **Motivation:** No time to visit a shop; wants convenience + premium result for a nice car.
- **Objections:** Trust (letting a stranger work on/around an expensive car), scheduling around work.
- **Moment they book:** After seeing clear pricing + verified/insured contractor badge + ability to book to office address during work hours (lunch slot).
- **Page they land on:** City/neighborhood page or Google Business Profile → booking flow.

### Persona 2 — "Spanish-Speaking Family, Hialeah" (ES-primary, price-sensitive, trust-via-community)
- **Search phrases:** "detallado de autos a domicilio Hialeah", "cuanto cuesta lavado de carro a domicilio", "cerca de mi lavado de auto barato"
- **Motivation:** Value for family budget, multiple vehicles, prefers word-of-mouth/community-group recommendations over anonymous review sites.
- **Objections:** Price transparency (fear of upsell), whether provider speaks Spanish, trust without a shop location to visit.
- **Moment they book:** After seeing a Spanish-language page, a WhatsApp/text option, and a price that matches what's discussed in Facebook community groups.
- **Page they land on (per SERP evidence, #10):** Needs a landing page reachable from social content, not just organic text search — SEO alone underserves this persona; pair with local FB-group/WhatsApp presence.

### Persona 3 — "Car Enthusiast" (EN, detail-oriented, higher AOV)
- **Search phrases:** "ceramic coating worth it", "paint correction Miami", "swirl marks removal cost"
- **Motivation:** Protect/enhance a vehicle they care about; wants technical credibility, not just convenience.
- **Objections:** Skepticism from having read forum debates (Reddit r/Detailing) about whether coatings are "hype"; wants proof (before/after, product brand, technician certification).
- **Moment they book:** After an "honest, evidence-based" content page (mirrors the winning SERP format in #4) addressing the worth-it debate directly, with real before/after photos and warranty/guarantee language.
- **Page they land on:** Comparison/education page (ceramic coating vs wax vs sealant) → premium service booking.

### Persona 4 — "Selling the Car" (EN/ES, transactional urgency, one-time buyer)
- **Search phrases:** "detailing before selling my car", "paint correction before selling car worth it", "detailing antes de vender mi carro"
- **Motivation:** Maximize resale/trade-in value or Carvana/CarMax offer; one-time need, price-vs-ROI focused.
- **Objections:** Whether the spend actually pays back; timeline (needs it fast, has a sale date).
- **Moment they book:** After seeing an ROI framing ("$X spent → $Y+ in resale value") — exactly the angle winning SERP #8 and the open gap in #11.
- **Page they land on:** Dedicated "Prep your car to sell" landing page (currently doesn't exist on competitor sites in Miami — a genuine content gap).

### Persona 5 — Contractor "Independent Detailer Ready to Scale" (EN/ES)
- **Search phrases:** "how to become a mobile car detailer", "start mobile detailing business", "cómo empezar un negocio de detallado de autos", "join car detailing platform"
- **Motivation:** Already has some skill/equipment, wants more consistent bookings without building their own marketing/website.
- **Objections:** Platform fee (30%) fairness, payment reliability, lead quality vs. going fully independent.
- **Moment they apply:** After seeing clear earnings potential, low/no startup cost messaging, and fast approval — SERP #6 shows zero competitors framing this as a "join a marketplace" pitch, which is a wide-open recruitment-content gap.
- **Page they land on:** Contractor recruitment/apply page.

---

## 5. English vs. Spanish Intent Differences

| Dimension | English searchers | Spanish searchers | Evidence |
|---|---|---|---|
| **Phrasing** | "near me", "best X", "worth it" | "a domicilio", "cerca de mi", "cuánto cuesta", "vale la pena" — direct price-first phrasing more common | Measured, queries #9/#10 vs #1/#4 |
| **Where they actually search/discover** | Google organic + Yelp/GBP is primary discovery | Google organic competes directly with **TikTok, Instagram Reels, and Facebook community groups** as discovery channels — SERPs literally contain social posts ranking above business websites | Measured — SERP composition for #9, #10 markedly more social-native than #1, #2 |
| **Trust signals** | Star ratings, review count (Yelp), "certified/insured" badges | Personal referral / community-group recommendation, direct phone/text contact with a named person, visible social proof (Reels/TikTok of real jobs) over star ratings | Estimated (behavioral pattern), supported by Measured SERP composition |
| **Price sensitivity / framing** | Price mentioned but secondary to convenience/quality framing | Price is often the *first* question asked ("cuánto cuesta") — pricing needs to be visible immediately, ideally before any other content | Measured — "cuánto cuesta" is a top-line query pattern with no soft framing |
| **Contact preference** | Comfortable with online forms / self-serve booking flow | Strong preference signals for WhatsApp/text/call — informal ES-market provider listings in SERPs (#10) show phone/text as the primary CTA, not a booking form | Measured (SERP listings show "Envíame un mensaje de texto", "Llama ahora") |
| **Device/behavior** | Mix of desktop research + mobile booking | Skews more mobile-first, more likely to discover via a social app then jump straight to contact rather than compare multiple sites | Estimated, consistent with Miami-Dade Hispanic mobile usage patterns and social-heavy SERP finding |

**Implication:** The Spanish site cannot just be a literal translation of the English service pages. It needs price visible above the fold, a WhatsApp/text-first CTA (not just a form), and ideally a presence in the social channels where ES-speaking demand actually lives (Instagram/TikTok/FB groups) since organic SEO alone under-serves this segment relative to English.

---

## 6. Intent → Page-Type Map

| Intent cluster | Example queries | Page to build | Primary CTA |
|---|---|---|---|
| Local transactional (EN) | "mobile car detailing miami", "car detailing near me" | City page `/en/miami` + GBP optimization | "Book now" / instant quote |
| Local transactional (ES) | "detallado de autos a domicilio Miami", "lavado a domicilio cerca de mi" | City page `/es/miami` with price-first layout, WhatsApp/text CTA | "Escríbenos por WhatsApp" / "Reserva ahora" |
| Neighborhood/local commercial | "best car detailing Brickell/Kendall/Hialeah" | Neighborhood landing pages (one per priority ZIP cluster) with reviews + before/after | "See detailers near you" |
| Informational TOFU | "car detailing vs car wash", "diferencia lavado y detallado" | Blog/FAQ explainer, internal-linked to service page | "See what's included" |
| Commercial investigation — premium services | "ceramic coating worth it", "paint correction worth it" | Service-education page (ceramic coating, paint correction) with pros/cons + pricing table | "Get a quote for ceramic coating" |
| Commercial investigation — resale | "detailing before selling my car", "paint correction before selling" | Dedicated "Prep to Sell" landing page (EN + ES) | "Get your pre-sale detail quote" |
| Add-on/problem-specific | "pet hair removal", "headlight restoration cost", "car odor removal" | Add-on service pages under main service hub | "Add to my booking" |
| Pricing/price-check | "interior car detailing cost", "cuanto cuesta detallado" | Transparent pricing page (by vehicle size/package), bilingual | "Get instant price" |
| Contractor recruitment | "how to become a mobile detailer", "cómo ser detallador independiente" | `/contractors` recruitment page — earnings model, requirements, apply flow | "Apply now" |
| Navigational/retention | "DTailWash login", "mi cita", "reprogramar" | Account/dashboard, booking management | "Manage my booking" |
| Comparison | "mobile detailing vs shop detailing", "DTailWash vs [competitor]" | Comparison page (once competitive positioning is set) | "Book the mobile option" |

---

## Key Gaps vs. Current Site (flag for content roadmap)
1. No "Prep your car to sell" / resale-ROI page in EN or ES — open competitive gap (SERP #8, #11).
2. No contractor recruitment content framed as "join a marketplace" — every competing result for that query space is generic solo-business-startup content (SERP #6).
3. Spanish content strategy needs to be price-first + WhatsApp/text-CTA-first, not a mirror translation of English pages — current bilingual pattern (per CLAUDE.md `locale === "es"` ternaries) should be audited for whether ES pages surface price and contact method differently, not just translated copy.
4. "Worth it" commercial-investigation queries (ceramic coating, paint correction) need opinionated, evidence-based long-form pages with photos — not thin service-description paragraphs.
