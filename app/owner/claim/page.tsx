"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TYPE_LABELS } from "@/lib/format";
import { ScreenHeader } from "@/components/Shell";

const DISTRICTS = [
  ["al-narjis", "النرجس"], ["al-malqa", "الملقا"], ["hittin", "حطين"], ["al-yasmin", "الياسمين"],
  ["al-aqiq", "العقيق"], ["qurtubah", "قرطبة"], ["al-wadi", "الوادي"], ["al-sahafah", "الصحافة"],
  ["an-nada", "الندى"], ["ar-rabi", "الربيع"],
] as const;

export default function ClaimPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    ownerName: "",
    title: "",
    districtId: "al-malqa",
    propertyType: "apartment",
    areaM2: "150",
    ageYears: "5",
    finishGrade: "standard",
    deed: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function finish() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/v1/homes/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    setBusy(false);
    if (j.success) router.push("/owner");
    else setErr(j.error);
  }

  const StepDot = ({ n, label }: { n: number; label: string }) => (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800,
        background: step > n ? "var(--green)" : step === n ? "var(--primary)" : "#fff",
        color: step >= n ? "#fff" : "var(--ink-3)",
        border: step >= n ? "none" : "1.5px solid var(--line)",
      }}>{step > n ? "✓" : n}</div>
      <div style={{ fontSize: 11, fontWeight: 800, marginTop: 5, color: step >= n ? "var(--primary)" : "var(--ink-3)" }}>{label}</div>
    </div>
  );

  return (
    <>
      <ScreenHeader title="اطلب ملكية عقارك" back />
      <main className="wrap">
      <p className="sub">تابع قيمته شهرياً، وصحّح بياناته، وأعلن عنه بشارة «مالك» الموثّقة</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        <StepDot n={1} label="الهوية — نفاذ" />
        <StepDot n={2} label="العقار والصك" />
        <StepDot n={3} label="تم" />
      </div>

      {step === 1 && (
        <div className="card"><div className="cpad" style={{ textAlign: "center", padding: "26px 20px" }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: "#0C5548", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 12px" }}>☝</div>
          <h2 className="ct" style={{ fontSize: 16 }}>تحقق عبر نفاذ</h2>
          <p className="disc" style={{ maxWidth: 380, margin: "0 auto 6px" }}>
            افتح تطبيق نفاذ واختر الرقم الظاهر. (محاكاة في النسخة التجريبية — تكامل النفاذ الوطني
            الموحّد هو بوابة الإنتاج لكل أطراف الإيجار، R3.2.4)
          </p>
          <div style={{ fontSize: 34, fontWeight: 900, color: "#0C5548", background: "#EAF5F2", borderRadius: 14, padding: "12px", width: 110, margin: "14px auto" }}>44</div>
          <div className="field" style={{ maxWidth: 300, margin: "0 auto 12px", textAlign: "start" }}>
            <label>اسمك (كما في الهوية)</label>
            <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="عبدالله السالم" />
          </div>
          <button className="btn" style={{ background: "#0C5548", minWidth: 220 }} disabled={!form.ownerName.trim()} onClick={() => setStep(2)}>
            تحققت في نفاذ — متابعة
          </button>
          <p className="disc" style={{ marginTop: 12 }}>
            🔒 بياناتك محمية وفق نظام حماية البيانات الشخصية — استضافة داخل المملكة
          </p>
        </div></div>
      )}

      {step === 2 && (
        <div className="card"><div className="cpad">
          <h2 className="ct" style={{ fontSize: 16 }}>بيانات العقار والتحقق من الصك</h2>
          <div className="grid2">
            <div className="field"><label>وصف العقار</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="فيلا الياسمين — سكن العائلة" /></div>
            <div className="field"><label>الحي</label>
              <select value={form.districtId} onChange={(e) => set("districtId", e.target.value)}>
                {DISTRICTS.map(([id, ar]) => <option key={id} value={id}>{ar}</option>)}
              </select></div>
            <div className="field"><label>النوع</label>
              <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div className="field"><label>المساحة (م²)</label>
              <input value={form.areaM2} onChange={(e) => set("areaM2", e.target.value)} inputMode="numeric" dir="ltr" /></div>
            <div className="field"><label>عمر العقار (سنوات)</label>
              <input value={form.ageYears} onChange={(e) => set("ageYears", e.target.value)} inputMode="numeric" dir="ltr" /></div>
            <div className="field"><label>التشطيب</label>
              <select value={form.finishGrade} onChange={(e) => set("finishGrade", e.target.value)}>
                <option value="economy">اقتصادي</option><option value="standard">قياسي</option>
                <option value="premium">فاخر</option><option value="luxury">لوكس</option>
              </select></div>
          </div>
          <div className="field"><label>رقم الصك الإلكتروني</label>
            <input value={form.deed} onChange={(e) => set("deed", e.target.value)} dir="ltr" placeholder="39102•••••••" /></div>
          <div style={{ display: "flex", gap: 8, background: "var(--info-bg)", borderRadius: 11, padding: "9px 12px", marginBottom: 14 }}>
            <span>🔒</span>
            <span style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.7 }}>
              يُتحقق من الصك لدى وزارة العدل ثم يُخزَّن رقمه مشفّراً (hash) ولا يُعرض كاملاً أبداً —
              يظهر للزوار «صك متحقق ✓» فقط (E13)
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" style={{ flex: 2 }} disabled={!form.title.trim() || !form.deed.trim()} onClick={() => setStep(3)}>
              تحقق من الصك ومتابعة
            </button>
            <button className="btn soft" style={{ flex: 1 }} onClick={() => setStep(1)}>رجوع</button>
          </div>
        </div></div>
      )}

      {step === 3 && (
        <div className="card" style={{ borderColor: "#BFE3CC" }}><div className="cpad" style={{ textAlign: "center", padding: "26px 20px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 12px" }}>✓</div>
          <h2 className="ct" style={{ fontSize: 17 }}>كل شيء جاهز — أكّد المطالبة</h2>
          <p className="disc" style={{ maxWidth: 400, margin: "0 auto" }}>
            «{form.title}» سيُضاف إلى أملاكك: تتبّع تقدير فَنر شهرياً، تصحيح بيانات العقار
            (يحسّن دقة النموذج — R-E4-5)، والإعلان بشارة مالك موثّقة.
          </p>
          {err && <p style={{ color: "var(--danger)", fontWeight: 700, fontSize: 13 }}>{err}</p>}
          <button className="btn" style={{ minWidth: 240, marginTop: 14 }} disabled={busy} onClick={finish}>
            {busy ? "جارٍ الحفظ…" : "أكّد وأضف إلى أملاكي"}
          </button>
        </div></div>
      )}
    </main>
    </>
  );
}
