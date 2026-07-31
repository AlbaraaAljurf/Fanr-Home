export type ListingType = "rent" | "sale";
export type PropertyType = "apartment" | "villa" | "floor" | "duplex" | "land";
export type ListingStatus = "draft" | "pending_review" | "live" | "expired" | "rejected";
export type FreezeStatus = "currently_leased" | "previously_leased_vacant" | "never_leased";
export type FinishGrade = "economy" | "standard" | "premium" | "luxury";
export type AdvertiserType = "licensed_broker" | "owner_self_listing";
export type Confidence = "high" | "medium" | "low";

export interface District {
  id: string;
  nameAr: string;
  nameEn: string;
  center: [number, number]; // [lng, lat]
  polygon: [number, number][]; // ring, [lng, lat]
  /** Layer-1 baselines (SAR per m², trailing-12m medians) — seeded from market reference data */
  basePriceM2Sale: number;
  baseRentM2Annual: number;
  trend12mPct: number;
  txCount12m: number;
  avgDaysOnMarket: number;
}

export interface AdLicense {
  number: string;
  status: "valid" | "expired" | "revoked" | "unverified";
  expiresAt: string; // ISO date
  verifiedAt: string | null;
}

export interface Listing {
  id: string;
  ref: string; // FNR-RYD-XXXXXXXX
  listingType: ListingType;
  propertyType: PropertyType;
  status: ListingStatus;
  title: string;
  description: string;
  districtId: string;
  lat: number;
  lng: number;
  locationPrecision: "exact" | "approximate";
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  ageYears: number;
  finishGrade: FinishGrade;
  floor: number | null;
  elevator: boolean;
  parkingSpaces: number;
  streetWidthM: number;
  corner: boolean;
  orientation: "north" | "south" | "east" | "west";
  /** SAR — sale price, or annual rent for rentals */
  price: number;
  // Riyadh rent-freeze compliance (rentals inside the urban boundary)
  freezeStatus: FreezeStatus | null;
  lastEjarValue: number | null;
  // Compliance
  adLicense: AdLicense;
  advertiserType: AdvertiserType;
  advertiserName: string;
  advertiserPhone: string;
  falNumber: string | null;
  complianceLog: string[];
  /** E7.2/E1-S4: broker re-confirms availability every 30 days; >45 days flags publicly */
  lastConfirmedAt?: string;
  /** E1-S5: set when publish-time duplicate detection matches an existing live listing */
  duplicateOfId?: string | null;
  photoSeed: number;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  leads: Lead[];
  reports: Report[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  interest: "viewing" | "inquiry" | "negotiation";
  createdAt: string;
  /** SLA loop (R-E7-4): response timing feeds the earned response-rate badge */
  status?: "new" | "responded" | "qualified" | "closed";
  respondedAt?: string | null;
}

export interface Report {
  id: string;
  category: "not_available" | "wrong_price" | "wrong_location" | "fake" | "duplicate";
  createdAt: string;
}

export interface ClaimedProperty {
  id: string;
  ownerName: string;
  districtId: string;
  title: string;
  propertyType: PropertyType;
  areaM2: number;
  ageYears: number;
  finishGrade: FinishGrade;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface Db {
  districts: District[];
  listings: Listing[];
  claimed: ClaimedProperty[];
  seededAt: string;
}

export interface Estimate {
  value: number;
  low: number;
  high: number;
  confidence: Confidence;
  basisTxCount: number;
  districtBaseM2: number;
  factorsApplied: { key: string; factor: number }[];
  modelVersion: string;
}

export interface LegalRentResult {
  insideFreezeZone: boolean;
  freezeStatus: FreezeStatus | null;
  legalCap: number | null;
  capSource: string | null;
  marketEstimate: Estimate | null;
  askingRent?: number;
  verdict: "within_cap" | "above_cap" | "no_cap" | "unknown_cap" | null;
}
