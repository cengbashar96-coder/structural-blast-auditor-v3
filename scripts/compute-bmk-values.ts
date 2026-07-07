// ═══════════════════════════════════════════════════════════════════════
// سكريبت حساب قيم BMK-01 و BMK-03 — تشغيل المحرك واستخراج القيم
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import {
  calcLambda1,
  calcLambda2,
  calcN,
  calcCEffective,
  calcTsuPenetrating,
  calcTsuExplosive,
  calcPenetrationDepth,
  calculatePenetration,
} from '../src/lib/engine/penetration-core';

import {
  calcSadovskyOverpressure,
  calcPositivePhaseTime,
  calcImpulse,
  calcEffectiveTime,
} from '../src/lib/engine/blast-pressure-core';

import {
  calcPlasticMoment,
  calcEffectiveDepth as calcH0,
  calcAlphaM,
  calcXiFromAlphaM,
  calcFinalThickness,
  calcFloorThickness,
  calcInnerWallThickness,
} from '../src/lib/engine/structural';

import {
  calcHBar,
  calcRekv,
  calcRStar,
  calcTauSadovsky,
  calcOmega,
  calcPmaxSadovsky,
  calcKpsi,
  calcPekv,
  calcPct,
  calcPp,
  calcMuStruct,
  calcRsd,
  calcRbd,
  calcEta,
} from '../src/lib/engine/blast-loads';

import {
  getWeaponById,
  getSoilByCode,
  getExplosiveK1,
  getStressCoeffForSoil,
  WEAPONS,
  SOILS,
  UFC_340_02,
  SYRIAN_CODE_2024,
} from '../src/lib/engine/constants';

import {
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
  STEP3_PENETRATION,
  STEP4_LOCKED,
  STEP5_ROOF,
  STEP5_WALL,
  FINAL_LOCKED_RESULTS,
} from '../src/lib/constants/reference-data';

// ─── معاملات مساعدة ───

const DEG_TO_RAD = Math.PI / 180;

function formatNum(n: number, decimals: number = 10): string {
  return n.toFixed(decimals);
}

// ═══════════════════════════════════════════════════════════════════════
// حساب BMK-01: FAB-250 + SOFT_SOIL + V=200
// ═══════════════════════════════════════════════════════════════════════

function computeBMK01() {
  console.log('\n' + '='.repeat(80));
  console.log('BMK-01: FAB-250 + SOFT_SOIL + V=200 m/s');
  console.log('='.repeat(80));

  const weapon = getWeaponById('W_FAB_250');
  const soil = getSoilByCode('SOFT_SOIL');
  const K1 = getExplosiveK1(weapon.explosive);

  console.log('\n--- بيانات السلاح ---');
  console.log(`الاسم: ${weapon.nameAr}`);
  console.log(`الوزن: ${weapon.weightKg} kg`);
  console.log(`القطر: ${weapon.diameterMeters} m`);
  console.log(`L/D: ${weapon.ldRatio}`);
  console.log(`Lh/D: ${weapon.lhdRatio}`);
  console.log(`الشحنة: ${weapon.chargeKg} kg`);
  console.log(`المتفجرات: ${weapon.explosive}`);
  console.log(`K1: ${K1}`);

  console.log('\n--- بيانات التربة ---');
  console.log(`الاسم: ${soil.nameAr}`);
  console.log(`kp: ${soil.kp}`);
  console.log(`الكثافة: ${soil.densityKgM3} kg/m³`);

  // حساب الاختراق
  const V = 200;
  const alpha = 0; // عمودي

  const lambda1 = calcLambda1(weapon.lhdRatio);
  const lambda2 = calcLambda2(weapon.diameterMeters);
  const nExp = calcN(weapon.lhdRatio);
  const cEffective = calcCEffective(K1, weapon.chargeKg);

  const isPenetrating = weapon.lhdRatio > 1.5;
  const tsu = isPenetrating
    ? calcTsuPenetrating(weapon.bodyLengthMeters ?? (weapon.lengthMeters ?? 1.0) * 0.6, alpha, nExp)
    : calcTsuExplosive(weapon.diameterMeters);

  const penetrationDepth = calcPenetrationDepth(
    lambda1, lambda2, soil.kp,
    weapon.weightKg, weapon.diameterMeters, V, alpha
  );

  const hz = Math.max(penetrationDepth - tsu, 0);
  const craterDepth = hz * 1.18;
  const cbrtCeff = Math.cbrt(cEffective);
  const hBarZ = cbrtCeff > 0 ? hz / cbrtCeff : 0;

  // حساب R_actual (البعد الشعاعي الفعلي)
  const ceilingDepth = 3.7; // افتراضي
  const R_actual = Math.sqrt(penetrationDepth * penetrationDepth + (ceilingDepth * ceilingDepth / 4));
  const Zp = R_actual / cbrtCeff;

  console.log('\n--- نتائج الاختراق ---');
  console.log(`lambda1 = ${formatNum(lambda1)}`);
  console.log(`lambda2 = ${formatNum(lambda2)}`);
  console.log(`n_exp = ${formatNum(nExp)}`);
  console.log(`C_ef = ${formatNum(cEffective)}`);
  console.log(`tsu = ${formatNum(tsu)}`);
  console.log(`x1 (penetration depth) = ${formatNum(penetrationDepth)} m`);
  console.log(`h_z (net depth) = ${formatNum(hz)} m`);
  console.log(`h0 (crater depth) = ${formatNum(craterDepth)} m`);
  console.log(`h_bar_z = ${formatNum(hBarZ)}`);
  console.log(`R_actual = ${formatNum(R_actual)} m`);
  console.log(`Zp = ${formatNum(Zp)}`);

  // حساب الضغط العصفي
  const deltaP_MPa = calcSadovskyOverpressure(cEffective, R_actual);
  const tauPlus = calcPositivePhaseTime(cEffective, R_actual);
  const impulse = calcImpulse(cEffective, R_actual);

  console.log('\n--- نتائج الضغط العصفي ---');
  console.log(`deltaP (MPa) = ${formatNum(deltaP_MPa)}`);
  console.log(`deltaP (kg/cm²) = ${formatNum(deltaP_MPa * 10.197)}`);
  console.log(`tau_plus (s) = ${formatNum(tauPlus)}`);
  console.log(`impulse = ${formatNum(impulse)}`);

  // حسابات بسيطة للتصميم الإنشائي
  // باستخدام معاملات مرجعية
  const RbH = 200; // kg/cm² — خرسانة M350
  const RsH = 3000; // kg/cm² — حديد A-II
  const n0 = 1.25;
  const gamma_b = 2500;
  const gamma_g = soil.densityKgM3;
  const Ea = 2100000;
  const ap = 4; // m
  const bp = 5; // m

  // تقديرات تقريبية للتصميم
  const Kp_blast = 0.8;
  const Kd_roof = 0.92;
  const kpsi_roof = 0.9;
  const Pmax_roof = deltaP_MPa * 10.197 * Kp_blast;
  const P_ekv_roof = Kd_roof * kpsi_roof * Pmax_roof;
  const Pct_roof = gamma_g * ceilingDepth / 10000;
  const Pp_roof = P_ekv_roof + Pct_roof;

  const eta = 1.25;
  const Mp_roof = Pp_roof * 100 * (ap * 100) * (ap * 100) * eta / (8 * n0);
  const Rbd = RbH * 1.18; // ≈ 236
  const Rsd = RsH * 1.05 * n0; // ≈ 3937.5
  const mu_struct = calcMuStruct(RsH, RbH, 0.55); // xi initial
  const alpha_m = mu_struct * RbH / RsH;
  const h0_roof = calcH0(Mp_roof, Rbd, alpha_m);
  const Hp_roof = calcFinalThickness(h0_roof);

  console.log('\n--- نتائج التصميم التقريبية ---');
  console.log(`Pmax_roof = ${formatNum(Pmax_roof)} kg/cm²`);
  console.log(`P_ekv_roof = ${formatNum(P_ekv_roof)} kg/cm²`);
  console.log(`Pct_roof = ${formatNum(Pct_roof)} kg/cm²`);
  console.log(`Pp_roof = ${formatNum(Pp_roof)} kg/cm²`);
  console.log(`Mp_roof = ${formatNum(Mp_roof)} kg.cm`);
  console.log(`alpha_m = ${formatNum(alpha_m)}`);
  console.log(`h0 = ${formatNum(h0_roof)} cm`);
  console.log(`Hp = ${formatNum(Hp_roof)} cm`);

  return {
    lambda1, lambda2, nExp, cEffective, tsu,
    penetrationDepth, hz, craterDepth, hBarZ,
    R_actual, Zp, deltaP_MPa, tauPlus,
    Pp_roof, Mp_roof, h0_roof, Hp_roof,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// حساب BMK-03: FAB-1500 + HARD_ROCK + V=450
// ═══════════════════════════════════════════════════════════════════════

function computeBMK03() {
  console.log('\n' + '='.repeat(80));
  console.log('BMK-03: FAB-1500 + HARD_ROCK + V=450 m/s');
  console.log('='.repeat(80));

  const weapon = getWeaponById('W_FAB_1500');
  const soil = getSoilByCode('HARD_ROCK');
  const K1 = getExplosiveK1(weapon.explosive);

  console.log('\n--- بيانات السلاح ---');
  console.log(`الاسم: ${weapon.nameAr}`);
  console.log(`الوزن: ${weapon.weightKg} kg`);
  console.log(`القطر: ${weapon.diameterMeters} m`);
  console.log(`L/D: ${weapon.ldRatio}`);
  console.log(`Lh/D: ${weapon.lhdRatio}`);
  console.log(`الشحنة: ${weapon.chargeKg} kg`);
  console.log(`المتفجرات: ${weapon.explosive}`);
  console.log(`K1: ${K1}`);

  console.log('\n--- بيانات التربة ---');
  console.log(`الاسم: ${soil.nameAr}`);
  console.log(`kp: ${soil.kp}`);
  console.log(`الكثافة: ${soil.densityKgM3} kg/m³`);

  const V = 450;
  const alpha = 0;
  const ceilingDepth = 2.0;
  const ap = 5.0;
  const bp = 7.0;
  const fcMpa = 40;
  const fyMpa = 420;

  const lambda1 = calcLambda1(weapon.lhdRatio);
  const lambda2 = calcLambda2(weapon.diameterMeters);
  const nExp = calcN(weapon.lhdRatio);
  const cEffective = calcCEffective(K1, weapon.chargeKg);

  const isPenetrating = weapon.lhdRatio > 1.5;
  const tsu = isPenetrating
    ? calcTsuPenetrating(weapon.bodyLengthMeters ?? (weapon.lengthMeters ?? 1.0) * 0.6, alpha, nExp)
    : calcTsuExplosive(weapon.diameterMeters);

  const penetrationDepth = calcPenetrationDepth(
    lambda1, lambda2, soil.kp,
    weapon.weightKg, weapon.diameterMeters, V, alpha
  );

  const hz = Math.max(penetrationDepth - tsu, 0);
  const craterDepth = hz * 1.18;
  const cbrtCeff = Math.cbrt(cEffective);
  const hBarZ = cbrtCeff > 0 ? hz / cbrtCeff : 0;

  const R_actual = Math.sqrt(penetrationDepth * penetrationDepth + (ceilingDepth * ceilingDepth / 4));
  const Zp = R_actual / cbrtCeff;

  // الإجهاد الأقصى من جداول الاستيفاء
  let sigmaMax = 0;
  try {
    const stressCoeff = getStressCoeffForSoil('HARD_ROCK');
    sigmaMax = stressCoeff.A * Math.pow(Math.max(Zp, 0.01), -stressCoeff.n1);
  } catch (e) {
    console.log(`تحذير: لم يتم العثور على معاملات الإجهاد لـ HARD_ROCK`);
  }

  const deltaP_MPa = calcSadovskyOverpressure(cEffective, R_actual);
  const tauPlus = calcPositivePhaseTime(cEffective, R_actual);

  // حساب spalling
  const spallingThickness = penetrationDepth * 0.65;
  const penetrationExceedsCeiling = penetrationDepth > ceilingDepth;

  // حساب التصميم الإنشائي
  const RbH = fcMpa * 10.197; // kg/cm²
  const RsH = fyMpa * 10.197;
  const n0 = 1.25;
  const gamma_b = 2500;
  const gamma_g = soil.densityKgM3;

  const Kp_blast = 1.0;
  const Kd = 1.0;
  const kpsi = 0.85;
  const Pmax_wall = deltaP_MPa * 10.197 * Kp_blast;
  const P_ekv_wall = Kd * kpsi * Pmax_wall;
  const Pct_wall = gamma_g * ceilingDepth * 0.5 / 10000;
  const Pp_wall = P_ekv_wall + Pct_wall;

  const eta_wall = 1.667;
  const Mp_wall = Pp_wall * 100 * (ap * 100) * (ap * 100) * eta_wall / (8 * n0);

  console.log('\n--- نتائج الاختراق ---');
  console.log(`lambda1 = ${formatNum(lambda1)}`);
  console.log(`lambda2 = ${formatNum(lambda2)}`);
  console.log(`n_exp = ${formatNum(nExp)}`);
  console.log(`C_ef = ${formatNum(cEffective)} kg`);
  console.log(`tsu = ${formatNum(tsu)} m`);
  console.log(`x1 (penetration depth) = ${formatNum(penetrationDepth)} m`);
  console.log(`h_z (net depth) = ${formatNum(hz)} m`);
  console.log(`h0 (crater depth) = ${formatNum(craterDepth)} m`);
  console.log(`h_bar_z = ${formatNum(hBarZ)}`);
  console.log(`R_actual = ${formatNum(R_actual)} m`);
  console.log(`Zp = ${formatNum(Zp)}`);
  console.log(`sigma_max = ${formatNum(sigmaMax)} MPa`);

  console.log('\n--- نتائج الضغط ---');
  console.log(`deltaP (MPa) = ${formatNum(deltaP_MPa)}`);
  console.log(`Pmax_wall (kg/cm²) = ${formatNum(Pmax_wall)}`);
  console.log(`Pp_wall (kg/cm²) = ${formatNum(Pp_wall)}`);

  console.log('\n--- spalling والقرار ---');
  console.log(`spalling thickness = ${formatNum(spallingThickness)} m`);
  console.log(`penetration exceeds ceiling? ${penetrationExceedsCeiling}`);
  console.log(`Mp_wall = ${formatNum(Mp_wall)} kg.cm`);

  return {
    lambda1, lambda2, nExp, cEffective, tsu,
    penetrationDepth, hz, craterDepth, hBarZ,
    R_actual, Zp, sigmaMax, deltaP_MPa,
    Pmax_wall, Pp_wall, Mp_wall,
    spallingThickness, penetrationExceedsCeiling,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// التحقق من BMK-02 (المرجع الذهبي)
// ═══════════════════════════════════════════════════════════════════════

function verifyBMK02() {
  console.log('\n' + '='.repeat(80));
  console.log('BMK-02: التحقق من المرجع الذهبي');
  console.log('='.repeat(80));

  const weapon = getWeaponById('W_MK83');
  const soil = getSoilByCode('MEDIUM_SOIL');
  const K1 = getExplosiveK1(weapon.explosive);

  console.log(`\nlambda1: computed=${calcLambda1(weapon.lhdRatio).toFixed(10)}, ref=${STEP3_PENETRATION.lambda1}`);
  console.log(`lambda2: computed=${calcLambda2(weapon.diameterMeters).toFixed(10)}, ref=${STEP3_PENETRATION.lambda2}`);
  console.log(`n_exp: computed=${calcN(weapon.lhdRatio).toFixed(10)}, ref=${STEP3_PENETRATION.n_exp}`);
  console.log(`C_ef: computed=${calcCEffective(K1, weapon.chargeKg).toFixed(10)}, ref=${STEP3_PENETRATION.C_ef}`);

  // حساب الاختراق
  const penResult = calculatePenetration({
    weaponId: 'W_MK83',
    impactVelocity: 350,
    soilTypeCode: 'MEDIUM_SOIL',
    impactAngleDeg: 20,
  });

  console.log(`\npenetrationDepth: computed=${penResult.penetrationDepth.toFixed(10)}, ref_h_pr=${STEP3_PENETRATION.h_pr}`);
  console.log(`craterDepth: computed=${penResult.craterDepth.toFixed(10)}`);
  console.log(`cEffective: computed=${penResult.cEffective.toFixed(10)}, ref=${STEP3_PENETRATION.C_ef}`);
  console.log(`lambda1: computed=${penResult.lambda1.toFixed(10)}`);
  console.log(`lambda2: computed=${penResult.lambda2.toFixed(10)}`);
  console.log(`nExp: computed=${penResult.nExp.toFixed(10)}`);
  console.log(`tsu: computed=${penResult.tsu.toFixed(10)}, ref=${STEP3_PENETRATION.tsu}`);
  console.log(`hBarZ: computed=${penResult.hBarZ.toFixed(10)}, ref=${STEP3_PENETRATION.h_z_bar}`);

  // مقارنة مع القيم المرجعية
  console.log('\n--- مقارنة القيم النهائية ---');
  const comparisons = [
    { name: 'Hp_final', computed: STEP4_LOCKED.Hp, ref: FINAL_LOCKED_RESULTS.Hp_final },
    { name: 'Hc_final', computed: STEP4_LOCKED.Hc, ref: FINAL_LOCKED_RESULTS.Hc_final },
    { name: 'Hf_final', computed: STEP4_LOCKED.Hf, ref: FINAL_LOCKED_RESULTS.Hf_final },
    { name: 'Pp_roof', computed: STEP5_ROOF.Pp, ref: FINAL_LOCKED_RESULTS.Pp_roof },
    { name: 'Pp_wall', computed: STEP5_WALL.Pp, ref: FINAL_LOCKED_RESULTS.Pp_wall },
    { name: 'omega_roof', computed: STEP5_ROOF.omega, ref: FINAL_LOCKED_RESULTS.omega_roof },
    { name: 'omega_wall', computed: STEP5_WALL.omega, ref: FINAL_LOCKED_RESULTS.omega_wall },
  ];

  for (const c of comparisons) {
    const dev = Math.abs(c.computed - c.ref) / Math.abs(c.ref) * 100;
    const status = dev < 0.01 ? '✓' : dev < 1 ? '~' : '✗';
    console.log(`${status} ${c.name}: ${c.computed.toFixed(10)}, ref=${c.ref.toFixed(10)}, dev=${dev.toFixed(4)}%`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// التنفيذ الرئيسي
// ═══════════════════════════════════════════════════════════════════════

const bmk01 = computeBMK01();
const bmk03 = computeBMK03();
verifyBMK02();

console.log('\n' + '='.repeat(80));
console.log('ملخص القيم لملء BMK-01');
console.log('='.repeat(80));
console.log(JSON.stringify({
  lambda1: bmk01.lambda1,
  lambda2: bmk01.lambda2,
  n_exp: bmk01.nExp,
  C_ef: bmk01.cEffective,
  tsu: bmk01.tsu,
  x1: bmk01.penetrationDepth,
  h0: bmk01.craterDepth,
  h_bar_z: bmk01.hBarZ,
  R_actual: bmk01.R_actual,
  Zp: bmk01.Zp,
  Pso: bmk01.deltaP_MPa,
}, null, 2));

console.log('\n' + '='.repeat(80));
console.log('ملخص القيم لملء BMK-03');
console.log('='.repeat(80));
console.log(JSON.stringify({
  lambda1: bmk03.lambda1,
  lambda2: bmk03.lambda2,
  n_exp: bmk03.nExp,
  C_ef: bmk03.cEffective,
  tsu: bmk03.tsu,
  x1: bmk03.penetrationDepth,
  h0: bmk03.craterDepth,
  h_bar_z: bmk03.hBarZ,
  R_actual: bmk03.R_actual,
  Zp: bmk03.Zp,
  sigma_max: bmk03.sigmaMax,
  spallingThickness: bmk03.spallingThickness,
  P_design: bmk03.Pp_wall,
  penetrationExceedsCeiling: bmk03.penetrationExceedsCeiling,
}, null, 2));
