import fs from "fs";
import path from "path";
import { ClaimedProperty, Db, Listing } from "./types";
import { buildSeed } from "./seed";

/**
 * File-backed store for the MVP. Production swaps this module for
 * PostgreSQL + PostGIS (PRD §8.1 — non-negotiable at scale); the rest of the
 * app only talks to the functions exported here.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

declare global {
  // eslint-disable-next-line no-var
  var __fanrDb: Db | undefined;
}

function load(): Db {
  if (global.__fanrDb) return global.__fanrDb;
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    global.__fanrDb = JSON.parse(raw) as Db;
  } catch {
    global.__fanrDb = buildSeed();
    persist(global.__fanrDb);
  }
  return global.__fanrDb!;
}

function persist(db: Db) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 1));
  } catch {
    // read-only fs (e.g. some hosts): keep in-memory copy only
  }
}

export function getDb(): Db {
  return load();
}

export function saveDb() {
  if (global.__fanrDb) persist(global.__fanrDb);
}

export function getDistrict(id: string) {
  return load().districts.find((d) => d.id === id) ?? null;
}

export function getListing(id: string): Listing | null {
  return load().listings.find((l) => l.id === id) ?? null;
}

export function addListing(l: Listing) {
  const db = load();
  db.listings.unshift(l);
  persist(db);
}

export function addClaim(c: ClaimedProperty) {
  const db = load();
  db.claimed.push(c);
  persist(db);
}

export function updateListing(id: string, patch: Partial<Listing>): Listing | null {
  const db = load();
  const l = db.listings.find((x) => x.id === id);
  if (!l) return null;
  Object.assign(l, patch, { updatedAt: new Date().toISOString() });
  persist(db);
  return l;
}
