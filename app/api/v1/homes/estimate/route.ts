import { getDb, getListing } from "@/lib/store";
import { estimateFromRows, legalRentFor } from "@/lib/avm";
import { ok, fail } from "@/lib/api";

/** GET /api/v1/homes/estimate?listing_id= — honest union: estimate or explicit insufficiency. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("listing_id");
  if (!id) return fail("listing_id مطلوب", 422);
  const l = getListing(id);
  if (!l) return fail("العقار غير موجود", 404);
  const db = getDb();
  const d = db.districts.find((x) => x.id === l.districtId)!;

  const estimate = estimateFromRows(db.transactions, l, d, l.listingType === "rent" ? "rent" : "sale");
  const legal = l.listingType === "rent" ? legalRentFor(l, d, db.transactions) : null;
  return ok({ estimate, legal_rent: legal });
}
