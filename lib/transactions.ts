import { District, FinishGrade, PropertyType } from "./types";
import { DISTRICTS } from "./seed";
import { AVM_FACTOR_SET } from "./factors";

/**
 * Transaction corpus — stands in for the MOJ/SREM ETL (fanr-ingestion-worker).
 * Generated deterministically (seeded PRNG) so estimates are stable across
 * restarts without persisting thousands of rows; the production worker writes
 * real records into the `transactions` table with the same shape.
 */

export interface Tx {
  id: string;
  districtId: string;
  kind: "sale" | "rent";
  propertyType: PropertyType;
  areaM2: number;
  price: number; // total SAR (sale) or annual rent
  daysAgo: number;
  lat: number;
  lng: number;
  ageYears: number;
  finishGrade: FinishGrade;
  streetWidthM: number;
  corner: boolean;
  orientation: "north" | "south" | "east" | "west";
  floor: number | null;
  elevator: boolean;
  parkingSpaces: number;
}

/** mulberry32 — small deterministic PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLASS_MIX: [PropertyType, number][] = [
  ["apartment", 0.5],
  ["villa", 0.25],
  ["floor", 0.1],
  ["duplex", 0.08],
  ["land", 0.07],
];

const AREA_RANGES: Record<PropertyType, [number, number]> = {
  apartment: [90, 210],
  villa: [250, 520],
  floor: [160, 260],
  duplex: [190, 300],
  land: [375, 900],
};

const FINISHES: FinishGrade[] = ["economy", "standard", "premium", "luxury"];
const ORIENTS = ["north", "south", "east", "west"] as const;
const STREETS = [10, 12, 15, 15, 20, 20, 25, 30];

function hedonicMult(t: {
  propertyType: PropertyType;
  ageYears: number;
  finishGrade: FinishGrade;
  streetWidthM: number;
  corner: boolean;
  orientation: string;
  floor: number | null;
  elevator: boolean;
  parkingSpaces: number;
}): number {
  const F = AVM_FACTOR_SET;
  let m =
    F.age(t.ageYears) *
    F.finish[t.finishGrade] *
    F.streetWidth(t.streetWidthM) *
    (F.orientation[t.orientation] ?? 1) *
    F.parking(t.parkingSpaces);
  if (t.corner) m *= F.corner(true);
  if (t.propertyType === "apartment") m *= F.floorApartment(t.floor, t.elevator);
  return m;
}

const cache = new Map<string, Tx[]>();

function genDistrict(d: District): Tx[] {
  const key = d.id;
  const hit = cache.get(key);
  if (hit) return hit;

  const seed = d.id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const r = rng(seed);
  const out: Tx[] = [];
  const counts: ["sale" | "rent", number][] = [
    ["sale", d.txCount12m],
    ["rent", Math.round(d.txCount12m * 1.3)],
  ];

  for (const [kind, count] of counts) {
    for (let i = 0; i < count; i++) {
      // property class by mix
      let p = r();
      let propertyType: PropertyType = "apartment";
      for (const [cls, w] of CLASS_MIX) {
        if (p < w) { propertyType = cls; break; }
        p -= w;
      }
      if (kind === "rent" && propertyType === "land") propertyType = "apartment";

      const [aMin, aMax] = AREA_RANGES[propertyType];
      const areaM2 = Math.round(aMin + r() * (aMax - aMin));
      const daysAgo = Math.floor(r() * 365);
      const ageYears = propertyType === "land" ? 0 : Math.floor(r() * r() * 24);
      const finishGrade = propertyType === "land" ? "standard" : FINISHES[Math.floor(r() * 4)];
      const streetWidthM = STREETS[Math.floor(r() * STREETS.length)];
      const corner = r() < 0.18;
      const orientation = ORIENTS[Math.floor(r() * 4)];
      const floor = propertyType === "apartment" ? Math.floor(r() * 8) : null;
      const elevator = propertyType === "apartment" ? floor! <= 2 ? r() < 0.6 : r() < 0.85 : false;
      const parkingSpaces = r() < 0.12 ? 0 : r() < 0.7 ? 1 : 2;

      const baseM2 = kind === "sale" ? d.basePriceM2Sale : d.baseRentM2Annual;
      const mult = propertyType === "land" ? 0.92 : hedonicMult({ propertyType, ageYears, finishGrade, streetWidthM, corner, orientation, floor, elevator, parkingSpaces });
      // price level at transaction date: today's base deflated by the district trend
      const trendAdj = 1 / (1 + (d.trend12mPct / 100) * (daysAgo / 365));
      const noise = 1 + (r() + r() + r() - 1.5) * 0.11; // ~±8% triangular-ish
      const price = Math.round((baseM2 * areaM2 * mult * trendAdj * noise) / 500) * 500;

      out.push({
        id: `${d.id}-${kind}-${i}`,
        districtId: d.id,
        kind,
        propertyType,
        areaM2,
        price,
        daysAgo,
        lat: d.center[1] + (r() - 0.5) * 0.02,
        lng: d.center[0] + (r() - 0.5) * 0.026,
        ageYears,
        finishGrade,
        streetWidthM,
        corner,
        orientation,
        floor,
        elevator,
        parkingSpaces,
      });
    }
  }
  cache.set(key, out);
  return out;
}

export function transactionsFor(districtId: string): Tx[] {
  const d = DISTRICTS.find((x) => x.id === districtId);
  return d ? genDistrict(d) : [];
}

export { hedonicMult };
