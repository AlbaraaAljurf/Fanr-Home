import Link from "next/link";
import { LEASES, renewalStage, endDate } from "@/lib/leases";
import { sar } from "@/lib/format";
import { ScreenHeader } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default function RenewalsPage() {
  return (
    <>
      <ScreenHeader title="تقويم التجديدات" back />
      <main className="wrap">
      <p className="sub">
        عقودك المسجلة في «إيجار» — القاعدة النظامية: العقد يتجدد تلقائياً بنفس القيمة ما لم يُخطر
        أي طرف الآخر قبل <b>60 يوماً</b> من الانتهاء. فَنر ينبّهك عند 90 و65 يوماً، قبل انقضاء المهلة.
      </p>

      {LEASES.map((l) => {
        const stage = renewalStage(l);
        const end = endDate(l);
        const noticeDeadlineDays = l.daysToEnd - 60; // days left to send a notice
        const pct = Math.min(100, Math.max(4, ((365 - l.daysToEnd) / 365) * 100));
        return (
          <div key={l.id} className="card" style={{ marginBottom: 14, borderColor: stage === "notice_window_soon" ? "var(--warn-line)" : undefined }}>
            <div className="cpad">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 20 }}>{stage === "ok" ? "🗓" : "⏰"}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <b style={{ fontSize: 15 }}>{l.propertyTitle} — {l.tenantName}</b>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    ينتهي {end.toLocaleDateString("en-GB")} · {sar(l.annualRent)} ريال/سنة ·{" "}
                    {l.ejarRegistered ? "موثّق في إيجار ✓" : "غير موثّق"}
                  </div>
                </div>
                {stage === "notice_window_soon" && <span className="badge warn">باقي {l.daysToEnd} يوماً — قرّر الآن</span>}
                {stage === "alert_90" && <span className="badge info">تنبيه 90 يوماً</span>}
                {stage === "ok" && <span className="badge ok">سارٍ</span>}
              </div>

              <div style={{ height: 9, background: "#F0F3FB", borderRadius: 6, marginTop: 12, overflow: "hidden" }}>
                <span style={{ display: "block", width: `${pct}%`, height: "100%", borderRadius: 6, background: stage === "notice_window_soon" ? "linear-gradient(90deg,var(--gold),#E8A90D)" : "var(--sky)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--ink-3)", marginTop: 4 }}>
                <span>تنبيه 90 يوماً {l.daysToEnd <= 90 ? "✓" : ""}</span>
                <span style={stage === "notice_window_soon" ? { color: "var(--warn)", fontWeight: 800 } : undefined}>
                  تنبيه 65 يوماً {l.daysToEnd <= 65 ? "— الآن" : ""}
                </span>
                <span>مهلة الإخطار 60 يوماً</span>
              </div>

              {stage === "notice_window_soon" && (
                <>
                  <div style={{ display: "flex", gap: 8, background: "var(--info-bg)", borderRadius: 11, padding: "10px 12px", marginTop: 12 }}>
                    <span>⚖</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
                      أمامك <b>{noticeDeadlineDays} أيام</b> لإرسال إخطار عدم التجديد إن رغبت — بعدها
                      يتجدد العقد تلقائياً بنفس القيمة. والزيادة ممنوعة أثناء التجميد بأي حال (الرياض، حتى 2030).
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <span className="btn sm">جدّد بنفس القيمة ✓</span>
                    <span className="btn ghost sm">أرسل إخطار عدم التجديد</span>
                    <Link href="/owner/ejar-pack" className="btn soft sm">📄 جهّز حزمة إيجار للعقد الجديد</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      <p className="disc" style={{ textAlign: "center", marginTop: 8 }}>
        التنبيهات تصل للمؤجر والمستأجر معاً (إشعار + واتساب في الإنتاج) — الشفافية تخدم الطرفين ·
        <Link href="/guide/rent-freeze" style={{ color: "var(--primary)", fontWeight: 700 }}> دليل التجميد والتجديد التلقائي</Link>
      </p>
    </main>
    </>
  );
}
