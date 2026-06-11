/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📡 مراقبة الشبكة وحالة المزامنة المستقلة — Sync Monitor Hooks
 * ═══════════════════════════════════════════════════════════════════════
 *
 * خطّافان منفصلان تماماً لضمان عدم تداخل منطق الواجهات:
 *
 *   ١. useNetworkStatus — يراقب الاتصال الفيزيائي للمتصفح فقط
 *      يُرجع: 'online' | 'offline'
 *
 *   ٢. useSyncQueueStatus — يراقب حالة الطابور البرمجية
 *      يعتمد على مخزن خارجي (External Store) بعقد تفصيلي
 *      يوفّر دالتي subscribe و getSnapshot بوضوح لضمان
 *      إرجاع snapshot ثابت تماماً يمنع الـ Re-renders العشوائية.
 *      يُرجع: 'idle' | 'syncing' | 'partial_sync_failed' | 'sync_failed'
 *             مع عدّاد العمليات المعلقة (pendingCount).
 *
 * ⚠️ مبدأ الفصل الصارم:
 *    - useNetworkStatus لا يعرف شيئاً عن طابور المزامنة
 *    - useSyncQueueStatus لا يعرف شيئاً عن حالة الشبكة الفيزيائية
 *    - كل خطّاف مسؤول عن بُعد واحد فقط من المراقبة
 *    - المكونات تدمج المعلومات من كلا الخطّافين حسب حاجتها
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useSyncExternalStore, useCallback, useRef } from 'react';
import { sovereignDB } from '@/lib/db/sovereign-local-db';

// ═══════════════════════════════════════════════════════════════════════
// 🌐 الخطّاف الأول: useNetworkStatus — مراقبة الاتصال الفيزيائي
// ═══════════════════════════════════════════════════════════════════════

/** نوع حالة الاتصال الفيزيائي */
export type NetworkConnectionState = 'online' | 'offline';

/**
 * واجهة مخزن حالة الشبكة — External Store Contract
 *
 * يوفّر الدالتين المطلوبتين من قبل useSyncExternalStore:
 *   - subscribe: تسجيل مستمع للتغييرات
 *   - getSnapshot: الحصول على اللقطة الحالية
 */
interface NetworkStatusStore {
  /** تسجيل مستمع للتغييرات — يُرجع دالة إلغاء التسجيل */
  subscribe(callback: (state: NetworkConnectionState) => void): () => void;
  /** الحصول على اللقطة الحالية — يجب أن تكون مرجعية ثابتة (Stable Reference) */
  getSnapshot(): NetworkConnectionState;
}

/**
 * إنشاء مخزن حالة الشبكة — Singleton Factory
 *
 * يُنشئ مخزناً واحداً مشتركاً لجميع المكونات التي تستخدم
 * useNetworkStatus، مما يمنع تكرار مستمعي الأحداث.
 */
function createNetworkStatusStore(): NetworkStatusStore {
  /** اللقطة الحالية — ثابتة مرجعياً (فقط قيمتان ممكنتان) */
  let currentSnapshot: NetworkConnectionState =
    typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'online';

  /** مستمعو التغييرات */
  const listeners = new Set<(state: NetworkConnectionState) => void>();

  /** إشعار جميع المستمعين بتغيير الحالة */
  function notify(state: NetworkConnectionState) {
    currentSnapshot = state;
    listeners.forEach((listener) => listener(state));
  }

  return {
    subscribe(callback: (state: NetworkConnectionState) => void): () => void {
      listeners.add(callback);

      // تسجيل مستمعي الأحداث عند أول اشتراك
      if (listeners.size === 1 && typeof window !== 'undefined') {
        window.addEventListener('online', () => notify('online'));
        window.addEventListener('offline', () => notify('offline'));
      }

      // إرجاع دالة إلغاء الاشتراك
      return () => {
        listeners.delete(callback);
      };
    },

    getSnapshot(): NetworkConnectionState {
      return currentSnapshot;
    },
  };
}

/** المخزن الوحيد لحالة الشبكة — يُشاركه جميع المكونات */
const networkStatusStore = createNetworkStatusStore();

/**
 * useNetworkStatus — خطّاف مراقبة الاتصال الفيزيائي للمتصفح
 *
 * يراقب فقط حالة الاتصال الفيزيائي (navigator.onLine)
 * دون أي تدخل في منطق المزامنة أو طابور العمليات.
 *
 * ⚠️ هذا الخطّاف مسؤول عن بُعد واحد فقط:
 *    "هل المتصفح متصل بالشبكة فيزيائياً؟"
 *    لا يعرف شيئاً عن حالة المزامنة البرمجية.
 *
 * @returns حالة الاتصال الفيزيائي: 'online' | 'offline'
 *
 * @example
 * function MyComponent() {
 *   const networkStatus = useNetworkStatus();
 *   return <span>{networkStatus === 'online' ? 'متصل' : 'غير متصل'}</span>;
 * }
 */
export function useNetworkStatus(): NetworkConnectionState {
  // استخدام useSyncExternalStore لضمان التكامل مع React 18+ Concurrent Mode
  return useSyncExternalStore(
    // subscribe: دالة الاشتراك في التغييرات
    networkStatusStore.subscribe,
    // getSnapshot: اللقطة الحالية (للمتصفح)
    networkStatusStore.getSnapshot,
    // getServerSnapshot: القيمة الافتراضية في SSR
    () => 'online' as NetworkConnectionState
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 📊 الخطّاف الثاني: useSyncQueueStatus — مراقبة حالة الطابور البرمجية
// ═══════════════════════════════════════════════════════════════════════

/** نوع حالة المزامنة البرمجية */
export type SyncQueueState =
  | 'idle'                  // لا توجد عمليات معلقة أو جارية
  | 'syncing'               // مزامنة جارية حالياً
  | 'partial_sync_failed'   // فشل جزئي — بعض العمليات فشلت
  | 'sync_failed';          // فشل كامل — جميع العمليات فشلت

/** واجهة نتيجة حالة الطابور */
export interface SyncQueueSnapshot {
  /** حالة المزامنة البرمجية */
  syncState: SyncQueueState;
  /** عدد العمليات المعلقة (PENDING) */
  pendingCount: number;
  /** عدد العمليات الجارية (SYNCING) */
  syncingCount: number;
  /** عدد العمليات الفاشلة (FAILED) */
  failedCount: number;
  /** عدد العمليات المكتملة (COMPLETED) */
  completedCount: number;
}

/**
 * واجهة مخزن حالة الطابور — External Store Contract
 *
 * ⚠️ يجب أن يلتزم هذا المخزن بعقد تفصيلي يوفّر:
 *   - subscribe: دالة اشتراك في التغييرات
 *   - getSnapshot: دالة إرجاع لقطة ثابتة تماماً (Stable Snapshot)
 *     تمنع الـ Re-renders العشوائية
 *
 * "ثابتة تماماً" يعني:
 *   - إذا لم تتغير البيانات، يُرجع نفس مرجع الكائن
 *   - React تقارن المراجع (Object.is) لتحديد الحاجة لإعادة الرندر
 *   - هذا يمنع Re-renders المتكررة عند كل استطلاع
 */
interface SyncQueueStatusStore {
  /** تسجيل مستمع للتغييرات في حالة الطابور */
  subscribe(callback: () => void): () => void;
  /** الحصول على اللقطة الحالية — ثابتة مرجعياً */
  getSnapshot(): SyncQueueSnapshot;
}

/** اللقحة الابتدائية — حالة السكون */
const IDLE_SNAPSHOT: SyncQueueSnapshot = {
  syncState: 'idle',
  pendingCount: 0,
  syncingCount: 0,
  failedCount: 0,
  completedCount: 0,
};

/**
 * إنشاء مخزن حالة الطابور — Singleton Factory
 *
 * يستقصي طابور المزامنة في IndexedDB بشكل دوري ويُنتج
 * لقطات ثابتة مرجعياً (Stable Snapshots) لتغذية useSyncExternalStore.
 *
 * ⚠️ مبدأ ثبات اللقطة (Snapshot Stability):
 *    - إذا لم تتغير الأرقام، يُرجع نفس مرجع الكائن السابق
 *    - هذا يمنع React من إعادة الرندر عندما لا تتغير البيانات
 *    - المقارنة تتم عبر Object.is على مستوى مرجع الكائن بالكامل
 */
function createSyncQueueStatusStore(pollIntervalMs: number = 3000): SyncQueueStatusStore {
  /** اللقطة الحالية — مرجع ثابت */
  let currentSnapshot: SyncQueueSnapshot = IDLE_SNAPSHOT;

  /** مستمعو التغييرات */
  const listeners = new Set<() => void>();

  /** مؤقت الاستطلاع الدوري */
  let pollTimerId: ReturnType<typeof setInterval> | null = null;

  /** عدد المستمعين النشطين */
  let activeListenerCount = 0;

  /**
   * استطلاع حالة الطابور من IndexedDB
   *
   * يقوم ب:
   *   ١. قراءة عدادات كل حالة من Dexie
   *   ٢. تحديد حالة المزامنة البرمجية (syncState)
   *   ٣. مقارنة اللقطة الجديدة بالسابقة مرجعياً
   *   ٤. إشعار المستمعين فقط إذا تغيرت اللقحة فعلاً
   */
  async function pollQueueStatus(): Promise<void> {
    try {
      // ١. قراءة عدادات كل حالة
      const [pending, syncing, completed, failed] = await Promise.all([
        sovereignDB.syncQueue.where('status').equals('PENDING').count(),
        sovereignDB.syncQueue.where('status').equals('SYNCING').count(),
        sovereignDB.syncQueue.where('status').equals('COMPLETED').count(),
        sovereignDB.syncQueue.where('status').equals('FAILED').count(),
      ]);

      // ٢. تحديد حالة المزامنة البرمجية
      let syncState: SyncQueueState;

      if (syncing > 0) {
        syncState = 'syncing';
      } else if (failed > 0 && pending > 0) {
        syncState = 'partial_sync_failed';
      } else if (failed > 0 && pending === 0) {
        syncState = 'sync_failed';
      } else if (pending > 0) {
        // عمليات معلقة لكن لا مزامنة جارية — حالة انتقالية
        syncState = 'idle';
      } else {
        syncState = 'idle';
      }

      // ٣. بناء اللقطة الجديدة
      const newSnapshot: SyncQueueSnapshot = {
        syncState,
        pendingCount: pending,
        syncingCount: syncing,
        failedCount: failed,
        completedCount: completed,
      };

      // ٤. مقارنة مرجعية — إشعار فقط إذا تغيرت البيانات فعلاً
      if (
        currentSnapshot.syncState !== newSnapshot.syncState ||
        currentSnapshot.pendingCount !== newSnapshot.pendingCount ||
        currentSnapshot.syncingCount !== newSnapshot.syncingCount ||
        currentSnapshot.failedCount !== newSnapshot.failedCount ||
        currentSnapshot.completedCount !== newSnapshot.completedCount
      ) {
        currentSnapshot = newSnapshot;
        // إشعار جميع المستمعين بتغيير اللقحة
        listeners.forEach((listener) => listener());
      }
    } catch (error) {
      console.error('[SyncQueueStatus] فشل استطلاع حالة الطابور:', error);
    }
  }

  /** بدء الاستطلاع الدوري */
  function startPolling(): void {
    if (pollTimerId !== null) return;
    // استطلاع فوري ثم دوري
    pollQueueStatus();
    pollTimerId = setInterval(pollQueueStatus, pollIntervalMs);
  }

  /** إيقاف الاستطلاع الدوري */
  function stopPolling(): void {
    if (pollTimerId !== null) {
      clearInterval(pollTimerId);
      pollTimerId = null;
    }
  }

  return {
    subscribe(callback: () => void): () => void {
      listeners.add(callback);
      activeListenerCount++;

      // بدء الاستطلاع عند أول مستمع
      if (activeListenerCount === 1) {
        startPolling();
      }

      return () => {
        listeners.delete(callback);
        activeListenerCount--;

        // إيقاف الاستطلاع عند عدم وجود مستمعين
        if (activeListenerCount === 0) {
          stopPolling();
        }
      };
    },

    getSnapshot(): SyncQueueSnapshot {
      return currentSnapshot;
    },
  };
}

/** المخزن الوحيد لحالة الطابور — يُشاركه جميع المكونات */
let _syncQueueStatusStore: SyncQueueStatusStore | null = null;

/**
 * الحصول على مخزن حالة الطابور — Singleton
 *
 * @param pollIntervalMs - فترة الاستطلاع بالمللي ثانية (افتراضي: 3000)
 */
function getSyncQueueStatusStore(pollIntervalMs?: number): SyncQueueStatusStore {
  if (!_syncQueueStatusStore) {
    _syncQueueStatusStore = createSyncQueueStatusStore(pollIntervalMs);
  }
  return _syncQueueStatusStore;
}

/**
 * useSyncQueueStatus — خطّاف مراقبة حالة الطابور البرمجية
 *
 * يعتمد على مخزن خارجي (External Store) بعقد تفصيلي يوفّر
 * دالتي subscribe و getSnapshot بوضوح لضمان إرجاع snapshot
 * ثابت تماماً يمنع الـ Re-renders العشوائية.
 *
 * ⚠️ هذا الخطّاف مسؤول عن بُعد واحد فقط:
 *    "ما هي حالة طابور المزامنة البرمجية؟"
 *    لا يعرف شيئاً عن حالة الشبكة الفيزيائية.
 *
 * @param pollIntervalMs - فترة الاستطلاع بالمللي ثانية (اختياري)
 * @returns لقحة حالة الطابور: { syncState, pendingCount, syncingCount, failedCount, completedCount }
 *
 * @example
 * function SyncIndicator() {
 *   const { syncState, pendingCount } = useSyncQueueStatus();
 *   return (
 *     <span>
 *       {syncState === 'idle' ? 'لا عمليات معلقة' : `${pendingCount} معلقة`}
 *     </span>
 *   );
 * }
 */
export function useSyncQueueStatus(pollIntervalMs?: number): SyncQueueSnapshot {
  const store = getSyncQueueStatusStore(pollIntervalMs);

  return useSyncExternalStore(
    // subscribe: دالة الاشتراك في التغييرات
    store.subscribe,
    // getSnapshot: اللقحة الحالية (للمتصفح)
    store.getSnapshot,
    // getServerSnapshot: القيمة الافتراضية في SSR
    () => IDLE_SNAPSHOT
  );
}

/**
 * useSyncQueueStatusWithPolling — نسخة مع فترة استطلاع مخصصة
 *
 * ⚠️ هذه النسخة تُنشئ مخزناً جديداً بفترة استطلاع مختلفة.
 *    استخدمها فقط إذا كنت بحاجة إلى تردد تحديث مختلف عن الافتراضي.
 *
 * @param pollIntervalMs - فترة الاستطلاع بالمللي ثانية
 * @returns لقحة حالة الطابور
 */
export function useSyncQueueStatusWithPolling(pollIntervalMs: number): SyncQueueSnapshot {
  // استخدام useRef للحفاظ على نفس المخزن طوال دورة حياة المكون
  const storeRef = useRef<SyncQueueStatusStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createSyncQueueStatusStore(pollIntervalMs);
  }

  return useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    () => IDLE_SNAPSHOT
  );
}
