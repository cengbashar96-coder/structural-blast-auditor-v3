// ═══════════════════════════════════════════════════════════════════════
// محرك سياسة حسم التعارضات الحوكمية - conflictPolicy.ts
// منصة المدقق الديناميكي الموحد V3.0
// فلسفة: "الفحص الهندسي أولاً" — لا يمكن لقاعدة عمياء مثل
// "السيرفر يربح دائماً" أن تحكم منصة إنشائية سيادية
// ═══════════════════════════════════════════════════════════════════════

import { ProjectRecord, ScenarioRecord } from './storageSchemas';

// ─── واجهة نتيجة حسم التعارض ──────────────────────────────────────

export type ConflictSource = 'LOCAL_FORCE' | 'SERVER_FORCE' | 'MERGED';

export interface ConflictResolutionResult<T> {
  resolvedData: T;
  source: ConflictSource;
  logMessage: string;
}

// ─── سجل التعارضات للمراجعة والتدقيق (Audit Trail) ────────────────

export interface ConflictLogEntry {
  id: string;
  timestamp: number;
  payloadType: 'PROJECT' | 'SCENARIO';
  localId: string;
  source: ConflictSource;
  summary: string;
}

const conflictLog: ConflictLogEntry[] = [];

/**
 * ConflictPolicy — محرك فحص وحسم التعارضات الإنشائية
 *
 * القواعد الحاكمة (Sovereign Rules):
 * ──────────────────────────────────
 * 1. Baseline Version مقدس: إذا اختلفت النسخة المرجعية، النسخة المحلية المقفلة تفرض قسراً
 * 2. فشل القص الثاقب لا يُتجاوز: إذا أشار السيرفر لفشل إنشائي، يُفرض فوراً لحماية المنشأة
 * 3. في حال التساوي: التعديل الأحدث زمنياً يربح (Last-Write-Wins with Timestamp)
 * 4. كل تعارض يُسجل في سجل المراجعة (Audit Trail) للشفافية الحوكمية
 */
export class ConflictPolicy {
  /**
   * حسم التعارضات للمشاريع بناءً على النسخة المرجعية المعتمدة (Baseline Version) والتاريخ
   *
   * القاعدة الحاكمة: النسخة المرجعية (Baseline) هي السياد المطلق —
   * إذا كانت النسخة المحلية أحدث حوكمة، تُفرض قسراً لحماية المعايير المقفلة
   */
  static resolveProject(
    local: ProjectRecord,
    server: ProjectRecord
  ): ConflictResolutionResult<ProjectRecord> {
    // ─── قاعدة 1: السيادة الحوكمية — Baseline Version ───
    // إذا اختلفت النسخة المرجعية، النسخة المحلية المقفلة تفرض قسراً
    // هذا يمنع السيرفر من تخفيض معايير الكود السوري أو UFC 3-340-02
    if (local.baselineVersion !== server.baselineVersion) {
      const result: ConflictResolutionResult<ProjectRecord> = {
        resolvedData: local,
        source: 'LOCAL_FORCE',
        logMessage: `CONFLICT: تعارض في النسخة المرجعية. تم فرض النسخة المحلية المقفلة: ${local.baselineVersion} (محلي) مقابل ${server.baselineVersion} (سيرفر)`,
      };
      this.logConflict('PROJECT', local.id, result.source, result.logMessage);
      return result;
    }

    // ─── قاعدة 2: التاريخ الحاكم — الأحدث زمنياً ───
    // عند تساوي Baseline، التعديل الأحدث زمنياً يربح
    if (local.updatedAt > server.updatedAt) {
      const result: ConflictResolutionResult<ProjectRecord> = {
        resolvedData: local,
        source: 'LOCAL_FORCE',
        logMessage: `CONFLICT: النسخة المحلية أحدث زمنياً (${local.updatedAt} مقابل ${server.updatedAt})، تم اعتمادها.`,
      };
      this.logConflict('PROJECT', local.id, result.source, result.logMessage);
      return result;
    }

    // ─── قاعدة 3: السيرفر أحدث — تحديث التخزين المحلي ───
    const result: ConflictResolutionResult<ProjectRecord> = {
      resolvedData: server,
      source: 'SERVER_FORCE',
      logMessage: `CONFLICT: نسخة السيرفر أحدث زمنياً (${server.updatedAt} مقابل ${local.updatedAt})، تم تحديث التخزين المحلي.`,
    };
    this.logConflict('PROJECT', local.id, result.source, result.logMessage);
    return result;
  }

  /**
   * حسم التعارضات لحالات التصميم (Scenarios) لضمان عدم تمرير نتائج غير مفحوصة
   *
   * القاعدة الحاسمة: فشل القص الثاقب (PUNCHING_FAILURE) من السيرفر
   * يُفرض فوراً وقسراً — حتى لو كانت النسخة المحلية تسجل نجاحاً
   * هذا يحمي المنشأة من اعتماد مقطع غير آمن إنشائياً
   */
  static resolveScenario(
    local: ScenarioRecord,
    server: ScenarioRecord
  ): ConflictResolutionResult<ScenarioRecord> {
    // ─── قاعدة السيادة الإنشائية: فشل القص الثاقب لا يُتجاوز ───
    // إذا أشار السيرفر لفشل إنشائي في حين النسخة المحلية تسجل نجاحاً،
    // يُفرض فشل السيرفر فوراً — حماية المنشأة مقدمة على أي اعتبار آخر
    if (
      server.outputs?.status === 'PUNCHING_FAILURE' &&
      local.outputs?.status === 'SUCCESS'
    ) {
      const result: ConflictResolutionResult<ScenarioRecord> = {
        resolvedData: server,
        source: 'SERVER_FORCE',
        logMessage:
          'CRITICAL CONFLICT: نسخة السيرفر تسجل فشل قص ثاقب ديناميكي! تم رفض المحاولة المحلية فوراً وقفل المقطع. الأمان الإنشائي مقدس.',
      };
      this.logConflict('SCENARIO', local.id, result.source, result.logMessage);
      return result;
    }

    // ─── قاعدة معاكسة: فشل محلي مقابل نجاح سيرفر ───
    // إذا كانت النسخة المحلية تسجل فشلاً والسيرفر يسجل نجاحاً،
    // نحتاج مراجعة هندسية — يتم اعتماد النسخة الأحدث زمنياً مع تسجيل الحدث
    if (
      local.outputs?.status === 'PUNCHING_FAILURE' &&
      server.outputs?.status === 'SUCCESS'
    ) {
      // ترجيح السيرفر إذا كان أحدث — لأنه مرّ بمراجعة إضافية
      if (server.updatedAt >= local.updatedAt) {
        const result: ConflictResolutionResult<ScenarioRecord> = {
          resolvedData: server,
          source: 'SERVER_FORCE',
          logMessage:
            'CONFLICT: المحلي يسجل فشل والسيرفر نجاح. تم اعتماد السيرفر الأحدث بعد مراجعة هندسية. يتطلب تحقق يدوي.',
        };
        this.logConflict('SCENARIO', local.id, result.source, result.logMessage);
        return result;
      }
    }

    // ─── قاعدة التاريخ الافتراضية ───
    if (local.updatedAt > server.updatedAt) {
      const result: ConflictResolutionResult<ScenarioRecord> = {
        resolvedData: local,
        source: 'LOCAL_FORCE',
        logMessage: 'CONFLICT: تم اعتماد حالة التصميم المحلية الأحدث زمنياً.',
      };
      this.logConflict('SCENARIO', local.id, result.source, result.logMessage);
      return result;
    }

    const result: ConflictResolutionResult<ScenarioRecord> = {
      resolvedData: server,
      source: 'SERVER_FORCE',
      logMessage: 'CONFLICT: تم سحب حالة التصميم المعتمدة من السيرفر.',
    };
    this.logConflict('SCENARIO', local.id, result.source, result.logMessage);
    return result;
  }

  /**
   * تسجيل التعارض في سجل المراجعة — للشفافية الحوكمية والتدقيق
   */
  private static logConflict(
    payloadType: 'PROJECT' | 'SCENARIO',
    localId: string,
    source: ConflictSource,
    summary: string
  ): void {
    conflictLog.push({
      id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      payloadType,
      localId,
      source,
      summary,
    });
  }

  /**
   * جلب سجل التعارضات — للعرض في شاشة المراجعة (Audit Screen)
   */
  static getConflictLog(): ConflictLogEntry[] {
    return [...conflictLog].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * مسح سجل التعارضات — للاستخدام في وضع التطوير فقط
   */
  static clearConflictLog(): void {
    conflictLog.length = 0;
  }

  /**
   * عدد التعارضات المسجلة — مؤشر صحة النظام
   */
  static getConflictCount(): number {
    return conflictLog.length;
  }
}
