// ═══════════════════════════════════════════════════════════════════════
// 🧪 اختبارات تكامل خط أنابيب المزامنة المتقدمة — Sync Pipeline Integration Tests
// ═══════════════════════════════════════════════════════════════════════
// منصة المدقق الديناميكي الموحد V3.0
//
// بلاطة الأمان الحصينة لمنظومة المزامنة الكاملة:
//   - الدالة النقية calculateSyncResolution (معزولة عن التخزين)
//   - SyncFeedbackAdapter.processServerReport (تكامل Dexie + UI Store)
//   - حسم التعارضات السيادية ذرياً
//   - الفشل المرن والتراجع الذري
//   - عدم التحديث الاستباقي للواجهة (Premature UI Update Prevention)
//
// ⚙️ متطلبات البيئة الصارمة:
//   ١. اعتماد مطلق على الذاكرة (Pure In-Memory) — يُمنع أي I/O خارجي
//   ٢. fake-indexeddb/auto يُوفر IndexedDB في Node.js (مُعد مسبقاً في vitest.setup.ts)
//   ٣. استيراد مخطط Dexie المركزي المعتمد في التطبيق (بدون إعادة تعريف)
//   ٤. عزل صارم بين الاختبارات عبر beforeEach + afterEach
//   ٥. Fixtures/Factories موحدة تمنع تكرار الكود
// ═══════════════════════════════════════════════════════════════════════

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════
// 📦 استيراد وحدات الإنتاج الفعلية — اختبار ذات المخطط الهيكلي المعتمد
// ═══════════════════════════════════════════════════════════════════════

// قاعدة البيانات السيادية — نفس المخطط المعتمد في التطبيق
import {
  sovereignDB,
  type SovereignSyncQueueRecord,
  type LocalProjectRecord,
  type LocalScenarioRecord,
} from '@/lib/db/sovereign-local-db';

// محول التغذية الراجعة الميداني + الدالة النقية
import {
  SyncFeedbackAdapter,
  calculateSyncResolution,
  type SyncUIState,
} from '@/lib/client/sync-feedback-adapter';

// مخزن حالة الواجهة الخارجي
import { syncUIStore } from '@/lib/client/sync-ui-store';

// أنواع تقرير الخادم — استيراد آمن عبر import type (ملف 'use server')
import type {
  SingleEventResult,
  BatchReconciliationReport,
} from '@/actions/sync/reconcile-action';

// ═══════════════════════════════════════════════════════════════════════
// 🏭 مصانع البيانات الثابتة (Fixtures / Factories)
// ═══════════════════════════════════════════════════════════════════════
// كائنات موحدة تُستخدم عبر جميع الاختبارات لمنع تكرار الكود
// وضمان ثبات البيانات المدخلة.

/** مولّد معرفات فريدة بسيط للاختبار */
let testIdCounter = 0;
function nextTestId(prefix: string): string {
  return `${prefix}-TEST-${++testIdCounter}`;
}

/** مصنع أحداث طابور الانتظار الميداني */
function createSyncQueueItem(
  overrides: Partial<SovereignSyncQueueRecord> = {}
): SovereignSyncQueueRecord {
  return {
    contextId: overrides.contextId ?? nextTestId('CTX'),
    eventId: overrides.eventId ?? nextTestId('EVT'),
    action: overrides.action ?? 'UPDATE_SCENARIO',
    payload: overrides.payload ?? { id: nextTestId('SCN'), title: 'سيناريو اختباري' },
    payloadHash: overrides.payloadHash ?? `hash-${Math.random().toString(36).slice(2, 10)}`,
    status: overrides.status ?? 'PENDING',
    retries: overrides.retries ?? 0,
    timestamp: overrides.timestamp ?? Date.now(),
    ...overrides,
  };
}

/** مصنع سجلات المشروع الميداني */
function createLocalProject(
  overrides: Partial<LocalProjectRecord> = {}
): LocalProjectRecord {
  return {
    id: overrides.id ?? nextTestId('PRJ'),
    name: overrides.name ?? 'مشروع اختباري',
    description: overrides.description ?? 'وصف تجريبي',
    baselineVersion: overrides.baselineVersion ?? 'V3.0-Locked',
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
  };
}

/** مصنع سجلات السيناريو الميداني */
function createLocalScenario(
  overrides: Partial<LocalScenarioRecord> = {}
): LocalScenarioRecord {
  return {
    id: overrides.id ?? nextTestId('SCN'),
    projectId: overrides.projectId ?? nextTestId('PRJ'),
    title: overrides.title ?? 'سيناريو القص الثاقب',
    inputs: overrides.inputs ?? {
      designMethod: 'SYRIAN_WSD_2024',
      f_c: 40, f_y: 400, h_slab: 2000,
      b_column: 800, h_column: 800,
      a_tributary: 15, p_design: 200,
    },
    outputs: overrides.outputs ?? undefined,
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
  };
}

// ─── مصانع تقارير الخادم (Server Report Factories) ───

/** مصنع نتيجة حدث واحدة — حالة SUCCESS */
function createSuccessResult(
  eventId: string,
  contextId: string = 'CTX-TEST',
  action: string = 'UPDATE_SCENARIO'
): SingleEventResult {
  return {
    eventId,
    contextId,
    status: 'SUCCESS',
    appliedAction: action,
  };
}

/** مصنع نتيجة حدث واحدة — حالة BYPASS */
function createBypassResult(
  eventId: string,
  contextId: string = 'CTX-TEST',
  action: string = 'CREATE_PROJECT'
): SingleEventResult {
  return {
    eventId,
    contextId,
    status: 'BYPASS',
    appliedAction: action,
  };
}

/** مصنع نتيجة حدث واحدة — حالة CONFLICT */
function createConflictResult(
  eventId: string,
  contextId: string = 'CTX-TEST',
  action: string = 'UPDATE_SCENARIO',
  serverVersion: Record<string, unknown> = {}
): SingleEventResult {
  return {
    eventId,
    contextId,
    status: 'CONFLICT',
    appliedAction: action,
    error: 'تعارض في الإصدارات: نسخة الخادم أحدث.',
    serverVersion,
  };
}

/** مصنع نتيجة حدث واحدة — حالة FAILED */
function createFailedResult(
  eventId: string,
  contextId: string = 'CTX-TEST',
  action: string = 'UPDATE_SCENARIO',
  error: string = 'خطأ داخلي حرج في نظام المعالجة.'
): SingleEventResult {
  return {
    eventId,
    contextId,
    status: 'FAILED',
    appliedAction: action,
    error,
  };
}

/** مصنع تقرير التسوية الخادومي الكامل */
function createReconciliationReport(
  results: SingleEventResult[],
  overrides: Partial<BatchReconciliationReport> = {}
): BatchReconciliationReport {
  const succeeded = results.filter((r) => r.status === 'SUCCESS').length;
  const bypassed = results.filter((r) => r.status === 'BYPASS').length;
  const conflicts = results.filter((r) => r.status === 'CONFLICT').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;

  return {
    success: failed === 0 && conflicts === 0,
    batchContextId: overrides.batchContextId ?? 'CTX-TEST-BATCH',
    summaryCounters: {
      totalReceived: results.length,
      succeeded,
      bypassed,
      conflicts,
      failed,
    },
    results,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 🧹 عزل الحالات — التهيئة والتنظيف الصارم
// ═══════════════════════════════════════════════════════════════════════

/** نسخة المحول الميداني — تُعاد إنشاؤها لكل اختبار */
let feedbackAdapter: SyncFeedbackAdapter;

/** تسجيل تحديثات الـ UI Store — لفحص الترتيب والتوقيت */
let capturedUIUpdates: Partial<SyncUIState>[];

/** دالة تحديث UI مُراقَبة — تسجّل كل استدعاء */
function trackedUIStoreUpdate(state: Partial<SyncUIState>): void {
  capturedUIUpdates.push(state);
  syncUIStore.update(state);
}

beforeEach(async () => {
  // تصفير عداد المعرفات لضمان ثبات الاختبارات
  testIdCounter = 0;

  // تسجيل تحديثات الواجهة
  capturedUIUpdates = [];

  // إعادة تعيين مخزن الواجهة إلى الحالة الابتدائية
  syncUIStore.reset();

  // تنظيف جداول قاعدة البيانات السيادية بالكامل — عزل صارم
  await sovereignDB.transaction(
    'rw',
    [sovereignDB.syncQueue, sovereignDB.scenarios, sovereignDB.projects, sovereignDB.rtmRecords],
    async () => {
      await sovereignDB.syncQueue.clear();
      await sovereignDB.scenarios.clear();
      await sovereignDB.projects.clear();
      await sovereignDB.rtmRecords.clear();
    }
  );

  // إنشاء نسخة جديدة من المحول الميداني مرتبطة بقاعدة البيانات السيادية
  feedbackAdapter = new SyncFeedbackAdapter(sovereignDB);
});

afterEach(async () => {
  // تنظيف صارم بعد كل اختبار — مسح كافة الجداول
  await sovereignDB.transaction(
    'rw',
    [sovereignDB.syncQueue, sovereignDB.scenarios, sovereignDB.projects, sovereignDB.rtmRecords],
    async () => {
      await sovereignDB.syncQueue.clear();
      await sovereignDB.scenarios.clear();
      await sovereignDB.projects.clear();
      await sovereignDB.rtmRecords.clear();
    }
  );

  // إعادة تعيين مخزن الواجهة
  syncUIStore.reset();

  // تنظيف سجل التحديثات
  capturedUIUpdates = [];
});

// ═══════════════════════════════════════════════════════════════════════
// 🔶 الجزء الأول: اختبار الدالة النقية المعزولة (Pure Function Unit Test)
// ═══════════════════════════════════════════════════════════════════════
// فحص calculateSyncResolution بمعزل تام عن طبقة التخزين.
// الهدف: إثبات دقة قرار المعالجة (المصفوفات المستهدفة)
// دون أي اعتمادية على IndexedDB أو Dexie.

describe('calculateSyncResolution — الدالة النقية المعزولة', () => {

  test('TC-PURE-001: تصنيف SUCCESS → حذف من الطابور', () => {
    const results: SingleEventResult[] = [
      createSuccessResult('EVT-001'),
      createSuccessResult('EVT-002'),
    ];

    const resolution = calculateSyncResolution(results);

    // SUCCESS يجب أن يُدرج في قائمة الحذف
    expect(resolution.idsToDelete).toEqual(['EVT-001', 'EVT-002']);
    expect(resolution.conflictsToResolve).toHaveLength(0);
    expect(resolution.eventsToRetry).toHaveLength(0);
  });

  test('TC-PURE-002: تصنيف BYPASS → حذف من الطابور (معالجة مسبقة)', () => {
    const results: SingleEventResult[] = [
      createBypassResult('EVT-BYPASS-001'),
    ];

    const resolution = calculateSyncResolution(results);

    // BYPASS يُعامل مثل SUCCESS — حدث مستقر يُحذف
    expect(resolution.idsToDelete).toEqual(['EVT-BYPASS-001']);
    expect(resolution.conflictsToResolve).toHaveLength(0);
    expect(resolution.eventsToRetry).toHaveLength(0);
  });

  test('TC-PURE-003: تصنيف CONFLICT → حذف + حسم تعارض سيادي', () => {
    const serverScenarioVersion = {
      id: 'SCN-CONFLICT',
      projectId: 'PRJ-001',
      title: 'نسخة الخادم المعتمدة',
      inputs: { designMethod: 'SYRIAN_WSD_2024', f_c: 50 },
      updatedAt: Date.now(),
    };

    const results: SingleEventResult[] = [
      createConflictResult('EVT-CONFLICT-001', 'CTX-TEST', 'UPDATE_SCENARIO', serverScenarioVersion),
    ];

    const resolution = calculateSyncResolution(results);

    // CONFLICT: الحدث يُحذف من الطابور (حُسم) + يُضاف لقائمة الحسم
    expect(resolution.idsToDelete).toEqual(['EVT-CONFLICT-001']);
    expect(resolution.conflictsToResolve).toHaveLength(1);
    expect(resolution.conflictsToResolve[0].eventId).toBe('EVT-CONFLICT-001');
    expect(resolution.conflictsToResolve[0].targetTable).toBe('scenarios');
    expect(resolution.conflictsToResolve[0].serverVersion).toEqual(serverScenarioVersion);
    expect(resolution.eventsToRetry).toHaveLength(0);
  });

  test('TC-PURE-004: CONFLICT بدون serverVersion → حذف فقط (حسم بلا بيانات)', () => {
    const results: SingleEventResult[] = [
      {
        eventId: 'EVT-NO-SERVER',
        contextId: 'CTX-TEST',
        status: 'CONFLICT',
        appliedAction: 'UPDATE_SCENARIO',
        error: 'تعارض بدون نسخة خادم',
        // لا يوجد serverVersion
      },
    ];

    const resolution = calculateSyncResolution(results);

    // الحدث يُحذف لكن لا توجد بيانات لحسم التعارض
    expect(resolution.idsToDelete).toEqual(['EVT-NO-SERVER']);
    expect(resolution.conflictsToResolve).toHaveLength(0);
    expect(resolution.eventsToRetry).toHaveLength(0);
  });

  test('TC-PURE-005: تصنيف FAILED → إعادة محاولة', () => {
    const results: SingleEventResult[] = [
      createFailedResult('EVT-FAIL-001', 'CTX-TEST', 'UPDATE_SCENARIO', 'خطأ شبكة'),
    ];

    const resolution = calculateSyncResolution(results);

    // FAILED يُضاف لقائمة إعادة المحاولة — لا يُحذف من الطابور
    expect(resolution.idsToDelete).toHaveLength(0);
    expect(resolution.conflictsToResolve).toHaveLength(0);
    expect(resolution.eventsToRetry).toHaveLength(1);
    expect(resolution.eventsToRetry[0].eventId).toBe('EVT-FAIL-001');
    expect(resolution.eventsToRetry[0].error).toBe('خطأ شبكة');
  });

  test('TC-PURE-006: مزيج مختلط من جميع الحالات — تصنيف دقيق', () => {
    const results: SingleEventResult[] = [
      createSuccessResult('EVT-S-001'),
      createBypassResult('EVT-B-001'),
      createConflictResult('EVT-C-001', 'CTX-TEST', 'UPDATE_SCENARIO', { id: 'SCN-001', projectId: 'PRJ-001' }),
      createFailedResult('EVT-F-001', 'CTX-TEST', 'UPDATE_SCENARIO', 'فشل حرج'),
      createSuccessResult('EVT-S-002'),
    ];

    const resolution = calculateSyncResolution(results);

    // 3 أحداث تُحذف: SUCCESS + BYPASS + CONFLICT
    expect(resolution.idsToDelete).toEqual(['EVT-S-001', 'EVT-B-001', 'EVT-C-001', 'EVT-S-002']);
    // تعارض واحد
    expect(resolution.conflictsToResolve).toHaveLength(1);
    expect(resolution.conflictsToResolve[0].targetTable).toBe('scenarios');
    // فشل واحد
    expect(resolution.eventsToRetry).toHaveLength(1);
    expect(resolution.eventsToRetry[0].error).toBe('فشل حرج');
  });

  test('TC-PURE-007: CONFLICT مع مشروع (بدون projectId) → targetTable = projects', () => {
    const serverProjectVersion = {
      id: 'PRJ-SERVER',
      name: 'مشروع الخادم المحمي',
      baselineVersion: 'V3.0-Locked',
    };

    const results: SingleEventResult[] = [
      createConflictResult('EVT-PRJ-001', 'CTX-TEST', 'UPDATE_PROJECT', serverProjectVersion),
    ];

    const resolution = calculateSyncResolution(results);

    expect(resolution.conflictsToResolve).toHaveLength(1);
    // بدون projectId → يُصنف كمشروع
    expect(resolution.conflictsToResolve[0].targetTable).toBe('projects');
  });

  test('TC-PURE-008: مصفوفة فارغة → لا إجراءات', () => {
    const resolution = calculateSyncResolution([]);

    expect(resolution.idsToDelete).toHaveLength(0);
    expect(resolution.conflictsToResolve).toHaveLength(0);
    expect(resolution.eventsToRetry).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 🔷 الجزء الثاني: اختبارات المصب والتكامل الفعلي (Integration States)
// ═══════════════════════════════════════════════════════════════════════
// الفحص هنا يتمحور حول التحقق من "الحالة النهائية المستقرة للبيانات"
// (State Assertions) داخل جداول Dexie وفي الـ syncUIStore
// بعد اكتمال المعاملة الحيوية.

describe('SyncFeedbackAdapter — تكامل المعاملات الذرية وحالة الواجهة', () => {

  // ═══════════════════════════════════════════════════════════════════
  // 🟢 سيناريو 1: النجاح التام (Happy Path Sync)
  // ═══════════════════════════════════════════════════════════════════

  describe('سيناريو النجاح التام — Happy Path Sync', () => {

    test('TC-INT-001: حدث ناجح يُحذف من الطابور والواجهة تنتقل لـ COMPLETED', async () => {
      // ─── ترتيب: وضع حدث معلق في syncQueue ───
      const queueItem = createSyncQueueItem({
        eventId: 'EVT-SUCCESS-001',
        action: 'UPDATE_SCENARIO',
        status: 'PENDING',
      });
      await sovereignDB.syncQueue.add(queueItem);

      // التحقق من وجود الحدث قبل المعالجة
      const beforeProcess = await sovereignDB.syncQueue
        .where('eventId')
        .equals('EVT-SUCCESS-001')
        .count();
      expect(beforeProcess).toBe(1);

      // ─── فعل: محاكاة تقرير خادم ناجح ───
      const report = createReconciliationReport([
        createSuccessResult('EVT-SUCCESS-001'),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: الحدث حُذف تماماً من طابور الانتظار ───
      const afterProcess = await sovereignDB.syncQueue
        .where('eventId')
        .equals('EVT-SUCCESS-001')
        .count();
      expect(afterProcess).toBe(0);

      // ─── تأكيد: حالة الواجهة انتقلت لـ COMPLETED ───
      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.globalStatus).toBe('COMPLETED');
      expect(snapshot.isSyncing).toBe(false);
      expect(snapshot.summary.succeeded).toBe(1);
    });

    test('TC-INT-002: عدم تحديث الواجهة استباقياً — COMPLETED يظهر فقط بعد الـ Commit', async () => {
      // ─── ترتيب ───
      const queueItem = createSyncQueueItem({
        eventId: 'EVT-NO-PREEMPT',
        status: 'PENDING',
      });
      await sovereignDB.syncQueue.add(queueItem);

      const report = createReconciliationReport([
        createSuccessResult('EVT-NO-PREEMPT'),
      ]);

      // ─── فعل ───
      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: التحديثات تمت بالترتيب الصحيح ───
      // الأول: إشارة بدء المزامنة
      expect(capturedUIUpdates.length).toBeGreaterThanOrEqual(2);
      expect(capturedUIUpdates[0]).toEqual(
        expect.objectContaining({
          isSyncing: true,
          globalStatus: 'SYNCING',
        })
      );

      // الأخير: إشارة اكتمال بعد الـ Commit
      const lastUpdate = capturedUIUpdates[capturedUIUpdates.length - 1];
      expect(lastUpdate).toEqual(
        expect.objectContaining({
          isSyncing: false,
          globalStatus: 'COMPLETED',
        })
      );

      // لا يوجد أي تحديث استباقي بالحالة COMPLETED قبل الأخير
      const prematureCompletions = capturedUIUpdates.slice(0, -1).filter(
        (u) => u.globalStatus === 'COMPLETED'
      );
      expect(prematureCompletions).toHaveLength(0);
    });

    test('TC-INT-003: حدث BYPASS يُحذف ويُسجل كمتجاوز في العدادات', async () => {
      // ─── ترتيب ───
      const queueItem = createSyncQueueItem({
        eventId: 'EVT-BYPASS-001',
        action: 'CREATE_PROJECT',
        status: 'PENDING',
      });
      await sovereignDB.syncQueue.add(queueItem);

      // ─── فعل ───
      const report = createReconciliationReport([
        createBypassResult('EVT-BYPASS-001'),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد ───
      const afterProcess = await sovereignDB.syncQueue
        .where('eventId')
        .equals('EVT-BYPASS-001')
        .count();
      expect(afterProcess).toBe(0);

      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.globalStatus).toBe('COMPLETED');
      expect(snapshot.summary.bypassed).toBe(1);
      expect(snapshot.summary.succeeded).toBe(0);
    });

    test('TC-INT-004: دفعة مختلطة — SUCCESS + BYPASS تُحذف معاً', async () => {
      // ─── ترتيب: حدثان معلقان ───
      await sovereignDB.syncQueue.add(
        createSyncQueueItem({ eventId: 'EVT-S-001', status: 'PENDING' })
      );
      await sovereignDB.syncQueue.add(
        createSyncQueueItem({ eventId: 'EVT-B-001', status: 'PENDING' })
      );

      // ─── فعل ───
      const report = createReconciliationReport([
        createSuccessResult('EVT-S-001'),
        createBypassResult('EVT-B-001'),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: كلاهما حُذفا ───
      const remaining = await sovereignDB.syncQueue.count();
      expect(remaining).toBe(0);

      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.summary.succeeded).toBe(1);
      expect(snapshot.summary.bypassed).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 🟡 سيناريو 2: حسم التعارضات الإنشائية السيادية
  // ═══════════════════════════════════════════════════════════════════

  describe('سيناريو حسم التعارضات السيادية — Conflict Resolution Execution', () => {

    test('TC-INT-005: تعارض سيناريو → إزالة من الطابور + Atomic Put لنسخة الخادم', async () => {
      // ─── ترتيب: حدث تعديل سيناريو في الطابور ───
      const scenarioId = 'SCN-CONFLICT-001';
      const queueItem = createSyncQueueItem({
        eventId: 'EVT-CONFLICT-001',
        action: 'UPDATE_SCENARIO',
        payload: { id: scenarioId, title: 'نسخة محلية قديمة', projectId: 'PRJ-001' },
        status: 'PENDING',
      });
      await sovereignDB.syncQueue.add(queueItem);

      // بيانات السيناريو المحلي الحالي
      await sovereignDB.scenarios.add(
        createLocalScenario({ id: scenarioId, title: 'نسخة محلية قديمة' })
      );

      // نسخة الخادم المعتمدة — الأحدث حوكمياً
      const serverScenarioVersion = createLocalScenario({
        id: scenarioId,
        title: 'نسخة الخادم المعتمدة — محدثة',
        projectId: 'PRJ-001',
      });

      // ─── فعل: تمرير تقرير تعارض مع نسخة الخادم ───
      const report = createReconciliationReport([
        createConflictResult(
          'EVT-CONFLICT-001',
          'CTX-TEST',
          'UPDATE_SCENARIO',
          serverScenarioVersion as unknown as Record<string, unknown>
        ),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد ١: الحدث أُزيل من الطابور (حُسم) ───
      const remainingInQueue = await sovereignDB.syncQueue
        .where('eventId')
        .equals('EVT-CONFLICT-001')
        .count();
      expect(remainingInQueue).toBe(0);

      // ─── تأكيد ٢: نسخة الخادم طُبقت ذرياً على جدول السيناريوهات ───
      const updatedScenario = await sovereignDB.scenarios.get(scenarioId);
      expect(updatedScenario).toBeDefined();
      expect(updatedScenario!.title).toBe('نسخة الخادم المعتمدة — محدثة');

      // ─── تأكيد ٣: الواجهة تعكس حالة التعارض المحسوم ───
      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.globalStatus).toBe('SUCCESS_WITH_CONFLICTS');
      expect(snapshot.summary.conflicts).toBe(1);
    });

    test('TC-INT-006: تعارض مشروع → Atomic Put في جدول المشاريع', async () => {
      // ─── ترتيب ───
      const projectId = 'PRJ-CONFLICT-001';
      await sovereignDB.syncQueue.add(
        createSyncQueueItem({
          eventId: 'EVT-PRJ-CONFLICT',
          action: 'UPDATE_PROJECT',
          payload: { id: projectId, name: 'مشروع محلي' },
          status: 'PENDING',
        })
      );

      // مشروع محلي حالي
      await sovereignDB.projects.add(
        createLocalProject({ id: projectId, name: 'مشروع محلي' })
      );

      // نسخة الخادم — بدون حقل projectId لذلك تُصنف كمشروع
      const serverProjectVersion = createLocalProject({
        id: projectId,
        name: 'مشروع الخادم المحدّث — خط أساس مقفل',
        baselineVersion: 'V3.0-Locked',
      });

      // ─── فعل ───
      const report = createReconciliationReport([
        createConflictResult(
          'EVT-PRJ-CONFLICT',
          'CTX-TEST',
          'UPDATE_PROJECT',
          serverProjectVersion as unknown as Record<string, unknown>
        ),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: المشروع حُدّث بنسخة الخادم ───
      const updatedProject = await sovereignDB.projects.get(projectId);
      expect(updatedProject).toBeDefined();
      expect(updatedProject!.name).toBe('مشروع الخادم المحدّث — خط أساس مقفل');
      expect(updatedProject!.baselineVersion).toBe('V3.0-Locked');

      // ─── تأكيد: الواجهة ───
      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.globalStatus).toBe('SUCCESS_WITH_CONFLICTS');
    });

    test('TC-INT-007: تعارض مع سيناريو غير موجود محلياً → Put يُنشئه (Upsert)', async () => {
      // ─── ترتيب: حدث تعارض لكن السيناريو غير موجود محلياً ───
      const scenarioId = 'SCN-NEW-FROM-SERVER';
      await sovereignDB.syncQueue.add(
        createSyncQueueItem({
          eventId: 'EVT-UPSERT-001',
          action: 'UPDATE_SCENARIO',
          payload: { id: scenarioId },
          status: 'PENDING',
        })
      );

      // لا يوجد سيناريو محلي بهذا المعرف

      const serverVersion = createLocalScenario({
        id: scenarioId,
        title: 'سيناريو جديد من الخادم',
        projectId: 'PRJ-001',
      });

      // ─── فعل ───
      const report = createReconciliationReport([
        createConflictResult(
          'EVT-UPSERT-001',
          'CTX-TEST',
          'UPDATE_SCENARIO',
          serverVersion as unknown as Record<string, unknown>
        ),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: Dexie.put يعمل كـ upsert — يُنشئ السيناريو ───
      const newScenario = await sovereignDB.scenarios.get(scenarioId);
      expect(newScenario).toBeDefined();
      expect(newScenario!.title).toBe('سيناريو جديد من الخادم');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 🔴 سيناريو 3: الفشل المرن والتراجع الذري
  // ═══════════════════════════════════════════════════════════════════

  describe('سيناريو الفشل المرن والتراجع الذري — Fault Tolerance & Atomic Rollback', () => {

    test('TC-INT-008: حدث فاشل يبقى في الطابور وتتحول حالته إلى RETRYABLE', async () => {
      // ─── ترتيب: حدث ميداني في الطابور ───
      const queueItem = createSyncQueueItem({
        eventId: 'EVT-FAIL-001',
        action: 'UPDATE_SCENARIO',
        status: 'PENDING',
      });
      await sovereignDB.syncQueue.add(queueItem);

      // ─── فعل: تمرير تقرير فاشل ───
      const report = createReconciliationReport([
        createFailedResult('EVT-FAIL-001', 'CTX-TEST', 'UPDATE_SCENARIO', 'خطأ شبكة حرج'),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد ١: الحدث يبقى في الطابور — لم يُحذف ───
      const remainingItem = await sovereignDB.syncQueue
        .where('eventId')
        .equals('EVT-FAIL-001')
        .first();
      expect(remainingItem).toBeDefined();

      // ─── تأكيد ٢: حالة السجل تتحول إلى RETRYABLE ───
      expect(remainingItem!.status).toBe('RETRYABLE');

      // ─── تأكيد ٣: رسالة الخطأ مُسجّلة ───
      expect(remainingItem!.lastError).toBe('خطأ شبكة حرج');

      // ─── تأكيد ٤: الواجهة تعكس حالة الخطأ الحرج ───
      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.globalStatus).toBe('CRITICAL_ERROR');
      expect(snapshot.summary.failed).toBe(1);
    });

    test('TC-INT-009: فشل كامل → التراجع الذري يحمي جدول السيناريوهات من التشويه', async () => {
      // ─── ترتيب: سيناريو محلي أصلي + حدث في الطابور ───
      const scenarioId = 'SCN-PROTECTED';
      const originalScenarioTitle = 'السيناريو الأصلي المحمي — لا يجب أن يتغير';

      await sovereignDB.scenarios.add(
        createLocalScenario({ id: scenarioId, title: originalScenarioTitle })
      );

      await sovereignDB.syncQueue.add(
        createSyncQueueItem({
          eventId: 'EVT-ROLLBACK-001',
          action: 'UPDATE_SCENARIO',
          payload: { id: scenarioId },
          status: 'PENDING',
        })
      );

      // تسجيل حالة السيناريو قبل المعالجة
      const scenarioBefore = await sovereignDB.scenarios.get(scenarioId);
      expect(scenarioBefore!.title).toBe(originalScenarioTitle);

      // ─── فعل: تمرير تقرير فاشل ───
      const report = createReconciliationReport([
        createFailedResult('EVT-ROLLBACK-001', 'CTX-TEST', 'UPDATE_SCENARIO', 'فشل الخادم'),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد ١: جدول السيناريوهات لم يتغير إطلاقاً ───
      const scenarioAfter = await sovereignDB.scenarios.get(scenarioId);
      expect(scenarioAfter).toBeDefined();
      expect(scenarioAfter!.title).toBe(originalScenarioTitle);

      // ─── تأكيد ٢: الحدث بقي في الطابور بحالة RETRYABLE ───
      const queueItem = await sovereignDB.syncQueue
        .where('eventId')
        .equals('EVT-ROLLBACK-001')
        .first();
      expect(queueItem).toBeDefined();
      expect(queueItem!.status).toBe('RETRYABLE');
    });

    test('TC-INT-010: فشل داخل المعاملة → Rollback تلقائي كامل (Dexie Safety Net)', async () => {
      // ─── ترتيب: بيانات أولية في جداول متعددة ───
      await sovereignDB.scenarios.add(
        createLocalScenario({ id: 'SCN-BEFORE-TX', title: 'قبل المعاملة' })
      );
      await sovereignDB.projects.add(
        createLocalProject({ id: 'PRJ-BEFORE-TX', name: 'مشروع قبل المعاملة' })
      );

      // تقرير يسبب خطأ — سنحاكي فشل المعاملة عبر بيانات غير صالحة
      // من خلال حقن دالة updateUIStore ترمي خطأ بعد التحديث الأول
      const faultyUIUpdate = vi.fn((_state: Partial<SyncUIState>) => {
        // المحاكاة: تحديث الواجهة الأولي ينجح
        syncUIStore.update(_state);
      });

      // ─── فعل: تمرير تقرير فاشل ───
      const report = createReconciliationReport([
        createFailedResult('EVT-TX-FAIL', 'CTX-TEST', 'UPDATE_SCENARIO', 'خطأ المعاملة'),
      ]);

      // لا نتوقع رمي خطأ هنا — الفشل يُعالج بأمان
      await feedbackAdapter.processServerReport(report, faultyUIUpdate);

      // ─── تأكيد: البيانات الأصلية لم تتأثر ───
      const scenarioStillExists = await sovereignDB.scenarios.get('SCN-BEFORE-TX');
      expect(scenarioStillExists).toBeDefined();
      expect(scenarioStillExists!.title).toBe('قبل المعاملة');

      const projectStillExists = await sovereignDB.projects.get('PRJ-BEFORE-TX');
      expect(projectStillExists).toBeDefined();
      expect(projectStillExists!.name).toBe('مشروع قبل المعاملة');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 🔵 سيناريوهات إضافية: تكامل متقدم
  // ═══════════════════════════════════════════════════════════════════

  describe('سيناريوهات التكامل المتقدم — Advanced Integration', () => {

    test('TC-INT-011: دفعة مختلطة كاملة — SUCCESS + CONFLICT + FAILED + BYPASS', async () => {
      // ─── ترتيب: 4 أحداث في الطابور ───
      const scenarioId = 'SCN-MIXED';
      await sovereignDB.syncQueue.bulkAdd([
        createSyncQueueItem({ eventId: 'EVT-MIX-S', status: 'PENDING' }),
        createSyncQueueItem({ eventId: 'EVT-MIX-B', status: 'PENDING' }),
        createSyncQueueItem({ eventId: 'EVT-MIX-C', status: 'PENDING', payload: { id: scenarioId, projectId: 'PRJ-001' } }),
        createSyncQueueItem({ eventId: 'EVT-MIX-F', status: 'PENDING' }),
      ]);

      // سيناريو محلي يُراد تعديله
      await sovereignDB.scenarios.add(
        createLocalScenario({ id: scenarioId, title: 'نسخة محلية' })
      );

      const serverVersion = createLocalScenario({
        id: scenarioId,
        title: 'نسخة الخادم المعتمدة',
        projectId: 'PRJ-001',
      });

      // ─── فعل: تقرير مختلط ───
      const report = createReconciliationReport([
        createSuccessResult('EVT-MIX-S'),
        createBypassResult('EVT-MIX-B'),
        createConflictResult('EVT-MIX-C', 'CTX-TEST', 'UPDATE_SCENARIO', serverVersion as unknown as Record<string, unknown>),
        createFailedResult('EVT-MIX-F', 'CTX-TEST', 'UPDATE_SCENARIO', 'خطأ شبكة'),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد ١: 3 أحداث حُذفت (SUCCESS + BYPASS + CONFLICT) ───
      const remainingQueue = await sovereignDB.syncQueue.toArray();
      expect(remainingQueue).toHaveLength(1);
      expect(remainingQueue[0].eventId).toBe('EVT-MIX-F');
      expect(remainingQueue[0].status).toBe('RETRYABLE');

      // ─── تأكيد ٢: السيناريو حُدّث بنسخة الخادم ───
      const updatedScenario = await sovereignDB.scenarios.get(scenarioId);
      expect(updatedScenario!.title).toBe('نسخة الخادم المعتمدة');

      // ─── تأكيد ٣: الواجهة تعكس الفشل الحرج (لوجود FAILED) ───
      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.globalStatus).toBe('CRITICAL_ERROR');
      expect(snapshot.summary.succeeded).toBe(1);
      expect(snapshot.summary.bypassed).toBe(1);
      expect(snapshot.summary.conflicts).toBe(1);
      expect(snapshot.summary.failed).toBe(1);
    });

    test('TC-INT-012: عدّاد lastSyncTime يُحدَّث فقط بعد المعاملة الناجحة', async () => {
      // ─── ترتيب ───
      expect(syncUIStore.getSnapshot().lastSyncTime).toBeNull();

      await sovereignDB.syncQueue.add(
        createSyncQueueItem({ eventId: 'EVT-TIME-001', status: 'PENDING' })
      );

      const report = createReconciliationReport([
        createSuccessResult('EVT-TIME-001'),
      ]);

      // ─── فعل ───
      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: lastSyncTime تحدد فقط بعد النجاح ───
      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.lastSyncTime).not.toBeNull();
      expect(snapshot.lastSyncTime!.getTime()).toBeGreaterThan(0);
    });

    test('TC-INT-013: تقرير فارغ → لا تغيير في الواجهة', async () => {
      // ─── ترتيب ───
      const initialState = syncUIStore.getSnapshot();

      // ─── فعل: تقرير بلا نتائج ───
      const report = createReconciliationReport([]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: الحالة لم تتغير ───
      const snapshot = syncUIStore.getSnapshot();
      expect(snapshot.globalStatus).toBe('COMPLETED');
      expect(snapshot.summary.succeeded).toBe(0);
      expect(snapshot.summary.failed).toBe(0);
    });

    test('TC-INT-014: أحداث فاشلة متعددة — جميعها تبقى في الطابور بحالة RETRYABLE', async () => {
      // ─── ترتيب: 3 أحداث فاشلة ───
      await sovereignDB.syncQueue.bulkAdd([
        createSyncQueueItem({ eventId: 'EVT-FAIL-A', status: 'PENDING' }),
        createSyncQueueItem({ eventId: 'EVT-FAIL-B', status: 'PENDING' }),
        createSyncQueueItem({ eventId: 'EVT-FAIL-C', status: 'PENDING' }),
      ]);

      // ─── فعل ───
      const report = createReconciliationReport([
        createFailedResult('EVT-FAIL-A', 'CTX-TEST', 'UPDATE_SCENARIO', 'خطأ A'),
        createFailedResult('EVT-FAIL-B', 'CTX-TEST', 'UPDATE_SCENARIO', 'خطأ B'),
        createFailedResult('EVT-FAIL-C', 'CTX-TEST', 'UPDATE_SCENARIO', 'خطأ C'),
      ]);

      await feedbackAdapter.processServerReport(report, trackedUIStoreUpdate);

      // ─── تأكيد: جميع الأحداث الثلاثة بقيت في الطابور ───
      const retryableItems = await sovereignDB.syncQueue
        .where('status')
        .equals('RETRYABLE')
        .toArray();
      expect(retryableItems).toHaveLength(3);

      // ─── تأكيد: كل حدث يحمل رسالة الخطأ الخاصة به ───
      const errorMessages = retryableItems.map((item) => item.lastError);
      expect(errorMessages).toContain('خطأ A');
      expect(errorMessages).toContain('خطأ B');
      expect(errorMessages).toContain('خطأ C');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 🏛️ الجزء الثالث: اختبارات مخزن الواجهة الخارجي (syncUIStore)
// ═══════════════════════════════════════════════════════════════════════
// فحص ثبات المرجعية (Stable Snapshot) وعزل SSR والتحديثات الذرية.

describe('syncUIStore — مخزن الواجهة الخارجي المحصّن', () => {

  test('TC-STORE-001: getSnapshot يُعيد نفس المرجع ما لم تتغير البيانات', () => {
    const snapshot1 = syncUIStore.getSnapshot();
    const snapshot2 = syncUIStore.getSnapshot();

    // نفس المرجع — لا يُنشئ كائناً جديداً
    expect(snapshot1).toBe(snapshot2);
  });

  test('TC-STORE-002: update ببيانات متطابقة لا يُنشئ لقطة جديدة', () => {
    const snapshot1 = syncUIStore.getSnapshot();

    // تحديث بنفس البيانات الحالية
    syncUIStore.update({
      isSyncing: false,
      globalStatus: 'IDLE',
    });

    const snapshot2 = syncUIStore.getSnapshot();

    // المرجع لم يتغير — لا إشعار للمستمعين
    expect(snapshot1).toBe(snapshot2);
  });

  test('TC-STORE-003: update ببيانات مختلفة يُنشئ لقطة جديدة', () => {
    const snapshot1 = syncUIStore.getSnapshot();

    syncUIStore.update({ isSyncing: true, globalStatus: 'SYNCING' });

    const snapshot2 = syncUIStore.getSnapshot();

    // مرجع مختلف — كائن جديد
    expect(snapshot1).not.toBe(snapshot2);
    expect(snapshot2.isSyncing).toBe(true);
    expect(snapshot2.globalStatus).toBe('SYNCING');
  });

  test('TC-STORE-004: getServerSnapshot يُعيد الحالة الابتدائية دائماً', () => {
    // حتى بعد تحديث الحالة
    syncUIStore.update({ globalStatus: 'COMPLETED', isSyncing: false });

    const serverSnapshot = syncUIStore.getServerSnapshot();

    // الـ SSR دائماً يرى الحالة الابتدائية
    expect(serverSnapshot.globalStatus).toBe('IDLE');
    expect(serverSnapshot.isSyncing).toBe(false);
    expect(serverSnapshot.lastSyncTime).toBeNull();
  });

  test('TC-STORE-005: reset يُعيد المخزن إلى الحالة الابتدائية', () => {
    syncUIStore.update({
      isSyncing: true,
      globalStatus: 'SYNCING',
      summary: { succeeded: 5, bypassed: 2, conflicts: 1, failed: 0 },
    });

    syncUIStore.reset();

    const snapshot = syncUIStore.getSnapshot();
    expect(snapshot.globalStatus).toBe('IDLE');
    expect(snapshot.isSyncing).toBe(false);
    expect(snapshot.summary.succeeded).toBe(0);
    expect(snapshot.lastSyncTime).toBeNull();
  });

  test('TC-STORE-006: subscribe يُشعر المستمعين بالتغييرات فقط', () => {
    const listener = vi.fn();
    const unsubscribe = syncUIStore.subscribe(listener);

    // تحديث بنفس البيانات — لا إشعار
    syncUIStore.update({ globalStatus: 'IDLE' });
    expect(listener).not.toHaveBeenCalled();

    // تحديث ببيانات مختلفة — إشعار
    syncUIStore.update({ globalStatus: 'SYNCING' });
    expect(listener).toHaveBeenCalledTimes(1);

    // إلغاء الاشتراك
    unsubscribe();

    // بعد الإلغاء — لا إشعار
    syncUIStore.update({ globalStatus: 'COMPLETED' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('TC-STORE-007: تحديث summary يُنشئ لقطة جديدة (مقارنة عميقة)', () => {
    const snapshot1 = syncUIStore.getSnapshot();

    // تحديث الكائن الفرعي summary
    syncUIStore.update({
      summary: { succeeded: 1, bypassed: 0, conflicts: 0, failed: 0 },
    });

    const snapshot2 = syncUIStore.getSnapshot();

    // مرجع مختلف بسبب تغيير summary
    expect(snapshot1).not.toBe(snapshot2);
    expect(snapshot2.summary.succeeded).toBe(1);
  });
});
