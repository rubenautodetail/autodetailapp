# ACE — Creator Benchmark

> Scores a **creator** as a portable, brand-independent partnership asset — *"is this creator worth partnering with?"*
> Tier-2 rubric of the [C³ Scoring System](scoring-architecture.md). A creator's channel is a portable, brand-independent asset — score once, reuse across campaigns.
> **3 dimensions × ~4 items = 12 checks.**

---

## 1. Dimensions

| Dim | Question | Threshold |
|-----|----------|-----------|
| **A — Audience** | Who follows them — real, sized-right, on-target? | relative |
| **C — Credibility** 〔veto〕 | Is the creator safe, honest, reliable? | absolute |
| **E — Engagement** | Do they actually move their audience? | relative |

**Boundary rule (intra-ACE MECE):** fake **followers** → A (audience isn't real); fake **interaction** → E (engagement isn't real); creator **conduct** (safety, disclosure, reliability) → C. No realness signal is scored twice.

---

## 2. Checklist

### A — Audience

| ID | Item | Pass (10) | Partial (5) | Fail (0) |
|----|------|-----------|-------------|----------|
| A1 | Audience–Brand Match | Demographics/interests align with target on key attributes | partial overlap | mismatch / unknown |
| A2 | Real-Follower Rate 〔**VETO**〕 | ≥ 85% estimated real | 70–84% | < 70% or audit refused |
| A3 | Reach Fit | Follower count sits in the campaign's target tier | adjacent tier | far off |
| A4 | Growth Integrity | Organic growth curve | 1–2 explainable spikes | bought-follower spikes |

### C — Credibility 〔veto home〕

| ID | Item | Pass (10) | Partial (5) | Fail (0) |
|----|------|-----------|-------------|----------|
| C1 | Brand Safety 〔**VETO**〕 | No disqualifying content | minor / old, contextual | hate / illegal / active controversy |
| C2 | Disclosure History | Sponsored posts consistently disclosed (#ad etc.) | usually | routinely undisclosed |
| C3 | Professional Reliability | Clean delivery & comms record | minor issues | ghosting / disputes / missed deadlines |
| C4 | Category Conflict | No competing exclusivity | expired / soft conflict | active competitor lock-in |

### E — Engagement

| ID | Item | Pass (10) | Partial (5) | Fail (0) |
|----|------|-----------|-------------|----------|
| E1 | Engagement Rate | ≥ niche × tier × platform median | below median but active | far below / declining |
| E2 | Engagement Authenticity 〔**VETO**〕 | Organic comments / saves | minor anomalies | pod / bought engagement |
| E3 | Audience Action | Documented past action-driving (clicks / conversions) | likes only | no evidence / negative |
| E4 | Relationship Depth | Meaningful comment sentiment + creator replies | mixed | shallow / negative |

---

## 3. Scoring

- Item: **Pass 10 · Partial 5 · Fail 0**
- Dimension = mean(items) × 10 → 0–100
- **ACE = A·w_A + C·w_C + E·w_E** (weights by campaign goal — see [architecture §6](scoring-architecture.md#6-weights-by-campaign-goal-scope-level))
- Bands: 90–100 Excellent · 75–89 Good · 60–74 Medium · 40–59 Low · 0–39 Poor
- **Veto:** failing **A2**, **E2**, or **C1** caps ACE at **Low (≤ 59)** and raises a Manipulation / Safety flag.

---

## 4. Data sources (be honest about availability)

| Item | Assessable from a public profile? | Needs a tool |
|------|:----------------------------------------:|--------------|
| A1, A3 | partial (visible audience cues) | audience-analytics for precise demographics |
| A2, A4 | ⚠️ no | fake-follower auditor (HypeAuditor / Modash-class) |
| C1, C2, C4 | ✅ yes (review recent posts / disclosures) | — |
| C3 | partial | CRM / references |
| E1 | ✅ computable from public counts | benchmark data for the niche median |
| E2, E3, E4 | ✅ partial (read the comments) | engagement-authenticity tool for rigor |

> When a tool-dependent item can't be verified, score it **Partial** and flag *"unverified"* — **never default to Pass.**

---

## 5. Calibration — E1 Engagement Rate

- **Pass**: a 40K-follower beauty micro-creator at 6.2% average engagement, where the beauty-micro median is ~4%. Above the niche benchmark.
- **Partial**: the same creator at 3.1% — active but below the ~4% niche median.
- **Fail**: 1.2% engagement on 40K followers, trending down over 90 days — well below benchmark, audience disengaged.

> Engagement rate is tier- and niche-relative: 6% is great for a 40K micro, mediocre for a 2K nano, and exceptional for a 2M mega. **Always compare within tier × niche × platform** — never against a fixed number.

## 6. Intra-ACE quick reference

| Concept | Lives in | Veto? |
|---------|----------|-------|
| Fake followers / bought audience | A2 | ✅ |
| Brand safety / scandal | C1 | ✅ |
| Pod / bought engagement | E2 | ✅ |
| Reach scale (tier fit) | A3 | — |
| Real influence (engagement rate) | E1 | — |
