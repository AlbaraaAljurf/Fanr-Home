"use client";

import { useState } from "react";

interface Props {
  listingId: string;
  advertiserName: string;
  advertiserType: string;
}

/** Contact reveals only after a lead is created (PRD R-E3-1). */
export default function LeadPanel({ listingId, advertiserName, advertiserType }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<"viewing" | "inquiry" | "negotiation">("viewing");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [contact, setContact] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch(`/api/v1/homes/listings/${listingId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, interest }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setContact(j.data.advertiserPhone);
      setState("done");
    } catch {
      setState("error");
    }
  }

  async function report(category: string) {
    await fetch(`/api/v1/homes/listings/${listingId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    setReported(true);
  }

  return (
    <div className="card">
      <div className="cpad">
        <h3 className="ct">
          تواصل مع {advertiserType === "owner_self_listing" ? "المالك" : "الوسيط"}
        </h3>
        <p className="disc" style={{ marginBottom: 12 }}>
          {advertiserName} — تُعرض بيانات الاتصال بعد إنشاء الطلب، حمايةً للمُعلن من الانتحال وتوثيقاً لجدّيتك.
        </p>

        {state !== "done" ? (
          <form onSubmit={submit}>
            <div className="field">
              <label>الاسم</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="اسمك الكامل" />
            </div>
            <div className="field">
              <label>الجوال</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" placeholder="+966 5x xxx xxxx" />
            </div>
            <div className="field">
              <label>أنا مهتم بـ</label>
              <select value={interest} onChange={(e) => setInterest(e.target.value as typeof interest)}>
                <option value="viewing">حجز معاينة</option>
                <option value="inquiry">استفسار</option>
                <option value="negotiation">تفاوض على السعر</option>
              </select>
            </div>
            <button className="btn grn" style={{ width: "100%" }} disabled={state === "busy"}>
              {state === "busy" ? "جارٍ الإرسال…" : "أنشئ الطلب واعرض بيانات التواصل"}
            </button>
            {state === "error" && (
              <p className="disc" style={{ color: "var(--danger)", marginTop: 8 }}>
                تعذّر إرسال الطلب — تأكد من البيانات وحاول مجدداً.
              </p>
            )}
          </form>
        ) : (
          <div style={{ background: "var(--ok-bg)", borderRadius: 12, padding: "13px 15px" }}>
            <b style={{ color: "var(--ok)", fontSize: 14 }}>✓ تم إنشاء طلبك</b>
            <div className="kv" style={{ marginTop: 6 }}>
              <span className="k">جوال المُعلن</span>
              <span className="v" dir="ltr">{contact}</span>
            </div>
            <p className="disc" style={{ marginTop: 6 }}>
              وصل طلبك لصندوق طلبات المُعلن مع ملفك — متوسط الرد أقل من 6 ساعات.
            </p>
          </div>
        )}

        <hr className="hr" />
        {!reported ? (
          <details>
            <summary style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", cursor: "pointer" }}>
              🚩 بلّغ عن هذا الإعلان
            </summary>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              {[
                ["not_available", "غير متاح"],
                ["wrong_price", "سعر خاطئ"],
                ["wrong_location", "موقع خاطئ"],
                ["fake", "وهمي"],
                ["duplicate", "مكرر"],
              ].map(([cat, label]) => (
                <span key={cat} className="chip" onClick={() => report(cat)}>{label}</span>
              ))}
            </div>
          </details>
        ) : (
          <p className="disc" style={{ color: "var(--ok)" }}>✓ استلمنا بلاغك — سيراجعه فريق الإشراف</p>
        )}
      </div>
    </div>
  );
}
