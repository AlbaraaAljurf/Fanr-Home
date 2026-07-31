"use client";

import { useState } from "react";
import { Sheet } from "./Shell";
import { FREEZE_LABELS } from "@/lib/format";

type Freeze = "currently_leased" | "previously_leased_vacant" | "never_leased";

/**
 * «هل إيجاري نظامي؟» — opens as a bottom sheet (Phase 1.4).
 * Pure rule explanation over user-supplied numbers; nothing is estimated.
 */
export function RentCheckerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [freeze, setFreeze] = useState<Freeze>("currently_leased");
  const [current, setCurrent] = useState("");
  const [demanded, setDemanded] = useState("");
  const [result, setResult] = useState<null | { verdict: "unlawful" | "lawful" | "by_agreement" }>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (freeze === "never_leased") setResult({ verdict: "by_agreement" });
    else setResult({ verdict: (Number(demanded) || 0) > (Number(current) || 0) ? "unlawful" : "lawful" });
  }

  return (
    <Sheet open={open} onClose={onClose} title="هل إيجاري نظامي؟ ⚖">
      <p className="disc" style={{ marginTop: 0 }}>
        تحقق من وضعك تحت قرار تجميد إيجارات الرياض (25 سبتمبر 2025 → 2030). الأداة تشرح الأنظمة
        على أرقامك أنت ولا تصدر استنتاجاً قانونياً — القرار النهائي للهيئة العامة للعقار.
      </p>
      <form onSubmit={check}>
        <div className="field">
          <label>وضع العقار في 25 سبتمبر 2025</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(Object.keys(FREEZE_LABELS) as Freeze[]).map((k) => (
              <span key={k} className={`chip sm ${freeze === k ? "sel" : ""}`} onClick={() => { setFreeze(k); setResult(null); }}>
                {FREEZE_LABELS[k]}
              </span>
            ))}
          </div>
        </div>
        {freeze !== "never_leased" && (
          <div className="field">
            <label>قيمة عقدك الموثّق في «إيجار» (ريال/سنة)</label>
            <input value={current} onChange={(e) => { setCurrent(e.target.value); setResult(null); }} inputMode="numeric" dir="ltr" required placeholder="مثال: 58000" />
          </div>
        )}
        <div className="field">
          <label>الإيجار المطلوب منك الآن (ريال/سنة)</label>
          <input value={demanded} onChange={(e) => { setDemanded(e.target.value); setResult(null); }} inputMode="numeric" dir="ltr" required placeholder="مثال: 66000" />
        </div>
        <button className="btn">تحقّق الآن</button>
      </form>

      {result && (
        <div className="card" style={{ marginTop: 14, textAlign: "center", borderColor: result.verdict === "unlawful" ? "#F0C1B8" : result.verdict === "lawful" ? "#BFE3CC" : "var(--warn-line)" }}>
          <div className="cpad">
            {result.verdict === "unlawful" && (
              <>
                <div style={{ fontSize: 32 }}>🚫</div>
                <b style={{ fontSize: 16, color: "var(--danger)", display: "block", margin: "4px 0" }}>الزيادة المطلوبة غير نظامية</b>
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.8 }}>
                  عقارك {FREEZE_LABELS[freeze]} داخل النطاق العمراني للرياض — الإيجار مجمّد عند قيمة
                  عقدك الموثّق حتى 2030، والمطلوب يتجاوزها.
                </p>
              </>
            )}
            {result.verdict === "lawful" && (
              <>
                <div style={{ fontSize: 32 }}>✅</div>
                <b style={{ fontSize: 16, color: "var(--ok)", display: "block", margin: "4px 0" }}>المطلوب ضمن السقف النظامي</b>
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.8 }}>
                  لا يتجاوز قيمة عقدك الموثّق — ولا يجوز تضمين أي بند زيادة مستقبلية أثناء التجميد.
                </p>
              </>
            )}
            {result.verdict === "by_agreement" && (
              <>
                <div style={{ fontSize: 32 }}>🤝</div>
                <b style={{ fontSize: 16, color: "var(--warn)", display: "block", margin: "4px 0" }}>تُحدد بالاتفاق — ثم تُجمَّد</b>
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.8 }}>
                  العقار لم يؤجَّر من قبل: يتفق الطرفان على القيمة الأولى وبعدها تثبت لخمس سنوات.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="stack" style={{ marginTop: 12 }}>
          {[
            ["🔄", "التجديد التلقائي يحميك", "يتجدد العقد تلقائياً بنفس القيمة ما لم يُخطر أي طرف الآخر قبل 60 يوماً من الانتهاء."],
            ["📋", "التوثيق في «إيجار» إلزامي", "إن لم يوثّق المؤجر العقد، يحق لك أنت طلب التوثيق."],
            ["⏱", "نافذة الاعتراض 60 يوماً", "لأي طرف الاعتراض على تفاصيل العقد أمام الهيئة العامة للعقار خلال 60 يوماً."],
          ].map(([ic, t, d]) => (
            <div key={t} className="card"><div className="cpad" style={{ display: "flex", gap: 10 }}>
              <span style={{ fontSize: 17 }}>{ic}</span>
              <div><b style={{ fontSize: 13.5 }}>{t}</b><p className="disc" style={{ margin: "2px 0 0" }}>{d}</p></div>
            </div></div>
          ))}
          <p className="disc" style={{ textAlign: "center" }}>
            لا يعرف فَنر قيمة عقدك — القاعدة: السقف = آخر عقد موثّق في «إيجار»؛ تحقق من عقودك هناك.
          </p>
        </div>
      )}
    </Sheet>
  );
}

/** Convenience trigger usable from any screen. */
export function RentCheckerButton({ className = "btn", label = "⚖ هل إيجاري نظامي؟" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>{label}</button>
      <RentCheckerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
