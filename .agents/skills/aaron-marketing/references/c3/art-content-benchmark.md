# ART — Content Benchmark

> Scores a single **content deliverable** (post / video / reel / story) — *"is this content good & compliant?"*
> Tier-2 rubric of the [C³ Scoring System](scoring-architecture.md). Scores a single deliverable on its own merits — craft, fit, and honesty.
> **3 dimensions × ~4 items = 12 checks.**

---

## 1. Dimensions

| Dim | Question | Threshold |
|-----|----------|-----------|
| **A — Appeal** | Is it well-crafted and does it grab? | absolute |
| **R — Relevance** | Does it fit the brand, audience & brief? | absolute |
| **T — Transparency** 〔veto〕 | Is it honest, disclosed & brand-safe? | absolute |

**Boundary rule:** ART scores whether the content is *good and legal* — **not whether it converted** (that is measured in [ROI.Impact](roi-campaign-benchmark.md)). CTA **presence** is scored here (R4); CTA **performance** is ROI's.

---

## 2. Checklist

### A — Appeal

| ID | Item | Pass (10) | Partial (5) | Fail (0) |
|----|------|-----------|-------------|----------|
| A1 | Hook Strength | Grabs in the first 3s / strong opening | takes a few seconds / mild | slow, no hook, scroll-past |
| A2 | Production Craft | Polished visual / audio / editing | acceptable, minor flaws | poor quality distracts |
| A3 | Integration Naturalness | Sponsored mention feels native to the creator's style | clear but on-topic ad segment | forced, scripted, off-voice ad-read |
| A4 | Platform Nativeness | Right format / length / trend for the platform | slightly off-format | wrong format (repurposed TV ad on TikTok) |

### R — Relevance

| ID | Item | Pass (10) | Partial (5) | Fail (0) |
|----|------|-----------|-------------|----------|
| R1 | Brand Alignment | Tone / values / aesthetic on-guideline | minor drift | off-brand |
| R2 | Audience Relevance | Resonates with the target audience | partial fit | wrong audience / topic |
| R3 | Message Accuracy | All required key messages present & correct | minor omissions | missing / incorrect key message |
| R4 | Brief Adherence | All required elements present (tag, hashtag, link, code, CTA) | 1 minor element missing | a required element missing |

### T — Transparency 〔veto home〕

| ID | Item | Pass (10) | Partial (5) | Fail (0) |
|----|------|-----------|-------------|----------|
| T1 | FTC Disclosure 〔**VETO**〕 | Clear, conspicuous, **early** (#ad / "paid partnership"), unambiguous | present but late / small / weak wording | missing, buried, or euphemistic ("thanks to my friends at…") |
| T2 | Claim Integrity 〔**VETO**〕 | Claims accurate & substantiated (esp. health / financial / results) | mild puffery, no hard claims | false / unsubstantiated / misleading claim |
| T3 | Content Brand Safety | Safe context; no disparagement; licensed music / IP | minor concern | controversial context / competitor disparagement / IP violation |
| T4 | Endorsement Authenticity | Reflects genuine use / opinion | plausible but thin | deceptive (claims use without evidence / contradicts facts) |

---

## 3. Scoring

- Item: **Pass 10 · Partial 5 · Fail 0**
- Dimension = mean(items) × 10 → 0–100
- **ART = A·w_A + R·w_R + T·w_T** (weights by campaign goal — see §6)
- Bands: 90–100 Excellent · 75–89 Good · 60–74 Medium · 40–59 Low · 0–39 Poor
- **Veto:** failing **T1** or **T2** caps ART at **Low (≤ 59)** + a Compliance flag. Disclosure basis: FTC **16 CFR §255** / **Part 465**. Not legal advice.

---

## 4. Data sources

Most ART items are **assessable directly from the content** — appeal, relevance, disclosure, and claims can be judged by reviewing the post itself. Exceptions:

| Item | Note |
|------|------|
| A4 Platform Nativeness | needs the raw file for exact spec (aspect ratio, duration) |
| T2 Claim Integrity | substantiation of factual claims may need source-checking |
| T3 IP / music | licensing status may need a rights check |

---

## 5. Calibration — A3 Integration Naturalness

- **Pass**: a skincare creator works the sponsored serum into her actual morning routine, mentions it among other products she uses, shares a genuine 3-week result — the ad reads like her normal content.
- **Partial**: the product gets a dedicated 20-second segment that is clearly an "ad break" but stays on-topic and isn't overly scripted.
- **Fail**: the creator abruptly switches to a stiff, scripted ad-read full of brand superlatives ("the BEST serum EVER") that doesn't match her usual voice — viewers feel the seam.

---

## 6. Weights by campaign goal

| Goal | Appeal | Relevance | Transparency |
|------|:------:|:---------:|:------------:|
| Awareness | 45% | 30% | 25% |
| Engagement | 50% | 25% | 25% |
| Conversion | 35% | 40% | 25% |
| Brand-building | 35% | 40% | 25% |

(Transparency holds a ~25% floor regardless — and is a veto besides.)
