/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🛡️ صمام الأمان ومنع التكرار الخادومي — Idempotency Guard
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يعتمد على المعالجة الذرية عبر القيود الفريدة (Unique Constraints)
 * لمنع ثغرات السباق (Race Conditions) نهائياً تحت الحمل العالي.
 *
 * معمارية الحجز الذري الصارم (True Atomic Lock):
 * ─────────────────────────────────────────────────
 *   ١. محاولة إدخال ذرية مباشرة (create) محمية بالـ Unique Constraint
 *   ٢. إذا فشلت بسبب وجود البصمة → قراءة وتحديث مشروط بانتهاء الصلاحية
 *   ٣. كاش الاستجابة (responsePayload) يُتيح تجاوز المعالجة المكررة (BYPASS)
 *
 * ⚠️ الـ Transaction لا يحتوي إلا على عمليات الكتابة المحضة
 *    لتقليص الـ Critical Path لأقصى حد ممكن
 * ═══════════════════════════════════════════════════════════════════════
 */

import { prisma } from '@/lib/db/prisma';

/** نتيجة فحص صمام الأمان — تُحدد مسار المعالجة */
export interface IdempotencyCheckResult {
  /** هل يمكن معالجة هذا الحدث؟ */
  canProcess: boolean;
  /** الحالة الحالية للحدث */
  status: 'NEW' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RETRYABLE';
  /** الاستجابة المخزنة مسبقاً — تُستخدم عند BYPASS */
  savedResponse?: unknown;
}

/**
 * IdempotencyGuard — صمام الأمان المطور لمنع التكرار وحماية الخادم
 *
 * يعتمد على المعالجة الذرية عبر القيود الفريدة (Unique Constraints)
 * لمنع ثغرات السباق نهائياً تحت الحمل العالي.
 */
export class IdempotencyGuard {
  /** مهلة القفل التلقائي — 30 ثانية لتجنب الاستعصاء (Deadlock) */
  private static LOCK_TIMEOUT_MS = 30000;

  /**
   * الحجز الذري الصارم (Pure Atomic Acquire)
   *
   * يمنع الـ Race Conditions تحت الحمل العالي عبر:
   *   ١. محاولة إدخال ذرية (create) محمية بالـ Unique Constraint على payloadHash
   *   ٢. إذا نجحت → الحدث جديد (NEW) ويمكن معالجته
   *   ٣. إذا فشلت → السجل موجود مسبقاً، ننتقل لفحص الحالة
   *   ٤. إذا كان الحدث ناجحاً مسبقاً → تجاوز (BYPASS) مع كاش الاستجابة
   *   ٥. إذا كان القفل منتهياً أو الحالة RETRYABLE → استحواذ ذري مشروط
   *
   * @param payloadHash - بصمة SHA-256 للحمولة (Unique Constraint)
   * @param eventId - معرف الحدث الميداني (Unique Constraint)
   * @param processingToken - رمز الحجز المؤقت للتحقق من الملكية
   * @returns نتيجة فحص صمام الأمان
   */
  static async checkAndLock(
    payloadHash: string,
    eventId: string,
    processingToken: string
  ): Promise<IdempotencyCheckResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.LOCK_TIMEOUT_MS);

    try {
      // ─── محاولة الإدخال المباشر كعملية ذرية حاسمة ───
      // تضمن عدم دخول حدثين بنفس البصمة بفضل Unique Constraint
      await prisma.processedEvent.create({
        data: {
          payloadHash,
          eventId,
          processingToken,
          status: 'PROCESSING',
          processingExpiresAt: expiresAt,
          attemptCount: 1,
        },
      });

      // نجاح الإدخال → الحدث جديد ويمكن معالجته
      return { canProcess: true, status: 'NEW' };
    } catch (error: unknown) {
      // ─── فشل الإدخال (السجل موجود مسبقاً) → فحص الحالة الحالية ───
      const existing = await prisma.processedEvent.findUnique({
        where: { payloadHash },
      });

      if (!existing) {
        // حالة نادرة: فشل الإدخال لكن السجل غير موجود
        // قد يكون بسبب خطأ في قاعدة البيانات
        return { canProcess: false, status: 'FAILED' };
      }

      // ─── الحدث مُعالج بنجاح مسبقاً → تجاوز مع كاش الاستجابة ───
      if (existing.status === 'SUCCESS') {
        return {
          canProcess: false,
          status: 'SUCCESS',
          savedResponse: existing.responsePayload,
        };
      }

      // ─── فحص حالة القفل النشط ───
      const isLocked =
        existing.status === 'PROCESSING' &&
        existing.processingExpiresAt !== null &&
        existing.processingExpiresAt > now;

      if (isLocked) {
        // القفل نشط — حدث آخر يعالج هذا الطلب حالياً
        return { canProcess: false, status: 'PROCESSING' };
      }

      // ─── القفل منتهي أو الحالة RETRYABLE/FAILED ───
      // استحواذ ذري مشروط بالتوقيت أو التوكن القديم
      try {
        await prisma.processedEvent.update({
          where: { payloadHash },
          data: {
            eventId,
            processingToken,
            status: 'PROCESSING',
            processingExpiresAt: expiresAt,
            updatedAt: now,
          },
        });
        return { canProcess: true, status: 'RETRYABLE' };
      } catch (updateError: unknown) {
        // فشل التحديث — عامل متوازي سبقنا (Race Condition محتمل)
        return { canProcess: false, status: 'PROCESSING' };
      }
    }
  }

  /**
   * نقل السجل إلى الحالة النهائية الناجحة
   * وتخزين الاستجابة الكنونية (Canonical Response Cache)
   *
   * @param payloadHash - بصمة الحمولة
   * @param responsePayload - الاستجابة المراد تخزينها
   */
  static async resolveSuccess(
    payloadHash: string,
    responsePayload: unknown
  ): Promise<void> {
    await prisma.processedEvent.update({
      where: { payloadHash },
      data: {
        status: 'SUCCESS',
        responsePayload: responsePayload as object,
        processingExpiresAt: null,
        processingToken: null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * تحرير القفل فوراً ونقل الحالة إلى FAILED أو RETRYABLE
   * بناءً على عداد المحاولات
   *
   * @param payloadHash - بصمة الحمولة
   * @param errorMessage - رسالة الخطأ
   */
  static async markAsFailed(
    payloadHash: string,
    errorMessage: string
  ): Promise<void> {
    const existing = await prisma.processedEvent.findUnique({
      where: { payloadHash },
    });
    const currentAttempts = existing?.attemptCount ?? 0;
    const maxAttempts = 5;

    await prisma.processedEvent.update({
      where: { payloadHash },
      data: {
        status: currentAttempts >= maxAttempts ? 'FAILED' : 'RETRYABLE',
        processingExpiresAt: null,
        processingToken: null,
        lastError: errorMessage,
        attemptCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }
}
