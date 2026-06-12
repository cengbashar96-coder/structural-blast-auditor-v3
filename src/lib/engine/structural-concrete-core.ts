// ═══════════════════════════════════════════════════════════════════════
// محرك التصميم الإنشائي — الكود السوري 2024 + UFC 3-340-02
// منصة المدقق الديناميكي الموحد V3.0
// المعادلات المرجعية: القص الثاقب + اللامركزية + التسليح + السماكة
// ═══════════════════════════════════════════════════════════════════════

import type {
  DesignInput,
  SectionDesignResult,
  ValidationReport,
  ValidationStatus,
  GeometryType,
} from './types';
import { UFC_340_02, SYRIAN_CODE_2024 } from './constants';

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
 * حساب السماكة المطلوبة ht من العزم والضغط
 * مبسط: ht = √(M / (Rb × b × 0.3)) + cover
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
 * التدفق:
 *   pDesignMpa → عزم → سماكة + تسليح
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

  // 3. العزم الديناميكي (مبسط — لوح ببحرين)
  // M = P_design × ap² / 8 (تقريبي)
  const pDesignKPa = input.pDesignMpa * 1000;
  const momentKnm = (pDesignKPa * spanShort * spanShort) / 8;

  // 4. السماكة المطلوبة
  const coverMm = SYRIAN_CODE_2024.COVER_MIN_MM;
  const requiredThicknessMm = calcRequiredThickness(
    momentKnm, fcd, spanLong * 1000, coverMm
  );
  const requiredThicknessMeters = requiredThicknessMm / 1000;

  // 5. العمق الفعال
  const dEffMm = calcEffectiveDepth(requiredThicknessMm, coverMm);

  // 6. التسليح المطلوب
  const requiredSteelAreaCm2PerMeter = calcRequiredSteel(momentKnm, fsd, dEffMm);
  const reinforcementRatio = Math.max(
    requiredSteelAreaCm2PerMeter / (dEffMm * 100),
    SYRIAN_CODE_2024.RHO_MIN
  );

  // 7. نسبة المطاوعة
  const ductilityRatio = calcDuctilityRatio(input.fyMpa, input.fcMpa);

  // ─── التحققات ───

  const failures: string[] = [];

  // 7. فحص اللامركزية e ≤ h/6
  // تقريبي: e = M / N حيث N = P × A_tributary
  const axialForceKn = pDesignKPa * spanShort * spanLong;
  const eccentricityMm = axialForceKn > 0
    ? (momentKnm * 1000000) / (axialForceKn * 1000)
    : 9999;
  const eLimitMm = requiredThicknessMm / 6;
  const eccentricityRatio = eccentricityMm / requiredThicknessMm;

  if (eccentricityMm > eLimitMm) {
    failures.push(`ERR-CORE-01: اللامركزية (${eccentricityMm.toFixed(1)}mm) تتجاوز حد النواة (${eLimitMm.toFixed(1)}mm) — e > h/6`);
  }

  // 8. فحص القص الثاقب
  const bColumnMm = 400; // افتراضي — يجب أن يكون مدخلاً
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

  // 9. فحص الحد الأدنى للخرسانة
  if (input.fcMpa < 25) {
    failures.push('ERR-MAT-01: مقاومة الخرسانة أقل من الحد الأدنى (25 MPa)');
  }

  // 10. فحص نسبة التسليح
  if (reinforcementRatio < SYRIAN_CODE_2024.RHO_MIN) {
    failures.push(`ERR-RHO-01: نسبة التسليح (${reinforcementRatio.toFixed(4)}) أقل من الحد الأدنى (${SYRIAN_CODE_2024.RHO_MIN})`);
  }

  // ─── القرار النهائي ───
  const status: ValidationStatus =
    failures.length === 0 ? 'SUCCESS'
    : failures.some(f => f.startsWith('ERR-PUNCH') || f.startsWith('ERR-CORE')) ? 'FAILURE'
    : 'WARNING';

  const validation: ValidationReport = {
    status,
    eccentricityRatio,
    punchingShearRatio,
    reinforcementRatio,
    failures,
    explanation:
      failures.length === 0
        ? `المقطع يحقق متطلبات الكود السوري 2024 و UFC 3-340-02. السماكة=${requiredThicknessMm.toFixed(0)}mm, التسليح=${requiredSteelAreaCm2PerMeter.toFixed(1)}cm²/m`
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
