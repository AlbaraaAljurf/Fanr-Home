import Link from "next/link";
import { getDb } from "@/lib/store";
import { sar, TYPE_LABELS } from "@/lib/format";
import { legalRentFor } from "@/lib/avm";

export const dynamic = "force-dynamic";

export default function Home() {
  const db = getDb();
  const live = db.listings.filter((l) => l.status === "live");
  const rentals = live.filter((l) => l.listingType === "rent");
  const withinCap = rentals.filter((l) => {
    const d = db.districts.find((x) => x.id === l.districtId)!;
    return legalRentFor(l, d).verdict === "within_cap";
  });
  const malqa = db.districts.find((d) => d.id === "al-malqa")!;

  return (
    <main>
      <section
        style={{
          background: "linear-gradient(150deg,#1E3FA8 0%,#2B4FD8 55%,#29ABE2 100%)",
          color: "#fff",
          padding: "54px 18px 58px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 34, fontWeight: 900, margin: 0 }}>
          كل عقار في الرياض له صفحة — بقيمته وإيجاره النظامي
        </h1>
        <p style={{ fontSize: 15.5, opacity: 0.9, maxWidth: 640, margin: "12px auto 26px", lineHeight: 1.8 }}>
          منصة فَنر هومز — المرحلة الأولى: الإيجارات في الرياض. إعلانات مرخّصة ومتحقَّق منها،
          تقدير فَنر لكل عقار، ومؤشر الإيجار النظامي تحت قرار تجميد الإيجارات (2025–2030).
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/search" className="btn" style={{ background: "#fff", color: "var(--navy)" }}>
            🗺 ابحث على الخريطة الحقيقية
          </Link>
          <Link href="/rent-checker" className="btn" style={{ background: "rgba(255,255,255,.16)", border: "1.5px solid rgba(255,255,255,.5)" }}>
            ⚖ هل إيجاري نظامي؟
          </Link>
        </div>
      </section>

      <div className="wrap">
        <div className="grid3" style={{ marginTop: -46 }}>
          <div className="card"><div className="cpad">
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)" }}>{live.length}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>إعلاناً حياً — 100٪ برخصة إعلان متحقَّق منها</div>
          </div></div>
          <div className="card"><div className="cpad">
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)" }}>{withinCap.length}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>إعلان إيجار موثّق ضمن السقف النظامي ⚖</div>
          </div></div>
          <div className="card"><div className="cpad">
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)" }}>{db.districts.length}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>أحياء مغطاة بخط أساس تقدير فَنر (المرحلة 1)</div>
          </div></div>
        </div>

        <h2 className="h1" style={{ fontSize: 20, marginTop: 34 }}>أحدث إعلانات الإيجار</h2>
        <p className="sub">إيجارات الرياض أولاً — حيث السقف النظامي حقيقة قانونية وليس رأياً سوقياً</p>
        <div className="grid3">
          {rentals.slice(0, 6).map((l) => {
            const d = db.districts.find((x) => x.id === l.districtId)!;
            const lr = legalRentFor(l, d);
            return (
              <Link key={l.id} href={`/listings/${l.id}`} className="listing-card">
                <div className={`photo g${l.photoSeed % 4 === 0 ? "" : l.photoSeed % 4}`} style={{ height: 120, fontSize: 34 }}>⌂</div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <b style={{ fontSize: 16.5, color: "var(--navy)" }}>{sar(l.price)} ريال/سنة</b>
                    <span style={{ fontSize: 10, color: "var(--ink-3)", direction: "ltr" }}>{l.ref}</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 3 }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {TYPE_LABELS[l.propertyType]} · {l.areaM2} م² · {l.bedrooms} غرف · {d.nameAr}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 9, flexWrap: "wrap" }}>
                    <span className="badge ok">✓ إعلان مرخّص</span>
                    {lr.verdict === "within_cap" && <span className="badge info">⚖ ضمن السقف</span>}
                    {lr.verdict === "above_cap" && <span className="badge warn">⚠ أعلى من السقف</span>}
                    {l.advertiserType === "owner_self_listing" && <span className="badge navy">👤 مالك</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid2" style={{ marginTop: 30 }}>
          <div className="card"><div className="cpad">
            <h3 className="ct">نبض السوق — {malqa.nameAr}</h3>
            <div className="kv"><span className="k">متوسط الإيجار السنوي</span><span className="v">{malqa.baseRentM2Annual} ريال/م²</span></div>
            <div className="kv"><span className="k">متوسط سعر البيع</span><span className="v">{malqa.basePriceM2Sale.toLocaleString("en-US")} ريال/م²</span></div>
            <div className="kv"><span className="k">الاتجاه — 12 شهراً</span><span className="v" style={{ color: "var(--ok)" }}>‎+{malqa.trend12mPct}٪</span></div>
            <div className="kv"><span className="k">صفقات مرجعية</span><span className="v">{malqa.txCount12m} صفقة</span></div>
            <hr className="hr" />
            <p className="disc">المصدر المستهدف: صفقات وزارة العدل (SREM) + مؤشرات الهيئة العامة للعقار — بيانات الطرح الأولي مرجعية</p>
          </div></div>
          <div className="card" style={{ background: "var(--info-bg)", borderColor: "#A8D8F0" }}><div className="cpad">
            <h3 className="ct">⚖ تجميد إيجارات الرياض — لماذا يهمك؟</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8, margin: "0 0 12px" }}>
              منذ 25 سبتمبر 2025 وحتى 2030، الإيجار داخل النطاق العمراني للرياض مجمّد عند قيمة آخر
              عقد موثّق في «إيجار». فَنر يعرض السقف النظامي على كل إعلان، ويتيح لك التحقق من وضعك مجاناً.
            </p>
            <Link href="/rent-checker" className="btn sm">تحقق الآن — مجاناً</Link>
          </div></div>
        </div>

        <h2 className="h1" style={{ fontSize: 20, marginTop: 34 }}>صفحات الأحياء</h2>
        <p className="sub">بيانات كل حي من ركن الصفقات — الوسيط، الاتجاه، المزيج، والمعروض</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {db.districts.map((d) => (
            <Link key={d.id} href={`/districts/${d.id}`} className="chip">
              {d.nameAr} · {d.basePriceM2Sale.toLocaleString("en-US")} ريال/م²
            </Link>
          ))}
          <Link href="/guide/rent-freeze" className="chip sel">⚖ دليل تجميد الإيجارات</Link>
        </div>

        <p className="disc" style={{ textAlign: "center", marginTop: 30 }}>
          تقدير فَنر مؤشر سوقي استرشادي وليس تقييماً عقارياً معتمداً · العقود الملزمة تُسجَّل في منصة «إيجار» الرسمية
        </p>
      </div>
    </main>
  );
}
