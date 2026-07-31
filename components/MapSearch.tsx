"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { pointInPolygon, Ring } from "@/lib/geo";
import { sarShort, TYPE_LABELS } from "@/lib/format";
import { addSavedSearch } from "@/lib/clientStore";

export interface MapListing {
  id: string;
  ref: string;
  title: string;
  lat: number;
  lng: number;
  price: number;
  listingType: "rent" | "sale";
  propertyType: string;
  bedrooms: number;
  areaM2: number;
  districtNameAr: string;
  verdict: "within_cap" | "above_cap" | "no_cap" | "unknown_cap" | null;
  advertiserType: string;
  photoSeed: number;
}

interface Props {
  listings: MapListing[];
  freezeRing: Ring;
  freezeVersion: string;
  districts: { nameAr: string; ring: Ring }[];
}

/** Real basemap: OpenStreetMap raster tiles via MapLibre GL (PRD §8.1 maps row). */
const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export default function MapSearch({ listings, freezeRing, freezeVersion, districts }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  const [type, setType] = useState<"rent" | "sale">("rent");
  const [minBeds, setMinBeds] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [capOnly, setCapOnly] = useState(false);
  const [showFreeze, setShowFreeze] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [polygon, setPolygon] = useState<Ring | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const drawPts = useRef<Ring>([]);

  // Deep-linkable filters (saved searches restore exactly): read URL on mount…
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("type");
    if (t === "sale" || t === "rent") setType(t);
    if (q.get("beds")) setMinBeds(Number(q.get("beds")) || 0);
    if (q.get("pmax")) setMaxPrice(Number(q.get("pmax")) || null);
    if (q.get("cap") === "1") setCapOnly(true);
    const poly = q.get("poly");
    if (poly) {
      try {
        const ring = JSON.parse(poly) as Ring;
        if (Array.isArray(ring) && ring.length >= 4) setPolygon(ring);
      } catch { /* ignore malformed polygon param */ }
    }
  }, []);

  // …and mirror filter state back into the URL
  useEffect(() => {
    const q = new URLSearchParams();
    if (type !== "rent") q.set("type", type);
    if (minBeds) q.set("beds", String(minBeds));
    if (maxPrice) q.set("pmax", String(maxPrice));
    if (capOnly) q.set("cap", "1");
    if (polygon) q.set("poly", JSON.stringify(polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))])));
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [type, minBeds, maxPrice, capOnly, polygon]);

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        if (l.listingType !== type) return false;
        if (l.bedrooms < minBeds) return false;
        if (maxPrice && l.price > maxPrice) return false;
        if (capOnly && l.verdict !== "within_cap") return false;
        if (polygon && !pointInPolygon(l.lng, l.lat, polygon)) return false;
        return true;
      }),
    [listings, type, minBeds, maxPrice, capOnly, polygon]
  );

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: OSM_STYLE,
      center: [46.66, 24.79], // Riyadh
      zoom: 10.6,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.on("load", () => {
      map.addSource("freeze", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [freezeRing] } },
      });
      map.addLayer({
        id: "freeze-fill",
        type: "fill",
        source: "freeze",
        paint: { "fill-color": "#29ABE2", "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "freeze-line",
        type: "line",
        source: "freeze",
        paint: { "line-color": "#2B4FD8", "line-width": 2, "line-dasharray": [3, 2] },
      });
      map.addSource("districts", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: districts.map((d) => ({
            type: "Feature" as const,
            properties: { name: d.nameAr },
            geometry: { type: "Polygon" as const, coordinates: [d.ring] },
          })),
        },
      });
      map.addLayer({
        id: "districts-line",
        type: "line",
        source: "districts",
        paint: { "line-color": "#1A3C8F", "line-width": 1, "line-opacity": 0.25 },
      });
      map.addSource("draw", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-fill",
        type: "fill",
        source: "draw",
        paint: { "fill-color": "#2B4FD8", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "draw-line",
        type: "line",
        source: "draw",
        paint: { "line-color": "#2B4FD8", "line-width": 2.5, "line-dasharray": [2, 1.5] },
      });
      setReady(true);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render the active polygon (drawn now or restored from URL) once the map is ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("draw") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    if (polygon) {
      src.setData({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [polygon] } });
    } else {
      src.setData({ type: "FeatureCollection", features: [] });
    }
  }, [polygon, ready]);

  // Freeze overlay toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const v = showFreeze ? "visible" : "none";
    map.setLayoutProperty("freeze-fill", "visibility", v);
    map.setLayoutProperty("freeze-line", "visibility", v);
  }, [showFreeze, ready]);

  // Markers follow the filtered set
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = filtered.map((l) => {
      const el = document.createElement("div");
      el.className = `pin-pill ${l.listingType}${l.verdict === "above_cap" ? " above" : ""}`;
      el.textContent = l.listingType === "rent" ? `${sarShort(l.price)}/سنة` : sarShort(l.price);
      el.title = l.title;
      const popup = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
        `<div style="font-family:inherit;direction:rtl;text-align:right;min-width:190px">
           <b style="font-size:13px">${l.title}</b>
           <div style="font-size:12px;color:#4A5568;margin-top:2px">${TYPE_LABELS[l.propertyType] ?? l.propertyType} · ${l.areaM2} م² · ${l.districtNameAr}</div>
           <div style="font-size:14px;font-weight:800;color:#1A3C8F;margin-top:4px">${l.price.toLocaleString("en-US")} ريال${l.listingType === "rent" ? "/سنة" : ""}</div>
           <a href="/listings/${l.id}" style="display:inline-block;margin-top:7px;background:#2B4FD8;color:#fff;border-radius:9px;padding:6px 12px;font-size:12px;font-weight:700;text-decoration:none">صفحة العقار</a>
         </div>`
      );
      return new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([l.lng, l.lat])
        .setPopup(popup)
        .addTo(map);
    });
  }, [filtered, ready]);

  // Freehand draw-your-boundary (R-E2-2)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!drawing) return;

    map.dragPan.disable();
    map.getCanvas().style.cursor = "crosshair";
    drawPts.current = [];

    const src = () => map.getSource("draw") as maplibregl.GeoJSONSource;
    const render = (close: boolean) => {
      const pts = drawPts.current;
      if (pts.length < 2) return;
      const ring = close ? [...pts, pts[0]] : pts;
      src().setData({
        type: "Feature",
        properties: {},
        geometry: close
          ? { type: "Polygon", coordinates: [ring] }
          : { type: "LineString", coordinates: ring },
      } as GeoJSON.Feature);
    };

    let active = false;
    const onDown = (e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) => {
      active = true;
      drawPts.current = [[e.lngLat.lng, e.lngLat.lat]];
    };
    const onMove = (e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) => {
      if (!active) return;
      drawPts.current.push([e.lngLat.lng, e.lngLat.lat]);
      render(false);
    };
    const onUp = () => {
      if (!active) return;
      active = false;
      if (drawPts.current.length >= 3) {
        // simplify the freehand path so the polygon stays URL-friendly
        const pts = drawPts.current;
        const step = Math.max(1, Math.ceil(pts.length / 48));
        const sampled = pts.filter((_, i) => i % step === 0);
        const ring: Ring = [...sampled, sampled[0]];
        setPolygon(ring);
      }
      setDrawing(false);
    };

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);
    map.on("touchstart", onDown);
    map.on("touchmove", onMove);
    map.on("touchend", onUp);
    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
      map.off("touchstart", onDown);
      map.off("touchmove", onMove);
      map.off("touchend", onUp);
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";
    };
  }, [drawing, ready]);

  const clearPolygon = () => {
    setPolygon(null);
    const map = mapRef.current;
    if (map && ready)
      (map.getSource("draw") as maplibregl.GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: [],
      });
  };

  return (
    <div className="search-layout">
      <div className="map-pane">
        <div ref={mapEl} style={{ position: "absolute", inset: 0 }} />
        <div className="map-toolbar">
          <span className={`chip glassy ${type === "rent" ? "sel" : ""}`} onClick={() => setType("rent")}>إيجار</span>
          <span className={`chip glassy ${type === "sale" ? "sel" : ""}`} onClick={() => setType("sale")}>بيع</span>
          <span className={`chip glassy ${minBeds >= 3 ? "sel" : ""}`} onClick={() => setMinBeds(minBeds >= 3 ? 0 : 3)}>3+ غرف</span>
          {type === "rent" && (
            <>
              <span className={`chip glassy ${maxPrice ? "sel" : ""}`} onClick={() => setMaxPrice(maxPrice ? null : 70000)}>تحت 70 ألف</span>
              <span className={`chip glassy ${capOnly ? "sel" : ""}`} onClick={() => setCapOnly(!capOnly)}>⚖ ضمن السقف النظامي</span>
            </>
          )}
          <span className={`chip glassy ${showFreeze ? "sel" : ""}`} onClick={() => setShowFreeze(!showFreeze)}>نطاق التجميد</span>
          {!polygon ? (
            <span className={`chip glassy ${drawing ? "sel" : ""}`} onClick={() => setDrawing(!drawing)}>
              ✏️ {drawing ? "ارسم على الخريطة الآن…" : "ارسم حدودك"}
            </span>
          ) : (
            <span className="chip glassy sel" onClick={clearPolygon}>✕ مسح الحدود المرسومة</span>
          )}
          <span
            className="chip glassy"
            onClick={() => {
              const parts = [
                type === "rent" ? "إيجار" : "بيع",
                minBeds ? `${minBeds}+ غرف` : null,
                maxPrice ? `تحت ${sarShort(maxPrice)}` : null,
                capOnly ? "ضمن السقف" : null,
                polygon ? "حدود مرسومة" : "الرياض",
              ].filter(Boolean);
              addSavedSearch({
                name: parts.join(" · "),
                filters: { type, minBeds, maxPrice, capOnly, polygon },
                lastSeenCount: filtered.length,
              });
              setJustSaved(true);
              setTimeout(() => setJustSaved(false), 2000);
            }}
          >
            {justSaved ? "✓ حُفظ البحث" : "🔔 احفظ البحث"}
          </span>
        </div>
        <div
          className="glassy"
          style={{ position: "absolute", bottom: 14, right: 14, left: 14, zIndex: 5, borderRadius: 14, padding: "10px 15px", display: "flex", alignItems: "center", gap: 10 }}
        >
          <b style={{ fontSize: 14 }}>{filtered.length} عقاراً مطابقاً</b>
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
            {polygon ? "داخل حدودك المرسومة · " : ""}خريطة OpenStreetMap حية — نطاق التجميد نسخة {freezeVersion}
          </span>
        </div>
      </div>

      <aside className="list-pane">
        {filtered.map((l) => (
          <Link key={l.id} href={`/listings/${l.id}`} className="listing-card">
            <div style={{ display: "flex", gap: 12, padding: 12 }}>
              <div className={`photo g${l.photoSeed % 4 === 0 ? 1 : l.photoSeed % 4}`} style={{ width: 86, height: 76, borderRadius: 12, flex: "none", fontSize: 26 }}>⌂</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <b style={{ fontSize: 15, color: "var(--navy)" }}>
                    {l.price.toLocaleString("en-US")} ريال{l.listingType === "rent" ? "/سنة" : ""}
                  </b>
                  <span style={{ fontSize: 10, color: "var(--ink-3)", direction: "ltr" }}>{l.ref}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                  {TYPE_LABELS[l.propertyType]} · {l.areaM2} م² · {l.bedrooms} غرف · {l.districtNameAr}
                </div>
                <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                  <span className="badge ok">✓ مرخّص</span>
                  {l.verdict === "within_cap" && <span className="badge info">⚖ ضمن السقف</span>}
                  {l.verdict === "above_cap" && <span className="badge warn">⚠ أعلى من السقف</span>}
                  {l.advertiserType === "owner_self_listing" && <span className="badge navy">👤 مالك</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="card"><div className="cpad" style={{ textAlign: "center", color: "var(--ink-2)" }}>
            لا نتائج مطابقة — جرّب توسيع الفلاتر أو مسح الحدود المرسومة
          </div></div>
        )}
        <p className="disc" style={{ textAlign: "center", marginTop: 6 }}>
          الإعلانات المعروضة جميعها برخصة إعلان سارية متحقَّق منها · تقدير فَنر مؤشر استرشادي وليس تقييماً معتمداً
        </p>
      </aside>
    </div>
  );
}
