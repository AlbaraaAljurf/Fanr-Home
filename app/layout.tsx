import type { Metadata, Viewport } from "next";
import { TabBar } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "فَنر هومز — Fanr Homes",
  description:
    "منصة العقارات والإيجارات في السعودية — كل عقار له صفحة، وتقدير، ووضع نظامي.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1E3FA8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="shell">
          <div className="stage">{children}</div>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
