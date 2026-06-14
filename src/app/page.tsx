// ═══════════════════════════════════════════════════════════════════════
// صفحة الجذر — الصفحة الرئيسية
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4" dir="rtl">
      <div className="max-w-lg text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-100">
            المدقق الديناميكي الموحد V3.0
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

        <p className="text-sm text-slate-500">
          إطار الحوكمة والمطابقة العددية للمنشآت والتحصينات الإنشائية
        </p>
      </div>
    </div>
  );
}
