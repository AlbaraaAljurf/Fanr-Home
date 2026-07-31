import Link from "next/link";
import { getDb } from "@/lib/store";
import { sar, TYPE_LABELS } from "@/lib/format";
import { legalRentFor } from "@/lib/avm";
import { ScreenHeader, MediaEmpty } from "@/components/Shell";
import { RentCheckerButton } from "@/components/RentCheckerSheet";

export const dynamic = "force-dynamic";

export default function Home() {
  const db = getDb();
  const rentals = db.listings.filter((l) => l.status === "live" && l.listingType === "rent");

  return (
    <>
      <ScreenHeader title="فَنر هومز" />
      <div className="content">
        <Link href="/search" className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px" }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, flex: 1 }}>
            ابحث: حي، مدينة، أو ارسم حدودك على الخريطة…
          </span>
          <span className="badge navy">الخريطة</span>
        </Link>

        <div className="grid2" style={{ marginTop: 12 }}>
          <RentCheckerButton className="btn soft" label="⚖ هل إيجاري نظامي؟" />
          <Link href="/guide/rent-freeze" className="btn soft">📖 دليل التجميد</Link>
        </div>

        <div className="ct" style={{ margin: "18px 0 10px" }}>أحدث إعلانات الإيجار الموثّقة</div>
        {rentals.length === 0 ? (
          <div className="card"><div className="empty-state">
            <span className="ei">🏠</span>
            <b>لا إعلانات منشورة بعد</b>
            <p>الإعلانات تظهر هنا فور نشرها عبر بوابة الالتزام — كل إعلان برخصة إعلان عقاري متحقَّق منها.</p>
          </div></div>
        ) : (
          <div className="stack">
            {rentals.slice(0, 5).map((l) => {
              const d = db.districts.find((x) => x.id === l.districtId)!;
              const lr = legalRentFor(l, d);
              return (
                <Link key={l.id} href={`/listings/${l.id}`} className="listing-card">
                  <div style={{ display: "flex", gap: 12, padding: 12 }}>
                    <MediaEmpty tile height={72} label="لا صور" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <b style={{ fontSize: 15, color: "var(--navy)" }}>{sar(l.price)} ريال/سنة</b>
                        <span style={{ fontSize: 9.5, color: "var(--ink-3)", direction: "ltr" }}>{l.ref}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                        {TYPE_LABELS[l.propertyType]} · {l.areaM2} م² · {d.nameAr}
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                        <span className="badge ok">✓ مرخّص</span>
                        {lr.verdict === "within_cap" && <span className="badge info">⚖ ضمن السقف</span>}
                        {lr.verdict === "above_cap" && <span className="badge danger">⚠ أعلى من السقف النظامي</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="ct" style={{ margin: "18px 0 10px" }}>الأحياء</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {db.districts.map((d) => (
            <Link key={d.id} href={`/districts/${d.id}`} className="chip sm">{d.nameAr}</Link>
          ))}
        </div>

        <p className="disc" style={{ textAlign: "center", marginTop: 20 }}>
          تقدير فَنر مؤشر سوقي استرشادي وليس تقييماً عقارياً معتمداً · العقود تُسجَّل في منصة «إيجار» الرسمية
        </p>
      </div>
    </>
  );
}
