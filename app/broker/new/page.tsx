"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FREEZE_LABELS, TYPE_LABELS } from "@/lib/format";
import { ScreenHeader } from "@/components/Shell";

function NewListingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const asOwner = params.get("as") === "owner";

  const [form, setForm] = useState({
    title: asOwner ? "شقة قرطبة — من المالك" : "",
    districtId: "al-malqa",
    propertyType: "apartment",
    areaM2: "150",
    bedrooms: "3",
    bathrooms: "2",
    ageYears: "4",
    finishGrade: "standard",
    floor: "2",
    elevator: true,
    parkingSpaces: "1",
    streetWidthM: "15",
    corner: false,
    orientation: "north",
    price: "60000",
    freezeStatus: "previously_leased_vacant",
    lastEjarValue: "55000",
    adLicenseNumber: "",
    falNumber: asOwner ? "" : "1100254",
  });
  const [licState, setLicState] = useState<"idle" | "busy" | "ok" | "bad">("idle");
  const [licMsg, setLicMsg] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "busy" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "adLicenseNumber") setLicState("idle");
  };

  const aboveCap = useMemo(() => {
    const cap = Number(form.lastEjarValue) || 0;
    const ask = Number(form.price) || 0;
    return form.freezeStatus !== "never_leased" && cap > 0 && ask > cap;
  }, [form.price, form.lastEjarValue, form.freezeStatus]);

  async function verifyLicense() {
    setLicState("busy");
    const res = await fetch("/api/v1/compliance/verify-ad-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: form.adLicenseNumber }),
    });
    const j = await res.json();
    if (j.success && j.data.valid) {
      setLicState("ok");
      setLicMsg(`سارية حتى ${new Date(j.data.expiresAt).toLocaleDateString("en-GB")} — يُعاد التحقق يومياً`);
    } else {
      setLicState("bad");
      setLicMsg(j.data?.reason ?? "تعذّر التحقق");
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (licState !== "ok") return;
    setSubmitState("busy");
    const res = await fetch("/api/v1/homes/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, advertiserType: asOwner ? "owner_self_listing" : "licensed_broker" }),
    });
    const j = await res.json();
    if (j.success) {
      router.push(`/listings/${j.data.id}`);
    } else {
      setSubmitState("error");
      setErrMsg(j.error);
    }
  }

  return (
    <>
      <ScreenHeader title="إعلان جديد" back />
      <main className="wrap">
      <p className="sub">
        لا يُنشر أي إعلان دون رخصة إعلان عقاري سارية متحقَّق منها (نظام الوساطة العقارية —
        م/130). إيجارات الرياض تتطلب إعلان وضع التجميد وقيمة آخر عقد موثّق.
      </p>

      <form onSubmit={publish}>
        <div className="card"><div className="cpad">
          <h3 className="ct">بيانات العقار</h3>
          <div className="grid2">
            <div className="field"><label>عنوان الإعلان</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="شقة 3 غرف — حي الملقا" /></div>
            <div className="field"><label>الحي</label>
              <select value={form.districtId} onChange={(e) => set("districtId", e.target.value)}>
                {["al-malqa", "hittin", "al-narjis", "al-yasmin", "al-sahafah", "qurtubah", "al-arid", "al-rabi", "al-olaya", "al-malaz"].map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select></div>
            <div className="field"><label>نوع العقار</label>
              <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div className="field"><label>المساحة (م²)</label>
              <input value={form.areaM2} onChange={(e) => set("areaM2", e.target.value)} inputMode="numeric" dir="ltr" required /></div>
            <div className="field"><label>الغرف</label>
              <input value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} inputMode="numeric" dir="ltr" /></div>
            <div className="field"><label>دورات المياه</label>
              <input value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} inputMode="numeric" dir="ltr" /></div>
            <div className="field"><label>عمر العقار (سنوات)</label>
              <input value={form.ageYears} onChange={(e) => set("ageYears", e.target.value)} inputMode="numeric" dir="ltr" /></div>
            <div className="field"><label>التشطيب</label>
              <select value={form.finishGrade} onChange={(e) => set("finishGrade", e.target.value)}>
                <option value="economy">اقتصادي</option><option value="standard">قياسي</option>
                <option value="premium">فاخر</option><option value="luxury">لوكس</option>
              </select></div>
            <div className="field"><label>عرض الشارع (م)</label>
              <input value={form.streetWidthM} onChange={(e) => set("streetWidthM", e.target.value)} inputMode="numeric" dir="ltr" /></div>
            <div className="field"><label>الإيجار السنوي المطلوب (ريال)</label>
              <input value={form.price} onChange={(e) => set("price", e.target.value)} inputMode="numeric" dir="ltr" required /></div>
          </div>
        </div></div>

        <div className="card" style={{ marginTop: 14 }}><div className="cpad">
          <h3 className="ct">⚖ وضع التجميد — إلزامي لإيجارات الرياض</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {Object.entries(FREEZE_LABELS).map(([k, v]) => (
              <span key={k} className={`chip ${form.freezeStatus === k ? "sel" : ""}`} onClick={() => set("freezeStatus", k)}>{v}</span>
            ))}
          </div>
          {form.freezeStatus !== "never_leased" && (
            <div className="field">
              <label>قيمة آخر عقد موثّق في «إيجار» = السقف النظامي (ريال/سنة)</label>
              <input value={form.lastEjarValue} onChange={(e) => set("lastEjarValue", e.target.value)} inputMode="numeric" dir="ltr" required />
            </div>
          )}
          {aboveCap && (
            <div style={{ display: "flex", gap: 9, background: "var(--warn-bg)", border: "1.5px solid var(--warn-line)", borderRadius: 12, padding: "11px 13px" }}>
              <span>⚠️</span>
              <div style={{ fontSize: 13, color: "var(--warn)", fontWeight: 700, lineHeight: 1.7 }}>
                المطلوب أعلى من السقف النظامي ({Number(form.lastEjarValue).toLocaleString("en-US")} ريال).
                النشر متاح (تنبيه استشاري في النسخة الأولى) لكن الإعلان سيحمل تنبيه التزام علنياً وسيُسجَّل هذا التحذير.
                <span className="chip" style={{ marginInlineStart: 8 }} onClick={() => set("price", form.lastEjarValue)}>
                  اضبطه على {Number(form.lastEjarValue).toLocaleString("en-US")} ✓
                </span>
              </div>
            </div>
          )}
        </div></div>

        <div className="card" style={{ marginTop: 14 }}><div className="cpad">
          <h3 className="ct">رخصة الإعلان العقاري <span className="badge danger" style={{ marginInlineStart: 6 }}>إلزامية للنشر</span></h3>
          <p className="disc" style={{ marginBottom: 10 }}>
            تصدر لكل إعلان عبر منصة «فال» — جرّب رقماً بصيغة صحيحة مثل <b dir="ltr">7200481963</b> (10 أرقام تبدأ بـ 7).
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              style={{ flex: 1, minWidth: 200, background: "#F0F3FB", border: "1.5px solid transparent", borderRadius: 11, padding: "10px 13px", fontSize: 15, fontWeight: 700, fontFamily: "ui-monospace,monospace" }}
              dir="ltr"
              placeholder="7XXXXXXXXX"
              value={form.adLicenseNumber}
              onChange={(e) => set("adLicenseNumber", e.target.value)}
            />
            <button type="button" className="btn ghost" onClick={verifyLicense} disabled={licState === "busy"}>
              {licState === "busy" ? "جارٍ التحقق…" : "تحقق من الرخصة"}
            </button>
          </div>
          {licState === "ok" && <p style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700, marginTop: 9 }}>✓ متحقَّق منها — {licMsg}</p>}
          {licState === "bad" && <p style={{ fontSize: 13, color: "var(--danger)", fontWeight: 700, marginTop: 9 }}>✕ {licMsg}</p>}
          {!asOwner && (
            <div className="field" style={{ marginTop: 12 }}>
              <label>رخصة فال للوسيط (متحقَّق منها عند التسجيل — تُعاد شهرياً)</label>
              <input value={form.falNumber} onChange={(e) => set("falNumber", e.target.value)} dir="ltr" />
            </div>
          )}
        </div></div>

        <button className="btn" style={{ width: "100%", marginTop: 16 }} disabled={licState !== "ok" || submitState === "busy"}>
          {licState !== "ok" ? "انشر الإعلان — بانتظار التحقق من الرخصة" : submitState === "busy" ? "جارٍ النشر…" : "انشر الإعلان"}
        </button>
        {submitState === "error" && <p style={{ color: "var(--danger)", fontWeight: 700, fontSize: 13, marginTop: 8 }}>{errMsg}</p>}
        <p className="disc" style={{ textAlign: "center", marginTop: 10 }}>
          بالنشر تقرّ بصحة البيانات وفق لائحة الإعلانات العقارية — الإعلانات المضللة تخفض ترتيبك
        </p>
      </form>
    </main>
    </>
  );
}

export default function NewListingPage() {
  return (
    <Suspense>
      <NewListingForm />
    </Suspense>
  );
}
