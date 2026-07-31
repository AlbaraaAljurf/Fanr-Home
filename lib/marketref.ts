import fs from "fs";
import path from "path";

/** market_reference config table — sourced, dated values; missing key = unavailable. */
export interface MarketRefEntry {
  key: string;
  label_ar: string;
  value: number | string;
  unit: string;
  source: string;
  as_of_date: string;
}

let cache: MarketRefEntry[] | null = null;

export function marketReference(): MarketRefEntry[] {
  if (!cache) {
    const raw = fs.readFileSync(path.join(process.cwd(), "config", "market-reference.json"), "utf8");
    cache = JSON.parse(raw).entries as MarketRefEntry[];
  }
  return cache;
}

export function marketRefValue(key: string): MarketRefEntry | null {
  return marketReference().find((e) => e.key === key) ?? null;
}
