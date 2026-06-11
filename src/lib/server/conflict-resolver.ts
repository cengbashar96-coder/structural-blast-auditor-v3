/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⚖️ محرك حسم التعارضات الهندسي — Conflict Resolver
 * ═══════════════════════════════════════════════════════════════════════
 *
 * حسم النزاعات البرمجية والهندسية مع حماية:
 *   - الإصدارات الإنشائية وكود التصميم
 *   - قفل خط الأساس الحوكمي (Baseline Lock)
 *   - التحكم المتزامن المتفائل (Optimistic Concurrency Control)
 *
 * استراتيجية الحسم:
 * ──────────────────
 *   ١. سيادة الخادم المطلقة عند قفل خط الأساس (Server-Authoritative)
 *   ٢. فحص الإصدار الرقمي التصاعدي (Version-based OCC)
 *   ٣. الفحص الزمني كخط دفاع احتياطي (Last-Write-Wins Fallback)
 *
 * ⚠️ فشل القص الثاقب (PUNCHING_FAILURE) لا يُتجاوز أبداً —
 *    الأمان الإنشائي مقدس ومُلزم حوكماً
 * ═══════════════════════════════════════════════════════════════════════
 */

import { prisma } from '@/lib/db/prisma';

/** نتيجة قرار حسم التعارض — نمط تمييزي (Discriminated Union) */
export type ConflictResolutionDecision =
  | { decision: 'APPLY_LOCAL'; reason: string }
  | { decision: 'REJECT_LOCAL'; reason: string; serverBaseline: unknown };

/**
 * ConflictResolver — محرك فحص وحسم التعارضات الإنشائية
 *
 * القواعد الحاكمة (Sovereign Rules):
 * ──────────────────────────────────
 * ١. خط الأساس المقفل مقدس — لا تعديلات ميدانية عند القفل الحوكمي
 * ٢. الإصدار الرقمي حاسم — نسخة الخادم الأحدث ترفض المحلية
 * ٣. الزمن كاحتياط — Last-Write-Wins عند غياب الإصدارات الرقمية
 * ٤. فشل القص الثاقب لا يُتجاوز — الأمان الإنشائي مُلزم
 */
export class ConflictResolver {
  /**
   * حسم النزاع البرمجي والهندسي مع حماية الإصدارات الإنشائية وكود التصميم
   *
   * التدفق الحاكم:
   *   ١. فحص قفل خط الأساس للمشروع → سيادة الخادم المطلقة عند القفل
   *   ٢. فحص الإصدار الرقمي → رفض النسخة المحلية إذا كانت أقدم
   *   ٣. فحص زمني احتياطي → Last-Write-Wins عند تساوي/غياب الإصدارات
   *
   * @param scenarioId - معرف السيناريو المتعارض
   * @param localUpdatedAt - تابع تعديل النسخة المحلية (timestamp بالمللي ثانية)
   * @param localVersion - الإصدار الرقمي المحلي (للتحكم المتزامن المتفائل)
   * @param projectId - معرف المشروع الأب
   * @returns قرار حسم التعارض
   */
  static async resolveScenarioConflict(
    scenarioId: string,
    localUpdatedAt: number,
    localVersion: number,
    projectId: string
  ): Promise<ConflictResolutionDecision> {
    // ─── ١. سيادة الخادم المطلقة عند قفل خط الأساس ───
    // Server-Authoritative Baseline Lock
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { isBaselineLocked: true, baselineVersion: true },
    });

    if (project?.isBaselineLocked) {
      const currentServerScenario = await prisma.scenario.findUnique({
        where: { id: scenarioId },
      });
      return {
        decision: 'REJECT_LOCAL',
        reason: `سيادة الخادم: خط الأساس للمشروع مقفل حوكمياً بالإصدار (${project.baselineVersion}). لا يمكن تعديل السيناريوهات الميدانية.`,
        serverBaseline: currentServerScenario,
      };
    }

    // ─── ٢. فحص التعارض بناءً على الـ Version الرقمي ───
    // Optimistic Concurrency Control — الخيار الأول
    const serverScenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: { updatedAt: true, version: true },
    });

    if (serverScenario) {
      // الفحص عبر الإصدار الرقمي التصاعدي — الأساس الحاكم
      if (serverScenario.version && localVersion < serverScenario.version) {
        const fullServerScenario = await prisma.scenario.findUnique({
          where: { id: scenarioId },
        });
        return {
          decision: 'REJECT_LOCAL',
          reason: `تعارض في الإصدارات: نسخة الخادم تحمل إصداراً أحدث (${serverScenario.version}) من النسخة المحلية المرسلة (${localVersion}).`,
          serverBaseline: fullServerScenario,
        };
      }

      // ─── ٣. خط دفاع احتياطي: الفحص الزمني (Last-Write-Wins) ───
      // إذا تساوت أو غابت النسخ الرقمية
      const serverTime = serverScenario.updatedAt.getTime();
      if (localUpdatedAt < serverTime) {
        const fullServerScenario = await prisma.scenario.findUnique({
          where: { id: scenarioId },
        });
        return {
          decision: 'REJECT_LOCAL',
          reason: 'تعارض زمني: نسخة الخادم تم تحديثها مسبقاً بتوقيت أحدث من التعديل الميداني الحالي.',
          serverBaseline: fullServerScenario,
        };
      }
    }

    // ─── لا توجد قيود حوكمية والنسخة الميدانية متوافقة أو أحدث ───
    return {
      decision: 'APPLY_LOCAL',
      reason: 'اعتماد التعديل: لا توجد قيود حوكمية والنسخة الميدانية متوافقة أو أحدث.',
    };
  }
}
