// ═══════════════════════════════════════════════════════════════════════
// مستودع السيناريوهات - ScenarioRepository.ts
// منصة المدقق الديناميكي الموحد V3.0
// الربط الحاكم بين المدخلات والمخرجات ومحرك التصميم الإنشائي
// ═══════════════════════════════════════════════════════════════════════

import { db } from '../db';
import {
  ScenarioRecord,
  ScenarioRecordSchema,
  SyncQueueRecord,
  validateBeforeWrite,
} from '../storageSchemas';
import type { StructuralInput } from '../../structural/structuralSchema';
import type { StructuralOutput } from '../../structural/structuralEngine';

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

export class ScenarioRepository {
  /**
   * إنشاء سيناريو تصميمي جديد مرتبط بمشروع محدد
   *
   * التسلسل الحاكم:
   * 1. التحقق من وجود المشروع الأب
   * 2. بناء السجل مع المدخلات المعتمدة من StructuralInputSchema
   * 3. التحقق الصارم عبر Zod
   * 4. Transaction: كتابة + تسجيل في طابور المزامنة
   */
  async createScenario(
    projectId: string,
    title: string,
    inputs: StructuralInput
  ): Promise<ScenarioRecord> {
    // 1. التحقق من وجود المشروع الأب — لا يمكن إنشاء سيناريو يتيم
    const project = await db.projects.get(projectId);
    if (!project) {
      throw new Error(
        `[STORAGE-INTEGRITY] لا يمكن إنشاء سيناريو: المشروع ${projectId} غير موجود`
      );
    }

    const now = Date.now();
    const rawRecord: ScenarioRecord = {
      id: generateUUID(),
      projectId,
      title,
      inputs,
      outputs: undefined, // سيتم ملؤه عند تشغيل المحرك
      createdAt: now,
      updatedAt: now,
    };

    // 2. التحقق الصارم عبر Zod
    const validatedRecord = validateBeforeWrite(
      ScenarioRecordSchema,
      rawRecord,
      'ScenarioRepository.createScenario'
    );

    // 3. Transaction آمنة
    return await db.transaction(
      'rw',
      [db.scenarios, db.syncQueue],
      async () => {
        await db.scenarios.add(validatedRecord);

        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'CREATE_SCENARIO',
          payloadType: 'SCENARIO',
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
   * حفظ نتائج المحرك الإنشائي في السيناريو — الربط بين المحرك والتخزين
   *
   * هذه هي النقطة الحاكمة التي تربط مخرجات المحرك الثالث
   * بقاعدة البيانات المحلية وواجهة الـ SVG
   */
  async saveStructuralOutput(
    scenarioId: string,
    output: StructuralOutput
  ): Promise<ScenarioRecord> {
    const existing = await db.scenarios.get(scenarioId);
    if (!existing) {
      throw new Error(
        `[STORAGE-INTEGRITY] السيناريو ${scenarioId} غير موجود`
      );
    }

    const updatedRecord: ScenarioRecord = {
      ...existing,
      outputs: {
        status: output.status,
        d_eff: output.d_eff,
        b_0: output.b_0,
        eccentricity: output.eccentricity,
        e_limit: output.e_limit,
        svgColor: output.svgColor,
        rho_final: output.rho_final,
        v_actual: output.v_actual,
        v_cd: output.v_cd,
        calculatedAt: Date.now(),
        errorMessage: output.errorMessage,
      },
      updatedAt: Date.now(),
    };

    // التحقق الصارم
    const validatedRecord = validateBeforeWrite(
      ScenarioRecordSchema,
      updatedRecord,
      'ScenarioRepository.saveStructuralOutput'
    );

    return await db.transaction(
      'rw',
      [db.scenarios, db.syncQueue],
      async () => {
        await db.scenarios.put(validatedRecord);

        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'UPDATE_SCENARIO',
          payloadType: 'SCENARIO',
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
   * جلب كافة السيناريوهات المرتبطة بمشروع محدد
   */
  async getScenariosByProjectId(projectId: string): Promise<ScenarioRecord[]> {
    return await db.scenarios
      .where('projectId')
      .equals(projectId)
      .reverse()
      .sortBy('createdAt');
  }

  /**
   * جلب سيناريو محدد بالمعرف الفريد
   */
  async getScenarioById(id: string): Promise<ScenarioRecord | undefined> {
    return await db.scenarios.get(id);
  }

  /**
   * جلب آخر سيناريو محسوب لمشروع — للعرض الفوري في الواجهة
   */
  async getLatestComputedScenario(projectId: string): Promise<ScenarioRecord | undefined> {
    const scenarios = await db.scenarios
      .where('projectId')
      .equals(projectId)
      .toArray();

    // فلترة: فقط السيناريوهات التي تم حسابها
    const computed = scenarios
      .filter((s) => s.outputs !== undefined)
      .sort((a, b) => (b.outputs?.calculatedAt ?? 0) - (a.outputs?.calculatedAt ?? 0));

    return computed[0];
  }

  /**
   * تحديث مدخلات سيناريو موجود — مع إعادة التعيين التلقائي للمخرجات
   */
  async updateScenarioInputs(
    id: string,
    newInputs: StructuralInput
  ): Promise<ScenarioRecord> {
    const existing = await db.scenarios.get(id);
    if (!existing) {
      throw new Error(`[STORAGE-INTEGRITY] السيناريو ${id} غير موجود`);
    }

    const updatedRecord: ScenarioRecord = {
      ...existing,
      inputs: newInputs,
      outputs: undefined, // إعادة تعيين المخرجات — يجب إعادة الحساب
      updatedAt: Date.now(),
    };

    const validatedRecord = validateBeforeWrite(
      ScenarioRecordSchema,
      updatedRecord,
      'ScenarioRepository.updateScenarioInputs'
    );

    return await db.transaction(
      'rw',
      [db.scenarios, db.syncQueue],
      async () => {
        await db.scenarios.put(validatedRecord);

        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'UPDATE_SCENARIO',
          payloadType: 'SCENARIO',
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
   * حذف سيناريو مع سجلات RTM المرتبطة
   */
  async deleteScenario(id: string): Promise<void> {
    const existing = await db.scenarios.get(id);
    if (!existing) {
      throw new Error(`[STORAGE-INTEGRITY] السيناريو ${id} غير موجود`);
    }

    await db.transaction(
      'rw',
      [db.scenarios, db.rtmRecords, db.syncQueue],
      async () => {
        // حذف سجلات RTM المرتبطة
        await db.rtmRecords.where('scenarioId').equals(id).delete();

        // حذف السيناريو
        await db.scenarios.delete(id);

        // تسجيل في طابور المزامنة
        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'DELETE_SCENARIO',
          payloadType: 'SCENARIO',
          payload: { id, projectId: existing.projectId, deletedAt: Date.now() },
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 3,
          timestamp: Date.now(),
        };
        await db.syncQueue.add(syncItem);
      }
    );
  }

  /**
   * عدد السيناريوهات في مشروع محدد
   */
  async countByProjectId(projectId: string): Promise<number> {
    return await db.scenarios
      .where('projectId')
      .equals(projectId)
      .count();
  }
}

// ─── Singleton Instance ───
export const scenarioRepository = new ScenarioRepository();
