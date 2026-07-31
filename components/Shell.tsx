"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Fixed 56px screen header. RTL: back chevron on the right, title centred. */
export function ScreenHeader({
  title,
  back = false,
  action,
}: {
  title: string;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="shead">
      {back ? (
        <button className="hbtn" aria-label="رجوع" onClick={() => router.back()}>›</button>
      ) : (
        <span className="hbtn" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 28 28">
            <rect x="3" y="7" width="15" height="15" rx="4.5" fill="none" stroke="#7CC9EC" strokeWidth="3.4" />
            <rect x="10" y="3" width="15" height="15" rx="4.5" fill="none" stroke="#A6DFB0" strokeWidth="3.4" opacity=".92" />
          </svg>
        </span>
      )}
      <div className="htitle">{title}</div>
      {action ?? <span className="hspacer" />}
    </header>
  );
}

const TABS = [
  { href: "/", ic: "⌂", label: "الرئيسية" },
  { href: "/search", ic: "🗺", label: "الخريطة" },
  { href: "/saved", ic: "🔖", label: "المحفوظات" },
  { href: "/owner", ic: "🔑", label: "أملاكي" },
  { href: "/account", ic: "👤", label: "حسابي" },
];

/** Fixed bottom tab bar — always visible. No /admin or /broker here (authenticated, via حسابي). */
export function TabBar() {
  const path = usePathname();
  const isOn = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
  return (
    <nav className="tabbar" aria-label="التنقل الرئيسي">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={isOn(t.href) ? "on" : ""}>
          <span className="ic" aria-hidden>{t.ic}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Bottom sheet: drag handle, rounded 16px top, backdrop, swipe-down / backdrop dismiss. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onTouchStart={(e) => { startY.current = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          if (startY.current == null || !sheetRef.current) return;
          const dy = e.touches[0].clientY - startY.current;
          if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
        }}
        onTouchEnd={(e) => {
          if (startY.current == null || !sheetRef.current) return;
          const dy = e.changedTouches[0].clientY - startY.current;
          sheetRef.current.style.transform = "";
          startY.current = null;
          if (dy > 90) onClose();
        }}
      >
        <div className="grab" />
        <div className="sheet-title">
          <b>{title}</b>
          <button className="hbtn" style={{ color: "var(--ink-3)", width: 40, height: 40 }} aria-label="إغلاق" onClick={onClose}>✕</button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </>
  );
}

/** Honest media empty state — never a grey box pretending to be a photo (Phase 6 rule). */
export function MediaEmpty({ height = 200, label = "لم يرفع المُعلن صوراً بعد", tile = false }: { height?: number; label?: string; tile?: boolean }) {
  return (
    <div className={`media-empty${tile ? " tile" : ""}`} style={{ height }} role="img" aria-label={label}>
      <span className="mi" aria-hidden>🖼</span>
      <span className="ml">{label}</span>
    </div>
  );
}
