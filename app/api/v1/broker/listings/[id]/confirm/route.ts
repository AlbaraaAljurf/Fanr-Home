import { getListing, updateListing } from "@/lib/store";
import { ok, fail } from "@/lib/api";

/** POST — broker re-confirms availability («هل ما زال متاحاً؟», E7.2). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) return fail("الإعلان غير موجود", 404);
  const now = new Date().toISOString();
  updateListing(l.id, { lastConfirmedAt: now });
  return ok({ lastConfirmedAt: now });
}
