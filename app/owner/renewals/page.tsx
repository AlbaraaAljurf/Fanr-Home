import Link from "next/link";
import { ScreenHeader } from "@/components/Shell";

export const dynamic = "force-dynamic";

/**
 * Renewal calendar — renders ONLY from Ejar-linked contracts. No Ejar
 * integration exists yet, so this is an honest empty state, not sample data.
 */
export default function RenewalsPage() {
  return (
    <>
      <ScreenHeader title="تقويم التجديدات" back />
      <main className="wrap">
        <div className="card"><div className="empty-state">
          <span className="ei">📆</span>
          <b>لا عقود مرتبطة بعد</b>
          <p>
            تظهر عقودك هنا بعد الربط مع منصة «إيجار» — ينبّهك فَنر عند 90 و65 يوماً قبل انتهاء
            كل عقد، أي قبل انقضاء مهلة الإخطار النظامية (60 يوماً) التي يتجدد العقد تلقائياً بعدها
            بنفس القيمة.
          </p>
        </div></div>
        <div className="card" style={{ marginTop: 12 }}><div className="cpad">
          <b style={{ fontSize: 14 }}>القاعدة النظامية</b>
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.8, margin: "6px 0 0" }}>
            يتجدد عقد الإيجار تلقائياً بنفس القيمة ما لم يُخطر أي طرف الآخر قبل 60 يوماً من
            الانتهاء — والزيادة ممنوعة داخل النطاق العمراني للرياض حتى 2030.
          </p>
          <Link href="/guide/rent-freeze" className="btn soft sm" style={{ marginTop: 12 }}>📖 دليل التجميد والتجديد التلقائي</Link>
        </div></div>
      </main>
    </>
  );
}
