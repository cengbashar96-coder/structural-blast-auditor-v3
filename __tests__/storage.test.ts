// ═══════════════════════════════════════════════════════════════════════
// اختبارات نظام التخزين الفرعي المتكامل - storage.test.ts
// منصة المدقق الديناميكي الموحد V3.0
// التحقق من: Zod Validation / Transaction Safety / Repository Isolation / Sync Queue
// ═══════════════════════════════════════════════════════════════════════

import { describe, test, expect, beforeEach } from 'vitest';
import { db } from '../src/lib/storage/db';
import {
  ProjectRecordSchema,
  ScenarioRecordSchema,
  RtmRecordSchema,
  SyncQueueRecordSchema,
  validateBeforeWrite,
  RTM_TEST_CASE_IDS,
} from '../src/lib/storage/storageSchemas';
import { projectRepository } from '../src/lib/storage/repositories/ProjectRepository';
import { scenarioRepository } from '../src/lib/storage/repositories/ScenarioRepository';
import { rtmRepository } from '../src/lib/storage/repositories/RtmRepository';
import { syncQueueRepository } from '../src/lib/storage/repositories/SyncQueueRepository';

// ─── تنظيف قاعدة البيانات قبل كل اختبار ───
beforeEach(async () => {
  await db.nukeDatabase();
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الأول: اختبارات التحقق الصارم عبر Zod (Schema Validation)
// ═══════════════════════════════════════════════════════════════════════

describe('Storage Schema Validation (Zod Lock)', () => {
  test('TC-STORAGE-001: ProjectRecordSchema rejects missing fields', () => {
    const invalidRecord = { name: 'Test' }; // missing id, timestamps
    const result = ProjectRecordSchema.safeParse(invalidRecord);
    expect(result.success).toBe(false);
  });

  test('TC-STORAGE-002: ProjectRecordSchema rejects short name (< 3 chars)', () => {
    const invalidRecord = {
      id: crypto.randomUUID(),
      name: 'AB', // أقل من 3 أحرف
      baselineVersion: 'V3.0-Locked',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const result = ProjectRecordSchema.safeParse(invalidRecord);
    expect(result.success).toBe(false);
  });

  test('TC-STORAGE-003: ProjectRecordSchema accepts valid project', () => {
    const validRecord = {
      id: crypto.randomUUID(),
      name: 'مشروع اختبار التحصين',
      baselineVersion: 'V3.0-Locked',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const result = ProjectRecordSchema.safeParse(validRecord);
    expect(result.success).toBe(true);
  });

  test('TC-STORAGE-004: RtmRecordSchema enforces valid testCaseId', () => {
    const invalidRecord = {
      id: crypto.randomUUID(),
      scenarioId: crypto.randomUUID(),
      testCaseId: 'INVALID-TC', // غير موجود في القائمة المقفلة
      associatedRequirement: 'FR-3.2.9',
      status: 'PASSED',
      timestamp: Date.now(),
    };
    const result = RtmRecordSchema.safeParse(invalidRecord);
    expect(result.success).toBe(false);
  });

  test('TC-STORAGE-005: RtmRecordSchema accepts all valid testCaseIds', () => {
    for (const tcId of RTM_TEST_CASE_IDS) {
      const validRecord = {
        id: crypto.randomUUID(),
        scenarioId: crypto.randomUUID(),
        testCaseId: tcId,
        associatedRequirement: 'FR-3.2.9',
        status: 'PASSED' as const,
        timestamp: Date.now(),
      };
      const result = RtmRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
    }
  });

  test('TC-STORAGE-006: SyncQueueRecordSchema enforces valid action', () => {
    const invalidRecord = {
      id: crypto.randomUUID(),
      action: 'HACK_DATABASE', // غير موجود
      payloadType: 'PROJECT',
      payload: {},
      status: 'PENDING',
      retryCount: 0,
      timestamp: Date.now(),
    };
    const result = SyncQueueRecordSchema.safeParse(invalidRecord);
    expect(result.success).toBe(false);
  });

  test('TC-STORAGE-007: validateBeforeWrite throws on invalid data', () => {
    expect(() =>
      validateBeforeWrite(ProjectRecordSchema, { name: 'X' }, 'test-context')
    ).toThrow('[STORAGE-VALIDATION-ERROR]');
  });

  test('TC-STORAGE-008: ScenarioRecordSchema enforces StructuralInputSchema for inputs', () => {
    const invalidScenario = {
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      title: 'سيناريو غير صالح',
      inputs: {
        designMethod: 'INVALID_METHOD', // غير موجود
        f_c: 40,
        f_y: 400,
        h_slab: 1200,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const result = ScenarioRecordSchema.safeParse(invalidScenario);
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الثاني: اختبارات مستودع المشاريع (ProjectRepository)
// ═══════════════════════════════════════════════════════════════════════

describe('ProjectRepository - Local-First Write', () => {
  test('TC-PROJ-001: Create project and verify IndexedDB write', async () => {
    const project = await projectRepository.createProject(
      'مشروع تحصين القيادة',
      'تدقيق إنشائي لمقر القيادة'
    );

    expect(project.id).toBeDefined();
    expect(project.name).toBe('مشروع تحصين القيادة');
    expect(project.baselineVersion).toBe('V3.0-Locked');

    // التحقق من الكاتبة الفعلية في IndexedDB
    const fetched = await db.projects.get(project.id);
    expect(fetched).toBeDefined();
    expect(fetched!.name).toBe('مشروع تحصين القيادة');
  });

  test('TC-PROJ-002: Create project auto-registers sync queue entry', async () => {
    const project = await projectRepository.createProject('مشروع اختبار');

    // التحقق من تسجيل العملية في طابور المزامنة
    const pendingItems = await syncQueueRepository.getPendingItems();
    expect(pendingItems.length).toBeGreaterThan(0);

    const syncEntry = pendingItems.find(
      (item) => item.action === 'CREATE_PROJECT'
    );
    expect(syncEntry).toBeDefined();
    expect(syncEntry!.payloadType).toBe('PROJECT');
  });

  test('TC-PROJ-003: Get all projects sorted by createdAt', async () => {
    await projectRepository.createProject('المشروع أ');
    await new Promise(r => setTimeout(r, 2)); // ضمان طابع زمني مختلف
    await projectRepository.createProject('المشروع ب');
    await new Promise(r => setTimeout(r, 2));
    await projectRepository.createProject('المشروع ج');

    const projects = await projectRepository.getAllProjects();
    expect(projects.length).toBe(3);
    // الأحدث أولاً
    expect(projects[0].name).toBe('المشروع ج');
  });

  test('TC-PROJ-004: Update project and verify sync registration', async () => {
    const project = await projectRepository.createProject('المشروع الأصلي');

    const updated = await projectRepository.updateProject(project.id, {
      name: 'المشروع المحدث',
      description: 'تم التحديث',
    });

    expect(updated.name).toBe('المشروع المحدث');
    expect(updated.description).toBe('تم التحديث');

    // تحقق من وجود UPDATE_PROJECT في الطابور
    const pending = await syncQueueRepository.getPendingItems();
    const updateEntry = pending.find(
      (item) => item.action === 'UPDATE_PROJECT'
    );
    expect(updateEntry).toBeDefined();
  });

  test('TC-PROJ-005: Delete project cascades to scenarios and RTM', async () => {
    const project = await projectRepository.createProject('للحذف');
    const scenario = await scenarioRepository.createScenario(
      project.id,
      'سيناريو للحذف',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 1200,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      }
    );
    await rtmRepository.logRtmEntry(
      scenario.id,
      'TC-STRUCT-001',
      'FR-3.2.9',
      'PASSED'
    );

    // تنفيذ الحذف المتسلسل
    await projectRepository.deleteProject(project.id);

    // التحقق من حذف المشروع
    const deletedProject = await db.projects.get(project.id);
    expect(deletedProject).toBeUndefined();

    // التحقق من حذف السيناريو المرتبط
    const deletedScenario = await db.scenarios.get(scenario.id);
    expect(deletedScenario).toBeUndefined();

    // التحقق من وجود DELETE_PROJECT في الطابور
    const pending = await syncQueueRepository.getPendingItems();
    const deleteEntry = pending.find(
      (item) => item.action === 'DELETE_PROJECT'
    );
    expect(deleteEntry).toBeDefined();
  });

  test('TC-PROJ-006: Delete non-existent project throws error', async () => {
    await expect(
      projectRepository.deleteProject(crypto.randomUUID())
    ).rejects.toThrow('[STORAGE-ERROR]');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الثالث: اختبارات مستودع السيناريوهات (ScenarioRepository)
// ═══════════════════════════════════════════════════════════════════════

describe('ScenarioRepository - Engine-Storage Bridge', () => {
  test('TC-SCEN-001: Create scenario with valid StructuralInput', async () => {
    const project = await projectRepository.createProject('مشروع السيناريو');

    const scenario = await scenarioRepository.createScenario(
      project.id,
      'سيناريو القص الثاقب',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 1200,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 710.55,
        m_dynamic: 400,
        n_dynamic: 3000,
      }
    );

    expect(scenario.projectId).toBe(project.id);
    expect(scenario.inputs.designMethod).toBe('SYRIAN_WSD_2024');
    expect(scenario.inputs.f_c).toBe(40);
    expect(scenario.outputs).toBeUndefined(); // لم يتم الحساب بعد
  });

  test('TC-SCEN-002: Create scenario with non-existent project throws error', async () => {
    await expect(
      scenarioRepository.createScenario(
        crypto.randomUUID(),
        'يتيم',
        {
          designMethod: 'SYRIAN_WSD_2024',
          f_c: 40,
          f_y: 400,
          h_slab: 1200,
          b_column: 800,
          h_column: 800,
          a_tributary: 15,
          p_design: 200,
          m_dynamic: 200,
          n_dynamic: 5000,
        }
      )
    ).rejects.toThrow('[STORAGE-INTEGRITY]');
  });

  test('TC-SCEN-003: Save structural output and verify svgColor', async () => {
    const project = await projectRepository.createProject('مشروع المخرجات');
    const scenario = await scenarioRepository.createScenario(
      project.id,
      'اختبار المخرجات',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 2000,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      }
    );

    // حفظ مخرجات المحرك الإنشائي
    const updated = await scenarioRepository.saveStructuralOutput(scenario.id, {
      status: 'SUCCESS',
      d_eff: 1950,
      b_0: 11000,
      eccentricity: 40,
      e_limit: 333.33,
      svgColor: 'GREEN',
      rho_final: 0.0025,
      v_actual: 0.12,
      v_cd: 1.58,
    });

    expect(updated.outputs).toBeDefined();
    expect(updated.outputs!.status).toBe('SUCCESS');
    expect(updated.outputs!.svgColor).toBe('GREEN');
    expect(updated.outputs!.calculatedAt).toBeGreaterThan(0);
  });

  test('TC-SCEN-004: Update inputs resets outputs (must recalculate)', async () => {
    const project = await projectRepository.createProject('مشروع إعادة الحساب');
    const scenario = await scenarioRepository.createScenario(
      project.id,
      'إعادة تعيين',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 2000,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      }
    );

    // حفظ مخرجات
    await scenarioRepository.saveStructuralOutput(scenario.id, {
      status: 'SUCCESS',
      d_eff: 1950,
      b_0: 11000,
      eccentricity: 40,
      e_limit: 333.33,
      svgColor: 'GREEN',
      rho_final: 0.0025,
    });

    // تحديث المدخلات — يجب إعادة تعيين المخرجات
    const updated = await scenarioRepository.updateScenarioInputs(scenario.id, {
      designMethod: 'SYRIAN_WSD_2024',
      f_c: 25,
      f_y: 240,
      h_slab: 800,
      b_column: 400,
      h_column: 400,
      a_tributary: 20,
      p_design: 500,
      m_dynamic: 300,
      n_dynamic: 2000,
    });

    expect(updated.inputs.f_c).toBe(25);
    expect(updated.outputs).toBeUndefined(); // تم إعادة التعيين
  });

  test('TC-SCEN-005: Get latest computed scenario', async () => {
    const project = await projectRepository.createProject('مشروع الأحدث');
    const s1 = await scenarioRepository.createScenario(
      project.id,
      'سيناريو 1',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 2000,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      }
    );
    const s2 = await scenarioRepository.createScenario(
      project.id,
      'سيناريو 2',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 35,
        f_y: 400,
        h_slab: 1500,
        b_column: 600,
        h_column: 600,
        a_tributary: 12,
        p_design: 300,
        m_dynamic: 250,
        n_dynamic: 3000,
      }
    );

    // فقط s2 محسوب
    await scenarioRepository.saveStructuralOutput(s2.id, {
      status: 'SUCCESS',
      d_eff: 1450,
      b_0: 8200,
      eccentricity: 83.33,
      e_limit: 250,
      svgColor: 'GREEN',
      rho_final: 0.0025,
    });

    const latest = await scenarioRepository.getLatestComputedScenario(project.id);
    expect(latest).toBeDefined();
    expect(latest!.id).toBe(s2.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الرابع: اختبارات مستودع RTM (RtmRepository)
// ═══════════════════════════════════════════════════════════════════════

describe('RtmRepository - Requirements Traceability', () => {
  test('TC-RTM-001: Log RTM entry and verify storage', async () => {
    const project = await projectRepository.createProject('مشروع RTM');
    const scenario = await scenarioRepository.createScenario(
      project.id,
      'سيناريو RTM',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 1200,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      }
    );

    const rtm = await rtmRepository.logRtmEntry(
      scenario.id,
      'TC-STRUCT-001',
      'FR-3.2.9',
      'PASSED'
    );

    expect(rtm.testCaseId).toBe('TC-STRUCT-001');
    expect(rtm.associatedRequirement).toBe('FR-3.2.9');
    expect(rtm.status).toBe('PASSED');

    // تحقق من طابور المزامنة
    const pending = await syncQueueRepository.getPendingItems();
    const rtmSync = pending.find((item) => item.action === 'LOG_RTM');
    expect(rtmSync).toBeDefined();
  });

  test('TC-RTM-002: Coverage report calculation', async () => {
    const project = await projectRepository.createProject('تغطية المتطلبات');
    const scenario = await scenarioRepository.createScenario(
      project.id,
      'تغطية',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 1200,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      }
    );

    // تسجيل 3 نتائج: 2 PASSED + 1 FAILED
    await rtmRepository.logRtmEntry(scenario.id, 'TC-STRUCT-001', 'FR-3.2.9', 'PASSED');
    await rtmRepository.logRtmEntry(scenario.id, 'TC-STRUCT-002', 'FR-3.2.10', 'PASSED');
    await rtmRepository.logRtmEntry(scenario.id, 'TC-BLAST-001', 'FR-2.1.1', 'FAILED', 'خطأ في حساب الاختراق');

    const report = await rtmRepository.getCoverageReport();
    expect(report.total).toBe(3);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(1);
    expect(report.passRate).toBeCloseTo(66.67, 1);
  });

  test('TC-RTM-003: RTM for orphan scenario throws error', async () => {
    await expect(
      rtmRepository.logRtmEntry(
        crypto.randomUUID(),
        'TC-STRUCT-001',
        'FR-3.2.9',
        'PASSED'
      )
    ).rejects.toThrow('[STORAGE-INTEGRITY]');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الخامس: اختبارات طابور المزامنة (SyncQueueRepository)
// ═══════════════════════════════════════════════════════════════════════

describe('SyncQueueRepository - Deferred Sync', () => {
  test('TC-SYNC-001: Queue status reflects pending operations', async () => {
    // إنشاء مشروع يولد عملية في الطابور
    await projectRepository.createProject('مشروع المزامنة');

    const status = await syncQueueRepository.getQueueStatus();
    expect(status.pending).toBeGreaterThan(0);
  });

  test('TC-SYNC-002: Retry failed items resets status to PENDING', async () => {
    const project = await projectRepository.createProject('مشروع الفشل');

    // محاكاة فشل المزامنة
    const pendingItems = await syncQueueRepository.getPendingItems();
    const syncId = pendingItems[0].id;
    await syncQueueRepository.updateStatus(syncId, 'FAILED', 'Network timeout');

    // التحقق من وجود عنصر فاشل
    const failedBefore = await syncQueueRepository.getFailedItems();
    expect(failedBefore.length).toBeGreaterThan(0);

    // إعادة المحاولة
    const retriedCount = await syncQueueRepository.retryFailedItems();
    expect(retriedCount).toBeGreaterThan(0);

    // العنصر الآن في حالة PENDING
    const pendingAfterRetry = await syncQueueRepository.getPendingItems();
    expect(pendingAfterRetry.find((i) => i.id === syncId)).toBeDefined();
  });

  test('TC-SYNC-003: Cleanup removes old completed items', async () => {
    await projectRepository.createProject('مشروع التنظيف');

    // محاكاة عنصر مكتمل قديم
    const pendingItems = await syncQueueRepository.getPendingItems();
    if (pendingItems.length > 0) {
      await syncQueueRepository.updateStatus(pendingItems[0].id, 'COMPLETED');
    }

    // إدخال عنصر مكتمل بعمر أكبر من 24 ساعة (محاكاة)
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      action: 'CREATE_PROJECT',
      payloadType: 'PROJECT',
      payload: { test: true },
      status: 'COMPLETED',
      retryCount: 0,
      maxRetries: 3,
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 ساعة مضت
    });

    const cleaned = await syncQueueRepository.cleanupCompleted(24 * 60 * 60 * 1000);
    expect(cleaned).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم السادس: اختبارات سلامة المعاملات (Transaction Integrity)
// ═══════════════════════════════════════════════════════════════════════

describe('Transaction Integrity - Database Stats', () => {
  test('TC-TXN-001: Database stats reflect all operations', async () => {
    // إنشاء مشروع
    const project = await projectRepository.createProject('مشروع الإحصائيات');

    // إنشاء سيناريو
    await scenarioRepository.createScenario(
      project.id,
      'سيناريو الإحصائيات',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40,
        f_y: 400,
        h_slab: 1200,
        b_column: 800,
        h_column: 800,
        a_tributary: 15,
        p_design: 200,
        m_dynamic: 200,
        n_dynamic: 5000,
      }
    );

    const stats = await db.getStats();
    expect(stats.projects).toBe(1);
    expect(stats.scenarios).toBe(1);
    expect(stats.pendingSync).toBeGreaterThan(0); // CREATE_PROJECT + CREATE_SCENARIO
  });

  test('TC-TXN-002: NukeDatabase clears all stores', async () => {
    await projectRepository.createProject('للمسح');
    await db.nukeDatabase();

    const stats = await db.getStats();
    expect(stats.projects).toBe(0);
    expect(stats.scenarios).toBe(0);
    expect(stats.rtmRecords).toBe(0);
    expect(stats.pendingSync).toBe(0);
  });
});
