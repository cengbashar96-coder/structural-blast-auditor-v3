// ═══════════════════════════════════════════════════════════════════════
// إعدادات Next.js مع Serwist PWA - next.config.ts
// منصة المدقق الديناميكي الموحد V3.0
// @serwist/next: الخليفة الحديث والمستقر لـ Workbox في بيئة App Router
// ═══════════════════════════════════════════════════════════════════════

import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // توافق مع Turbopack في Next.js 16
  turbopack: {},
};

export default withSerwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  // تعطيل Serwist في وضع التطوير لتجنب تعارض Turbopack
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
