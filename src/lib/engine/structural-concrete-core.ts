// ═══════════════════════════════════════════════════════════════════════
// محرك التصميم الإنشائي — الكود السوري 2024 + UFC 3-340-02
// منصة المدقق الديناميكي الموحد V3.0
// المعادلات المرجعية: αm → ξ → h0 → Hp (من الأطروحة)
// ═══════════════════════════════════════════════════════════════════════

import type {
  DesignInput,
  SectionDesignResult,
  ValidationReport,
  ValidationStatus,
  GeometryType,
} from './types';
import { UFC_340_02, SYRIAN_CODE_2024 } from './constants';

// ─── أنواع جديدة للنتائج التفصيلية ─────────────────────────────────

export interface ThicknessDesignDetails {
  /** العزم الديناميكي (kg.cm) */
  MpKgCm: number;
  /** معامل αm = Mp / (Rbd × b × h0²) */
  alphaM: number;
  /** نسبة العمق ξ = 1 - √(1 - 2αm) */
  xi: number;
  /** ξR — الحد الأقصى المسموح */
  xiR: number;
  /** العمق الفعال h0 (cm) */
  h0Cm: number;
  /** السماكة الكلية (cm) */
  HpCm: number;
  /** نسبة المطاوعة الإنشائية */
  muStruct: number;
  /** مقاومة التسليح الديناميكية (kg/cm²) */
  RsdKgCm2: number;
  /** مقاومة الانحناء الديناميكية (kg/cm²) */
  RbdKgCm2: number;
  /** مساحة التسليح (cm²/m) */
  AsCm2PerM: number;
  /** الغطاء الخرساني (mm) */
  coverMm: number;
}

// ─── المعادلات المستقلة (Pure Functions) ────────────────────────────

/**
 * العمق الفعال d_eff = h − cover
 * cover = 50mm وفق الكود السوري 2024
 */
export function calcEffectiveDepth(slabThicknessMm: number, coverMm: number = 50): number {
  return slabThicknessMm - coverMm;
}

/**
 * المحيط الحرج للقص الثاقب b₀
 * b₀ = 2 × (b_col + d_eff) + 2 × (h_col + d_eff)
 */
export function calcCriticalPerimeter(
  bColumnMm: number,
  hColumnMm: number,
  dEffMm: number
): number {
  return 2 * (bColumnMm + dEffMm) + 2 * (hColumnMm + dEffMm);
}

/**
 * حد النواة e_limit = h / 6
 */
export function calcCoreLimit(slabThicknessMm: number): number {
  return slabThicknessMm / 6.0;
}

/**
 * إجهاد القص الثاقب المسموح — الكود السوري 2024
 * v_cd = 0.25 × √(f_cd)
 */
export function calcVcdSyrian(fcdMpa: number): number {
  return SYRIAN_CODE_2024.V_CD_COEFF * Math.sqrt(fcdMpa);
}

/**
 * إجهاد القص الثاقب المسموح — USD
 * v_cd = φ × 0.33 × √(f_cd)
 */
export function calcVcdUSD(fcdMpa: number): number {
  return SYRIAN_CODE_2024.PHI_V * 0.33 * Math.sqrt(fcdMpa);
}

/**
 * DIF — معامل تضخيم المواد الديناميكي
 */
export function applyDIF(fcMpa: number, fyMpa: number) {
  return {
    fcd: fcMpa * UFC_340_02.DIF_CONCRETE_COMPRESSION,
    fsd: fyMpa * UFC_340_02.DIF_STEEL_TENSION,
  };
}

/**
 * حساب السماكة المطلوبة — المسار المُصحّح من الأطروحة
 *
 * التدفق:
 *   1. حساب Mp (العزم الديناميكي)
 *   2. حساب Rbd, Rsd (المقاومات الديناميكية)
 *   3. حساب αm = Mp / (Rbd × b × h0²) — تكراري
 *   4. حساب ξ = 1 - √(1 - 2αm)
 *   5. التحقق ξ ≤ ξR
 *   6. حساب h0 = √(Mp / (αm × Rbd × b))
 *   7. Hp = (h0 + cover/10) × 1.05
 */
export function calcRequiredThicknessThesis(
  MpKgCm: number,
  RbdKgCm2: number,
  RsdKgCm2: number,
  bCm: number,
  coverMm: number = 50,
  xiR: number = 0.55
): ThicknessDesignDetails {
  // حساب αm ابتدائي — بافتراض h0 أولي
  let h0Cm = 50; // تخمين أولي
  let alphaM = 0;
  let xi = 0;

  // حل تكراري لـ αm (أقصى 50 دورة)
  for (let i = 0; i < 50; i++) {
    alphaM = MpKgCm / (RbdKgCm2 * bCm * h0Cm * h0Cm);

    // حساب ξ من αm
    const discriminant = 1 - 2 * alphaM;
    if (discriminant < 0) {
      // αm كبير جداً — فشل القسم
      xi = 1;
      break;
    }
    xi = 1 - Math.sqrt(discriminant);

    // حساب h0 جديد
    const h0New = Math.sqrt(MpKgCm / (alphaM * RbdKgCm2 * bCm));

    // تقارب؟
    if (Math.abs(h0New - h0Cm) < 0.01) {
      h0Cm = h0New;
      break;
    }
    h0Cm = h0New;
  }

  // حساب المطاوعة الإنشائية
  const muStruct = (RsdKgCm2 / RbdKgCm2) * xi * (1 - 0.5 * xi);

  // حساب التسليح
  const AsCm2PerM = MpKgCm / (RsdKgCm2 * 0.875 * h0Cm);

  // السماكة الكلية: Hp = (h0 + cover) × 1.05
  const HpCm = (h0Cm + coverMm / 10) * 1.05;

  return {
    MpKgCm,
    alphaM,
    xi,
    xiR,
    h0Cm,
    HpCm,
    muStruct,
    RsdKgCm2,
    RbdKgCm2,
    AsCm2PerM,
    coverMm,
  };
}

/**
 * حساب السماكة المطلوبة — الطريقة القديمة (مبسطة)
 * مبسط: ht = √(M / (Rb × b × 0.3)) + cover
 * @deprecated استخدم calcRequiredThicknessThesis بدلاً من ذلك
 */
export function calcRequiredThickness(
  momentKnm: number,
  fcMpa: number,
  widthMm: number,
  coverMm: number = 50
): number {
  const Rb = fcMpa * 0.9 * 10; // تقريب kg/cm²
  const h0 = Math.sqrt((momentKnm * 100000) / (Rb * widthMm * 0.3));
  return h0 + coverMm; // mm
}

/**
 * حساب التسليح المطلوب As من العزم والعمق
 * As = M / (fsd × 0.875 × d_eff) × 10000 (للتحويل إلى cm²/m)
 */
export function calcRequiredSteel(
  momentKnm: number,
  fsdMpa: number,
  dEffMm: number
): number {
  if (dEffMm <= 0 || fsdMpa <= 0) return 0;
  return (momentKnm * 1000000) / (fsdMpa * 0.875 * dEffMm); // mm² → cm² تقريباً
}

/**
 * نسبة المطاوعة = fy / fc
 */
export function calcDuctilityRatio(fyMpa: number, fcMpa: number): number {
  return fyMpa / Math.max(fcMpa, 1);
}

// ─── المحرك الرئيسي ─────────────────────────────────────────────────

/**
 * تصميم المقطع الخرساني والتحقق الكامل
 *
 * التدفق (المُصحّح من الأطروحة):
 *   pDesignMpa → عزم (kg.cm) → αm → ξ → h0 → Hp
 *   → فحص اللامركزية e ≤ h/6
 *   → فحص القص الثاقب v_actual ≤ v_cd
 *   → قرار: SUCCESS / WARNING / FAILURE
 */
export function designConcreteSection(input: DesignInput): SectionDesignResult {
  // 1. تطبيق DIF
  const { fcd, fsd } = applyDIF(input.fcMpa, input.fyMpa);

  // 2. حسابات هندسية أساسية
  const spanShort = input.tunnelSpanShort;
  const spanLong = input.tunnelSpanLong;

  // 3. تحويل الضغط التصميمي إلى kg/cm²
  // pDesignMpa → pDesignKgCm2 (1 MPa ≈ 10.197 kg/cm²)
  const pDesignKgCm2 = input.pDesignMpa * 10.197;

  // 4. حساب العزم الديناميكي (kg.cm)
  // M = P_design × ap² / 8 (لوح ببساطة بسيطة)
  // ap بالأمتار، Pp بـ kg/cm²، الناتج بـ kg.cm
  const MpKgCm = pDesignKgCm2 * (spanShort * 100) * (spanShort * 100) / 8;

  // 5. حساب المقاومات الديناميكية (kg/cm²)
  const n0 = 1.25; // معامل الأمان
  const RsdKgCm2 = input.fyMpa * 10.197 * UFC_340_02.DIF_STEEL_TENSION * n0;
  const RbdKgCm2 = input.fcMpa * 10.197 * UFC_340_02.DIF_CONCRETE_COMPRESSION * n0;

  // 6. حساب السماكة بالمسار المُصحّح من الأطروحة
  const coverMm = SYRIAN_CODE_2024.COVER_MIN_MM;
  const bCm = spanLong * 100; // العرض بالسنتيمتر
  const details = calcRequiredThicknessThesis(MpKgCm, RbdKgCm2, RsdKgCm2, bCm, coverMm);

  const requiredThicknessMm = details.HpCm * 10; // cm → mm
  const requiredThicknessMeters = requiredThicknessMm / 1000;

  // 7. العمق الفعال
  const dEffMm = calcEffectiveDepth(requiredThicknessMm, coverMm);

  // 8. التسليح المطلوب
  const requiredSteelAreaCm2PerMeter = details.AsCm2PerM;
  const reinforcementRatio = Math.max(
    requiredSteelAreaCm2PerMeter / (dEffMm * 100),
    SYRIAN_CODE_2024.RHO_MIN
  );

  // 9. نسبة المطاوعة
  const ductilityRatio = calcDuctilityRatio(input.fyMpa, input.fcMpa);

  // ─── التحققات ───

  const failures: string[] = [];

  // 10. فحص اللامركزية e ≤ h/6
  const pDesignKPa = input.pDesignMpa * 1000;
  const axialForceKn = pDesignKPa * spanShort * spanLong;
  const momentKnm = MpKgCm / 100000; // kg.cm → kN.m (تقريبي)
  const eccentricityMm = axialForceKn > 0
    ? (momentKnm * 1000000) / (axialForceKn * 1000)
    : 9999;
  const eLimitMm = requiredThicknessMm / 6;
  const eccentricityRatio = eccentricityMm / requiredThicknessMm;

  if (eccentricityMm > eLimitMm) {
    failures.push(`ERR-CORE-01: اللامركزية (${eccentricityMm.toFixed(1)}mm) تتجاوز حد النواة (${eLimitMm.toFixed(1)}mm) — e > h/6`);
  }

  // 11. فحص ξ > ξR (فشل إجهاد ضغط الخرسانة)
  if (details.xi > details.xiR) {
    failures.push(`ERR-XI-01: نسبة العمق ξ=${details.xi.toFixed(3)} تتجاوز الحد ξR=${details.xiR} — يجب زيادة السماكة`);
  }

  // 12. فحص القص الثاقب
  const bColumnMm = 400;
  const hColumnMm = 400;
  const b0 = calcCriticalPerimeter(bColumnMm, hColumnMm, dEffMm);
  const criticalArea = ((bColumnMm + dEffMm) * (hColumnMm + dEffMm)) / 1e6;
  const tributaryArea = spanShort * spanLong;
  const vActualKn = pDesignKPa * (tributaryArea - criticalArea);
  const vActualMpa = (vActualKn * 1000) / (b0 * dEffMm);

  const vCdMpa = calcVcdSyrian(fcd);
  const punchingShearRatio = vActualMpa / vCdMpa;

  if (vActualMpa > vCdMpa) {
    failures.push(`ERR-PUNCH-01: إجهاد القص الثاقب (${vActualMpa.toFixed(3)} MPa) يتجاوز المسموح (${vCdMpa.toFixed(3)} MPa) وفق الكود السوري`);
  }

  // 13. فحص الحد الأدنى للخرسانة
  if (input.fcMpa < 25) {
    failures.push('ERR-MAT-01: مقاومة الخرسانة أقل من الحد الأدنى (25 MPa)');
  }

  // 14. فحص نسبة التسليح
  if (reinforcementRatio < SYRIAN_CODE_2024.RHO_MIN) {
    failures.push(`ERR-RHO-01: نسبة التسليح (${reinforcementRatio.toFixed(4)}) أقل من الحد الأدنى (${SYRIAN_CODE_2024.RHO_MIN})`);
  }

  // ─── القرار النهائي ───
  const status: ValidationStatus =
    failures.length === 0 ? 'SUCCESS'
    : failures.some(f => f.startsWith('ERR-PUNCH') || f.startsWith('ERR-CORE') || f.startsWith('ERR-XI')) ? 'FAILURE'
    : 'WARNING';

  const validation: ValidationReport = {
    status,
    eccentricityRatio,
    punchingShearRatio,
    reinforcementRatio,
    failures,
    explanation:
      failures.length === 0
        ? `المقطع يحقق متطلبات الكود السوري 2024 و UFC 3-340-02. السماكة=${details.HpCm.toFixed(1)}cm, h0=${details.h0Cm.toFixed(1)}cm, αm=${details.alphaM.toFixed(4)}, ξ=${details.xi.toFixed(4)}, التسليح=${details.AsCm2PerM.toFixed(1)}cm²/m`
        : `المقطع يحتاج مراجعة: ${failures.join(' | ')}`,
    ruleId: status === 'SUCCESS' ? 'SYR-2024-OK' : 'SYR-2024-REVIEW',
  };

  return {
    requiredThicknessMeters,
    requiredSteelAreaCm2PerMeter,
    ductilityRatio,
    validation,
  };
}
