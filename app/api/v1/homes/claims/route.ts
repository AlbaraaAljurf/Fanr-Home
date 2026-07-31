import { getDb, addClaim } from "@/lib/store";
import { ok, fail } from "@/lib/api";
import { ClaimedProperty } from "@/lib/types";

/**
 * POST /api/v1/homes/claims — owner claims a property (E6, E1-S2).
 * Production gates this on Nafath identity + MOJ deed verification; the MVP
 * accepts the simulated wizard and stores no deed number (hash-only in prod).
 */
export async function POST(req: Request) {
  const b = await req.json();
  const db = getDb();
  const d = db.districts.find((x) => x.id === b.districtId);
  if (!d) return fail("حي غير معروف", 422);
  if (!b.title || String(b.title).trim().length < 3) return fail("أدخل وصفاً للعقار", 422);

  const claim: ClaimedProperty = {
    id: `c${Date.now().toString(36)}`,
    ownerName: String(b.ownerName || "مالك موثّق").slice(0, 60),
    districtId: d.id,
    title: String(b.title).slice(0, 80),
    propertyType: ["villa", "apartment", "floor", "duplex", "land"].includes(b.propertyType) ? b.propertyType : "apartment",
    areaM2: Number(b.areaM2) || 150,
    ageYears: Number(b.ageYears) || 0,
    finishGrade: ["economy", "standard", "premium", "luxury"].includes(b.finishGrade) ? b.finishGrade : "standard",
    lat: d.center[1] + 0.003,
    lng: d.center[0] + 0.004,
    createdAt: new Date().toISOString(),
  };
  addClaim(claim);
  return ok({ id: claim.id });
}
