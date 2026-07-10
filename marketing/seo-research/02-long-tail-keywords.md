# DTailWash — Long-Tail, Question & Programmatic Keyword Research

**Scope:** Mobile car detailing marketplace, Miami-Dade County only. Bilingual EN/ES (Miami-Dade ~68% Hispanic — Spanish treated as first-class, not an afterthought). Two audiences: customers booking + detailers/contractors joining.
**Method:** [keyword-research SKILL.md](../../.claude/skills/aaron-marketing/seo-geo/research/keyword-research/SKILL.md), emphasis on Phase 3 (Variations/long-tail) and Phase 6 (GEO-check).
**Data source:** No `~~SEO tool` (DataForSEO/Ahrefs/Semrush) connected in this environment — checked via ToolSearch, none found. All keyword *phrases* below are **Signal: Google Autocomplete (unofficial endpoint)**, harvested live this session across 21 seed queries (12 EN core + 3 EN `--expand` a→z sweeps + 12 ES core + 2 ES `--expand` sweeps + 7 contractor seeds), yielding 871 unique EN and 354 unique ES raw suggestions (859/348 after stripping off-market geo noise like "…south africa", "…mexico", "…zapopan"). Search **volume is N/A everywhere** — never invented. Where a relative-demand judgment is made (e.g., "higher-signal than X"), it is labeled **Estimated** and reasoned from autocomplete depth (how many independent seeds/letters surfaced the phrase) and pattern frequency, not a real number.

---

## 1. Executive Summary

- Google Autocomplete confirms the transactional local pattern is EN **"near me"** (73 raw hits across the corpus) and ES **"a domicilio"** (18 hits) / **"cerca de mi"** (14 hits) — these three modifiers should anchor every local landing page's H1/meta, not just "mobile car detailing."
- **"mobile detailing"** is by far the deepest EN long-tail vein (272 unique suggestions from one `--expand` sweep) spanning consumer intent (near me, cost, packages) AND supply-side intent (business cards, insurance, van setup, business plan) — confirms this platform serves two very different searcher populations under the same head term.
- Real question-phrase demand exists for **"is ceramic coating worth it"** (9 variants incl. "…reddit", "…for cars", "…on a black/white car") and **"how much does car detailing cost"** (8 variants) — both are GEO/AI-answer gold: concise, factual, no local disambiguation needed to start.
- Spanish autocomplete returned **zero Miami-Dade neighborhood combinations** (confirmed — checked all 20 neighborhoods against 354 ES suggestions). This is not a demand signal against Spanish local search; it means generic Spanish autocomplete defaults to LatAm/global results (Zapopan, Guadalajara, CDMX, Panama appeared instead). The ES neighborhood matrix in §4 is therefore **Estimated/pattern-constructed**, not autocomplete-observed — flagged accordingly.
- Vehicle-type long-tail is real but thin: `ceramic coating cost suv`, `ceramic coating truck`, `mobile detailing truck bed setup`, `ceramic coating for rv`, `ceramic coating for boats` all surfaced — enough to justify vehicle-type FAQ sections, not enough (yet, no volume data) to justify standalone vehicle-type landing pages.
- Contractor-recruitment long-tail splits cleanly into **"how much do mobile detailers make"** (earnings-curiosity, informational) vs. **"how to get car detailing clients"** (already-in-business, retention-risk — a switching signal DTailWash should target hard since no competitor site owns it).
- The [service] × [neighborhood] × [language] programmatic matrix (13 services × 20 neighborhoods × 2 languages) computes to **520 unique keyword targets**; recommend phasing to ~80 pages first (see §4) rather than publishing all 520 to avoid thin-content risk per the topic-cluster anti-pattern list.
- Top 3 EN quick wins: `is ceramic coating worth it` (FAQ/blog), `mobile car detailing near me` + city-page variants, `is it worth detailing car before selling`. Top 3 ES quick wins: `detallado de autos a domicilio` + neighborhood variants, `cuanto cuesta el detallado automotriz`, `limpieza de interiores de autos cerca de mi`.

---

## 2. Question Keywords (Informational — GEO/FAQ priority)

All confirmed via live Autocomplete. Every row is GEO-friendly (concise, factual, structurable as a direct-answer block) unless noted.

### 2.1 English

| Question keyword | Intent | Funnel | GEO fit | Content format |
|---|---|---|---|---|
| is ceramic coating worth it | Commercial investigation (info-disguised) | MOFU | High — direct-answer + pros/cons list | "Is Ceramic Coating Worth It in Miami?" — verdict-first blog |
| is ceramic coating worth it for cars | Commercial investigation | MOFU | High | Same page, H2 subsection |
| is ceramic coating worth it on a black car / white car | Informational (niche) | TOFU/MOFU | High — great FAQ schema candidate | FAQ block on ceramic coating service page |
| ceramic coating how long does it last / lasts how long | Informational | TOFU | High — single-fact answer | FAQ schema |
| ceramic coating how much does it cost | Commercial | MOFU | High | Pricing table + direct-answer paragraph |
| how much does car detailing cost | Commercial | MOFU | High | Pricing guide, Miami-specific ranges |
| how much does car detailing cost near me | Commercial (local) | MOFU/BOFU | Med — needs geo-disambiguation | Pricing page with ZIP-based estimate tool |
| how much does car detailing cost inside / interior | Commercial | MOFU | High | Interior-only pricing FAQ |
| how much should car detailing cost | Commercial | MOFU | High | Same pricing guide, alt phrasing to target |
| how often should you detail your car / detail your car interior | Informational | TOFU | High — classic AI-answer format | "How Often Should You Detail Your Car?" explainer |
| how often should you wash your car / wax your car | Informational | TOFU | High | Same explainer, subsections |
| is it worth detailing car before selling | Commercial investigation | MOFU | High — resale-ROI framing | "Detailing Before You Sell: Worth It?" landing/blog hybrid |
| mobile detailing how to start | Informational (contractor-side) | TOFU | High | Contractor recruitment blog |
| ceramic coating how to / how to apply | Informational (DIY-curious, low-convert) | TOFU | Med — use to bridge to "or book a pro" CTA | Short explainer, soft CTA |
| car detailing what is it / ceramic coating what is it | Informational (definition) | TOFU | High — definition boxes are GEO gold | Glossary/definition page or FAQ entry |

### 2.2 Spanish (first-class, not translated afterthought)

| Question keyword (ES) | Intent | Funnel | GEO fit | Content format |
|---|---|---|---|---|
| cuanto cuesta el detallado automotriz | Commercial | MOFU | High | Bilingual pricing page, ES-primary section |
| cuanto cuesta un lavado detallado de auto | Commercial | MOFU | High | Same pricing page |
| detallado de interiores de autos precio / limpieza de interiores de autos precio | Commercial | MOFU | High | Interior-detail ES pricing FAQ |
| que es un detallado de autos / detallado de autos que es | Informational (definition) | TOFU | High — definition box | ES glossary/FAQ entry |
| limpieza de interiores de autos cerca de mi | Transactional (local) | BOFU | Med — needs geo | ES local landing page |
| restauracion de faros antes y despues | Informational (visual proof-seeking) | TOFU/MOFU | Med — pairs well with before/after imagery, less with pure text GEO | Before/after gallery page |
| cuanto cuesta un curso de detallado automotriz | Informational (contractor-side — training curiosity) | TOFU | High | Contractor-recruitment ES FAQ ("no course needed, we train you") |

**Note on ES coverage:** raw autocomplete depth for ES (354) is roughly 40% of EN (871) for the same seed effort — consistent with the smaller absolute autocomplete index for Spanish, not with lower real demand in a 68%-Hispanic county. Treat the ES list as directionally under-sampled; supplement with Perplexity/Brave "people also ask"-style pulls in a follow-up pass, and do not conclude ES demand is lower than EN from volume of suggestions alone.

---

## 3. Service + Modifier Long-Tail (Commercial/Transactional)

### 3.1 English

| Long-tail keyword | Modifier type | Intent | Funnel | Notes |
|---|---|---|---|---|
| mobile car detailing near me | Local/urgency | Transactional | BOFU | Highest-frequency modifier in corpus (73 "near me" hits total) |
| mobile detailing near me | Local | Transactional | BOFU | — |
| car detailing near me prices | Local + price | Transactional | BOFU | Combine local + price intent on one page |
| best mobile detailing | Best-of | Commercial | MOFU | 11 "best" variants found — needs trust/review content to win |
| mobile detailing cost / mobile detailing prices | Price | Commercial | MOFU | Pair with transparent pricing table |
| mobile detailing packages | Packaging | Commercial | MOFU | Justifies a "Packages" comparison table (Basic/Full/Ceramic) |
| car detailing before selling / car cleaning before selling | Life-event | Commercial | MOFU | ROI/resale-value framing — confirmed real, low current competitor ownership (see 03-user-intent.md §3, query #8) |
| ceramic coating cost suv / ceramic coating truck cost | Vehicle-type + price | Commercial | MOFU | Vehicle-size pricing tiers, FAQ-level not page-level (thin volume signal) |
| mobile detailing truck / mobile detailing van / mobile detailing van setup | Vehicle-type (ambiguous: consumer "detail my truck" vs. contractor "build my van") | Mixed | Mixed | Disambiguate by page: consumer page = "we detail trucks/SUVs"; contractor page = van rig ideas as a recruiting hook |
| pet hair removal car / pet hair removal car near me / pet hair removal car interior | Problem-specific add-on | Commercial | MOFU/BOFU | Standalone add-on service page — real, repeated pattern (10 hits) |
| car detailing odor removal / car detailing odor removal near me | Problem-specific add-on | Commercial | MOFU/BOFU | Pair with pet-hair page or separate "Odor & Stain Removal" add-on |
| ceramic coating for rv / ceramic coating for boats | Niche vehicle | Commercial | MOFU | Low-frequency but zero-competition; matches brief's boat/RV service line |
| car detailing at home service / car detailing home service | "At home" framing | Transactional | BOFU | Alternate phrasing to "mobile" — test in title tags/H1 A/B |
| mobile detailing business (near me) | **Ambiguous — dual intent** | Commercial (consumer) OR Informational (competitor/contractor research) | Mixed | Flag: could be someone shopping local detailing companies, or a would-be contractor scoping competition — serve both on one SEO-optimized "Miami mobile detailing companies" page with a recruiting CTA embedded |

### 3.2 Spanish

| Long-tail keyword (ES) | Modifier type | Intent | Funnel | Notes |
|---|---|---|---|---|
| detallado de autos a domicilio | "At home"/mobile | Transactional | BOFU | Core ES head term — mirrors EN "mobile car detailing" |
| lavado de auto a domicilio cerca de mi | Mobile + local | Transactional | BOFU | Double-modifier — strongest ES BOFU pattern found |
| lavado de autos a domicilio precio(s) | Mobile + price | Commercial | MOFU | Pricing page ES section |
| detallado de autos cerca de mi | Local | Transactional | BOFU | — |
| lavado de auto a mano cerca de mi | "Hand wash" + local | Transactional | BOFU | Confirms "hand wash" (lavado a mano) as a distinct searched service, not just "detailing" |
| lavado de auto automatico cerca de mi | Differentiator (vs. automatic car wash) | Transactional | BOFU | Useful negative-comparison content: "mobile detail vs. automatic wash" |
| restauracion de faros cerca de mi | Local add-on | Transactional | BOFU | Headlight restoration ES local page |
| lavado y detallado de autos a domicilio / cerca de mi | Combined service + modifier | Transactional | BOFU | Full-service combined page |
| nombres para detallado de autos | **Contractor-side** (naming a new business) | Informational | TOFU | Signals ES-speaking aspiring contractors — recruit in Spanish, not just English |

---

## 4. Programmatic [Service] × [Neighborhood] × [Language] Matrix

### 4.1 Pattern

```
/{lang}/detailing/{neighborhood-slug}/{service-slug}
Title (EN): "{Service} in {Neighborhood}, FL | Mobile Car Detailing"
Title (ES): "{Servicio} en {Neighborhood}, FL | Detallado de Autos a Domicilio"
```

**Services (13):** mobile car detailing (pillar), interior detailing, exterior detailing, full detail (interior + exterior), ceramic coating, paint correction, hand wash, wax, headlight restoration, engine bay cleaning, pet hair & odor removal, fleet detailing, boat/RV detailing.

**Neighborhoods (20, per service area):** Miami, Miami Beach, Hialeah, Coral Gables, Kendall, Doral, Homestead, Aventura, North Miami, Miami Gardens, Cutler Bay, Palmetto Bay, Pinecrest, Brickell, Wynwood, Little Havana, Coconut Grove, Sweetwater, Westchester, Sunny Isles.

**Page-count math:** 13 services × 20 neighborhoods × 2 languages = **520 unique keyword targets / potential URLs.**

### 4.2 Representative highest-value combos (sample, not exhaustive)

| EN keyword | ES keyword | Basis |
|---|---|---|
| mobile car detailing brickell | detallado de autos a domicilio en brickell | Brickell = high-density, high-income condo market — strong fit for "mobile" convenience angle |
| car detailing coral gables | detallado de autos en coral gables | `car detailing coral gables` **confirmed in raw autocomplete** (§EN neighborhood hits) |
| ceramic coating aventura | ceramic coating en aventura | `car detailing aventura` confirmed in autocomplete; Aventura = luxury-vehicle density → ceramic coating upsell fit |
| mobile car detailing kendall | detallado de autos a domicilio kendall | `car detailing kendall` confirmed in autocomplete; Kendall = large family-suburban ZIP volume |
| detallado de autos hialeah | detallado de autos en hialeah | `car detailing hialeah` confirmed in autocomplete; Hialeah is ~95% Hispanic — should be an ES-primary page, EN secondary |
| pet hair removal doral | eliminacion de pelo de mascota doral | `car detailing doral` confirmed; Doral has high pet-owning suburban household density (directional, not measured) |
| mobile detailing near me pinecrest / palmetto bay | detallado a domicilio cerca de mi pinecrest / palmetto bay | Both neighborhoods confirmed present in autocomplete corpus; affluent single-family-home areas fit driveway-mobile-service model well |

**Confirmed-vs-constructed flag:** `miami`, `miami beach`, `hialeah`, `coral gables`, `kendall`, `doral`, `homestead`, `aventura`, `north miami`, `miami gardens`, `palmetto bay` all appeared in raw EN autocomplete this session (11 of 20 neighborhoods — Signal: Google Autocomplete). `cutler bay`, `pinecrest`, `brickell`, `wynwood`, `little havana`, `coconut grove`, `sweetwater`, `westchester`, `sunny isles` did **not** surface in this sweep (autocomplete depth limit, not evidence of zero demand) — build them from the pattern regardless, since they are named in the brief's core service area. All ES neighborhood combos are **Estimated/pattern-constructed** per §1.

### 4.3 Phasing recommendation (avoids thin-content anti-pattern per topic-cluster-templates.md)

| Phase | Pages | Criteria |
|---|---|---|
| 1 | ~80 pages | Top 4 services (mobile detailing, interior, ceramic coating, full detail) × top 10 highest-population/income neighborhoods × 2 languages |
| 2 | ~160 pages | Remaining 9 services × same top 10 neighborhoods × 2 languages |
| 3 | ~280 pages | All 13 services × remaining 10 neighborhoods × 2 languages |
| — | **520 total** | Do not launch all 520 at once — each page needs unique local proof (contractor coverage, before/after photos, real reviews) or it reads as doorway-page spam to both users and Google |

---

## 5. Contractor-Recruitment Long-Tail

Two distinct clusters found — treat as separate content, not one page.

### 5.1 Earnings-curiosity (informational, top-of-funnel recruiting)

| Keyword | Intent | GEO fit |
|---|---|---|
| how much do mobile car detailers make | Informational | High — direct-answer with a number/range |
| how much do mobile detailers make | Informational | High |
| how much does a mobile detailer make (a year) | Informational | High |

### 5.2 Already-detailing, seeking growth/switching signal (high-value — no competitor owns this)

| Keyword | Intent | Notes |
|---|---|---|
| how to get car detailing clients | Informational → Transactional (contractor) | Strongest recruiting long-tail found — "join DTailWash, we bring you the clients" is a direct answer to the literal query |
| how to get clients for a mobile car detailing business / for mobile car detailing | Same | 3 phrasing variants confirmed — cluster together |
| how to find car detailing clients | Same | — |
| how to get more car detailing clients | Same | — |
| how to become a mobile car detailer / a successful mobile detailer | Informational (earlier-stage) | TOFU recruiting content |
| mobile detailing business plan / business insurance / business cards / business names | Informational (operations) | Low DTailWash-relevance directly, but good supporting-cluster content that captures aspiring contractors early and funnels to "or skip the paperwork — join our platform" |
| como conseguir clientes de detallado (ES — constructed from "how to get clients" pattern; not independently confirmed in ES autocomplete this session) | Informational → Transactional | **Estimated** — re-run ES contractor seeds with more variants next pass; current ES contractor harvest only returned "negocio detallado de autos" |

---

## 6. Prioritized Quick-Win Long-Tail List

**English:**
1. `is ceramic coating worth it` (+ "…for cars", "…reddit") — MOFU, GEO-high, zero-brand-loyalty query up for grabs
2. `mobile car detailing near me` + top-10-neighborhood variants — BOFU, direct revenue path
3. `is it worth detailing car before selling` — MOFU, confirmed low-competition per 03-user-intent.md (query #8)
4. `how to get car detailing clients` — contractor-recruitment, zero marketplace competitor found owning this phrase
5. `pet hair removal car near me` — add-on service, BOFU, low competition (niche add-on pages rarely built by competitors)

**Spanish:**
1. `detallado de autos a domicilio` + neighborhood variants (start with Hialeah, Miami, Homestead — highest Hispanic-density areas) — BOFU
2. `cuanto cuesta el detallado automotriz` — MOFU pricing page, direct-answer format
3. `limpieza de interiores de autos cerca de mi` — BOFU local, pairs with "lavado de auto a mano cerca de mi" as a hand-wash-vs-detail disambiguation page

---

## 7. GEO / AI-Answer Content Opportunities

Direct-answer / FAQ-schema candidates ranked by how cleanly they fit a single structured answer (Phase 6 GEO-check):

| Query | Answer type | Format |
|---|---|---|
| ceramic coating how long does it last | Single fact (duration range) | FAQ schema, one sentence answer + supporting paragraph |
| is ceramic coating worth it | Verdict + reasoning | Direct-answer opener ("Yes, if... No, if...") then detail |
| how often should you detail your car | Frequency recommendation | FAQ schema |
| how much does car detailing cost (near me) | Price range | Table + one-sentence range answer |
| que es un detallado de autos / car detailing what is it | Definition | Definition box, bilingual, schema `DefinedTerm` |
| is it worth detailing car before selling | Verdict + ROI logic | Direct-answer + resale-value data point |
| cuanto cuesta un curso de detallado automotriz | Direct answer ("You don't need a course — DTailWash trains you") | Contractor FAQ — reframes the query into a recruiting hook |

---

## 8. Next Steps

1. Re-run ES autocomplete with Miami-specific seed variants (e.g., "detallado de autos + hialeah", "a domicilio + miami") to force geo-relevant ES suggestions rather than relying on generic ES autocomplete defaulting to LatAm.
2. Pull Perplexity/Brave "People Also Ask" for the top 10 EN + top 10 ES quick-win queries to cross-validate question phrasing beyond autocomplete's 10-suggestion cap per seed.
3. Once `~~SEO tool` (DataForSEO/GSC) is connected, re-score every table above with real Volume + KD and compute `Opportunity = (Volume × Intent Value) / Difficulty` per the skill's Phase 5 — everything here is currently intent/GEO-only, not volume-prioritized.
4. Build Phase 1 of the programmatic matrix (~80 pages, §4.3) before Phase 2/3 — validate indexing and unique-content quality on the first batch first (per topic-cluster-templates.md build sequence: pillar → lowest-difficulty cluster pages → highest-volume → remainder).
5. Hand this file + `03-user-intent.md` to `competitor-analysis` skill to check which of the Quick-Win list (§6) already has an entrenched local competitor before final prioritization.
