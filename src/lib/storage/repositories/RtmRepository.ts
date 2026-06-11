// ═══════════════════════════════════════════════════════════════════════
// مستودع سجلات تتبع المتطلبات - RtmRepository.ts
// منصة المدقق الديناميكي الموحد V3.0
// RTM Ledger — المرجع الحاكم لربط الاختبارات بالمتطلبات الهندسية
// ═══════════════════════════════════════════════════════════════════════

import { db } from '../db';
import {
  RtmRecord,
  RtmRecordSchema,
  SyncQueueRecord,
  RtmTestCaseId,
  validateBeforeWrite,
} from '../storageSchemas';

// مولد UUID متوافق
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class RtmRepository {
  /**
   * تسجيل نتيجة اختبار في سجل RTM
   *
   * RTM = Requirements Traceability Matrix
   * كل اختبار يرتبط بمتطلب هندسي حاكم (مثل FR-3.2.9)
   * هذه الطبقة هي أساس التحقق من جودة النظام وشمولية الاختبارات
   */
  async logRtmEntry(
    scenarioId: string,
    testCaseId: RtmTestCaseId,
    associatedRequirement: string,
    status: 'PASSED' | 'FAILED',
    defectLog?: string
  ): Promise<RtmRecord> {
    // التحقق من وجود السيناريو الأب
    const scenario = await db.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(
        `[STORAGE-INTEGRITY] لا تسجيل RTM يتيم: السيناريو ${scenarioId} غير موجود`
      );
    }

    const rawRecord: RtmRecord = {
      id: generateUUID(),
      scenarioId,
      testCaseId,
      associatedRequirement,
      status,
      defectLog,
      timestamp: Date.now(),
    };

    // التحقق الصارم
    const validatedRecord = validateBeforeWrite(
      RtmRecordSchema,
      rawRecord,
      'RtmRepository.logRtmEntry'
    );

    return await db.transaction(
      'rw',
      [db.rtmRecords, db.syncQueue],
      async () => {
        await db.rtmRecords.add(validatedRecord);

        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'LOG_RTM',
          payloadType: 'RTM',
          payload: validatedRecord,
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 3,
          timestamp: Date.now(),
        };
        await db.syncQueue.add(syncItem);

        return validatedRecord;
      }
    );
  }

  /**
   * جلب كافة سجلات RTM المرتبطة بسيناريو محدد
   */
  async getRtmByScenarioId(scenarioId: string): Promise<RtmRecord[]> {
    return await db.rtmRecords
      .where('scenarioId')
      .equals(scenarioId)
      .toArray();
  }

  /**
   * جلب كافة سجلات RTM لحالة اختبار محددة
   * مثال: جلب كل نتائج TC-STRUCT-001 عبر المشاريع
   */
  async getRtmByTestCase(testCaseId: RtmTestCaseId): Promise<RtmRecord[]> {
    return await db.rtmRecords
      .where('testCaseId')
      .equals(testCaseId)
      .toArray();
  }

  /**
   * جلب كافة سجلات RTM لمتطلب هندسي محدد
   * مثال: جلب كل الاختبارات المرتبطة بالمتطلب FR-3.2.9
   */
  async getRtmByRequirement(requirement: string): Promise<RtmRecord[]> {
    return await db.rtmRecords
      .where('associatedRequirement')
      .equals(requirement)
      .toArray();
  }

  /**
   * جلب سجلات RTM حسب الحالة (ناجح / فاشل)
   */
  async getRtmByStatus(status: 'PASSED' | 'FAILED'): Promise<RtmRecord[]> {
    return await db.rtmRecords
      .where('status')
      .equals(status)
      .toArray();
  }

  /**
   * تقرير تغطية المتطلبات — ما نسبة المتطلبات المغطاة بالاختبارات؟
   * هذا التقرير هو أساس قبول أو رفع النظام
   */
  async getCoverageReport(): Promise<{
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    byTestCase: Record<string, { passed: number; failed: number }>;
  }> {
    const allRecords = await db.rtmRecords.toArray();

    const total = allRecords.length;
    const passed = allRecords.filter((r) => r.status === 'PASSED').length;
    const failed = allRecords.filter((r) => r.status === 'FAILED').length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    // تجميع حسب حالة الاختبار
    const byTestCase: Record<string, { passed: number; failed: number }> = {};
    for (const record of allRecords) {
      if (!byTestCase[record.testCaseId]) {
        byTestCase[record.testCaseId] = { passed: 0, failed: 0 };
      }
      if (record.status === 'PASSED') {
        byTestCase[record.testCaseId].passed++;
      } else {
        byTestCase[record.testCaseId].failed++;
      }
    }

    return { total, passed, failed, passRate, byTestCase };
  }

  /**
   * جلب سجلات العيوب فقط — للمراجعة والإصلاح
   */
  async getDefectLog(): Promise<RtmRecord[]> {
    return await db.rtmRecords
      .filter((r) => r.status === 'FAILED')
      .toArray();
  }

  /**
   * عدد سجلات RTM الإجمالي
   */
  async count(): Promise<number> {
    return await db.rtmRecords.count();
  }
}

// ─── Singleton Instance ───
export const rtmRepository = new RtmRepository();
