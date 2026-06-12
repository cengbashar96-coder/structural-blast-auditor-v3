// ═══════════════════════════════════════════════════════════════════════
// محرك الاختراق — المعادلات المرجعية من الأطروحة (Eq. 13-19)
// منصة المدقق الديناميكي الموحد V3.0
// كل معادلة دالة مستقلة قابلة للاختبار بشكل منفصل
// ═══════════════════════════════════════════════════════════════════════

import type { PenetrationInput, PenetrationOutput } from './types';
import { getWeaponById, getSoilByCode, getExplosiveK1 } from './constants';

// ─── المعادلات المستقلة (Pure Functions) ────────────────────────────

/**
 * المعادلة (14): معامل تأثير شكل الرأس الحربي
 * λ₁ = 0.5 + 0.4 × (Lh/D)^(2/3)
 */
export function calcLambda1(lhdRatio: number): number {
  return 0.5 + 0.4 * Math.pow(lhdRatio, 0.666);
}

/**
 * المعادلة (15): معامل تأثير القطر
 * λ₂ = 2.8 × d^(1/3) − 1.3 × d^(1/2)
 */
export function calcLambda2(d: number): number {
  return 2.8 * Math.pow(d, 0.333) - 1.3 * Math.pow(d, 0.5);
}

/**
 * المعادلة (16): أُس التأثير
 * n = 3.5 − (Lh/D)
 */
export function calcN(lhdRatio: number): number {
  return 3.5 - lhdRatio;
}

/**
 * المعادلة (19): الشحنة الفعالة
 * C_eff = 0.95 × K₁ × C
 */
export function calcCEffective(K1: number, chargeKg: number): number {
  return 0.95 * K1 * chargeKg;
}

/**
 * المعادلة (17): معامل زاوية الاختراق — قنبلة خارقة
 * τ = 0.5 × lₖ × cos((α + n×α)/2)
 */
export function calcTsuPenetrating(
  bodyLengthM: number,
  angleDeg: number,
  nExp: number
): number {
  const alphaRad = (angleDeg * Math.PI) / 180;
  return 0.5 * bodyLengthM * Math.cos(((angleDeg + nExp * angleDeg) / 2) * Math.PI / 180);
}

/**
 * المعادلة (18): معامل زاوية الاختراق — قنبلة انفجارية
 * τ = 0.5 × dₖ
 */
export function calcTsuExplosive(diameterM: number): number {
  return 0.5 * diameterM;
}

/**
 * المعادلة (13): عمق الاختراق في التربة
 * x₁ = λ₁ × λ₂ × Kpr × (P/d²) × V × cos(α)
 *
 * حيث:
 * - Kpr = kp (معامل اختراق التربة)
 * - P = وزن القنبلة (kg)
 * - d = قطر القنبلة (m)
 * - V = سرعة الاصطدام (m/s)
 * - α = زاوية الاصطدام (درجات)
 */
export function calcPenetrationDepth(
  lambda1: number,
  lambda2: number,
  kp: number,
  weightKg: number,
  diameterM: number,
  velocity: number,
  angleDeg: number
): number {
  const alphaRad = (angleDeg * Math.PI) / 180;
  return lambda1 * lambda2 * kp * (weightKg / (diameterM * diameterM)) * velocity * Math.cos(alphaRad);
}

// ─── المحرك الرئيسي ─────────────────────────────────────────────────

/**
 * حساب الاختراق الكامل — يربط المدخلات بالمعادلات المرجعية
 *
 * التدفق:
 *   weaponId → WeaponData → λ₁, λ₂, n, C_eff, τ
 *   soilTypeCode → SoilCoefficients → Kpr
 *   → x₁ (عمق الاختراق) → h₀ (عمق الحفرة) → spalling
 */
export function calculatePenetration(input: PenetrationInput): PenetrationOutput {
  // 1. استخراج البيانات المرجعية
  const weapon = getWeaponById(input.weaponId);
  const soil = getSoilByCode(input.soilTypeCode);
  const K1 = getExplosiveK1(weapon.explosive);
  const angleDeg = input.impactAngleDeg ?? 0;

  // 2. حساب المعاملات الوسيطة
  const lambda1 = calcLambda1(weapon.lhdRatio);
  const lambda2 = calcLambda2(weapon.diameterMeters);
  const nExp = calcN(weapon.lhdRatio);
  const cEffective = calcCEffective(K1, weapon.chargeKg);

  // 3. معامل زاوية الاختراق
  const isPenetrating = weapon.lhdRatio > 1.5;
  const tsu = isPenetrating
    ? calcTsuPenetrating(weapon.bodyLengthMeters ?? (weapon.lengthMeters ?? 1.0) * 0.6, angleDeg, nExp)
    : calcTsuExplosive(weapon.diameterMeters);

  // 4. عمق الاختراق
  const penetrationDepth = calcPenetrationDepth(
    lambda1, lambda2, soil.kp,
    weapon.weightKg, weapon.diameterMeters,
    input.impactVelocity, angleDeg
  );

  // 5. العمق المكافئ وعمق الحفرة
  const hz = Math.max(penetrationDepth - tsu, 0);  // العمق الصافي بعد خصم tsu
  const craterDepth = hz * 1.18;                      // عمق الحفرة المكافئ (معامل 1.18 مرجعي)

  // 6. العمق المختزل (لبقية السلسلة)
  const cbrtCeff = Math.cbrt(cEffective);
  const hBarZ = cbrtCeff > 0 ? hz / cbrtCeff : 0;

  // 7. سماكة spalling المطلوبة
  const requiredSpallingThickness = penetrationDepth * 0.65;

  // 8. التحذيرات
  const warningMessages: string[] = [];
  if (penetrationDepth <= 0) {
    warningMessages.push('ERR-PEN-01: عمق الاختراق سالب أو صفر — تحقق من المدخلات');
  }
  if (hz <= 0) {
    warningMessages.push('WARN-PEN-01: العمق المكافئ hz ≤ 0 — القنبلة لم تخترق السقف');
  }
  if (hBarZ < 0.7) {
    warningMessages.push('WARN-PEN-02: h̄z < 0.7 — معامل الإجهاد يُخفَّض بعامل 0.6');
  }
  if (input.impactVelocity > 400) {
    warningMessages.push('WARN-PEN-03: سرعة اصطدام عالية جداً — تحقق من صحة المعادلة لهذا النطاق');
  }

  return {
    penetrationDepth,
    craterDepth,
    requiredSpallingThickness,
    lambda1,
    lambda2,
    nExp,
    cEffective,
    tsu,
    hBarZ,
    explanation: `اختراق ${weapon.name} (${weapon.weightKg}kg) بسرعة ${input.impactVelocity} m/s في ${soil.nameAr}: x₁=${penetrationDepth.toFixed(3)}m, h₀=${craterDepth.toFixed(3)}m`,
    warningMessages: warningMessages.length > 0 ? warningMessages : undefined,
  };
}
