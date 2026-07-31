# فَنر هومز — Fanr Homes (Phase 1, remediated)

Saudi Arabia's consumer-first rentals & real-estate platform — Riyadh, rentals-first.
A **mobile app shell** (not a web page) with a real MapLibre/OSM map, the REGA compliance
gate, the Riyadh Legal Rent Indicator, and a data-honest تقدير فَنر.

> 🎨 Design package: [`design/`](design/DESIGN.md) · 📄 PRD-traceable feature history in git log.

## Run

```bash
npm install
npm run dev        # → http://localhost:3000  (open at 390×844 for the intended experience)
npm test           # fabrication guard + AVM/compliance/ingestion assertions
```

## Data honesty (the contract of this codebase)

- **No fabricated market facts anywhere.** No sample listings, transactions, rents, or
  licence numbers ship in this repo. `scripts/guard-fabrication.mjs` **fails the build**
  if `Math.random`/faker/chance/PRNGs appear under `app/api`, `lib`, or `scripts`.
- **Every displayed number is derivable.** Comparables store both factor products and are
  unit-tested to recompute within 0.5% (`scripts/test-avm.ts`); rows that can't pass don't render.
- **Estimates only from ingested rows.** District baselines (winsorised 5/95, min 8 tx,
  zone→city fallback with widening penalty) come exclusively from MOJ/SREM rows loaded by
  `scripts/ingest-moj.ts` (idempotent; every row carries `source`, `source_reference`,
  `as_of_date`). Until an extract is dropped into `data/ingest/`, every estimate surface
  renders **«بيانات غير كافية لهذا الحي»** — by design.
- **Model coefficients live in config**, not code: `config/avm-factor-sets.json` (versioned,
  `effective_from`, `source`); compound hedonic multiplier clamped to **[0.80, 1.25]** with
  binding logged. Model version + disclaimer are generated from the layers that actually
  contributed. Rent comparables require `ejar_verified` provenance (none yet ⇒ suppressed).
- **Market figures** (RETT, VAT, yield references) live in `config/market-reference.json`
  with `source` + `as_of_date`, surfaced read-only in admin.
- **Compliance beats value, always:** a listing above the legal rent cap never carries a
  value/bargain badge on any surface; the cap is the primary number for frozen Riyadh
  properties (`lib/complianceUi.ts`, unit-tested).
- **Media:** real, rights-asserted imagery via the `lib/media.ts` pipeline contract — or an
  honest labelled empty state. Nothing pretends to be a photo.

## App shell

`100dvh`, max-width 480, page never scrolls (only the content region). Fixed 56px gradient
headers (RTL back on the right), fixed 5-tab navy bar (الرئيسية · الخريطة · المحفوظات ·
أملاكي · حسابي). `/broker` and `/admin` are reached from **حسابي** — not public tabs.
Filters, the rent checker, and the lead form are bottom sheets. The listing screen has a
sticky bottom action bar (contact + favourite) and a full-bleed media region.

## Loading real data

```bash
# 1. Download a transactions extract (MOJ open data / SREM) and map it to the
#    column contract in data/ingest/README.md
npx tsx scripts/ingest-moj.ts data/ingest/extract.csv --dry-run   # validate
npx tsx scripts/ingest-moj.ts data/ingest/extract.csv             # ingest (idempotent)
```

Estimates, district pages, and the admin baseline monitor light up automatically once
≥8 rows/district exist; comparables additionally need attribute-complete rows.

## Structure

```
app/            App Router screens + /api/v1 routes (PRD envelope)
components/     Shell (header/tabbar/sheet/media-empty), MapSearch, sheets
lib/            avm (3-layer, config-driven, clamped), baselines, complianceUi,
                districts (geo only), marketref, media contract, store, geo
config/         avm-factor-sets.json · market-reference.json  (versioned, sourced)
scripts/        guard-fabrication · ingest-moj · test-avm · test-ingest
data/ingest/    drop-zone for real MOJ/SREM extracts (header-only sample)
```

---
*Fanr Solutions — Confidential.*
