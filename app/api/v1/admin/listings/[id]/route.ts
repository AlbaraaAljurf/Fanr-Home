import { getListing, updateListing } from "@/lib/store";
import { ok, fail } from "@/lib/api";

/** Admin moderation actions (E14). Every action appended to the compliance log. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) return fail("الإعلان غير موجود", 404);
  const { action } = await req.json();

  if (action === "unpublish") {
    updateListing(l.id, {
      status: "rejected",
      complianceLog: [...l.complianceLog, `admin unpublish — ${new Date().toISOString()}`],
    });
    return ok({ status: "rejected" });
  }
  if (action === "clear") {
    updateListing(l.id, {
      reports: [],
      complianceLog: [...l.complianceLog, `admin cleared flags — ${new Date().toISOString()}`],
    });
    return ok({ status: l.status });
  }
  return fail("إجراء غير معروف", 422);
}
