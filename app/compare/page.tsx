"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavs } from "@/components/FavButton";
import { sar, TYPE_LABELS, FREEZE_LABELS } from "@/lib/format";
import { ScreenHeader, MediaEmpty } from "@/components/Shell";

interface Row {
  id: string;
  title: string;
  listingType: string;
  propertyType: string;
  price: number;
  areaM2: number;
  bedrooms: number;
  ageYears: number;
  finishGrade: string;
  districtNameAr: string;
  districtId: string;
  photoSeed: number;
  estimateValue: number;
  deltaPct: number;
  verdict: string | null;
  legalCap: number | null;
}

const FINISH_AR: Record<string, string> = { economy: "اقتصادي", standard: "قياسي", premium: "فاخر", luxury: "لوكس" };

export default function ComparePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ids = getFavs().slice(0, 4);
    if (!ids.length) { setLoaded(true); return; }
    fetch(`/api/v1/homes/listings?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setRows(j.data); setLoaded(true); });
  }, []);

  if (rows.length < 2) {
    return (
      <>
      <ScreenHeader title="قارن العقارات" back />
      <main className="wrap">
        <div className="card"><div className="cpad" style={{ textAlign: "center", color: "var(--ink-2)" }}>
          {loaded ? (
            <>
              أضف عقارين على الأقل إلى المفضلة لتقارن بينهما —
              <Link href="/search" style={{ color: "var(--primary)", fontWeight: 700 }}> ابدأ من الخريطة</Link>
            </>
          ) : (
            "جارٍ التحميل…"
          )}
        </div></div>
      </main>
      </>
    );
  }

  const attrs: { k: string; render: (r: Row) => React.ReactNode; hi?: (rs: Row[]) => string | null }[] = [
    { k: "السعر", render: (r) => <b>{sar(r.price)} ريال{r.listingType === "rent" ? "/سنة" : ""}</b> },
    {
      k: "ريال/م²",
      render: (r) => Math.round(r.price / r.areaM2).toLocaleString("en-US"),
      hi: (rs) => rs.reduce((a, b) => (a.price / a.areaM2 < b.price / b.areaM2 ? a : b)).id,
    },
    {
      k: "مقابل تقدير فَنر",
      render: (r) =>
        r.deltaPct <= -5 ? <span className="badge gold">★ {r.deltaPct}٪</span> :
        r.deltaPct >= 8 ? <span className="badge warn">‎+{r.deltaPct}٪</span> :
        <span className="badge info">مطابق تقريباً</span>,
      hi: (rs) => rs.reduce((a, b) => (a.deltaPct < b.deltaPct ? a : b)).id,
    },
    {
      k: "الوضع النظامي",
      render: (r) =>
        r.verdict === "within_cap" ? <span className="badge ok">⚖ ضمن السقف{r.legalCap ? ` (${sar(r.legalCap)})` : ""}</span> :
        r.verdict === "above_cap" ? <span className="badge danger">✕ أعلى من السقف</span> :
        <span style={{ color: "var(--ink-3)" }}>—</span>,
    },
    { k: "المساحة · الغرف", render: (r) => `${r.areaM2} م² · ${r.bedrooms} غرف` },
    { k: "العمر · التشطيب", render: (r) => `${r.ageYears} سنوات · ${FINISH_AR[r.finishGrade] ?? r.finishGrade}` },
    {
      k: "الحي",
      render: (r) => <Link href={`/districts/${r.districtId}`} style={{ color: "var(--primary)", fontWeight: 700 }}>{r.districtNameAr}</Link>,
    },
  ];

  return (
    <>
      <ScreenHeader title="قارن العقارات" back />
      <main className="wrap">
      <p className="sub">أول {rows.length} من مفضلاتك — الخلية المظللة هي الأفضل في صفّها</p>
      <div className="tbl-wrap card">
        <table className="tbl" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ width: 130 }}></th>
              {rows.map((r) => (
                <th key={r.id}>
                  <Link href={`/listings/${r.id}`} style={{ color: "var(--navy)" }}>{r.title}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              {rows.map((r) => (
                <td key={r.id}>
                  <MediaEmpty tile height={64} label="لا صور" />
                </td>
              ))}
            </tr>
            {attrs.map((a) => {
              const best = a.hi?.(rows) ?? null;
              return (
                <tr key={a.k}>
                  <td style={{ fontWeight: 800, color: "var(--ink)" }}>{a.k}</td>
                  {rows.map((r) => (
                    <td key={r.id} style={best === r.id ? { background: "var(--selected)", fontWeight: 700 } : undefined}>
                      {a.render(r)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="disc" style={{ textAlign: "center", marginTop: 14 }}>
        تقدير فَنر مؤشر سوقي استرشادي وليس تقييماً معتمداً · المشاركة الثنائية (co-shopping) تصل في المرحلة الثانية
      </p>
    </main>
    </>
  );
}
