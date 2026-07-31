import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb, getDistrict } from "@/lib/store";
import { districtStats } from "@/lib/marketstats";
import { sar, TYPE_LABELS } from "@/lib/format";
import { inFreezeZone } from "@/lib/geo";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const d = getDistrict(params.id);
  if (!d) return {};
  return {
    title: `حي ${d.nameAr}، الرياض — أسعار العقارات والإيجارات | فَنر هومز`,
    description: `بيانات سوق حي ${d.nameAr} بالرياض: وسيط سعر المتر للبيع والإيجار، الاتجاه السنوي، حجم الصفقات، ومزيج العقارات — من منصة فَنر هومز.`,
  };
}

export default function DistrictPage({ params }: { params: { id: string } }) {
  const d = getDistrict(params.id);
  if (!d) notFound();
  const stats = districtStats(d.id);
  const db = getDb();
  const listings = db.listings.filter((l) => l.status === "live" && l.districtId === d.id);
  const frozen = inFreezeZone(d.center[0], d.center[1]);
  const maxBar = Math.max(...stats.monthlyMedianM2, 1);

  return (
    <main className="wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>حي {d.nameAr} — الرياض</h1>
        {frozen && <span className="badge info">⚖ داخل نطاق تجميد الإيجارات</span>}
      </div>
      <p className="sub">
        صفحة بيانات محدّثة من ركن الصفقات — {stats.saleCount12m + stats.rentCount12m} صفقة خلال 12 شهراً
        ({stats.saleCount12m} بيع · {stats.rentCount12m} إيجار)
      </p>

      <div className="grid3">
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 24, fontWeight: 900, color: "var(--navy)" }}>{stats.saleMedianM2.toLocaleString("en-US")}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>ريال/م² — وسيط البيع</div>
        </div></div>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 24, fontWeight: 900, color: "var(--navy)" }}>{stats.rentMedianM2.toLocaleString("en-US")}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>ريال/م² — وسيط الإيجار السنوي</div>
        </div></div>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 24, fontWeight: 900, color: stats.trendPct12m >= 0 ? "var(--ok)" : "var(--danger)" }}>
            {stats.trendPct12m >= 0 ? "+" : ""}{stats.trendPct12m}٪
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>الاتجاه — النصف الأخير مقابل الأول</div>
        </div></div>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card"><div className="cpad">
          <h3 className="ct">وسيط سعر المتر — 12 شهراً (بيع)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90, marginTop: 8 }}>
            {stats.monthlyMedianM2.map((v, i) => (
              <div key={i} title={`${v.toLocaleString("en-US")} ريال/م²`}
                style={{ flex: 1, height: `${Math.max(8, (v / maxBar) * 100)}%`, background: i === 11 ? "var(--primary)" : "#C9D6F6", borderRadius: "4px 4px 0 0" }} />
            ))}
          </div>
          <p className="disc" style={{ marginTop: 8 }}>
            الأقدم ← الأحدث · محسوب من ركن صفقات فَنر (يمثّل صفقات وزارة العدل/SREM في الإنتاج)
          </p>
        </div></div>
        <div className="card"><div className="cpad">
          <h3 className="ct">مزيج العقارات في الصفقات</h3>
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
          <div className="kv" style={{ marginTop: 6 }}>
            <span className="k">متوسط البقاء بالسوق</span><span className="v">{d.avgDaysOnMarket} يوماً</span>
          </div>
        </div></div>
      </div>

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>
        المعروض الآن في {d.nameAr} ({listings.length})
      </h2>
      <div className="grid3">
        {listings.map((l) => (
          <Link key={l.id} href={`/listings/${l.id}`} className="listing-card">
            <div className={`photo g${l.photoSeed % 4 === 0 ? 1 : l.photoSeed % 4}`} style={{ height: 86, fontSize: 26 }}>⌂</div>
            <div style={{ padding: "10px 13px 12px" }}>
              <b style={{ fontSize: 14.5, color: "var(--navy)" }}>{sar(l.price)} ريال{l.listingType === "rent" ? "/سنة" : ""}</b>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{l.title}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                {TYPE_LABELS[l.propertyType]} · {l.areaM2} م² · {l.bedrooms} غرف
              </div>
            </div>
          </Link>
        ))}
        {listings.length === 0 && (
          <div className="card"><div className="cpad" style={{ color: "var(--ink-2)" }}>لا معروض حالياً — فعّل تنبيهاً من صفحة البحث</div></div>
        )}
      </div>

      <p className="disc" style={{ textAlign: "center", marginTop: 24 }}>
        صفحة مفهرسة ثنائية اللغة (schema.org في الإنتاج) — بيانات استرشادية وليست تقييماً معتمداً
      </p>
    </main>
  );
}
