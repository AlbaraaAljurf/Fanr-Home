export function sar(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m.toFixed(m >= 10 ? 1 : 2).replace(/\.?0+$/, "")} مليون`;
  }
  return n.toLocaleString("en-US");
}

export function sarShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}م`;
  if (n >= 1_000) return `${Math.round(n / 1000)} ألف`;
  return String(n);
}

export const FREEZE_LABELS: Record<string, string> = {
  currently_leased: "مؤجَّر حالياً",
  previously_leased_vacant: "مؤجَّر سابقاً — شاغر",
  never_leased: "لم يؤجَّر من قبل",
};

export const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  villa: "فيلا",
  floor: "دور",
  duplex: "دوبلكس",
  land: "أرض",
};

export const CONF_LABELS: Record<string, string> = {
  high: "ثقة عالية",
  medium: "ثقة متوسطة",
  low: "ثقة منخفضة",
};
