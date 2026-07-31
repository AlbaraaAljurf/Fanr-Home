import { District, Estimate, FinishGrade, Listing, PropertyType } from "./types";
import { inFreezeZone } from "./geo";
import { AVM_FACTOR_SET } from "./factors";
import { transactionsFor, hedonicMult, Tx } from "./transactions";

/**
 * تقدير فَنر — the three-layer hybrid (PRD Part VII).
 * Layer 1: district baseline (median SAR/m², trailing 12m).
 * Layer 2: hedonic multiplicative factors (versioned priors — lib/factors.ts).
 * Layer 3: comparable-sales reconciliation over the transaction corpus:
 *   same district & class, area ±25%, trailing 9 months → up to 12 nearest by
 *   composite distance; weighted median (recency half-life 6m × inverse
 *   distance × attribute similarity); final = w1·hedonic + w2·comps with w2
 *   scaled by comparable count. Range & confidence per §7.2.
 */

export { AVM_FACTOR_SET };

export interface Subject {
  propertyType: PropertyType;
  areaM2: number;
  ageYears: number;
  finishGrade: FinishGrade;
  floor: number | null;
  elevator: boolean;
  parkingSpaces: number;
  streetWidthM: number;
  corner: boolean;
  orientation: "north" | "south" | "east" | "west";
  lat?: number;
  lng?: number;
}

export interface Comparable {
  id: string;
  areaM2: number;
  price: number;
  adjustedPrice: number;
  daysAgo: number;
  distanceKm: number;
  weight: number;
}

export interface EstimateWithComps extends Estimate {
  compsUsed: Comparable[];
  compEstimate: number | null;
  hedonicEstimate: number;
  w2: number;
  insufficientData: boolean;
}

function hedonicFactors(s: Subject) {
  const F = AVM_FACTOR_SET;
  const factors: { key: string; factor: number }[] = [
    { key: "age", factor: F.age(s.ageYears) },
    { key: "finish", factor: F.finish[s.finishGrade] },
    { key: "street_width", factor: F.streetWidth(s.streetWidthM) },
    { key: "orientation", factor: F.orientation[s.orientation] ?? 1 },
  ];
  if (s.corner) factors.push({ key: "corner", factor: F.corner(true) });
  if (s.propertyType === "apartment")
    factors.push({ key: "floor", factor: F.floorApartment(s.floor, s.elevator) });
  factors.push({ key: "parking", factor: F.parking(s.parkingSpaces) });
  return factors;
}

function kmBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = (aLat - bLat) * 110.6;
  const dLng = (aLng - bLng) * 101.1; // ~cos(24.8°) × 111.3
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function weightedMedian(values: { v: number; w: number }[]): number {
  const sorted = [...values].sort((a, b) => a.v - b.v);
  const total = sorted.reduce((a, x) => a + x.w, 0);
  let acc = 0;
  for (const x of sorted) {
    acc += x.w;
    if (acc >= total / 2) return x.v;
  }
  return sorted[sorted.length - 1]?.v ?? 0;
}

function round500(n: number) {
  return Math.round(n / 500) * 500;
}

function selectComps(s: Subject, d: District, kind: "sale" | "rent"): Comparable[] {
  const txs = transactionsFor(d.id).filter(
    (t) =>
      t.kind === kind &&
      t.propertyType === s.propertyType &&
      t.daysAgo <= 270 &&
      Math.abs(t.areaM2 - s.areaM2) / s.areaM2 <= 0.25
  );
  const subLat = s.lat ?? d.center[1];
  const subLng = s.lng ?? d.center[0];
  const subjMult = hedonicMult(s as Parameters<typeof hedonicMult>[0]);

  const scored = txs.map((t) => {
    const distanceKm = kmBetween(subLat, subLng, t.lat, t.lng);
    const areaSim = 1 - Math.abs(t.areaM2 - s.areaM2) / s.areaM2; // 0.75–1
    const ageSim = 1 / (1 + Math.abs(t.ageYears - s.ageYears) / 10);
    const attrSim = areaSim * 0.6 + ageSim * 0.4;
    const recency = Math.pow(0.5, t.daysAgo / 180); // 6-month half-life
    const proximity = 1 / (1 + distanceKm);
    const weight = recency * proximity * attrSim;
    // adjust comp to the subject: hedonic ratio + temporal adjustment to today
    const compMult = hedonicMult(t);
    const trendToNow = 1 + (d.trend12mPct / 100) * (t.daysAgo / 365);
    const adjustedPrice = t.price * (subjMult / compMult) * trendToNow;
    const composite = recency * 0.4 + proximity * 0.3 + attrSim * 0.3;
    return { t, distanceKm, weight, adjustedPrice, composite };
  });

  return scored
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 12)
    .map(({ t, distanceKm, weight, adjustedPrice }) => ({
      id: t.id,
      areaM2: t.areaM2,
      price: t.price,
      adjustedPrice: round500(adjustedPrice),
      daysAgo: t.daysAgo,
      distanceKm: Math.round(distanceKm * 10) / 10,
      weight: Math.round(weight * 1000) / 1000,
    }));
}

function w2For(count: number): number {
  if (count >= 8) return 0.7;
  if (count >= 5) return 0.55;
  if (count >= 3) return 0.4;
  return 0;
}

function estimateCore(s: Subject, d: District, kind: "sale" | "rent"): EstimateWithComps {
  const factors = hedonicFactors(s);
  const mult = factors.reduce((a, f) => a * f.factor, 1);
  const baseM2 = kind === "sale" ? d.basePriceM2Sale : d.baseRentM2Annual;
  const hedonicEstimate = baseM2 * s.areaM2 * (s.propertyType === "land" ? 0.92 : mult);

  const comps = s.propertyType === "land" ? [] : selectComps(s, d, kind);
  const w2 = w2For(comps.length);
  const compEstimate =
    comps.length >= 3
      ? weightedMedian(comps.map((c) => ({ v: c.adjustedPrice, w: c.weight })))
      : null;

  const value =
    compEstimate != null ? (1 - w2) * hedonicEstimate + w2 * compEstimate : hedonicEstimate;

  // dispersion of adjusted comps around their median → range width
  let dispersion = 0.18;
  if (compEstimate != null && comps.length >= 3) {
    const devs = comps.map((c) => Math.abs(c.adjustedPrice - compEstimate) / compEstimate);
    dispersion = devs.sort((a, b) => a - b)[Math.floor(devs.length / 2)];
  }
  let spread = Math.min(0.22, Math.max(0.06, dispersion * 1.4 + (0.16 - w2 * 0.14)));

  let confidence: Estimate["confidence"];
  if (comps.length >= 8 && dispersion < 0.15 && spread <= 0.1) confidence = "high";
  else if (comps.length >= 8 && dispersion < 0.15) { confidence = "high"; spread = Math.min(spread, 0.1); }
  else if (comps.length >= 4 && spread <= 0.18) confidence = "medium";
  else confidence = "low";

  const insufficientData = confidence === "low" && comps.length === 0 && d.txCount12m < 90;

  return {
    value: round500(value),
    low: round500(value * (1 - spread)),
    high: round500(value * (1 + spread)),
    confidence,
    basisTxCount: comps.length > 0 ? comps.length : d.txCount12m,
    districtBaseM2: baseM2,
    factorsApplied: factors,
    modelVersion: `L1L2L3-${AVM_FACTOR_SET.version}`,
    compsUsed: comps,
    compEstimate: compEstimate != null ? round500(compEstimate) : null,
    hedonicEstimate: round500(hedonicEstimate),
    w2,
    insufficientData,
  };
}

export function estimateSale(s: Subject, d: District): EstimateWithComps {
  return estimateCore(s, d, "sale");
}

export function estimateRent(s: Subject, d: District): EstimateWithComps {
  return estimateCore(s, d, "rent");
}

/** Legal rent position for a rental listing (the wedge — PRD §7.3, E5). */
export function legalRentFor(l: Listing, d: District) {
  const inside = inFreezeZone(l.lng, l.lat);
  const market = estimateRent(l, d);
  if (!inside || l.listingType !== "rent") {
    return { insideFreezeZone: inside, freezeStatus: l.freezeStatus, legalCap: null, capSource: null, marketEstimate: market, verdict: "no_cap" as const };
  }
  if (l.freezeStatus === "currently_leased" || l.freezeStatus === "previously_leased_vacant") {
    if (l.lastEjarValue == null) {
      // Never guess the cap (PRD §7.3): explain the rule instead.
      return { insideFreezeZone: true, freezeStatus: l.freezeStatus, legalCap: null, capSource: "آخر عقد موثّق في إيجار — غير متوفر لدى فَنر", marketEstimate: market, verdict: "unknown_cap" as const };
    }
    const verdict = l.price > l.lastEjarValue ? ("above_cap" as const) : ("within_cap" as const);
    return {
      insideFreezeZone: true,
      freezeStatus: l.freezeStatus,
      legalCap: l.lastEjarValue,
      capSource: "آخر عقد موثّق في «إيجار» قبل 25 سبتمبر 2025",
      marketEstimate: market,
      verdict,
    };
  }
  return { insideFreezeZone: true, freezeStatus: l.freezeStatus, legalCap: null, capSource: "لم يؤجَّر سابقاً — تُحدد القيمة بالاتفاق ثم تُجمَّد", marketEstimate: market, verdict: "no_cap" as const };
}

/** Yield sanity guardrail (PRD §7.2): implied gross yield must sit in 3–10%. */
export function yieldGuardrail(s: Subject, d: District): { yieldPct: number; ok: boolean } | null {
  if (s.propertyType === "land") return null;
  const sale = estimateCore(s, d, "sale").value;
  const rent = estimateCore(s, d, "rent").value;
  if (!sale || !rent) return null;
  const yieldPct = (rent / sale) * 100;
  return { yieldPct: Math.round(yieldPct * 10) / 10, ok: yieldPct >= 3 && yieldPct <= 10 };
}
