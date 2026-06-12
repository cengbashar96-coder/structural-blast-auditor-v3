// ═══════════════════════════════════════════════════════════════════════
// المحرك الموحد — التصدير الرئيسي
// منصة المدقق الديناميكي الموحد V3.0
// نقطة الدخول الوحيدة لكل الحسابات
// ═══════════════════════════════════════════════════════════════════════

// ─── الأنواع الموحدة (Single Source of Truth) ───
export * from './types';

// ─── الثوابت والمحمّلات ───
export {
  WEAPONS,
  SOILS,
  getWeaponById,
  getSoilByCode,
  getExplosiveK1,
  getStressCoeff,
  getSoilWaveParams,
  getStressCoeffForSoil,
  getSoilWaveForSoil,
  EXPLOSIVE_COEFFICIENTS,
  STRESS_COEFFICIENTS,
  SOIL_WAVE_PARAMETERS,
  CONCRETE_RESISTANCE_TABLE,
  STEEL_TABLE,
  UFC_340_02,
  SYRIAN_CODE_2024,
} from './constants';

// ─── محرك الاختراق (Eq. 13-19) ───
export {
  calculatePenetration,
  calcLambda1,
  calcLambda2,
  calcN,
  calcCEffective,
  calcTsuPenetrating,
  calcTsuExplosive,
  calcPenetrationDepth,
} from './penetration-core';

// ─── محرك الضغط العصفي (Eq. 1-12) ───
export {
  calculateBlastPressure,
  calcSadovskyOverpressure,
  calcPositivePhaseTime,
  calcImpulse,
  calcEffectiveTime,
} from './blast-pressure-core';

// ─── محرك التصميم الإنشائي (الكود السوري + UFC) ───
export {
  designConcreteSection,
  calcEffectiveDepth,
  calcCriticalPerimeter,
  calcCoreLimit,
  calcVcdSyrian,
  calcVcdUSD,
  applyDIF,
  calcRequiredThickness,
  calcRequiredSteel,
  calcDuctilityRatio,
} from './structural-concrete-core';

// ─── محرك حساب الحمل الانفجاري — الخطوة 5 (سقف + جدار) ───
export {
  calculateBlastLoad,
  calculateBlastLoadBothPaths,
  calcHBar,
  calcRekv,
  calcRStar,
  calcTauSadovsky,
  calcEffectiveTimeFactor,
  calcTauEf,
  calcTauN,
  calcOmega,
  calcCdyn,
  calcPmaxSadovsky,
  calcPmaxFromStress,
  calcKpsi,
  calcPekv,
  calcPct,
  calcPp,
  calcMuStruct,
  calcRsd,
  calcRbd,
  calcEta,
  calcLambda as calcBlastLambda,
} from './blast-loads';
export type { BlastLoadInput, BlastLoadOutput } from './blast-loads';

// ─── محرك التصميم الإنشائي — الخطوتان 7 و 8 ───
export {
  calculateCeilingDesign,
  calculateWallDesign,
  calculateFullStructuralDesign,
  calcPlasticMoment,
  calcEffectiveDepth as calcStructuralEffectiveDepth,
  calcAlphaM as calcStructuralAlphaM,
  calcXiFromAlphaM,
  calcFinalThickness,
  calcFloorThickness,
  calcInnerWallThickness,
} from './structural';
export type {
  CeilingDesignInput,
  CeilingDesignOutput,
  WallDesignInput,
  WallDesignOutput,
} from './structural';

// ─── محرك تصميم التسليح (الكود السوري 2024 + UFC 3-340-02) ───
export {
  calculateRebarDesign,
  calculateRebarBothPaths,
  calcRequiredSteelArea,
  calcRelativeCompressionDepth,
  calcAlphaM as calcRebarAlphaM,
  calcReinforcementRatio,
  calcMinReinforcementRatio,
  calcMaxReinforcementRatio,
  calcMaxRelativeDepth,
  selectOptimalBars,
} from './rebar';
export type { RebarDesignInput, RebarDesignOutput } from './rebar';

// ─── محرك المفاضلة بين الأشكال ───
export {
  compareGeometries,
  DEFAULT_WEIGHTS,
} from './geometry-comparator';
export type { ComparisonWeights } from './geometry-comparator';

// ─── المُحققات ───
export {
  validateInput,
  sanitizeNumber,
  PenetrationInputSchema,
  BlastInputSchema,
  DesignInputSchema,
} from './validators';
export type { ValidationError, ValidationResult } from './validators';

// ─── المنسّق العام ───
export { runEngine } from './orchestrator';
export type { EngineInput, EngineOutput } from './orchestrator';

// ─── Benchmark Suite ───
export {
  BENCHMARK_SUITE,
  getBenchmarkById,
  getBenchmarksBySoilType,
  getBenchmarksByPriority,
  BMK_01,
  BMK_02,
  BMK_03,
} from './benchmarks';
