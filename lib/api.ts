import { NextResponse } from "next/server";

/** Response envelope consistent with existing Fanr services (PRD §8.3). */
export function ok(data: unknown, meta: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, data, meta, error: null });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, meta: {}, error }, { status });
}
