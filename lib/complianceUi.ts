/**
 * Value-badge decision (remediation §4.1) — pure and unit-tested.
 *
 * RULE: a listing whose asking rent exceeds the legal cap must NEVER carry a
 * value/bargain badge on any surface. The compliance warning is the primary
 * element and the market estimate is context only.
 */

export type LegalVerdict = "within_cap" | "above_cap" | "no_cap" | "unknown_cap" | null;

export type ValueBadge =
  | { kind: "below_estimate"; pct: number }
  | { kind: "above_estimate"; pct: number }
  | null;

export function valueBadgeFor(
  price: number,
  estimateValue: number | null,
  verdict: LegalVerdict
): ValueBadge {
  if (verdict === "above_cap") return null; // suppression — never present over-cap as value
  if (estimateValue == null || estimateValue <= 0) return null;
  const delta = Math.round(((price - estimateValue) / estimateValue) * 100);
  if (delta <= -5) return { kind: "below_estimate", pct: -delta };
  if (delta >= 8) return { kind: "above_estimate", pct: delta };
  return null;
}
