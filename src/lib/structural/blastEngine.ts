// ═══════════════════════════════════════════════════════════════════════
// محرك حسابات ضغوط العصف الديناميكي - blastEngine.ts
// منصة المدقق الديناميكي الموحد V3.0
// المعادلات 1-37 المستخلصة من الأطروحة العلمية وملفات الإكسيل
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';
import { BOMB_DATABASE, EXPLOSIVE_TABLE, SOIL_TABLE, SOIL_WAVE_TABLE, STRESS_COEFFICIENT_TABLE } from './baselineConstants';

// ─── مخطط مدخلات محرك الانفجار ───
export const BlastInputSchema = z.object({
  bombId: z.number().min(1).max(14),
  explosiveName: z.string().default('Tritonal_80_20'),
  soilName: z.string(),
  fallVelocity: z.number().min(100).max(1000),    // m/s
  fallAngle: z.number().min(0).max(90),            // degrees
  ceilingDepth: z.number().positive(),              // m
  tunnelSpanShort: z.number().positive(),           // m (ap)
  tunnelSpanLong: z.number().positive(),            // m (bp)
  ceilingHeight: z.number().positive(),             // m (aэt)
  initialSlabThickness: z.number().default(0.15),   // m
  initialWallThickness: z.number().default(0.15),   // m
  initialFloorThickness: z.number().default(0.15),  // m
  reinforcementRatio: z.number().default(0.008),
  n0Factor: z.number().default(1.25),
});

export type BlastInput = z.infer<typeof BlastInputSchema>;

// ─── واجهة مخرجات محرك الانفجار ───
export interface BlastOutput {
  // نتائج الاختراق
  h_penetration: number;    // عمق الاختراق m
  lambda1: number;          // معامل تأثير شكل الرأس
  lambda2: number;          // معامل تأثير القطر
  n_exp: number;            // أُس التأثير
  C_effective: number;      // الشحنة الفعالة kg
  tsu: number;              // معامل زاوية الاختراق m
  
  // نتائج الضغط
  R_bar: number;            // البعد المختزل
  R_critical: number;       // البعد الحرج m
  sigma_max: number;        // الإجهاد الأقصى kg/cm²
  h_bar_z: number;          // عمق الاختراق المختزل
  
  // نتائج الزمن
  tau_plus: number;         // زمن الطور الموجب s
  tau_effective: number;    // الزمن الفعال s
  tau_rise: number;         // زمن صعود الضغط s
  omega: number;            // تردد الاهتزاز s⁻¹
  
  // نتائج الأحمال
  P_max: number;            // الحمل الأقصى kg/cm²
  P_equivalent: number;     // الحمل المكافئ kg/cm²
  P_design: number;         // الحمل التصميمي kg/cm²
  P_static: number;         // الحمل الساكن kg/cm²
  P_design_kPa: number;     // الحمل التصميمي kPa
  
  // نتائج السماكات
  H_roof: number;           // سماكة السقف cm
  H_wall: number;           // سماكة الجدار cm
  H_floor: number;          // سماكة الأرضية cm
  
  // حالات التحقق
  dynamicConditionMet: boolean;
  coreConditionMet: boolean;
}

// ─── الدوال الحاسوبية ───

// المعادلة (13): عمق الاختراق في التربة
export function calcPenetrationDepth(
  lambda1: number, lambda2: number, Kpr: number,
  P: number, d: number, V: number, alpha: number
): number {
  return lambda1 * lambda2 * Kpr * (P / (d * d)) * V * Math.cos(alpha * Math.PI / 180);
}

// المعادلة (14): معامل تأثير شكل الرأس الحربي
export function calcLambda1(lhdRatio: number): number {
  return 0.5 + 0.4 * Math.pow(lhdRatio, 0.666);
}

// المعادلة (15): معامل تأثير القطر
export function calcLambda2(d: number): number {
  return 2.8 * Math.pow(d, 0.333) - 1.3 * Math.pow(d, 0.5);
}

// المعادلة (16): أُس التأثير
export function calcN(lhdRatio: number): number {
  return 3.5 - lhdRatio;
}

// المعادلة (19): الشحنة الفعالة
export function calcCEffective(K1: number, C: number): number {
  return 0.95 * K1 * C;
}

// المعادلة (17): معامل زاوية الاختراق - قنبلة خارقة
export function calcTsuPenetrating(lk: number, alpha: number, n: number): number {
  return 0.5 * lk * Math.cos((alpha + n * alpha) / 2 * Math.PI / 180);
}

// المعادلة (18): معامل زاوية الاختراق - قنبلة انفجارية
export function calcTsuExplosive(dk: number): number {
  return 0.5 * dk;
}

// المعادلة (1): الضغط الزائد الساقط - سادوفسكي
export function calcSadovskyOverpressure(C: number, R: number): number {
  const cbrtC = Math.cbrt(C);
  const cbrtC2 = Math.cbrt(C * C);
  return 0.1 * cbrtC / R + 0.43 * cbrtC2 / (R * R) + 1.4 * C / (R * R * R);
}

// المعادلة (8): الزمن الفعال للموجة (دالة الاستيفاء I-9)
export function calcEffectiveTime(tauPlus: number, deltaPmax: number): number {
  const f = 0.0008 * deltaPmax * deltaPmax - 0.0384 * deltaPmax + 1.0013;
  return tauPlus * f;
}

// المعادلة (4): زمن الطور الموجب
export function calcPositivePhaseTime(C: number, R: number): number {
  return 1.7e-3 * Math.cbrt(Math.sqrt(C)) * Math.sqrt(R);
}

// المعادلة (5): الاندثار
export function calcImpulse(C: number, R: number): number {
  return 6.3 * Math.cbrt(C * C) / R;
}

// ─── المحرك الرئيسي ───
export function calculateBlastLoad(input: BlastInput): BlastOutput {
  // استخراج بيانات القنبلة
  const bomb = BOMB_DATABASE.find(b => b.id === input.bombId) || BOMB_DATABASE[4];
  const explosive = EXPLOSIVE_TABLE.find(e => e.name === input.explosiveName) || EXPLOSIVE_TABLE[0];
  const soil = SOIL_TABLE.find(s => s.name === input.soilName) || SOIL_TABLE[2];
  const stressCoeff = STRESS_COEFFICIENT_TABLE.find(sc => sc.name === input.soilName) || STRESS_COEFFICIENT_TABLE[1];
  
  // حساب الاختراق
  const lambda1 = calcLambda1(bomb.lhd_ratio);
  const lambda2 = calcLambda2(bomb.diameter_m);
  const n_exp = calcN(bomb.lhd_ratio);
  const C_effective = calcCEffective(explosive.K1, bomb.charge_kg);
  const h_penetration = calcPenetrationDepth(
    lambda1, lambda2, soil.Kpr,
    bomb.weight_kg, bomb.diameter_m, input.fallVelocity, input.fallAngle
  );
  const tsu = calcTsuPenetrating(bomb.body_length_m, input.fallAngle, n_exp);
  
  // حسابات الضغط
  const h_z = h_penetration - tsu;
  const cbrtCeff = Math.cbrt(C_effective);
  const R_equivalent = input.ceilingDepth - h_z;
  const R_bar = R_equivalent / cbrtCeff;
  const R_critical = 1.1 * cbrtCeff; // R★̄ = 1.1 (للتربة الطينية)
  const h_bar_z = h_z / cbrtCeff;
  
  // الإجهاد الأقصى
  let sigma_max = stressCoeff.A * Math.pow(R_bar, -stressCoeff.n1);
  if (h_bar_z < 0.7) {
    sigma_max = 0.6 * 1.0 * stressCoeff.A * Math.pow(R_bar, -stressCoeff.n1);
  }
  
  // حسابات الزمن
  const tau_plus = calcPositivePhaseTime(C_effective, R_equivalent);
  const tau_effective = calcEffectiveTime(tau_plus, sigma_max);
  
  // سرعة الموجة المتوسطة
  const soilWave = SOIL_WAVE_TABLE.find(sw => sw.name === input.soilName) || SOIL_WAVE_TABLE[2];
  const a0_avg = (soilWave.a0Min + soilWave.a0Max) / 2;
  const a1_avg = a0_avg / soilWave.a0_a1;
  const a0z = a0_avg * 1.133; // تقريب
  const a1z = a1_avg * 1.167;
  const a_mean = (a0_avg + a0z) / 2;
  
  const tau_rise = h_bar_z * cbrtCeff / a_mean;
  
  // تردد الاهتزاز
  const eta = input.tunnelSpanLong / input.tunnelSpanShort;
  const C_mu_clamped = 22.37 * Math.sqrt(1 + 0.6 * eta * eta + Math.pow(eta, 4));
  const B_stiffness = 0.85 * 2100000 * 9 * (10 * (10 - 1.89)) * 1e-5; // مبسط
  const m_ed = 3.82e-5; // كتلة نوعية مرجعية
  const omega = C_mu_clamped * 0.933 * Math.sqrt(B_stiffness / m_ed) / (input.tunnelSpanShort * 100);
  
  // شرط الديناميكية
  const dynamicConditionMet = tau_effective >= 0.2 * Math.PI / omega;
  
  // الأحمال
  const K_p = 0.86; // معامل النفاذية
  const K_d = dynamicConditionMet ? 0.9 : 0;
  const P_max = 2 * K_p * sigma_max;
  const P_equivalent = K_d * P_max;
  const P_static = input.ceilingDepth * 2000 / 10000; // γ = 2000 kg/m³
  const P_design = P_static + P_equivalent;
  const P_design_kPa = P_design * 98.0665; // تحويل kg/cm² إلى kPa
  
  // حساب السماكات (مبسط)
  const M_roof = P_design * input.tunnelSpanShort * 100 * input.tunnelSpanLong * 100 / 8;
  const R_bd = 200; // kg/cm² (M350)
  const R_sd = 4000; // kg/cm² (A-III)
  const mu = input.reinforcementRatio;
  const A0 = M_roof / (R_bd * input.tunnelSpanLong * 100 * 115 * 115);
  const h0_roof = Math.sqrt(M_roof / (R_bd * input.tunnelSpanLong * 100 * 0.3)) / 100;
  const H_roof = (h0_roof + 0.05) * 100; // cm
  
  // شرط نواة المقطع
  const e = M_roof / (P_design * input.tunnelSpanLong * 100 * input.tunnelSpanShort * 100);
  const e_limit = H_roof / 6;
  const coreConditionMet = e <= e_limit;
  
  return {
    h_penetration,
    lambda1,
    lambda2,
    n_exp,
    C_effective,
    tsu,
    R_bar,
    R_critical,
    sigma_max,
    h_bar_z,
    tau_plus,
    tau_effective,
    tau_rise,
    omega,
    P_max,
    P_equivalent,
    P_design,
    P_static,
    P_design_kPa,
    H_roof: Math.max(H_roof, 40),
    H_wall: H_roof * 0.7,
    H_floor: H_roof * 0.6,
    dynamicConditionMet,
    coreConditionMet,
  };
}
