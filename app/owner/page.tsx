import Link from "next/link";
import { getDb } from "@/lib/store";
import { estimateSale } from "@/lib/avm";
import { sar, TYPE_LABELS, CONF_LABELS } from "@/lib/format";
import { LEASES, renewalStage } from "@/lib/leases";

export const dynamic = "force-dynamic";

export default function OwnerPage() {
  const db = getDb();
  const claimed = db.claimed;
  const ownerListings = db.listings.filter((l) => l.advertiserType === "owner_self_listing");

  return (
    <main className="wrap">
      <h1 className="h1">أملاكي 🔑</h1>
      <p className="sub">
        لوحة المالك — تتبّع قيمة عقاراتك شهرياً، وأعلن عنها بشارة «مالك» الموثّقة.
        (المطالبة بالعقار في الإنتاج تتم عبر نفاذ + التحقق من الصك؛ هنا حساب تجريبي مُهيأ مسبقاً.)
      </p>

      {LEASES.filter((l) => renewalStage(l) === "notice_window_soon").map((l) => (
        <Link key={l.id} href="/owner/renewals" style={{ display: "block", marginBottom: 14 }}>
          <div className="card" style={{ background: "var(--warn-bg)", borderColor: "var(--warn-line)" }}>
            <div className="cpad" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>⏰</span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14, color: "var(--warn)" }}>
                  عقد {l.propertyTitle} يتجدد تلقائياً بعد {l.daysToEnd} يوماً
                </b>
                <div style={{ fontSize: 12, color: "var(--warn)", marginTop: 2 }}>
                  مهلة الإخطار النظامية 60 يوماً — قرر التجديد أو الإخطار الآن
                </div>
              </div>
              <span style={{ color: "var(--warn)", fontWeight: 800 }}>‹</span>
            </div>
          </div>
        </Link>
      ))}

      <div className="grid2">
        {claimed.map((c) => {
          const d = db.districts.find((x) => x.id === c.districtId)!;
          const est = estimateSale(
            {
              propertyType: c.propertyType,
              areaM2: c.areaM2,
              ageYears: c.ageYears,
              finishGrade: c.finishGrade,
              floor: null,
              elevator: false,
              parkingSpaces: 2,
              streetWidthM: 20,
              corner: false,
              orientation: "north",
            },
            d
          );
          return (
            <div key={c.id} className="card">
              <div className={`photo`} style={{ height: 120, borderRadius: "16px 16px 0 0", fontSize: 34 }}>
                ⌂
                <span className="badge" style={{ position: "absolute", top: 10, insetInlineStart: 10, background: "#fff", color: "var(--navy)" }}>
                  ✓ مُطالَب بها — {c.ownerName}
                </span>
              </div>
              <div className="cpad">
                <h3 className="ct" style={{ marginBottom: 4 }}>{c.title}</h3>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {TYPE_LABELS[c.propertyType]} · {c.areaM2} م² · {d.nameAr}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
                  <b style={{ fontSize: 24, color: "var(--navy)" }}>{sar(est.value)} ريال</b>
                  <span className="badge ok">▲ ‎+{d.trend12mPct}٪ — 12 شهراً</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                  النطاق: {sar(est.low)} – {sar(est.high)} · {CONF_LABELS[est.confidence]}
                </div>
                <hr className="hr" />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link className="btn sm" href="/broker/new?as=owner">أعلن للإيجار</Link>
                  <Link className="btn soft sm" href="/owner/ejar-pack">📄 حزمة الجاهزية لإيجار</Link>
                  <Link className="btn soft sm" href="/owner/renewals">📆 تقويم التجديد</Link>
                </div>
                <p className="disc" style={{ marginTop: 10 }}>
                  تقدير فَنر مؤشر سوقي استرشادي وليس تقييماً عقارياً معتمداً
                </p>
              </div>
            </div>
          );
        })}

        <div className="card" style={{ borderStyle: "dashed", background: "var(--selected)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 30 }}>🏠</div>
            <b style={{ fontSize: 15, display: "block", margin: "8px 0 4px" }}>اطلب ملكية عقار</b>
            <p className="disc" style={{ margin: "0 0 12px" }}>
              نفاذ + التحقق من الصك (يُخزَّن مشفّراً ولا يُعرض أبداً) — نقطة تكامل الإنتاج
            </p>
            <Link href="/owner/claim" className="btn sm">＋ ابدأ المطالبة</Link>
          </div>
        </div>
      </div>

      {ownerListings.length > 0 && (
        <>
          <h2 className="ct" style={{ fontSize: 17, margin: "26px 0 10px" }}>إعلاناتك المنشورة</h2>
          <div className="grid3">
            {ownerListings.map((l) => (
              <Link key={l.id} href={`/listings/${l.id}`} className="listing-card">
                <div style={{ padding: "13px 15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <b style={{ fontSize: 15, color: "var(--navy)" }}>{sar(l.price)} ريال/سنة</b>
                    {l.status === "live" ? <span className="badge ok">حي</span> : <span className="badge danger">موقوف</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                    {l.leads.length} طلب تواصل · {l.viewCount.toLocaleString("en-US")} مشاهدة
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
