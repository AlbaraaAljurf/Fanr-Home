"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminActions({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "unpublish" | "clear") {
    setBusy(true);
    await fetch(`/api/v1/admin/listings/${listingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <button className="btn sm" disabled={busy} onClick={() => act("unpublish")}>أوقف</button>
      <button className="btn soft sm" disabled={busy} onClick={() => act("clear")}>تجاوز</button>
    </span>
  );
}
