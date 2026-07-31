import { transactionsFor } from "./transactions";
import { PropertyType } from "./types";

/** District analytics computed from the transaction corpus (E12 data pages). */

export interface DistrictStats {
  saleMedianM2: number;
  rentMedianM2: number;
  saleCount12m: number;
  rentCount12m: number;
  trendPct12m: number;
  mix: { type: PropertyType; pct: number }[];
  monthlyMedianM2: number[]; // 12 buckets, oldest → newest (sale, SAR/m²)
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function districtStats(districtId: string): DistrictStats {
  const txs = transactionsFor(districtId);
  const sales = txs.filter((t) => t.kind === "sale" && t.propertyType !== "land");
  const rents = txs.filter((t) => t.kind === "rent");

  const saleM2 = sales.map((t) => t.price / t.areaM2);
  const rentM2 = rents.map((t) => t.price / t.areaM2);

  // trend: median of most-recent 6 months vs prior 6 months
  const recent = sales.filter((t) => t.daysAgo <= 182).map((t) => t.price / t.areaM2);
  const prior = sales.filter((t) => t.daysAgo > 182).map((t) => t.price / t.areaM2);
  const trendPct12m =
    prior.length && recent.length
      ? Math.round(((median(recent) - median(prior)) / median(prior)) * 1000) / 10
      : 0;

  // property-type mix across all transactions
  const byType = new Map<PropertyType, number>();
  for (const t of txs) byType.set(t.propertyType, (byType.get(t.propertyType) ?? 0) + 1);
  const total = txs.length || 1;
  const mix = Array.from(byType.entries())
    .map(([type, n]) => ({ type, pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  const monthlyMedianM2: number[] = [];
  for (let m = 11; m >= 0; m--) {
    const bucket = sales
      .filter((t) => t.daysAgo >= m * 30 && t.daysAgo < (m + 1) * 30 + (m === 11 ? 10 : 0))
      .map((t) => t.price / t.areaM2);
    monthlyMedianM2.push(Math.round(median(bucket)) || 0);
  }
  // fill empty buckets by neighbour interpolation
  for (let i = 0; i < 12; i++) {
    if (!monthlyMedianM2[i]) {
      const prev = monthlyMedianM2.slice(0, i).reverse().find(Boolean) ?? 0;
      const next = monthlyMedianM2.slice(i + 1).find(Boolean) ?? prev;
      monthlyMedianM2[i] = Math.round((prev + next) / 2) || next;
    }
  }

  return {
    saleMedianM2: Math.round(median(saleM2)),
    rentMedianM2: Math.round(median(rentM2)),
    saleCount12m: sales.length,
    rentCount12m: rents.length,
    trendPct12m,
    mix,
    monthlyMedianM2,
  };
}
