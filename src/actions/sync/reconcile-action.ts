/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⚡ واجهة الاستقبال والـ DTO الموحد للمخرجات — Reconcile Action
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Next.js Server Action المعالج للدفعة والمقفل حوكمياً وأمنياً وإحصائياً.
 *
 * معمارية المعالجة:
 * ──────────────────
 *   ١. فحص التحجيم والحد الأعلى لحماية الخادم (MAX_BATCH_SIZE)
 *   ٢. حجز فردي ذري لكل حدث (IdempotencyGuard.checkAndLock)
 *   ٣. معاملة قصيرة ومحدودة جغرافياً (5 ثوانٍ timeout)
 *   ٤. تحديث حالات صمام الأمان وتجميع العدادات الإحصائية
 *   ٥. إرجاع DTO موحد مع عدادات تجميعية (Aggregated Counters)
 *
 * ⚠️ الـ Transaction لا يحتوي إلا على عمليات الكتابة المحضة
 *    لتقليص الـ Critical Path لأقصى حد ممكن
 * ═══════════════════════════════════════════════════════════════════════
 */

'use server';

import { prisma } from '@/lib/db/prisma';
import { IdempotencyGuard } from './idempotency-guard';
import { ConflictResolver } from '@/lib/server/conflict-resolver';

// ═══════════════════════════════════════════════════════════════════════
// 📐 عقود TypeScript — أنواع البيانات
// ═══════════════════════════════════════════════════════════════════════

/** حدث مزامنة مُعرَّب — الوحدة الأساسية للتبادل */
export interface MappedSyncEvent {
  contextId: string;
  eventId: string;
  action: string;
  payload: Record<string, unknown>;
  payloadHash: string;
}

/** نتيجة معالجة حدث واحد */
export interface SingleEventResult {
  eventId: string;
  contextId: string;
  status: 'SUCCESS' | 'CONFLICT' | 'BYPASS' | 'FAILED';
  appliedAction: string;
  error?: string;
  serverVersion?: unknown;
}

/**
 * الـ DTO الموحد للمخرجات الخادومية
 * مع العدادات الإحصائية التجميعية (Aggregated Counters DTO)
 *
 * يُوفّر للـ UI الميداني رؤية إحصائية فورية تشمل:
 *   - عدد العمليات الناجحة
 *   - عدد العمليات المتجاوزة (BYPASS — معالجة مسبقاً)
 *   - عدد التعارضات (CONFLICT — رفض التعديل المحلي)
 *   - عدد العمليات الفاشلة
 */
export interface BatchReconciliationReport {
  success: boolean;
  batchContextId: string;
  summaryCounters: {
    totalReceived: number;
    succeeded: number;
    bypassed: number;
    conflicts: number;
    failed: number;
  };
  results: SingleEventResult[];
}

/** الحد الأقصى لحجم الدفعة — حماية الخادم من الحمل الزائد */
const MAX_BATCH_SIZE = 50;

/**
 * التحقق من هوية وصلاحية مهندس التصميم الاستشاري
 *
 * ⚠️ تنفيذ انتقالي — في الإنتاج يقرأ من الجلسة المشفرة
 */
async function verifyStructuralEngineerSession(_tx: unknown) {
  // TODO: ربط مع نظام الجلسات (session.ts + rbac.ts)
  return { id: 'ENG_BASHAR_SULIEMAN', role: 'CONSULTANT_STRUCTURAL_ENGINEER' };
}

/**
 * reconcileBatchAction — Server Action المعالج للدفعة
 *
 * التدفق الحاكم:
 *   ١. فحص التحجيم — رفض الدفعات التي تتجاوز MAX_BATCH_SIZE
 *   ٢. لكل حدث:
 *      أ. حجز فردي ذري (IdempotencyGuard)
 *      ب. معاملة قصيرة (5 ثوانٍ) مع:
 *         - التحقق من الصلاحيات
 *         - فحص التعارضات (ConflictResolver)
 *         - تنفيذ العملية الفعلية
 *         - تسجيل حدث التدقيق
 *      ج. تحديث صمام الأمان وتجميع العدادات
 *   ٣. إرجاع DTO موحد مع عدادات إحصائية
 */
export async function reconcileBatchAction(
  events: MappedSyncEvent[],
  batchContextId: string
): Promise<BatchReconciliationReport> {
  const reportResults: SingleEventResult[] = [];

  const counters = {
    totalReceived: events.length,
    succeeded: 0,
    bypassed: 0,
    conflicts: 0,
    failed: 0,
  };

  // ─── ١. فحص التحجيم والحد الأعلى لحماية الخادم ───
  if (events.length > MAX_BATCH_SIZE) {
    return {
      success: false,
      batchContextId,
      summaryCounters: { ...counters, failed: events.length },
      results: [
        {
          eventId: 'BATCH_LIMIT_EXCEEDED',
          contextId: batchContextId,
          status: 'FAILED',
          appliedAction: 'REJECT_ALL',
          error: `حجم الدفعة الممررة يتجاوز الحد المسموح به كحد أقصى وهو (${MAX_BATCH_SIZE}) حركة في حزمة المزامنة الواحدة.`,
        },
      ],
    };
  }

  // ─── ٢. معالجة كل حدث على حدة ───
  for (const event of events) {
    const { payloadHash, eventId, contextId, action, payload } = event;
    const processingToken = `TOKEN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      // ─── خطوة الحجز الفردي الذري ───
      const guard = await IdempotencyGuard.checkAndLock(
        payloadHash,
        eventId,
        processingToken
      );

      if (!guard.canProcess) {
        if (guard.status === 'SUCCESS') {
          // الحدث مُعالج مسبقاً — تجاوز مع كاش الاستجابة
          counters.bypassed++;
          reportResults.push({
            eventId,
            contextId,
            status: 'BYPASS',
            appliedAction: action,
            serverVersion: guard.savedResponse,
          });
          continue;
        }
        // الحدث محجوز أو قيد المعالجة — لا يمكن المتابعة
        counters.failed++;
        reportResults.push({
          eventId,
          contextId,
          status: 'FAILED',
          appliedAction: action,
          error: 'الحدث محجوز وقيد المعالجة النشطة في خادم متوازي.',
        });
        continue;
      }

      // ─── ٣. المعاملة القصيرة والمحدودة جغرافياً ───
      // حماية الـ Critical Path — فقط عمليات الكتابة المحضة
      const actionResult = await prisma.$transaction(
        async (tx) => {
          // التحقق من هوية وصلاحية مهندس التصميم الاستشاري
          const user = await verifyStructuralEngineerSession(tx);
          if (!user || user.role !== 'CONSULTANT_STRUCTURAL_ENGINEER') {
            throw new Error(
              'غير مصرح: الحساب الحالي لا يملك الامتيازات اللازمة لمزامنة وتدقيق الحسابات الهندسية.'
            );
          }

          // ─── فحص التعارضات والتحقق من الـ Version الرقمي ───
          if (action === 'UPDATE_SCENARIO' || action === 'DELETE_SCENARIO') {
            const conflictCheck = await ConflictResolver.resolveScenarioConflict(
              (payload as Record<string, unknown>).id as string,
              ((payload as Record<string, unknown>).updatedAt as number) ?? 0,
              ((payload as Record<string, unknown>).version as number) ?? 0,
              ((payload as Record<string, unknown>).projectId as string) ?? ''
            );

            if (conflictCheck.decision === 'REJECT_LOCAL') {
              return {
                status: 'CONFLICT' as const,
                serverVersion: conflictCheck.serverBaseline,
                error: conflictCheck.reason,
              };
            }
          }

          // ─── تنفيذ العمليات الفعلية ───
          switch (action) {
            case 'CREATE_PROJECT':
              await tx.project.create({
                data: {
                  id: (payload as Record<string, unknown>).id as string,
                  name: (payload as Record<string, unknown>).name as string,
                  description: (payload as Record<string, unknown>).description as string | null,
                  baselineVersion: ((payload as Record<string, unknown>).baselineVersion as string) ?? 'V3.0-Locked',
                  createdAt: new Date((payload as Record<string, unknown>).createdAt as number),
                  updatedAt: new Date((payload as Record<string, unknown>).updatedAt as number),
                },
              });
              break;

            case 'UPDATE_SCENARIO':
              await tx.scenario.upsert({
                where: { id: (payload as Record<string, unknown>).id as string },
                update: {
                  title: (payload as Record<string, unknown>).title as string,
                  inputs: (payload as Record<string, unknown>).inputs as object,
                  outputs: (payload as Record<string, unknown>).outputs as object | null,
                  version: { increment: 1 },
                  updatedAt: new Date(),
                },
                create: {
                  id: (payload as Record<string, unknown>).id as string,
                  projectId: (payload as Record<string, unknown>).projectId as string,
                  title: (payload as Record<string, unknown>).title as string,
                  inputs: (payload as Record<string, unknown>).inputs as object,
                  outputs: (payload as Record<string, unknown>).outputs as object | null,
                  version: 1,
                  createdAt: new Date((payload as Record<string, unknown>).createdAt as number),
                  updatedAt: new Date((payload as Record<string, unknown>).updatedAt as number),
                },
              });
              break;

            case 'LOG_RTM':
              await tx.rtmRecord.create({
                data: {
                  id: (payload as Record<string, unknown>).id as string,
                  scenarioId: (payload as Record<string, unknown>).scenarioId as string,
                  testCaseId: (payload as Record<string, unknown>).testCaseId as string,
                  associatedRequirement: (payload as Record<string, unknown>).associatedRequirement as string,
                  status: (payload as Record<string, unknown>).status as 'PASSED' | 'FAILED',
                  defectLog: ((payload as Record<string, unknown>).defectLog as string) ?? null,
                },
              });
              break;

            default:
              throw new Error(
                `الإجراء المطلوب غير مدرج بجدول المعالجة الخادومية المعتمدة: ${action}`
              );
          }

          // ─── تسجيل حدث التدقيق (Audit Log) ───
          // داخل الـ Critical Transaction Path — خطوة سريعة
          await tx.auditLog.create({
            data: {
              eventId,
              contextId,
              action,
              performedBy: user.id,
              metadata: { payloadHash },
            },
          });

          return { status: 'SUCCESS' as const, serverVersion: payload };
        },
        {
          // تحديد سقف زمني صارم 5 ثوانٍ للمعاملة لمنع الـ Deadlocks
          timeout: 5000,
        }
      );

      // ─── ٤. تحديث حالات صمام الأمان وتجميع العدادات الإحصائية ───
      if (actionResult.status === 'SUCCESS') {
        counters.succeeded++;
        await IdempotencyGuard.resolveSuccess(payloadHash, actionResult.serverVersion);
        reportResults.push({
          eventId,
          contextId,
          status: 'SUCCESS',
          appliedAction: action,
        });
      } else if (actionResult.status === 'CONFLICT') {
        counters.conflicts++;
        await IdempotencyGuard.markAsFailed(
          payloadHash,
          actionResult.error || 'Conflict Identified'
        );
        reportResults.push({
          eventId,
          contextId,
          status: 'CONFLICT',
          appliedAction: action,
          error: actionResult.error,
          serverVersion: actionResult.serverVersion,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'خطأ داخلي حرج في نظام معالجة البيانات الخادومية.';

      counters.failed++;
      console.error(
        `[ReconcileAction] خطأ معالجة حرج في الحدث ${eventId}:`,
        error
      );

      await IdempotencyGuard.markAsFailed(payloadHash, errorMessage);

      reportResults.push({
        eventId,
        contextId,
        status: 'FAILED',
        appliedAction: action,
        error: errorMessage,
      });
    }
  }

  return {
    success: counters.failed === 0 && counters.conflicts === 0,
    batchContextId,
    summaryCounters: counters,
    results: reportResults,
  };
}
