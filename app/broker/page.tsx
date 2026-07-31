import Link from "next/link";
import { getDb } from "@/lib/store";
import { sar } from "@/lib/format";
import { BrokerLeadActions, ConfirmListingButton } from "@/components/BrokerLeadActions";

export const dynamic = "force-dynamic";

function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

function daysSince(iso?: string): number {
  return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 0;
}

export default function BrokerPage() {
  const db = getDb();
  const mine = db.listings.filter((l) => l.falNumber === "1100254");
  const live = mine.filter((l) => l.status === "live");
  const allLeads = mine.flatMap((l) => l.leads.map((ld) => ({ ld, l })));
  const expiringSoon = live.filter(
    (l) => new Date(l.adLicense.expiresAt).getTime() - Date.now() < 14 * 86400000
  );

  // Earned response badge (R-E7-4): median first-response time over responded leads
  const responseTimes = allLeads
    .filter(({ ld }) => ld.respondedAt)
    .map(({ ld }) => hoursBetween(ld.createdAt, ld.respondedAt!))
    .sort((a, b) => a - b);
  const medianResponseH = responseTimes.length
    ? responseTimes[Math.floor(responseTimes.length / 2)]
    : null;
  const respondedPct = allLeads.length
    ? Math.round((allLeads.filter(({ ld }) => (ld.status ?? "new") !== "new").length / allLeads.length) * 100)
    : null;
  const overdue = allLeads.filter(
    ({ ld }) => (ld.status ?? "new") === "new" && hoursBetween(ld.createdAt, new Date().toISOString()) > 6
  );
  const needConfirm = live.filter((l) => daysSince(l.lastConfirmedAt ?? l.createdAt) >= 30);

  return (
    <main className="wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="h1" style={{ marginBottom: 2 }}>مكتب المستقبل العقاري 💼</h1>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="badge ok">✓ فال 1100254 — سارية</span>
            {medianResponseH != null && medianResponseH <= 6 ? (
              <span className="badge gold">
                ⭐ رد خلال {medianResponseH < 1 ? "أقل من ساعة" : `${Math.round(medianResponseH)} ساعات`} — شارة مكتسبة
              </span>
            ) : medianResponseH != null ? (
              <span className="badge warn">متوسط الرد {Math.round(medianResponseH)} ساعة — الشارة تُمنح تحت 6 ساعات</span>
            ) : (
              <span className="badge navy">لا بيانات رد بعد</span>
            )}
            {respondedPct != null && <span className="badge info">نسبة الرد {respondedPct}٪</span>}
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
          <div style={{ fontSize: 26, fontWeight: 900, color: overdue.length ? "var(--danger)" : "var(--navy)" }}>{overdue.length}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>طلب تجاوز مهلة الرد (6 ساعات)</div>
        </div></div>
        <div className="card"><div className="cpad">
          <div style={{ fontSize: 26, fontWeight: 900, color: needConfirm.length ? "var(--warn)" : "var(--navy)" }}>{needConfirm.length}</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>إعلان يحتاج تأكيد التوفر (كل 30 يوماً)</div>
        </div></div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="card" style={{ marginTop: 14, background: "var(--warn-bg)", borderColor: "var(--warn-line)" }}>
          <div className="cpad" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ fontSize: 13.5, color: "var(--warn)", fontWeight: 700 }}>
              {expiringSoon.length} رخصة إعلان تنتهي خلال 14 يوماً — جدّدها في «فال» قبل الإيقاف التلقائي.
            </div>
          </div>
        </div>
      )}

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>صندوق الطلبات</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {allLeads
          .sort((a, b) => new Date(b.ld.createdAt).getTime() - new Date(a.ld.createdAt).getTime())
          .map(({ ld, l }) => {
            const st = ld.status ?? "new";
            const waitedH = hoursBetween(ld.createdAt, new Date().toISOString());
            return (
              <div key={ld.id} className="card" style={st === "new" && waitedH > 6 ? { borderColor: "#F0C1B8" } : undefined}>
                <div className="cpad" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <b style={{ fontSize: 14 }}>{ld.name}</b>{" "}
                    {st === "new" && <span className="badge info">جديد</span>}
                    {st === "responded" && <span className="badge navy">تم الرد</span>}
                    {st === "qualified" && <span className="badge ok">مؤهل</span>}
                    {st === "closed" && <span className="badge" style={{ background: "#EEF0F5", color: "var(--ink-3)" }}>مغلق</span>}
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                      {l.title} · {ld.interest === "viewing" ? "طلب معاينة" : ld.interest === "inquiry" ? "استفسار" : "تفاوض"} ·{" "}
                      قبل {waitedH < 1 ? "أقل من ساعة" : `${Math.round(waitedH)} ساعة`}
                      {ld.respondedAt && ` · رُدّ خلال ${Math.max(1, Math.round(hoursBetween(ld.createdAt, ld.respondedAt)))} ساعة`}
                    </div>
                    {st === "new" && waitedH > 6 && (
                      <div style={{ fontSize: 11.5, color: "var(--danger)", fontWeight: 800, marginTop: 3 }}>
                        ⏱ تجاوز مهلة الـ6 ساعات — يؤثر على شارة «رد سريع» وترتيب إعلاناتك
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, direction: "ltr" }}>{ld.phone}</span>
                  <BrokerLeadActions listingId={l.id} leadId={ld.id} status={st} />
                </div>
              </div>
            );
          })}
        {allLeads.length === 0 && (
          <div className="card"><div className="cpad" style={{ color: "var(--ink-2)", fontSize: 13.5 }}>
            لا طلبات بعد — أنشئ طلباً تجريبياً من أي صفحة عقار لرؤيته هنا.
          </div></div>
        )}
      </div>

      <h2 className="ct" style={{ fontSize: 17, margin: "24px 0 10px" }}>إعلاناتك</h2>
      <div className="tbl-wrap card">
        <table className="tbl">
          <thead>
            <tr><th>الإعلان</th><th>السعر</th><th>رخصة الإعلان</th><th>الحالة</th><th>آخر تأكيد توفر</th><th>الطلبات</th></tr>
          </thead>
          <tbody>
            {mine.map((l) => {
              const staleD = daysSince(l.lastConfirmedAt ?? l.createdAt);
              return (
                <tr key={l.id}>
                  <td><Link href={`/listings/${l.id}`} style={{ fontWeight: 700, color: "var(--primary)" }}>{l.title}</Link></td>
                  <td style={{ whiteSpace: "nowrap" }}>{sar(l.price)}{l.listingType === "rent" ? "/سنة" : ""}</td>
                  <td style={{ direction: "ltr", textAlign: "right" }}>{l.adLicense.number}</td>
                  <td>
                    {l.status === "live" && <span className="badge ok">حي</span>}
                    {l.status === "expired" && <span className="badge danger">موقوف — رخصة منتهية</span>}
                    {l.status === "rejected" && <span className="badge danger">موقوف إدارياً</span>}
                  </td>
                  <td>
                    {l.status !== "live" ? "—" : staleD >= 30 ? (
                      <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                        <span className="badge warn">قبل {staleD} يوماً</span>
                        <ConfirmListingButton listingId={l.id} />
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>قبل {staleD} يوماً ✓</span>
                    )}
                  </td>
                  <td>{l.leads.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="disc" style={{ marginTop: 10 }}>
        الإعلانات غير المؤكدة أكثر من 45 يوماً تُوسم للزوار «قد لا يكون متاحاً» وتُخفَّض في الترتيب —
        الجودة قرار اقتصادي (E7.2)
      </p>
    </main>
  );
}
