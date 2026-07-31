import Link from "next/link";
import { ScreenHeader } from "@/components/Shell";

export const dynamic = "force-dynamic";

/**
 * Ejar readiness pack — assembles a real tenant + property + terms into a
 * registration-ready package (R3.2.1–.2). Without a qualified lead accepted
 * on one of the user's listings there is nothing to assemble: honest empty state.
 */
export default function EjarPackPage() {
  return (
    <>
      <ScreenHeader title="حزمة الجاهزية لإيجار" back />
      <main className="wrap">
        <div className="card"><div className="empty-state">
          <span className="ei">📄</span>
          <b>لا عملية إيجار جاهزة للتجهيز</b>
          <p>
            عندما تقبل طلب مستأجر على أحد إعلاناتك، يجمّع فَنر بيانات الطرفين والعقار والقيمة
            والبنود في حزمة جاهزة للتسجيل في منصة «إيجار» خلال دقائق — فَنر لا يحرر عقوداً؛
            العقد الملزم يُسجَّل في إيجار فقط.
          </p>
        </div></div>
        <div className="card" style={{ marginTop: 12 }}><div className="cpad">
          <b style={{ fontSize: 14 }}>ماذا تتضمن الحزمة؟</b>
          <ul style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 2, margin: "6px 0 0", paddingInlineStart: 18 }}>
            <li>بيانات المؤجر والمستأجر موثّقة بنفاذ</li>
            <li>بيانات العقار: العنوان الوطني وحالة الصك</li>
            <li>القيمة والدفعات — مع فحص السقف النظامي</li>
            <li>فحص خلو العقد من أي بند زيادة أثناء التجميد</li>
          </ul>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Link href="/owner" className="btn soft sm">أملاكي</Link>
            <Link href="/guide/rent-freeze" className="btn ghost sm">دليل التجميد</Link>
          </div>
        </div></div>
      </main>
    </>
  );
}
