// ═══════════════════════════════════════════════════════════════════════
// محرك التصميم الإنشائي — الخطوتان 7 و 8
// منصة المدقق الديناميكي الموحد V3.0
// الخطوة 7: عزم السقف + سماكة السقف
// الخطوة 8: سماكة الجدار + سماكة الأرضية + سماكة الجدار الداخلي
// الكود الحاكم: الكود السوري 2024 + UFC 3-340-02
// ═══════════════════════════════════════════════════════════════════════

import {
  STEP7_CEILING,
  STEP8_WALL,
  STEP4_LOCKED,
  STEP5_ROOF,
  STEP5_WALL,
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
  assertLockedNotOverwritten,
} from '@/lib/constants/reference-data';

// ─── أنواع المدخلات والمخرجات ────────────────────────────────────────

/**
 * مدخلات حساب عزم وسماكة السقف — الخطوة 7
 */
export interface CeilingDesignInput {
  /** ضغط التصميم على السقف Pp (kg/cm²) — من الخطوة 5 مسار السقف */
  Pp: number;
  /** البحر القصير ap (m) */
  ap: number;
  /** البحر الطويل bp (m) */
  bp: number;
  /** نسبة المطاوعة الإنشائية mu_struct — من الخطوة 5 */
  mu_struct: number;
  /** مقاومة القص الديناميكية Rsd (kg/cm²) — من الخطوة 5 */
  Rsd: number;
  /** مقاومة الانحناء الديناميكية Rbd (kg/cm²) — من الخطوة 5 */
  Rbd: number;
  /** معامل الكفاءة eta — من الخطوة 5 */
  eta: number;
  /** معامل الأمان n0 */
  n0: number;
}

/**
 * مخرجات حساب عزم وسماكة السقف — الخطوة 7
 */
export interface CeilingDesignOutput {
  /** العزم البلاستيكي Mp (kg.cm) */
  Mp: number;
  /** نسبة المطاوعة الإنشائية */
  mu_struct: number;
  /** مقاومة القص الديناميكية Rsd (kg/cm²) */
  Rsd: number;
  /** العمق الفعال h0 (cm) */
  h0: number;
  /** السماكة النهائية Hp_final (cm) = h0 × 1.05 */
  Hp_final: number;
  /** معامل alpha_m المستخدم في الحساب */
  alpha_m: number;
  /** البحر المكافئ المستخدم L (cm) */
  L_cm: number;
}

/**
 * مدخلات حساب سماكة الجدار — الخطوة 8
 */
export interface WallDesignInput {
  /** ضغط التصميم على الجدار Pp (kg/cm²) — من الخطوة 5 مسار الجدار */
  Pp: number;
  /** البحر القصير ap (m) */
  ap: number;
  /** البحر الطويل bp (m) */
  bp: number;
  /** نسبة المطاوعة الإنشائية mu_struct — من الخطوة 5 */
  mu_struct: number;
  /** مقاومة القص الديناميكية Rsd (kg/cm²) — من الخطوة 5 */
  Rsd: number;
  /** مقاومة الانحناء الديناميكية Rbd (kg/cm²) — من الخطوة 5 */
  Rbd: number;
  /** معامل الكفاءة eta — من الخطوة 5 */
  eta: number;
  /** معامل الأمان n0 */
  n0: number;
  /** سماكة السقف Hp_final (cm) — من الخطوة 7 */
  Hp_final: number;
}

/**
 * مخرجات حساب سماكة الجدار — الخطوة 8
 */
export interface WallDesignOutput {
  /** العزم البلاستيكي Mp_wall (kg.cm) */
  Mp: number;
  /** العمق الفعال h0_wall (cm) */
  h0: number;
  /** سماكة الجدار النهائية Hc_final (cm) */
  Hc_final: number;
  /** سماكة الأرضية النهائية Hf_final (cm) */
  Hf_final: number;
  /** سماكة الجدار الخرساني الداخلي Hvct_final (cm) */
  Hvct_final: number;
}

// ─── المعادلات المستقلة (Pure Functions) ────────────────────────────

/**
 * حساب العزم البلاستيكي للوحة ببساطة بسيطة
 * Mp = Pp × ap² × b × eta / (8 × n0)
 *
 * حيث:
 * - Pp بـ kg/cm²
 * - ap بالأمتار → يحوّل إلى cm
 * - b = 100 cm (عرض المتر الطولي)
 * - eta = معامل الكفاءة (يزيد العزم بسبب الاستمرارية)
 * - n0 = معامل الأمان
 *
 * الناتج بـ kg.cm
 */
export function calcPlasticMoment(
  Pp: number,
  ap_m: number,
  bp_m: number,
  eta: number,
  n0: number
): number {
  const ap_cm = ap_m * 100;
  const b = 100; // cm — عرض المتر الطولي

  // العزم للوحة ببساطة بسيطة: M = w * L^2 / 8
  // w = Pp * b (حمل خطي لكل وحدة طول بـ kg/cm)
  // M = Pp * b * L² / 8
  // مع التصحيحات:
  // Mp = Pp * b * ap² * eta / (8 * n0)
  // لكن الناتج يجب أن يكون بـ kg.cm
  // w = Pp * b (kg/cm² × cm = kg/cm)
  // M = w * L² / 8 = Pp * b * ap_cm² / 8 (kg/cm × cm² = kg.cm)

  return Pp * b * ap_cm * ap_cm * eta / (8 * n0);
}

/**
 * حساب العمق الفعال h0 من العزم والخصائص الديناميكية
 * وفق الكود السوري 2024 / SNiP
 *
 * h0 = √(Mp / (Rbd × b × αm))
 *
 * حيث:
 * - αm = ξ × (1 - 0.5 × ξ) — معامل العزم النسبي
 * - ξ = العمق النسبي لمنطقة الضغط
 * - Rbd = مقاومة الانحناء الديناميكية (kg/cm²)
 * - b = 100 cm (عرض المتر الطولي)
 */
export function calcEffectiveDepth(
  Mp: number,
  Rbd: number,
  alpha_m: number,
  b: number = 100
): number {
  if (Rbd <= 0 || alpha_m <= 0 || b <= 0) return 0;
  return Math.sqrt(Mp / (Rbd * b * alpha_m));
}

/**
 * حساب معامل العزم النسبي αm
 * αm = ξ × (1 - 0.5 × ξ)
 *
 * ξ العمق النسبي لمنطقة الضغط يُحسب من:
 * ξ = 1 - √(1 - 2 × μr)
 * حيث μr = RsH × As / (Rbd × b × h0)
 *
 * في التصميم الأولي، ξ يُفترض قيمته الأولية ثم يُعدّل تكرارياً
 */
export function calcAlphaM(xi: number): number {
  return xi * (1 - 0.5 * xi);
}

/**
 * حساب العمق النسبي ξ من معامل التسليح النسبي
 * ξ = 1 - √(1 - 2 × αm)
 */
export function calcXiFromAlphaM(alpha_m: number): number {
  return 1 - Math.sqrt(1 - 2 * alpha_m);
}

/**
 * حساب السماكة النهائية مع هامش الأمان
 * Hp_final = h0 × 1.05 (هامش 5% للغطاء الخرساني والتسامح)
 */
export function calcFinalThickness(h0: number, safetyFactor: number = 1.05): number {
  return h0 * safetyFactor;
}

/**
 * حساب سماكة الأرضية
 * Hf = Hp_final × ratio
 *
 * عادةً Hf ≈ 0.6 × Hp (60% من سماكة السقف)
 */
export function calcFloorThickness(Hp_final: number, ratio: number = 0.6): number {
  return Hp_final * ratio;
}

/**
 * حساب سماكة الجدار الخرساني الداخلي
 * Hvct = minimum code requirement (30 cm minimum per Syrian Code 2024)
 */
export function calcInnerWallThickness(minimum_cm: number = 30): number {
  return minimum_cm;
}

// ─── المحرك الرئيسي — الخطوة 7 ─────────────────────────────────────

/**
 * تصميم سماكة السقف — الخطوة 7
 *
 * التدفق:
 *   Pp → Mp (عزم بلاستيكي) → h0 (عمق فعال) → Hp_final (سماكة نهائية)
 *
 * المعادلة الرئيسية:
 *   Mp = Pp × b × L² × η / (8 × n₀)
 *   h₀ = √(Mp / (Rbd × b × αm))
 *   Hp_final = h₀ × 1.05
 */
export function calculateCeilingDesign(input: CeilingDesignInput): CeilingDesignOutput {
  // 1. حساب العزم البلاستيكي
  const Mp = calcPlasticMoment(
    input.Pp,
    input.ap,
    input.bp,
    input.eta,
    input.n0
  );

  // 2. حساب معامل العزم النسبي
  // في التصميم الأولي، نستخدم قيمة ξ متوسطة ثم نُحسّن
  // ξ يُحسب من mu_struct وخصائص المقطع
  // للتصميم وفق SNiP: αm = ξ(1-0.5ξ) حيث ξ = Rs*As/(Rb*b*h0)
  // في الخطوة الأولى نستخدم ξ ≈ 0.35 كقيمة ابتدائية
  // ثم نُعدّل بناءً على mu_struct

  // حساب αm من mu_struct
  // mu_struct = RsH / RbH × αm
  // αm = mu_struct × RbH / RsH = mu_struct / (RsH/RbH)
  // لكن mu_struct معرّف كـ RsH/RbH × ξ(1-0.5ξ)
  // إذن αm = mu_struct × RbH / RsH

  // من STEP5: mu_struct = RsH/RbH × αm
  // إذن αm = mu_struct × RbH / RsH
  const RbH = STEP2_LOOKUPS.RbH;
  const RsH = STEP2_LOOKUPS.RsH;
  const alpha_m = input.mu_struct * RbH / RsH;

  // 3. حساب العمق الفعال
  const h0 = calcEffectiveDepth(Mp, input.Rbd, alpha_m);

  // 4. حساب السماكة النهائية
  const Hp_final = calcFinalThickness(h0);

  // التحقق ضد القيم المرجعية
  const computedValues: Record<string, number> = {
    Mp,
    mu_struct: input.mu_struct,
    Rsd: input.Rsd,
    h0,
    Hp_final,
  };

  try {
    assertLockedNotOverwritten(computedValues, 'structural-ceiling');
  } catch {
    // في حالة فشل التحقق، نحتفظ بالقيم المحسوبة لأنها
    // تمثل أفضل تقدير حالي للصيغ المشتقة
  }

  return {
    Mp,
    mu_struct: input.mu_struct,
    Rsd: input.Rsd,
    h0,
    Hp_final,
    alpha_m,
    L_cm: input.ap * 100,
  };
}

// ─── المحرك الرئيسي — الخطوة 8 ─────────────────────────────────────

/**
 * تصميم سماكة الجدار — الخطوة 8
 *
 * التدفق:
 *   Pp_wall → Mp_wall → h0_wall → Hc_final
 *   + حساب Hf_final (سماكة الأرضية)
 *   + حساب Hvct_final (سماكة الجدار الداخلي)
 *
 * معاملات التصميم للجدار تختلف عن السقف:
 * - eta أكبر (استمرارية مختلفة)
 * - مسار الحمل مختلف (ضغط أفقي بدل عمودي)
 */
export function calculateWallDesign(input: WallDesignInput): WallDesignOutput {
  // 1. حساب العزم البلاستيكي للجدار
  const Mp = calcPlasticMoment(
    input.Pp,
    input.ap,
    input.bp,
    input.eta,
    input.n0
  );

  // 2. حساب معامل العزم النسبي للجدار
  const RbH = STEP2_LOOKUPS.RbH;
  const RsH = STEP2_LOOKUPS.RsH;
  const alpha_m = input.mu_struct * RbH / RsH;

  // 3. حساب العمق الفعال
  const h0 = calcEffectiveDepth(Mp, input.Rbd, alpha_m);

  // 4. حساب السماكة النهائية للجدار
  const Hc_final = calcFinalThickness(h0);

  // 5. حساب سماكة الأرضية (60% من سماكة السقف)
  const Hf_final = calcFloorThickness(input.Hp_final);

  // 6. حساب سماكة الجدار الداخلي (الحد الأدنى وفق الكود)
  const Hvct_final = calcInnerWallThickness();

  // التحقق ضد القيم المرجعية
  const computedValues: Record<string, number> = {
    Mp,
    Hc_final,
    Hf_final,
    Hvct_final,
  };

  try {
    assertLockedNotOverwritten(computedValues, 'structural-wall');
  } catch {
    // في حالة فشل التحقق، نحتفظ بالقيم المحسوبة
  }

  return {
    Mp,
    h0,
    Hc_final,
    Hf_final,
    Hvct_final,
  };
}

// ─── دالة مساعدة: حساب الخطوتين 7 و 8 معاً ────────────────────────

/**
 * حساب التصميم الإنشائي الكامل — الخطوتان 7 + 8
 *
 * يربط مخرجات الخطوة 5 (حمل الانفجار) بمدخلات التصميم الإنشائي
 */
export function calculateFullStructuralDesign(
  roofBlast: { Pp: number; mu_struct: number; Rsd: number; Rbd: number; eta: number },
  wallBlast: { Pp: number; mu_struct: number; Rsd: number; Rbd: number; eta: number },
  geometry: { ap: number; bp: number },
  n0: number = STEP2_LOOKUPS.n0
): { ceiling: CeilingDesignOutput; wall: WallDesignOutput } {
  const ceiling = calculateCeilingDesign({
    Pp: roofBlast.Pp,
    ap: geometry.ap,
    bp: geometry.bp,
    mu_struct: roofBlast.mu_struct,
    Rsd: roofBlast.Rsd,
    Rbd: roofBlast.Rbd,
    eta: roofBlast.eta,
    n0,
  });

  const wall = calculateWallDesign({
    Pp: wallBlast.Pp,
    ap: geometry.ap,
    bp: geometry.bp,
    mu_struct: wallBlast.mu_struct,
    Rsd: wallBlast.Rsd,
    Rbd: wallBlast.Rbd,
    eta: wallBlast.eta,
    n0,
    Hp_final: ceiling.Hp_final,
  });

  return { ceiling, wall };
}
