// ═══════════════════════════════════════════════════════════════════════
// محمّل الثوابت — الطبقة الوحيدة التي تقرأ JSON وتُحوّلها لأنواع المحرك
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import type { WeaponData, SoilCoefficients, SoilTypeCode, ExplosiveType } from '../types';
import weaponsRaw from './weapons-library.json';
import soilRaw from './soil-coefficients.json';
import {
  EXPLOSIVE_COEFFICIENTS,
  STRESS_COEFFICIENTS,
  SOIL_WAVE_PARAMETERS,
  CONCRETE_RESISTANCE_TABLE,
  STEEL_TABLE,
  UFC_340_02,
  SYRIAN_CODE_2024,
  SOIL_TO_STRESS_MAP,
  SOIL_TO_WAVE_MAP,
} from './blast-coefficients';

// ─── أنواع JSON الخام ───

interface WeaponJsonEntry {
  id: string;
  nameAr: string;
  nameEn: string;
  caliberLbs: number;
  weightKg: number;
  lengthMeters: number;
  bodyLengthMeters: number;
  diameterMeters: number;
  ldRatio: number;
  lhdRatio: number;
  chargeKg: number;
  explosiveType: string;
}

interface SoilJsonEntry {
  code: string;
  nameAr: string;
  referenceName: string;
  kp: number;
  kv: number;
  densityKgM3: number;
  destroyCoeff: number;
  crackCoeff: number;
  oppositeCrackCoeff: number | null;
}

// ─── تحويل JSON → أنواع المحرك ───

function weaponJsonToWeaponData(w: WeaponJsonEntry): WeaponData {
  return {
    id: w.id,
    name: w.nameEn,
    nameAr: w.nameAr,
    weightKg: w.weightKg,
    diameterMeters: w.diameterMeters,
    ldRatio: w.ldRatio,
    lhdRatio: w.lhdRatio,
    chargeKg: w.chargeKg,
    explosive: w.explosiveType as ExplosiveType,
    lengthMeters: w.lengthMeters,
    bodyLengthMeters: w.bodyLengthMeters,
    noseRatio: w.lhdRatio,
    fillerRatio: w.chargeKg / w.weightKg,
    origin: w.id.startsWith('W_FAB') ? 'RU' : 'US',
  };
}

function soilJsonToSoilCoefficients(s: SoilJsonEntry): SoilCoefficients {
  return {
    code: s.code as SoilTypeCode,
    referenceName: s.referenceName,
    nameAr: s.nameAr,
    kp: s.kp,
    kv: s.kv,
    densityKgM3: s.densityKgM3,
    destructionCoeff: s.destroyCoeff,
    crackingCoeff: s.crackCoeff,
    oppositeCrackCoeff: s.oppositeCrackCoeff,
  };
}

// ─── البنوك المُحوَّلة ───

export const WEAPONS: readonly WeaponData[] = (weaponsRaw as WeaponJsonEntry[]).map(weaponJsonToWeaponData);
export const SOILS: readonly SoilCoefficients[] = (soilRaw as SoilJsonEntry[]).map(soilJsonToSoilCoefficients);

// ─── دوال البحث ───

export function getWeaponById(id: string): WeaponData {
  const weapon = WEAPONS.find((w) => w.id === id);
  if (!weapon) throw new Error(`[ENGINE-ERR] Unknown weaponId: "${id}". Available: ${WEAPONS.map(w => w.id).join(', ')}`);
  return weapon;
}

export function getSoilByCode(code: SoilTypeCode): SoilCoefficients {
  const soil = SOILS.find((s) => s.code === code);
  if (!soil) throw new Error(`[ENGINE-ERR] Unknown soilTypeCode: "${code}". Available: ${SOILS.map(s => s.code).join(', ')}`);
  return soil;
}

export function getExplosiveK1(name: string): number {
  // محاولة المطابقة المباشرة أولاً
  let entry = EXPLOSIVE_COEFFICIENTS.find((e) => e.name === name);
  // إذا لم تُنجح، محاولة مطابقة مرنة (مثل "Tritonal" → "Tritonal_80_20")
  if (!entry) {
    entry = EXPLOSIVE_COEFFICIENTS.find((e) =>
      e.name.startsWith(name.split('_')[0]) || name.startsWith(e.name.split('_')[0])
    );
  }
  if (!entry) {
    console.warn(`[ENGINE-WARN] Unknown explosive: "${name}", falling back to TNT (K1=1.0)`);
    return 1.0;
  }
  return entry.K1;
}

export function getStressCoeff(referenceName: string): { A: number; n1: number } {
  const entry = STRESS_COEFFICIENTS.find((s) => s.referenceName === referenceName);
  if (!entry) throw new Error(`[ENGINE-ERR] No stress coefficients for: "${referenceName}"`);
  return { A: entry.A, n1: entry.n1 };
}

export function getSoilWaveParams(referenceName: string) {
  const entry = SOIL_WAVE_PARAMETERS.find((s) => s.referenceName === referenceName);
  if (!entry) throw new Error(`[ENGINE-ERR] No soil wave parameters for: "${referenceName}"`);
  return entry;
}

/** تعيين SoilTypeCode → معاملات الإجهاد */
export function getStressCoeffForSoil(code: SoilTypeCode): { A: number; n1: number } {
  const refName = SOIL_TO_STRESS_MAP[code];
  if (!refName) throw new Error(`[ENGINE-ERR] No stress mapping for soil: "${code}"`);
  return getStressCoeff(refName);
}

/** تعيين SoilTypeCode → معاملات الموجة */
export function getSoilWaveForSoil(code: SoilTypeCode) {
  const refName = SOIL_TO_WAVE_MAP[code];
  if (!refName) throw new Error(`[ENGINE-ERR] No wave mapping for soil: "${code}"`);
  return getSoilWaveParams(refName);
}

// إعادة تصدير الثوابت
export {
  EXPLOSIVE_COEFFICIENTS,
  STRESS_COEFFICIENTS,
  SOIL_WAVE_PARAMETERS,
  CONCRETE_RESISTANCE_TABLE,
  STEEL_TABLE,
  UFC_340_02,
  SYRIAN_CODE_2024,
};
