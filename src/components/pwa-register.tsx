// ═══════════════════════════════════════════════════════════════════════
// مكون مراقبة الشبكة وتحديث الإصدارات الحوكمي
// منصة المدقق الديناميكي الموحد V3.0
// يحقن الـ Service Worker ويُخطّر الواجهة بأي تحديث جذري للـ Baseline
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';

export function PWARegister() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // دعم Serwist (الخليفة الحديث لـ Workbox في Next.js)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // رصد وجود تحديث بانتظار التفعيل (New Baseline Deployment)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // يوجد Service Worker جديد بانتظار التفعيل
              setSwRegistration(registration);
              setShowUpdatePrompt(true);
            }
          });
        });
      });

      // دعم Serwist API المباشر (إذا كان متاحاً)
      if ((window as any).serwist) {
        const serwist = (window as any).serwist;

        serwist.addEventListener('waiting', (event: any) => {
          setSwRegistration(event.target);
          setShowUpdatePrompt(true);
        });

        serwist.register();
      }
    }
  }, []);

  const handleUpdateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      // إرسال إشارة تخطي الانتظار لإجبار الـ Service Worker الجديد على العمل فوراً
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      swRegistration.waiting.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'activated') {
          // إعادة تحميل نافذة المتصفح لتحديث الـ App Shell كاملاً
          window.location.reload();
        }
      });
    } else {
      // إعادة تحميل مباشرة إذا لم يكن هناك waiting worker
      window.location.reload();
    }
  };

  if (!showUpdatePrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 max-w-sm border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-2xl rounded-lg"
      dir="rtl"
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm font-bold text-amber-400">
          🚨 تحديث حوكمي جديد متوفر (New Baseline Ready)
        </div>
        <div className="text-xs text-slate-400 leading-relaxed">
          تم إصدار تحديث برمي جديد وتعديل في مصفوفة الـ RTM للتحقق الحسابي.
          يجب تفعيل النسخة المحدثة فوراً لضمان دقة العمل الحسابي الميداني.
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleUpdateApp}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-all"
          >
            تحديث وتفعيل النسخة الإلزامية
          </button>
        </div>
      </div>
    </div>
  );
}
