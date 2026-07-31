/**
 * Ingestion worker tests (remediation Phase 5.3): validation + idempotency.
 * Runs against a TEMP data dir (FANR_DATA_DIR) — never touches the app store.
 * Fixtures are test-only literals and never reach a user surface.
 */
import fs from "fs";
import os from "os";
import path from "path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fanr-ingest-test-"));
process.env.FANR_DATA_DIR = tmp;

// import AFTER the env override so the store binds to the temp dir
import("../lib/store").then(async ({ upsertTransactions, getDb }) => {
  let failures = 0;
  const check = (name: string, cond: boolean) => {
    if (cond) console.log(`  ✓ ${name}`);
    else { failures++; console.error(`  ✕ ${name}`); }
  };

  const rows = Array.from({ length: 5 }, (_, i) => ({
    id: `moj-T-${i}`,
    source: "TEST-FIXTURE",
    sourceReference: `T-${i}`,
    asOfDate: "2026-07-01",
    districtId: "al-malqa",
    kind: "sale" as const,
    propertyType: "apartment" as const,
    areaM2: 140 + i,
    price: 700000 + i * 10000,
    dateISO: new Date(Date.now() - (30 + i) * 86400000).toISOString(),
  }));

  console.log("Phase 5.3 — idempotent ingestion");
  const first = upsertTransactions(rows);
  check("first run inserts all rows", first.inserted === 5 && first.skipped === 0);
  const second = upsertTransactions(rows);
  check("second run inserts nothing (idempotent)", second.inserted === 0 && second.skipped === 5);
  check("store holds exactly the unique set", getDb().transactions.length === 5);
  const third = upsertTransactions([...rows, { ...rows[0], sourceReference: "T-NEW" }]);
  check("re-run with one new row inserts exactly one", third.inserted === 1 && third.skipped === 5);

  fs.rmSync(tmp, { recursive: true, force: true });
  if (failures) { console.error(`✕ ${failures} failed`); process.exit(1); }
  console.log("✓ ingestion tests passed");
});
