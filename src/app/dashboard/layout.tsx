// ═══════════════════════════════════════════════════════════════════════
// الهيكل الحاكم الثابت من جهة السيرفر - Dashboard Layout
// منصة المدقق الديناميكي الموحد V3.0
// Server-First Static Shell + Interactive Client Islands
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { NetworkStatus } from '@/components/network-status';
import { PWARegister } from '@/components/pwa-register';

export const metadata = {
  title: 'لوحة التحكم | المدقق الديناميكي الموحد',
  description:
    'إطار الحوكمة والمطابقة العددية للمنشآت والتحصينات الإنشائية',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased"
      dir="rtl"
    >
      {/* Sidebar الثابت - السيرفر رندر */}
      <aside
        className="w-64 border-l border-slate-900 bg-slate-900/40 p-5 hidden md:flex flex-col justify-between"
        aria-label="الملاحة الرئيسية"
      >
        <div className="flex flex-col gap-6">
          <div className="text-emerald-400 font-bold text-lg tracking-wider border-b border-slate-900 pb-3">
            المدقق الديناميكي{' '}
            <span className="text-xs bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              V3.0
            </span>
          </div>
          <nav
            className="flex flex-col gap-1.5 text-sm"
            aria-label="روابط المنصة"
          >
            <div className="text-slate-200 px-3 py-2 bg-slate-900/60 rounded border-r-2 border-emerald-500 font-semibold cursor-default">
              المشاريع وحالات التدقيق
            </div>
            <div className="text-slate-500 px-3 py-2 hover:text-slate-300 transition-colors cursor-pointer">
              مصفوفة المتطلبات RTM
            </div>
            <div className="text-slate-500 px-3 py-2 hover:text-slate-300 transition-colors cursor-pointer">
              سجلات التدقيق والمطابقة
            </div>
          </nav>
        </div>

        {/* حقن جزيرة مراقبة الشبكة والمزامنة التفاعلية في الأسفل */}
        <div className="border-t border-slate-900 pt-4">
          <NetworkStatus />
        </div>
      </aside>

      {/* منطقة عرض محتوى الصفحات الديناميكية */}
      <main
        className="flex-1 p-6 overflow-y-auto"
        id="main-content"
        role="main"
      >
        {children}
      </main>

      {/* مدقق ومعالج التحديثات الحوكمي الآمن */}
      <PWARegister />
    </div>
  );
}
