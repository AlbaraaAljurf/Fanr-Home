/**
 * Demo lease records for the owner journey (E6). In production these come
 * from Ejar-registered contracts via partnership/API; the renewal math
 * (90/65-day alerts ahead of the 60-day statutory notice) is the product.
 */

export interface Lease {
  id: string;
  propertyTitle: string;
  districtNameAr: string;
  districtId: string;
  tenantName: string;
  annualRent: number;
  ejarRegistered: boolean;
  /** days from today until contract end (demo-relative so the states stay alive) */
  daysToEnd: number;
}

export const LEASES: Lease[] = [
  {
    id: "lease-narjis",
    propertyTitle: "شقة النرجس — غرفتان",
    districtNameAr: "النرجس",
    districtId: "al-narjis",
    tenantName: "محمد العتيبي",
    annualRent: 48000,
    ejarRegistered: true,
    daysToEnd: 65,
  },
  {
    id: "lease-qurtubah",
    propertyTitle: "شقة قرطبة — 3 غرف",
    districtNameAr: "قرطبة",
    districtId: "qurtubah",
    tenantName: "سارة القحطاني",
    annualRent: 44000,
    ejarRegistered: true,
    daysToEnd: 300,
  },
];

export type RenewalStage = "notice_window_soon" | "alert_90" | "ok";

export function renewalStage(l: Lease): RenewalStage {
  if (l.daysToEnd <= 65) return "notice_window_soon"; // 65-day alert — 60-day deadline approaching
  if (l.daysToEnd <= 90) return "alert_90";
  return "ok";
}

export function endDate(l: Lease): Date {
  return new Date(Date.now() + l.daysToEnd * 86400000);
}
