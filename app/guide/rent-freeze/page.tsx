import Link from "next/link";
import type { Metadata } from "next";
import { ScreenHeader } from "@/components/Shell";
import { RentCheckerButton } from "@/components/RentCheckerSheet";

export const metadata: Metadata = {
  title: "دليل تجميد الإيجارات في الرياض 2025–2030 | فَنر هومز",
  description:
    "الدليل الكامل لقرار تجميد الإيجارات في الرياض: السيناريوهات الثلاثة، التجديد التلقائي، مهلة الـ60 يوماً، التوثيق في إيجار، وطريقة الاعتراض أمام الهيئة العامة للعقار.",
};

/**
 * E5.3 — the permanent, deeply-linked freeze explainer.
 * Written as directly quotable, sourced statements (GEO/SEO per R-E12-5).
 */
export default function RentFreezeGuide() {
  return (
    <>
      <ScreenHeader title="دليل تجميد الإيجارات" back />
      <main className="wrap">
      <p className="sub">
        بموجب الأمر الملكي وقرار مجلس الوزراء النافذ في 25 سبتمبر 2025، تُوقف الزيادة في أجور
        العقارات السكنية والتجارية داخل النطاق العمراني لمدينة الرياض لمدة خمس سنوات (حتى 2030).
        هذا الدليل يشرح القواعد كما صدرت — وليس استشارة قانونية.
      </p>

      <div className="card"><div className="cpad">
        <h2 className="ct" style={{ fontSize: 16 }}>السيناريوهات الثلاثة — ما هو إيجارك النظامي؟</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>وضع العقار في 25 سبتمبر 2025</th><th>الإيجار النظامي خلال فترة التجميد</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>مؤجَّر حالياً</td>
                <td>يثبت عند الأجرة المسجّلة في ذلك التاريخ — لا زيادة حتى 2030</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>مؤجَّر سابقاً — شاغر الآن</td>
                <td>يثبت عند قيمة آخر عقد موثّق في منصة «إيجار»</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>لم يؤجَّر من قبل</td>
                <td>تُحدد الأجرة الأولى باتفاق الطرفين، ثم تُجمَّد لخمس سنوات</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="disc" style={{ marginTop: 10 }}>
          لا يجوز تضمين أي بند زيادة في العقود القائمة أو الجديدة خلال فترة التجميد.
        </p>
      </div></div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card"><div className="cpad">
          <h3 className="ct">🔄 التجديد التلقائي</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
            يتجدد عقد الإيجار تلقائياً بنفس القيمة ما لم يُخطر أحد الطرفين الآخر برغبته في عدم
            التجديد قبل <b>60 يوماً</b> على الأقل من تاريخ انتهاء العقد. فَنر يذكّرك عند 90 و65
            يوماً — قبل انقضاء المهلة النظامية.
          </p>
        </div></div>
        <div className="card"><div className="cpad">
          <h3 className="ct">📋 التوثيق في «إيجار» إلزامي</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
            تسجيل العقد في منصة إيجار شرط لاعتباره رسمياً وربطه بالخدمات الحكومية. إذا لم يسجّل
            المؤجر العقد، <b>يحق للمستأجر طلب التسجيل</b> مباشرة.
          </p>
        </div></div>
        <div className="card"><div className="cpad">
          <h3 className="ct">⏱ نافذة الاعتراض — 60 يوماً</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
            لكل طرف الاعتراض على تفاصيل العقد أمام الهيئة العامة للعقار خلال 60 يوماً من التوثيق؛
            بعدها يُعد العقد صحيحاً نافذاً.
          </p>
        </div></div>
        <div className="card"><div className="cpad">
          <h3 className="ct">🚨 المخالفات والإبلاغ</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8, margin: 0 }}>
            تشمل العقوبات غرامات إدارية والتزامات تعويض، وقد يحصل المبلّغون عن المخالفات على نسبة
            من الغرامات المحصّلة. الإعلان بأجرة تتجاوز السقف النظامي مخالفة.
          </p>
        </div></div>
      </div>

      <div className="card" style={{ marginTop: 14, background: "var(--info-bg)", borderColor: "#A8D8F0" }}><div className="cpad">
        <h3 className="ct">أين يسري التجميد؟</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8, margin: "0 0 10px" }}>
          داخل <b>النطاق العمراني لمدينة الرياض</b> فقط (حدوده معروضة على خريطة فَنر). يجوز لمجلس
          إدارة الهيئة العامة للعقار تمديد التجميد إلى مدن أخرى بعد موافقة مجلس الشؤون الاقتصادية
          والتنمية — تصميم فَنر يجعل التوسّع إعداداً لا برمجة.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <RentCheckerButton className="btn sm auto" label="⚖ تحقق من وضعك الآن" />
          <Link href="/search" className="btn ghost sm">شاهد النطاق على الخريطة</Link>
        </div>
      </div></div>

      <p className="disc" style={{ textAlign: "center", marginTop: 22 }}>
        آخر تحديث لهذا الدليل: يوليو 2026 · المرجع النظامي: قرار 25 سبتمبر 2025 ولوائح الهيئة
        العامة للعقار — عند التعارض، النص النظامي هو الحاكم
      </p>
    </main>
    </>
  );
}
