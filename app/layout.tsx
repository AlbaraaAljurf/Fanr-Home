import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "فَنر هومز — Fanr Homes",
  description:
    "منصة العقارات والإيجارات في السعودية — كل عقار له صفحة، وتقدير، ووضع نظامي. MVP المرحلة الأولى: الرياض، الإيجارات أولاً.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden>
              <rect x="3" y="7" width="15" height="15" rx="4.5" fill="none" stroke="#7CC9EC" strokeWidth="3.4" />
              <rect x="10" y="3" width="15" height="15" rx="4.5" fill="none" stroke="#A6DFB0" strokeWidth="3.4" opacity=".92" />
            </svg>
            فَنر <span style={{ fontWeight: 500 }}>هومز</span>
          </Link>
          <nav>
            <Link href="/search">الخريطة والبحث</Link>
            <Link href="/rent-checker">هل إيجاري نظامي؟</Link>
            <Link href="/saved">المحفوظات</Link>
            <Link href="/owner">أملاكي</Link>
            <Link href="/broker">الوسيط</Link>
            <Link href="/admin">الإدارة</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
