import { getDb, addListing } from "@/lib/store";
import { verifyAdLicense } from "@/lib/compliance";
import { ok, fail } from "@/lib/api";
import { Listing } from "@/lib/types";

/** POST /api/v1/homes/listings — publish gated on the REGA ad licence (R3.1.1). */
export async function POST(req: Request) {
  const b = await req.json();

  const lic = verifyAdLicense(b.adLicenseNumber);
  if (!lic.valid) {
    return fail(`لا يمكن النشر: ${lic.reason ?? "رخصة الإعلان غير صالحة"}`, 422);
  }

  const db = getDb();
  const d = db.districts.find((x) => x.id === b.districtId);
  if (!d) return fail("حي غير معروف", 422);

  const isRent = true; // Phase 1: rentals-first wizard
  const freeze = b.freezeStatus ?? null;
  if (isRent && !freeze) return fail("وضع التجميد إلزامي لإيجارات الرياض (R3.3.2)", 422);

  const price = Number(b.price) || 0;
  const lastEjar = freeze !== "never_leased" ? Number(b.lastEjarValue) || null : null;
  const complianceLog: string[] = [];
  if (lastEjar && price > lastEjar) {
    complianceLog.push(
      `advisory warning shown & logged: asking ${price} exceeds legal cap ${lastEjar} (R3.3.3) — ${new Date().toISOString()}`
    );
  }

  const n = 60000 + db.listings.length * 13;
  const jitter = (db.listings.length % 7) * 0.002 - 0.006;
  const listing: Listing = {
    id: `l${Date.now().toString(36)}`,
    ref: `FNR-RYD-${String(n).padStart(8, "0")}`,
    listingType: "rent",
    propertyType: b.propertyType ?? "apartment",
    status: "live",
    title: b.title || "إعلان بدون عنوان",
    description: "إعلان منشور عبر معالج فَنر هومز — خضع لبوابة الالتزام قبل النشر.",
    districtId: d.id,
    lng: d.center[0] + jitter,
    lat: d.center[1] + jitter / 2,
    locationPrecision: "approximate",
    areaM2: Number(b.areaM2) || 100,
    bedrooms: Number(b.bedrooms) || 0,
    bathrooms: Number(b.bathrooms) || 0,
    ageYears: Number(b.ageYears) || 0,
    finishGrade: b.finishGrade ?? "standard",
    floor: b.floor != null && b.floor !== "" ? Number(b.floor) : null,
    elevator: !!b.elevator,
    parkingSpaces: Number(b.parkingSpaces) || 0,
    streetWidthM: Number(b.streetWidthM) || 15,
    corner: !!b.corner,
    orientation: b.orientation ?? "north",
    price,
    freezeStatus: freeze,
    lastEjarValue: lastEjar,
    adLicense: {
      number: String(b.adLicenseNumber).trim(),
      status: "valid",
      expiresAt: lic.expiresAt!,
      verifiedAt: new Date().toISOString(),
    },
    advertiserType: b.advertiserType === "owner_self_listing" ? "owner_self_listing" : "licensed_broker",
    advertiserName: b.advertiserType === "owner_self_listing" ? "المالك مباشرة" : "مكتب المستقبل العقاري",
    advertiserPhone: "+966 55 000 1122",
    falNumber: b.advertiserType === "owner_self_listing" ? null : b.falNumber || "1100254",
    complianceLog,
    photoSeed: db.listings.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    leads: [],
    reports: [],
  };

  addListing(listing);
  return ok({ id: listing.id, ref: listing.ref, complianceLog });
}
