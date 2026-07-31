import Link from "next/link";
import { getDb } from "@/lib/store";
import { estimateFromRows } from "@/lib/avm";
import { sar, TYPE_LABELS, CONF_LABELS } from "@/lib/format";
import { ScreenHeader, MediaEmpty } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default function OwnerPage() {
  const db = getDb();
  const claimed = db.claimed;
  const ownerListings = db.listings.filter((l) => l.advertiserType === "owner_self_listing");

  return (
    <>
      <ScreenHeader title="أملاكي" />
      <main className="wrap">
        {claimed.length === 0 && (
          <div className="card"><div className="empty-state">
            <span className="ei">🔑</span>
            <b>لا عقارات مُطالَب بها بعد</b>
            <p>
              اطلب ملكية عقارك عبر نفاذ والتحقق من الصك — تتبّع تقديره عندما تتوفر بيانات
              الصفقات لحيّه، وصحّح بياناته، وأعلن عنه بشارة «مالك» الموثّقة.
            </p>
          </div></div>
        )}

        <div className="stack">
          {claimed.map((c) => {
            const d = db.districts.find((x) => x.id === c.districtId)!;
            const est = estimateFromRows(
              db.transactions,
              {
                propertyType: c.propertyType,
                areaM2: c.areaM2,
                ageYears: c.ageYears,
                finishGrade: c.finishGrade,
                floor: null,
                elevator: false,
                parkingSpaces: 1,
                streetWidthM: 15,
                corner: false,
                orientation: "north",
              },
              d,
              "sale"
            );
            return (
              <div key={c.id} className="card">
                <MediaEmpty height={84} label="لا صور للعقار" />
                <div className="cpad">
                  <b style={{ fontSize: 15 }}>{c.title}</b>
                  <div className="cs" style={{ marginTop: 2 }}>
                    {TYPE_LABELS[c.propertyType]} · {c.areaM2} م² · {d.nameAr} · ✓ مُطالَب بها — {c.ownerName}
                  </div>
                  {est.available ? (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
                        <b style={{ fontSize: 20, color: "var(--navy)" }}>{sar(est.low)} – {sar(est.high)} ريال</b>
                        <span className="badge info">{CONF_LABELS[est.confidence]}</span>
                      </div>
                      <p className="disc" style={{ margin: "4px 0 0" }}>{est.disclaimer}</p>
                    </>
                  ) : (
                    <div style={{ background: "var(--selected)", borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}>
                        💡 {est.message} — يظهر التقدير فور اكتمال إدخال صفقات وزارة العدل لهذا الحي.
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    <Link className="btn sm auto" href="/broker/new?as=owner">أعلن للإيجار</Link>
                    <Link className="btn soft sm auto" href="/owner/ejar-pack">📄 حزمة إيجار</Link>
                    <Link className="btn soft sm auto" href="/owner/renewals">📆 التجديدات</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Link href="/owner/claim" className="card" style={{ display: "block", marginTop: 12, borderStyle: "dashed", background: "var(--selected)" }}>
          <div className="cpad" style={{ textAlign: "center" }}>
            <span style={{ fontSize: 22 }}>＋</span>
            <b style={{ display: "block", fontSize: 14, marginTop: 4, color: "var(--primary)" }}>اطلب ملكية عقار</b>
            <span className="cs">نفاذ + التحقق من الصك (يُخزَّن مشفّراً ولا يُعرض أبداً)</span>
          </div>
        </Link>

        {ownerListings.length > 0 && (
          <>
            <div className="ct" style={{ margin: "18px 0 10px" }}>إعلاناتك المنشورة</div>
            <div className="stack">
              {ownerListings.map((l) => (
                <Link key={l.id} href={`/listings/${l.id}`} className="listing-card">
                  <div style={{ padding: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <b style={{ fontSize: 14.5, color: "var(--navy)" }}>{sar(l.price)} ريال/سنة</b>
                      {l.status === "live" ? <span className="badge ok">حي</span> : <span className="badge danger">موقوف</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{l.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>
                      {l.leads.length} طلب تواصل
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
