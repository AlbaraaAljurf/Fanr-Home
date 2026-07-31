"use client";

import { useEffect, useState } from "react";

const KEY = "fanr:favs";

export function getFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setFavs(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export default function FavButton({ listingId }: { listingId: string }) {
  const [fav, setFav] = useState(false);
  useEffect(() => setFav(getFavs().includes(listingId)), [listingId]);

  function toggle() {
    const favs = getFavs();
    const next = favs.includes(listingId) ? favs.filter((x) => x !== listingId) : [...favs, listingId];
    setFavs(next);
    setFav(next.includes(listingId));
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={fav}
      title={fav ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
      style={{
        background: fav ? "var(--selected)" : "#fff",
        border: `1.5px solid ${fav ? "var(--primary)" : "var(--line)"}`,
        borderRadius: 12,
        padding: "8px 14px",
        fontSize: 14,
        fontWeight: 800,
        color: fav ? "var(--primary)" : "var(--ink-2)",
        cursor: "pointer",
      }}
    >
      {fav ? "♥ في المفضلة" : "♡ أضف للمفضلة"}
    </button>
  );
}
