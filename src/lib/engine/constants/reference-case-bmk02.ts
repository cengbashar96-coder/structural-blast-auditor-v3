/**
 * ثوابت الحالة المرجعية الكاملة — الخطوات 2 إلى 8
 * منصة المدقق الديناميكي الموحد V3.0
 *
 * جميع القيم مستخرجة من ملفي Excel والمرجع التحليلي
 * القيم المقفلة (locked) لا تُعاد كتابتها بين المحركات
 */

// ═══════════════════════════════════════════════════════════════════════
// الخطوة 2-3: المدخلات والمعاملات والاختراق
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

export const STEP2_PENETRATION = Object.freeze({
  C_ef: 334.76575,
  lambda1: 1.134667074552914,
  lambda2: 1.21253869486675,
  h_pr: 3.6495332546231958,
  R_actual: 7.6230969724513375,
  h_z: 2.6895332546232003,
  h_z_bar: 0.388095099770739,
  Zp: 5.8212740516901125,
  L_tunnel: 25.53896746890041,
  Y_diff: 0.05046674537679996,
  hb_destruction: 3.297604175036178,
  hb_cracking: 4.752375128334365,
  Zot_rock: 8.212154465777123,
});

// ═══════════════════════════════════════════════════════════════════════
// الخطوة 4: اعتماد السماكات الأولية
// ═══════════════════════════════════════════════════════════════════════

export const STEP4_LOCKED = Object.freeze({
  Hp: 70.4594848625,       // cm
  Hc: 49.8223795452,       // cm
  Hf: 42.3490226134,       // cm
  Hvct: 30,                // cm
  ht: 107.2167056901,      // cm
  Bt: 8.0520158398,        // m
  Hpc: 3.8320486334,       // m
  Pp_roof: 4.9211162574,   // kg/cm2
  Pp_wall: 3.7845046175,   // kg/cm2
});

// ═══════════════════════════════════════════════════════════════════════
// الخطوة 5: الأحمال — مسار السقف
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
// الخطوة 5/8: الأحمال — مسار الجدار
// ═══════════════════════════════════════════════════════════════════════

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
  Pct: 0.7016441670,
  Pp: 3.7845046175,
  R_ekv_gt_R_star: true,
});

// ═══════════════════════════════════════════════════════════════════════
// الخطوة 6: جداول B-1 إلى B-6
// ═══════════════════════════════════════════════════════════════════════

export const STEP6_TABLES_ROOF = Object.freeze({
  R_bar_b1: 0.35,    // B-1
  mu_table: 0.025,    // B-2
  eta_table: 0.015,   // B-2
  Kt: 1,              // B-2
  a0z: 180,           // B-3  m/s
  a1z: 80,            // B-3  m/s
  Kpod: 1.25,         // B-4
  Kp: 0.8,            // B-5
  Kd: 0.92,           // B-6
});

export const STEP6_TABLES_WALL = Object.freeze({
  R_bar_b1: 0.9,     // B-1
  mu_table: 0.009,    // B-2
  eta_table: 0.001,   // B-2
  Kt: 1.1,            // B-2
  a0z: 580,           // B-3  m/s
  a1z: 290,           // B-3  m/s
  Kpod: 1.18,         // B-4
  Kp: 1,              // B-5
  Kd: 1,              // B-6
});

// ═══════════════════════════════════════════════════════════════════════
// الخطوة 7: سماكة السقف النهائية
// ═══════════════════════════════════════════════════════════════════════

export const STEP7_CEILING = Object.freeze({
  Mp: 20000000,           // kg.cm
  mu_struct: 0.8861875,
  Rsd: 3937.5,            // kg/cm2
  h0: 67.1042712976,      // cm
  Hp_final: 70.4594848625,// cm  (h0 * 1.05)
});

// ═══════════════════════════════════════════════════════════════════════
// الخطوة 8: سماكة الجدار النهائية
// ═══════════════════════════════════════════════════════════════════════

export const STEP8_WALL = Object.freeze({
  Mp: 10000000,           // kg.cm
  Hc_final: 49.8223795452,// cm
  Hf_final: 42.3490226134,// cm
  Hvct_final: 30,         // cm
});

// ═══════════════════════════════════════════════════════════════════════
// القيم الوسيطة للخطوة 4
// ═══════════════════════════════════════════════════════════════════════

export const STEP4_INTERMEDIATE = Object.freeze({
  h_pr: STEP2_PENETRATION.h_pr,
  Zp: STEP2_PENETRATION.Zp,
  R_actual: STEP2_PENETRATION.R_actual,
  C_ef: STEP2_PENETRATION.C_ef,
  tau_ef_roof: STEP5_ROOF.tau_ef,
  tau_ef_wall: STEP5_WALL.tau_ef,
  omega_roof: STEP5_ROOF.omega,
  omega_wall: STEP5_WALL.omega,
  Pmax_roof: STEP5_ROOF.Pmax,
  Pmax_wall: STEP5_WALL.Pmax,
  P_ekv_roof: STEP5_ROOF.P_ekv,
  P_ekv_wall: STEP5_WALL.P_ekv,
  Pp_roof: STEP5_ROOF.Pp,
  Pp_wall: STEP5_WALL.Pp,
  Hp: STEP4_LOCKED.Hp,
  Hc: STEP4_LOCKED.Hc,
  Hf: STEP4_LOCKED.Hf,
  Bt: STEP4_LOCKED.Bt,
} as const);

// ═══════════════════════════════════════════════════════════════════════
// النتائج النهائية المقفلة — بعد الخطوة 8
// ═══════════════════════════════════════════════════════════════════════

export const FINAL_LOCKED_RESULTS = Object.freeze({
  // السماكات النهائية (cm)
  Hp_final: 70.4594848625,
  Hc_final: 49.8223795452,
  Hf_final: 42.3490226134,
  Hvct_final: 30,
  // أحمال السقف
  Pp_roof: 4.9211162574,
  Pmax_roof: 4.6084144906,
  P_ekv_roof: 3.8157671982,
  // أحمال الجدار
  Pp_wall: 3.7845046175,
  Pmax_wall: 6.2856466944,
  P_ekv_wall: 3.0828604505,
  // الأبعاد
  ht: 107.2167056901,
  Bt: 8.0520158398,
  Hpc: 3.8320486334,
  h_pr: 3.6495332546231958,
  // العزوم
  Mp_roof: 20000000,
  Mp_wall: 10000000,
});

// ═══════════════════════════════════════════════════════════════════════
// Guard — منع إعادة كتابة القيم المقفلة
// ═══════════════════════════════════════════════════════════════════════

const ALL_LOCKED = Object.freeze({
  ...STEP2_PENETRATION,
  ...STEP4_LOCKED,
  ...STEP5_ROOF,
  ...STEP5_WALL,
  ...STEP7_CEILING,
  ...STEP8_WALL,
});

const LOCKED_KEYS = new Set<string>([
  'C_ef', 'h_pr', 'R_actual', 'Zp',
  'ht', 'Bt', 'Hpc', 'R_ekv_roof', 'R_ekv_wall',
  'tau_ef_roof', 'tau_ef_wall', 'omega_roof', 'omega_wall',
  'Pmax_roof', 'P_ekv_roof', 'Pp_roof',
  'Pmax_wall', 'P_ekv_wall', 'Pp_wall',
  'Mp_roof', 'Mp_wall',
  'Hp', 'Hc', 'Hf', 'Hvct',
]);

export function assertLockedNotOverwritten(
  computed: Record<string, number>,
  source: string
): void {
  for (const key of LOCKED_KEYS) {
    const refVal = (ALL_LOCKED as unknown as Record<string, number>)[key];
    if (refVal !== undefined && computed[key] !== undefined) {
      const deviation = Math.abs(computed[key] - refVal);
      const relDev = deviation / Math.abs(refVal);
      if (relDev > 0.05) {
        throw new Error(
          `[LOCKED-ERR] "${key}" overwritten by "${source}". ` +
          `Ref: ${refVal}, Got: ${computed[key]}, Dev: ${(relDev * 100).toFixed(2)}%. ` +
          `Locked values are read-only.`
        );
      }
    }
  }
}

/** كائن موحد — كل القيم المرجعية في مكان واحد */
export const REFERENCE_CASE_BMK02 = Object.freeze({
  ...STEP2_INPUTS,
  ...STEP2_LOOKUPS,
  ...STEP2_GEOMETRY,
  ...STEP2_PENETRATION,
  ...STEP4_LOCKED,
  ...STEP5_ROOF,
  ...STEP5_WALL,
  ...STEP6_TABLES_ROOF,
  ...STEP6_TABLES_WALL,
  ...STEP7_CEILING,
  ...STEP8_WALL,
});
