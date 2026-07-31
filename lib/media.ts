/**
 * Media pipeline contract (remediation Phase 6).
 *
 * RULE (enforced in every screen via <MediaEmpty/>): a property surface shows
 * either REAL, licensed/owned imagery from this pipeline — or an honest,
 * labelled empty state. Nothing in between; no placeholder pretending to be
 * a photo. The repo ships no photography because none is licensed to it.
 *
 * Production shape (PRD §8.1 media row):
 *   upload → EXIF strip → resize ladder → WebP encode → S3-compatible store
 *   → CDN URL → perceptual hash (pHash) → duplicate check against prior
 *   listings (E1-S5) → moderation state.
 * The interfaces below are the stable contract for that service; the MVP has
 * no implementation wired, so `mediaFor()` always returns [] and the UI
 * renders its empty state.
 */

export interface MediaAsset {
  id: string;
  listingId: string;
  /** CDN URLs per rung of the resize ladder */
  urls: { thumb: string; card: string; full: string };
  width: number;
  height: number;
  /** perceptual hash (64-bit hex) for duplicate detection */
  phash: string;
  /** provenance — required; uploads without a rights assertion are rejected */
  rights: "owner_uploaded" | "broker_licensed" | "fanr_commissioned";
  uploadedAt: string;
  moderation: "pending" | "approved" | "rejected";
}

export interface MediaService {
  upload(listingId: string, file: Blob, rights: MediaAsset["rights"]): Promise<MediaAsset>;
  /** hamming distance ≤ threshold against existing hashes → duplicate candidate */
  findDuplicates(phash: string, maxDistance?: number): Promise<MediaAsset[]>;
  listFor(listingId: string): Promise<MediaAsset[]>;
}

/** MVP: no media service wired — every surface gets the honest empty state. */
export function mediaFor(_listingId: string): MediaAsset[] {
  return [];
}
