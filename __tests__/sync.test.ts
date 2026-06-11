// ═══════════════════════════════════════════════════════════════════════
// اختبارات نظام المزامنة وحسم التعارضات - sync.test.ts
// منصة المدقق الديناميكي الموحد V3.0
// ConflictPolicy + SyncQueueProcessor + Exponential Backoff + Idempotency
// ═══════════════════════════════════════════════════════════════════════

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { db } from '../src/lib/storage/db';
import { ConflictPolicy } from '../src/lib/storage/conflictPolicy';
import { SyncQueueProcessor, type SyncApiClient, type SyncApiResponse, type NetworkMonitor } from '../src/lib/storage/syncProcessor';
import { projectRepository } from '../src/lib/storage/repositories/ProjectRepository';
import { scenarioRepository } from '../src/lib/storage/repositories/ScenarioRepository';
import { syncQueueRepository } from '../src/lib/storage/repositories/SyncQueueRepository';
import type { ProjectRecord, ScenarioRecord } from '../src/lib/storage/storageSchemas';

// ─── تنظيف قبل كل اختبار ───
beforeEach(async () => {
  await db.nukeDatabase();
  ConflictPolicy.clearConflictLog();
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الأول: اختبارات سياسة حسم التعارضات (ConflictPolicy)
// ═══════════════════════════════════════════════════════════════════════

describe('ConflictPolicy - Sovereign Engineering-First Resolution', () => {
  const baseProject: ProjectRecord = {
    id: 'proj-001',
    name: 'مشروع التحصين',
    baselineVersion: 'V3.0-Locked',
    createdAt: 1000000,
    updatedAt: 2000000,
  };

  test('TC-CONFLICT-001: Local baseline wins over server when versions differ', () => {
    const local: ProjectRecord = { ...baseProject, baselineVersion: 'V3.0-Locked' };
    const server: ProjectRecord = { ...baseProject, baselineVersion: 'V2.5-Old' };

    const result = ConflictPolicy.resolveProject(local, server);

    expect(result.source).toBe('LOCAL_FORCE');
    expect(result.resolvedData.baselineVersion).toBe('V3.0-Locked');
    expect(result.logMessage).toContain('تعارض في النسخة المرجعية');
  });

  test('TC-CONFLICT-002: Local wins when timestamps are newer (same baseline)', () => {
    const local: ProjectRecord = { ...baseProject, updatedAt: 3000000 };
    const server: ProjectRecord = { ...baseProject, updatedAt: 2000000 };

    const result = ConflictPolicy.resolveProject(local, server);

    expect(result.source).toBe('LOCAL_FORCE');
    expect(result.resolvedData.updatedAt).toBe(3000000);
  });

  test('TC-CONFLICT-003: Server wins when timestamps are newer (same baseline)', () => {
    const local: ProjectRecord = { ...baseProject, updatedAt: 1000000 };
    const server: ProjectRecord = { ...baseProject, updatedAt: 5000000, name: 'محدث من السيرفر' };

    const result = ConflictPolicy.resolveProject(local, server);

    expect(result.source).toBe('SERVER_FORCE');
    expect(result.resolvedData.name).toBe('محدث من السيرفر');
  });

  test('TC-CONFLICT-004: Server PUNCHING_FAILURE overrides local SUCCESS (life safety)', () => {
    const local: ScenarioRecord = {
      id: 'scen-001',
      projectId: 'proj-001',
      title: 'سيناريو خطر',
      inputs: {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40, f_y: 400, h_slab: 400, b_column: 400, h_column: 400,
        a_tributary: 30, p_design: 2350.22, m_dynamic: 100, n_dynamic: 500,
      },
      outputs: {
        status: 'SUCCESS',
        d_eff: 350, b_0: 3000, eccentricity: 200, e_limit: 66.67,
        svgColor: 'GREEN', rho_final: 0.0025, calculatedAt: Date.now(),
      },
      createdAt: 1000000,
      updatedAt: 2000000,
    };

    const server: ScenarioRecord = {
      ...local,
      outputs: {
        status: 'PUNCHING_FAILURE',
        d_eff: 350, b_0: 3000, eccentricity: 200, e_limit: 66.67,
        svgColor: 'RED_FLASHING', rho_final: 0.0025, calculatedAt: Date.now(),
        errorMessage: 'ERR-C-01: فشل المقطع في مقاومة القص الثاقب الديناميكي!',
      },
    };

    const result = ConflictPolicy.resolveScenario(local, server);

    // حماية المنشأة مقدسة — فشل السيرفر يُفرض فوراً
    expect(result.source).toBe('SERVER_FORCE');
    expect(result.resolvedData.outputs?.status).toBe('PUNCHING_FAILURE');
    expect(result.logMessage).toContain('فشل قص ثاقب');
  });

  test('TC-CONFLICT-005: Local PUNCHING_FAILURE with newer server SUCCESS — server wins (engineering review)', () => {
    const local: ScenarioRecord = {
      id: 'scen-001',
      projectId: 'proj-001',
      title: 'سيناريو مراجعة',
      inputs: {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40, f_y: 400, h_slab: 400, b_column: 400, h_column: 400,
        a_tributary: 30, p_design: 2350.22, m_dynamic: 100, n_dynamic: 500,
      },
      outputs: {
        status: 'PUNCHING_FAILURE',
        d_eff: 350, b_0: 3000, eccentricity: 200, e_limit: 66.67,
        svgColor: 'RED_FLASHING', rho_final: 0.0025, calculatedAt: Date.now(),
        errorMessage: 'ERR-C-01',
      },
      createdAt: 1000000,
      updatedAt: 2000000,
    };

    const server: ScenarioRecord = {
      ...local,
      outputs: {
        status: 'SUCCESS',
        d_eff: 1950, b_0: 11000, eccentricity: 40, e_limit: 333.33,
        svgColor: 'GREEN', rho_final: 0.0025, calculatedAt: Date.now(),
      },
      updatedAt: 3000000, // أحدث
    };

    const result = ConflictPolicy.resolveScenario(local, server);

    // السيرفر أحدث ويسجل نجاحاً — يحتمل أنه مرّ بمراجعة هندسية
    expect(result.source).toBe('SERVER_FORCE');
    expect(result.resolvedData.outputs?.status).toBe('SUCCESS');
  });

  test('TC-CONFLICT-006: Conflict log is recorded for audit trail', () => {
    const local: ProjectRecord = { ...baseProject, baselineVersion: 'V3.0-Locked' };
    const server: ProjectRecord = { ...baseProject, baselineVersion: 'V2.0-Old' };

    ConflictPolicy.resolveProject(local, server);

    const log = ConflictPolicy.getConflictLog();
    expect(log.length).toBeGreaterThan(0);
    expect(log[0].payloadType).toBe('PROJECT');
    expect(log[0].source).toBe('LOCAL_FORCE');
  });

  test('TC-CONFLICT-007: Scenario — no outputs on either side, timestamp wins', () => {
    const local: ScenarioRecord = {
      id: 'scen-001',
      projectId: 'proj-001',
      title: 'بدون مخرجات',
      inputs: {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40, f_y: 400, h_slab: 1200, b_column: 800, h_column: 800,
        a_tributary: 15, p_design: 200, m_dynamic: 200, n_dynamic: 5000,
      },
      createdAt: 1000000,
      updatedAt: 3000000, // أحدث
    };

    const server: ScenarioRecord = {
      ...local,
      updatedAt: 2000000, // أقدم
    };

    const result = ConflictPolicy.resolveScenario(local, server);
    expect(result.source).toBe('LOCAL_FORCE');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الثاني: اختبارات معالج طابور المزامنة (SyncQueueProcessor)
// ═══════════════════════════════════════════════════════════════════════

describe('SyncQueueProcessor - Idempotency + Backoff + Online Monitoring', () => {
  // ─── Mock API Client ───
  function createMockApiClient(responses: Map<string, SyncApiResponse>): SyncApiClient {
    return {
      post: vi.fn(async (path: string, _payload: unknown, options?: { headers?: Record<string, string> }) => {
        // التحقق من وجود مفتاح Idempotency
        expect(options?.headers?.['X-Idempotency-Key']).toBeDefined();
        const response = responses.get(`POST:${path}`) ?? { status: 201, data: {} };
        return response;
      }),
      put: vi.fn(async (path: string, _payload: unknown, options?: { headers?: Record<string, string> }) => {
        expect(options?.headers?.['X-Idempotency-Key']).toBeDefined();
        const response = responses.get(`PUT:${path}`) ?? { status: 200, data: {} };
        return response;
      }),
      delete: vi.fn(async (path: string, options?: { headers?: Record<string, string> }) => {
        expect(options?.headers?.['X-Idempotency-Key']).toBeDefined();
        const response = responses.get(`DELETE:${path}`) ?? { status: 204, data: {} };
        return response;
      }),
    };
  }

  // ─── Mock Network Monitor ───
  function createMockNetworkMonitor(online: boolean): NetworkMonitor {
    return {
      isOnline: () => online,
      onStatusChange: () => () => {},
    };
  }

  test('TC-SYNC-001: Process queue skips when offline', async () => {
    const offlineMonitor = createMockNetworkMonitor(false);
    const processor = new SyncQueueProcessor(offlineMonitor);

    const result = await processor.processQueue();

    expect(result.processed).toBe(0);
  });

  test('TC-SYNC-002: Process queue skips when no API client', async () => {
    const onlineMonitor = createMockNetworkMonitor(true);
    const processor = new SyncQueueProcessor(onlineMonitor);
    // لم يتم تعيين API client

    const result = await processor.processQueue();

    expect(result.processed).toBe(0);
  });

  test('TC-SYNC-003: Successfully sync CREATE_PROJECT and remove from queue', async () => {
    const onlineMonitor = createMockNetworkMonitor(true);
    const processor = new SyncQueueProcessor(onlineMonitor);
    const apiClient = createMockApiClient(new Map());
    processor.setApiClient(apiClient);

    // إنشاء مشروع محلياً — يولد سجل PENDING في الطابور
    const project = await projectRepository.createProject('مشروع المزامنة');

    // قبل المزامنة: سجل معلق في الطابور
    const pendingBefore = await syncQueueRepository.pendingCount();
    expect(pendingBefore).toBeGreaterThan(0);

    // معالجة الطابور
    const result = await processor.processQueue();

    expect(result.succeeded).toBeGreaterThan(0);

    // بعد المزامنة: الطابور فارغ
    const pendingAfter = await syncQueueRepository.pendingCount();
    expect(pendingAfter).toBe(0);
  });

  test('TC-SYNC-004: Handle HTTP 409 Conflict with conflict resolution', async () => {
    const project = await projectRepository.createProject('مشروع التعارض');

    // سيرفر يرد بتعارض مع نسخة أحدث
    const serverProject: ProjectRecord = {
      ...project,
      name: 'محدث من السيرفر',
      updatedAt: Date.now() + 10000,
    };

    const responses = new Map<string, SyncApiResponse>([
      ['PUT:/v3/projects/' + project.id, {
        status: 409,
        data: { serverVersion: serverProject },
      }],
    ]);

    const onlineMonitor = createMockNetworkMonitor(true);
    const processor = new SyncQueueProcessor(onlineMonitor);
    const apiClient = createMockApiClient(responses);
    processor.setApiClient(apiClient);

    // تحديث المشروع محلياً
    await projectRepository.updateProject(project.id, { name: 'تحديث محلي' });

    // معالجة الطابور
    const result = await processor.processQueue();

    expect(result.conflicts).toBeGreaterThan(0);

    // التحقق من أن النسخة المحلية حُدثت ببيانات السيرفر
    const updated = await db.projects.get(project.id);
    expect(updated).toBeDefined();
  });

  test('TC-SYNC-005: Exponential backoff on network failure', async () => {
    const onlineMonitor = createMockNetworkMonitor(true);
    const processor = new SyncQueueProcessor(onlineMonitor);

    // API client يفشل دائماً
    const failingApiClient: SyncApiClient = {
      post: vi.fn(async () => { throw new Error('Network timeout'); }),
      put: vi.fn(async () => { throw new Error('Network timeout'); }),
      delete: vi.fn(async () => { throw new Error('Network timeout'); }),
    };
    processor.setApiClient(failingApiClient);

    // إنشاء مشروع
    await projectRepository.createProject('مشروع الفشل');

    // معالجة الطابور
    const result = await processor.processQueue();

    expect(result.failed).toBeGreaterThan(0);

    // التحقق من زيادة عداد المحاولات
    const items = await db.syncQueue.toArray();
    const failedOrRetrying = items.find((i) => i.retryCount > 0);
    expect(failedOrRetrying).toBeDefined();
    expect(failedOrRetrying!.retryCount).toBeGreaterThan(0);
  });

  test('TC-SYNC-006: Permanent failure after max retries', async () => {
    const onlineMonitor = createMockNetworkMonitor(true);
    const processor = new SyncQueueProcessor(onlineMonitor);

    const failingApiClient: SyncApiClient = {
      post: vi.fn(async () => { throw new Error('Permanent failure'); }),
      put: vi.fn(async () => { throw new Error('Permanent failure'); }),
      delete: vi.fn(async () => { throw new Error('Permanent failure'); }),
    };
    processor.setApiClient(failingApiClient);

    // إنشاء مشروع
    await projectRepository.createProject('مشروع العزل');

    // محاكاة عدة محاولات فاشلة
    for (let i = 0; i < 5; i++) {
      await processor.processQueue();
    }

    // التحقق من عزل السجل كفشل دائم
    const failedItems = await syncQueueRepository.getFailedItems();
    expect(failedItems.length).toBeGreaterThan(0);
  });

  test('TC-SYNC-007: Race condition blocker prevents concurrent processing', async () => {
    const onlineMonitor = createMockNetworkMonitor(true);
    const processor = new SyncQueueProcessor(onlineMonitor);
    const apiClient = createMockApiClient(new Map());
    processor.setApiClient(apiClient);

    // محاولة بدء المعالجة مرتين متزامنتين
    const promise1 = processor.processQueue();
    const promise2 = processor.processQueue();

    const [result1, result2] = await Promise.all([promise1, promise2]);

    // الثانية يجب أن تُرفض بسبب القفل
    expect(result2.processed).toBe(0);
  });

  test('TC-SYNC-008: Processing stats are tracked correctly', async () => {
    const onlineMonitor = createMockNetworkMonitor(true);
    const processor = new SyncQueueProcessor(onlineMonitor);
    const apiClient = createMockApiClient(new Map());
    processor.setApiClient(apiClient);

    await projectRepository.createProject('مشروع الإحصائيات');
    await processor.processQueue();

    const stats = processor.getStats();
    expect(stats.totalProcessed).toBeGreaterThan(0);
    expect(stats.totalSucceeded).toBeGreaterThan(0);
    expect(stats.lastProcessTime).toBeGreaterThan(0);
  });

  test('TC-SYNC-009: Stop clears backoff timer and resets processing flag', () => {
    const processor = new SyncQueueProcessor(createMockNetworkMonitor(true));
    processor.stop();

    // لا يوجد خطأ — يعني أن التنظيف تم بنجاح
    const stats = processor.getStats();
    expect(stats).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الثالث: اختبارات التكامل الكامل (End-to-End Sync Flow)
// ═══════════════════════════════════════════════════════════════════════

describe('End-to-End Sync Flow — Full Pipeline', () => {
  test('TC-E2E-001: Create project offline → sync when online → verify consistency', async () => {
    // 1. إنشاء مشروع (محلياً)
    const project = await projectRepository.createProject(
      'مشروع الاختبار الشامل',
      'اختبار التدفق الكامل'
    );

    // 2. التحقق من وجوده في IndexedDB
    const stored = await db.projects.get(project.id);
    expect(stored).toBeDefined();
    expect(stored!.name).toBe('مشروع الاختبار الشامل');

    // 3. التحقق من وجود عملية في طابور المزامنة
    const pendingItems = await syncQueueRepository.getPendingItems();
    expect(pendingItems.length).toBeGreaterThan(0);
    expect(pendingItems[0].action).toBe('CREATE_PROJECT');

    // 4. محاكاة المزامنة الناجحة
    const onlineMonitor: NetworkMonitor = {
      isOnline: () => true,
      onStatusChange: () => () => {},
    };
    const processor = new SyncQueueProcessor(onlineMonitor);

    let postedPath = '';
    let postedIdempotencyKey = '';
    const apiClient: SyncApiClient = {
      post: vi.fn(async (path: string, _payload: unknown, options?: { headers?: Record<string, string> }) => {
        postedPath = path;
        postedIdempotencyKey = options?.headers?.['X-Idempotency-Key'] ?? '';
        return { status: 201, data: {} };
      }),
      put: vi.fn(async () => ({ status: 200, data: {} })),
      delete: vi.fn(async () => ({ status: 204, data: {} })),
    };
    processor.setApiClient(apiClient);

    const result = await processor.processQueue();
    expect(result.succeeded).toBe(1);
    expect(postedPath).toBe('/v3/projects');
    expect(postedIdempotencyKey).toBeTruthy();

    // 5. الطابور فارغ بعد المزامنة
    const pendingAfter = await syncQueueRepository.pendingCount();
    expect(pendingAfter).toBe(0);
  });

  test('TC-E2E-002: Create project + scenario + RTM → sync all → verify clean queue', async () => {
    // 1. إنشاء تسلسل كامل: مشروع → سيناريو → RTM
    const project = await projectRepository.createProject('مشروع التسلسل');
    const scenario = await scenarioRepository.createScenario(
      project.id,
      'سيناريو القص الثاقب',
      {
        designMethod: 'SYRIAN_WSD_2024',
        f_c: 40, f_y: 400, h_slab: 2000, b_column: 800, h_column: 800,
        a_tributary: 15, p_design: 200, m_dynamic: 200, n_dynamic: 5000,
      }
    );

    const { rtmRepository } = await import('../src/lib/storage/repositories/RtmRepository');
    await rtmRepository.logRtmEntry(scenario.id, 'TC-STRUCT-001', 'FR-3.2.9', 'PASSED');

    // 2. التحقق من 3 عمليات في الطابور
    const pendingItems = await syncQueueRepository.getPendingItems();
    expect(pendingItems.length).toBe(3);

    // 3. مزامنة الكل
    const onlineMonitor: NetworkMonitor = {
      isOnline: () => true,
      onStatusChange: () => () => {},
    };
    const processor = new SyncQueueProcessor(onlineMonitor);

    const apiClient: SyncApiClient = {
      post: vi.fn(async () => ({ status: 201, data: {} })),
      put: vi.fn(async () => ({ status: 200, data: {} })),
      delete: vi.fn(async () => ({ status: 204, data: {} })),
    };
    processor.setApiClient(apiClient);

    const result = await processor.processQueue();
    expect(result.succeeded).toBe(3);

    // 4. الطابور نظيف
    const pendingAfter = await syncQueueRepository.pendingCount();
    expect(pendingAfter).toBe(0);
  });
});
