/**
 * Geospatial helpers. In production this is fanr-geo-service backed by PostGIS;
 * for the MVP the polygons live in versioned config (PRD R3.3.5: boundary is
 * config, never code — see FREEZE_ZONE below, version tagged).
 */

export type Ring = [number, number][]; // [lng, lat]

/** Ray-casting point-in-polygon. */
export function pointInPolygon(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Riyadh urban boundary (rent-freeze zone), v1.
 * Approximation of النطاق العمراني for the MVP — replace ring with the official
 * polygon import when the أمانة الرياض GIS layer is ingested. Versioned per R3.3.5.
 */
export const FREEZE_ZONE: { version: string; effectiveFrom: string; ring: Ring } = {
  version: "riyadh-urban-v1-mvp",
  effectiveFrom: "2025-09-25",
  ring: [
    [46.47, 24.55],
    [46.42, 24.68],
    [46.45, 24.82],
    [46.55, 24.93],
    [46.68, 24.98],
    [46.82, 24.95],
    [46.92, 24.85],
    [46.95, 24.72],
    [46.90, 24.58],
    [46.75, 24.50],
    [46.60, 24.49],
    [46.47, 24.55],
  ],
};

export function inFreezeZone(lng: number, lat: number): boolean {
  return pointInPolygon(lng, lat, FREEZE_ZONE.ring);
}

/** Small rectangular ring around a center — placeholder district geometry. */
export function boxRing(center: [number, number], dLng = 0.014, dLat = 0.011): Ring {
  const [lng, lat] = center;
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ];
}
