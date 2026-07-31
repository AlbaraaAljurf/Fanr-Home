import Link from "next/link";
import { ScreenHeader } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <>
      <ScreenHeader title="حسابي" />
      <div className="content">
        <div className="card"><div className="cpad" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,var(--grad-a),var(--grad-b))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700 }}>ز</div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 15 }}>زائر</b>
            <div className="cs">سجّل عبر نفاذ للمطالبة بعقار أو الإعلان أو بدء عملية إيجار</div>
          </div>
        </div></div>

        <button className="btn" style={{ marginTop: 12, background: "#0C5548" }}>الدخول عبر نفاذ</button>
        <p className="disc" style={{ textAlign: "center", marginTop: 6 }}>
          التصفح متاح للجميع — نفاذ يُطلب عند الإجراءات النظامية فقط (R3.2.4)
        </p>

        <div className="ct" style={{ margin: "18px 0 10px" }}>مساحات العمل</div>
        <div className="stack">
          <Link href="/broker" className="card"><div className="cpad" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>💼</span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>مساحة الوسيط</b><div className="cs">تتطلب رخصة فال سارية — تُفتح بعد التحقق</div></div>
            <span style={{ color: "var(--ink-3)" }}>‹</span>
          </div></Link>
          <Link href="/admin" className="card"><div className="cpad" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🛡</span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>وحدة الإشراف والالتزام</b><div className="cs">لموظفي فَنر — كل إجراء مُسجَّل</div></div>
            <span style={{ color: "var(--ink-3)" }}>‹</span>
          </div></Link>
        </div>

        <div className="ct" style={{ margin: "18px 0 10px" }}>عام</div>
        <div className="card"><div className="cpad" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}><span>🌐</span><span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>اللغة</span><span className="cs">العربية</span></div>
          <hr className="hr" style={{ margin: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}><span>🔒</span><span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>بياناتي وخصوصيتي (PDPL)</span><span style={{ color: "var(--ink-3)" }}>‹</span></div>
          <hr className="hr" style={{ margin: 0 }} />
          <Link href="/guide/rent-freeze" style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}><span>📖</span><span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>دليل تجميد الإيجارات</span><span style={{ color: "var(--ink-3)" }}>‹</span></Link>
        </div></div>
      </div>
    </>
  );
}
