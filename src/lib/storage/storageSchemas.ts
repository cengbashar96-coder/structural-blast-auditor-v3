// ═══════════════════════════════════════════════════════════════════════
// طبقة التحقق وكائنات التخزين - storageSchemas.ts
// منصة المدقق الديناميكي الموحد V3.0
// Zod Validation — منع دخول أي بيانات تالفة أو غير مطابقة للـ Baseline
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';
import { StructuralInputSchema } from '../structural/structuralSchema';

// ─── 1. نظام المشاريع (Projects Store) ────────────────────────────
// المشروع هو الكيان الأعلى: يحتوي على معلومات التدقيق الأساسية
// ويربط جميع السيناريوهات وسجلات RTM تحهره

export const ProjectRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'اسم المشروع يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
  baselineVersion: z.string().default('V3.0-Locked'),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
export type ProjectRecord = z.infer<typeof ProjectRecordSchema>;

// ─── 2. حالات التصميم والنتائج (Scenarios & IO Store) ───────────
// كل سيناريو يمثل حالة تصميم واحدة مع مدخلات ومخرجات المحرك الإنشائي

export const ScenarioRecordSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1, 'عنوان السيناريو مطلوب'),

  // المدخلات المعتمدة للمحرك الإنشائي — مقفلة عبر Zod
  inputs: StructuralInputSchema,

  // المخرجات الحسابية — اختيارية حتى يتم تشغيل المحرك
  outputs: z.object({
    status: z.enum(['SUCCESS', 'PUNCHING_FAILURE', 'CRITICAL_ERROR']),
    d_eff: z.number().positive(),
    b_0: z.number().positive(),
    eccentricity: z.number(),
    e_limit: z.number().positive(),
    svgColor: z.enum(['GREEN', 'RED_FLASHING']),
    rho_final: z.number().min(0.0025),
    v_actual: z.number().optional(),
    v_cd: z.number().optional(),
    calculatedAt: z.number().int().positive(),
    errorMessage: z.string().optional(),
  }).optional(),

  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
export type ScenarioRecord = z.infer<typeof ScenarioRecordSchema>;

// ─── 3. سجلات تتبع المتطلبات والعيوب (RTM Ledger Store) ─────────
// المرجع الحاكم لربط كل اختبار بالمتطلب الهندسي المقابل

export const RTM_TEST_CASE_IDS = [
  'TC-BLAST-001',
  'TC-BLAST-002',
  'TC-BLAST-003',
  'TC-BLAST-004',
  'TC-BLAST-005',
  'TC-STRUCT-001',
  'TC-STRUCT-002',
  'TC-STRUCT-003',
] as const;

export type RtmTestCaseId = (typeof RTM_TEST_CASE_IDS)[number];

export const RtmRecordSchema = z.object({
  id: z.string().uuid(),
  scenarioId: z.string().uuid(),
  testCaseId: z.enum(RTM_TEST_CASE_IDS),
  associatedRequirement: z.string().min(1, 'رمز المتطلب مطلوب (مثل FR-3.2.9)'),
  status: z.enum(['PASSED', 'FAILED']),
  defectLog: z.string().optional(),
  timestamp: z.number().int().positive(),
});
export type RtmRecord = z.infer<typeof RtmRecordSchema>;

// ─── 4. طابور المزامنة المؤجلة (Sync Queue Store) ────────────────
// يسجل كل عملية كتابة محلية لرفعها لاحقاً عند توفر الشبكة

export const SYNC_ACTIONS = [
  'CREATE_PROJECT',
  'UPDATE_PROJECT',
  'DELETE_PROJECT',
  'CREATE_SCENARIO',
  'UPDATE_SCENARIO',
  'DELETE_SCENARIO',
  'LOG_RTM',
] as const;

export type SyncAction = (typeof SYNC_ACTIONS)[number];

export const SYNC_PAYLOAD_TYPES = ['PROJECT', 'SCENARIO', 'RTM'] as const;
export type SyncPayloadType = (typeof SYNC_PAYLOAD_TYPES)[number];

export const SyncQueueRecordSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(SYNC_ACTIONS),
  payloadType: z.enum(SYNC_PAYLOAD_TYPES),
  payload: z.unknown(), // البيانات المراد مزامنتها — يتم التحقق منها عند المعالجة
  status: z.enum(['PENDING', 'SYNCING', 'FAILED', 'COMPLETED']),
  retryCount: z.number().int().min(0).default(0),
  maxRetries: z.number().int().min(1).max(5).default(3),
  lastError: z.string().optional(),
  timestamp: z.number().int().positive(),
});
export type SyncQueueRecord = z.infer<typeof SyncQueueRecordSchema>;

// ─── 5. دوال التحقق المساعدة (Validation Helpers) ────────────────

/**
 * التحقق الصارم قبل الكاتبة — يرمي ZodError إذا فشل
 * يستخدم في Repository Layer لضمان سلامة البيانات
 */
export function validateBeforeWrite<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(
      `[STORAGE-VALIDATION-ERROR] Context: ${context} | Issues: ${issues}`
    );
  }
  return result.data;
}

/**
 * التحقق المرن للقراءة — يحول البيانات التالفة إلى قيم افتراضية
 * يستخدم عند قراءة بيانات قد تكون من إصدار أقدم
 */
export function safeParseWithDefaults<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : fallback;
}
