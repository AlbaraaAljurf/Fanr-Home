import { verifyFal } from "@/lib/compliance";
import { ok } from "@/lib/api";

export async function POST(req: Request) {
  const { number } = await req.json();
  return ok(verifyFal(number));
}
