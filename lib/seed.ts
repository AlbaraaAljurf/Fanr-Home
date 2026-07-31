import { Db, District, Listing, FreezeStatus, FinishGrade, PropertyType } from "./types";
import { boxRing } from "./geo";

/**
 * Seed data — Riyadh, rentals-first (PRD Phase 1).
 * District centers use real Riyadh coordinates; baselines are seeded from the
 * PRD Appendix A market reference ranges. In production, Layer-1 baselines are
 * computed from ingested MOJ/SREM transactions (fanr-ingestion-worker).
 */

const D = (
  id: string,
  nameAr: string,
  nameEn: string,
  center: [number, number],
  basePriceM2Sale: number,
  baseRentM2Annual: number,
  trend12mPct: number,
  txCount12m: number,
  avgDaysOnMarket: number
): District => ({
  id,
  nameAr,
  nameEn,
  center,
  polygon: boxRing(center),
  basePriceM2Sale,
  baseRentM2Annual,
  trend12mPct,
  txCount12m,
  avgDaysOnMarket,
});

export const DISTRICTS: District[] = [
  D("al-malqa", "الملقا", "Al Malqa", [46.63, 24.804], 5240, 376, 9.6, 214, 28),
  D("hittin", "حطين", "Hittin", [46.598, 24.776], 5620, 392, 8.2, 158, 31),
  D("al-narjis", "النرجس", "Al Narjis", [46.66, 24.855], 4310, 336, 11.4, 246, 24),
  D("al-yasmin", "الياسمين", "Al Yasmin", [46.649, 24.823], 4980, 352, 7.1, 187, 34),
  D("al-sahafah", "الصحافة", "Al Sahafah", [46.662, 24.799], 4720, 348, 6.8, 141, 30),
  D("qurtubah", "قرطبة", "Qurtubah", [46.756, 24.809], 3920, 302, 8.9, 176, 27),
  D("al-arid", "العارض", "Al Arid", [46.64, 24.878], 3810, 298, 12.2, 92, 26),
  D("al-rabi", "الربيع", "Al Rabi", [46.663, 24.833], 4650, 344, 6.2, 121, 33),
  D("al-olaya", "العليا", "Al Olaya", [46.685, 24.695], 5110, 381, 4.4, 133, 36),
  D("al-malaz", "الملز", "Al Malaz", [46.735, 24.674], 3140, 262, 3.1, 88, 41),
];

interface SeedSpec {
  district: string;
  type: PropertyType;
  listingType: "rent" | "sale";
  title: string;
  area: number;
  beds: number;
  baths: number;
  age: number;
  finish: FinishGrade;
  floor: number | null;
  elevator: boolean;
  parking: number;
  street: number;
  corner: boolean;
  orientation: "north" | "south" | "east" | "west";
  price: number;
  freeze?: FreezeStatus;
  lastEjar?: number;
  advertiser?: "owner";
  dLng: number;
  dLat: number;
  licenseExpiredDays?: number; // negative = already expired
}

const SPECS: SeedSpec[] = [
  { district: "al-malqa", type: "apartment", listingType: "rent", title: "شقة 3 غرف — الملقا، قريبة من المترو", area: 165, beds: 3, baths: 2, age: 4, finish: "premium", floor: 2, elevator: true, parking: 2, street: 20, corner: false, orientation: "north", price: 62000, freeze: "previously_leased_vacant", lastEjar: 62000, dLng: 0.004, dLat: 0.003 },
  { district: "al-malqa", type: "villa", listingType: "rent", title: "فيلا دورين وملحق — الملقا", area: 380, beds: 5, baths: 6, age: 6, finish: "premium", floor: null, elevator: false, parking: 2, street: 15, corner: true, orientation: "east", price: 145000, freeze: "never_leased", dLng: -0.006, dLat: 0.005 },
  { district: "al-malqa", type: "apartment", listingType: "rent", title: "شقة غرفتين — الملقا", area: 120, beds: 2, baths: 2, age: 2, finish: "standard", floor: 1, elevator: true, parking: 1, street: 15, corner: false, orientation: "west", price: 52000, freeze: "currently_leased", lastEjar: 48000, dLng: 0.008, dLat: -0.004 },
  { district: "hittin", type: "villa", listingType: "rent", title: "فيلا مودرن مع مسبح — حطين", area: 320, beds: 5, baths: 5, age: 3, finish: "luxury", floor: null, elevator: false, parking: 2, street: 20, corner: false, orientation: "north", price: 105000, freeze: "previously_leased_vacant", lastEjar: 95000, dLng: 0.003, dLat: -0.003 },
  { district: "hittin", type: "apartment", listingType: "rent", title: "شقة فاخرة 3 غرف — حطين", area: 175, beds: 3, baths: 3, age: 1, finish: "luxury", floor: 4, elevator: true, parking: 2, street: 25, corner: false, orientation: "north", price: 78000, freeze: "never_leased", dLng: -0.005, dLat: 0.004 },
  { district: "al-narjis", type: "apartment", listingType: "rent", title: "شقة غرفتين — النرجس، من المالك", area: 130, beds: 2, baths: 2, age: 0, finish: "standard", floor: 3, elevator: true, parking: 1, street: 15, corner: false, orientation: "east", price: 48000, freeze: "never_leased", advertiser: "owner", dLng: 0.005, dLat: 0.002 },
  { district: "al-narjis", type: "duplex", listingType: "rent", title: "دوبلكس 4 غرف — النرجس", area: 240, beds: 4, baths: 4, age: 2, finish: "premium", floor: null, elevator: false, parking: 2, street: 20, corner: true, orientation: "north", price: 85000, freeze: "previously_leased_vacant", lastEjar: 80000, dLng: -0.007, dLat: -0.005 },
  { district: "al-yasmin", type: "apartment", listingType: "rent", title: "شقة 3 غرف — الياسمين", area: 150, beds: 3, baths: 2, age: 5, finish: "standard", floor: 2, elevator: true, parking: 1, street: 15, corner: false, orientation: "south", price: 55000, freeze: "currently_leased", lastEjar: 55000, dLng: 0.004, dLat: 0.004 },
  { district: "al-yasmin", type: "floor", listingType: "rent", title: "دور علوي مستقل — الياسمين", area: 200, beds: 4, baths: 3, age: 8, finish: "standard", floor: 1, elevator: false, parking: 1, street: 15, corner: false, orientation: "west", price: 65000, freeze: "previously_leased_vacant", lastEjar: 58000, dLng: -0.006, dLat: 0.002 },
  { district: "al-sahafah", type: "apartment", listingType: "rent", title: "شقة غرفتين مؤثثة — الصحافة", area: 115, beds: 2, baths: 2, age: 3, finish: "premium", floor: 5, elevator: true, parking: 1, street: 20, corner: false, orientation: "north", price: 58000, freeze: "never_leased", dLng: 0.003, dLat: -0.004 },
  { district: "qurtubah", type: "apartment", listingType: "rent", title: "شقة 3 غرف — قرطبة", area: 155, beds: 3, baths: 2, age: 7, finish: "economy", floor: 1, elevator: false, parking: 1, street: 12, corner: false, orientation: "east", price: 44000, freeze: "previously_leased_vacant", lastEjar: 44000, advertiser: "owner", dLng: 0.005, dLat: 0.003 },
  { district: "qurtubah", type: "villa", listingType: "rent", title: "فيلا عائلية — قرطبة", area: 350, beds: 6, baths: 5, age: 10, finish: "standard", floor: null, elevator: false, parking: 2, street: 15, corner: false, orientation: "south", price: 90000, freeze: "currently_leased", lastEjar: 90000, dLng: -0.004, dLat: -0.004 },
  { district: "al-arid", type: "apartment", listingType: "rent", title: "شقة جديدة غرفتين — العارض", area: 125, beds: 2, baths: 2, age: 0, finish: "standard", floor: 2, elevator: true, parking: 1, street: 20, corner: false, orientation: "north", price: 42000, freeze: "never_leased", dLng: 0.004, dLat: 0.002 },
  { district: "al-rabi", type: "apartment", listingType: "rent", title: "شقة 3 غرف — الربيع", area: 160, beds: 3, baths: 2, age: 4, finish: "standard", floor: 3, elevator: true, parking: 1, street: 15, corner: false, orientation: "east", price: 57000, freeze: "previously_leased_vacant", lastEjar: 51000, dLng: -0.005, dLat: 0.003 },
  { district: "al-olaya", type: "apartment", listingType: "rent", title: "شقة تنفيذية — العليا", area: 140, beds: 2, baths: 2, age: 12, finish: "premium", floor: 8, elevator: true, parking: 1, street: 30, corner: false, orientation: "north", price: 68000, freeze: "currently_leased", lastEjar: 65000, dLng: 0.003, dLat: 0.004 },
  { district: "al-malaz", type: "apartment", listingType: "rent", title: "شقة اقتصادية — الملز", area: 110, beds: 2, baths: 1, age: 18, finish: "economy", floor: 2, elevator: false, parking: 0, street: 12, corner: false, orientation: "west", price: 30000, freeze: "previously_leased_vacant", lastEjar: 28000, dLng: 0.004, dLat: -0.003 },
  // A couple of sale listings (Phase 2 preview; keeps the sale toggle honest)
  { district: "al-malqa", type: "villa", listingType: "sale", title: "فيلا دورين وملحق للبيع — الملقا", area: 380, beds: 5, baths: 6, age: 4, finish: "premium", floor: null, elevator: false, parking: 2, street: 20, corner: true, orientation: "north", price: 1430000, dLng: 0.007, dLat: 0.006 },
  { district: "al-narjis", type: "land", listingType: "sale", title: "أرض سكنية زاوية — النرجس", area: 600, beds: 0, baths: 0, age: 0, finish: "standard", floor: null, elevator: false, parking: 0, street: 25, corner: true, orientation: "east", price: 2700000, dLng: 0.009, dLat: -0.006 },
  { district: "hittin", type: "apartment", listingType: "sale", title: "شقة تمليك 3 غرف — حطين", area: 170, beds: 3, baths: 3, age: 1, finish: "luxury", floor: 3, elevator: true, parking: 2, street: 20, corner: false, orientation: "north", price: 980000, dLng: -0.008, dLat: -0.005 },
  // One listing with an expired licence (feeds the admin pipeline demo)
  { district: "al-sahafah", type: "apartment", listingType: "rent", title: "شقة 3 غرف — الصحافة (رخصة منتهية)", area: 150, beds: 3, baths: 2, age: 6, finish: "standard", floor: 2, elevator: true, parking: 1, street: 15, corner: false, orientation: "south", price: 54000, freeze: "previously_leased_vacant", lastEjar: 50000, dLng: -0.004, dLat: 0.004, licenseExpiredDays: -3 },
];

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString();
}

export function buildSeed(): Db {
  const listings: Listing[] = SPECS.map((s, i) => {
    const d = DISTRICTS.find((x) => x.id === s.district)!;
    const n = 42900 + i * 37;
    const expired = (s.licenseExpiredDays ?? 365) < 0;
    return {
      id: `l${1000 + i}`,
      ref: `FNR-RYD-${String(n).padStart(8, "0")}`,
      listingType: s.listingType,
      propertyType: s.type,
      status: expired ? "expired" : "live",
      title: s.title,
      description:
        "عقار ضمن الطرح الأولي لمنصة فَنر هومز في الرياض. البيانات موثّقة من المُعلن وتخضع لتحقق الرخص اليومي.",
      districtId: d.id,
      lng: d.center[0] + s.dLng,
      lat: d.center[1] + s.dLat,
      locationPrecision: "approximate",
      areaM2: s.area,
      bedrooms: s.beds,
      bathrooms: s.baths,
      ageYears: s.age,
      finishGrade: s.finish,
      floor: s.floor,
      elevator: s.elevator,
      parkingSpaces: s.parking,
      streetWidthM: s.street,
      corner: s.corner,
      orientation: s.orientation,
      price: s.price,
      freezeStatus: s.listingType === "rent" ? s.freeze ?? null : null,
      lastEjarValue: s.lastEjar ?? null,
      adLicense: {
        number: `72004${String(81000 + i * 17)}`,
        status: expired ? "expired" : "valid",
        expiresAt: iso(s.licenseExpiredDays ?? 200 + i * 9),
        verifiedAt: iso(0),
      },
      advertiserType: s.advertiser === "owner" ? "owner_self_listing" : "licensed_broker",
      advertiserName: s.advertiser === "owner" ? "المالك مباشرة" : "مكتب المستقبل العقاري",
      advertiserPhone: "+966 55 000 1122",
      falNumber: s.advertiser === "owner" ? null : "1100254",
      complianceLog: [],
      photoSeed: i,
      createdAt: iso(-(3 + i)),
      updatedAt: iso(-(i % 5)),
      viewCount: 240 + i * 83,
      leads: [],
      reports: [],
    };
  });

  return {
    districts: DISTRICTS,
    listings,
    claimed: [
      {
        id: "c1",
        ownerName: "عبدالله السالم",
        districtId: "al-malqa",
        title: "فيلا الملقا — سكن العائلة",
        propertyType: "villa",
        areaM2: 420,
        ageYears: 5,
        finishGrade: "premium",
        lng: 46.636,
        lat: 24.807,
        createdAt: iso(-40),
      },
    ],
    seededAt: new Date().toISOString(),
  };
}
