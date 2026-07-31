"use client";

import { useEffect, useState } from "react";
import { Sheet } from "./Shell";
import { getFavs, setFavs } from "./FavButton";

interface Props {
  listingId: string;
  advertiserName: string;
  advertiserType: string;
}

/**
 * Sticky bottom action bar (Phase 1.6): primary CTA + favourite toggle.
 * The lead form opens as a bottom sheet; contact reveals only after a lead (R-E3-1).
 */
export default function ListingActionBar({ listingId, advertiserName, advertiserType }: Props) {
  const [open, setOpen] = useState(false);
  const [fav, setFav] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<"viewing" | "inquiry" | "negotiation">("viewing");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [contact, setContact] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  useEffect(() => setFav(getFavs().includes(listingId)), [listingId]);

  function toggleFav() {
    const favs = getFavs();
    const next = favs.includes(listingId) ? favs.filter((x) => x !== listingId) : [...favs, listingId];
    setFavs(next);
    setFav(next.includes(listingId));
  }

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
    <>
      <div className="actionbar">
        <button
          onClick={toggleFav}
          aria-pressed={fav}
          aria-label={fav ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
          style={{
            width: 46, height: 46, flex: "none", borderRadius: 12, fontSize: 19,
            border: `1.5px solid ${fav ? "var(--primary)" : "var(--line)"}`,
            background: fav ? "var(--selected)" : "#fff",
            color: fav ? "var(--primary)" : "var(--ink-3)",
          }}
        >
          {fav ? "♥" : "♡"}
        </button>
        <button className="btn grn" style={{ flex: 1 }} onClick={() => setOpen(true)}>
          تواصل مع المُعلن
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={`تواصل مع ${advertiserType === "owner_self_listing" ? "المالك" : "الوسيط"}`}>
        <p className="disc" style={{ marginTop: 0 }}>
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
            <button className="btn grn" disabled={state === "busy"}>
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
            <p className="disc" style={{ marginTop: 6 }}>وصل طلبك لصندوق طلبات المُعلن مع ملفك.</p>
          </div>
        )}
        <hr className="hr" />
        {!reported ? (
          <details>
            <summary style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>
              🚩 بلّغ عن هذا الإعلان
            </summary>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              {[["not_available", "غير متاح"], ["wrong_price", "سعر خاطئ"], ["wrong_location", "موقع خاطئ"], ["fake", "وهمي"], ["duplicate", "مكرر"]].map(([cat, label]) => (
                <span key={cat} className="chip sm" onClick={() => report(cat)}>{label}</span>
              ))}
            </div>
          </details>
        ) : (
          <p className="disc" style={{ color: "var(--ok)" }}>✓ استلمنا بلاغك — سيراجعه فريق الإشراف</p>
        )}
      </Sheet>
    </>
  );
}
