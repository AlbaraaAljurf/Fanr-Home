import { getDb } from "@/lib/store";
import { legalRentFor } from "@/lib/avm";
import { pointInPolygon, Ring } from "@/lib/geo";
import { ok } from "@/lib/api";

/**
 * GET /api/v1/homes/search — PRD §8.3 contract.
 * ?type=rent&district=al-malqa&price_min=&price_max=&beds=&within_cap=1&polygon=<json ring>
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = u.searchParams;
  const db = getDb();

  let ring: Ring | null = null;
  try {
    const p = q.get("polygon");
    if (p) ring = JSON.parse(p) as Ring;
  } catch {
    ring = null;
  }

  const results = db.listings
    .filter((l) => l.status === "live")
    .filter((l) => !q.get("type") || l.listingType === q.get("type"))
    .filter((l) => !q.get("district") || l.districtId === q.get("district"))
    .filter((l) => !q.get("beds") || l.bedrooms >= Number(q.get("beds")))
    .filter((l) => !q.get("price_min") || l.price >= Number(q.get("price_min")))
    .filter((l) => !q.get("price_max") || l.price <= Number(q.get("price_max")))
    .filter((l) => !ring || pointInPolygon(l.lng, l.lat, ring))
    .filter((l) => {
      if (q.get("within_cap") !== "1") return true;
      const d = db.districts.find((x) => x.id === l.districtId)!;
      return legalRentFor(l, d).verdict === "within_cap";
    })
    .map((l) => ({
      id: l.id,
      ref: l.ref,
      title: l.title,
      listing_type: l.listingType,
      property_type: l.propertyType,
      district_id: l.districtId,
      price: l.price,
      area_m2: l.areaM2,
      bedrooms: l.bedrooms,
      lat: l.lat,
      lng: l.lng,
      rega_ad_license_number: l.adLicense.number,
    }));

  return ok(results, { page: 1, total: results.length });
}
