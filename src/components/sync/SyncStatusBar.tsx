/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🎨 مكون شريط الحالة التزامني الميداني المطوّر — SyncStatusBar V2
 * ═══════════════════════════════════════════════════════════════════════
 *
 * مكون مرئي يعكس حالة المزامنة للمهندس الاستشاري في الموقع فورياً.
 * يقرأ مباشرة من الـ External Store بشكل متزامن وآمن تزامناً مع Next.js.
 *
 * معمارية المكون:
 * ──────────────────
 *   ١. يقرأ الحالة من syncUIStore عبر useSyncExternalStore
 *   ٢. يدعم الـ Server-Side Rendering عبر getServerSnapshot
 *   ٣. يعرض الحالات الخمس بنظام ألوان دلالي:
 *      - IDLE: رمادي — النظام مستقر
 *      - SYNCING: أزرق نابض — جاري المزامنة
 *      - COMPLETED: أخضر — اكتمال ناجح
 *      - SUCCESS_WITH_CONFLICTS: كهرماني — نجاح مع تعارضات محسومة
 *      - CRITICAL_ERROR: أحمر — فشل حرج
 *   ٤. عدادات إحصائية تجميعية موجهة للمهندس
 *   ٥. توقيت آخر تحديث بالتوقيت المحلي السوري
 *
 * ⚠️ مبادئ الأداء:
 *    - لا يحتوي على أي منطق مزامنة أو اتصال بالخادم
 *    - لا يقرأ من IndexedDB مباشرة
 *    - يعتمد كلياً على useSyncExternalStore للتحديثات
 *    - إعادة الرندر تحدث فقط عندما يتغير الـ Snapshot فعلاً
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useSyncExternalStore } from 'react';
import { syncUIStore } from '@/lib/client/sync-ui-store';

/**
 * SyncStatusBar — مكون شريط الحالة التزامني الميداني المطوّر
 *
 * يقرأ مباشرة من الـ External Store بشكل متزامن وآمن تزامناً مع Next.js.
 * يدعم الـ Server-Side Rendering عبر getServerSnapshot لمنع الـ
 * Hydration Mismatch.
 *
 * نمط الاستخدام:
 * ──────────────
 * // لا يحتاج لأي props — يقرأ مباشرة من المخزن الخارجي
 * function DashboardLayout() {
 *   return (
 *     <div>
 *       <SyncStatusBar />
 *       {/* باقي المكونات *​/}
 *     </div>
 *   );
 * }
 */
export const SyncStatusBar: React.FC = () => {
  // الارتباط بالمخزن الخارجي مع دعم الـ Server-Side Rendering
  const syncState = useSyncExternalStore(
    syncUIStore.subscribe,
    syncUIStore.getSnapshot,
    syncUIStore.getServerSnapshot
  );

  const { isSyncing, globalStatus, lastSyncTime, summary } = syncState;

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 تحديد الطابع اللوني والبصري بناءً على الحالات الهندسية
  // ═══════════════════════════════════════════════════════════════════

  let statusColorClass = 'bg-gray-100 text-gray-700 border-gray-300';
  let statusMessage = 'النظام مستقر - في انتظار العمليات';

  switch (globalStatus) {
    case 'SYNCING':
      statusColorClass = 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
      statusMessage = 'جاري مزامنة المخططات والحسابات الإنشائية للموقع مركزيًا...';
      break;
    case 'COMPLETED':
      statusColorClass = 'bg-green-50 text-green-700 border-green-200';
      statusMessage = 'اكتملت المزامنة بنجاح واستقرت كافة البيانات الميدانية.';
      break;
    case 'SUCCESS_WITH_CONFLICTS':
      statusColorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      statusMessage = 'تمت المزامنة: حُسمت تعارضات هندسية وتم اعتماد خط أساس الخادم.';
      break;
    case 'CRITICAL_ERROR':
      statusColorClass = 'bg-red-50 text-red-700 border-red-200';
      statusMessage = 'خطأ حرج: فشل تحديث بعض السجلات الميدانية. سيتم إعادة المحاولة تلقائياً.';
      break;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🔄 عدم عرض تفاصيل إضافية في حالة الخمول البدائي
  // ═══════════════════════════════════════════════════════════════════

  if (globalStatus === 'IDLE' && !lastSyncTime) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 العرض المرئي
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div
      className={`w-full p-4 border rounded-lg md:flex md:items-center md:justify-between transition-all duration-300 ${statusColorClass}`}
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      {/* ═══ الرسالة الرئيسية والمؤشر المتحرك ═══ */}
      <div className="flex items-center space-x-3 space-x-reverse">
        {isSyncing && (
          <svg
            className="animate-spin h-5 w-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <div>
          <p className="font-bold text-sm md:text-base">{statusMessage}</p>
          {lastSyncTime && (
            <p className="text-xs opacity-80 mt-0.5">
              آخر تحديث للموقع:{' '}
              {lastSyncTime.toLocaleTimeString('ar-SY', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>

      {/* ═══ العدادات الإحصائية التجميعية ═══ */}
      {/* موجهة للمهندس لمراقبة حجم البيانات الحية */}
      <div className="mt-3 md:mt-0 flex flex-wrap gap-2 text-xs font-mono">
        <span className="px-2 py-1 rounded bg-white/60 border border-black/5 text-gray-800">
          تم الحفظ: {summary.succeeded}
        </span>
        {summary.bypassed > 0 && (
          <span className="px-2 py-1 rounded bg-blue-100/50 border border-blue-200 text-blue-800">
            مُتجاوز (مكرر): {summary.bypassed}
          </span>
        )}
        {summary.conflicts > 0 && (
          <span className="px-2 py-1 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold">
            التعارضات المحسومة: {summary.conflicts}
          </span>
        )}
        {summary.failed > 0 && (
          <span className="px-2 py-1 rounded bg-red-100 border border-red-300 text-red-900 font-bold">
            الفاشلة: {summary.failed}
          </span>
        )}
      </div>
    </div>
  );
};

export default SyncStatusBar;
