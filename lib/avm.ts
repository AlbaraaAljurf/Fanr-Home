import { District, Estimate, FinishGrade, Listing, PropertyType } from "./types";
import { inFreezeZone } from "./geo";

/**
 * تقدير فَنر — AVM Layers 1–2 (PRD Part VII).
 * Layer 1: district baseline (median SAR/m², trailing 12m) — seeded per district.
 * Layer 2: hedonic multiplicative factors — the PRD's initial priors, stored as a
 * versioned factor set (never hard-coded inline; re-fit by regression once
 * ≥5,000 transactions/city are ingested).
 * Layer 3 (comparables) is Phase 2.
 */

export const AVM_FACTOR_SET = {
  version: "priors-v1",
  age: (years: number) =>
    years <= 0 ? 1.05 : years <= 5 ? 1.0 : years <= 10 ? 0.94 : years <= 20 ? 0.86 : years <= 30 ? 0.78 : 0.72,
  finish: { economy: 0.82, standard: 1.0, premium: 1.15, luxury: 1.3 } as Record<FinishGrade, number>,
  streetWidth: (m: number) => (m < 10 ? 0.94 : m <= 15 ? 1.0 : m <= 20 ? 1.05 : m <= 30 ? 1.09 : 1.12),
  corner: (isCorner: boolean) => (isCorner ? 1.06 : 1.0),
  orientation: { north: 1.04, east: 1.02, west: 0.99, south: 0.97 } as Record<string, number>,
  floorApartment: (floor: number | null, elevator: boolean) => {
    if (floor === null) return 1.0;
    if (floor === 0) return 0.95;
    if (floor <= 3) return 1.0;
    if (!elevator) return 0.93;
    return floor <= 7 ? 1.03 : 1.06;
  },
  elevatorPenalty: (floors: number | null, elevator: boolean) =>
    floors !== null && floors >= 4 && !elevator ? 0.9 : 1.0,
  parking: (spaces: number) => (spaces === 0 ? 0.96 : spaces >= 2 ? 1.04 : 1.0),
};

interface Subject {
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

function confidenceFor(txCount: number): { conf: Estimate["confidence"]; spread: number } {
  // Layers 1–2 only: confidence driven by district transaction density (PRD §7.2
  // fallback logic). Comparable-driven confidence arrives with Layer 3.
  if (txCount >= 150) return { conf: "high", spread: 0.09 };
  if (txCount >= 90) return { conf: "medium", spread: 0.14 };
  return { conf: "low", spread: 0.2 };
}

function round500(n: number) {
  return Math.round(n / 500) * 500;
}

export function estimateSale(s: Subject, d: District): Estimate {
  const factors = hedonicFactors(s);
  const mult = factors.reduce((a, f) => a * f.factor, 1);
  const value = d.basePriceM2Sale * s.areaM2 * mult;
  const { conf, spread } = confidenceFor(d.txCount12m);
  return {
    value: round500(value),
    low: round500(value * (1 - spread)),
    high: round500(value * (1 + spread)),
    confidence: conf,
    basisTxCount: d.txCount12m,
    districtBaseM2: d.basePriceM2Sale,
    factorsApplied: factors,
    modelVersion: `L1L2-${AVM_FACTOR_SET.version}`,
  };
}

export function estimateRent(s: Subject, d: District): Estimate {
  const factors = hedonicFactors(s);
  const mult = factors.reduce((a, f) => a * f.factor, 1);
  const value = d.baseRentM2Annual * s.areaM2 * mult;
  const { conf, spread } = confidenceFor(d.txCount12m);
  return {
    value: round500(value),
    low: round500(value * (1 - spread)),
    high: round500(value * (1 + spread)),
    confidence: conf,
    basisTxCount: d.txCount12m,
    districtBaseM2: d.baseRentM2Annual,
    factorsApplied: factors,
    modelVersion: `L1L2-${AVM_FACTOR_SET.version}`,
  };
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
  // never_leased: rent set by agreement, then frozen
  return { insideFreezeZone: true, freezeStatus: l.freezeStatus, legalCap: null, capSource: "لم يؤجَّر سابقاً — تُحدد القيمة بالاتفاق ثم تُجمَّد", marketEstimate: market, verdict: "no_cap" as const };
}

/** Yield sanity guardrail (PRD §7.2): implied gross yield must sit in 3–10%. */
export function impliedYieldPct(salePrice: number, annualRent: number): number {
  return (annualRent / salePrice) * 100;
}
