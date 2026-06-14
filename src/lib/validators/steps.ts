// ═══════════════════════════════════════════════════════════════════════
// مدققات الخطوات — Zod Schemas + مراجعة القيم المرجعية BMK-02
// منصة المدقق الديناميكي الموحد V3.0
// كل خطوة لها مخطط تحقق مستقل + دالة مقارنة مع القيم المرجعية
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── 1. مخطط مدخلات الخطوة 2 (Step 2 Input Schema) ──────────────────

/**
 * مخطط مدخلات الخطوة 2 — المدخلات الأساسية
 * P: وزن الشحنة، lo_b: البعد، lk: طول الجسم، dk: القطر
 * ld_ratio: نسبة الطول/القطر، lhd_ratio: نسبة طول الرأس/القطر
 * C: الشحنة، V: السرعة، alpha/beta: الزوايا، Z: البعد المختزل
 */
export const Step2InputsSchema = z.object({
  P: z.number().positive(),
  lo_b: z.number().positive(),
  lk: z.number().positive(),
  dk: z.number().positive(),
  ld_ratio: z.number().positive(),
  lhd_ratio: z.number().positive(),
  C: z.number().positive(),
  V: z.number().positive().min(50).max(800),
  alpha: z.number().min(0).max(90),
  beta: z.number().min(0).max(90),
  Z: z.number().positive(),
});

// ─── 2. مخطط استيفاءات الخطوة 2 (Step 2 Lookups Schema) ─────────────

/**
 * مخطط استيفاءات الخطوة 2 — القيم من جداول الاستيفاء
 * K1: معامل الشحنة، kpr_*: معاملات الاختراق
 * K_kp_ct: معامل الشحنة/الضغط، m1: معامل الكتلة
 * RbH/RsH: مقاومة الضغط/القص، gamma_*: معاملات الأمان
 * Kpod_*: معاملات القاعدة، n0: أُس التأثير
 * Kbt_bt: معامل البيتون، R_bar: البعد المختزل
 */
export const Step2LookupsSchema = z.object({
  K1: z.number().positive(),
  kpr_g: z.number().positive(),
  kpr_b: z.number().positive(),
  kpr_bt: z.number().positive(),
  K_kp_ct: z.number().positive(),
  m1: z.number().positive(),
  RbH: z.number().positive(),
  RsH: z.number().positive(),
  gamma_b: z.number().positive(),
  gamma_g: z.number().positive(),
  Kpod_b: z.number().positive(),
  Kpod_s: z.number().positive(),
  n0: z.number().positive(),
  Kbt_bt: z.number().positive(),
  R_bar: z.number().positive(),
});

// ─── 3. مخطط مخرجات الاختراق (Step 3 Penetration Output Schema) ─────

/**
 * مخطط مخرجات خطوة الاختراق — الخطوة 3
 * يتحقق من جميع القيم المحسوبة في محرك الاختراق
 */
export const PenetrationOutputSchema = z.object({
  lambda1: z.number(),
  lambda2: z.number(),
  n_exp: z.number(),
  C_ef: z.number().positive(),
  tsu: z.number(),
  h_pr: z.number().positive(),
  h_z: z.number(),
  h_z_bar: z.number(),
  R_actual: z.number().positive(),
  Zp: z.number().positive(),
});

// ─── 4. مخطط القفل الأولي (Step 4 Locked Schema) ────────────────────

/**
 * مخطط القيم المقفلة — الخطوة 4
 * هذه القيم لا يمكن الكتابة فوقها في الخطوات اللاحقة
 */
export const Step4LockedSchema = z.object({
  Hp: z.number().positive(),
  Hc: z.number().positive(),
  Hf: z.number().positive(),
  Hvct: z.number().positive(),
  ht: z.number().positive(),
  Bt: z.number().positive(),
  Hpc: z.number().positive(),
  Pp_roof: z.number().positive(),
  Pp_wall: z.number().positive(),
});

// ─── 5. مخطط الحمل الانفجاري (Step 5 Blast Load Schema) ─────────────

/**
 * مخطط الحمل الانفجاري — الخطوة 5
 * يُطبّق على مساري السقف والجدار
 */
export const BlastLoadSchema = z.object({
  h_bar: z.number(),
  R_bar_b1: z.number(),
  R_ekv: z.number().positive(),
  R_star: z.number().positive(),
  max_bv: z.number(),
  tau: z.number().positive(),
  tau_ef: z.number().positive(),
  tau_n: z.number(),
  a0cp: z.number().positive(),
  a1cp: z.number().positive(),
  omega: z.number().positive(),
  C_dyn: z.number().positive(),
  mu_struct: z.number(),
  eta: z.number().positive(),
  Rsd: z.number().positive(),
  Rbd: z.number().positive(),
  lambda: z.number(),
  Kp: z.number().positive(),
  Pmax: z.number().positive(),
  Kd: z.number().positive(),
  kpsi: z.number().positive().max(1),
  P_ekv: z.number().positive(),
  Pct: z.number(),
  Pp: z.number().positive(),
  R_ekv_gt_R_star: z.boolean(),
});

// ─── 6. مخطط الجدول ب (Step 6 B-Table Schema) ───────────────────────

/**
 * مخطط معاملات الجدول ب — الخطوة 6
 * يتحقق من القيم المستخرجة من جداول الاستجابة الديناميكية
 */
export const BTableSchema = z.object({
  R_bar_b1: z.number().positive(),
  mu_table: z.number(),
  eta_table: z.number(),
  Kt: z.number().positive(),
  a0z: z.number().positive(),
  a1z: z.number().positive(),
  Kpod: z.number().positive(),
  Kp: z.number().positive(),
  Kd: z.number().positive(),
});

// ─── 7. مخطط العزم والسماكة (Step 7 Moment Thickness Schema) ─────────

/**
 * مخطط نتيجة حساب العزم والسماكة — الخطوة 7
 * يحسب السماكة المطلوبة للسقف بناءً على العزم البلاستيكي
 */
export const Step7Schema = z.object({
  Mp: z.number().positive(),
  mu_struct: z.number(),
  Rsd: z.number().positive(),
  h0: z.number().positive(),
  Hp_final: z.number().positive(),
});

// ─── 8. مخطط الجدار النهائي (Step 8 Wall Final Schema) ───────────────

/**
 * مخطط نتيجة تصميم الجدار النهائي — الخطوة 8
 * يحدد السماكات النهائية لجميع العناصر الإنشائية
 */
export const Step8Schema = z.object({
  Mp: z.number().positive(),
  Hc_final: z.number().positive(),
  Hf_final: z.number().positive(),
  Hvct_final: z.number().positive(),
});

// ─── 9. نتيجة الانحراف لقيمة واحدة (Value Deviation) ───────────────

/**
 * نتيجة الانحراف لقيمة واحدة مقارنة بالمرجع
 * تحدد حالة القيمة: PASS (ضمن 50% من التسامح)
 * أو WARN (ضمن التسامح) أو FAIL (تجاوز التسامح)
 */
export interface ValueDeviation {
  /** مفتاح المتغير */
  key: string;
  /** القيمة المحسوبة */
  computed: number;
  /** القيمة المرجعية */
  reference: number;
  /** نسبة الانحراف بالمئة */
  deviationPct: number;
  /** حالة التحقق */
  status: 'PASS' | 'WARN' | 'FAIL';
}

// ─── 10. التحقق مقابل القيم المرجعية ────────────────────────────────

/**
 * التحقق من القيم المحسوبة مقابل القيم المرجعية BMK-02
 *
 * منطق الحالة:
 * - PASS:  الانحراف ≤ 50% من التسامح (مثلاً ≤ 2.5% عند تسامح 5%)
 * - WARN:  الانحراف ≤ التسامح الكامل (مثلاً ≤ 5%)
 * - FAIL:  الانحراف > التسامح الكامل
 *
 * @param computed  - القيم المحسوبة من المحرك
 * @param reference - القيم المرجعية من BMK-02
 * @param defaultTolerance - التسامح الافتراضي كنسبة (0.05 = 5%)
 * @returns مصفوفة نتائج الانحراف لكل مفتاح مرجعي
 */
export function validateAgainstReference(
  computed: Record<string, number>,
  reference: Record<string, number>,
  defaultTolerance: number = 0.05 // 5%
): ValueDeviation[] {
  const results: ValueDeviation[] = [];

  for (const key of Object.keys(reference)) {
    const refVal = reference[key];
    const calcVal = computed[key];

    if (calcVal === undefined) {
      results.push({
        key,
        computed: NaN,
        reference: refVal,
        deviationPct: 100,
        status: 'FAIL',
      });
      continue;
    }

    const deviation = Math.abs(calcVal - refVal);
    const relDev = refVal !== 0 ? deviation / Math.abs(refVal) : deviation;
    const devPct = relDev * 100;

    let status: 'PASS' | 'WARN' | 'FAIL';
    if (devPct <= defaultTolerance * 100 * 0.5) {
      status = 'PASS';
    } else if (devPct <= defaultTolerance * 100) {
      status = 'WARN';
    } else {
      status = 'FAIL';
    }

    results.push({
      key,
      computed: calcVal,
      reference: refVal,
      deviationPct: devPct,
      status,
    });
  }

  return results;
}

// ─── 11. التأكد من عدم الكتابة فوق القيم المقفلة ───────────────────

/**
 * التأكد من أن القيم المقفلة لم تُكتب فوقها
 *
 * @param computed       - القيم المحسوبة الجديدة
 * @param reference      - القيم المقفلة المرجعية
 * @param source         - مصدر القيم الجديدة (اسم الخطوة أو الدالة)
 * @param maxDeviationPct - أقصى انحراف مسموح بالمئة (افتراضي 5%)
 * @throws Error إذا تجاوز أي متغير مقفل الانحراف المسموح
 */
export function assertLockedNotOverwritten(
  computed: Record<string, number>,
  reference: Record<string, number>,
  source: string,
  maxDeviationPct: number = 5
): void {
  for (const key of Object.keys(reference)) {
    const refVal = reference[key];
    const calcVal = computed[key];

    if (calcVal !== undefined && refVal !== 0) {
      const deviation = Math.abs(calcVal - refVal);
      const relDev = (deviation / Math.abs(refVal)) * 100;

      if (relDev > maxDeviationPct) {
        throw new Error(
          `[LOCKED-ERR] "${key}" overwritten by "${source}". ` +
          `Ref: ${refVal}, Got: ${calcVal}, Dev: ${relDev.toFixed(2)}%. ` +
          `Locked values are read-only.`
        );
      }
    }
  }
}

// ─── 12. نتيجة تحقق الخطوة الكاملة (Step Validation Result) ─────────

/**
 * نتيجة تحقق خطوة كاملة — تجمّع أخطاء المخطط والانحرافات
 * والانتهاكات المقفلة في تقرير واحد
 */
export interface StepValidationResult {
  /** رقم الخطوة */
  step: number;
  /** هل الخطوة صالحة (لا أخطاء مخطط ولا انتهاكات مقفلة) */
  valid: boolean;
  /** أخطاء مخطط Zod (إن وُجدت) */
  schemaErrors: z.ZodError | null;
  /** نتائج الانحراف عن القيم المرجعية */
  deviations: ValueDeviation[];
  /** قائمة انتهاكات القيم المقفلة */
  lockedViolations: string[];
}

// ─── 13. دالة التحقق الشاملة للخطوة ─────────────────────────────────

/**
 * دالة التحقق الشاملة لخطوة واحدة
 *
 * تُنفّذ ثلاث عمليات:
 * 1. التحقق من مخطط Zod (نوعية القيم وحدودها)
 * 2. المقارنة مع القيم المرجعية BMK-02 (إن وُجدت)
 * 3. تجميع الانتهاكات المقفلة
 *
 * @param schema      - مخطط Zod للخطوة
 * @param data        - البيانات المراد التحقق منها
 * @param reference   - القيم المرجعية (اختياري)
 * @param stepNumber  - رقم الخطوة
 * @returns تقرير التحقق الكامل للخطوة
 *
 * @example
 * ```typescript
 * const result = validateStep(
 *   BlastLoadSchema,
 *   roofBlastValues,
 *   bmk02ReferenceValues.step5_roof,
 *   5
 * );
 * if (!result.valid) {
 *   console.error('Step 5 failed:', result.lockedViolations);
 * }
 * ```
 */
export function validateStep<T extends z.ZodType>(
  schema: T,
  data: unknown,
  reference: Record<string, number> | null,
  stepNumber: number
): StepValidationResult {
  const parseResult = schema.safeParse(data);

  const deviations: ValueDeviation[] = [];
  const lockedViolations: string[] = [];

  if (reference && parseResult.success) {
    const computed = parseResult.data as Record<string, number>;
    const devs = validateAgainstReference(computed, reference);
    deviations.push(...devs);

    for (const d of devs) {
      if (d.status === 'FAIL') {
        lockedViolations.push(
          `${d.key}: expected ${d.reference}, got ${d.computed} (${d.deviationPct.toFixed(1)}% deviation)`
        );
      }
    }
  }

  return {
    step: stepNumber,
    valid: parseResult.success && lockedViolations.length === 0,
    schemaErrors: parseResult.success ? null : parseResult.error,
    deviations,
    lockedViolations,
  };
}
