// ═══════════════════════════════════════════════════════════════════════
// إعدادات Next.js - next.config.ts
// منصة المدقق الديناميكي الموحد V3.0
// Service Worker يدوي (sw.js) — لا يعتمد على next-pwa
// ═══════════════════════════════════════════════════════════════════════

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // توافق مع Turbopack في Next.js 16
  turbopack: {},
};

export default nextConfig;
