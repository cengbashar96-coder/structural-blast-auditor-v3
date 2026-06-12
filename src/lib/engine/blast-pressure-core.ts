// ═══════════════════════════════════════════════════════════════════════
// محرك الضغط العصفي — المعادلات المرجعية من الأطروحة (Eq. 1-12)
// منصة المدقق الديناميكي الموحد V3.0
// كل معادلة دالة مستقلة قابلة للاختبار بشكل منفصل
// ═══════════════════════════════════════════════════════════════════════

import type { BlastInput, BlastOutput, SoilTypeCode } from './types';
import {
  getStressCoeffForSoil,
  getSoilWaveForSoil,
  UFC_340_02,
} from './constants';

// ─── المعادلات المستقلة (Pure Functions) ────────────────────────────

/**
 * المعادلة (1): الضغط الزائد الساقط — سادوفسكي
 * ΔP = 0.1 × ∛C / R + 0.43 × ∛C² / R² + 1.4 × C / R³
 *
 * حيث C بالكيلوغرام و R بالمتر والناتج بـ MPa
 */
export function calcSadovskyOverpressure(C: number, R: number): number {
  if (R <= 0) return Infinity;
  const cbrtC = Math.cbrt(C);
  const cbrtC2 = Math.cbrt(C * C);
  return 0.1 * cbrtC / R + 0.43 * cbrtC2 / (R * R) + 1.4 * C / (R * R * R);
}

/**
 * المعادلة (4): زمن الطور الموجب
 * τ⁺ = 1.7 × 10⁻³ × ∛(√C) × √R
 */
export function calcPositivePhaseTime(C: number, R: number): number {
  return 1.7e-3 * Math.cbrt(Math.sqrt(C)) * Math.sqrt(R);
}

/**
 * المعادلة (5): الاندثار
 * I = 6.3 × ∛C² / R
 */
export function calcImpulse(C: number, R: number): number {
  if (R <= 0) return Infinity;
  return 6.3 * Math.cbrt(C * C) / R;
}

/**
 * المعادلة (8): الزمن الفعال للموجة (دالة الاستيفاء I-9)
 * τ_eff = τ⁺ × f(ΔPmax)
 * حيث f = 0.0008 × ΔPmax² − 0.0384 × ΔPmax + 1.0013
 */
export function calcEffectiveTime(tauPlus: number, deltaPmax: number): number {
  const f = 0.0008 * deltaPmax * deltaPmax - 0.0384 * deltaPmax + 1.0013;
  return tauPlus * f;
}

// ─── المحرك الرئيسي ─────────────────────────────────────────────────

/**
 * حساب الضغط العصفي الكامل — يربط المدخلات بمعادلات الأطروحة
 *
 * التدفق:
 *   equivalentTNTWeight + radialDistance → Z → σ_max → P_max → P_design
 *   + حسابات الزمن: τ⁺ → τ_eff → τ_rise → ω
 *   + شرط الديناميكية + شرط نواة المقطع
 */
export function calculateBlastPressure(input: BlastInput): BlastOutput {
  const C = input.equivalentTNTWeight;
  const R = input.radialDistance;
  const soilTypeCode = input.soilTypeCode;

  // 1. البعد المختزل Z = R / ∛C
  const cbrtC = Math.cbrt(Math.max(C, 0.001));
  const scaledDistanceZ = R / cbrtC;

  // 2. البعد الحرج R̄★ = 1.1 × ∛C (مرجعي للتربة الطينية)
  const rCritical = 1.1 * cbrtC;

  // 3. الإجهاد الأقصى — من جداول الاستيفاء I-3
  let sigmaMaxMpa = 0;
  if (soilTypeCode) {
    const { A, n1 } = getStressCoeffForSoil(soilTypeCode);
    sigmaMaxMpa = A * Math.pow(Math.max(scaledDistanceZ, 0.01), -n1);

    // تخفيض بعامل 0.6 إذا كان h̄z < 0.7 (يُطبق خارج هذه الدالة بواسطة penetration output)
  }

  // 4. الضغط الجانبي — سادوفسكي
  const pSideOnMpa = calcSadovskyOverpressure(C, R);

  // 5. الضغط المنعكس Pr ≈ 2 × Kp × σ_max
  const Kp = 0.86; // معامل النفاذية المرجعي
  const pReflectedMpa = 2 * Kp * (sigmaMaxMpa > 0 ? sigmaMaxMpa : pSideOnMpa);

  // 6. حسابات الزمن
  const tauPlus = calcPositivePhaseTime(C, R);
  const tauEffective = calcEffectiveTime(tauPlus, sigmaMaxMpa > 0 ? sigmaMaxMpa : pSideOnMpa);

  // 7. تردد الاهتزاز (مبسط — يحتاج tunnel spans للحساب الكامل)
  const omega = 100; // rad/s — قيمة مرجعية مؤقتة

  // 8. شرط الديناميكية: τ_eff ≥ 0.2 × π / ω
  const dynamicConditionMet = tauEffective >= 0.2 * Math.PI / omega;

  // 9. الأحمال
  const Kd = dynamicConditionMet ? 0.9 : 0;
  const P_max = pReflectedMpa;
  const P_equivalent = Kd * P_max;

  // الضغط الساكن (من عمق السقف إن وُجد)
  const P_static = input.ceilingDepth ? input.ceilingDepth * 2000 / 10000 * 0.0980665 : 0; // MPa

  const pDesignMpa = P_static + P_equivalent;
  const pDesignKPa = pDesignMpa * 1000;

  // 10. شرط نواة المقطع (مبدئي — يُفصَّل في structural-concrete-core)
  const coreConditionMet = true; // يُحدَّث لاحقاً من المحرك الإنشائي

  return {
    scaledDistanceZ,
    pSideOnMpa,
    pReflectedMpa,
    durationMs: tauEffective * 1000,
    pDesignMpa,
    pDesignKPa,
    sigmaMaxMpa,
    tauPlus,
    tauEffective,
    rCritical,
    dynamicConditionMet,
    coreConditionMet,
  };
}
