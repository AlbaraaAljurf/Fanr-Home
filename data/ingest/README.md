# MOJ / SREM ingest drop-zone

Place a **real extract** here and run the worker:

```bash
npx tsx scripts/ingest-moj.ts data/ingest/<your-extract>.csv           # ingest
npx tsx scripts/ingest-moj.ts data/ingest/<your-extract>.csv --dry-run # validate only
```

Sources:
- MOJ Open Data — real-estate transaction reports: https://moj.gov.sa/ar/opendata
- SREM (البورصة العقارية): https://srem.moj.gov.sa

The worker is **idempotent** (rows keyed on `source_reference` — re-running the
same file inserts nothing) and **never generates data**: an empty file is a no-op,
and invalid rows abort the ingest with row-level errors.

## Column contract (CSV header)

Required:

| column | meaning |
|---|---|
| `source_reference` | unique upstream deal reference (idempotency key) |
| `district` | district id (`al-malqa`), Arabic name (`الملقا`) or English name |
| `kind` | `sale` or `rent` |
| `property_type` | `apartment` \| `villa` \| `floor` \| `duplex` \| `land` |
| `area_m2` | area in m² |
| `price_sar` | total SAR (sale) or annual rent |
| `date` | transaction date (ISO) |
| `as_of_date` | date the source published/extracted the row |

Optional (enable Layer-3 comparables — a row without the full attribute set can
drive baselines but will never render as a comparable):
`age_years, finish_grade, street_width_m, corner, orientation, floor, elevator, parking_spaces`

Rent rows only: `rent_verification` (`ejar_verified` | `user_verified` | `unverified`) —
rent comparables require `ejar_verified`.

See `moj-transactions.sample.csv` for the header line (header only — no sample
rows are shipped, by design: the repository contains no fabricated market data).
