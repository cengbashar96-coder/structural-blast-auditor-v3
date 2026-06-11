/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⚡ مكون الواجهة الخفيف لحالة المزامنة — SyncStatusBar
 * ═══════════════════════════════════════════════════════════════════════
 *
 * مكون مرئي أمامي رصين وخفيف (Lightweight Client Component)
 * خالي تماماً من أي منطق للمزامنة أو اشتقاق وحساب الحالات داخلياً.
 *
 * يستقبل هذا المكون النصوص واللافتات (Labels/Strings) الجاهزة فقط
 * والممررة إليه مباشرة من الـ store والـ hooks المصممة أعلاه،
 * ليعرض حالة اتصال الشبكة وحالة العمليات المعلقة بشكل منفصل وذكي.
 *
 * مثال العرض:
 *   "الشبكة: متصل | المزامنة: فشل جزئي - 3 عمليات معلقة"
 *
 * ⚠️ كفاءة استهلاك موارد المعالجة بنسبة 100%:
 *    - لا يحتوي على أي منطق حسابي أو اشتقاق حالات
 *    - لا يستدعي أي API أو يقرأ من IndexedDB مباشرة
 *    - كل البيانات تأتي من Props الممررة من Hooks المستقلة
 *    - إعادة الرندر تحدث فقط عندما تتغير Props فعلاً
 *    -得益于 useSyncExternalStore في الطبقات السفلية
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import type { NetworkConnectionState, SyncQueueState } from '@/hooks/useSyncMonitor';

// ═══════════════════════════════════════════════════════════════════════
// 📐 عقود Props — مدخلات المكون النقية
// ═══════════════════════════════════════════════════════════════════════

export interface SyncStatusBarProps {
  /** حالة اتصال الشبكة الفيزيائية — من useNetworkStatus */
  networkStatus: NetworkConnectionState;
  /** حالة المزامنة البرمجية — من useSyncQueueStatus */
  syncState: SyncQueueState;
  /** عدد العمليات المعلقة — من useSyncQueueStatus */
  pendingCount: number;
  /** عدد العمليات الفاشلة — من useSyncQueueStatus */
  failedCount?: number;
  /** عدد العمليات الجارية — من useSyncQueueStatus */
  syncingCount?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 🎨 دوال عرض النصوص — مفصولة عن المنطق
// ═══════════════════════════════════════════════════════════════════════

/** وصف حالة الشبكة بالعربية */
function getNetworkLabel(status: NetworkConnectionState): string {
  switch (status) {
    case 'online':
      return 'متصل';
    case 'offline':
      return 'غير متصل';
    default:
      return 'غير معروف';
  }
}

/** وصف حالة المزامنة بالعربية — نص جاهز بدون منطق حسابي */
function getSyncLabel(state: SyncQueueState, pendingCount: number): string {
  switch (state) {
    case 'idle':
      return pendingCount > 0
        ? `${pendingCount} عملية معلقة`
        : 'لا عمليات معلقة';
    case 'syncing':
      return `جارٍ المزامنة${pendingCount > 0 ? ` - ${pendingCount} متبقية` : ''}`;
    case 'partial_sync_failed':
      return `فشل جزئي - ${pendingCount} عملية معلقة`;
    case 'sync_failed':
      return 'فشل المزامنة';
    default:
      return 'غير معروف';
  }
}

/** لون مؤشر الشبكة */
function getNetworkDotColor(status: NetworkConnectionState): string {
  return status === 'online' ? 'bg-emerald-400' : 'bg-amber-500';
}

/** لون نص حالة المزامنة */
function getSyncTextColor(state: SyncQueueState): string {
  switch (state) {
    case 'idle':
      return 'text-slate-400';
    case 'syncing':
      return 'text-blue-400';
    case 'partial_sync_failed':
      return 'text-amber-400';
    case 'sync_failed':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}

/** رمز مؤشر المزامنة */
function getSyncIcon(state: SyncQueueState): string {
  switch (state) {
    case 'idle':
      return '●';
    case 'syncing':
      return '⟳';
    case 'partial_sync_failed':
      return '▲';
    case 'sync_failed':
      return '✕';
    default:
      return '●';
  }
}

/** لون خلفية شريط الحالة بالكامل */
function getBarBackground(state: SyncQueueState, networkStatus: NetworkConnectionState): string {
  if (networkStatus === 'offline') {
    return 'bg-amber-950/30 border-amber-800/40';
  }
  switch (state) {
    case 'syncing':
      return 'bg-blue-950/20 border-blue-800/30';
    case 'partial_sync_failed':
      return 'bg-amber-950/20 border-amber-800/30';
    case 'sync_failed':
      return 'bg-red-950/20 border-red-800/30';
    default:
      return 'bg-slate-900/40 border-slate-700/50';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ⚡ المكون الرئيسي — SyncStatusBar
// ═══════════════════════════════════════════════════════════════════════

/**
 * SyncStatusBar — شريط حالة المزامنة الخفيف
 *
 * ⚠️ هذا المكون خالي تماماً من أي منطق مزامنة:
 *    - لا يستدعي أي Server Action
 *    - لا يقرأ من IndexedDB مباشرة
 *    - لا يحسب أي حالة — كل شيء يأتي من Props
 *    - المسؤولية الوحيدة: عرض البيانات الممررة بصرياً
 *
 * نمط الاستخدام:
 * ──────────────
 * function DashboardLayout() {
 *   const networkStatus = useNetworkStatus();
 *   const { syncState, pendingCount, failedCount } = useSyncQueueStatus();
 *
 *   return (
 *     <SyncStatusBar
 *       networkStatus={networkStatus}
 *       syncState={syncState}
 *       pendingCount={pendingCount}
 *       failedCount={failedCount}
 *     />
 *   );
 * }
 */
export function SyncStatusBar({
  networkStatus,
  syncState,
  pendingCount,
  failedCount = 0,
  syncingCount = 0,
}: SyncStatusBarProps) {
  // النصوص الجاهزة — بدون أي اشتقاق أو حساب
  const networkLabel = getNetworkLabel(networkStatus);
  const syncLabel = getSyncLabel(syncState, pendingCount);

  // الألوان الجاهزة — بدون أي منطق شرطي معقد
  const networkDotColor = getNetworkDotColor(networkStatus);
  const syncTextColor = getSyncTextColor(syncState);
  const syncIcon = getSyncIcon(syncState);
  const barBg = getBarBackground(syncState, networkStatus);

  // هل المزامنة جارية؟ (للتأثير الحركي)
  const isActivelySyncing = syncState === 'syncing';

  return (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${barBg}`}
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      {/* ═══ حالة الشبكة الفيزيائية ═══ */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${networkDotColor} ${
            networkStatus === 'online' ? '' : 'animate-pulse'
          }`}
          aria-hidden="true"
        />
        <span className="text-slate-500">الشبكة:</span>
        <span
          className={
            networkStatus === 'online'
              ? 'text-emerald-400 font-medium'
              : 'text-amber-400 font-bold'
          }
        >
          {networkLabel}
        </span>
      </div>

      {/* ═══ فاصل بصري ═══ */}
      <span className="text-slate-700" aria-hidden="true">|</span>

      {/* ═══ حالة المزامنة البرمجية ═══ */}
      <div className="flex items-center gap-2">
        <span
          className={`${syncTextColor} ${
            isActivelySyncing ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
          style={isActivelySyncing ? { display: 'inline-block' } : undefined}
        >
          {syncIcon}
        </span>
        <span className="text-slate-500">المزامنة:</span>
        <span className={`${syncTextColor} font-medium`}>
          {syncLabel}
        </span>
      </div>

      {/* ═══ تفاصيل إضافية (اختيارية) ═══ */}
      {(failedCount > 0 || syncingCount > 0) && (
        <>
          <span className="text-slate-700" aria-hidden="true">|</span>
          <div className="flex items-center gap-3 text-slate-500">
            {syncingCount > 0 && (
              <span>
                <span className="text-blue-400 font-mono">{syncingCount}</span> جارية
              </span>
            )}
            {failedCount > 0 && (
              <span>
                <span className="text-red-400 font-mono">{failedCount}</span> فاشلة
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
