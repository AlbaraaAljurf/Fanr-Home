/**
 * AVM + compliance unit tests (remediation §3.1–§3.5, §4.1).
 * Run: npm test. TEST FIXTURES ONLY — this data never reaches a user surface;
 * the fabrication guard bans randomness, and these rows are deterministic
 * literals exercising the pure model functions.
 */
import {
  estimateFromRows,
  selectComparables,
  recomputeAdjusted,
  activeFactorSet,
  factorBreakdown,
  product,
  clampMultiplier,
  w2For,
  confidenceFor,
  Subject,
} from "../lib/avm";
import { valueBadgeFor } from "../lib/complianceUi";
import { DISTRICTS } from "../lib/districts";
import { IngestedTx } from "../lib/types";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✕ ${name} ${detail}`);
  }
}

const d = DISTRICTS.find((x) => x.id === "al-malqa")!;
const daysAgoISO = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

function fixtureRow(i: number, over: Partial<IngestedTx> = {}): IngestedTx {
  return {
    id: `fx-${i}`,
    source: "TEST-FIXTURE",
    sourceReference: `FX-${i}`,
    asOfDate: "2026-07-01",
    districtId: "al-malqa",
    kind: "sale",
    propertyType: "apartment",
    areaM2: 150 + i * 4,
    price: 800000 + i * 22000,
    dateISO: daysAgoISO(20 + i * 15),
    ageYears: 3 + (i % 4),
    finishGrade: (["standard", "premium", "standard", "economy"] as const)[i % 4],
    streetWidthM: [15, 20, 15, 12][i % 4],
    corner: i % 5 === 0,
    orientation: (["north", "east", "south", "west"] as const)[i % 4],
    floor: (i % 6) as number,
    elevator: i % 3 !== 0,
    parkingSpaces: 1 + (i % 2),
    ...over,
  };
}

const subject: Subject = {
  propertyType: "apartment",
  areaM2: 155,
  ageYears: 4,
  finishGrade: "standard",
  floor: 2,
  elevator: true,
  parkingSpaces: 1,
  streetWidthM: 15,
  corner: false,
  orientation: "north",
};

console.log("§3.3 factor set from versioned config");
const set = activeFactorSet();
check("active set resolved", set.version.length > 0, set.version);
check("clamp bounds present", set.clamp.min === 0.8 && set.clamp.max === 1.25);

console.log("§3.1 comparable integrity — adjusted follows from raw by the stored function");
const rows10 = Array.from({ length: 10 }, (_, i) => fixtureRow(i));
const comps = selectComparables(rows10, subject, d, "sale", set, 0);
check("comparables selected", comps.length >= 8, String(comps.length));
for (const c of comps) {
  const recomputed = recomputeAdjusted(c);
  const relErr = Math.abs(c.adjusted - recomputed) / c.raw;
  check(
    `comp ${c.id}: |displayed−recomputed|/raw < 0.005`,
    relErr < 0.005,
    `relErr=${relErr.toFixed(6)}`
  );
  const expectedRatio = c.subjectFactorProduct / c.compFactorProduct;
  const actualRatio = c.adjusted / (c.raw * c.timeAdjustment);
  check(
    `comp ${c.id}: ratio equals factor ratio`,
    Math.abs(actualRatio - expectedRatio) / expectedRatio < 0.005,
    `${actualRatio.toFixed(4)} vs ${expectedRatio.toFixed(4)}`
  );
  check(`comp ${c.id}: both factor sets stored`, c.subjectFactors.length > 0 && c.compFactors.length > 0);
}

console.log("§3.1 displayed count equals rows rendered");
const est10 = estimateFromRows(rows10, subject, d, "sale");
check("estimate available with 10 rows", est10.available);
if (est10.available) {
  check("compsUsed length is the displayed count", est10.compsUsed.length === comps.length);
  check("layers include L3 when comps weigh in", est10.layers.includes("L3"));
  check("model version generated from layers", est10.modelVersion.startsWith("L1+L2+L3@"));
  check("disclaimer mentions comps count", est10.disclaimer.includes(String(est10.compsUsed.length)));
}

console.log("§3.2 compound multiplier clamp 0.80–1.25");
const maxed: Subject = {
  propertyType: "apartment", areaM2: 150, ageYears: 0, finishGrade: "luxury",
  floor: 8, elevator: true, parkingSpaces: 2, streetWidthM: 35, corner: true, orientation: "north",
};
const rawMult = product(factorBreakdown(maxed, set));
check("stacked factors exceed cap in raw form", rawMult > 1.25, rawMult.toFixed(3));
const clamped = clampMultiplier(rawMult, set);
check("clamped to 1.25", clamped.value === 1.25 && clamped.bound);
const estMaxed = estimateFromRows(rows10, maxed, d, "sale");
check("clamp binding is logged as a flag", estMaxed.available && estMaxed.flags.some((f) => f.includes("clamped")));

console.log("§3.4 confidence table & layer honesty");
check("w2(8)=0.70", w2For(8) === 0.7);
check("w2(5)=0.55", w2For(5) === 0.55);
check("w2(3)=0.40", w2For(3) === 0.4);
check("w2(2)=0", w2For(2) === 0);
check("conf(8)=high", confidenceFor(8) === "high");
check("conf(5)=medium", confidenceFor(5) === "medium");
check("conf(3)=medium", confidenceFor(3) === "medium");
check("conf(2)=low", confidenceFor(2) === "low");

// 9 baseline rows but only 2 with attributes → LOW + comps<3 ⇒ comps table hidden, w2=0
const rowsThin = [
  ...Array.from({ length: 7 }, (_, i) =>
    fixtureRow(i, { ageYears: undefined, finishGrade: undefined, streetWidthM: undefined, corner: undefined, orientation: undefined, parkingSpaces: undefined })
  ),
  fixtureRow(7),
  fixtureRow(8),
];
const estThin = estimateFromRows(rowsThin, subject, d, "sale");
check("thin comps → still published (2 eligible ⇒ LOW but not zero)", estThin.available);
if (estThin.available) {
  check("thin comps → w2=0, no comp estimate", estThin.compsWeight === 0 && estThin.compEstimate === null);
  check("thin comps → comps table hidden (zero rendered rows)", estThin.compsUsed.length === 0);
  check("thin comps → L3 absent from layers", !estThin.layers.includes("L3"));
  check("thin comps → disclaimer says comps did not contribute", estThin.disclaimer.includes("لم تُسهم"));
}

// no attribute rows at all → comps=0 & LOW ⇒ never published
const rowsNoAttr = Array.from({ length: 9 }, (_, i) =>
  fixtureRow(i, { ageYears: undefined, finishGrade: undefined, streetWidthM: undefined, corner: undefined, orientation: undefined, parkingSpaces: undefined })
);
const estNone = estimateFromRows(rowsNoAttr, subject, d, "sale");
check("LOW + zero comps → estimate not published", !estNone.available && estNone.reason === "insufficient_confidence");

console.log("§3.4 no baseline → honest null");
const estEmpty = estimateFromRows([], subject, d, "sale");
check("no rows → unavailable(no_baseline)", !estEmpty.available && estEmpty.reason === "no_baseline");

console.log("§3.5 rent comparables require Ejar-verified provenance");
const rentRows = Array.from({ length: 10 }, (_, i) =>
  fixtureRow(i, { kind: "rent", price: 60000 + i * 1500, rentVerification: "unverified" })
);
const rentComps = selectComparables(rentRows, subject, d, "rent", set, 0);
check("unverified rent rows yield zero comps", rentComps.length === 0);
const rentVerified = rentRows.map((r) => ({ ...r, rentVerification: "ejar_verified" as const }));
check("ejar-verified rent rows are eligible", selectComparables(rentVerified, subject, d, "rent", set, 0).length > 0);

console.log("§4.1 value-badge suppression when over legal cap");
check("over-cap → no badge even 24% below estimate", valueBadgeFor(85000, 112000, "above_cap") === null);
check("within-cap below estimate → gold badge", valueBadgeFor(62000, 70000, "within_cap")?.kind === "below_estimate");
check("no estimate → no badge", valueBadgeFor(62000, null, "within_cap") === null);
check("no cap, above estimate → warn badge", valueBadgeFor(90000, 80000, "no_cap")?.kind === "above_estimate");

if (failures) {
  console.error(`\n✕ ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\n✓ all AVM & compliance assertions passed");
