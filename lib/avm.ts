import fs from "fs";
import path from "path";
import { District, FinishGrade, IngestedTx, Listing, PropertyType } from "./types";
import { inFreezeZone } from "./geo";
import { computeBaseline, Baseline } from "./baselines";

/**
 * تقدير فَنر — remediated model (brief Phases 2–3).
 *
 * Layer 1  district baseline — ONLY from ingested MOJ/SREM rows.
 * Layer 2  hedonic factors — read from the versioned config table
 *          (config/avm-factor-sets.json), compound multiplier clamped.
 * Layer 3  comparables — only rows carrying the full attribute set, so both
 *          subject and comp factor products are STORED on every rendered row:
 *          adjusted = raw × (Π subject_factors / Π comp_factors) × time_adj.
 *          Rent comparables additionally require Ejar-verified provenance.
 *
 * The model version and disclaimer are generated from the layers that
 * actually contributed. No baseline → no estimate (honest null). LOW
 * confidence with zero comps → never published.
 */

/* ---------------- factor set (versioned config, not code) ---------------- */

export interface FactorSet {
  version: string;
  effective_from: string;
  source: string;
  notes: string;
  clamp: { min: number; max: number };
  age_bands: { max_years: number; factor: number }[];
  finish: Record<FinishGrade, number>;
  street_width_bands: { max_m: number; factor: number }[];
  corner: number;
  orientation: Record<string, number>;
  floor_apartment: Record<string, number>;
  parking: Record<string, number>;
}

let cachedSets: FactorSet[] | null = null;

export function activeFactorSet(now = new Date()): FactorSet {
  if (!cachedSets) {
    const raw = fs.readFileSync(path.join(process.cwd(), "config", "avm-factor-sets.json"), "utf8");
    cachedSets = (JSON.parse(raw).sets as FactorSet[]).slice();
  }
  const applicable = cachedSets
    .filter((s) => new Date(s.effective_from) <= now)
    .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  if (!applicable.length) throw new Error("no active avm factor set");
  return applicable[0];
}

/* ---------------- subjects & factor breakdowns ---------------- */

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

export interface FactorBreakdown {
  key: string;
  factor: number;
}

function band(bands: { factor: number }[], keyField: string, v: number): number {
  for (const b of bands as Array<Record<string, number>>) {
    if (v <= b[keyField]) return b.factor;
  }
  return 1;
}

export function factorBreakdown(s: {
  propertyType: PropertyType;
  ageYears: number;
  finishGrade: FinishGrade;
  streetWidthM: number;
  corner: boolean;
  orientation: string;
  floor: number | null;
  elevator: boolean;
  parkingSpaces: number;
}, set: FactorSet): FactorBreakdown[] {
  const out: FactorBreakdown[] = [
    { key: "age", factor: band(set.age_bands, "max_years", s.ageYears) },
    { key: "finish", factor: set.finish[s.finishGrade] ?? 1 },
    { key: "street_width", factor: band(set.street_width_bands, "max_m", s.streetWidthM) },
    { key: "orientation", factor: set.orientation[s.orientation] ?? 1 },
  ];
  if (s.corner) out.push({ key: "corner", factor: set.corner });
  if (s.propertyType === "apartment") {
    const f = s.floor;
    const fp = set.floor_apartment;
    const factor =
      f == null ? 1 : f === 0 ? fp.ground : f <= 3 ? fp.low_1_3 : !s.elevator ? fp.no_lift_4p : f <= 7 ? fp.mid_4_7_lift : fp.high_8p_lift;
    out.push({ key: "floor", factor });
  }
  out.push({
    key: "parking",
    factor: s.parkingSpaces === 0 ? set.parking.none : s.parkingSpaces >= 2 ? set.parking.two_plus : set.parking.one,
  });
  return out;
}

export function product(fs_: FactorBreakdown[]): number {
  return fs_.reduce((a, f) => a * f.factor, 1);
}

/** Clamp the compound multiplier (remediation §3.2). */
export function clampMultiplier(raw: number, set: FactorSet): { value: number; bound: boolean } {
  const v = Math.min(set.clamp.max, Math.max(set.clamp.min, raw));
  return { value: v, bound: v !== raw };
}

/* ---------------- comparables (integrity per §3.1) ---------------- */

export interface ComparableRow {
  id: string;
  source: string;
  sourceReference: string;
  raw: number;
  areaM2: number;
  daysAgo: number;
  subjectFactorProduct: number;
  compFactorProduct: number;
  subjectFactors: FactorBreakdown[];
  compFactors: FactorBreakdown[];
  timeAdjustment: number;
  adjusted: number;
  weight: number;
}

function hasFullAttributes(t: IngestedTx): boolean {
  const base =
    t.ageYears != null && t.finishGrade != null && t.streetWidthM != null &&
    t.corner != null && t.orientation != null && t.parkingSpaces != null;
  if (!base) return false;
  if (t.propertyType === "apartment") return t.floor !== undefined && t.elevator != null;
  return true;
}

/** Recompute an adjusted value from stored parts — the §3.1 integrity function. */
export function recomputeAdjusted(row: {
  raw: number;
  subjectFactorProduct: number;
  compFactorProduct: number;
  timeAdjustment: number;
}): number {
  return row.raw * (row.subjectFactorProduct / row.compFactorProduct) * row.timeAdjustment;
}

function kmBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = (aLat - bLat) * 110.6;
  const dLng = (aLng - bLng) * 101.1;
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

export function selectComparables(
  transactions: IngestedTx[],
  s: Subject,
  d: District,
  kind: "sale" | "rent",
  set: FactorSet,
  /** monthly drift used for time adjustment; derived from ingested data, 0 when unknown */
  monthlyDriftPct: number
): ComparableRow[] {
  // Rent comps only from Ejar-verified records (§3.5)
  const eligible = transactions.filter(
    (t) =>
      t.kind === kind &&
      t.districtId === d.id &&
      t.propertyType === s.propertyType &&
      (Date.now() - new Date(t.dateISO).getTime()) / 86400000 <= 270 &&
      Math.abs(t.areaM2 - s.areaM2) / s.areaM2 <= 0.25 &&
      hasFullAttributes(t) &&
      (kind === "sale" || t.rentVerification === "ejar_verified")
  );

  const subjFactors = factorBreakdown(s, set);
  const subjProduct = product(subjFactors);
  const subLat = s.lat ?? d.center[1];
  const subLng = s.lng ?? d.center[0];

  const rows = eligible.map((t) => {
    const daysAgo = Math.floor((Date.now() - new Date(t.dateISO).getTime()) / 86400000);
    const compFactors = factorBreakdown(
      {
        propertyType: t.propertyType,
        ageYears: t.ageYears!,
        finishGrade: t.finishGrade!,
        streetWidthM: t.streetWidthM!,
        corner: t.corner!,
        orientation: t.orientation!,
        floor: t.floor ?? null,
        elevator: t.elevator ?? false,
        parkingSpaces: t.parkingSpaces!,
      },
      set
    );
    const compProduct = product(compFactors);
    const timeAdjustment = 1 + (monthlyDriftPct / 100) * (daysAgo / 30);
    const adjusted = recomputeAdjusted({
      raw: t.price,
      subjectFactorProduct: subjProduct,
      compFactorProduct: compProduct,
      timeAdjustment,
    });
    const recency = Math.pow(0.5, daysAgo / 180);
    const proximity = 1 / (1 + kmBetween(subLat, subLng, d.center[1], d.center[0]));
    const areaSim = 1 - Math.abs(t.areaM2 - s.areaM2) / s.areaM2;
    return {
      id: t.id,
      source: t.source,
      sourceReference: t.sourceReference,
      raw: t.price,
      areaM2: t.areaM2,
      daysAgo,
      subjectFactorProduct: Math.round(subjProduct * 10000) / 10000,
      compFactorProduct: Math.round(compProduct * 10000) / 10000,
      subjectFactors: subjFactors,
      compFactors,
      timeAdjustment: Math.round(timeAdjustment * 10000) / 10000,
      adjusted: Math.round(adjusted),
      weight: Math.round(recency * proximity * areaSim * 1000) / 1000,
      _score: recency * 0.5 + areaSim * 0.5,
    };
  });

  return rows
    .sort((a, b) => b._score - a._score)
    .slice(0, 12)
    .map(({ _score, ...row }) => row);
}

/* ---------------- estimate ---------------- */

export type EstimateResult =
  | {
      available: true;
      value: number;
      low: number;
      high: number;
      confidence: "high" | "medium" | "low";
      layers: string[];
      modelVersion: string;
      disclaimer: string;
      baseline: Baseline;
      factorSetVersion: string;
      subjectFactors: FactorBreakdown[];
      rawMultiplier: number;
      cappedMultiplier: number;
      multiplierCapBound: boolean;
      hedonicEstimate: number;
      compEstimate: number | null;
      compsWeight: number;
      compsUsed: ComparableRow[];
      flags: string[];
    }
  | {
      available: false;
      reason: "no_baseline" | "insufficient_confidence";
      message: string;
    };

function round500(n: number) {
  return Math.round(n / 500) * 500;
}

export function w2For(count: number): number {
  if (count >= 8) return 0.7;
  if (count >= 5) return 0.55;
  if (count >= 3) return 0.4;
  return 0;
}

export function confidenceFor(count: number): "high" | "medium" | "low" {
  if (count >= 8) return "high";
  if (count >= 3) return "medium";
  return "low";
}

export function estimateFromRows(
  transactions: IngestedTx[],
  s: Subject,
  d: District,
  kind: "sale" | "rent"
): EstimateResult {
  const set = activeFactorSet();
  const baseline = computeBaseline(transactions, d.id, kind);
  if (!baseline) {
    return {
      available: false,
      reason: "no_baseline",
      message: "بيانات غير كافية لهذا الحي — لا صفقات مرجعية كافية بعد",
    };
  }

  const flags: string[] = [];
  const subjectFactors = factorBreakdown(s, set);
  const rawMultiplier = product(subjectFactors);
  const { value: cappedMultiplier, bound } = clampMultiplier(rawMultiplier, set);
  if (bound) {
    flags.push(
      `hedonic multiplier clamped: raw=${rawMultiplier.toFixed(3)} → ${cappedMultiplier.toFixed(3)} (factor set ${set.version} needs re-fit)`
    );
  }
  const hedonicEstimate = baseline.medianM2 * s.areaM2 * (s.propertyType === "land" ? 1 : cappedMultiplier);

  const comps = s.propertyType === "land" ? [] : selectComparables(transactions, s, d, kind, set, 0);
  const w2 = w2For(comps.length);
  const compEstimate = w2 > 0 ? weightedMedian(comps.map((c) => ({ v: c.adjusted, w: c.weight }))) : null;
  const confidence = confidenceFor(comps.length);

  // Never publish LOW confidence with zero comparables (§3.4)
  if (confidence === "low" && comps.length === 0) {
    return {
      available: false,
      reason: "insufficient_confidence",
      message: "بيانات غير كافية لهذا الحي — يوجد خط أساس لكن لا صفقات مشابهة قابلة للاستخدام",
    };
  }

  const value = compEstimate != null ? (1 - w2) * hedonicEstimate + w2 * compEstimate : hedonicEstimate;

  let dispersion = 0.16;
  if (compEstimate != null && comps.length >= 3) {
    const devs = comps.map((c) => Math.abs(c.adjusted - compEstimate) / compEstimate).sort((a, b) => a - b);
    dispersion = devs[Math.floor(devs.length / 2)];
  }
  const spread = Math.min(0.22, Math.max(0.06, dispersion * 1.4 + (0.14 - w2 * 0.12) + baseline.fallbackPenalty));

  const layers = ["L1", "L2", ...(w2 > 0 ? ["L3"] : [])];
  const modelVersion = `${layers.join("+")}@${set.version}`;
  const disclaimer =
    `تقدير فَنر مؤشر سوقي استرشادي وليس تقييماً عقارياً معتمداً. ` +
    (w2 > 0
      ? `مبني على خط أساس الحي (${baseline.txCount} صفقة مرجعية) وعوامل السمات و${comps.length} صفقة مشابهة موثّقة المصدر.`
      : `مبني على خط أساس الحي (${baseline.txCount} صفقة مرجعية) وعوامل السمات فقط — طبقة الصفقات المشابهة لم تُسهم في هذا التقدير ولا يُعرض لها جدول.`) +
    (baseline.fallbackLevel !== "district" ? ` خط الأساس محسوب على مستوى ${baseline.fallbackLevel === "zone" ? "النطاق" : "المدينة"} لقلة صفقات الحي.` : "");

  return {
    available: true,
    value: round500(value),
    low: round500(value * (1 - spread)),
    high: round500(value * (1 + spread)),
    confidence,
    layers,
    modelVersion,
    disclaimer,
    baseline,
    factorSetVersion: set.version,
    subjectFactors,
    rawMultiplier: Math.round(rawMultiplier * 10000) / 10000,
    cappedMultiplier: Math.round(cappedMultiplier * 10000) / 10000,
    multiplierCapBound: bound,
    hedonicEstimate: round500(hedonicEstimate),
    compEstimate: compEstimate != null ? round500(compEstimate) : null,
    compsWeight: w2,
    compsUsed: comps,
    flags,
  };
}

/* ---------------- guardrails (§3.6) ---------------- */

export function yieldGuardrailFromRows(
  transactions: IngestedTx[],
  s: Subject,
  d: District
): { yieldPct: number; ok: boolean } | null {
  const sale = estimateFromRows(transactions, s, d, "sale");
  const rent = estimateFromRows(transactions, s, d, "rent");
  if (!sale.available || !rent.available) return null;
  const yieldPct = (rent.value / sale.value) * 100;
  return { yieldPct: Math.round(yieldPct * 10) / 10, ok: yieldPct >= 3 && yieldPct <= 10 };
}

/* ---------------- legal rent (unchanged rule; advertiser-declared cap) ---------------- */

export function legalRentFor(l: Listing, d: District, transactions: IngestedTx[] = []) {
  const inside = inFreezeZone(l.lng, l.lat);
  const market = l.listingType === "rent" ? estimateFromRows(transactions, l, d, "rent") : null;
  if (!inside || l.listingType !== "rent") {
    return { insideFreezeZone: inside, freezeStatus: l.freezeStatus, legalCap: null, capSource: null, marketEstimate: market, verdict: "no_cap" as const };
  }
  if (l.freezeStatus === "currently_leased" || l.freezeStatus === "previously_leased_vacant") {
    if (l.lastEjarValue == null) {
      return { insideFreezeZone: true, freezeStatus: l.freezeStatus, legalCap: null, capSource: "آخر عقد موثّق في إيجار — غير متوفر لدى فَنر", marketEstimate: market, verdict: "unknown_cap" as const };
    }
    const verdict = l.price > l.lastEjarValue ? ("above_cap" as const) : ("within_cap" as const);
    return {
      insideFreezeZone: true,
      freezeStatus: l.freezeStatus,
      legalCap: l.lastEjarValue,
      capSource: "آخر عقد موثّق في «إيجار» قبل 25 سبتمبر 2025 — كما أقرّ به المُعلن",
      marketEstimate: market,
      verdict,
    };
  }
  return { insideFreezeZone: true, freezeStatus: l.freezeStatus, legalCap: null, capSource: "لم يؤجَّر سابقاً — تُحدد القيمة بالاتفاق ثم تُجمَّد", marketEstimate: market, verdict: "no_cap" as const };
}
