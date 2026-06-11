/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🏛️ مخزن الحالة الخارجي المحصّن — Production-Grade External Store
 * ═══════════════════════════════════════════════════════════════════════
 *
 * المخزن الخفيف الخارجي للواجهة يعتمد على الـ Native React Sync
 * (useSyncExternalStore) ويضمن الحفاظ على مرجعية تزامنية وحيدة
 * وثابتة (Immutable Snapshot) للـ SyncStatusBar.
 *
 * مبادئ التصميم:
 * ──────────────────
 *   ١. ثبات مرجع الـ Snapshot:
 *      إعادة مرجع جديد في كل مرة يُستدعى فيها getSnapshot دون
 *      تغيير حقيقي في البيانات ستؤدي إلى حلقة مفرغة من الـ
 *      Re-renders وتدهور أداء الواجهة.
 *      الحل: الحفاظ على كائن ثابت لا يتغير إلا عند حدوث تحديث فعلي.
 *
 *   ٢. توافقية الـ SSR (Server-Side Rendering):
 *      الـ Server Actions ومكونات Next.js تحتاج دائماً إلى وجود
 *      getServerSnapshot لمنع حدوث مشاكل الـ Hydration Mismatch
 *      عندما يمر المكون عبر الخادم أولاً قبل وصوله للمتصفح.
 *
 *   ٣. تطهير الـ Critical Path:
 *      إخراج عمليات الـ Side Effects خارج نطاق الـ Store يضمن
 *      بقاء التحديث سريعاً ومختصراً على تحديث البيانات البحتة.
 *
 * ⚠️ بديل أصلي (Native) وخفيف عن المكتبات الخارجية مثل Zustand:
 *    - لا يحتاج تبعيات إضافية
 *    - متوافق تاماً مع React 19 و Next.js 15
 *    - يدعم useSyncExternalStore مباشرة
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SyncUIState } from './sync-feedback-adapter';

// ═══════════════════════════════════════════════════════════════════════
// 🏛️ الحالة الابتدائية الثابتة
// ═══════════════════════════════════════════════════════════════════════

/** الحالة الابتدائية الثابتة — تُستخدم كـ Server Snapshot أيضاً */
const initialSnapshot: SyncUIState = {
  isSyncing: false,
  lastSyncTime: null,
  summary: { succeeded: 0, bypassed: 0, conflicts: 0, failed: 0 },
  globalStatus: 'IDLE',
};

// ═══════════════════════════════════════════════════════════════════════
// 🔐 المخزن الخارجي المحصّن
// ═══════════════════════════════════════════════════════════════════════

/** الحفاظ على مرجع وحيد وثابت للكائن لمنع الـ Re-renders العشوائية */
let currentSnapshot: SyncUIState = initialSnapshot;

/** مستمعو التغييرات — مجموعة فريدة لمنع التكرار */
const listeners = new Set<() => void>();

/**
 * syncUIStore — المخزن الخارجي المحصّن
 *
 * يوفر الدوال الثلاث المطلوبة من قبل useSyncExternalStore:
 *   - update: تحديث الحالة بنمط التعديل غير القابل للتغيير
 *   - subscribe: تسجيل مستمع للتغييرات
 *   - getSnapshot: الحصول على اللقطة الحالية (للمتصفح)
 *   - getServerSnapshot: القيمة الافتراضية في SSR
 */
export const syncUIStore = {
  /**
   * تحديث الحالة بنمط التعديل غير القابل للتغيير (Immutable Update)
   *
   * ⚠️ يتحقق مما إذا كان هناك تغيير حقيقي لمنع إخطار المستمعين بلا داعٍ.
   * هذا يمنع حلقات الـ Re-renders المفرغة عند استدعاء update
   * بنفس البيانات المتكررة.
   *
   * @param updateData - البيانات الجزئية المراد تحديثها
   */
  update(updateData: Partial<SyncUIState>): void {
    // التحقق مما إذا كان هناك تغيير حقيقي
    const hasChanges = (Object.keys(updateData) as Array<keyof SyncUIState>).some(
      (key) => {
        const newValue = updateData[key];
        const currentValue = currentSnapshot[key];

        // مقارنة عميقة للكائنات الفرعية (مثل summary)
        if (typeof newValue === 'object' && newValue !== null && typeof currentValue === 'object' && currentValue !== null) {
          return JSON.stringify(newValue) !== JSON.stringify(currentValue);
        }

        return newValue !== currentValue;
      }
    );

    if (hasChanges) {
      // إنشاء كائن جديد (Immutable Update) لضمان اكتشاف React للتغيير
      currentSnapshot = { ...currentSnapshot, ...updateData };

      // إشعار جميع المستمعين بالتغيير
      listeners.forEach((listener) => listener());
    }
  },

  /**
   * تسجيل مستمع للتغييرات
   *
   * @param listener - دالة تُستدعى عند تغيير الحالة
   * @returns دالة إلغاء التسجيل
   */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * الحصول على اللقطة الحالية — يُعيد دائماً نفس المرجع الثابت
   * ما لم تتغير البيانات فعلياً (React Safety)
   *
   * @returns اللقطة الحالية لحالة المزامنة
   */
  getSnapshot(): SyncUIState {
    return currentSnapshot;
  },

  /**
   * خط الدفاع ضد أخطاء الـ Hydration Mismatch في Next.js
   *
   * يُعيد الحالة الابتدائية الثابتة دائماً على الخادم، مما يضمن
   * تطابق الـ Server-Side Render مع الـ Client-Side Hydration
   * الأولي قبل تلقي أي تحديثات فعلية.
   *
   * ⚠️ ضروري لـ Next.js 15 مع React 19 — بدونه يحدث خطأ
   *    Hydration Mismatch لأن الخادم لا يملك حالة المزامنة.
   *
   * @returns الحالة الابتدائية الثابتة
   */
  getServerSnapshot(): SyncUIState {
    return initialSnapshot;
  },

  /**
   * إعادة تعيين المخزن إلى الحالة الابتدائية
   *
   * مفيد للاختبار (Testing) أو عند تسجيل الخروج.
   */
  reset(): void {
    currentSnapshot = initialSnapshot;
    listeners.forEach((listener) => listener());
  },
};
