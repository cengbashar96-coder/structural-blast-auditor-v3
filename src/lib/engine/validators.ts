// ═══════════════════════════════════════════════════════════════════════
// مُحققات المدخلات — طبقة الدفاع الأولى
// منصة المدقق الديناميكي الموحد V3.0
// التحقق من المدخلات قبل دخولها المحركات + التعامل مع NaN/null/undefined
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';
import type { SoilTypeCode, GeometryType, ValidationStatus } from './types';

// ─── أنواع الأخطاء ───

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// ─── مخططات Zod ───

export const PenetrationInputSchema = z.object({
  weaponId: z.string().min(1, 'weaponId مطلوب'),
  impactVelocity: z.number()
    .min(50, 'سرعة الاصطدام يجب أن تكون ≥ 50 m/s')
    .max(1000, 'سرعة الاصطدام يجب أن تكون ≤ 1000 m/s')
    .finite('سرعة الاصطدام لا يمكن أن تكون NaN أو Infinity'),
  soilTypeCode: z.enum(
    ['SOFT_SOIL', 'MEDIUM_SOIL', 'HARD_ROCK', 'REINFORCED_SAND', 'CONCRETE', 'REINFORCED_CONCRETE'] as const,
    { message: 'soilTypeCode غير معروف' }
  ),
  impactAngleDeg: z.number().min(0).max(90).finite().optional(),
  detonationDelayMs: z.number().nonnegative().finite().optional(),
});

export const BlastInputSchema = z.object({
  equivalentTNTWeight: z.number()
    .positive('وزن TNT المكافئ يجب أن يكون موجباً')
    .max(50000, 'وزن TNT المكافئ يتجاوز الحد المعقول')
    .finite(),
  radialDistance: z.number()
    .positive('البعد الشعاعي يجب أن يكون موجباً')
    .max(1000, 'البعد الشعاعي يتجاوز الحد المعقول')
    .finite(),
  soilTypeCode: z.enum(
    ['SOFT_SOIL', 'MEDIUM_SOIL', 'HARD_ROCK', 'REINFORCED_SAND', 'CONCRETE', 'REINFORCED_CONCRETE'] as const
  ).optional(),
  ceilingDepth: z.number().positive().finite().optional(),
});

export const DesignInputSchema = z.object({
  pDesignMpa: z.number()
    .positive('الضغط التصميمي يجب أن يكون موجباً')
    .max(500, 'الضغط التصميمي يتجاوز الحد المعقول')
    .finite(),
  geometryType: z.enum(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as const),
  tunnelSpanShort: z.number().positive().max(30, 'البحر يتجاوز الحد المعقول').finite(),
  tunnelSpanLong: z.number().positive().max(50, 'البعر يتجاوز الحد المعقول').finite(),
  fcMpa: z.number().min(15, 'مقاومة الخرسانة يجب أن تكون ≥ 15 MPa').max(80).finite(),
  fyMpa: z.number().min(200, 'إجهاد الخضوع يجب أن يكون ≥ 200 MPa').max(600).finite(),
  slabThicknessHintMm: z.number().positive().finite().optional(),
  reinforcementRatio: z.number().min(0.001).max(0.04).finite().optional(),
});

// ─── دوال التحقق العامة ───

/** فحص NaN / Infinity / null / undefined */
export function sanitizeNumber(value: unknown, fieldName: string): number | ValidationError {
  if (value === null || value === undefined) {
    return { field: fieldName, message: `${fieldName} مطلوب ولا يمكن أن يكون null/undefined`, code: 'SANITIZE-01', value };
  }
  if (typeof value !== 'number') {
    return { field: fieldName, message: `${fieldName} يجب أن يكون رقماً`, code: 'SANITIZE-02', value };
  }
  if (!Number.isFinite(value)) {
    return { field: fieldName, message: `${fieldName} لا يمكن أن يكون NaN أو Infinity`, code: 'SANITIZE-03', value };
  }
  return value;
}

/** التحقق العام — يستخدم Zod ويُعيد نتائج مهيكلة */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // فحص NaN/null/undefined أولاً
  if (data === null || data === undefined) {
    return {
      valid: false,
      errors: [{ field: context, message: 'المدخلات مطلوبة', code: 'VALID-01', value: data }],
      warnings,
    };
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        field: issue.path.join('.'),
        message: issue.message,
        code: 'ZOD-ERR',
        value: (data as any)[issue.path.join('.')],
      });
    }
  }

  // تحذيرات إضافية (لا تمنع التنفيذ)
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if ('impactVelocity' in obj && typeof obj.impactVelocity === 'number' && obj.impactVelocity > 400) {
      warnings.push('سرعة اصطدام عالية — تحقق من دقة المعادلات في هذا النطاق');
    }
    if ('fcMpa' in obj && typeof obj.fcMpa === 'number' && obj.fcMpa < 25) {
      warnings.push('مقاومة خرسانة منخفضة — غير موصى بها للمنشآت الحمائية');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
