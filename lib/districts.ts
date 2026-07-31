import { District } from "./types";
import { boxRing } from "./geo";

/**
 * District registry — GEOGRAPHIC configuration only (names, centroids, zones).
 * Contains no market data: baselines, medians and trends are computed
 * exclusively from ingested MOJ/SREM rows (lib/baselines.ts).
 *
 * Centroids are approximate, pending the official Amanah GIS polygon import
 * (source: manual approximation over OpenStreetMap, as_of 2026-07).
 */
export const DISTRICTS: District[] = [
  { id: "al-narjis", nameAr: "النرجس", nameEn: "Al Narjis", center: [46.66, 24.855], polygon: boxRing([46.66, 24.855]), parentZone: "riyadh-north" },
  { id: "al-malqa", nameAr: "الملقا", nameEn: "Al Malqa", center: [46.63, 24.804], polygon: boxRing([46.63, 24.804]), parentZone: "riyadh-north" },
  { id: "hittin", nameAr: "حطين", nameEn: "Hittin", center: [46.598, 24.776], polygon: boxRing([46.598, 24.776]), parentZone: "riyadh-north" },
  { id: "al-yasmin", nameAr: "الياسمين", nameEn: "Al Yasmin", center: [46.649, 24.823], polygon: boxRing([46.649, 24.823]), parentZone: "riyadh-north" },
  { id: "al-aqiq", nameAr: "العقيق", nameEn: "Al Aqiq", center: [46.635, 24.775], polygon: boxRing([46.635, 24.775]), parentZone: "riyadh-north" },
  { id: "qurtubah", nameAr: "قرطبة", nameEn: "Qurtubah", center: [46.756, 24.809], polygon: boxRing([46.756, 24.809]), parentZone: "riyadh-east" },
  { id: "al-wadi", nameAr: "الوادي", nameEn: "Al Wadi", center: [46.703, 24.788], polygon: boxRing([46.703, 24.788]), parentZone: "riyadh-north" },
  { id: "al-sahafah", nameAr: "الصحافة", nameEn: "Al Sahafah", center: [46.662, 24.799], polygon: boxRing([46.662, 24.799]), parentZone: "riyadh-north" },
  { id: "an-nada", nameAr: "الندى", nameEn: "An Nada", center: [46.688, 24.815], polygon: boxRing([46.688, 24.815]), parentZone: "riyadh-north" },
  { id: "ar-rabi", nameAr: "الربيع", nameEn: "Ar Rabi", center: [46.663, 24.833], polygon: boxRing([46.663, 24.833]), parentZone: "riyadh-north" },
];
