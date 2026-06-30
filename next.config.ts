// ═══════════════════════════════════════════════════════════════════════
// إعدادات Next.js — Netlify Deployment
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ❌ لا تستخدم output: "standalone" مع Netlify
  // Netlify يدير البناء والنشر بنفسه
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // توافق مع Turbopack في Next.js 16
  turbopack: {},
  // حزم خارجية يجب أن تعمل فقط على الخادم (Node.js runtime)
  serverExternalPackages: ['better-sqlite3', 'sql.js'],
};

export default nextConfig;
