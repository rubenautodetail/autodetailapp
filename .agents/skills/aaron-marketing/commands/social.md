---
description: "Run an organic-social (ECHO) workflow: channel portfolio and voice dossiers, platform-native content and calendars, the social-quality gate with a pre-publish go/no-go, community/inbox/crisis operations, and the listening/SOV/dark-social measurement loop. Not sure? Use /aaron-marketing:auto."
argument-hint: "<social goal or channel> [--phase explore|craft|host|observe]"
---

# Social Command

Run the organic-social lifecycle along the **ECHO loop** (Explore → Craft → Host → Observe). Skills score on the [ECHO framework](../references/echo-benchmark.md) and operate from the user's **own data, project memory, and keyless public surfaces** — keyed social suites and scheduler platforms are never required, and this discipline ships **no posting/engagement automation of any kind**: deliverables are ready-to-paste packages a human publishes. The discipline is use-case-agnostic: the same skills serve B2C brands, dev-tool communities, and B2B founder-led motions; the goal you name selects the ECHO goal-weight column.

## Route

Infer the ECHO-loop phase from the goal (or honor `--phase`) and route to the matching skill:

- **Explore** — channel-portfolio-planner (capability/access matrix + channel selection; access classes per `references/social-platform-access.md`), voice-dossier-builder (brand + founder voice from own posts, content pillars), platform-norm-profiler (dated norm cards under `references/platforms/`), participation-warmup-planner (pre-promotion ramp + warming→active graduation criteria; owned-community variant); record decided channels/states via channel-registry (`memory/channels/`)
- **Craft** — social-calendar-builder (always-on calendar; publish step hard-requires the gate's pre-publish SHIP), social-creative-builder (one idea → N platform-native packages incl. 小红书/carousel modes; claims marked `[needs source]` → `memory/claims/candidates.md`), short-video-scripter (retention-gate beat sheets incl. 抖音/视频号 params, AI-disclosure default), advocacy-program-designer (opt-in advocacy/founder programs, anti-pod guardrails)
- **Host** — social-quality-auditor (the SQS gate + pre-publish go/no-go; E1 judged against channel-registry, C1 against the claims ledger, H2 against `ugc-permissions.md`), engagement-inbox-manager (comment/DM/mention triage + UGC rights mode; DRAFT replies only), social-selling-planner (founder/seller daily block, zero automation), crisis-response-planner (severity ladder; first action = pause queue + paid amplification)
- **Observe** — social-pulse-monitor (always-on listening via `bluesky.py`/`fediverse.py`/`discourse.py`/`hn.py`/`gdelt.py`/`tavily.py`; X/IG/TikTok/LinkedIn are proxy-only, labeled), share-of-voice-tracker (locked competitor panel), dark-social-attributor (UTM/share hygiene + self-reported field + GA4 direct decomposition, all Estimated-labeled), social-measurement-loop (denominator-locked metric dictionary, community-health mode, write-back); reuse roi-calculator / report-generator / performance-analyzer

## Rules

- `social-quality-auditor` is the publish gate: score SQS and enforce the six vetoes (ECHO E1/C1/C2/H1/H2/O1) before a batch ships; `social-calendar-builder`'s publish step hard-requires its pre-publish SHIP verdict, and `crisis-response-planner` re-runs it before un-pausing the queue.
- `channel-registry` is the social truth SSOT: only it writes `memory/channels/` (dossiers + voice-dossier/ugc-permissions/advocate-roster/calendar-commitments); other skills drop candidates in `memory/channels/candidates.md` only (inbox/pulse batch-append intra-day, promoted at day close). No dossier on file = NEEDS_INPUT for E1 (not pass-by-default).
- Keyless Tier 1 — read from own analytics exports plus the keyless connectors; closed platforms (X/IG/TikTok/LinkedIn/小红书) enter as user exports (Measured, as-of) or proxy reads that are always labeled proxy, never Measured. Platform folklore (posting hours, hashtag counts) is Estimated context with named sources, never a scored rule.
- Only `social-quality-auditor` computes the goal-weighted SQS; every other skill works one ECHO lever and hands off. Over-posting / cadence-over-capacity is a guardrail under H, not a veto.
- No manufactured or baited engagement, no pods, no bought followers, no automated replies/DMs, no mass connection requests — veto-class (ECHO H1). UGC republishing requires a recorded permission (`ugc-permissions.md`); public posting is never permission, organic consent never covers paid use (ECHO H2). Disclose material connections and realistic synthetic media (ECHO C2).
- **Scope edge — the three-way "post this" split**: the always-on brand posting calendar and net-new packages are this discipline (social-calendar-builder / social-creative-builder); "boost this post" / repurposing an existing asset is [content-amplifier](../influencer/activate/content-amplifier/SKILL.md) with paid execution in the ROAS discipline; launch-day community submissions (PH/HN/directories) are [community-launch-runner](../launch/mobilize/community-launch-runner/SKILL.md). Creator collabs start at [campaign-planner](../influencer/plan/campaign-planner/SKILL.md); creator deliverable gating stays with [content-reviewer](../influencer/activate/content-reviewer/SKILL.md); 1:1 pitch mechanics run on [outreach-manager](../influencer/activate/outreach-manager/SKILL.md); email lanes stay with the SEND discipline.

## Output

Return inline artifacts by default. Files may be written only when the user explicitly asks and the runtime can write.
