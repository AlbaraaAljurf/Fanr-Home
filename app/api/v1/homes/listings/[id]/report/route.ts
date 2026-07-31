import { getListing, updateListing } from "@/lib/store";
import { ok, fail } from "@/lib/api";

const CATS = ["not_available", "wrong_price", "wrong_location", "fake", "duplicate"] as const;

/** One-tap listing report (E13) — feeds the admin fraud/moderation queue. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) return fail("الإعلان غير موجود", 404);
  const b = await req.json();
  const category = CATS.includes(b.category) ? b.category : "fake";
  updateListing(l.id, {
    reports: [...l.reports, { id: `r${Date.now().toString(36)}`, category, createdAt: new Date().toISOString() }],
  });
  return ok({ received: true });
}
