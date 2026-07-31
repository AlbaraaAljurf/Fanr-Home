"use client";

/** Client-side persistence for favourites & saved searches (E10, R-E2-8). */

export interface SavedSearch {
  id: string;
  name: string;
  filters: {
    type: "rent" | "sale";
    minBeds: number;
    maxPrice: number | null;
    capOnly: boolean;
    polygon: [number, number][] | null;
  };
  savedAt: string;
  lastSeenCount: number;
}

const SEARCH_KEY = "fanr:saved-searches";

export function getSavedSearches(): SavedSearch[] {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setSavedSearches(s: SavedSearch[]) {
  localStorage.setItem(SEARCH_KEY, JSON.stringify(s));
}

export function addSavedSearch(s: Omit<SavedSearch, "id" | "savedAt">) {
  const all = getSavedSearches();
  all.unshift({ ...s, id: `s${Date.now().toString(36)}`, savedAt: new Date().toISOString() });
  setSavedSearches(all);
}
