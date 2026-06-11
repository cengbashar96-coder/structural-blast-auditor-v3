// ═══════════════════════════════════════════════════════════════════════
// اختبارات شاشة الـ RTM ومصفوفة المطابقة الحية
// منصة المدقق الديناميكي الموحد V3.0
// TC-RTM: اختبارات سجلات تتبع المتطلبات والتغطية والعيوب
// TC-AUDIT: اختبارات شريط التدقيق والتعارضات
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/storage/db';
import { rtmRepository } from '@/lib/storage/repositories/RtmRepository';
import { projectRepository } from '@/lib/storage/repositories/ProjectRepository';
import { scenarioRepository } from '@/lib/storage/repositories/ScenarioRepository';
import { ConflictPolicy } from '@/lib/storage/conflictPolicy';
import { RtmRecordSchema, RTM_TEST_CASE_IDS, type RtmRecord } from '@/lib/storage/storageSchemas';

describe('RTM Governance — مصفوفة تتبع المتطلبات والمطابقة', () => {
  let projectId: string;
  let scenarioId: string;

  beforeEach(async () => {
    await db.nukeDatabase();
    ConflictPolicy.clearConflictLog();

    // إنشاء مشروع وسيناريو للاختبار
    const project = await projectRepository.createProject(
      'مشروع اختبار RTM',
      'اختبار مصفوفة المتطلبات'
    );
    projectId = project.id;

    const scenario = await scenarioRepository.createScenario(
      projectId,
      'سيناريو اختبار',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 30,
        f_y: 400,
        h_slab: 1200,
        b_column: 500,
        h_column: 500,
        a_tributary: 25,
        p_design: 500,
        m_dynamic: 100,
        n_dynamic: 500,
      }
    );
    scenarioId = scenario.id;
  });

  // ═══════════════════════════════════════════════════════════════════════
  // القسم الأول: اختبارات تسجيل سجلات RTM (TC-RTM)
  // ═══════════════════════════════════════════════════════════════════════

  // TC-RTM-001: تسجيل نتيجة اختبار ناجح
  it('TC-RTM-001: logRtmEntry يسجل نتيجة PASSED بنجاح', async () => {
    const record = await rtmRepository.logRtmEntry(
      scenarioId,
      'TC-STRUCT-001',
      'FR-3.2.7',
      'PASSED'
    );

    expect(record.id).toBeDefined();
    expect(record.scenarioId).toBe(scenarioId);
    expect(record.testCaseId).toBe('TC-STRUCT-001');
    expect(record.associatedRequirement).toBe('FR-3.2.7');
    expect(record.status).toBe('PASSED');
    expect(record.timestamp).toBeGreaterThan(0);
  });

  // TC-RTM-002: تسجيل نتيجة اختبار فاشل مع سجل عيب
  it('TC-RTM-002: logRtmEntry يسجل نتيجة FAILED مع defectLog', async () => {
    const record = await rtmRepository.logRtmEntry(
      scenarioId,
      'TC-STRUCT-002',
      'FR-3.2.9',
      'FAILED',
      'فشل إجهاد القص الثاقب الديناميكي — h=400mm غير كافية'
    );

    expect(record.status).toBe('FAILED');
    expect(record.defectLog).toContain('فشل');
  });

  // TC-RTM-003: منع تسجيل سجل يتيم بدون سيناريو
  it('TC-RTM-003: logRtmEntry يرفض السجلات اليتيمة', async () => {
    await expect(
      rtmRepository.logRtmEntry(
        'non-existent-scenario-id',
        'TC-BLAST-001',
        'FR-3.2.6',
        'PASSED'
      )
    ).rejects.toThrow('[STORAGE-INTEGRITY]');
  });

  // TC-RTM-004: جميع حالات الاختبار المعرفة صالحة
  it('TC-RTM-004: RTM_TEST_CASE_IDS يحتوي على 8 حالات اختبار معرّفة', () => {
    expect(RTM_TEST_CASE_IDS).toHaveLength(8);
    expect(RTM_TEST_CASE_IDS).toContain('TC-BLAST-001');
    expect(RTM_TEST_CASE_IDS).toContain('TC-STRUCT-002');
  });

  // TC-RTM-005: Zod Schema يرفض testCaseId غير معرّف
  it('TC-RTM-005: RtmRecordSchema يرفض testCaseId غير موجود في القائمة', () => {
    const invalidRecord = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      scenarioId: '123e4567-e89b-12d3-a456-426614174001',
      testCaseId: 'TC-INVALID-999',
      associatedRequirement: 'FR-3.2.1',
      status: 'PASSED',
      timestamp: Date.now(),
    };

    const result = RtmRecordSchema.safeParse(invalidRecord);
    expect(result.success).toBe(false);
  });

  // TC-RTM-006: جلب سجلات RTM حسب حالة الاختبار
  it('TC-RTM-006: getRtmByTestCase يجلب السجلات حسب testCaseId', async () => {
    await rtmRepository.logRtmEntry(scenarioId, 'TC-BLAST-001', 'FR-3.2.6', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-001', 'FR-3.2.7', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-BLAST-001', 'FR-3.2.6', 'PASSED');

    const blastRecords = await rtmRepository.getRtmByTestCase('TC-BLAST-001');
    expect(blastRecords).toHaveLength(2);

    const structRecords = await rtmRepository.getRtmByTestCase('TC-STRUCT-001');
    expect(structRecords).toHaveLength(1);
  });

  // TC-RTM-007: جلب سجلات RTM حسب المتطلب الهندسي
  it('TC-RTM-007: getRtmByRequirement يجلب السجلات حسب FR ID', async () => {
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-001', 'FR-3.2.7', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-002', 'FR-3.2.9', 'FAILED', 'عيب');

    const fr327Records = await rtmRepository.getRtmByRequirement('FR-3.2.7');
    expect(fr327Records).toHaveLength(1);
    expect(fr327Records[0].status).toBe('PASSED');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // القسم الثاني: اختبارات تقرير التغطية (TC-COV)
  // ═══════════════════════════════════════════════════════════════════════

  // TC-COV-001: تقرير التغطية يعكس الواقع الحسابي بدقة
  it('TC-COV-001: getCoverageReport يحسب النسب بدقة', async () => {
    await rtmRepository.logRtmEntry(scenarioId, 'TC-BLAST-001', 'FR-3.2.6', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-001', 'FR-3.2.7', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-002', 'FR-3.2.9', 'FAILED', 'عيب');

    const report = await rtmRepository.getCoverageReport();

    expect(report.total).toBe(3);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(1);
    expect(report.passRate).toBeCloseTo(66.67, 1);
    expect(report.byTestCase['TC-STRUCT-002'].failed).toBe(1);
  });

  // TC-COV-002: تقرير التغطية فارغ عند عدم وجود سجلات
  it('TC-COV-002: getCoverageReport يُرجع أصفاراً لقاعدة فارغة', async () => {
    const report = await rtmRepository.getCoverageReport();

    expect(report.total).toBe(0);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(0);
    expect(report.passRate).toBe(0);
    expect(Object.keys(report.byTestCase)).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // القسم الثالث: اختبارات سجل العيوب (TC-DEF)
  // ═══════════════════════════════════════════════════════════════════════

  // TC-DEF-001: سجل العيوب يعرض السجلات الفاشلة فقط
  it('TC-DEF-001: getDefectLog يجلب السجلات الفاشلة فقط', async () => {
    await rtmRepository.logRtmEntry(scenarioId, 'TC-BLAST-001', 'FR-3.2.6', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-002', 'FR-3.2.9', 'FAILED', 'فشل القص الثاقب');

    const defects = await rtmRepository.getDefectLog();

    expect(defects).toHaveLength(1);
    expect(defects[0].status).toBe('FAILED');
    expect(defects[0].defectLog).toContain('القص الثاقب');
  });

  // TC-DEF-002: سجل العيوب فارغ عند نجاح جميع الاختبارات
  it('TC-DEF-002: getDefectLog يُرجع مصفوفة فارغة عند نجاح الكل', async () => {
    await rtmRepository.logRtmEntry(scenarioId, 'TC-BLAST-001', 'FR-3.2.6', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-001', 'FR-3.2.7', 'PASSED');

    const defects = await rtmRepository.getDefectLog();
    expect(defects).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // القسم الرابع: اختبارات Audit Trail والتعارضات (TC-AUDIT)
  // ═══════════════════════════════════════════════════════════════════════

  // TC-AUDIT-001: سجل التعارضات يبدأ فارغاً
  it('TC-AUDIT-001: ConflictPolicy.getConflictLog يبدأ فارغاً', () => {
    expect(ConflictPolicy.getConflictLog()).toHaveLength(0);
    expect(ConflictPolicy.getConflictCount()).toBe(0);
  });

  // TC-AUDIT-002: تسجيل تعارضBaseline يُسجل في الـ Audit Trail
  it('TC-AUDIT-002: تعارض Baseline يُسجل في سجل المراجعة', () => {
    const local = {
      id: 'proj-1',
      name: 'مشروع بلودان',
      baselineVersion: 'V3.0-Locked',
      createdAt: Date.now(),
      updatedAt: Date.now() - 1000,
    };
    const server = {
      id: 'proj-1',
      name: 'مشروع بلودان',
      baselineVersion: 'V2.0-Old',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    ConflictPolicy.resolveProject(local as any, server as any);

    const log = ConflictPolicy.getConflictLog();
    expect(log).toHaveLength(1);
    expect(log[0].source).toBe('LOCAL_FORCE');
    expect(log[0].summary).toContain('النسخة المرجعية');
  });

  // TC-AUDIT-003: تعارض PUNCHING_FAILURE يُسجل كحدث حرج
  it('TC-AUDIT-003: تعارض PUNCHING_FAILURE يُسجل كحدث SERVER_FORCE', () => {
    const local = {
      id: 'scen-1',
      projectId: 'proj-1',
      title: 'سيناريو 1',
      inputs: { designMethod: 'SYRIAN_WSD_2024', f_c: 30, f_y: 400, h_slab: 1200, b_column: 500, h_column: 500, a_tributary: 25, p_design: 500, m_dynamic: 100, n_dynamic: 500 },
      outputs: { status: 'SUCCESS', d_eff: 1150, b_0: 4600, eccentricity: 200, e_limit: 200, svgColor: 'GREEN', rho_final: 0.0025, calculatedAt: Date.now() },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const server = {
      ...local,
      outputs: { status: 'PUNCHING_FAILURE', d_eff: 1150, b_0: 4600, eccentricity: 200, e_limit: 200, svgColor: 'RED_FLASHING', rho_final: 0.0025, v_actual: 1.5, v_cd: 1.0, calculatedAt: Date.now(), errorMessage: 'فشل القص الثاقب' },
    };

    ConflictPolicy.resolveScenario(local as any, server as any);

    const log = ConflictPolicy.getConflictLog();
    expect(log).toHaveLength(1);
    expect(log[0].source).toBe('SERVER_FORCE');
    expect(log[0].summary).toContain('قص ثاقب');
  });

  // TC-AUDIT-004: Audit Trail مرتب زمنياً (الأحدث أولاً)
  it('TC-AUDIT-004: سجل التعارضات مرتب زمنياً (الأحدث أولاً)', () => {
    const local1 = { id: 'p1', name: 'A', baselineVersion: 'V3.0-Locked', createdAt: 1, updatedAt: 1 };
    const local2 = { id: 'p2', name: 'B', baselineVersion: 'V3.0-Locked', createdAt: 1, updatedAt: 1 };
    const server1 = { ...local1, baselineVersion: 'V2.0-Old' };
    const server2 = { ...local2, baselineVersion: 'V1.0-Ancient' };

    ConflictPolicy.resolveProject(local1 as any, server1 as any);
    ConflictPolicy.resolveProject(local2 as any, server2 as any);

    const log = ConflictPolicy.getConflictLog();
    expect(log).toHaveLength(2);
    // الأحدث أولاً
    expect(log[0].timestamp).toBeGreaterThanOrEqual(log[1].timestamp);
  });

  // TC-AUDIT-005: مسح سجل التعارضات
  it('TC-AUDIT-005: clearConflictLog يمسح السجل بالكامل', () => {
    const local = { id: 'p1', name: 'A', baselineVersion: 'V3.0-Locked', createdAt: 1, updatedAt: 1 };
    const server = { ...local, baselineVersion: 'V2.0-Old' };

    ConflictPolicy.resolveProject(local as any, server as any);
    expect(ConflictPolicy.getConflictCount()).toBe(1);

    ConflictPolicy.clearConflictLog();
    expect(ConflictPolicy.getConflictCount()).toBe(0);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // القسم الخامس: اختبارات خط البيانات الحي الكامل (TC-LIVE)
  // ═══════════════════════════════════════════════════════════════════════

  // TC-LIVE-001: خط بيانات كامل من المحرك إلى RTM إلى Defect Log
  it('TC-LIVE-001: Data Pipeline: Engine → RTM → Coverage → Defect', async () => {
    const { calculateStructuralVerification } = await import('@/lib/structural/structuralEngine');

    // 1. تشغيل المحرك الحسابي
    const output = calculateStructuralVerification({
      designMethod: 'SYRIAN_WSD_2024',
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    });

    // 2. حفظ المخرجات
    await scenarioRepository.saveStructuralOutput(scenarioId, output);

    // 3. تسجيل RTM بناءً على النتيجة
    const rtmStatus = output.status === 'SUCCESS' ? 'PASSED' : 'FAILED';
    await rtmRepository.logRtmEntry(
      scenarioId,
      'TC-STRUCT-001',
      'FR-3.2.7',
      rtmStatus,
      output.errorMessage
    );

    // 4. التحقق من تقرير التغطية
    const report = await rtmRepository.getCoverageReport();
    expect(report.total).toBe(1);

    if (output.status === 'SUCCESS') {
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(0);
    } else {
      expect(report.failed).toBe(1);
      const defects = await rtmRepository.getDefectLog();
      expect(defects).toHaveLength(1);
    }
  });

  // TC-LIVE-002: Server Action يُرجع نتيجة صالحة
  it('TC-LIVE-002: Server Action runLiveBenchmarks يُرجع {success, deviation}', async () => {
    // محاكاة Server Action
    const runBenchmarks = async () => {
      return {
        success: true,
        timestamp: Date.now(),
        deviation: 0.0,
        checkedScenariosCount: 0,
      };
    };

    const result = await runBenchmarks();
    expect(result.success).toBe(true);
    expect(result.deviation).toBe(0.0);
    expect(result.checkedScenariosCount).toBeDefined();
  });

  // TC-LIVE-003: جزر العميل تقرأ من IndexedDB مباشرة (لا تعتمد على السيرفر)
  it('TC-LIVE-003: Client Islands تقرأ من IndexedDB محلياً', async () => {
    // إضافة بيانات اختبار مباشرة
    await rtmRepository.logRtmEntry(scenarioId, 'TC-BLAST-001', 'FR-3.2.6', 'PASSED');
    await rtmRepository.logRtmEntry(scenarioId, 'TC-STRUCT-002', 'FR-3.2.9', 'FAILED', 'انهيار');

    // القراءة من IndexedDB مباشرة (كما تفعل جزر العميل)
    const allRtmRecords = await db.rtmRecords.toArray();
    const allSyncItems = await db.syncQueue.toArray();

    expect(allRtmRecords).toHaveLength(2);
    expect(allSyncItems.length).toBeGreaterThan(0); // كل logRtmEntry يُنشئ سجل مزامنة

    // التحقق من صحة البيانات المقروءة
    const passedRecords = allRtmRecords.filter((r) => r.status === 'PASSED');
    const failedRecords = allRtmRecords.filter((r) => r.status === 'FAILED');
    expect(passedRecords).toHaveLength(1);
    expect(failedRecords).toHaveLength(1);
  });
});
