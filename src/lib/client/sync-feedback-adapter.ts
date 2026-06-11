/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⚖️ محول التغذية الراجعة والمزامنة الميداني المطوّر (نسخة Dexie الآمنة)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يعتمد بالكامل على Dexie Transactions لضمان الذرية المطلقة
 * ومنع الـ Microtask Tick Race الذي يُمثّل أكثر مشاكل IndexedDB
 * خطورة في الإنتاج الفعلي.
 *
 * معمارية المعالجة الميدانية:
 * ──────────────────────────────
 *   ١. الدالة النقية calculateSyncResolution:
 *      فصل قرار المعالجة وحساب الخطوات التالية
 *      مصممة لتكون معزولة تماماً وسهلة الاختبار (Unit Testing)
 *      بدون أي اعتمادية على واجهات المتصفح
 *
 *   ٢. SyncFeedbackAdapter:
 *      المحول الميداني المركزي الذي يعالج تقرير الخادم
 *      داخل Dexie Transaction ذري يضمن:
 *      - إما نجاح كامل لجميع التعديلات الميدانية (Commit)
 *      - أو إلغاء كامل تلقائي عند أي فشل (Rollback)
 *      - عدم حدوث Auto-Commit بسبب الـ Microtask Tick
 *
 *   ٣. معالجة التعارضات:
 *      - SUCCESS/BYPASS → حذف من طابور الانتظار (استقرار)
 *      - CONFLICT → حذف من الطابور + تطبيق سيادة الخادم (Atomic Put)
 *      - FAILED → تحديث حالة السجل المحلي للإعادة
 *
 * ⚠️ حماية الـ Critical Path:
 *    الـ Transaction لا يحتوي إلا على عمليات الكتابة المحضة
 *    لتقليص نافذة الـ Auto-Commit لأقصى حد ممكن.
 *    عمليات الـ console.warn والـ Side Effects تقع خارجه.
 * ═══════════════════════════════════════════════════════════════════════
 */

import Dexie from 'dexie';
import type { BatchReconciliationReport, SingleEventResult } from '@/actions/sync/reconcile-action';

// ═══════════════════════════════════════════════════════════════════════
// 📐 عقود TypeScript — أنواع حالة الـ UI الموحدة
// ═══════════════════════════════════════════════════════════════════════

/** عقد يمثل حالة الـ UI الموحدة والثابتة (Snapshot-friendly) */
export interface SyncUIState {
  /** هل المزامنة جارية حالياً؟ */
  isSyncing: boolean;
  /** توقيت آخر مزامنة ناجحة */
  lastSyncTime: Date | null;
  /** عدادات تجميعية من آخر تقرير خادم */
  summary: {
    succeeded: number;
    bypassed: number;
    conflicts: number;
    failed: number;
  };
  /** الحالة العامة للنظام */
  globalStatus: 'IDLE' | 'SYNCING' | 'SUCCESS_WITH_CONFLICTS' | 'COMPLETED' | 'CRITICAL_ERROR';
}

/** واجهة تمثل كائنات طابور الانتظار المحلي الميداني — مطابقة لـ SovereignSyncQueueRecord */
interface LocalSyncQueueItem {
  eventId: string;
  status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED' | 'RETRYABLE';
  retries: number;
  lastError?: string;
}

/** واجهة قرار التعارض — البيانات اللازمة لحسم التعارض محلياً */
interface ConflictResolution {
  eventId: string;
  serverVersion: Record<string, unknown>;
  targetTable: 'scenarios' | 'projects';
}

/** واجهة حدث الفشل — البيانات اللازمة لإعادة المحاولة */
interface FailedEvent {
  eventId: string;
  error: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 🧮 الدالة النقية (Pure Function): فصل قرار المعالجة
// ═══════════════════════════════════════════════════════════════════════

/**
 * calculateSyncResolution — فصل قرار المعالجة وحساب الخطوات التالية
 *
 * مصممة لتكون معزولة تماماً وسهلة الاختبار (Unit Testing) بدون أي
 * اعتمادية على واجهات المتصفح. تحوّل نتائج الخادم إلى خطوات
 * ميدانية محددة يمكن تنفيذها ذرياً داخل Dexie Transaction.
 *
 * @param results - مصفوفة نتائج معالجة الأحداث من الخادم
 * @returns كائن يحتوي على ثلاث مصفوفات:
 *   - idsToDelete: معرفات الأحداث المستقرة (حذف من الطابور)
 *   - conflictsToResolve: تعارضات تحتاج تطبيق سيادة الخادم
 *   - eventsToRetry: أحداث فاشلة تحتاج إعادة محاولة
 */
export function calculateSyncResolution(results: SingleEventResult[]) {
  const idsToDelete: string[] = [];
  const conflictsToResolve: ConflictResolution[] = [];
  const eventsToRetry: FailedEvent[] = [];

  for (const res of results) {
    switch (res.status) {
      case 'SUCCESS':
      case 'BYPASS':
        // الحدث استقر بنجاح أو تم تجاوزه (معالجة مسبقة)
        // يحذف من طابور الانتظار الميداني
        idsToDelete.push(res.eventId);
        break;

      case 'CONFLICT':
        // في حال التعارض: يتم إزالة الحدث من الطابور لأنه حُسم،
        // وتوجيه البيانات إلى الجدول الصحيح لتطبيق سيادة الخادم
        idsToDelete.push(res.eventId);
        if (res.serverVersion) {
          // تمييز الجدول المستهدف بناءً على بنية الكائن القادم من الخادم
          const serverData = res.serverVersion as Record<string, unknown>;
          const targetTable = serverData.projectId ? 'scenarios' : 'projects';
          conflictsToResolve.push({
            eventId: res.eventId,
            serverVersion: serverData,
            targetTable,
          });
        }
        break;

      case 'FAILED':
        // الحدث فشل — يحتاج إعادة محاولة لاحقاً
        eventsToRetry.push({
          eventId: res.eventId,
          error: res.error || 'Server processing failed',
        });
        break;
    }
  }

  return { idsToDelete, conflictsToResolve, eventsToRetry };
}

// ═══════════════════════════════════════════════════════════════════════
// 🔌 المحول الميداني المركزي — SyncFeedbackAdapter
// ═══════════════════════════════════════════════════════════════════════

/**
 * SyncFeedbackAdapter — المحول الميداني المركزي
 *
 * يعتمد بالكامل على Dexie Transactions لضمان الذرية المطلقة
 * ومنع الـ Microtask Tick Race.
 *
 * الدورة الحياتية:
 * ──────────────────
 *   ١. الخادم يُرجع BatchReconciliationReport
 *   ٢. calculateSyncResolution تحسب الخطوات فوراً (دالة نقية)
 *   ٣. Dexie Transaction ذري ينفذ الخطوات الثلاث:
 *      أ. حذف الأحداث المستقرة (SUCCESS/BYPASS)
 *      ب. تطبيق سيادة الخادم على التعارضات (CONFLICT → Atomic Put)
 *      ج. تحديث حالة الأحداث الفاشلة (FAILED → RETRYABLE)
 *   ٤. تحديث الـ UI Store فقط بعد نجاح الـ Commit التام
 *
 * ⚠️ أي فشل داخل الـ Transaction يؤدي لـ Rollback تلقائي كامل
 *    دون الحاجة لاستدعاء abort يدوي — ميزة جوهرية لـ Dexie.
 */
export class SyncFeedbackAdapter {
  private db: Dexie;

  /**
   * استقبال نفس نسخة الـ Dexie Database المعرفة مسبقاً في المشروع
   * لتوحيد السياق وضمان العمل على نفس قاعدة البيانات المحلية.
   *
   * @param localDbInstance - نسخة SovereignLocalDB (أو أي Dexie متوافق)
   */
  constructor(localDbInstance: Dexie) {
    this.db = localDbInstance;
  }

  /**
   * المعالجة الذرية لتقرير الخادم داخل Dexie Transaction
   *
   * التدفق الحاكم:
   *   ١. تحديث أولي سريع للإشارة إلى بدء التطبيق الميداني
   *   ٢. حساب الخطوات عبر الدالة النقية قبل الدخول في سياق قاعدة البيانات
   *   ٣. فتح معاملة ذرية على الأنماط الصارمة لـ Dexie
   *   ٤. تنفيذ الخطوات الثلاث بالترتيب داخل الـ Transaction
   *   ٥. تحديث الـ UI Store فقط بعد نجاح الـ Commit التام
   *
   * @param report - تقرير التسوية من الخادم
   * @param updateUIStore - دالة تحديث مخزن الواجهة (تُستدعى خارج الـ Transaction)
   */
  async processServerReport(
    report: BatchReconciliationReport,
    updateUIStore: (state: Partial<SyncUIState>) => void
  ): Promise<void> {

    // تحديث أولي سريع خارج الـ Transaction للإشارة إلى بدء التطبيق الميداني
    updateUIStore({ isSyncing: true, globalStatus: 'SYNCING' });

    // حساب الخطوات فوراً عبر الدالة النقية قبل الدخول في سياق قاعدة البيانات
    // هذا يقلل وقت الـ Transaction ويمنع الـ Auto-Commit
    const { idsToDelete, conflictsToResolve, eventsToRetry } = calculateSyncResolution(report.results);

    try {
      // ─── فتح المعاملة الذرية عبر الأنماط الصارمة لـ Dexie ───
      // فقط الجداول المعنية بالعملية تُقفل
      await this.db.transaction(
        'rw',
        [this.db.table('syncQueue'), this.db.table('scenarios'), this.db.table('projects')],
        async () => {
          const syncQueueTable = this.db.table('syncQueue');
          const scenarioTable = this.db.table('scenarios');
          const projectTable = this.db.table('projects');

          // ─── أ: تنظيف العمليات المستقرة والحجوزات المحسومة ───
          if (idsToDelete.length > 0) {
            await syncQueueTable
              .where('eventId')
              .anyOf(idsToDelete)
              .delete();
          }

          // ─── ب: تطبيق سيادة الخادم وحسم التعارضات الهندسية (Atomic Put) ───
          for (const conflict of conflictsToResolve) {
            if (conflict.targetTable === 'scenarios') {
              await scenarioTable.put(conflict.serverVersion);
            } else if (conflict.targetTable === 'projects') {
              await projectTable.put(conflict.serverVersion);
            }
          }

          // ─── ج: معالجة الحركات الفاشلة والقابلة للإعادة ───
          // دون إخراجها من الطابور — تحديث الحالة فقط
          for (const retry of eventsToRetry) {
            const localEvent = await syncQueueTable
              .where('eventId')
              .equals(retry.eventId)
              .first() as LocalSyncQueueItem | undefined;

            if (localEvent) {
              await syncQueueTable.update(localEvent, {
                status: 'RETRYABLE',
                lastError: retry.error,
              });
            }
          }
        }
      );

      // ─── ٣. التحديث النهائي للـ UI Store ───
      // يتم *فقط* بعد نجاح الـ Commit التام للمعاملة
      const hasConflicts = report.summaryCounters.conflicts > 0;
      const hasFailures = report.summaryCounters.failed > 0;

      let finalStatus: SyncUIState['globalStatus'] = 'COMPLETED';
      if (hasFailures) finalStatus = 'CRITICAL_ERROR';
      else if (hasConflicts) finalStatus = 'SUCCESS_WITH_CONFLICTS';

      updateUIStore({
        isSyncing: false,
        lastSyncTime: new Date(),
        summary: {
          succeeded: report.summaryCounters.succeeded,
          bypassed: report.summaryCounters.bypassed,
          conflicts: report.summaryCounters.conflicts,
          failed: report.summaryCounters.failed,
        },
        globalStatus: finalStatus,
      });

      // تحذيرات التعارضات — خارج الـ Critical Path
      if (conflictsToResolve.length > 0) {
        console.warn(
          `[SyncFeedbackAdapter] ⚖️ تم حسم ${conflictsToResolve.length} تعارض` +
          ` واعتماد نسخة الخادم كمرجع حوكمي.`
        );
      }

      console.info(
        `[SyncFeedbackAdapter] تم الالتزام بالمعاملة الميدانية بنجاح` +
        ` (${idsToDelete.length} محذوف، ${conflictsToResolve.length} تعارض، ${eventsToRetry.length} إعادة).`
      );

    } catch (error) {
      // أي فشل هنا يقوم Dexie بعمل Rollback تلقائي وكامل
      // لكافة الجداول دون تدخل يدوي
      console.error(
        '[SyncFeedbackAdapter] فشل حرج داخل Dexie Transaction.' +
        ' تم إلغاء كافة التعديلات الميدانية تلقائياً:',
        error
      );

      updateUIStore({
        isSyncing: false,
        globalStatus: 'CRITICAL_ERROR',
      });

      // إعادة رمي الخطأ للطبقات الأعلى للتسجيل أو معالجته تشغيلياً
      throw error;
    }
  }
}
