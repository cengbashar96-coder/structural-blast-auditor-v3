// ═══════════════════════════════════════════════════════════════════════
// واجهة الهبوط الاحتياطية (Offline Fallback Page)
// منصة المدقق الديناميكي الموحد V3.0
// تظهر عند محاولة فتح روابط غير مجهزة في الكاش أثناء الانقطاع التام
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState } from 'react';

export default function OfflineFallbackPage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const toOnline = () => setIsOnline(true);
    const toOffline = () => setIsOnline(false);

    window.addEventListener('online', toOnline);
    window.addEventListener('offline', toOffline);

    return () => {
      window.removeEventListener('online', toOnline);
      window.removeEventListener('offline', toOffline);
    };
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-slate-100 text-center"
      dir="rtl"
    >
      <div className="rounded-full bg-slate-800 p-4 mb-4 text-red-400 animate-pulse">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L2.121 2.121M12 18.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">
        أنت تعمل الآن في الوضع الميداني المعزول (Offline)
      </h1>
      <p className="text-slate-400 max-w-md mb-6 text-sm leading-relaxed">
        انقطع الاتصال بالشبكة، ولكن جميع محركات الحساب (ب) و (ج)، وقاعدة
        البيانات المحلية ومصفوفة المتطلبات RTM تعمل بكفاءة مطلقة وبأمان 100%
        دون الحاجة للإنترنت.
      </p>
      {isOnline ? (
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-semibold transition-all"
        >
          إعادة الاتصال الفوري بالخادم
        </button>
      ) : (
        <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-900/50 px-4 py-2 rounded">
          يتم حفظ كافة عمليات التدقيق الحالية وتجهيزها في طابور المزامنة
          تلقائياً.
        </div>
      )}
    </div>
  );
}
