import { getListing, updateListing } from "@/lib/store";
import { ok, fail } from "@/lib/api";

/** Lead creation — the moment advertiser contact is revealed (R-E3-1). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l || l.status !== "live") return fail("الإعلان غير متاح", 404);

  const b = await req.json();
  if (!b.name || !b.phone) return fail("الاسم والجوال مطلوبان", 422);

  const lead = {
    id: `ld${Date.now().toString(36)}`,
    name: String(b.name).slice(0, 80),
    phone: String(b.phone).slice(0, 24),
    interest: (["viewing", "inquiry", "negotiation"].includes(b.interest) ? b.interest : "inquiry") as
      | "viewing"
      | "inquiry"
      | "negotiation",
    createdAt: new Date().toISOString(),
  };
  updateListing(l.id, { leads: [...l.leads, lead] });

  return ok({ leadId: lead.id, advertiserName: l.advertiserName, advertiserPhone: l.advertiserPhone });
}
