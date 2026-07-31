# فَنر هومز — Fanr Homes (Phase 1 MVP)

Saudi Arabia's consumer-first real-estate & rentals platform — **Phase 1: Riyadh, rentals-first**
(PRD v1.0, Part X). A runnable Next.js full-stack app with a **real interactive map**
(MapLibre GL + live OpenStreetMap tiles, real Riyadh coordinates), the REGA compliance gate,
the Riyadh Legal Rent Indicator, and تقدير فَنر AVM Layers 1–2.

> 🎨 The full design package (design system + 37 annotated screens) lives in [`design/`](design/DESIGN.md).

## Run it

```bash
npm install
npm run dev        # → http://localhost:3000
```

No database or keys required — the MVP seeds itself (`data/db.json`) on first run.
The map loads live OSM tiles directly in your browser.

## What's implemented (PRD Phase-1 scope)

| Surface | Route | PRD |
|---|---|---|
| Home — market pulse, latest verified rentals | `/` | §9.1 |
| **Map search** — real MapLibre/OSM map of Riyadh, price pins (red = above legal cap), freeze-zone overlay (versioned polygon), district outlines, filters, **freehand draw-your-boundary** with polygon filtering, synced result list | `/search` | E2, R-E2-1/2/7, R3.3.5 |
| Listing page (SSR) — legal rent indicator (**cap governs, market demoted to context**), تقدير فَنر range + confidence + factor transparency + Taqeem disclaimer, verification stack, similar listings, **lead-gated contact reveal**, one-tap reporting | `/listings/[id]` | E3, E5, R-E3-1, R3.1.3, R3.5.1 |
| «هل إيجاري نظامي؟» rent checker — three freeze statuses, verdict, tenant rights (auto-renewal, tenant registration, 60-day objection) | `/rent-checker` | R3.3.4, E5-S1 |
| Owner dashboard — claimed properties with tracked estimates, renewal banner, owner listing path | `/owner` | E6 |
| Claim wizard — simulated Nafath + deed verification (hash-only note), persists to the portfolio | `/owner/claim` | E1-S2, E13 |
| Ejar readiness pack — parties/property/terms checklist, no-increase-clause check, handoff to ejar.sa | `/owner/ejar-pack` | R3.2.1–.2 |
| Renewal calendar — 90/65-day alerts visualised against the 60-day statutory notice | `/owner/renewals` | R3.2.3, E5-S4 |
| Broker workspace — lead inbox with statuses (new→responded→qualified→closed), **earned response-rate badge** computed from real first-response timing (awarded under a 6h median), SLA-overdue nudges, 30-day availability re-confirmation, licence-expiry alerts | `/broker` | E7, R-E7-4, E7.2 |
| **Add-listing wizard** — REGA ad-licence verification gate (publish blocked until verified), mandatory freeze-status declaration + last Ejar value, advisory above-cap warning (logged, one-tap fix), publish-time duplicate detection (district+price±5%+area±10% → flagged for admin review) | `/broker/new` | E1-S1, R3.1.1–.2, R3.3.2–.3, E1-S5 |
| Admin console — moderation queue (above-cap, bait-price anomaly >40% below estimate, reports), daily licence sweep with auto-unpublish, AVM baseline monitor with implied-yield guardrail (3–10%) | `/admin` | E14, R3.1.4, E13, §7.2 |
| **District data pages** — medians, 12-month trend, monthly price chart, property mix, live inventory — all computed from the transaction corpus | `/districts/[id]` | E12, R-E12-1 |
| Rent-freeze explainer — the three scenarios, auto-renewal, 60-day windows, objection route (quotable GEO/SEO content) | `/guide/rent-freeze` | E5.3, R-E12-5 |
| Saved searches (with new-match counts, exact restore via deep-linked filters incl. drawn polygon) + favourites | `/saved` | E10, R-E2-8 |
| Compare view — up to 4 favourites on price/m², estimate delta, legal cap | `/compare` | E10 |

### API (PRD §8.3 envelope: `{success, data, meta, error}`)

```
GET  /api/v1/homes/search?type=rent&beds=3&price_max=70000&within_cap=1&polygon=[[lng,lat],...]
GET  /api/v1/homes/estimate?listing_id=…
POST /api/v1/homes/listings                      # publish-gated on ad licence
POST /api/v1/homes/listings/:id/leads            # contact revealed only after lead
POST /api/v1/homes/listings/:id/report
POST /api/v1/compliance/verify-ad-license
POST /api/v1/compliance/verify-fal
POST /api/v1/admin/listings/:id                  # moderation actions
```

## Architecture & MVP substitutions

```
app/            Next.js App Router — SSR pages + /api/v1 route handlers
components/     MapSearch (MapLibre client), LeadPanel, AdminActions
lib/
  avm.ts          تقدير فَنر — full three-layer hybrid (PRD Part VII):
                  L1 district baselines × L2 hedonic factors (lib/factors.ts, versioned)
                  × L3 comparable reconciliation: area ±25%, trailing 9 months, 12 nearest,
                  weighted median (6-month recency half-life × inverse distance × attribute
                  similarity), w2 by comp count (≥8→0.70, 5–7→0.55, 3–4→0.40, <3→0),
                  confidence & range from comp dispersion, yield guardrail 3–10%
  transactions.ts synthetic MOJ/SREM-style transaction corpus (deterministic PRNG) —
                  stands in for fanr-ingestion-worker
  marketstats.ts  district analytics (medians, trend, mix, monthly series) from the corpus
  geo.ts          point-in-polygon, freeze-zone polygon (versioned: riyadh-urban-v1-mvp)
  compliance.ts   ad-licence/FAL verification stubs + daily expiry sweep
  seed.ts         10 Riyadh districts (real coords) + 20 listings
  store.ts        file-backed store (data/db.json)
  clientStore.ts  saved searches + favourites (localStorage)
```

Deliberate MVP substitutions, each isolated behind the module boundary the PRD names:

- **Store**: JSON file ⇒ swap for PostgreSQL + PostGIS (`lib/store.ts`; PRD §8.1 non-negotiable at scale).
- **Licence verification**: deterministic format-validation stubs ⇒ REGA/FAL APIs (`lib/compliance.ts`).
- **Identity**: Nafath deferred — flows marked at their integration points.
- **Freeze polygon**: approximated urban boundary, versioned ⇒ official أمانة الرياض GIS layer.
- **AVM**: full three-layer pipeline is live; the transaction corpus behind Layer 3 is
  synthetic (deterministic) until real MOJ/SREM ingestion lands — swap `lib/transactions.ts`.
- **Photos**: brand-gradient placeholders ⇒ media pipeline with perceptual-hash dedup.

## Compliance behaviours you can test

1. `/broker/new` → try licence `12345` → verification fails, publish stays disabled.
2. Use `7200481963` → verifies → set asking above the Ejar value → advisory warning appears,
   is logged to the listing's `complianceLog`, and the published page shows the public ⚠ badge.
3. `/admin` → the seeded expired-licence listing is auto-unpublished by the daily sweep;
   its public page returns the "no longer available" state.
4. On any listing: contact details appear only after creating a lead; the lead lands in `/broker`.

---
*Fanr Solutions — Confidential. MVP scaffold for internal & contracted development partners.*
