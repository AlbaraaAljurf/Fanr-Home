import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb, getDistrict } from "@/lib/store";
import { districtStats } from "@/lib/marketstats";
import { sar, TYPE_LABELS } from "@/lib/format";
import { inFreezeZone } from "@/lib/geo";
import { ScreenHeader, MediaEmpty } from "@/components/Shell";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const d = getDistrict(params.id);
  if (!d) return {};
  return { title: `حي ${d.nameAr}، الرياض | فَنر هومز` };
}

export default function DistrictPage({ params }: { params: { id: string } }) {
  const d = getDistrict(params.id);
  if (!d) notFound();
  const db = getDb();
  const stats = districtStats(db.transactions, d.id);
  const listings = db.listings.filter((l) => l.status === "live" && l.districtId === d.id);
  const frozen = inFreezeZone(d.center[0], d.center[1]);
  const bars = stats?.monthlyMedianM2 ?? [];
  const maxBar = Math.max(...bars.filter((v): v is number => v != null), 1);

  return (
    <>
      <ScreenHeader title={`حي ${d.nameAr}`} back />
      <main className="wrap">
        {frozen && <span className="badge info" style={{ marginBottom: 10 }}>⚖ داخل نطاق تجميد الإيجارات</span>}

        {!stats ? (
          <div className="card"><div className="empty-state">
            <span className="ei">📉</span>
            <b>بيانات غير كافية لهذا الحي</b>
            <p>
              إحصاءات الحي تُحسب حصراً من صفقات وزارة العدل/البورصة العقارية المُدخلة — لا نعرض
              أرقاماً غير مشتقة من بيانات حقيقية. تظهر الإحصاءات فور توفر 8 صفقات على الأقل خلال
              12 شهراً.
            </p>
          </div></div>
        ) : (
          <>
            <div className="grid2">
              <div className="card"><div className="cpad">
                <div style={{ fontSize: 21, fontWeight: 700, color: "var(--navy)" }}>{stats.saleMedianM2.toLocaleString("en-US")}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>ريال/م² — وسيط البيع ({stats.saleCount12m} صفقة)</div>
              </div></div>
              <div className="card"><div className="cpad">
                {stats.trendPct != null ? (
                  <>
                    <div style={{ fontSize: 21, fontWeight: 700, color: stats.trendPct >= 0 ? "var(--ok)" : "var(--danger)" }}>
                      {stats.trendPct >= 0 ? "+" : ""}{stats.trendPct}٪
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>الاتجاه — آخر 6 أشهر مقابل السابقة</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-3)" }}>غير متاح</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>الاتجاه يتطلب صفقات كافية في نصفي السنة</div>
                  </>
                )}
              </div></div>
            </div>

            <div className="card" style={{ marginTop: 12 }}><div className="cpad">
              <b style={{ fontSize: 14.5 }}>وسيط سعر المتر — 12 شهراً (بيع)</b>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginTop: 10 }}>
                {bars.map((v, i) => (
                  <div key={i} title={v != null ? `${v.toLocaleString("en-US")} ريال/م²` : "لا بيانات كافية هذا الشهر"}
                    style={{
                      flex: 1,
                      height: v != null ? `${Math.max(8, (v / maxBar) * 100)}%` : "6%",
                      background: v == null ? "var(--line)" : i === 11 ? "var(--primary)" : "#C9D6F6",
                      borderRadius: "4px 4px 0 0",
                    }} />
                ))}
              </div>
              <p className="disc" style={{ marginTop: 8 }}>
                الأقدم ← الأحدث · الأعمدة الرمادية: لا بيانات كافية ذلك الشهر ·
                المصدر: {stats.sources.join("، ")} (حتى {stats.latestAsOf})
              </p>
            </div></div>

            <div className="card" style={{ marginTop: 12 }}><div className="cpad">
              <b style={{ fontSize: 14.5 }}>مزيج العقارات في الصفقات</b>
              <div style={{ marginTop: 8 }}>
                {stats.mix.map((m) => (
                  <div key={m.type} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span>{TYPE_LABELS[m.type]}</span><b>{m.pct}٪</b>
                    </div>
                    <div style={{ height: 8, background: "#F0F3FB", borderRadius: 5, overflow: "hidden" }}>
                      <span style={{ display: "block", width: `${m.pct}%`, height: "100%", background: "var(--sky)", borderRadius: 5 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div></div>
          </>
        )}

        <div className="ct" style={{ margin: "18px 0 10px" }}>المعروض الآن في {d.nameAr} ({listings.length})</div>
        {listings.length === 0 ? (
          <div className="card"><div className="cpad" style={{ color: "var(--ink-2)", fontSize: 13 }}>
            لا معروض حالياً — الإعلانات تظهر فور نشرها عبر بوابة الالتزام
          </div></div>
        ) : (
          <div className="stack">
            {listings.map((l) => (
              <Link key={l.id} href={`/listings/${l.id}`} className="listing-card">
                <div style={{ display: "flex", gap: 12, padding: 12 }}>
                  <div style={{ width: 80, flex: "none" }}><MediaEmpty tile height={68} label="لا صور" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 14, color: "var(--navy)" }}>{sar(l.price)} ريال{l.listingType === "rent" ? "/سنة" : ""}</b>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>{l.title}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                      {TYPE_LABELS[l.propertyType]} · {l.areaM2} م² · {l.bedrooms} غرف
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="disc" style={{ textAlign: "center", marginTop: 18 }}>
          الإحصاءات محسوبة حصراً من صفقات حقيقية مُدخلة بمصدر وتاريخ — لا أرقام استعراضية
        </p>
      </main>
    </>
  );
}
