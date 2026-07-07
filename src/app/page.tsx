// ═══════════════════════════════════════════════════════════════════════
// صفحة الجذر — الصفحة الرئيسية
// منصة المدقق الديناميكي الموحد V3.1
// RTL Arabic | Dark Theme
// ═══════════════════════════════════════════════════════════════════════

import Link from 'next/link';
import { Layers, Building2, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4" dir="rtl">
      <div className="max-w-lg text-center space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100">
            المدقق الديناميكي الموحد V3.1
          </h1>
          <p className="text-slate-400 text-lg">
            منصة التحقق الهيكلي السيادية
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full rounded-lg bg-blue-700 px-6 py-3 text-center font-medium text-white hover:bg-blue-600 transition-colors"
          >
            لوحة تحكم المدير
          </Link>
          <Link
            href="/dashboard"
            className="block w-full rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-3 text-center font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            لوحة التحكم الهندسية
          </Link>
        </div>

        {/* وصول سريع للخطوات 7 و 8 */}
        <div className="pt-4 space-y-2">
          <p className="text-sm text-slate-500">وصول سريع</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/step7-ceiling"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Layers className="w-4 h-4" />
              الخطوة 7: السقف
            </Link>
            <Link
              href="/dashboard/step8-wall"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              الخطوة 8: الجدران
            </Link>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          إطار الحوكمة والمطابقة العددية للمنشآت والتحصينات الإنشائية
        </p>
      </div>
    </div>
  );
}
