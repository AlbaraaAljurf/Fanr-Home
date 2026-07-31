import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, getListing, getDistrict } from "@/lib/store";
import { estimateRent, estimateSale, legalRentFor } from "@/lib/avm";
import { sar, TYPE_LABELS, FREEZE_LABELS, CONF_LABELS } from "@/lib/format";
import LeadPanel from "@/components/LeadPanel";
import FavButton from "@/components/FavButton";

export const dynamic = "force-dynamic";

export default function ListingPage({ params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) notFound();
  const d = getDistrict(l.districtId)!;
  const db = getDb();

  if (l.status !== "live") {
    return (
      <main className="wrap" style={{ maxWidth: 700 }}>
        <div className="card"><div className="cpad" style={{ textAlign: "center" }}>
          <h1 className="h1" style={{ fontSize: 20 }}>هذا الإعلان لم يعد متاحاً</h1>
          <p className="sub" style={{ marginBottom: 14 }}>
            أُوقف الإعلان تلقائياً — رخصة الإعلان العقاري الخاصة به انتهت أو أُلغيت (تُراجع الرخص يومياً).
          </p>
          <Link className="btn" href="/search">عُد إلى البحث</Link>
        </div></div>
      </main>
    );
  }

  const isRent = l.listingType === "rent";
  const est = isRent ? estimateRent(l, d) : estimateSale(l, d);
  const lr = isRent ? legalRentFor(l, d) : null;
  const similar = db.listings
    .filter((x) => x.id !== l.id && x.status === "live" && x.districtId === l.districtId && x.listingType === l.listingType)
    .slice(0, 3);
  const deltaPct = Math.round(((l.price - est.value) / est.value) * 100);

  return (
    <main className="wrap">
      <div className={`photo g${l.photoSeed % 4 === 0 ? 1 : l.photoSeed % 4}`} style={{ height: 250, borderRadius: 18, fontSize: 60 }}>
        ⌂
        <span className="badge" style={{ position: "absolute", bottom: 12, insetInlineStart: 12, background: "rgba(19,26,42,.72)", color: "#fff" }}>
          صور العقار تُرفع عبر خط الوسائط في الإنتاج — عنصر نائب
        </span>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap" }}>
        <div style={{ flex: 1.6, minWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)" }}>
                {sar(l.price)} ريال{isRent ? "/سنة" : ""}
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: "6px 0 2px" }}>{l.title}</h1>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                {d.nameAr}، الرياض · <span style={{ direction: "ltr" }}>{l.ref}</span> · الموقع {l.locationPrecision === "approximate" ? "تقريبي بطلب المُعلن — الحي دقيق" : "دقيق"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {deltaPct <= -5 && <span className="badge gold">★ أقل من تقدير فَنر بـ {Math.abs(deltaPct)}٪</span>}
              {deltaPct >= 8 && <span className="badge warn">أعلى من تقدير فَنر بـ {deltaPct}٪</span>}
              <FavButton listingId={l.id} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {[
              [TYPE_LABELS[l.propertyType], "النوع"],
              [`${l.areaM2} م²`, "المساحة"],
              [`${l.bedrooms}`, "غرف"],
              [`${l.bathrooms}`, "دورات مياه"],
              [`${l.ageYears} سنوات`, "العمر"],
              [l.corner ? "زاوية" : `شارع ${l.streetWidthM}م`, "الموقع"],
            ].map(([v, k]) => (
              <div key={k as string} className="card" style={{ padding: "9px 16px", textAlign: "center" }}>
                <b style={{ fontSize: 14 }}>{v}</b>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{k}</div>
              </div>
            ))}
          </div>

          {isRent && lr && lr.insideFreezeZone && (
            <div className="legal" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>⚖ الوضع النظامي للإيجار — الرياض</div>
              <div className="kv" style={{ marginTop: 8 }}>
                <span className="k">وضع العقار في 25 سبتمبر 2025</span>
                <span className="v">{l.freezeStatus ? FREEZE_LABELS[l.freezeStatus] : "غير مُعلن"}</span>
              </div>
              {lr.legalCap != null ? (
                <>
                  <div className="kv"><span className="k">السقف النظامي للإيجار</span><span className="v" style={{ color: "var(--navy)", fontSize: 17 }}>{sar(lr.legalCap)} ريال/سنة</span></div>
                  <div className="disc">{lr.capSource}</div>
                  <div className="kv" style={{ marginTop: 6 }}><span className="k">التقدير السوقي (استرشادي فقط)</span><span className="k">{sar(est.value)} ريال/سنة</span></div>
                  {lr.verdict === "within_cap" && <span className="badge ok" style={{ marginTop: 8 }}>✓ الإعلان الحالي ضمن السقف النظامي</span>}
                  {lr.verdict === "above_cap" && (
                    <span className="badge danger" style={{ marginTop: 8 }}>
                      ✕ المطلوب أعلى من السقف النظامي بـ {Math.round(((l.price - lr.legalCap) / lr.legalCap) * 100)}٪ — تنبيه التزام مُسجَّل
                    </span>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "6px 0 0", lineHeight: 1.7 }}>
                  {lr.capSource} — القاعدة: السقف = قيمة آخر عقد موثّق في «إيجار». لا نخمّن الأرقام؛ تحقق من قيمة عقدك في منصة إيجار.
                </p>
              )}
              <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                <Link href="/guide/rent-freeze" style={{ fontSize: 13, fontWeight: 800, color: "var(--info)" }}>
                  ما معنى هذا؟ — دليل التجميد ‹
                </Link>
                <Link href="/rent-checker" style={{ fontSize: 13, fontWeight: 800, color: "var(--info)" }}>
                  تحقق من وضعك مجاناً ‹
                </Link>
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: 14 }}><div className="cpad">
            <h3 className="ct">تقدير فَنر <span className="badge info" style={{ marginInlineStart: 6 }}>{CONF_LABELS[est.confidence]}</span></h3>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--navy)" }}>
              {sar(est.low)} – {sar(est.high)} ريال{isRent ? "/سنة" : ""}
            </div>
            <div className="kv" style={{ marginTop: 4 }}>
              <span className="k">نقطة التقدير</span><span className="v">{sar(est.value)} ريال</span>
            </div>
            <div className="kv">
              <span className="k">الأساس</span>
              <span className="v">وسيط الحي {est.districtBaseM2.toLocaleString("en-US")} ريال/م² · {est.basisTxCount} صفقة مرجعية</span>
            </div>
            <div className="kv">
              <span className="k">عوامل التسوية المطبقة</span>
              <span className="v" style={{ direction: "ltr", fontSize: 12 }}>
                {est.factorsApplied.map((f) => `${f.key} ×${f.factor.toFixed(2)}`).join(" · ")}
              </span>
            </div>
            {est.compEstimate != null && (
              <div className="kv">
                <span className="k">المزج (الطبقة 3)</span>
                <span className="v" style={{ fontSize: 12 }}>
                  {Math.round((1 - est.w2) * 100)}٪ نموذج السمات ({sar(est.hedonicEstimate)}) + {Math.round(est.w2 * 100)}٪ الصفقات المشابهة ({sar(est.compEstimate)})
                </span>
              </div>
            )}
            {est.compsUsed.length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", cursor: "pointer" }}>
                  الصفقات المشابهة المستخدمة ({est.compsUsed.length}) — الشفافية الكاملة
                </summary>
                <div className="tbl-wrap" style={{ marginTop: 8 }}>
                  <table className="tbl">
                    <thead>
                      <tr><th>المساحة</th><th>سعر الصفقة</th><th>بعد التسوية</th><th>قبل</th><th>البعد</th></tr>
                    </thead>
                    <tbody>
                      {est.compsUsed.slice(0, 6).map((c) => (
                        <tr key={c.id}>
                          <td>{c.areaM2} م²</td>
                          <td>{sar(c.price)}</td>
                          <td style={{ fontWeight: 700 }}>{sar(c.adjustedPrice)}</td>
                          <td>{Math.round(c.daysAgo / 30)} أشهر</td>
                          <td>{c.distanceKm} كم</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="disc" style={{ marginTop: 6 }}>
                  كل صفقة مسوّاة إلى خصائص هذا العقار (نسبة العوامل + تعديل زمني) ثم يؤخذ الوسيط
                  الموزون: حداثة (نصف عمر 6 أشهر) × قرب جغرافي × تشابه سمات
                </p>
              </details>
            )}
            <hr className="hr" />
            <p className="disc">
              تقدير فَنر مؤشر سوقي استرشادي وليس تقييماً عقارياً معتمداً — النموذج {est.modelVersion} (الطبقتان 1–2؛
              طبقة الصفقات المشابهة تصل في المرحلة الثانية). للحصول على تقييم معتمد يمكن إحالتك لمقيّم مرخّص من «تقييم».
            </p>
          </div></div>

          <div className="card" style={{ marginTop: 14 }}><div className="cpad">
            <h3 className="ct">التوثيق</h3>
            <div className="kv"><span className="k">✓ رخصة إعلان عقاري</span><span className="v" style={{ direction: "ltr" }}>{l.adLicense.number} · سارية حتى {new Date(l.adLicense.expiresAt).toLocaleDateString("en-GB")}</span></div>
            {l.falNumber && <div className="kv"><span className="k">✓ وسيط مرخّص فال</span><span className="v" style={{ direction: "ltr" }}>{l.falNumber}</span></div>}
            {l.advertiserType === "owner_self_listing" && <div className="kv"><span className="k">✓ مالك يعلن عن عقاره</span><span className="v">هوية موثّقة عبر نفاذ (تكامل الإنتاج)</span></div>}
            <div className="kv"><span className="k">إعادة التحقق</span><span className="v">يومياً — الرخص المنتهية تُوقف الإعلان تلقائياً</span></div>
          </div></div>

          {similar.length > 0 && (
            <>
              <h3 className="ct" style={{ margin: "18px 0 10px" }}>عقارات مشابهة في {d.nameAr}</h3>
              <div className="grid3">
                {similar.map((s) => (
                  <Link key={s.id} href={`/listings/${s.id}`} className="listing-card">
                    <div className={`photo g${s.photoSeed % 4 === 0 ? 1 : s.photoSeed % 4}`} style={{ height: 80, fontSize: 26 }}>⌂</div>
                    <div style={{ padding: "9px 12px 11px" }}>
                      <b style={{ fontSize: 13.5, color: "var(--navy)" }}>{sar(s.price)} ريال{s.listingType === "rent" ? "/سنة" : ""}</b>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{s.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <LeadPanel listingId={l.id} advertiserName={l.advertiserName} advertiserType={l.advertiserType} />
          <div className="card" style={{ marginTop: 14 }}><div className="cpad">
            <h3 className="ct">
              <Link href={`/districts/${d.id}`} style={{ color: "var(--primary)" }}>بيانات حي {d.nameAr} ‹</Link>
            </h3>
            <div className="kv"><span className="k">إيجار سنوي وسيط</span><span className="v">{d.baseRentM2Annual} ريال/م²</span></div>
            <div className="kv"><span className="k">سعر بيع وسيط</span><span className="v">{d.basePriceM2Sale.toLocaleString("en-US")} ريال/م²</span></div>
            <div className="kv"><span className="k">الاتجاه 12 شهراً</span><span className="v" style={{ color: "var(--ok)" }}>‎+{d.trend12mPct}٪</span></div>
            <div className="kv"><span className="k">متوسط البقاء بالسوق</span><span className="v">{d.avgDaysOnMarket} يوماً</span></div>
          </div></div>
        </div>
      </div>

      <p className="disc" style={{ textAlign: "center", marginTop: 26 }}>
        رقم رخصة الإعلان معروض التزاماً بلائحة الإعلانات العقارية · بيانات المُعلن تُعرض بعد إنشاء طلب تواصل (حماية من الانتحال)
      </p>
    </main>
  );
}
