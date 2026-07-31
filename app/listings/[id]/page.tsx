import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, getListing, getDistrict } from "@/lib/store";
import { estimateFromRows, legalRentFor } from "@/lib/avm";
import { valueBadgeFor } from "@/lib/complianceUi";
import { sar, TYPE_LABELS, FREEZE_LABELS, CONF_LABELS } from "@/lib/format";
import { ScreenHeader, MediaEmpty } from "@/components/Shell";
import ListingActionBar from "@/components/ListingActionBar";
import { RentCheckerButton } from "@/components/RentCheckerSheet";

export const dynamic = "force-dynamic";

export default function ListingPage({ params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) notFound();
  const d = getDistrict(l.districtId)!;
  const db = getDb();

  if (l.status !== "live") {
    return (
      <>
        <ScreenHeader title="الإعلان" back />
        <div className="content">
          <div className="card"><div className="empty-state">
            <span className="ei">⛔</span>
            <b>هذا الإعلان لم يعد متاحاً</b>
            <p>أُوقف تلقائياً — رخصة الإعلان انتهت أو أُلغيت (تُراجع الرخص يومياً).</p>
            <Link className="btn sm" style={{ marginTop: 12 }} href="/search">عُد إلى البحث</Link>
          </div></div>
        </div>
      </>
    );
  }

  const isRent = l.listingType === "rent";
  const est = estimateFromRows(db.transactions, l, d, isRent ? "rent" : "sale");
  const lr = isRent ? legalRentFor(l, d, db.transactions) : null;
  const overCap = lr?.verdict === "above_cap";
  const badge = valueBadgeFor(l.price, est.available ? est.value : null, lr?.verdict ?? null);
  const similar = db.listings
    .filter((x) => x.id !== l.id && x.status === "live" && x.districtId === l.districtId && x.listingType === l.listingType)
    .slice(0, 2);
  const stale = (Date.now() - new Date(l.lastConfirmedAt ?? l.createdAt).getTime()) / 86400000 > 45;

  const LegalBox = isRent && lr && lr.insideFreezeZone && (
    <div
      className="legal"
      style={overCap ? { borderColor: "#E8A79B", background: "#FDF3F1" } : undefined}
    >
      <b style={{ fontSize: 14.5, color: overCap ? "var(--danger)" : "var(--navy)" }}>
        ⚖ الوضع النظامي للإيجار — الرياض
      </b>
      {overCap && lr.legalCap != null && (
        <div style={{ background: "var(--danger)", color: "#fff", borderRadius: 10, padding: "10px 13px", margin: "10px 0 4px", fontSize: 13.5, fontWeight: 700, lineHeight: 1.7 }}>
          ✕ المطلوب ({sar(l.price)}) أعلى من السقف النظامي بـ{" "}
          {Math.round(((l.price - lr.legalCap) / lr.legalCap) * 100)}٪ — لا يجوز التعاقد بأعلى من
          السقف. تنبيه الالتزام مُسجَّل.
        </div>
      )}
      <div className="kv" style={{ marginTop: 6 }}>
        <span className="k">وضع العقار في 25 سبتمبر 2025</span>
        <span className="v">{l.freezeStatus ? FREEZE_LABELS[l.freezeStatus] : "غير مُعلن"}</span>
      </div>
      {lr.legalCap != null ? (
        <>
          {/* Primary-number rule (§4.2): the legal cap is the biggest number on screen */}
          <div style={{ margin: "6px 0 2px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>السقف النظامي للإيجار</span>
            <div style={{ fontSize: 27, fontWeight: 700, color: "var(--navy)", lineHeight: 1.2 }}>
              {sar(lr.legalCap)} <span style={{ fontSize: 14 }}>ريال/سنة</span>
            </div>
            <span className="disc">{lr.capSource}</span>
          </div>
          {lr.verdict === "within_cap" && <span className="badge ok" style={{ marginTop: 8 }}>✓ الإعلان ضمن السقف النظامي</span>}
        </>
      ) : (
        <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "6px 0 0", lineHeight: 1.7 }}>
          {lr.capSource} — القاعدة: السقف = قيمة آخر عقد موثّق في «إيجار». لا نخمّن الأرقام؛ تحقق من عقدك في منصة إيجار.
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <RentCheckerButton className="btn soft sm auto" label="تحقق من وضعك" />
        <Link href="/guide/rent-freeze" className="btn ghost sm auto" style={{ display: "inline-flex" }}>دليل التجميد</Link>
      </div>
    </div>
  );

  return (
    <>
      <ScreenHeader title={TYPE_LABELS[l.propertyType] + " — " + d.nameAr} back />
      <div className="content flush">
        <MediaEmpty height={210} />

        <div style={{ padding: "14px 16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: overCap ? 18 : 23, fontWeight: 700, color: overCap ? "var(--ink-2)" : "var(--navy)" }}>
                {sar(l.price)} ريال{isRent ? "/سنة" : ""}
                {overCap && <span className="badge danger" style={{ marginInlineStart: 8 }}>أعلى من السقف النظامي</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 2px" }}>{l.title}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {d.nameAr}، الرياض · <span style={{ direction: "ltr" }}>{l.ref}</span>
              </div>
            </div>
            {badge?.kind === "below_estimate" && <span className="badge gold">★ أقل من تقدير فَنر بـ {badge.pct}٪</span>}
            {badge?.kind === "above_estimate" && <span className="badge warn">أعلى من تقدير فَنر بـ {badge.pct}٪</span>}
          </div>

          {/* over-cap: the compliance element leads the screen (§4.1) */}
          {overCap && <div style={{ marginTop: 12 }}>{LegalBox}</div>}

          {stale && (
            <div style={{ display: "flex", gap: 8, background: "var(--warn-bg)", border: "1.4px solid var(--warn-line)", borderRadius: 12, padding: "10px 13px", marginTop: 12 }}>
              <span>⏳</span>
              <span style={{ fontSize: 12.5, color: "var(--warn)", fontWeight: 700 }}>
                لم يؤكد المُعلن التوفر منذ أكثر من 45 يوماً — اطلب تأكيداً قبل المعاينة.
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
            {[
              [`${l.areaM2} م²`, "المساحة"], [`${l.bedrooms}`, "غرف"], [`${l.bathrooms}`, "دورات"],
              [`${l.ageYears} سنة`, "العمر"], [l.corner ? "زاوية" : `${l.streetWidthM}م`, "الشارع"],
            ].map(([v, k]) => (
              <div key={k as string} className="card" style={{ padding: "8px 14px", textAlign: "center", flex: "none" }}>
                <b style={{ fontSize: 13.5 }}>{v}</b>
                <div style={{ fontSize: 9.5, color: "var(--ink-3)" }}>{k}</div>
              </div>
            ))}
          </div>

          {!overCap && LegalBox && <div style={{ marginTop: 14 }}>{LegalBox}</div>}

          <div className="card" style={{ marginTop: 12 }}><div className="cpad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ fontSize: 15 }}>تقدير فَنر</b>
              {est.available && <span className="badge info">{CONF_LABELS[est.confidence]}</span>}
            </div>
            {!est.available ? (
              <div className="empty-state" style={{ padding: "16px 6px" }}>
                <span className="ei">📉</span>
                <b>بيانات غير كافية لهذا الحي</b>
                <p>{est.message}. يظهر التقدير فور اكتمال إدخال صفقات وزارة العدل/البورصة العقارية لهذا الحي — لا نعرض أرقاماً غير مشتقة من بيانات حقيقية.</p>
              </div>
            ) : (
              <>
                {overCap && (
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", margin: "4px 0 0" }}>
                    استرشادي فقط — لا يجوز تجاوز السقف النظامي
                  </p>
                )}
                <div style={{ fontSize: overCap ? 15 : 19, fontWeight: 700, color: overCap ? "var(--ink-3)" : "var(--navy)", marginTop: 6 }}>
                  {sar(est.low)} – {sar(est.high)} ريال{isRent ? "/سنة" : ""}
                </div>
                <div className="kv"><span className="k">نقطة التقدير</span><span className="v" style={overCap ? { color: "var(--ink-3)" } : undefined}>{sar(est.value)} ريال</span></div>
                <div className="kv">
                  <span className="k">خط الأساس ({est.baseline.fallbackLevel === "district" ? "الحي" : est.baseline.fallbackLevel === "zone" ? "النطاق" : "المدينة"})</span>
                  <span className="v">{est.baseline.medianM2.toLocaleString("en-US")} ريال/م² · {est.baseline.txCount} صفقة</span>
                </div>
                <div className="kv">
                  <span className="k">مضاعف السمات</span>
                  <span className="v" style={{ direction: "ltr" }}>
                    {est.cappedMultiplier.toFixed(3)}{est.multiplierCapBound ? ` (مقيّد من ${est.rawMultiplier.toFixed(3)})` : ""}
                  </span>
                </div>
                {est.compEstimate != null && (
                  <div className="kv">
                    <span className="k">المزج</span>
                    <span className="v" style={{ fontSize: 11.5 }}>
                      {Math.round((1 - est.compsWeight) * 100)}٪ سمات + {Math.round(est.compsWeight * 100)}٪ صفقات مشابهة
                    </span>
                  </div>
                )}
                {est.compsUsed.length > 0 && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ fontSize: 12.5, fontWeight: 700, color: "var(--primary)", minHeight: 44, display: "flex", alignItems: "center" }}>
                      الصفقات المشابهة المستخدمة ({est.compsUsed.length})
                    </summary>
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th>المصدر</th><th>المساحة</th><th>الصفقة</th><th>عوامل الصفقة</th><th>بعد التسوية</th></tr></thead>
                        <tbody>
                          {est.compsUsed.map((c) => (
                            <tr key={c.id}>
                              <td style={{ fontSize: 10.5 }}>{c.source}</td>
                              <td>{c.areaM2} م²</td>
                              <td>{sar(c.raw)}</td>
                              <td style={{ direction: "ltr", fontSize: 10.5 }}>×{(c.subjectFactorProduct / c.compFactorProduct).toFixed(3)} ×{c.timeAdjustment.toFixed(3)}</td>
                              <td style={{ fontWeight: 700 }}>{sar(c.adjusted)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
                <hr className="hr" />
                <p className="disc" style={{ margin: 0 }}>{est.disclaimer} · النموذج {est.modelVersion}</p>
              </>
            )}
          </div></div>

          <div className="card" style={{ marginTop: 12 }}><div className="cpad">
            <b style={{ fontSize: 15 }}>التوثيق</b>
            <div className="kv" style={{ marginTop: 6 }}><span className="k">✓ رخصة إعلان عقاري</span><span className="v" style={{ direction: "ltr" }}>{l.adLicense.number}</span></div>
            {l.falNumber && <div className="kv"><span className="k">✓ وسيط مرخّص فال</span><span className="v" style={{ direction: "ltr" }}>{l.falNumber}</span></div>}
            {l.advertiserType === "owner_self_listing" && <div className="kv"><span className="k">✓ مالك موثّق</span><span className="v">عبر نفاذ</span></div>}
            <div className="kv"><span className="k">إعادة التحقق</span><span className="v">يومياً — المنتهية تُوقف تلقائياً</span></div>
          </div></div>

          <Link href={`/districts/${d.id}`} className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, marginTop: 12 }}>
            <span style={{ fontSize: 17 }}>📊</span>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 14 }}>بيانات حي {d.nameAr}</b>
              <div className="cs">من الصفقات المُدخلة — أو حالة «بيانات غير كافية» بصراحة</div>
            </div>
            <span style={{ color: "var(--ink-3)" }}>‹</span>
          </Link>

          {similar.length > 0 && (
            <>
              <b style={{ fontSize: 15, display: "block", margin: "16px 0 8px" }}>عقارات مشابهة في {d.nameAr}</b>
              <div className="grid2">
                {similar.map((s) => (
                  <Link key={s.id} href={`/listings/${s.id}`} className="listing-card">
                    <MediaEmpty height={64} label="لا صور" />
                    <div style={{ padding: "8px 11px 10px" }}>
                      <b style={{ fontSize: 13, color: "var(--navy)" }}>{sar(s.price)}{s.listingType === "rent" ? "/سنة" : ""}</b>
                      <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <p className="disc" style={{ textAlign: "center", marginTop: 16 }}>
            رقم الرخصة معروض التزاماً بلائحة الإعلانات العقارية · بيانات المُعلن تُعرض بعد إنشاء طلب تواصل
          </p>
        </div>
      </div>
      <ListingActionBar listingId={l.id} advertiserName={l.advertiserName} advertiserType={l.advertiserType} />
    </>
  );
}
