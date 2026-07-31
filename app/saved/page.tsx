"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavs, setFavs } from "@/components/FavButton";
import { getSavedSearches, setSavedSearches, SavedSearch } from "@/lib/clientStore";
import { sar, TYPE_LABELS } from "@/lib/format";

interface CardData {
  id: string;
  title: string;
  status: string;
  listingType: string;
  propertyType: string;
  price: number;
  areaM2: number;
  districtNameAr: string;
  photoSeed: number;
  deltaPct: number;
  verdict: string | null;
}

export default function SavedPage() {
  const [favs, setFavState] = useState<CardData[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [newCounts, setNewCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ids = getFavs();
    const stored = getSavedSearches();
    setSearches(stored);

    (async () => {
      if (ids.length) {
        const res = await fetch(`/api/v1/homes/listings?ids=${ids.join(",")}`);
        const j = await res.json();
        if (j.success) setFavState(j.data);
      }
      // new-match counts per saved search (alerts would push these in production)
      const counts: Record<string, number> = {};
      for (const s of stored) {
        const q = new URLSearchParams({ type: s.filters.type });
        if (s.filters.minBeds) q.set("beds", String(s.filters.minBeds));
        if (s.filters.maxPrice) q.set("price_max", String(s.filters.maxPrice));
        if (s.filters.capOnly) q.set("within_cap", "1");
        if (s.filters.polygon) q.set("polygon", JSON.stringify(s.filters.polygon));
        const res = await fetch(`/api/v1/homes/search?${q}`);
        const j = await res.json();
        if (j.success) {
          counts[s.id] = (j.data as { created_at: string }[]).filter(
            (x) => new Date(x.created_at) > new Date(s.savedAt)
          ).length;
        }
      }
      setNewCounts(counts);
      setLoaded(true);
    })();
  }, []);

  function removeFav(id: string) {
    const next = getFavs().filter((x) => x !== id);
    setFavs(next);
    setFavState((f) => f.filter((x) => x.id !== id));
  }

  function removeSearch(id: string) {
    const next = getSavedSearches().filter((s) => s.id !== id);
    setSavedSearches(next);
    setSearches(next);
  }

  return (
    <main className="wrap">
      <h1 className="h1">المحفوظات 🔖</h1>
      <p className="sub">بحوثك المحفوظة ومفضلاتك — التنبيهات تصل فورياً/يومياً/أسبوعياً عبر الإشعارات وواتساب في الإنتاج</p>

      <h2 className="ct" style={{ fontSize: 17, margin: "6px 0 10px" }}>بحوثي المحفوظة</h2>
      {searches.length === 0 && (
        <div className="card"><div className="cpad" style={{ color: "var(--ink-2)" }}>
          لا بحوث محفوظة — من <Link href="/search" style={{ color: "var(--primary)", fontWeight: 700 }}>صفحة الخريطة</Link> اضبط الفلاتر ثم «🔔 احفظ البحث»
        </div></div>
      )}
      <div className="grid2">
        {searches.map((s) => (
          <div key={s.id} className="card"><div className="cpad">
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 18 }}>🔔</span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14.5 }}>{s.name}</b>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  حُفظ {new Date(s.savedAt).toLocaleDateString("en-GB")} · {s.lastSeenCount} نتيجة وقت الحفظ
                </div>
              </div>
              {loaded && (newCounts[s.id] ?? 0) > 0 && (
                <span className="badge gold">{newCounts[s.id]} جديدة منذ الحفظ</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
              <Link
                href={(() => {
                  const q = new URLSearchParams();
                  if (s.filters.type !== "rent") q.set("type", s.filters.type);
                  if (s.filters.minBeds) q.set("beds", String(s.filters.minBeds));
                  if (s.filters.maxPrice) q.set("pmax", String(s.filters.maxPrice));
                  if (s.filters.capOnly) q.set("cap", "1");
                  if (s.filters.polygon) q.set("poly", JSON.stringify(s.filters.polygon));
                  const qs = q.toString();
                  return qs ? `/search?${qs}` : "/search";
                })()}
                className="btn sm"
              >
                شغّل البحث — يستعيد الفلاتر والحدود
              </Link>
              <button className="btn soft sm" onClick={() => removeSearch(s.id)}>حذف</button>
            </div>
          </div></div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "26px 0 10px" }}>
        <h2 className="ct" style={{ fontSize: 17, margin: 0 }}>المفضلة ({favs.length})</h2>
        {favs.length >= 2 && (
          <Link href="/compare" className="btn soft sm">⇄ قارن مفضلاتك (حتى 4)</Link>
        )}
      </div>
      {favs.length === 0 && (
        <div className="card"><div className="cpad" style={{ color: "var(--ink-2)" }}>
          لا مفضلات بعد — استخدم «♡ أضف للمفضلة» من أي صفحة عقار
        </div></div>
      )}
      <div className="grid3">
        {favs.map((l) => (
          <div key={l.id} className="listing-card">
            <Link href={`/listings/${l.id}`}>
              <div className={`photo g${l.photoSeed % 4 === 0 ? 1 : l.photoSeed % 4}`} style={{ height: 86, fontSize: 26 }}>⌂</div>
            </Link>
            <div style={{ padding: "10px 13px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <b style={{ fontSize: 14.5, color: "var(--navy)" }}>{sar(l.price)} ريال{l.listingType === "rent" ? "/سنة" : ""}</b>
                {l.status !== "live" && <span className="badge danger">لم يعد متاحاً</span>}
              </div>
              <Link href={`/listings/${l.id}`} style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginTop: 2 }}>{l.title}</Link>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                {TYPE_LABELS[l.propertyType]} · {l.areaM2} م² · {l.districtNameAr}
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                {l.deltaPct <= -5 && <span className="badge gold">★ ‎{l.deltaPct}٪ عن التقدير</span>}
                {l.verdict === "within_cap" && <span className="badge info">⚖ ضمن السقف</span>}
                {l.verdict === "above_cap" && <span className="badge warn">⚠ أعلى من السقف</span>}
                <button onClick={() => removeFav(l.id)} className="chip" style={{ marginInlineStart: "auto", fontSize: 11 }}>♥ إزالة</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
