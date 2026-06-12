// ═══════════════════════════════════════════════════════════════════════
// الثوابت المرجعية الموحدة — الخطوات 2 إلى 8
// منصة المدقق الديناميكي الموحد V3.0
// المرجع الذهبي المقفل: BMK-02 (MK83 + MEDIUM_SOIL)
// ═══════════════════════════════════════════════════════════════════════

import type { BlastLoadPath, EngineStep, LockedValueEntry, VariableDefinition } from '@/types/engine';

// ═══════════════════════════════════════════════════════════════════════
// 1. القيم المرجعية المقفلة — BMK-02
// ═══════════════════════════════════════════════════════════════════════

export const STEP2_INPUTS = Object.freeze({
  P: 441, lo_b: 3.01, lk: 1.92, dk: 0.36,
  ld_ratio: 5.3, lhd_ratio: 2, C: 215, V: 350,
  alpha: 20, beta: 22, Z: 3.7,
});

export const STEP2_LOOKUPS = Object.freeze({
  K1: 1.639, kpr_g: 1.8e-6, kpr_b: 8e-7, kpr_bt: 8e-7,
  K_kp_ct: 1.1, m1: 1.65, RbH: 200, RsH: 3000,
  gamma_b: 2500, gamma_g: 1700, Kpod_b: 1.18, Kpod_s: 1.25,
  n0: 1.25, Kbt_bt: 0.13, R_bar: 1.1,
});

export const STEP2_GEOMETRY = Object.freeze({
  a_et: 3, bp: 5, ap: 4, Lk: 50, Bk: 20, Pk: 492.25,
  Hct: 0.5, Hvct: 0.3, Hf: 0.45, Hp: 0.75,
  h_obs: 0.5, psi_p: 0.012, Ea: 2100000, xi: 0.55,
  rho_pc: 150, rho_g: 180,
});

export const STEP3_PENETRATION = Object.freeze({
  lambda1: 1.134667074552914,
  lambda2: 1.21253869486675,
  n_exp: 1.5,
  C_ef: 334.76575,
  tsu: 0.8700554755551839,
  h_pr: 2.7717367373,
  h_z: 1.9016812617,
  h_z_bar: 0.2738524483,
  R_actual: 7.6230969724513375,
  Zp: 5.8212740516901125,
  Y_diff: 0.9282632627,
  hb_destruction: 3.04871409496884,
  hb_cracking: 3.603025748599538,
});

export const STEP4_LOCKED = Object.freeze({
  Hp: 70.4594848625,
  Hc: 49.8223795452,
  Hf: 42.3490226134,
  Hvct: 30,
  ht: 107.2167056901,
  Bt: 8.0520158398,
  Hpc: 3.8320486334,
  Pp_roof: 4.9211162574,
  Pp_wall: 3.7845046175,
});

export const STEP5_ROOF = Object.freeze({
  h_bar: 0.1180386444,
  R_bar_b1: 0.35,
  R_ekv: 6.1162229173,
  R_star: 2.4255308549,
  max_bv: 2.8802590566,
  tau: 0.2649955477,
  tau_ef: 0.2377897178,
  tau_n: 0.0364676512,
  a0cp: 152.5,
  a1cp: 60.8333333333,
  omega: 561.6673670487,
  C_dyn: 46.8110958109,
  mu_struct: 0.8861875,
  eta: 1.25,
  Rsd: 3937.5,
  Rbd: 236,
  lambda: 0.124184033,
  Kp: 0.8,
  Pmax: 4.6084144906,
  Kd: 0.92,
  kpsi: 0.9,
  P_ekv: 3.8157671982,
  Pct: 1.1053490592,
  Pp: 4.9211162574,
  R_ekv_gt_R_star: true,
});

export const STEP5_WALL = Object.freeze({
  tau_theta: 0.5767495645,
  Z_wall: 7.5042156903,
  h_b: 3.4417407889,
  h_bar: 0.4966373747,
  R_bar_b1: 0.9,
  R_ekv: 7.0437416025,
  R_star: 6.2370793411,
  max_bv: 3.1428233472,
  tau: 0.0684870163,
  tau_ef: 0.0608519094,
  tau_n: 0.0111111111,
  a0cp: 540,
  a1cp: 270,
  omega: 1024.0477954056,
  C_dyn: 72.0811111111,
  mu_struct: 0.9123333333,
  eta: 1.6666666667,
  Rsd: 3937.5,
  Rbd: 236,
  lambda: 3.1449305556,
  Kp: 1,
  Pmax: 6.2856466944,
  Kd: 1,
  kpsi: 0.85,
  P_ekv: 3.0828604505,
  Pct: 0.701644167,
  Pp: 3.7845046175,
  R_ekv_gt_R_star: true,
});

export const STEP6_ROOF = Object.freeze({
  R_bar_b1: 0.35, mu_table: 0.025, eta_table: 0.015, Kt: 1,
  a0z: 180, a1z: 80, Kpod: 1.25, Kp: 0.8, Kd: 0.92,
});

export const STEP6_WALL = Object.freeze({
  R_bar_b1: 0.9, mu_table: 0.009, eta_table: 0.001, Kt: 1.1,
  a0z: 580, a1z: 290, Kpod: 1.18, Kp: 1, Kd: 1,
});

export const STEP7_CEILING = Object.freeze({
  Mp: 20000000, mu_struct: 0.8861875, Rsd: 3937.5,
  h0: 67.1042712976, Hp_final: 70.4594848625,
});

export const STEP8_WALL = Object.freeze({
  Mp: 10000000,
  Hc_final: 49.8223795452,
  Hf_final: 42.3490226134,
  Hvct_final: 30,
});

// ═══════════════════════════════════════════════════════════════════════
// 2. النتائج النهائية المقفلة
// ═══════════════════════════════════════════════════════════════════════

export const FINAL_LOCKED_RESULTS = Object.freeze({
  Hp_final: 70.4594848625,
  Hc_final: 49.8223795452,
  Hf_final: 42.3490226134,
  Hvct_final: 30,
  Pp_roof: 4.9211162574,
  Pp_wall: 3.7845046175,
  Pmax_roof: 4.6084144906,
  Pmax_wall: 6.2856466944,
  P_ekv_roof: 3.8157671982,
  P_ekv_wall: 3.0828604505,
  ht: 107.2167056901,
  Bt: 8.0520158398,
  Hpc: 3.8320486334,
  h_pr: 2.7717367373,
  omega_roof: 561.6673670487,
  omega_wall: 1024.0477954056,
  tau_ef_roof: 0.2377897178,
  tau_ef_wall: 0.0608519094,
  Mp_roof: 20000000,
  Mp_wall: 10000000,
  C_ef: 334.76575,
  R_actual: 7.6230969724513375,
  Zp: 5.8212740516901125,
  lambda1: 1.134667074552914,
  lambda2: 1.21253869486675,
});

// ═══════════════════════════════════════════════════════════════════════
// 3. سجل القيم المقفلة — Provenance Tracking
// ═══════════════════════════════════════════════════════════════════════

export const LOCKED_REGISTRY: LockedValueEntry[] = [
  { key: 'C_ef', value: 334.76575, producedByStep: 3, consumedBySteps: [5, 6], path: 'shared', tolerance: 0.01 },
  { key: 'h_pr', value: 2.7717367373, producedByStep: 3, consumedBySteps: [4, 5], path: 'shared', tolerance: 0.01 },
  { key: 'R_actual', value: 7.6230969724513375, producedByStep: 3, consumedBySteps: [5], path: 'shared', tolerance: 0.02 },
  { key: 'Zp', value: 5.8212740516901125, producedByStep: 3, consumedBySteps: [5], path: 'shared', tolerance: 0.02 },
  { key: 'lambda1', value: 1.134667074552914, producedByStep: 3, consumedBySteps: [5], path: 'shared', tolerance: 0.01 },
  { key: 'lambda2', value: 1.21253869486675, producedByStep: 3, consumedBySteps: [5], path: 'shared', tolerance: 0.01 },
  { key: 'ht', value: 107.2167056901, producedByStep: 4, consumedBySteps: [7, 8], path: 'shared', tolerance: 0.01 },
  { key: 'Bt', value: 8.0520158398, producedByStep: 4, consumedBySteps: [5], path: 'shared', tolerance: 0.01 },
  { key: 'Hp', value: 70.4594848625, producedByStep: 4, consumedBySteps: [7], path: 'shared', tolerance: 0.01 },
  { key: 'Hc', value: 49.8223795452, producedByStep: 4, consumedBySteps: [8], path: 'wall', tolerance: 0.01 },
  { key: 'Hf', value: 42.3490226134, producedByStep: 4, consumedBySteps: [8], path: 'wall', tolerance: 0.01 },
  { key: 'tau_ef_roof', value: 0.2377897178, producedByStep: 5, consumedBySteps: [6, 7], path: 'roof', tolerance: 0.01 },
  { key: 'tau_ef_wall', value: 0.0608519094, producedByStep: 5, consumedBySteps: [6, 8], path: 'wall', tolerance: 0.01 },
  { key: 'omega_roof', value: 561.6673670487, producedByStep: 5, consumedBySteps: [6], path: 'roof', tolerance: 0.01 },
  { key: 'omega_wall', value: 1024.0477954056, producedByStep: 5, consumedBySteps: [6], path: 'wall', tolerance: 0.01 },
  { key: 'Pmax_roof', value: 4.6084144906, producedByStep: 5, consumedBySteps: [6, 7], path: 'roof', tolerance: 0.01 },
  { key: 'Pmax_wall', value: 6.2856466944, producedByStep: 5, consumedBySteps: [6, 8], path: 'wall', tolerance: 0.01 },
  { key: 'P_ekv_roof', value: 3.8157671982, producedByStep: 5, consumedBySteps: [7], path: 'roof', tolerance: 0.01 },
  { key: 'P_ekv_wall', value: 3.0828604505, producedByStep: 5, consumedBySteps: [8], path: 'wall', tolerance: 0.01 },
  { key: 'Pp_roof', value: 4.9211162574, producedByStep: 5, consumedBySteps: [7], path: 'roof', tolerance: 0.01 },
  { key: 'Pp_wall', value: 3.7845046175, producedByStep: 5, consumedBySteps: [8], path: 'wall', tolerance: 0.01 },
  { key: 'Mp_roof', value: 20000000, producedByStep: 7, consumedBySteps: [], path: 'roof', tolerance: 0.01 },
  { key: 'Mp_wall', value: 10000000, producedByStep: 8, consumedBySteps: [], path: 'wall', tolerance: 0.01 },
];

// ═══════════════════════════════════════════════════════════════════════
// 4. حدود المحركات
// ═══════════════════════════════════════════════════════════════════════

export const ENGINE_BOUNDARIES = {
  penetrationToBlast: ['C_ef', 'h_pr', 'R_actual', 'Zp', 'lambda1', 'lambda2'],
  blastRoofToStructural: ['Pp_roof', 'Pmax_roof', 'P_ekv_roof', 'tau_ef_roof', 'omega_roof', 'Mp_roof'],
  blastWallToStructural: ['Pp_wall', 'Pmax_wall', 'P_ekv_wall', 'tau_ef_wall', 'omega_wall', 'Mp_wall'],
  withinBlastRoof: ['R_ekv', 'tau', 'tau_ef', 'tau_n', 'omega', 'C_dyn', 'Pmax', 'Kd', 'kpsi', 'P_ekv', 'Pct', 'Pp'],
  withinBlastWall: ['R_ekv', 'tau', 'tau_ef', 'tau_n', 'omega', 'C_dyn', 'Pmax', 'Kd', 'kpsi', 'P_ekv', 'Pct', 'Pp'],
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 5. الكائن الموحد
// ═══════════════════════════════════════════════════════════════════════

export const REFERENCE_CASE_BMK02 = Object.freeze({
  ...STEP2_INPUTS,
  ...STEP2_LOOKUPS,
  ...STEP2_GEOMETRY,
  ...STEP3_PENETRATION,
  ...STEP4_LOCKED,
  ...STEP5_ROOF,
  ...STEP5_WALL,
  ...STEP6_ROOF,
  ...STEP6_WALL,
  ...STEP7_CEILING,
  ...STEP8_WALL,
});

// ═══════════════════════════════════════════════════════════════════════
// 6. Guard — منع إعادة كتابة القيم المقفلة
// ═══════════════════════════════════════════════════════════════════════

const LOCKED_KEYS = new Set<string>(LOCKED_REGISTRY.map(e => e.key));

export function assertLockedNotOverwritten(
  computed: Record<string, number>,
  source: string,
  maxDeviationPct: number = 5
): void {
  for (const entry of LOCKED_REGISTRY) {
    const calcVal = computed[entry.key];
    if (calcVal !== undefined) {
      const deviation = Math.abs(calcVal - entry.value);
      const relDev = (deviation / Math.abs(entry.value)) * 100;
      if (relDev > maxDeviationPct) {
        throw new Error(
          `[LOCKED-ERR] "${entry.key}" overwritten by "${source}". ` +
          `Ref: ${entry.value}, Got: ${calcVal}, Dev: ${relDev.toFixed(2)}%. ` +
          `Locked values are read-only.`
        );
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 7. جدول المتغيرات الموحد
// ═══════════════════════════════════════════════════════════════════════

export const UNIFIED_VARIABLE_TABLE: VariableDefinition[] = [
  // ─── المدخلات (input) ───
  { name: 'P', symbol: 'P', descriptionAr: 'وزن القنبلة', descriptionEn: 'Weapon weight', unit: 'kg', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'V', symbol: 'V', descriptionAr: 'سرعة الاصطدام', descriptionEn: 'Impact velocity', unit: 'm/s', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'alpha', symbol: 'α', descriptionAr: 'زاوية الاصطدام', descriptionEn: 'Impact angle', unit: 'deg', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'Z', symbol: 'Z', descriptionAr: 'عمق السقف', descriptionEn: 'Ceiling depth', unit: 'm', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'C', symbol: 'C', descriptionAr: 'وزن الشحنة', descriptionEn: 'Charge weight', unit: 'kg', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'dk', symbol: 'dk', descriptionAr: 'قطر القنبلة', descriptionEn: 'Weapon diameter', unit: 'm', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'lk', symbol: 'lk', descriptionAr: 'طول الجسم', descriptionEn: 'Body length', unit: 'm', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'lhd_ratio', symbol: 'Lh/D', descriptionAr: 'نسبة طول الرأس للقطر', descriptionEn: 'Nose length/Diameter ratio', unit: '-', source: 'Weapon DB', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'ld_ratio', symbol: 'L/D', descriptionAr: 'نسبة الطول للقطر', descriptionEn: 'Length/Diameter ratio', unit: '-', source: 'Weapon DB', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'lo_b', symbol: 'lo_b', descriptionAr: 'الطول الكلي', descriptionEn: 'Overall length', unit: 'm', source: 'Weapon DB', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'beta', symbol: 'β', descriptionAr: 'زاوية الانعكاس', descriptionEn: 'Reflection angle', unit: 'deg', source: 'User', category: 'input', dependsOn: [], locked: false, step: 2, path: 'shared' },
  // ─── قيم البحث (lookup) ───
  { name: 'K1', symbol: 'K₁', descriptionAr: 'معامل المتفجرات', descriptionEn: 'Explosive coefficient', unit: '-', source: 'I-5', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'kpr_g', symbol: 'Kpr_g', descriptionAr: 'معامل اختراق التربة', descriptionEn: 'Soil penetration coeff', unit: '-', source: 'I-1', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'm1', symbol: 'm₁', descriptionAr: 'معامل تضعيف الإجهاد', descriptionEn: 'Stress attenuation exponent', unit: '-', source: 'I-3', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'RbH', symbol: 'RbH', descriptionAr: 'مقاومة الخرسانة', descriptionEn: 'Concrete resistance', unit: 'kg/cm²', source: 'I-6', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'RsH', symbol: 'RsH', descriptionAr: 'إجهاد خضوع الحديد', descriptionEn: 'Steel yield strength', unit: 'kg/cm²', source: 'I-7', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'gamma_b', symbol: 'γb', descriptionAr: 'كثافة الخرسانة', descriptionEn: 'Concrete density', unit: 'kg/m³', source: 'Standard', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'gamma_g', symbol: 'γg', descriptionAr: 'كثافة التربة', descriptionEn: 'Soil density', unit: 'kg/m³', source: 'I-1', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'Kpod_b', symbol: 'Kpod_b', descriptionAr: 'معامل التأسيس خرسانة', descriptionEn: 'Subgrade coeff concrete', unit: '-', source: 'I-4', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'Kpod_s', symbol: 'Kpod_s', descriptionAr: 'معامل التأسيس تربة', descriptionEn: 'Subgrade coeff soil', unit: '-', source: 'I-4', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'n0', symbol: 'n₀', descriptionAr: 'معامل الأمان', descriptionEn: 'Safety factor', unit: '-', source: 'Code', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  { name: 'R_bar', symbol: 'R̄', descriptionAr: 'معامل البعد المختزل', descriptionEn: 'Normalized distance coeff', unit: '-', source: 'B-1', category: 'lookup', dependsOn: [], locked: false, step: 2, path: 'shared' },
  // ─── محسوبة (computed) ───
  { name: 'lambda1', symbol: 'λ₁', descriptionAr: 'معامل شكل الرأس', descriptionEn: 'Nose shape coefficient', unit: '-', source: 'Eq.14', category: 'computed', dependsOn: ['lhd_ratio'], locked: true, step: 3, path: 'shared', formula: '0.5 + 0.4×(Lh/D)^0.666' },
  { name: 'lambda2', symbol: 'λ₂', descriptionAr: 'معامل تأثير القطر', descriptionEn: 'Diameter effect coefficient', unit: '-', source: 'Eq.15', category: 'computed', dependsOn: ['dk'], locked: true, step: 3, path: 'shared', formula: '2.8×d^0.333 - 1.3×d^0.5' },
  { name: 'n_exp', symbol: 'n', descriptionAr: 'أُس التأثير', descriptionEn: 'Influence exponent', unit: '-', source: 'Eq.16', category: 'computed', dependsOn: ['lhd_ratio'], locked: false, step: 3, path: 'shared', formula: '3.5 - Lh/D' },
  { name: 'C_ef', symbol: 'C_ef', descriptionAr: 'الشحنة الفعالة', descriptionEn: 'Effective charge', unit: 'kg', source: 'Eq.19', category: 'computed', dependsOn: ['K1', 'C'], locked: true, step: 3, path: 'shared', formula: '0.95×K₁×C' },
  { name: 'tsu', symbol: 'τ', descriptionAr: 'معامل زاوية الاختراق', descriptionEn: 'Penetration angle coeff', unit: 'm', source: 'Eq.17', category: 'computed', dependsOn: ['lk', 'alpha', 'n_exp'], locked: false, step: 3, path: 'shared' },
  { name: 'h_pr', symbol: 'h_pr', descriptionAr: 'عمق الاختراق', descriptionEn: 'Penetration depth', unit: 'm', source: 'Eq.13', category: 'computed', dependsOn: ['lambda1', 'lambda2', 'kpr_g', 'P', 'dk', 'V', 'alpha'], locked: true, step: 3, path: 'shared', formula: 'λ₁×λ₂×Kpr×(P/d²)×V×cos(α)' },
  { name: 'h_z', symbol: 'h_z', descriptionAr: 'العمق الصافي', descriptionEn: 'Net depth', unit: 'm', source: 'Derived', category: 'computed', dependsOn: ['h_pr', 'tsu'], locked: false, step: 3, path: 'shared' },
  { name: 'R_actual', symbol: 'R_actual', descriptionAr: 'البعد الشعاعي الفعلي', descriptionEn: 'Actual radial distance', unit: 'm', source: 'Derived', category: 'computed', dependsOn: ['h_pr', 'Z'], locked: true, step: 3, path: 'shared' },
  { name: 'Zp', symbol: 'Z_p', descriptionAr: 'البعد المختزل', descriptionEn: 'Scaled distance', unit: '-', source: 'Derived', category: 'computed', dependsOn: ['R_actual', 'C_ef'], locked: true, step: 3, path: 'shared' },
  // ─── مقفلة — الخطوة 4 ───
  { name: 'Hp', symbol: 'Hp', descriptionAr: 'سماكة السقف', descriptionEn: 'Ceiling thickness', unit: 'cm', source: 'Step4', category: 'locked', dependsOn: ['h0'], locked: true, step: 4, path: 'shared' },
  { name: 'Hc', symbol: 'Hc', descriptionAr: 'سماكة الجدار', descriptionEn: 'Wall thickness', unit: 'cm', source: 'Step4', category: 'locked', dependsOn: ['Mp_wall'], locked: true, step: 4, path: 'wall' },
  { name: 'Hf', symbol: 'Hf', descriptionAr: 'سماكة الأرضية', descriptionEn: 'Floor thickness', unit: 'cm', source: 'Step4', category: 'locked', dependsOn: [], locked: true, step: 4, path: 'wall' },
  { name: 'Hvct', symbol: 'Hvct', descriptionAr: 'سماكة الجدار الداخلي', descriptionEn: 'Inner wall thickness', unit: 'cm', source: 'Step4', category: 'locked', dependsOn: [], locked: true, step: 4, path: 'wall' },
  { name: 'ht', symbol: 'ht', descriptionAr: 'العمق الكلي', descriptionEn: 'Total depth', unit: 'cm', source: 'Step4', category: 'locked', dependsOn: ['Hp', 'ap', 'Hf'], locked: true, step: 4, path: 'shared' },
  { name: 'Bt', symbol: 'Bt', descriptionAr: 'البحر المكافئ', descriptionEn: 'Equivalent span', unit: 'm', source: 'Step4', category: 'locked', dependsOn: ['ap', 'bp'], locked: true, step: 4, path: 'shared' },
  // ─── مقفلة — الخطوة 5 سقف ───
  { name: 'omega_roof', symbol: 'ω_roof', descriptionAr: 'تردد السقف الطبيعي', descriptionEn: 'Roof natural frequency', unit: 'rad/s', source: 'Step5', category: 'locked', dependsOn: ['Bt', 'Hp', 'Ea', 'xi'], locked: true, step: 5, path: 'roof' },
  { name: 'tau_ef_roof', symbol: 'τ_ef_roof', descriptionAr: 'الزمن الفعال سقف', descriptionEn: 'Effective time roof', unit: 's', source: 'Step5', category: 'locked', dependsOn: ['tau', 'Pmax'], locked: true, step: 5, path: 'roof' },
  { name: 'Pmax_roof', symbol: 'Pmax_roof', descriptionAr: 'الضغط الأقصى سقف', descriptionEn: 'Max pressure roof', unit: 'kg/cm²', source: 'Step5', category: 'locked', dependsOn: ['R_ekv', 'C_ef', 'Kd'], locked: true, step: 5, path: 'roof' },
  { name: 'P_ekv_roof', symbol: 'P_ekv_roof', descriptionAr: 'الضغط المكافئ سقف', descriptionEn: 'Equivalent pressure roof', unit: 'kg/cm²', source: 'Step5', category: 'locked', dependsOn: ['Pmax', 'Kd', 'kpsi'], locked: true, step: 5, path: 'roof' },
  { name: 'Pp_roof', symbol: 'Pp_roof', descriptionAr: 'الحمل التصميمي سقف', descriptionEn: 'Design load roof', unit: 'kg/cm²', source: 'Step5', category: 'locked', dependsOn: ['P_ekv', 'Pct'], locked: true, step: 5, path: 'roof' },
  // ─── مقفلة — الخطوة 5 جدار ───
  { name: 'omega_wall', symbol: 'ω_wall', descriptionAr: 'تردد الجدار الطبيعي', descriptionEn: 'Wall natural frequency', unit: 'rad/s', source: 'Step5', category: 'locked', dependsOn: ['Bt', 'Hc', 'Ea', 'xi'], locked: true, step: 5, path: 'wall' },
  { name: 'tau_ef_wall', symbol: 'τ_ef_wall', descriptionAr: 'الزمن الفعال جدار', descriptionEn: 'Effective time wall', unit: 's', source: 'Step5', category: 'locked', dependsOn: ['tau', 'Pmax'], locked: true, step: 5, path: 'wall' },
  { name: 'Pmax_wall', symbol: 'Pmax_wall', descriptionAr: 'الضغط الأقصى جدار', descriptionEn: 'Max pressure wall', unit: 'kg/cm²', source: 'Step5', category: 'locked', dependsOn: ['R_ekv', 'C_ef', 'Kd'], locked: true, step: 5, path: 'wall' },
  { name: 'P_ekv_wall', symbol: 'P_ekv_wall', descriptionAr: 'الضغط المكافئ جدار', descriptionEn: 'Equivalent pressure wall', unit: 'kg/cm²', source: 'Step5', category: 'locked', dependsOn: ['Pmax', 'Kd', 'kpsi'], locked: true, step: 5, path: 'wall' },
  { name: 'Pp_wall', symbol: 'Pp_wall', descriptionAr: 'الحمل التصميمي جدار', descriptionEn: 'Design load wall', unit: 'kg/cm²', source: 'Step5', category: 'locked', dependsOn: ['P_ekv', 'Pct'], locked: true, step: 5, path: 'wall' },
  // ─── مخرجات — الخطوة 7 ───
  { name: 'Mp_roof', symbol: 'Mp_roof', descriptionAr: 'عزم السقف', descriptionEn: 'Ceiling moment', unit: 'kg.cm', source: 'Step7', category: 'locked', dependsOn: ['Pp_roof', 'ap'], locked: true, step: 7, path: 'roof' },
  { name: 'h0', symbol: 'h₀', descriptionAr: 'العمق الفعال', descriptionEn: 'Effective depth', unit: 'cm', source: 'Step7', category: 'computed', dependsOn: ['Mp', 'mu_struct', 'Rsd'], locked: false, step: 7, path: 'roof' },
  // ─── مخرجات — الخطوة 8 ───
  { name: 'Mp_wall', symbol: 'Mp_wall', descriptionAr: 'عزم الجدار', descriptionEn: 'Wall moment', unit: 'kg.cm', source: 'Step8', category: 'locked', dependsOn: ['Pp_wall', 'ap'], locked: true, step: 8, path: 'wall' },
  { name: 'Hc_final', symbol: 'Hc_final', descriptionAr: 'سماكة الجدار النهائية', descriptionEn: 'Final wall thickness', unit: 'cm', source: 'Step8', category: 'output', dependsOn: ['Mp_wall', 'mu_struct', 'Rsd'], locked: true, step: 8, path: 'wall' },
  { name: 'Hf_final', symbol: 'Hf_final', descriptionAr: 'سماكة الأرضية النهائية', descriptionEn: 'Final floor thickness', unit: 'cm', source: 'Step8', category: 'output', dependsOn: [], locked: true, step: 8, path: 'wall' },
  { name: 'Hvct_final', symbol: 'Hvct_final', descriptionAr: 'سماكة الجدار الداخلي النهائية', descriptionEn: 'Final inner wall thickness', unit: 'cm', source: 'Step8', category: 'output', dependsOn: [], locked: true, step: 8, path: 'wall' },
];

// ─── Helper functions ───

export function getVariableByName(name: string): VariableDefinition | undefined {
  return UNIFIED_VARIABLE_TABLE.find(v => v.name === name);
}

export function getVariablesByCategory(category: VariableDefinition['category']): VariableDefinition[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.category === category);
}

export function getVariablesByStep(step: EngineStep): VariableDefinition[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.step === step);
}

export function getVariablesByPath(path: BlastLoadPath | 'shared'): VariableDefinition[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.path === path);
}

export function getLockedVariables(): VariableDefinition[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.locked);
}

export function isLocked(key: string): boolean {
  return LOCKED_KEYS.has(key);
}
