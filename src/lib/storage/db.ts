// ═══════════════════════════════════════════════════════════════════════
// طبقة تعريف قاعدة البيانات والـ Object Stores - db.ts
// منصة المدقق الديناميكي الموحد V3.0
// Dexie / IndexedDB — Offline-First Architecture
// مبادئ: Local-First Write + Locked Database Versioning + Repository Isolation
// ═══════════════════════════════════════════════════════════════════════

import Dexie, { type Table } from 'dexie';
import {
  ProjectRecord,
  ScenarioRecord,
  RtmRecord,
  SyncQueueRecord,
} from './storageSchemas';

/**
 * StructuralBlastDB — قاعدة البيانات المحلية المعزولة
 *
 * مبادئ التصميم الحاكمة:
 * ──────────────────────────
 * 1. كل Object Store مفهرس بحقول البحث الأساسية فقط (لا إفراط في الفهارس)
 * 2. Versioning مقفل: أي تعديل على البنية يستدعي version() جديد
 * 3. عزل كامل: لا وصول مباشر من الـ UI إلى الجداول — فقط عبر Repository Layer
 * 4. Transaction Safety: كل عملية كتابة ملفوفة بـ transaction لمنع الفساد
 */
export class StructuralBlastDB extends Dexie {
  // ─── الجداول الرئيسية (Object Stores) ───

  /** مشاريع التدقيق الإنشائي — الكيان الأعلى في التسلسل الهرمي */
  projects!: Table<ProjectRecord, string>;

  /** سيناريوهات التصميم والنتائج — مرتبطة بالمشروع عبر projectId */
  scenarios!: Table<ScenarioRecord, string>;

  /** سجلات تتبع المتطلبات (RTM Ledger) — المرجع الحاكم للجودة */
  rtmRecords!: Table<RtmRecord, string>;

  /** طابور المزامنة المؤجلة — يعمل فقط عند توفر الشبكة */
  syncQueue!: Table<SyncQueueRecord, string>;

  constructor() {
    super('StructuralBlastDB');

    // ─── الإصدار الأول: البنية الأساسية المقفلة (Locked Schema v1) ───
    //
    // فهارس البحث الحاكمة:
    //   projects   → id (PK), name (بحث بالاسم), baselineVersion (فلترة), createdAt (ترتيب)
    //   scenarios  → id (PK), projectId (ربط بالمشروع), designMethod (فلترة), createdAt (ترتيب)
    //   rtmRecords → id (PK), testCaseId (بحث مباشر), associatedRequirement (فلترة), status (فلترة)
    //   syncQueue  → id (PK), action (فلترة), status (مراقبة الطابور), timestamp (ترتيب)
    this.version(1).stores({
      projects: 'id, name, baselineVersion, createdAt',
      scenarios: 'id, projectId, designMethod, createdAt',
      rtmRecords: 'id, scenarioId, testCaseId, associatedRequirement, status',
      syncQueue: 'id, action, status, timestamp',
    });
  }

  /**
   * مسح كامل لقاعدة البيانات — للاستخدام في وضع التطوير فقط
   * ⚠️ يحذف جميع البيانات المحلية نهائياً
   */
  async nukeDatabase(): Promise<void> {
    await this.transaction('rw', [this.projects, this.scenarios, this.rtmRecords, this.syncQueue], async () => {
      await this.projects.clear();
      await this.scenarios.clear();
      await this.rtmRecords.clear();
      await this.syncQueue.clear();
    });
  }

  /**
   * إحصائيات قاعدة البيانات — للمراقبة والتشخيص
   */
  async getStats(): Promise<{
    projects: number;
    scenarios: number;
    rtmRecords: number;
    pendingSync: number;
  }> {
    const [projects, scenarios, rtmRecords, pendingSync] = await Promise.all([
      this.projects.count(),
      this.scenarios.count(),
      this.rtmRecords.count(),
      this.syncQueue.where('status').equals('PENDING').count(),
    ]);

    return { projects, scenarios, rtmRecords, pendingSync };
  }
}

// ─── Singleton Instance — نقطة الدخول الوحيدة لقاعدة البيانات ───
export const db = new StructuralBlastDB();
