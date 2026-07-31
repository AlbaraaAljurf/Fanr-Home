import { IngestedTx } from "./types";
import { DISTRICTS } from "./districts";

/**
 * Layer-1 district baselines — computed ONLY from ingested MOJ/SREM rows
 * (PRD §7.2): trailing 12 months, winsorised at the 5th/95th percentile,
 * minimum 8 transactions; fallback to parent zone, then city, each step
 * adding a widening confidence penalty. No baseline ⇒ honest null.
 */

export interface Baseline {
  medianM2: number;
  txCount: number;
  fallbackLevel: "district" | "zone" | "city";
  /** extra relative range width added by fallback (0, 0.04, 0.08) */
  fallbackPenalty: number;
  windowDays: number;
}

const WINDOW_DAYS = 365;
const MIN_TX = 8;

function winsorisedMedianM2(rows: IngestedTx[]): number {
  const vals = rows
    .filter((t) => t.areaM2 > 0 && t.price > 0)
    .map((t) => t.price / t.areaM2)
    .sort((a, b) => a - b);
  if (!vals.length) return 0;
  const lo = vals[Math.floor(vals.length * 0.05)];
  const hi = vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.95))];
  const w = vals.map((v) => Math.min(hi, Math.max(lo, v)));
  const m = Math.floor(w.length / 2);
  return w.length % 2 ? w[m] : (w[m - 1] + w[m]) / 2;
}

function inWindow(t: IngestedTx): boolean {
  return Date.now() - new Date(t.dateISO).getTime() <= WINDOW_DAYS * 86400000;
}

export function computeBaseline(
  transactions: IngestedTx[],
  districtId: string,
  kind: "sale" | "rent"
): Baseline | null {
  const d = DISTRICTS.find((x) => x.id === districtId);
  if (!d) return null;
  const usable = (t: IngestedTx) =>
    t.kind === kind &&
    inWindow(t) &&
    t.propertyType !== "land" &&
    // rent rows must be provenance-verified before they may drive baselines
    (kind === "sale" || t.rentVerification === "ejar_verified" || t.rentVerification === "user_verified");

  const inDistrict = transactions.filter((t) => usable(t) && t.districtId === districtId);
  if (inDistrict.length >= MIN_TX) {
    return { medianM2: Math.round(winsorisedMedianM2(inDistrict)), txCount: inDistrict.length, fallbackLevel: "district", fallbackPenalty: 0, windowDays: WINDOW_DAYS };
  }

  const zoneIds = DISTRICTS.filter((x) => x.parentZone === d.parentZone).map((x) => x.id);
  const inZone = transactions.filter((t) => usable(t) && zoneIds.includes(t.districtId));
  if (inZone.length >= MIN_TX) {
    return { medianM2: Math.round(winsorisedMedianM2(inZone)), txCount: inZone.length, fallbackLevel: "zone", fallbackPenalty: 0.04, windowDays: WINDOW_DAYS };
  }

  const inCity = transactions.filter(usable);
  if (inCity.length >= MIN_TX) {
    return { medianM2: Math.round(winsorisedMedianM2(inCity)), txCount: inCity.length, fallbackLevel: "city", fallbackPenalty: 0.08, windowDays: WINDOW_DAYS };
  }
  return null;
}
