---
description: "Run a product-launch (RAMP) workflow: positioning and launch tiering, window/early-access design, message house and asset kits, the launch-readiness gate with a T-1 go/no-go, launch-day execution, and the post-launch prove loop. Not sure? Use /aaron-marketing:auto."
argument-hint: "<launch goal or product> [--phase research|assemble|mobilize|prove]"
---

# Launch Command

Run the product-launch lifecycle along the **RAMP loop** (Research → Assemble → Mobilize → Prove). Skills score on the [RAMP framework](../references/ramp-benchmark.md) and operate from the user's **own plan, project memory, and keyless public telemetry** — keyed launch platforms and commercial ASO suites are never required. The discipline is use-case-agnostic: the same skills serve B2B SaaS sales-led launches, dev-tool/community launches, and mobile app-store launches; the goal you name selects the RAMP goal-weight column.

## Route

Infer the RAMP-loop phase from the goal (or honor `--phase`) and route to the matching skill:

- **Research** — positioning-mapper (Dunford-style canvas: alternatives, unique attributes, beachhead), launch-tier-planner (tier/type + risk register + kill criteria), launch-window-planner (dates, competitor calendar, embargo windows), early-access-designer (waitlist→GA stage ladder + graduation criteria); record decided dates/stages via launch-registry (`memory/launch-registry/`)
- **Assemble** — message-house-builder (tagline/pillars/PR-FAQ spine; claims marked `[needs source]` → `memory/claims/candidates.md`), launch-asset-packager (tier-scoped manifest: press kit, store listing specs, technical go-live items), pricing-packaging-planner (tiers, launch offers, guarantees), sales-enablement-kit (battle cards, talk track — sales-led only); reuse landing-optimizer for the launch page UX and technical-seo-checker for the go-live pass
- **Mobilize** — launch-readiness-auditor (the LQS gate + T-1 go/no-go; R1 judged against launch-registry, A1 against the claims ledger), launch-day-conductor (hour-blocked runbook, requires a SHIP verdict), community-launch-runner (PH/HN/directory/regional-channel submissions under platform rules), press-media-relations (media tiers, embargo pitch sequence, press release; pitch execution → outreach-manager)
- **Prove** — launch-monitor (T-0→T+30 telemetry via `hn.py`/`producthunt.py`/`appstore.py`/`gdelt.py`, spike-vs-sustain), launch-feedback-synthesizer (theme triage + compliant social proof), launch-retro-analyzer (D1/W1/M1 actual-vs-target + 5-Whys), momentum-planner (anti second-week cliff, next moment); reuse roi-calculator / report-generator / performance-analyzer

## Rules

- `launch-readiness-auditor` is the pre-launch gate: score LQS and enforce the four vetoes (R1/A1/M1/P1) before a date is committed or a launch moment goes live; `launch-day-conductor` hard-requires its SHIP verdict.
- `launch-registry` is the launch truth SSOT: only it writes `memory/launch-registry/`; other skills drop candidates in `memory/launch-registry/candidates.md` only (during the T-0 window, mobilize skills append there and the registry batch-promotes at day close). No stage record on file = NEEDS_INPUT for R1 (not pass-by-default).
- Keyless Tier 1 — score from the user's own plan/analytics plus the keyless/free-key connectors (`hn.py`, `producthunt.py`, `appstore.py`, `gdelt.py`); keyed launch platforms are opt-in Tier-2/3 MCP only. Platform folklore (posting hours, karma ladders, vote-velocity targets) is Estimated context with named sources, never a scored rule.
- Only `launch-readiness-auditor` computes the goal-weighted LQS; every other skill works one RAMP lever and hands off. Launch-stacking / audience fatigue is a guardrail under M, not a veto.
- Label every metric Measured / User-provided / Estimated; attribution truth comes from the user's own analytics (UTM set), never platform self-reported numbers. No incentivized store reviews — incentives only where a platform explicitly allows them, with disclosure.
- **Scope edge — creators and distribution**: a launch that runs through creators hands the creator lane to [campaign-planner](../influencer/plan/campaign-planner/SKILL.md) ("launch a product with creators" starts there); pitch/follow-up mechanics for media and hunters run on [outreach-manager](../influencer/activate/outreach-manager/SKILL.md); content repurposing and the paid-amplification calendar belong to [content-amplifier](../influencer/activate/content-amplifier/SKILL.md); the launch page UX is [landing-optimizer](../influencer/measure/landing-optimizer/SKILL.md); waitlist capture-flow specs stay with [list-growth-designer](../email/setup/list-growth-designer/SKILL.md) and opt-in records with [consent-registry](../protocol/consent-registry/SKILL.md).

## Output

Return inline artifacts by default. Files may be written only when the user explicitly asks and the runtime can write.
