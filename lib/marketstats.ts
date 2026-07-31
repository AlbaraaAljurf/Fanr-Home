import { IngestedTx, PropertyType } from "./types";

/**
 * District analytics — computed ONLY from ingested MOJ/SREM rows.
 * Districts without sufficient ingested data return null and the UI
 * renders an honest empty state (remediation §2.3, Phase 5.6).
 */

export interface DistrictStats {
  saleMedianM2: number;
  saleCount12m: number;
  trendPct: number | null; // recent 6m vs prior 6m; null when either half is thin
  mix: { type: PropertyType; pct: number }[];
  monthlyMedianM2: (number | null)[]; // 12 buckets oldest→newest; null = no data that month
  sources: string[];
  latestAsOf: string | null;
}

const MIN_TX = 8;

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function daysAgo(t: IngestedTx): number {
  return (Date.now() - new Date(t.dateISO).getTime()) / 86400000;
}

export function districtStats(transactions: IngestedTx[], districtId: string): DistrictStats | null {
  const rows = transactions.filter(
    (t) => t.districtId === districtId && t.kind === "sale" && daysAgo(t) <= 365 && t.areaM2 > 0 && t.price > 0
  );
  const nonLand = rows.filter((t) => t.propertyType !== "land");
  if (nonLand.length < MIN_TX) return null;

  const m2 = (t: IngestedTx) => t.price / t.areaM2;

  const recent = nonLand.filter((t) => daysAgo(t) <= 182).map(m2);
  const prior = nonLand.filter((t) => daysAgo(t) > 182).map(m2);
  const trendPct =
    recent.length >= 4 && prior.length >= 4
      ? Math.round(((median(recent) - median(prior)) / median(prior)) * 1000) / 10
      : null;

  const byType = new Map<PropertyType, number>();
  for (const t of rows) byType.set(t.propertyType, (byType.get(t.propertyType) ?? 0) + 1);
  const mix = Array.from(byType.entries())
    .map(([type, n]) => ({ type, pct: Math.round((n / rows.length) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  const monthlyMedianM2: (number | null)[] = [];
  for (let m = 11; m >= 0; m--) {
    const bucket = nonLand.filter((t) => daysAgo(t) >= m * 30 && daysAgo(t) < (m + 1) * 30).map(m2);
    monthlyMedianM2.push(bucket.length >= 3 ? Math.round(median(bucket)) : null);
  }

  const sources = Array.from(new Set(rows.map((t) => t.source)));
  const latestAsOf = rows.map((t) => t.asOfDate).sort().at(-1) ?? null;

  return {
    saleMedianM2: Math.round(median(nonLand.map(m2))),
    saleCount12m: nonLand.length,
    trendPct,
    mix,
    monthlyMedianM2,
    sources,
    latestAsOf,
  };
}
