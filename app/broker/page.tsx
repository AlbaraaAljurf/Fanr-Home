import Link from "next/link";
import { getDb } from "@/lib/store";
import { sar } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function BrokerPage() {
  const db = getDb();
  const mine = db.listings.filter((l) => l.falNumber === "1100254");
  const live = mine.filter((l) => l.status === "live");
  const leads = mine.reduce((a, l) => a + l.leads.length, 0);
  const expiringSoon = live.filter(
    (l) => new Date(l.adLicense.expiresAt).getTime() - Date.now() < 14 * 86400000
  );

  return (
    <main className="wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="h1" style={{ marginBottom: 2 }}>مكتب المستقبل العقاري 💼</h1>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="badge ok">✓ فال 1100254 — سارية</span>
            <span className="badge gold">⭐ رد خلال ساعتين</span>
          </div>
        </div>
        <Link href="/broker/new" className="btn" style={{ marginInlineStart: "auto" }}>＋ إعلان جديد</Link>
      </div>

      <div className="grid3" style={{ marginTop: 20 }}>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)" }}>{live.length}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>إعلاناً حياً</div>
        </div></div>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)" }}>{leads}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>طلب تواصل مستلم</div>
        </div></div>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 26, fontWeight: 900, color: expiringSoon.length ? "var(--warn)" : "var(--navy)" }}>{expiringSoon.length}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>رخصة تنتهي خلال 14 يوماً</div>
        </div></div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="card" style={{ marginTop: 14, background: "var(--warn-bg)", borderColor: "var(--warn-line)" }}>
          <div className="cpad" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ fontSize: 13.5, color: "var(--warn)", fontWeight: 700 }}>
              جدّد رخص الإعلان في «فال» قبل الإيقاف التلقائي — التذكيرات عند 14 و7 و1 يوم من الانتهاء.
            </div>
          </div>
        </div>
      )}

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>إعلاناتك</h2>
      <div className="tbl-wrap card">
        <table className="tbl">
          <thead>
            <tr><th>الإعلان</th><th>السعر</th><th>رخصة الإعلان</th><th>الحالة</th><th>الطلبات</th><th>المشاهدات</th></tr>
          </thead>
          <tbody>
            {mine.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/listings/${l.id}`} style={{ fontWeight: 700, color: "var(--primary)" }}>{l.title}</Link></td>
                <td style={{ whiteSpace: "nowrap" }}>{sar(l.price)}{l.listingType === "rent" ? "/سنة" : ""}</td>
                <td style={{ direction: "ltr", textAlign: "right" }}>{l.adLicense.number}</td>
                <td>
                  {l.status === "live" && <span className="badge ok">حي</span>}
                  {l.status === "expired" && <span className="badge danger">موقوف — رخصة منتهية</span>}
                  {l.status === "pending_review" && <span className="badge warn">قيد المراجعة</span>}
                </td>
                <td>{l.leads.length}</td>
                <td>{l.viewCount.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>آخر الطلبات المستلمة</h2>
      <div className="grid3">
        {mine.flatMap((l) => l.leads.map((ld) => ({ ld, l }))).slice(0, 6).map(({ ld, l }) => (
          <div key={ld.id} className="card"><div className="cpad">
            <b style={{ fontSize: 14 }}>{ld.name}</b>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              {l.title} · {ld.interest === "viewing" ? "طلب معاينة" : ld.interest === "inquiry" ? "استفسار" : "تفاوض"}
            </div>
            <div style={{ fontSize: 12, marginTop: 6, direction: "ltr", textAlign: "right", fontWeight: 700 }}>{ld.phone}</div>
          </div></div>
        ))}
        {leads === 0 && (
          <div className="card"><div className="cpad" style={{ color: "var(--ink-2)", fontSize: 13.5 }}>
            لا طلبات بعد — أنشئ طلباً تجريبياً من أي صفحة عقار لرؤيته هنا.
          </div></div>
        )}
      </div>
    </main>
  );
}
