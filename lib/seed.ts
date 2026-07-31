import { Db } from "./types";
import { DISTRICTS } from "./districts";

/**
 * Initial database state (remediation Phase 2).
 *
 * Contains NO fabricated market facts: no listings, no leads, no claims,
 * no transactions, no licence numbers. Districts are geographic config only.
 * Listings appear when advertisers publish them through the compliance gate;
 * transactions appear when the MOJ/SREM ingestion worker loads real rows
 * (scripts/ingest-moj.mjs). Everything else renders an honest empty state.
 */
export function buildSeed(): Db {
  return {
    districts: DISTRICTS,
    listings: [],
    claimed: [],
    transactions: [],
    seededAt: new Date().toISOString(),
  };
}

export { DISTRICTS };
