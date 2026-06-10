// ═══════════════════════════════════════════════════════════════════════
// مستودع طابور المزامنة - SyncQueueRepository.ts
// منصة المدقق الديناميكي الموحد V3.0
// مراقبة حالة الشبكة — رفع البيانات المؤجلة — حل التعارضات
// ═══════════════════════════════════════════════════════════════════════

import { db } from '../db';
import {
  SyncQueueRecord,
  SyncQueueRecordSchema,
  validateBeforeWrite,
} from '../storageSchemas';

export class SyncQueueRepository {
  /**
   * جلب جميع العمليات المعلقة في الطابور
   * — مرتبة زمنياً (الأقدم أولاً — FIFO)
   */
  async getPendingItems(): Promise<SyncQueueRecord[]> {
    return await db.syncQueue
      .where('status')
      .equals('PENDING')
      .sortBy('timestamp');
  }

  /**
   * جلب جميع العمليات الفاشلة — لإعادة المحاولة أو التشخيص
   */
  async getFailedItems(): Promise<SyncQueueRecord[]> {
    return await db.syncQueue
      .where('status')
      .equals('FAILED')
      .sortBy('timestamp');
  }

  /**
   * تحديث حالة عنصر في الطابور
   * — يستخدمه SyncQueueProcessor لتتبع تقدم المزامنة
   */
  async updateStatus(
    id: string,
    status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED',
    lastError?: string
  ): Promise<void> {
    const existing = await db.syncQueue.get(id);
    if (!existing) return;

    const updates: Partial<SyncQueueRecord> = {
      status,
      lastError,
    };

    // زيادة عداد المحاولات عند الفشل
    if (status === 'FAILED') {
      updates.retryCount = existing.retryCount + 1;
    }

    await db.syncQueue.update(id, updates);
  }

  /**
   * إعادة محاولة العمليات الفاشلة التي لم تتجاوز الحد الأقصى
   * — تعيدها لحالة PENDING ليقوم SyncQueueProcessor بمعالجتها
   */
  async retryFailedItems(): Promise<number> {
    const failed = await db.syncQueue
      .where('status')
      .equals('FAILED')
      .toArray();

    let retriedCount = 0;
    for (const item of failed) {
      // التحقق من عدم تجاوز الحد الأقصى للمحاولات
      if (item.retryCount < (item.maxRetries ?? 3)) {
        await db.syncQueue.update(item.id, {
          status: 'PENDING',
          lastError: undefined,
        });
        retriedCount++;
      }
    }
    return retriedCount;
  }

  /**
   * تنظيف العمليات المكتملة — لإبقاء الطابور خفيفاً
   * يُنفذ دورياً (مثلاً كل 24 ساعة)
   */
  async cleanupCompleted(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - olderThanMs;
    const completed = await db.syncQueue
      .where('status')
      .equals('COMPLETED')
      .toArray();

    const toDelete = completed.filter((item) => item.timestamp < cutoff);
    for (const item of toDelete) {
      await db.syncQueue.delete(item.id);
    }
    return toDelete.length;
  }

  /**
   * عدد العمليات المعلقة — مؤشر صحة المزامنة
   */
  async pendingCount(): Promise<number> {
    return await db.syncQueue
      .where('status')
      .equals('PENDING')
      .count();
  }

  /**
   * عدد العمليات الفاشلة — مؤشر تنبيه
   */
  async failedCount(): Promise<number> {
    return await db.syncQueue
      .where('status')
      .equals('FAILED')
      .count();
  }

  /**
   * تقرير حالة الطابور — للعرض في لوحة المراقبة
   */
  async getQueueStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    completed: number;
    oldestPendingAge: number | null; // بالمللي ثانية
  }> {
    const [pending, syncing, failed, completed] = await Promise.all([
      db.syncQueue.where('status').equals('PENDING').count(),
      db.syncQueue.where('status').equals('SYNCING').count(),
      db.syncQueue.where('status').equals('FAILED').count(),
      db.syncQueue.where('status').equals('COMPLETED').count(),
    ]);

    // عمر أقدم عملية معلقة
    const pendingItems = await db.syncQueue
      .where('status')
      .equals('PENDING')
      .sortBy('timestamp');

    const oldestPendingAge =
      pendingItems.length > 0 ? Date.now() - pendingItems[0].timestamp : null;

    return { pending, syncing, failed, completed, oldestPendingAge };
  }

  /**
   * مسح كامل للطابور — للاستخدام في وضع التطوير فقط
   */
  async clearAll(): Promise<void> {
    await db.syncQueue.clear();
  }
}

// ─── Singleton Instance ───
export const syncQueueRepository = new SyncQueueRepository();
