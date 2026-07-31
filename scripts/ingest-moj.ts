/**
 * MOJ/SREM transaction ingestion worker (remediation Phase 5).
 *
 * Usage:
 *   npx tsx scripts/ingest-moj.ts data/ingest/<extract>.csv [--dry-run]
 *   npx tsx scripts/ingest-moj.ts data/ingest/<extract>.json [--dry-run]
 *
 * - Accepts a REAL extract downloaded from MOJ open data / SREM
 *   (see data/ingest/README.md for the column contract).
 * - Every row must carry source_reference and dates; the worker stamps
 *   source + as_of_date and refuses rows that fail validation.
 * - Idempotent: rows are keyed on (source, source_reference); re-running
 *   the same file inserts nothing new.
 * - This script NEVER generates data. An empty/absent file is a no-op.
 */
import fs from "fs";
import { IngestedTx, PropertyType, FinishGrade } from "../lib/types";
import { DISTRICTS } from "../lib/districts";
import { upsertTransactions, getDb } from "../lib/store";

const SOURCE = "MOJ Open Data / SREM";

const DISTRICT_ALIASES: Record<string, string> = {};
for (const d of DISTRICTS) {
  DISTRICT_ALIASES[d.id] = d.id;
  DISTRICT_ALIASES[d.nameAr] = d.id;
  DISTRICT_ALIASES[d.nameEn.toLowerCase()] = d.id;
}

const PROPERTY_TYPES: PropertyType[] = ["apartment", "villa", "floor", "duplex", "land"];
const FINISHES: FinishGrade[] = ["economy", "standard", "premium", "luxury"];

interface RawRow {
  [k: string]: string;
}

function parseCsv(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 1) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: RawRow = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

function toTx(row: RawRow, i: number): { tx?: IngestedTx; error?: string } {
  const ref = row.source_reference;
  if (!ref) return { error: `row ${i + 1}: missing source_reference` };
  const districtId = DISTRICT_ALIASES[row.district] ?? DISTRICT_ALIASES[(row.district || "").toLowerCase()];
  if (!districtId) return { error: `row ${i + 1}: unknown district "${row.district}"` };
  const kind = row.kind === "rent" ? "rent" : row.kind === "sale" ? "sale" : null;
  if (!kind) return { error: `row ${i + 1}: kind must be sale|rent` };
  const propertyType = PROPERTY_TYPES.includes(row.property_type as PropertyType)
    ? (row.property_type as PropertyType)
    : null;
  if (!propertyType) return { error: `row ${i + 1}: bad property_type "${row.property_type}"` };
  const areaM2 = Number(row.area_m2);
  const price = Number(row.price_sar);
  if (!(areaM2 > 10 && areaM2 < 100000)) return { error: `row ${i + 1}: implausible area_m2` };
  if (!(price > 1000)) return { error: `row ${i + 1}: implausible price_sar` };
  const dateISO = new Date(row.date).toISOString?.();
  if (!row.date || isNaN(new Date(row.date).getTime())) return { error: `row ${i + 1}: bad date` };
  const asOfDate = row.as_of_date && !isNaN(new Date(row.as_of_date).getTime()) ? row.as_of_date : null;
  if (!asOfDate) return { error: `row ${i + 1}: bad/missing as_of_date` };

  const opt = <T,>(v: string | undefined, f: (s: string) => T): T | undefined =>
    v != null && v !== "" ? f(v) : undefined;

  const tx: IngestedTx = {
    id: `moj-${ref}`,
    source: SOURCE,
    sourceReference: ref,
    asOfDate,
    districtId,
    kind,
    propertyType,
    areaM2,
    price,
    dateISO,
    ageYears: opt(row.age_years, Number),
    finishGrade: FINISHES.includes(row.finish_grade as FinishGrade) ? (row.finish_grade as FinishGrade) : undefined,
    streetWidthM: opt(row.street_width_m, Number),
    corner: opt(row.corner, (s) => s === "1" || s === "true"),
    orientation: ["north", "south", "east", "west"].includes(row.orientation)
      ? (row.orientation as IngestedTx["orientation"])
      : undefined,
    floor: opt(row.floor, Number) ?? undefined,
    elevator: opt(row.elevator, (s) => s === "1" || s === "true"),
    parkingSpaces: opt(row.parking_spaces, Number),
    rentVerification:
      kind === "rent"
        ? (["ejar_verified", "user_verified", "unverified"].includes(row.rent_verification)
            ? (row.rent_verification as IngestedTx["rentVerification"])
            : "unverified")
        : undefined,
  };
  return { tx };
}

function main() {
  const [, , file, ...flags] = process.argv;
  const dryRun = flags.includes("--dry-run");
  if (!file) {
    console.error("usage: npx tsx scripts/ingest-moj.ts <extract.csv|extract.json> [--dry-run]");
    process.exit(2);
  }
  if (!fs.existsSync(file)) {
    console.error(`✕ file not found: ${file}`);
    process.exit(2);
  }
  const text = fs.readFileSync(file, "utf8");
  const rows: RawRow[] = file.endsWith(".json") ? JSON.parse(text) : parseCsv(text);
  console.log(`read ${rows.length} raw row(s) from ${file}`);

  const txs: IngestedTx[] = [];
  const errors: string[] = [];
  rows.forEach((r, i) => {
    const { tx, error } = toTx(r, i);
    if (error) errors.push(error);
    else if (tx) txs.push(tx);
  });

  if (errors.length) {
    console.error(`✕ ${errors.length} invalid row(s):`);
    errors.slice(0, 20).forEach((e) => console.error("  " + e));
    if (!dryRun) {
      console.error("aborting — fix the extract; no partial ingest.");
      process.exit(1);
    }
  }

  if (dryRun) {
    console.log(`dry-run: ${txs.length} valid row(s), ${errors.length} invalid — nothing written`);
    return;
  }

  const { inserted, skipped } = upsertTransactions(txs);
  const total = getDb().transactions.length;
  console.log(`✓ ingest complete: inserted ${inserted}, skipped ${skipped} (already present), total ${total}`);
}

main();
