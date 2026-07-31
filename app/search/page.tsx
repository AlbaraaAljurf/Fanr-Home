import { getDb } from "@/lib/store";
import { legalRentFor } from "@/lib/avm";
import { FREEZE_ZONE } from "@/lib/geo";
import MapSearch, { MapListing } from "@/components/MapSearch";
import { ScreenHeader } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  const db = getDb();
  const listings: MapListing[] = db.listings
    .filter((l) => l.status === "live")
    .map((l) => {
      const d = db.districts.find((x) => x.id === l.districtId)!;
      const lr = legalRentFor(l, d);
      return {
        id: l.id,
        ref: l.ref,
        title: l.title,
        lat: l.lat,
        lng: l.lng,
        price: l.price,
        listingType: l.listingType,
        propertyType: l.propertyType,
        bedrooms: l.bedrooms,
        areaM2: l.areaM2,
        districtNameAr: d.nameAr,
        verdict: lr.verdict,
        advertiserType: l.advertiserType,
        photoSeed: l.photoSeed,
        stale:
          (Date.now() - new Date(l.lastConfirmedAt ?? l.createdAt).getTime()) / 86400000 > 45,
      };
    });

  const districtPolys = db.districts.map((d) => ({
    nameAr: d.nameAr,
    ring: d.polygon,
  }));

  return (
    <>
      <ScreenHeader title="الخريطة" />
      <MapSearch
        listings={listings}
        freezeRing={FREEZE_ZONE.ring}
        freezeVersion={FREEZE_ZONE.version}
        districts={districtPolys}
      />
    </>
  );
}
