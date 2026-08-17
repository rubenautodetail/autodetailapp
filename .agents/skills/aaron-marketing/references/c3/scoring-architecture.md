# C³ Scoring System — ACE · ART · ROI

> An open evaluation standard for influencer marketing.
> Three nested scopes — **Creator · Content · Campaign**, the **C³** system — each scored on a lean 3-dimension rubric (**ACE · ART · ROI**).
> A three-tier design: the content, the creator behind it, and the campaign that orchestrates them — each its own rubric, the smaller scopes rolling up into the larger.

---

## 1. The three scopes (C³)

| Scope | Rubric | Core question | Portable? |
|-------|--------|---------------|-----------|
| **Creator** | **ACE** | Is this creator worth partnering with? | ✅ reusable across brands/campaigns |
| **Content** | **ART** | Is this deliverable good & compliant? | ❌ per-piece |
| **Campaign** | **ROI** | Did / will the campaign deliver? | ❌ per-initiative |

- **Naming order** = the value chain `Creator · Content · Campaign` (creators make content; content composes campaigns).
- **Report drill-down** = containment `Campaign → Creator → Content` (macro → micro). Naming order ≠ UI order; both are intentional.

---

## 2. The 9 dimensions

| Scope | Dim | Owns | Threshold |
|-------|-----|------|-----------|
| **ACE** | **A**udience | who follows: reach-fit, real-follower %, demographic match | relative |
| | **C**redibility 〔veto〕 | integrity: brand-safety, disclosure history, reliability, conflicts | absolute |
| | **E**ngagement | influence: engagement rate & authenticity, audience action | relative |
| **ART** | **A**ppeal | craft: hook, creativity, production, integration naturalness | absolute |
| | **R**elevance | fit: brand/audience/brief alignment, message accuracy | absolute |
| | **T**ransparency 〔veto〕 | honesty: FTC disclosure, no false claims, brand-safe | absolute |
| **ROI** | **R**eturn | efficiency: ROI, CPE/CPM vs benchmark, value-for-spend | relative |
| | **O**rchestration | decisions: creator mix, brand-fit, channel, budget split, timing | absolute |
| | **I**mpact | outcome: KPI attainment, conversions, attribution rigor | relative |

---

## 3. Shared scoring chassis (all 9 dimensions)

| | |
|---|---|
| Per sub-item | **Pass = 10 · Partial = 5 · Fail = 0** |
| Dimension score | mean of its sub-items × 10 → **0–100** |
| Scope score | **additive** weighted mean of its 3 dimensions (weights by goal §6; math §8) |
| Rating bands | 90–100 Excellent · 75–89 Good · 60–74 Medium · 40–59 Low · 0–39 Poor |
| **Veto-cap** | any failed veto item caps the scope's rating at **Low (≤ 59)** and raises a flag |

---

## 4. Two threshold regimes

Influencer metrics are platform/tier/niche-relative — **never hard-code platform-agnostic numbers.**

- **Relative (benchmarked)** — Audience reach, Engagement rate, Return, Impact. **Pass = at/above the benchmark for the creator's tier × platform × niche** (e.g. "engagement rate ≥ niche median").
- **Absolute (gate)** — Credibility, Appeal, Relevance, Transparency, Orchestration. **Pass = criterion met** (presence / quality / compliance), independent of platform.

---

## 5. Veto items (red lines)

| Scope | Veto | Trigger |
|-------|------|---------|
| ACE | **A2** Real-Follower Rate | < 70% real / audit refused (follower fraud) |
| ACE | **C1** Brand Safety | disqualifying content / active scandal |
| ACE | **E2** Engagement Authenticity | pod / bought engagement |
| ART | **T1** FTC Disclosure | missing / inadequate disclosure on sponsored content |
| ART | **T2** Claim Integrity | false / unsubstantiated claims |

Regulatory basis for the disclosure vetoes: FTC **16 CFR §255** (Endorsement Guides) + the 2024 Trade Regulation Rule on Consumer Reviews & Testimonials (**16 CFR Part 465**). Not legal advice — consult counsel for your jurisdiction.

---

## 6. Weights by campaign goal (scope-level)

Weights shift per objective. Example for **ACE** (Creator):

| Goal | Audience | Credibility | Engagement |
|------|:--------:|:-----------:|:----------:|
| Awareness | 45% | 25% | 30% |
| Engagement | 25% | 25% | 50% |
| Conversion | 35% | 30% | 35% |
| Brand-building | 30% | 45% | 25% |

(ART and ROI carry their own goal-weight tables in their benchmark files.)

---

## 7. Cross-scope MECE boundaries (no double-count)

Each cross-cutting concept is scored in **exactly one** place:

| Concept | Scored once in | Not scored in |
|---------|----------------|---------------|
| Reach / scale | ACE.Audience | ROI, ART |
| Conversion / outcome | ROI.Impact | ART (ART scores appeal + compliance, **not** conversion) |
| Compliance | content disclosure → ART.Transparency; creator safety → ACE.Credibility | (different objects — not a duplicate) |
| Creator × brand fit | ROI.Orchestration | ACE (ACE is brand-independent) |

---

## 8. Fractal rollup

**Scoring math — additive within a scope, multiplicative across scopes.** Compensable dimensions *add*; non-compensable scopes *multiply*.

| Level | Math | Why |
|-------|------|-----|
| Within a scope (3 dims) | **additive** weighted mean | after veto handles catastrophes the dims are compensatory; addition keeps each dim *visible* for diagnosis |
| Veto | **cap** (override) | a failed veto item caps the scope at Low (≤ 59) |
| Across scopes | **multiplicative** (geometric mean) | a weak link wastes the rest — great creator + great content + flopped campaign ≠ a decent average |

The scopes nest — **ACE** per creator (portable; score once & reuse), **ART** per content piece, **ROI** per campaign — and roll up into one soft-multiplicative index that penalizes imbalance without zeroing:

```
Campaign Value Index (CVI) = ( ACE_avg × ART_avg × ROI )^(1/3) = ∛( C × C × C )
```

ACE_avg = budget-weighted mean of the campaign's creators · ART_avg = mean of its contents.

**The name encodes the math:** three **C**'s, multiplied and cube-rooted → **C³** (a "3C" additive list would mislabel it). Keep the three scope scores **separate** beside the CVI — the index ranks & alerts, the three scores diagnose (§9).

---

## 9. Combined diagnosis (Creator × Content)

| | Content (ART) high | Content (ART) low |
|---|---|---|
| **Creator (ACE) high** | ideal — scale the relationship | good creator, weak deliverable → fix the brief / execution |
| **Creator (ACE) low** | lucky one-off → don't scale | wrong partner → exit |

---

## 10. Hierarchy

```
Tier 1   C³ scope        Creator · Content · Campaign
Tier 2   9 dimensions    ACE · ART · ROI   (3 each)
Tier 3   sub-items       3–5 Pass/Partial/Fail checks per dimension   (~36 total)
```

Dashboards show Tier 1–2 (3 scopes × 3 bars). Audits open Tier 3.

---

## 11. Components

- **Architecture** — this file (scoring chassis, thresholds, boundaries, rollup math)
- **ACE** — Creator benchmark → [`ace-creator-benchmark.md`](ace-creator-benchmark.md)
- **ART** — Content benchmark → [`art-content-benchmark.md`](art-content-benchmark.md)
- **ROI** — Campaign benchmark → [`roi-campaign-benchmark.md`](roi-campaign-benchmark.md)
