#!/usr/bin/env node
/**
 * Fabricated-data guard (remediation §2.2).
 * Fails the build when randomness/faker libraries appear in any path that
 * feeds user-facing data: API routes, the AVM/data libs, or seed/ingest
 * scripts. Run automatically via `prebuild` and `npm test`.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const SCAN_DIRS = ["app/api", "lib", "scripts"];
const SELF = "guard-fabrication.mjs";
const BANNED = [
  /\bMath\.random\s*\(/,
  /\bfaker\b/i,
  /\bchance\b/,
  /\brandomInt\s*\(/,
  /\bseedRandom\b/i,
  /mulberry32/,
];

const violations = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (e === "node_modules" || e === ".next") continue;
      walk(p);
    } else if (/\.(ts|tsx|js|mjs|json)$/.test(e) && !p.endsWith(SELF)) {
      const src = readFileSync(p, "utf8");
      for (const re of BANNED) {
        if (re.test(src)) violations.push(`${p}: matches ${re}`);
      }
    }
  }
}

for (const d of SCAN_DIRS) walk(d);

if (violations.length) {
  console.error("✕ fabrication guard FAILED — randomness/faker in data paths:");
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("✓ fabrication guard passed — no Math.random/faker/chance in app/api, lib, scripts");
