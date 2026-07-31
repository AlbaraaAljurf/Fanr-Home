"use client";

import { useState } from "react";
import { FREEZE_LABELS } from "@/lib/format";

type Freeze = "currently_leased" | "previously_leased_vacant" | "never_leased";

export default function RentChecker() {
  const [freeze, setFreeze] = useState<Freeze>("currently_leased");
  const [current, setCurrent] = useState("58000");
  const [demanded, setDemanded] = useState("66000");
  const [result, setResult] = useState<null | {
    verdict: "unlawful" | "lawful" | "by_agreement";
    cap: number | null;
  }>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    const cur = Number(current) || 0;
    const dem = Number(demanded) || 0;
    if (freeze === "never_leased") {
      setResult({ verdict: "by_agreement", cap: null });
    } else {
      setResult({ verdict: dem > cur ? "unlawful" : "lawful", cap: cur });
    }
  }

  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <h1 className="h1">هل إيجاري نظامي؟ ⚖</h1>
      <p className="sub">
        تحقق مجاني من وضعك تحت قرار تجميد الإيجارات في الرياض (25 سبتمبر 2025 → 2030).
        الأداة تشرح الأنظمة ولا تصدر استنتاجاً قانونياً — القرار النهائي للهيئة العامة للعقار.
      </p>

      <div className="card"><div className="cpad">
        <form onSubmit={check}>
          <div className="field">
            <label>المدينة</label>
            <input value="الرياض — داخل النطاق العمراني (يشمله التجميد)" readOnly />
          </div>
          <div className="field">
            <label>وضع العقار في 25 سبتمبر 2025</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(Object.keys(FREEZE_LABELS) as Freeze[]).map((k) => (
                <span key={k} className={`chip ${freeze === k ? "sel" : ""}`} onClick={() => { setFreeze(k); setResult(null); }}>
                  {FREEZE_LABELS[k]}
                </span>
              ))}
            </div>
          </div>
          {freeze !== "never_leased" && (
            <div className="field">
              <label>قيمة عقدك الحالي/الأخير الموثّق في «إيجار» (ريال/سنة)</label>
              <input value={current} onChange={(e) => { setCurrent(e.target.value); setResult(null); }} inputMode="numeric" dir="ltr" required />
            </div>
          )}
          <div className="field">
            <label>الإيجار المطلوب منك الآن (ريال/سنة)</label>
            <input value={demanded} onChange={(e) => { setDemanded(e.target.value); setResult(null); }} inputMode="numeric" dir="ltr" required />
          </div>
          <button className="btn" style={{ width: "100%" }}>تحقّق الآن</button>
        </form>
      </div></div>

      {result && (
        <div
          className="card"
          style={{
            marginTop: 16,
            borderColor: result.verdict === "unlawful" ? "#F0C1B8" : result.verdict === "lawful" ? "#BFE3CC" : "#F0DD9A",
            background: result.verdict === "unlawful" ? "#FDF3F1" : result.verdict === "lawful" ? "#F3FBF5" : "#FEFBEF",
          }}
        >
          <div className="cpad" style={{ textAlign: "center" }}>
            {result.verdict === "unlawful" && (
              <>
                <div style={{ fontSize: 40 }}>🚫</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--danger)", margin: "6px 0" }}>الزيادة المطلوبة غير نظامية</h2>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
                  عقارك {FREEZE_LABELS[freeze]} داخل النطاق العمراني للرياض — الإيجار مجمّد عند قيمة
                  عقدك الموثّق ({Number(current).toLocaleString("en-US")} ريال/سنة) حتى 2030.
                  المطلوب منك ({Number(demanded).toLocaleString("en-US")}) يتجاوز السقف بـ{" "}
                  {Math.round(((Number(demanded) - Number(current)) / Number(current)) * 100)}٪.
                </p>
              </>
            )}
            {result.verdict === "lawful" && (
              <>
                <div style={{ fontSize: 40 }}>✅</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ok)", margin: "6px 0" }}>المطلوب ضمن السقف النظامي</h2>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
                  المطلوب لا يتجاوز قيمة عقدك الموثّق — وتذكّر: لا يجوز تضمين أي بند زيادة مستقبلية أثناء فترة التجميد.
                </p>
              </>
            )}
            {result.verdict === "by_agreement" && (
              <>
                <div style={{ fontSize: 40 }}>🤝</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--warn)", margin: "6px 0" }}>القيمة تُحدد بالاتفاق — ثم تُجمَّد</h2>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
                  العقار لم يؤجَّر من قبل: يتفق الطرفان على القيمة الأولى، وبعدها تُثبَّت لخمس سنوات ولا تجوز زيادتها.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {result && (
        <>
          <h3 className="ct" style={{ margin: "20px 0 10px" }}>حقوقك تحت النظام</h3>
          <div className="grid3">
            {[
              ["🔄", "التجديد التلقائي يحميك", "عقدك يتجدد تلقائياً بنفس القيمة ما لم يُخطر أي طرف الآخر قبل 60 يوماً من الانتهاء."],
              ["📋", "التوثيق في «إيجار» إلزامي", "إن لم يوثّق المؤجر العقد، يحق لك أنت طلب التوثيق مباشرة."],
              ["⏱", "نافذة الاعتراض 60 يوماً", "لأي طرف الاعتراض على تفاصيل العقد أمام الهيئة العامة للعقار خلال 60 يوماً من التوثيق."],
            ].map(([icon, t, dsc]) => (
              <div key={t} className="card"><div className="cpad">
                <div style={{ fontSize: 22 }}>{icon}</div>
                <b style={{ fontSize: 14, display: "block", margin: "6px 0 4px" }}>{t}</b>
                <p className="disc" style={{ margin: 0 }}>{dsc}</p>
              </div></div>
            ))}
          </div>
          <p className="disc" style={{ textAlign: "center", marginTop: 18 }}>
            إذا لم يكن آخر عقد موثّقاً لديك، القاعدة هي: السقف = قيمة آخر عقد موثّق في منصة «إيجار» —
            تحقق من عقودك هناك؛ فَنر لا يخمّن الأرقام أبداً.
          </p>
        </>
      )}
    </main>
  );
}
