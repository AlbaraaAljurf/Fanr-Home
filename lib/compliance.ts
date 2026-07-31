/**
 * fanr-compliance-svc (MVP stubs).
 * Deterministic format validation stands in for the REGA/FAL verification
 * APIs; the function signatures and return shapes are the integration
 * contract (PRD §8.3, R3.1.2). The daily re-verification job is represented
 * by `sweepExpiredLicenses`, run opportunistically on admin load.
 */
import { getDb, saveDb } from "./store";

export interface VerifyResult {
  valid: boolean;
  reason: string | null;
  expiresAt: string | null;
}

/** REGA advertising licence (رخصة إعلان عقاري): 10 digits starting with 7. */
export function verifyAdLicense(num: string): VerifyResult {
  const clean = (num || "").trim();
  if (!/^7\d{9}$/.test(clean)) {
    return { valid: false, reason: "صيغة غير صحيحة — رخصة الإعلان 10 أرقام وتبدأ بـ 7", expiresAt: null };
  }
  // Stub: derive a deterministic expiry 6–18 months out from the number.
  const months = 6 + (Number(clean.slice(-2)) % 13);
  const expiresAt = new Date(Date.now() + months * 30 * 86400000).toISOString();
  return { valid: true, reason: null, expiresAt };
}

/** FAL brokerage licence (رخصة فال): 7 digits starting with 11. */
export function verifyFal(num: string): VerifyResult {
  const clean = (num || "").trim();
  if (!/^11\d{5}$/.test(clean)) {
    return { valid: false, reason: "صيغة غير صحيحة — رخصة فال 7 أرقام وتبدأ بـ 11", expiresAt: null };
  }
  return { valid: true, reason: null, expiresAt: new Date(Date.now() + 300 * 86400000).toISOString() };
}

/** Daily batch (R3.1.4): expired licence ⇒ auto-unpublish + advertiser notice. */
export function sweepExpiredLicenses(): number {
  const db = getDb();
  let changed = 0;
  const now = Date.now();
  for (const l of db.listings) {
    if (l.status === "live" && new Date(l.adLicense.expiresAt).getTime() < now) {
      l.status = "expired";
      l.adLicense.status = "expired";
      l.complianceLog.push(`auto-unpublished: ad licence expired (${new Date().toISOString()})`);
      changed++;
    }
  }
  if (changed) saveDb();
  return changed;
}
