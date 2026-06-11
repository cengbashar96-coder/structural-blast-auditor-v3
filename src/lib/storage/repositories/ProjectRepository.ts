// ═══════════════════════════════════════════════════════════════════════
// مستودع المشاريع - ProjectRepository.ts
// منصة المدقق الديناميكي الموحد V3.0
// Local-First Write + Transaction Safety + Sync Queue Auto-Registration
// ═══════════════════════════════════════════════════════════════════════

import { db } from '../db';
import {
  ProjectRecord,
  ProjectRecordSchema,
  SyncQueueRecord,
  validateBeforeWrite,
} from '../storageSchemas';

// مولد UUID متوافق مع المتصفح وNode.js
function generateUUID(): string {
  // استخدم crypto.randomUUID() إذا كان متاحاً (المتصفحات الحديثة)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback — Math.random UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class ProjectRepository {
  /**
   * إنشاء مشروع جديد محلياً — مبدأ Local-First Write
   *
   * التسلسل الحاكم:
   * 1. بناء السجل الخام
   * 2. التحقق الصارم عبر Zod قبل الكاتبة
   * 3. Transaction: كتابة في projects + تسجيل في syncQueue
   * 4. إرجاع السجل المحقق
   */
  async createProject(
    name: string,
    description?: string,
    baselineVersion = 'V3.0-Locked'
  ): Promise<ProjectRecord> {
    const now = Date.now();
    const rawRecord: ProjectRecord = {
      id: generateUUID(),
      name,
      description,
      baselineVersion,
      createdAt: now,
      updatedAt: now,
    };

    // 1. التحقق الصارم عبر Zod قبل الإدخال — منع البيانات التالفة
    const validatedRecord = validateBeforeWrite(
      ProjectRecordSchema,
      rawRecord,
      'ProjectRepository.createProject'
    );

    // 2. Transaction لضمان سلامة الكتابة المحلية وطابور المزامنة معاً
    return await db.transaction(
      'rw',
      [db.projects, db.syncQueue],
      async () => {
        // الكتابة في IndexedDB
        await db.projects.add(validatedRecord);

        // تسجيل العملية في طابور المزامنة للشبكة لاحقاً
        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'CREATE_PROJECT',
          payloadType: 'PROJECT',
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
   * تحديث بيانات مشروع موجود — مع تسجيل آلي في طابور المزامنة
   */
  async updateProject(
    id: string,
    updates: Partial<Pick<ProjectRecord, 'name' | 'description' | 'baselineVersion'>>
  ): Promise<ProjectRecord> {
    const existing = await db.projects.get(id);
    if (!existing) {
      throw new Error(`[STORAGE-ERROR] المشروع غير موجود: ${id}`);
    }

    const updatedRecord: ProjectRecord = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    // التحقق الصارم قبل التحديث
    const validatedRecord = validateBeforeWrite(
      ProjectRecordSchema,
      updatedRecord,
      'ProjectRepository.updateProject'
    );

    return await db.transaction(
      'rw',
      [db.projects, db.syncQueue],
      async () => {
        await db.projects.put(validatedRecord);

        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'UPDATE_PROJECT',
          payloadType: 'PROJECT',
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
   * جلب كافة المشاريع المخزنة محلياً — مرتبة بالأحدث أولاً
   */
  async getAllProjects(): Promise<ProjectRecord[]> {
    return await db.projects.orderBy('createdAt').reverse().toArray();
  }

  /**
   * جلب مشروع محدد بواسطة المعرف الفريد
   */
  async getProjectById(id: string): Promise<ProjectRecord | undefined> {
    return await db.projects.get(id);
  }

  /**
   * حذف مشروع مع جميع السيناريوهات وسجلات RTM المرتبطة به
   * ⚠️ عملية تحذيرية — تؤدي لحذف متسلسل في transaction واحد
   */
  async deleteProject(id: string): Promise<void> {
    // التحقق من وجود المشروع قبل الحذف
    const existing = await db.projects.get(id);
    if (!existing) {
      throw new Error(`[STORAGE-ERROR] المشروع غير موجود: ${id}`);
    }

    await db.transaction(
      'rw',
      [db.projects, db.scenarios, db.rtmRecords, db.syncQueue],
      async () => {
        // حذف سجلات RTM المرتبطة بالسيناريوهات
        const scenarioIds = await db.scenarios
          .where('projectId')
          .equals(id)
          .primaryKeys();

        for (const scenarioId of scenarioIds) {
          await db.rtmRecords.where('scenarioId').equals(scenarioId).delete();
        }

        // حذف السيناريوهات المرتبطة
        await db.scenarios.where('projectId').equals(id).delete();

        // حذف المشروع نفسه
        await db.projects.delete(id);

        // تسجيل عملية الحذف في طابور المزامنة
        const syncItem: SyncQueueRecord = {
          id: generateUUID(),
          action: 'DELETE_PROJECT',
          payloadType: 'PROJECT',
          payload: { id, deletedAt: Date.now() },
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
   * البحث عن مشروع بالاسم — يستخدم فهرس البحث المحسن
   */
  async searchByName(query: string): Promise<ProjectRecord[]> {
    const lowerQuery = query.toLowerCase();
    return await db.projects
      .filter((p) => p.name.toLowerCase().includes(lowerQuery))
      .toArray();
  }

  /**
   * عدد المشاريع المخزنة محلياً
   */
  async count(): Promise<number> {
    return await db.projects.count();
  }
}

// ─── Singleton Instance ───
export const projectRepository = new ProjectRepository();
