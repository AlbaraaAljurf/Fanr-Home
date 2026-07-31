import { getDb } from "@/lib/store";
import { sweepExpiredLicenses } from "@/lib/compliance";
import { estimateFromRows, legalRentFor } from "@/lib/avm";
import { computeBaseline } from "@/lib/baselines";
import { sar } from "@/lib/format";
import { marketReference } from "@/lib/marketref";
import { ScreenHeader } from "@/components/Shell";
import AdminActions from "@/components/AdminActions";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const swept = sweepExpiredLicenses();
  const db = getDb();

  const flagged = db.listings.filter((l) => {
    if (l.status !== "live") return false;
    if (l.duplicateOfId) return true;
    if (l.reports.length > 0) return true;
    const d = db.districts.find((x) => x.id === l.districtId)!;
    if (l.listingType === "rent") {
      const lr = legalRentFor(l, d, db.transactions);
      if (lr.verdict === "above_cap") return true;
      const est = estimateFromRows(db.transactions, l, d, "rent");
      if (est.available && l.price < est.value * 0.6) return true; // bait pattern — only when a real estimate exists
    }
    return false;
  });

  const expired = db.listings.filter((l) => l.status === "expired");

  return (
    <>
      <ScreenHeader title="وحدة الإشراف والالتزام" back />
      <main className="wrap">
        <p className="sub">
          كل إجراء إداري مُسجَّل · فحص الرخص اليومي يعمل تلقائياً
          {swept > 0 && <b style={{ color: "var(--danger)" }}> — أوقف الآن {swept} إعلاناً برخصة منتهية</b>}
        </p>

        <div className="ct">قائمة المراجعة ({flagged.length})</div>
        {flagged.length === 0 ? (
          <div className="card"><div className="cpad" style={{ color: "var(--ink-2)", fontSize: 13 }}>لا شيء بانتظار المراجعة ✓</div></div>
        ) : (
          <div className="stack">
            {flagged.map((l) => {
              const d = db.districts.find((x) => x.id === l.districtId)!;
              const lr = l.listingType === "rent" ? legalRentFor(l, d, db.transactions) : null;
              return (
                <div key={l.id} className="card"><div className="cpad">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <a href={`/listings/${l.id}`} style={{ fontWeight: 700, color: "var(--primary)", fontSize: 13.5 }}>{l.title}</a>
                    <b style={{ fontSize: 13 }}>{sar(l.price)}</b>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", direction: "ltr", textAlign: "end" }}>{l.ref}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "8px 0 10px" }}>
                    {lr?.verdict === "above_cap" && <span className="badge danger">أعلى من السقف النظامي</span>}
                    {l.duplicateOfId && <span className="badge danger">مكرر محتمل</span>}
                    {l.reports.length > 0 && <span className="badge warn">{l.reports.length} بلاغ</span>}
                  </div>
                  <AdminActions listingId={l.id} />
                </div></div>
              );
            })}
          </div>
        )}

        <div className="ct" style={{ margin: "18px 0 10px" }}>خط انتهاء الرخص</div>
        {expired.length === 0 ? (
          <div className="card"><div className="cpad" style={{ color: "var(--ink-2)", fontSize: 13 }}>لا رخص منتهية ✓</div></div>
        ) : (
          <div className="stack">
            {expired.map((l) => (
              <div key={l.id} className="card"><div className="cpad" style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <div>
                  <b style={{ fontSize: 13 }}>{l.title}</b>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", direction: "ltr", textAlign: "end" }}>{l.adLicense.number}</div>
                </div>
                <span className="badge danger">أُوقف تلقائياً</span>
              </div></div>
            ))}
          </div>
        )}

        <div className="ct" style={{ margin: "18px 0 10px" }}>خطوط الأساس — من الصفقات المُدخلة فقط</div>
        <div className="tbl-wrap card">
          <table className="tbl">
            <thead><tr><th>الحي</th><th>بيع ريال/م²</th><th>صفقات</th><th>المستوى</th></tr></thead>
            <tbody>
              {db.districts.map((d) => {
                const b = computeBaseline(db.transactions, d.id, "sale");
                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700 }}><a href={`/districts/${d.id}`} style={{ color: "var(--primary)" }}>{d.nameAr}</a></td>
                    {b ? (
                      <>
                        <td>{b.medianM2.toLocaleString("en-US")}</td>
                        <td>{b.txCount}</td>
                        <td>{b.fallbackLevel === "district" ? <span className="badge ok">الحي</span> : b.fallbackLevel === "zone" ? <span className="badge info">النطاق (+هامش)</span> : <span className="badge warn">المدينة (+هامش)</span>}</td>
                      </>
                    ) : (
                      <td colSpan={3}><span className="badge warn">بيانات غير كافية — بانتظار الإدخال</span></td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="ct" style={{ margin: "18px 0 10px" }}>market_reference — قيم مرجعية بمصدر وتاريخ</div>
        <div className="tbl-wrap card">
          <table className="tbl">
            <thead><tr><th>البند</th><th>القيمة</th><th>المصدر</th><th>حتى تاريخ</th></tr></thead>
            <tbody>
              {marketReference().map((e) => (
                <tr key={e.key}>
                  <td style={{ fontWeight: 700 }}>{e.label_ar}</td>
                  <td>{e.value}{e.unit}</td>
                  <td style={{ fontSize: 11 }}>{e.source}</td>
                  <td style={{ direction: "ltr", textAlign: "end" }}>{e.as_of_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="disc" style={{ marginTop: 10 }}>
          الإدخال عبر <span style={{ direction: "ltr", display: "inline-block" }}>scripts/ingest-moj.ts</span> —
          كل صف بمصدر ومرجع وتاريخ، والإدخال قابل لإعادة التشغيل دون تكرار ·
          نطاق التجميد: riyadh-urban-v1-mvp (يُستبدل بمضلع الأمانة الرسمي)
        </p>
      </main>
    </>
  );
}
