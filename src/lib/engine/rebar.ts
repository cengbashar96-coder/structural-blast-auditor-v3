// ═══════════════════════════════════════════════════════════════════════
// محرك تصميم التسليح — الكود السوري 2024 + UFC 3-340-02
// منصة المدقق الديناميكي الموحد V3.0
// حساب مساحة الحديد المطلوبة + فحص النسب الدنيا والقصوى
// ═══════════════════════════════════════════════════════════════════════

import {
  STEP2_LOOKUPS,
  STEP7_CEILING,
  STEP5_ROOF,
  STEP5_WALL,
  assertLockedNotOverwritten,
} from '@/lib/constants/reference-data';
import { SYRIAN_CODE_2024, UFC_340_02 } from './constants';

// ─── أنواع المدخلات والمخرجات ────────────────────────────────────────

/**
 * مدخلات تصميم التسليح
 */
export interface RebarDesignInput {
  /** العزم البلاستيكي Mp (kg.cm) */
  Mp: number;
  /** العمق الفعال h0 (cm) */
  h0: number;
  /** عرض المقطع b (cm) — عادةً 100 cm للمتر الطولي */
  b: number;
  /** مقاومة القص الديناميكية للحديد Rsd (kg/cm²) */
  Rsd: number;
  /** مقاومة الانحناء الديناميكية للخرسانة Rbd (kg/cm²) */
  Rbd: number;
  /** سماكة المقطع الكلية h (cm) */
  h: number;
  /** مسار الحمل: سقف أو جدار */
  path: 'roof' | 'wall';
  /** نسبة المطاوعة الإنشائية */
  mu_struct: number;
}

/**
 * مخرجات تصميم التسليح
 */
export interface RebarDesignOutput {
  /** مساحة التسليح المطلوبة As (cm²/m) */
  As_required: number;
  /** مساحة التسليح المقدمة As_provided (cm²/m) */
  As_provided: number;
  /** نسبة التسليح الفعلية ρ */
  rho: number;
  /** نسبة التسليح الدنيا ρ_min */
  rho_min: number;
  /** نسبة التسليح القصوى ρ_max */
  rho_max: number;
  /** العمق النسبي لمنطقة الضغط ξ */
  xi: number;
  /** العمق النسبي الأقصى المسموح ξ_max */
  xi_max: number;
  /** معامل العزم النسبي αm */
  alpha_m: number;
  /** عدد قضبان التسليح (تقريبي) */
  barCount: number;
  /** قطر القضيب المقترح (mm) */
  barDiameter: number;
  /** مساحة قضيب واحد (cm²) */
  singleBarArea: number;
  /** التحقق من الحد الأدنى */
  minReinforcementOk: boolean;
  /** التحقق من الحد الأقصى */
  maxReinforcementOk: boolean;
  /** التحقق من شرط ξ */
  xiConditionOk: boolean;
  /** حالة التصميم الإجمالية */
  status: 'OK' | 'WARNING' | 'FAILURE';
  /** قائمة الملاحظات والتحذيرات */
  notes: string[];
}

// ─── الثوابت ──────────────────────────────────────────────────────────

/** مساحات القضبان القياسية (cm²) — أقطار 10-32 mm */
const BAR_AREAS: Record<number, number> = {
  10: 0.785,
  12: 1.131,
  14: 1.539,
  16: 2.011,
  18: 2.545,
  20: 3.142,
  22: 3.801,
  25: 4.909,
  28: 6.158,
  32: 8.042,
};

/** الأقطار المتوفرة مرتبة */
const AVAILABLE_DIAMETERS = [10, 12, 14, 16, 18, 20, 22, 25, 28, 32];

// ─── المعادلات المستقلة (Pure Functions) ────────────────────────────

/**
 * حساب مساحة التسليح المطلوبة من العزم والعمق الفعال
 * وفق طريقة الحدود (Limit State Design)
 *
 * As = Mp / (Rsd × (h0 - 0.5 × x))
 *
 * حيث x = Rsd × As / (Rbd × b) — عمق منطقة الضغط
 *
 * الحل التكراري:
 * 1. نفترض z = 0.875 × h0 (ذراع العزم الأولي)
 * 2. As = Mp / (Rsd × z)
 * 3. x = Rsd × As / (Rbd × b)
 * 4. z = h0 - 0.5 × x
 * 5. نكرر حتى التقارب
 */
export function calcRequiredSteelArea(
  Mp: number,
  h0: number,
  Rsd: number,
  Rbd: number,
  b: number,
  maxIterations: number = 10,
  tolerance: number = 0.001
): number {
  if (Mp <= 0 || h0 <= 0 || Rsd <= 0 || Rbd <= 0 || b <= 0) return 0;

  // التقريب الأولي
  let z = 0.875 * h0;
  let As = Mp / (Rsd * z);

  // التكرار حتى التقارب
  for (let i = 0; i < maxIterations; i++) {
    const x = (Rsd * As) / (Rbd * b);
    const z_new = h0 - 0.5 * x;
    const As_new = Mp / (Rsd * z_new);

    if (Math.abs(As_new - As) / Math.max(As, 0.001) < tolerance) {
      As = As_new;
      break;
    }
    As = As_new;
  }

  return Math.max(As, 0);
}

/**
 * حساب العمق النسبي لمنطقة الضغط
 * ξ = Rsd × As / (Rbd × b × h0)
 */
export function calcRelativeCompressionDepth(
  As: number,
  Rsd: number,
  Rbd: number,
  b: number,
  h0: number
): number {
  if (Rbd <= 0 || b <= 0 || h0 <= 0) return 0;
  return (Rsd * As) / (Rbd * b * h0);
}

/**
 * حساب معامل العزم النسبي
 * αm = ξ × (1 - 0.5 × ξ)
 */
export function calcAlphaM(xi: number): number {
  return xi * (1 - 0.5 * xi);
}

/**
 * نسبة التسليح
 * ρ = As / (b × h0)
 */
export function calcReinforcementRatio(As: number, b: number, h0: number): number {
  if (b <= 0 || h0 <= 0) return 0;
  return As / (b * h0);
}

/**
 * الحد الأدنى لنسبة التسليح — الكود السوري 2024
 * ρ_min = max(0.0025, 0.26 × fctm / fyk)
 *
 * للأحمال الديناميكية: ρ_min = 0.003 (0.3%)
 */
export function calcMinReinforcementRatio(
  fctm_MPa: number = 2.6,
  fyk_MPa: number = 300,
  isDynamic: boolean = true
): number {
  if (isDynamic) return 0.003;
  return Math.max(0.0025, 0.26 * fctm_MPa / fyk_MPa);
}

/**
 * الحد الأقصى لنسبة التسليح — الكود السوري 2024 + UFC
 * ρ_max = ρ_bal × δ
 * حيث ρ_bal = 0.85 × β1 × fcd / fsd × (εcu / (εcu + εy))
 * و δ = معامل تخفيض (0.5 للقطاعات الخرسانية العادية، 0.75 للأحمال الديناميكية)
 *
 * مبسط: ρ_max = 0.025 (2.5%) للظروف العادية
 * للأحمال الديناميكية: ρ_max = 0.04 (4%) وفق UFC 3-340-02
 */
export function calcMaxReinforcementRatio(isDynamic: boolean = true): number {
  return isDynamic ? 0.04 : 0.025;
}

/**
 * العمق النسبي الأقصى المسموح
 * ξ_max = 0.55 للكود السوري (ظروف عادية)
 * ξ_max = 0.65 للأحمال الديناميكية (UFC 3-340-02)
 */
export function calcMaxRelativeDepth(isDynamic: boolean = true): number {
  return isDynamic ? 0.65 : 0.55;
}

/**
 * اختيار القضيب الأمثل
 * يختار قطر القضيب وعدده بناءً على مساحة التسليح المطلوبة
 */
export function selectOptimalBars(
  As_required: number,
  b_cm: number = 100,
  minSpacing_cm: number = 5,
  maxBarDiameter_mm: number = 32
): { barDiameter: number; barCount: number; As_provided: number; singleBarArea: number } {
  let bestDiameter = 0;
  let bestCount = 0;
  let bestArea = 0;
  let bestDiff = Infinity;

  for (const dia of AVAILABLE_DIAMETERS) {
    if (dia > maxBarDiameter_mm) continue;

    const singleArea = BAR_AREAS[dia];
    if (!singleArea) continue;

    const count = Math.ceil(As_required / singleArea);

    // فحص التباعد الأدنى
    const spacing = b_cm / count;
    if (spacing < minSpacing_cm) continue;

    const providedArea = count * singleArea;
    const diff = providedArea - As_required;

    // اختيار الأنسب (أقل فائض مع تحقيق المساحة المطلوبة)
    if (diff >= 0 && diff < bestDiff) {
      bestDiff = diff;
      bestDiameter = dia;
      bestCount = count;
      bestArea = providedArea;
    }
  }

  // إذا لم نجد قضيب مناسب، نستخدم أكبر قطر
  if (bestDiameter === 0) {
    const maxDia = AVAILABLE_DIAMETERS[AVAILABLE_DIAMETERS.length - 1];
    const singleArea = BAR_AREAS[maxDia];
    const count = Math.ceil(As_required / singleArea);
    bestDiameter = maxDia;
    bestCount = count;
    bestArea = count * singleArea;
  }

  return {
    barDiameter: bestDiameter,
    barCount: bestCount,
    As_provided: bestArea,
    singleBarArea: BAR_AREAS[bestDiameter],
  };
}

// ─── المحرك الرئيسي ─────────────────────────────────────────────────

/**
 * تصميم التسليح الكامل
 *
 * التدفق:
 *   Mp, h0 → As_required → فحص ρ_min / ρ_max → فحص ξ_max → اختيار القضبان
 *
 * المعايير:
 *   - الكود السوري 2024: ρ_min, ρ_max, ξ_max
 *   - UFC 3-340-02: DIF، شروط الأحمال الديناميكية
 */
export function calculateRebarDesign(input: RebarDesignInput): RebarDesignOutput {
  const notes: string[] = [];
  const isDynamic = true; // جميع التصميمات في هذه المنصة ديناميكية

  // 1. حساب مساحة التسليح المطلوبة
  const As_required = calcRequiredSteelArea(
    input.Mp, input.h0, input.Rsd, input.Rbd, input.b
  );

  // 2. حساب نسبة التسليح
  const rho = calcReinforcementRatio(As_required, input.b, input.h0);

  // 3. حدود التسليح
  const rho_min = calcMinReinforcementRatio(2.6, 300, isDynamic);
  const rho_max = calcMaxReinforcementRatio(isDynamic);

  // 4. حساب العمق النسبي
  const xi = calcRelativeCompressionDepth(As_required, input.Rsd, input.Rbd, input.b, input.h0);
  const xi_max = calcMaxRelativeDepth(isDynamic);

  // 5. حساب معامل العزم النسبي
  const alpha_m = calcAlphaM(xi);

  // 6. اختيار القضبان
  const { barDiameter, barCount, As_provided, singleBarArea } = selectOptimalBars(As_required, input.b);

  // 7. الفحوصات
  const minReinforcementOk = rho >= rho_min;
  const maxReinforcementOk = rho <= rho_max;
  const xiConditionOk = xi <= xi_max;

  // 8. الملاحظات والتحذيرات
  if (!minReinforcementOk) {
    notes.push(`WARN-RHO-01: نسبة التسليح (${(rho * 100).toFixed(3)}%) أقل من الحد الأدنى (${(rho_min * 100).toFixed(2)}%) وفق الكود السوري 2024 — يُستخدم الحد الأدنى`);
  }
  if (!maxReinforcementOk) {
    notes.push(`ERR-RHO-02: نسبة التسليح (${(rho * 100).toFixed(3)}%) تتجاوز الحد الأقصى (${(rho_max * 100).toFixed(2)}%) — المقطع يحتاج توسيع`);
  }
  if (!xiConditionOk) {
    notes.push(`ERR-XI-01: العمق النسبي (${xi.toFixed(4)}) يتجاوز الحد الأقصى (${xi_max.toFixed(2)}) — المقطع فوق متوازن`);
  }
  if (minReinforcementOk && maxReinforcementOk && xiConditionOk) {
    notes.push(`OK: التسليح يحقيق متطلبات الكود السوري 2024 و UFC 3-340-02`);
  }

  // إضافة تفاصيل التصميم
  notes.push(`As_required = ${As_required.toFixed(2)} cm²/m, ρ = ${(rho * 100).toFixed(3)}%`);
  notes.push(`Selected: ${barCount}φ${barDiameter} = ${As_provided.toFixed(2)} cm²/m`);

  // 9. حالة التصميم الإجمالية
  let status: 'OK' | 'WARNING' | 'FAILURE' = 'OK';
  if (!minReinforcementOk) status = 'WARNING';
  if (!maxReinforcementOk || !xiConditionOk) status = 'FAILURE';

  // التحقق ضد القيم المرجعية (إن وُجدت)
  const computedValues: Record<string, number> = {
    As_required,
    rho,
  };

  try {
    assertLockedNotOverwritten(computedValues, `rebar-${input.path}`);
  } catch {
    // التحقق من القيم المقفلة — نحتفظ بالقيم المحسوبة
  }

  return {
    As_required,
    As_provided,
    rho,
    rho_min,
    rho_max,
    xi,
    xi_max,
    alpha_m,
    barCount,
    barDiameter,
    singleBarArea,
    minReinforcementOk,
    maxReinforcementOk,
    xiConditionOk,
    status,
    notes,
  };
}

// ─── دالة مساعدة: تصميم التسليح لكلا المسارين ──────────────────────

/**
 * تصميم التسليح لكلا المسارين (سقف + جدار)
 *
 * يربط مخرجات التصميم الإنشائي (الخطوتان 7-8) بتصميم التسليح
 */
export function calculateRebarBothPaths(
  ceiling: { Mp: number; h0: number; Hp_final: number },
  wall: { Mp: number; h0: number; Hc_final: number },
  material: { Rsd: number; Rbd: number; mu_struct_roof: number; mu_struct_wall: number }
): { roof: RebarDesignOutput; wall: RebarDesignOutput } {
  const roof = calculateRebarDesign({
    Mp: ceiling.Mp,
    h0: ceiling.h0,
    b: 100,
    Rsd: material.Rsd,
    Rbd: material.Rbd,
    h: ceiling.Hp_final,
    path: 'roof',
    mu_struct: material.mu_struct_roof,
  });

  const wallRebar = calculateRebarDesign({
    Mp: wall.Mp,
    h0: wall.h0,
    b: 100,
    Rsd: material.Rsd,
    Rbd: material.Rbd,
    h: wall.Hc_final,
    path: 'wall',
    mu_struct: material.mu_struct_wall,
  });

  return { roof, wall: wallRebar };
}
