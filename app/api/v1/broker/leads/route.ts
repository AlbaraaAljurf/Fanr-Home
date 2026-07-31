import { getListing, updateListing } from "@/lib/store";
import { ok, fail } from "@/lib/api";

/**
 * POST /api/v1/broker/leads — lead workflow actions (R-E7-4).
 * body: { listingId, leadId, action: "respond" | "qualify" | "close" }
 * Response timing is recorded on first response — it feeds the earned
 * response-rate badge on the broker profile.
 */
export async function POST(req: Request) {
  const { listingId, leadId, action } = await req.json();
  const l = getListing(listingId);
  if (!l) return fail("الإعلان غير موجود", 404);
  const lead = l.leads.find((x) => x.id === leadId);
  if (!lead) return fail("الطلب غير موجود", 404);

  if (action === "respond") {
    lead.status = "responded";
    if (!lead.respondedAt) lead.respondedAt = new Date().toISOString();
  } else if (action === "qualify") {
    lead.status = "qualified";
    if (!lead.respondedAt) lead.respondedAt = new Date().toISOString();
  } else if (action === "close") {
    lead.status = "closed";
  } else {
    return fail("إجراء غير معروف", 422);
  }
  updateListing(l.id, { leads: l.leads });
  return ok({ leadId, status: lead.status, respondedAt: lead.respondedAt ?? null });
}
