"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BrokerLeadActions({ listingId, leadId, status }: { listingId: string; leadId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "respond" | "qualify" | "close") {
    setBusy(true);
    await fetch("/api/v1/broker/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, leadId, action }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
      {status === "new" && (
        <button className="btn sm" disabled={busy} onClick={() => act("respond")}>💬 رد الآن</button>
      )}
      {(status === "new" || status === "responded") && (
        <button className="btn soft sm" disabled={busy} onClick={() => act("qualify")}>✓ مؤهل</button>
      )}
      {status !== "closed" && (
        <button className="btn ghost sm" disabled={busy} onClick={() => act("close")}>إغلاق</button>
      )}
    </span>
  );
}

export function ConfirmListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    await fetch(`/api/v1/broker/listings/${listingId}/confirm`, { method: "POST" });
    router.refresh();
    setBusy(false);
  }

  return (
    <button className="btn sm" style={{ background: "var(--warn)", whiteSpace: "nowrap" }} disabled={busy} onClick={confirm}>
      {busy ? "…" : "✓ ما زال متاحاً"}
    </button>
  );
}
