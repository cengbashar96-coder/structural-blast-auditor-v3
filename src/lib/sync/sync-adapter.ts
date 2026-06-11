/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⚖️ واجهة المزامنة وعقد التبادل وعقد التعارضات — Sync Adapter
 * ═══════════════════════════════════════════════════════════════════════
 *
 * واجهة برمجية صارمة (SyncAdapter Interface) تعرّف الدوال بنمط
 * قاطع لـ TypeScript، مع وجوب عمل (export) لجميع أنواع البيانات
 * والواجهات (Types & Interfaces) من هذا الملف لتسهيل اختبارها
 * وإعادة استخدامها.
 *
 * تتضمن:
 *   ١. SyncEvent — هيكل حدث المزامنة
 *   ٢. SyncAdapter — واجهة المزامنة الصارمة مع 3 دوال:
 *      - enqueueBatch(events): إضافة دفعة أحداث للطابور
 *      - flushPending(): مزامنة جميع العمليات المعلقة
 *      - markFailed(contextId, error): تسجيل فشل العملية
 *   ٣. ConflictResolutionPolicy — هيكل سياسة معالجة التعارضات
 *      يتيح التبديل برمجياً بين:
 *      - LAST_WRITE_WINS: التوقيت الميداني الأحدث
 *      - SERVER_AUTHORITATIVE: السيادة لخط أساس الخادم
 *   ٤. SovereignSyncAdapter — تنفيذ أولي كامل للواجهة
 *
 * ⚠️ تجهيز الواجهات لاستيعاب المزامنة عبر Adapter Interface
 *    دون ربط مباشر مع BullMQ أو Redis حالياً.
 *    التنفيذ الحالي يُوفّر الواجهة الصحيحة مع تخزين محلي،
 *    ويُعِدّ للترقية إلى نظام مزامنة حقيقي عند الحاجة.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { sovereignDB, computePayloadHash } from '@/lib/db/sovereign-local-db';
import { generateSovereignId } from '@/lib/id-utility';

// ═══════════════════════════════════════════════════════════════════════
// 📐 عقود TypeScript — أنواع بيانات المزامنة
// ═══════════════════════════════════════════════════════════════════════

/** أنواع عمليات المزامنة المدعومة */
export type SyncActionType =
  | 'CREATE_PROJECT'
  | 'UPDATE_PROJECT'
  | 'DELETE_PROJECT'
  | 'CREATE_SCENARIO'
  | 'UPDATE_SCENARIO'
  | 'DELETE_SCENARIO'
  | 'LOG_RTM'
  | 'BASELINE_LOCK'
  | 'BASELINE_UNLOCK';

/** هيكل حدث المزامنة — الوحدة الأساسية للتبادل */
export interface SyncEvent {
  /** معرف السياق التنفيذي (نمط CTX) */
  contextId: string;
  /** معرف الحدث التدقيقي (نمط EVT) */
  eventId: string;
  /** نوع العملية */
  action: SyncActionType;
  /** بيانات العملية — الحمولة المراد مزامنتها */
  payload: Record<string, unknown>;
}

/** نتيجة عملية المزامنة */
export interface SyncResult {
  /** هل نجحت العملية؟ */
  success: boolean;
  /** معرف السياق التنفيذي */
  contextId: string;
  /** عدد العمليات المعالجة */
  processedCount: number;
  /** عدد العمليات الناجحة */
  succeededCount: number;
  /** عدد العمليات الفاشلة */
  failedCount: number;
  /** رسالة خطأ اختيارية */
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// ⚖️ سياسة معالجة التعارضات — Conflict Resolution Policy
// ═══════════════════════════════════════════════════════════════════════

/**
 * استراتيجية حسم التعارضات
 *
 * تتيح التبديل برمجياً بين استراتيجيتين متناقضتين:
 *
 *   LAST_WRITE_WINS — التوقيت الميداني الأحدث يربح
 *     مناسب للمهندسين في الميدان الذين يعملون بلا اتصال
 *     ويريدون أحدث تعديلاتهم المحلية أن تسود.
 *
 *   SERVER_AUTHORITATIVE — السيادة لخط أساس الخادم
 *     مناسب للعمليات الحوكمية حيث يكون خط الأساس المقفل
 *     على الخادم هو المرجع المطلق (مثل الثوابت المرجعية).
 */
export type ConflictResolutionStrategy =
  | 'LAST_WRITE_WINS'
  | 'SERVER_AUTHORITATIVE';

/**
 * سياسة معالجة التعارضات — هيكل قابل للتبديل البرمجي
 *
 * يُحدد الاستراتيجية والمعاملات المرتبطة بها.
 * يمكن تبديل الاستراتيجية في وقت التشغيل (Runtime) حسب
 * نوع البيانات أو السياق الهندسي.
 */
export interface ConflictResolutionPolicy {
  /** الاستراتيجية الحالية لحسم التعارضات */
  strategy: ConflictResolutionStrategy;

  /** الحد الأقصى لعدد محاولات الإعادة قبل الإعلان عن فشل دائم */
  maxRetries: number;

  /** زمن الانتظار الأساسي للتراجع الأسي (بالميلي ثانية) */
  baseBackoffMs: number;

  /**
   * حسم تعارض بين نسخة محلية ونسخة خادم
   *
   * @param localTimestamp - تابع تعديل النسخة المحلية
   * @param serverTimestamp - تابع تعديل نسخة الخادم
   * @returns 'local' إذا يجب اعتماد النسخة المحلية، 'server' للخادم
   */
  resolve(localTimestamp: number, serverTimestamp: number): 'local' | 'server';
}

/**
 * إنشاء سياسة حسم تعارضات — Factory Function
 *
 * @param strategy - الاستراتيجية المطلوبة
 * @param options - معاملات إضافية (اختيارية)
 * @returns سياسة حسم تعارضات جاهزة للاستخدام
 */
export function createConflictPolicy(
  strategy: ConflictResolutionStrategy = 'LAST_WRITE_WINS',
  options?: {
    maxRetries?: number;
    baseBackoffMs?: number;
  }
): ConflictResolutionPolicy {
  return {
    strategy,
    maxRetries: options?.maxRetries ?? 5,
    baseBackoffMs: options?.baseBackoffMs ?? 1000,

    resolve(localTimestamp: number, serverTimestamp: number): 'local' | 'server' {
      switch (strategy) {
        case 'LAST_WRITE_WINS':
          // التوقيت الميداني الأحدث يربح — المحلي إذا كان أحدث
          return localTimestamp >= serverTimestamp ? 'local' : 'server';

        case 'SERVER_AUTHORITATIVE':
          // السيادة لخط أساس الخادم — الخادم دائماً
          return 'server';

        default:
          // احتياطي — الأحدث زمنياً
          return localTimestamp >= serverTimestamp ? 'local' : 'server';
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 🔌 واجهة المزامنة الصارمة — SyncAdapter Interface
// ═══════════════════════════════════════════════════════════════════════

/**
 * SyncAdapter — واجهة برمجية صارمة للمزامنة
 *
 * تعرّف الدوال الأساسية بنمط قاطع لـ TypeScript.
 * جميع أنواع البيانات والواجهات يتم تصديرها (export) لتسهيل
 * اختبارها وإعادة استخدامها دون ربط مباشر مع أي نظام طوابير.
 *
 * ⚠️ تجهيز الواجهات لاستيعاب المزامنة عبر Adapter Interface
 *    دون ربط مباشر مع BullMQ أو Redis حالياً.
 *
 * الترقية المستقبلية:
 * ─────────────────────
 * عند توفر نظام طوابير حقيقي (BullMQ/Redis)، يُستبدل التنفيذ
 * الداخلي فقط — الواجهة تبقى كما هي:
 *
 *   enqueueBatch → يُرسل الأحداث إلى Redis بدلاً من IndexedDB
 *   flushPending → يعالج الطابور من Redis بدلاً من IndexedDB
 *   markFailed   → يُحدّث حالة السجل في Redis بدلاً من IndexedDB
 */
export interface SyncAdapter {
  /**
   * إضافة دفعة أحداث إلى طابور المزامنة
   *
   * يستقبل مصفوفة من SyncEvent ويُضيفها للطابور مع:
   *   - حساب بصمة SHA-256 لكل حمولة (Idempotency Guard)
   *   - التحقق من التكرار (منع الإرسال المزدوج)
   *   - تعيين حالة PENDING لكل سجل جديد
   *
   * @param events - مصفوفة أحداث المزامنة
   * @throws Error إذا فشلت عملية الكتابة في الطابور
   */
  enqueueBatch(events: SyncEvent[]): Promise<void>;

  /**
   * مزامنة جميع العمليات المعلقة
   *
   * يعالج جميع السجلات بحالة PENDING بالترتيب الزمني (FIFO):
   *   - يحوّل حالة كل سجل إلى SYNCING
   *   - يحاول إرسال البيانات إلى الخادم
   *   - عند النجاح: يحوّل إلى COMPLETED أو يحذف
   *   - عند الفشل: يزيد عداد المحاولات ويُعيد لـ PENDING
   *   - عند تجاوز الحد: يحوّل إلى FAILED
   *
   * ⚠️ التنفيذ الحالي يحاكي الإرسال — في الإنتاج يُستبدل
   *    باتصال حقيقي بالخادم عبر API Client قابل للحقن.
   *
   * @returns نتيجة عملية المزامنة
   */
  flushPending(): Promise<SyncResult>;

  /**
   * تسجيل فشل عملية مزامنة
   *
   * يُحدّث حالة السجل المرتبط بالسياق المحدد إلى FAILED
   * مع تسجيل رسالة الخطأ.
   *
   * @param contextId - معرف السياق التنفيذي للعملية الفاشلة
   * @param error - رسالة الخطأ
   */
  markFailed(contextId: string, error: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// ⚡ التنفيذ الأولي السيادي — SovereignSyncAdapter
// ═══════════════════════════════════════════════════════════════════════

/**
 * SovereignSyncAdapter — التنفيذ الأولي الكامل لواجهة SyncAdapter
 *
 * يستخدم SovereignLocalDB (Dexie/IndexedDB) كطابور محلي،
 * ويُوفّر جميع الدوال المطلوبة بالواجهة.
 *
 * ⚠️ هذا التنفيذ لا يتصل بخادم فعلي — يُحاكي عملية المزامنة.
 *    عند توفر API حقيقي، يُحقن عبر setApiClient().
 *    الواجهة (SyncAdapter) لن تتغير — فقط التنفيذ الداخلي.
 */
export class SovereignSyncAdapter implements SyncAdapter {
  private conflictPolicy: ConflictResolutionPolicy;

  constructor(conflictPolicy?: ConflictResolutionPolicy) {
    this.conflictPolicy = conflictPolicy ?? createConflictPolicy('LAST_WRITE_WINS');
  }

  /**
   * إضافة دفعة أحداث إلى طابور المزامنة
   *
   * التدفق:
   *   ١. التحقق من صحة كل حدث
   *   ٢. حساب بصمة SHA-256 لكل حمولة
   *   ٣. التحقق من التكرار عبر البصمة
   *   ٤. إدراج السجلات الجديدة في طابور المزامنة
   */
  async enqueueBatch(events: SyncEvent[]): Promise<void> {
    if (events.length === 0) return;

    await sovereignDB.transaction('rw', sovereignDB.syncQueue, async () => {
      for (const event of events) {
        // ١. حساب بصمة SHA-256
        const payloadHash = await computePayloadHash(event.payload);

        // ٢. التحقق من التكرار — منع الإرسال المزدوج (Idempotency)
        const isDuplicate = await sovereignDB.isDuplicatePayload(payloadHash);
        if (isDuplicate) {
          console.warn(
            `[SyncAdapter] ⚠️ حدث مكرر — تجاهل ${event.action} ` +
            `(hash: ${payloadHash.slice(0, 12)}...)`
          );
          continue;
        }

        // ٣. إدراج في طابور المزامنة
        await sovereignDB.syncQueue.add({
          contextId: event.contextId,
          eventId: event.eventId,
          action: event.action,
          payload: event.payload,
          payloadHash,
          status: 'PENDING',
          retries: 0,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * مزامنة جميع العمليات المعلقة
   *
   * ⚠️ التنفيذ الانتقالي الحالي:
   *    - يحوّل السجلات PENDING → SYNCING → COMPLETED
   *    - لا يتصل بخادم فعلي (لا يوجد API Client بعد)
   *    - يُحاكي النجاح لتجربة تدفق البيانات
   *
   *    عند توفر خادم:
   *    - يُستبدل النجاح المحاكى بـ API POST/PUT/DELETE حقيقي
   *    - تُطبّق سياسة التعارض عند استجابة HTTP 409
   *    - يُطبّق التراجع الأسي عند فشل الشبكة
   */
  async flushPending(): Promise<SyncResult> {
    const contextId = generateSovereignId('CTX');
    let processedCount = 0;
    let succeededCount = 0;
    let failedCount = 0;

    try {
      // جلب العمليات المعلقة بترتيب زمني (FIFO)
      const pendingItems = await sovereignDB.syncQueue
        .where('status')
        .equals('PENDING')
        .sortBy('timestamp');

      if (pendingItems.length === 0) {
        return {
          success: true,
          contextId,
          processedCount: 0,
          succeededCount: 0,
          failedCount: 0,
        };
      }

      for (const item of pendingItems) {
        processedCount++;

        try {
          // تحويل إلى SYNCING
          await sovereignDB.syncQueue.update(item.id!, {
            status: 'SYNCING',
          });

          // ──────────────────────────────────────────────────────
          // 🔮 منطقة الترقية المستقبلية (Future Upgrade Zone)
          // ──────────────────────────────────────────────────────
          //
          // هنا سيتم استبدال المحاكاة بـ:
          //
          //   const response = await apiClient.post(
          //     getEndpointForAction(item.action),
          //     item.payload,
          //     { headers: { 'X-Idempotency-Key': item.payloadHash } }
          //   );
          //
          //   if (response.status === 409) {
          //     // تطبيق سياسة التعارض
          //     const resolution = this.conflictPolicy.resolve(
          //       (item.payload as any).updatedAt ?? item.timestamp,
          //       response.data.serverVersion?.updatedAt ?? 0
          //     );
          //     if (resolution === 'server') {
          //       // تحديث التخزين المحلي بنسخة الخادم
          //     }
          //   }
          //
          // ──────────────────────────────────────────────────────

          // محاكاة نجاح المزامنة — التنفيذ الانتقالي
          // في الإنتاج: يُستبدل بالاتصال الفعلي بالخادم
          await new Promise((resolve) => setTimeout(resolve, 10)); // محاكاة تأخير الشبكة

          // تحويل إلى COMPLETED
          await sovereignDB.syncQueue.update(item.id!, {
            status: 'COMPLETED',
          });

          succeededCount++;
        } catch (error) {
          // تطبيق سياسة الإعادة — التراجع الأسي
          const nextRetries = item.retries + 1;

          if (nextRetries >= this.conflictPolicy.maxRetries) {
            // تجاوز الحد — فشل دائم
            await sovereignDB.syncQueue.update(item.id!, {
              status: 'FAILED',
              retries: nextRetries,
              lastError: `تجاوز الحد الأقصى للمحاولات (${this.conflictPolicy.maxRetries})`,
            });
            failedCount++;
          } else {
            // إعادة المحاولة — تحويل إلى PENDING مع زيادة المحاولات
            const backoffDelay = Math.pow(2, nextRetries) * this.conflictPolicy.baseBackoffMs;
            await sovereignDB.syncQueue.update(item.id!, {
              status: 'PENDING',
              retries: nextRetries,
              lastError: `محاولة ${nextRetries} — إعادة بعد ${backoffDelay}ms`,
            });
            failedCount++;
          }
        }
      }

      return {
        success: failedCount === 0,
        contextId,
        processedCount,
        succeededCount,
        failedCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      return {
        success: false,
        contextId,
        processedCount,
        succeededCount,
        failedCount,
        error: message,
      };
    }
  }

  /**
   * تسجيل فشل عملية مزامنة
   *
   * يبحث عن جميع السجلات المرتبطة بالسياق المحدد
   * ويُحدّث حالتها إلى FAILED مع رسالة الخطأ.
   *
   * @param contextId - معرف السياق التنفيذي
   * @param error - رسالة الخطأ
   */
  async markFailed(contextId: string, error: string): Promise<void> {
    // البحث عن جميع السجلات المرتبطة بهذا السياق
    const records = await sovereignDB.syncQueue
      .where('contextId')
      .equals(contextId)
      .toArray();

    for (const record of records) {
      if (record.status === 'PENDING' || record.status === 'SYNCING') {
        await sovereignDB.syncQueue.update(record.id!, {
          status: 'FAILED',
          lastError: error,
          retries: record.retries + 1,
        });
      }
    }
  }

  /**
   * تحديث سياسة حسم التعارضات — التبديل البرمجي أثناء التشغيل
   *
   * @param newPolicy - السياسة الجديدة
   */
  setConflictPolicy(newPolicy: ConflictResolutionPolicy): void {
    this.conflictPolicy = newPolicy;
  }

  /**
   * الحصول على السياسة الحالية — للعرض والمراقبة
   */
  getConflictPolicy(): ConflictResolutionPolicy {
    return this.conflictPolicy;
  }
}

// ─── Singleton Instance — نقطة الدخول الوحيدة لمحوّل المزامنة ───
export const sovereignSyncAdapter = new SovereignSyncAdapter();
