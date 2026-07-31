import { getDb } from "@/lib/store";
import { sweepExpiredLicenses } from "@/lib/compliance";
import { estimateRent, legalRentFor, yieldGuardrail } from "@/lib/avm";
import { sar } from "@/lib/format";
import AdminActions from "@/components/AdminActions";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  // The "daily batch" (R3.1.4) — run opportunistically here for the MVP
  const swept = sweepExpiredLicenses();
  const db = getDb();

  const flagged = db.listings.filter((l) => {
    if (l.status !== "live") return false;
    if (l.duplicateOfId) return true; // E1-S5
    const d = db.districts.find((x) => x.id === l.districtId)!;
    if (l.listingType === "rent") {
      const lr = legalRentFor(l, d);
      if (lr.verdict === "above_cap") return true;
      const est = estimateRent(l, d);
      if (l.price < est.value * 0.6) return true; // bait-price pattern
    }
    return l.reports.length > 0;
  });

  const expiring = db.listings.filter(
    (l) => l.status === "live" && new Date(l.adLicense.expiresAt).getTime() - Date.now() < 14 * 86400000
  );
  const expired = db.listings.filter((l) => l.status === "expired");

  return (
    <main className="wrap">
      <h1 className="h1">وحدة الإشراف والالتزام 🛡</h1>
      <p className="sub">
        كل إجراء إداري مُسجَّل وغير قابل للتعديل في الإنتاج · فحص الرخص اليومي يعمل تلقائياً
        {swept > 0 && <b style={{ color: "var(--danger)" }}> — أوقف الآن {swept} إعلاناً برخصة منتهية</b>}
      </p>

      <div className="grid3">
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)" }}>{db.listings.filter((l) => l.status === "live").length}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>إعلان حي — تغطية الرخص 100٪</div>
        </div></div>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 26, fontWeight: 900, color: flagged.length ? "var(--warn)" : "var(--navy)" }}>{flagged.length}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>إعلاناً بحاجة لمراجعة (سقف/سعر شاذ/بلاغ)</div>
        </div></div>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 26, fontWeight: 900, color: expired.length ? "var(--danger)" : "var(--navy)" }}>{expired.length}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>موقوف تلقائياً — رخصة منتهية</div>
        </div></div>
      </div>

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>قائمة المراجعة</h2>
      <div className="tbl-wrap card">
        <table className="tbl">
          <thead>
            <tr><th>الإعلان</th><th>المُعلن</th><th>السعر</th><th>الأعلام</th><th>البلاغات</th><th>إجراء</th></tr>
          </thead>
          <tbody>
            {flagged.map((l) => {
              const d = db.districts.find((x) => x.id === l.districtId)!;
              const lr = l.listingType === "rent" ? legalRentFor(l, d) : null;
              const est = l.listingType === "rent" ? estimateRent(l, d) : null;
              return (
                <tr key={l.id}>
                  <td><a href={`/listings/${l.id}`} style={{ fontWeight: 700, color: "var(--primary)" }}>{l.title}</a><div style={{ fontSize: 11, direction: "ltr", textAlign: "right", color: "var(--ink-3)" }}>{l.ref}</div></td>
                  <td>{l.advertiserName}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{sar(l.price)}</td>
                  <td>
                    {lr?.verdict === "above_cap" && <span className="badge warn">أعلى من السقف النظامي</span>}{" "}
                    {est && l.price < est.value * 0.6 && <span className="badge danger">سعر شاذ — نمط طُعم</span>}{" "}
                    {l.duplicateOfId && <span className="badge danger">مكرر محتمل — {db.listings.find((x) => x.id === l.duplicateOfId)?.ref ?? l.duplicateOfId}</span>}
                  </td>
                  <td>{l.reports.length > 0 ? <span className="badge danger">{l.reports.length} بلاغ</span> : "—"}</td>
                  <td><AdminActions listingId={l.id} /></td>
                </tr>
              );
            })}
            {flagged.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-3)" }}>لا شيء بانتظار المراجعة ✓</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>خط انتهاء الرخص (14 يوماً)</h2>
      <div className="tbl-wrap card">
        <table className="tbl">
          <thead><tr><th>الإعلان</th><th>رخصة الإعلان</th><th>تنتهي</th><th>الحالة</th></tr></thead>
          <tbody>
            {[...expiring, ...expired].map((l) => (
              <tr key={l.id}>
                <td>{l.title}</td>
                <td style={{ direction: "ltr", textAlign: "right" }}>{l.adLicense.number}</td>
                <td>{new Date(l.adLicense.expiresAt).toLocaleDateString("en-GB")}</td>
                <td>{l.status === "expired" ? <span className="badge danger">أُوقف تلقائياً — المُعلن أُشعر</span> : <span className="badge warn">قرب الانتهاء — تذكير مُرسل</span>}</td>
              </tr>
            ))}
            {expiring.length + expired.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)" }}>لا رخص قرب الانتهاء ✓</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>مراقبة تقدير فَنر — خطوط الأساس (الطبقة 1)</h2>
      <div className="tbl-wrap card">
        <table className="tbl">
          <thead><tr><th>الحي</th><th>بيع ريال/م²</th><th>إيجار ريال/م²</th><th>صفقات 12 شهراً</th><th>العائد الضمني (حارس 3–10٪)</th><th>الثقة الممنوحة</th></tr></thead>
          <tbody>
            {db.districts.map((d) => {
              const yg = yieldGuardrail(
                { propertyType: "apartment", areaM2: 150, ageYears: 5, finishGrade: "standard", floor: 2, elevator: true, parkingSpaces: 1, streetWidthM: 15, corner: false, orientation: "north" },
                d
              );
              return (
                <tr key={d.id}>
                  <td style={{ fontWeight: 700 }}><a href={`/districts/${d.id}`} style={{ color: "var(--primary)" }}>{d.nameAr}</a></td>
                  <td>{d.basePriceM2Sale.toLocaleString("en-US")}</td>
                  <td>{d.baseRentM2Annual}</td>
                  <td>{d.txCount12m}</td>
                  <td>
                    {yg ? (
                      yg.ok ? <span className="badge ok">{yg.yieldPct}٪ ✓</span> : <span className="badge danger">{yg.yieldPct}٪ — خارج النطاق، راجع</span>
                    ) : "—"}
                  </td>
                  <td>
                    {d.txCount12m >= 150 ? <span className="badge ok">عالية</span> : d.txCount12m >= 90 ? <span className="badge info">متوسطة</span> : <span className="badge warn">منخفضة — نطاق أوسع</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="disc" style={{ marginTop: 10 }}>
        نطاق تجميد الرياض: نسخة الحدود riyadh-urban-v1-mvp (سارية من 25-09-2025) — تُستبدل بالمضلع الرسمي من أمانة الرياض عبر محرر الحدود المُصدَّر.
      </p>
    </main>
  );
}
