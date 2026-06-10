// ═══════════════════════════════════════════════════════════════════════
// Layout الرئيسي - منصة المدقق الديناميكي الموحد V3.0
// PWA Shell + RTL Arabic + Offline-First Architecture
// ═══════════════════════════════════════════════════════════════════════

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { StorageProvider } from "@/lib/storage/StorageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export const metadata: Metadata = {
  title: "منصة المدقق الديناميكي الموحد V3.0",
  description:
    "منصة تدقيق إنشائي سيادية للتحقق من المنشآت الحمائية ضد أحمال العصف الديناميكي وفق الكود السوري 2024 ومعايير UFC 3-340-02",
  keywords: [
    "تدقيق إنشائي",
    "أحمال العصف",
    "الكود السوري 2024",
    "UFC 3-340-02",
    "القص الثاقب",
    "التحصين",
    "المنشآت الحمائية",
    "structural verification",
    "blast load",
    "punching shear",
  ],
  authors: [{ name: "منصة المدقق الديناميكي الموحد V3.0" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "المدقق الإنشائي",
  },
  openGraph: {
    title: "منصة المدقق الديناميكي الموحد V3.0",
    description: "تدقيق إنشائي سيادي للمنشآت الحمائية",
    type: "website",
    locale: "ar_SY",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* تسجيل Service Worker للـ PWA */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <StorageProvider>
          {children}
        </StorageProvider>
        <Toaster />
      </body>
    </html>
  );
}
