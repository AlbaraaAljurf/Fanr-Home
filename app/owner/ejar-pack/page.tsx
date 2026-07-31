import Link from "next/link";
import { LEASES } from "@/lib/leases";
import { sar } from "@/lib/format";
import { ScreenHeader } from "@/components/Shell";

export const dynamic = "force-dynamic";

/**
 * Ejar readiness pack (R3.2.1–.2): Fanr never drafts the binding lease — the
 * flow terminates in Ejar registration. This page assembles everything so the
 * registration takes minutes.
 */
export default function EjarPackPage() {
  const lease = LEASES[1]; // the upcoming Qurtubah contract
  const items: { ok: boolean; label: string; detail?: string }[] = [
    { ok: true, label: "بيانات المؤجر", detail: "موثّقة بنفاذ" },
    { ok: true, label: "بيانات المستأجر", detail: "موثّقة بنفاذ + ملف مستأجر مكتمل" },
    { ok: true, label: "بيانات العقار", detail: "العنوان الوطني + صك متحقق (رقم محجوب)" },
    { ok: true, label: `القيمة: ${sar(lease.annualRent)} ريال/سنة`, detail: "ضمن السقف النظامي ⚖" },
    { ok: true, label: "الدفعات", detail: "دفعتان · تحويل بنكي" },
    { ok: true, label: "بنود إضافية", detail: "الصيانة الكبرى على المؤجر" },
    { ok: false, label: "رقم عدّاد الكهرباء", detail: "ناقص — يُطلب عند التسجيل في إيجار" },
  ];
  const done = items.filter((i) => i.ok).length;

  return (
    <>
      <ScreenHeader title="حزمة الجاهزية لإيجار" back />
      <main className="wrap">
      <p className="sub">
        {lease.propertyTitle} ← المستأجر: {lease.tenantName}. العقد الملزم يُسجَّل في منصة «إيجار»
        الرسمية — فَنر لا يحرر عقوداً؛ جهّزنا كل البيانات لتُسجّل في دقائق.
      </p>

      <div className="card"><div className="cpad">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="ct" style={{ margin: 0 }}>جاهزية الحزمة</h2>
          <span className={`badge ${done === items.length ? "ok" : "info"}`}>{done}/{items.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map((i) => (
            <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`badge ${i.ok ? "ok" : "warn"}`}>{i.ok ? "✓" : "!"}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>{i.label}</span>
              {i.detail && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{i.detail}</span>}
            </div>
          ))}
        </div>
      </div></div>

      <div className="card" style={{ marginTop: 14 }}><div className="cpad">
        <h3 className="ct">فحص بنود التجميد</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
          لا يجوز تضمين بند زيادة سنوية في عقود الرياض خلال فترة التجميد — الحزمة خالية من أي بند
          زيادة ✓ · القيمة لا تتجاوز سقف العقار النظامي ✓
        </p>
      </div></div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <a className="btn" href="https://www.ejar.sa" target="_blank" rel="noopener noreferrer">
          انتقل إلى منصة إيجار للتسجيل ↗
        </a>
        <span className="btn ghost">حمّل الحزمة PDF</span>
        <Link href="/owner/renewals" className="btn soft">📆 تقويم التجديدات</Link>
      </div>

      <p className="disc" style={{ marginTop: 16 }}>
        بعد التسجيل في إيجار: يُفعَّل عدّاد التجديد التلقائي وتنبيهات 90 و65 يوماً قبل انتهاء العقد
        (R3.2.3) — وتنبيهات الطرفين معاً.
      </p>
    </main>
    </>
  );
}
