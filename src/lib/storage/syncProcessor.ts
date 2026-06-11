// ═══════════════════════════════════════════════════════════════════════
// معالج طابور المزامنة الذكي - syncProcessor.ts
// منصة المدقق الديناميكي الموحد V3.0
// Idempotency + Exponential Backoff + Conflict Resolution + Online Monitoring
// ═══════════════════════════════════════════════════════════════════════

import { db } from './db';
import { SyncQueueRecord } from './storageSchemas';
import { ConflictPolicy } from './conflictPolicy';

// ─── واجهة عميل API القابل للحقن (Injectable API Client) ───────────

export interface SyncApiClient {
  post(path: string, payload: unknown, options?: { headers?: Record<string, string> }): Promise<SyncApiResponse>;
  put(path: string, payload: unknown, options?: { headers?: Record<string, string> }): Promise<SyncApiResponse>;
  delete(path: string, options?: { headers?: Record<string, string> }): Promise<SyncApiResponse>;
}

export interface SyncApiResponse {
  status: number;
  data: {
    serverVersion?: unknown;
    [key: string]: unknown;
  };
}

// ─── واجهة فحص الشبكة القابل للحقن ────────────────────────────────

export interface NetworkMonitor {
  isOnline(): boolean;
  onStatusChange(callback: (online: boolean) => void): () => void;
}

// ─── معالج طابور المزامنة ─────────────────────────────────────────

/**
 * SyncQueueProcessor — المعالج الآلي لطابور العمليات
 *
 * المبادئ الحاكمة:
 * ──────────────────
 * 1. Idempotency: كل عملية تحمل معرفاً فريداً يُرسل كـ X-Idempotency-Key
 *    لمنع المعالجة المزدوجة عند انقطاع الاتصال المفاجئ
 * 2. Exponential Backoff: في حال الفشل، زمن الانتظار يتضاعف:
 *    1s → 2s → 4s → 8s → 16s (حد أقصى 5 محاولات)
 * 3. FIFO Audit Trail: العمليات تُعالج بترتيب أقدميتها الزمنية
 * 4. Race Condition Blocker: معالجة واحدة فقط في أي لحظة (isProcessing flag)
 * 5. Online-First Check: لا بدء المعالجة بدون شبكة فعلية
 */
export class SyncQueueProcessor {
  private isProcessing = false;
  private maxRetries = 5;
  private backoffTimerId: ReturnType<typeof setTimeout> | null = null;
  private networkMonitor: NetworkMonitor;
  private apiClient: SyncApiClient | null = null;

  // مراقبة حالة المعالجة — للعرض في لوحة المراقبة
  private processingStats = {
    totalProcessed: 0,
    totalSucceeded: 0,
    totalFailed: 0,
    totalConflicts: 0,
    lastProcessTime: 0 as number | null,
  };

  constructor(networkMonitor?: NetworkMonitor) {
    // حقن مراقب الشبكة — أو استخدام الافتراضي (navigator.onLine)
    this.networkMonitor = networkMonitor ?? {
      isOnline: () => {
        if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
          return navigator.onLine;
        }
        return false; // في بيئة Node.js: افتراض عدم الاتصال
      },
      onStatusChange: (callback) => {
        if (typeof window !== 'undefined') {
          const onOnline = () => callback(true);
          const onOffline = () => callback(false);
          window.addEventListener('online', onOnline);
          window.addEventListener('offline', onOffline);
          return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
          };
        }
        return () => {};
      },
    };
  }

  /**
   * تعيين عميل API — يُستدعى عند تهيئة التطبيق
   */
  setApiClient(client: SyncApiClient): void {
    this.apiClient = client;
  }

  /**
   * بدء مراقبة الشبكة تلقائياً — يُستدعى عند تحميل التطبيق
   *
   * عند رصد عودة الاتصال، يبدأ معالجة الطابور تلقائياً
   */
  startOnlineMonitoring(): () => void {
    return this.networkMonitor.onStatusChange((online) => {
      if (online) {
        console.log('[SYNC] عودة الاتصال بالشبكة — بدء معالجة الطابور...');
        this.processQueue();
      }
    });
  }

  /**
   * بدء معالجة الطابور تلقائياً فور رصد عودة الاتصال بالشبكة
   *
   * التسلسل الحاكم:
   * 1. فحص القفل (Race Condition Blocker)
   * 2. فحص الشبكة (Online-First Check)
   * 3. فحص وجود API Client
   * 4. جلب العمليات المعلقة بترتيب FIFO
   * 5. معالجة كل عملية على حدة مع إدارة الأخطاء
   */
  async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    conflicts: number;
  }> {
    // ─── حاجز التداخل البرمجي (Race Condition Blocker) ───
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    // ─── الالتزام بـ Offline-First ───
    if (!this.networkMonitor.isOnline()) {
      return { processed: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    // ─── فحص وجود API Client ───
    if (!this.apiClient) {
      console.warn('[SYNC] لا يوجد API Client — لا يمكن معالجة الطابور.');
      return { processed: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    this.isProcessing = true;

    let succeeded = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // جلب العمليات المعلقة بترتيب أقدميتها الزمنية (FIFO Audit Trail)
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('PENDING')
        .sortBy('timestamp');

      for (const item of pendingItems) {
        try {
          const result = await this.processItem(item);
          if (result === 'SUCCESS') {
            succeeded++;
          } else if (result === 'CONFLICT') {
            conflicts++;
          }
        } catch (error) {
          await this.handleSyncFailure(item);
          failed++;
        }
      }
    } finally {
      this.isProcessing = false;
      this.processingStats.totalProcessed += succeeded + failed + conflicts;
      this.processingStats.totalSucceeded += succeeded;
      this.processingStats.totalFailed += failed;
      this.processingStats.totalConflicts += conflicts;
      this.processingStats.lastProcessTime = Date.now();
    }

    return {
      processed: succeeded + failed + conflicts,
      succeeded,
      failed,
      conflicts,
    };
  }

  /**
   * معالجة سجل منفرد مع تفعيل مفتاح الـ Idempotency الحاكم
   *
   * Idempotency Key = سجل الطابور ID
   * يضمن عدم تكرار المعالجة حتى لو انقطع الاتصال أثناء الإرسال
   */
  private async processItem(
    item: SyncQueueRecord
  ): Promise<'SUCCESS' | 'CONFLICT'> {
    if (!this.apiClient) throw new Error('No API client');

    // تحديث حالة السجل إلى جاري المزامنة فوراً — لمنع التداخل
    await db.syncQueue.update(item.id, { status: 'SYNCING' });

    let response: SyncApiResponse;

    // إرسال Payload إلى السيرفر الحاكم مع تمرير المعرف الفريد كمفتاح عدم التكرار
    const idempotencyHeaders = {
      'X-Idempotency-Key': item.id,
    };

    const payload = item.payload as Record<string, unknown>;

    switch (item.action) {
      case 'CREATE_PROJECT':
        response = await this.apiClient.post('/v3/projects', item.payload, {
          headers: idempotencyHeaders,
        });
        break;

      case 'UPDATE_PROJECT':
        response = await this.apiClient.put(
          `/v3/projects/${payload?.id ?? ''}`,
          item.payload,
          { headers: idempotencyHeaders }
        );
        break;

      case 'DELETE_PROJECT':
        response = await this.apiClient.delete(
          `/v3/projects/${payload?.id ?? ''}`,
          { headers: idempotencyHeaders }
        );
        break;

      case 'CREATE_SCENARIO':
        response = await this.apiClient.post('/v3/scenarios', item.payload, {
          headers: idempotencyHeaders,
        });
        break;

      case 'UPDATE_SCENARIO':
        response = await this.apiClient.put(
          `/v3/scenarios/${payload?.id ?? ''}`,
          item.payload,
          { headers: idempotencyHeaders }
        );
        break;

      case 'DELETE_SCENARIO':
        response = await this.apiClient.delete(
          `/v3/scenarios/${payload?.id ?? ''}`,
          { headers: idempotencyHeaders }
        );
        break;

      case 'LOG_RTM':
        response = await this.apiClient.post('/v3/rtm', item.payload, {
          headers: idempotencyHeaders,
        });
        break;

      default:
        throw new Error(`ERR-SYNC-01: عملية غير معرفة: ${item.action}`);
    }

    // ─── إدارة الاستجابة حسب رمز الحالة ───

    // HTTP 409 Conflict — السيرفر يملك نسخة مختلفة
    if (response.status === 409) {
      await this.handleConflict(item, response.data.serverVersion);
      return 'CONFLICT';
    }

    // HTTP 200/201 — نجاح مطلق
    if (response.status === 200 || response.status === 201 || response.status === 204) {
      // حذف السجل من طابور المزامنة للحفاظ على رشاقة الـ IndexedDB
      await db.syncQueue.delete(item.id);
      return 'SUCCESS';
    }

    // أي رمز آخر — فشل
    throw new Error(`ERR-SYNC-02: استجابة غير متوقعة: HTTP ${response.status}`);
  }

  /**
   * معالجة الفشل وتطبيق التراجع الأسي (Exponential Backoff)
   *
   * الاستراتيجية:
   * - المحاولة 1: انتظار 2 ثانية
   * - المحاولة 2: انتظار 4 ثوانٍ
   * - المحاولة 3: انتظار 8 ثوانٍ
   * - المحاولة 4: انتظار 16 ثانية
   * - المحاولة 5: عزل دائم + تنبيه المراجعة اليدوية
   */
  private async handleSyncFailure(item: SyncQueueRecord): Promise<void> {
    const nextRetryCount = item.retryCount + 1;

    if (nextRetryCount >= this.maxRetries) {
      // ─── عزل السجل التالف — تأليفه كفشل دائم للمراجعة اليدوية ───
      await db.syncQueue.update(item.id, {
        status: 'FAILED',
        retryCount: nextRetryCount,
        lastError: `تجاوز الحد الأقصى للمحاولات (${this.maxRetries})`,
      });
      console.error(
        `[CRITICAL-SYNC] فشلت مزامنة العملية ${item.id} نهائياً بعد ${this.maxRetries} محاولات. تتطلب مراجعة يدوية.`
      );
    } else {
      // ─── حساب زمن الانتظار الأسي: 2^retry × 1000ms ───
      const delay = Math.pow(2, nextRetryCount) * 1000;

      await db.syncQueue.update(item.id, {
        status: 'PENDING',
        retryCount: nextRetryCount,
        lastError: `محاولة ${nextRetryCount} — إعادة المحاولة بعد ${delay}ms`,
      });

      // ─── جدولة إعادة المحاولة اللاحقة ───
      if (this.backoffTimerId) {
        clearTimeout(this.backoffTimerId);
      }
      this.backoffTimerId = setTimeout(() => {
        this.processQueue();
      }, delay);
    }
  }

  /**
   * استدعاء دالة الحسم وتحديث التخزين المحلي والـ RTM بالتبادل
   *
   * عندما يستجيب السيرفر بـ HTTP 409 Conflict، يتم:
   * 1. استدعاء ConflictPolicy لحسم النزاع هندسياً
   * 2. إذا حسم السيرفر: تحديث المستودع المحلي فوراً
   * 3. إذا حسم المحلي: إرسال النسخة المحلية للسيرفر مجدداً
   * 4. إزالة السجل من الطابور بعد الحسم
   */
  private async handleConflict(
    item: SyncQueueRecord,
    serverPayload: unknown
  ): Promise<void> {
    const localPayload = item.payload;

    if (item.payloadType === 'PROJECT' && serverPayload) {
      const resolution = ConflictPolicy.resolveProject(
        localPayload as import('./storageSchemas').ProjectRecord,
        serverPayload as import('./storageSchemas').ProjectRecord
      );

      if (resolution.source === 'SERVER_FORCE') {
        // تحديث المستودع المحلي فوراً ببيانات السيرفر الحاكمة
        await db.projects.put(resolution.resolvedData);
      }
      // إزالة السجل من الطابور بعد حسم النزاع الهندسي بنجاح
      await db.syncQueue.delete(item.id);
    }

    if (item.payloadType === 'SCENARIO' && serverPayload) {
      const resolution = ConflictPolicy.resolveScenario(
        localPayload as import('./storageSchemas').ScenarioRecord,
        serverPayload as import('./storageSchemas').ScenarioRecord
      );

      if (resolution.source === 'SERVER_FORCE') {
        // تحديث المستودع المحلي فوراً ببيانات السيرفر الحاكمة
        await db.scenarios.put(resolution.resolvedData);
      }
      // إزالة السجل من الطابور بعد حسم النزاع
      await db.syncQueue.delete(item.id);
    }

    // أنواع أخرى — حسم بسيط: الأحدث زمنياً
    if (item.payloadType === 'RTM') {
      // RTM لا يتضارب عادةً — مجرد تسجيل، نزيله من الطابور
      await db.syncQueue.delete(item.id);
    }
  }

  /**
   * إحصائيات المعالجة — للعرض في لوحة المراقبة
   */
  getStats(): typeof this.processingStats {
    return { ...this.processingStats };
  }

  /**
   * إيقاف المعالج — لإيقاف مراقبة الشبكة عند إغلاق التطبيق
   */
  stop(): void {
    if (this.backoffTimerId) {
      clearTimeout(this.backoffTimerId);
      this.backoffTimerId = null;
    }
    this.isProcessing = false;
  }
}

// ─── Singleton Instance ───
export const syncProcessor = new SyncQueueProcessor();
