import { getDb, getListing } from "@/lib/store";
import { estimateRent, estimateSale, legalRentFor } from "@/lib/avm";
import { ok, fail } from "@/lib/api";

/** GET /api/v1/homes/estimate?listing_id= — تقدير فَنر + legal rent position. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("listing_id");
  if (!id) return fail("listing_id مطلوب", 422);
  const l = getListing(id);
  if (!l) return fail("العقار غير موجود", 404);
  const d = getDb().districts.find((x) => x.id === l.districtId)!;

  const estimate = l.listingType === "rent" ? estimateRent(l, d) : estimateSale(l, d);
  const legal = l.listingType === "rent" ? legalRentFor(l, d) : null;
  return ok({
    estimate,
    legal_rent: legal,
    disclaimer: "تقدير فَنر مؤشر سوقي استرشادي وليس تقييماً عقارياً معتمداً",
  });
}
