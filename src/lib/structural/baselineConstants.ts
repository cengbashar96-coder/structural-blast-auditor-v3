// ═══════════════════════════════════════════════════════════════════════
// BASELINE CONSTANTS — NON-EDITABLE (0.00% DEVIATION)
// منصة المدقق الديناميكي الموحد V3.0
// المصدر: الأطروحة العلمية + ملفات الإكسيل المرجعية السبع
// ═══════════════════════════════════════════════════════════════════════

// ─── ثوابت الكود العربي السوري 2024 (WSD) ───
export const SYRIAN_CODE_2024 = {
  V_CD_COEFF: 0.25,
  PHI_V: 0.85,
  RHO_MIN: 0.0025,
  RHO_MAX_COEFF: 0.5,
  SAFETY_FACTOR_KN: 1.4,
  COVER_MIN_MM: 50,
} as const;

// ─── ثوابت UFC 3-340-02 ───
export const UFC_340_02 = {
  DIF_CONCRETE_COMPRESSION: 1.25,
  DIF_CONCRETE_TENSION: 1.25,
  DIF_STEEL_TENSION: 1.20,
  DIF_PUNCHING_SHEAR: 1.25,
  CONCRETE_F_C_MIN_PSI: 4000,
} as const;

// ─── دوال الاستيفاء I-1: معاملات اختراق التربة ───
export interface SoilCoefficients {
  name: string;
  nameAr: string;
  Kpr: number;
  Kv: number;
  Kp: number;
  Kot: number | null;
}

export const SOIL_TABLE: SoilCoefficients[] = [
  { name: 'water_saturated_clay', nameAr: 'طين رطب مشبع', Kpr: 1.30e-5, Kv: 0.60, Kp: 0.85, Kot: null },
  { name: 'medium_clay', nameAr: 'طين متوسط', Kpr: 7.00e-6, Kv: 0.50, Kp: 0.60, Kot: null },
  { name: 'clay_with_stones', nameAr: 'طين مع حجارة', Kpr: 6.00e-6, Kv: 0.50, Kp: 0.60, Kot: null },
  { name: 'sand_with_impurities', nameAr: 'رمل مشوب', Kpr: 5.00e-6, Kv: 0.50, Kp: 0.60, Kot: null },
  { name: 'pure_sand_limestone', nameAr: 'رمل نقي/جيري', Kpr: 4.50e-6, Kv: 0.50, Kp: 0.63, Kot: null },
  { name: 'stone_paving', nameAr: 'بلاط حجري', Kpr: 3.00e-6, Kv: 0.25, Kp: 0.58, Kot: 0.88 },
  { name: 'cemented_stone', nameAr: 'بلاط مأسّد', Kpr: 2.50e-6, Kv: 0.25, Kp: 0.61, Kot: 0.81 },
  { name: 'granite_gneiss', nameAr: 'جرانيت/نايس', Kpr: 7.00e-7, Kv: 0.20, Kp: 0.53, Kot: 0.75 },
  { name: 'limestone_rock', nameAr: 'صخر كلسي', Kpr: 1.50e-6, Kv: 0.25, Kp: 0.56, Kot: 0.79 },
  { name: 'plain_concrete_170', nameAr: 'خرسانة عادية 170', Kpr: 1.20e-6, Kv: 0.16, Kp: 0.36, Kot: 0.51 },
  { name: 'plain_concrete_225', nameAr: 'خرسانة عادية 225', Kpr: 1.00e-6, Kv: 0.16, Kp: 0.34, Kot: 0.48 },
  { name: 'rc_concrete_200', nameAr: 'خرسانة مسلحة 200', Kpr: 8.00e-7, Kv: 0.13, Kp: 0.32, Kot: 0.46 },
  { name: 'rc_concrete_250_300', nameAr: 'خرسانة مسلحة 250-300', Kpr: 7.00e-7, Kv: 0.13, Kp: 0.30, Kot: 0.44 },
] as const;

// ─── دوال الاستيفاء I-4: قاعدة بيانات القنابل ───
export interface BombData {
  id: number;
  type: string;
  caliber: number;
  weight_kg: number;
  total_length_m: number;
  body_length_m: number;
  diameter_m: number;
  ld_ratio: number;
  lhd_ratio: number;
  charge_kg: number;
  explosive: string;
}

export const BOMB_DATABASE: BombData[] = [
  { id: 1, type: 'AN-M30A1', caliber: 100, weight_kg: 61, total_length_m: 1.38, body_length_m: 0.76, diameter_m: 0.21, ld_ratio: 3.6, lhd_ratio: 1, charge_kg: 23, explosive: 'Tritonal' },
  { id: 2, type: 'AN-M57A1', caliber: 250, weight_kg: 131, total_length_m: 1.58, body_length_m: 0.95, diameter_m: 0.28, ld_ratio: 3.4, lhd_ratio: 1, charge_kg: 62, explosive: 'Tritonal' },
  { id: 3, type: 'AN-M64A1', caliber: 500, weight_kg: 264, total_length_m: 1.83, body_length_m: 1.21, diameter_m: 0.36, ld_ratio: 3.3, lhd_ratio: 1, charge_kg: 128, explosive: 'Tritonal' },
  { id: 4, type: 'M117-M', caliber: 750, weight_kg: 373, total_length_m: 2.27, body_length_m: 1.42, diameter_m: 0.41, ld_ratio: 3.5, lhd_ratio: 1, charge_kg: 177, explosive: 'Tritonal' },
  { id: 5, type: 'AN-M65A1', caliber: 1000, weight_kg: 547, total_length_m: 2.46, body_length_m: 1.37, diameter_m: 0.48, ld_ratio: 2.8, lhd_ratio: 1, charge_kg: 270, explosive: 'Tritonal' },
  { id: 6, type: 'AN-M66A1', caliber: 2000, weight_kg: 1033, total_length_m: 2.97, body_length_m: 1.82, diameter_m: 0.59, ld_ratio: 3.1, lhd_ratio: 1, charge_kg: 526, explosive: 'Tritonal' },
  { id: 7, type: '3000kg', caliber: 3000, weight_kg: 1383, total_length_m: 4.70, body_length_m: 3.07, diameter_m: 0.61, ld_ratio: 5.0, lhd_ratio: 1, charge_kg: 816, explosive: 'Tritonal' },
  { id: 8, type: 'MK81', caliber: 250, weight_kg: 118, total_length_m: 1.88, body_length_m: 1.18, diameter_m: 0.23, ld_ratio: 5.2, lhd_ratio: 2.5, charge_kg: 45, explosive: 'Tritonal' },
  { id: 9, type: 'MK82', caliber: 500, weight_kg: 241, total_length_m: 2.21, body_length_m: 1.55, diameter_m: 0.27, ld_ratio: 5.7, lhd_ratio: 2.5, charge_kg: 87, explosive: 'Tritonal' },
  { id: 10, type: 'MK83', caliber: 1000, weight_kg: 441, total_length_m: 3.01, body_length_m: 1.92, diameter_m: 0.36, ld_ratio: 5.3, lhd_ratio: 2, charge_kg: 215, explosive: 'Tritonal' },
  { id: 11, type: 'MK84', caliber: 2000, weight_kg: 894, total_length_m: 3.83, body_length_m: 2.41, diameter_m: 0.46, ld_ratio: 5.2, lhd_ratio: 2, charge_kg: 430, explosive: 'Tritonal' },
  { id: 12, type: 'MK81-Snikay', caliber: 250, weight_kg: 134, total_length_m: 1.91, body_length_m: 1.19, diameter_m: 0.23, ld_ratio: 5.2, lhd_ratio: 2.5, charge_kg: 45, explosive: 'Tritonal' },
  { id: 13, type: 'MK82-Snikay', caliber: 500, weight_kg: 260, total_length_m: 2.26, body_length_m: 1.55, diameter_m: 0.27, ld_ratio: 5.7, lhd_ratio: 2.5, charge_kg: 87, explosive: 'Tritonal' },
  { id: 14, type: 'M117R', caliber: 750, weight_kg: 380, total_length_m: 2.21, body_length_m: 1.12, diameter_m: 0.11, ld_ratio: 3.5, lhd_ratio: 1, charge_kg: 177, explosive: 'Tritonal' },
] as const;

// ─── دوال الاستيفاء I-5: معاملات المواد المتفجرة ───
export interface ExplosiveCoefficients {
  name: string;
  nameAr: string;
  K1: number;
}

export const EXPLOSIVE_TABLE: ExplosiveCoefficients[] = [
  { name: 'Tritonal_80_20', nameAr: 'Tritonal 80-20', K1: 1.639 },
  { name: 'Mixture_V', nameAr: 'Mixture V', K1: 1.340 },
  { name: 'Torpex_H6', nameAr: 'Torpex H6', K1: 1.260 },
  { name: 'Tritonal_90_40', nameAr: 'Tritonal 90/40', K1: 1.230 },
  { name: 'Ednaloud', nameAr: 'Ednaloud', K1: 1.050 },
] as const;

// ─── دوال الاستيفاء I-6: مقاومة الضغط للخرسانة ───
export const CONCRETE_RESISTANCE: Record<string, number> = {
  M200: 115, M300: 170, M350: 200, M400: 225,
  M500: 280, M600: 340, M700: 390, M800: 450,
} as const;

// ─── دوال الاستيفاء I-7: خصائص حديد التسليح ───
export interface SteelProperties {
  grade: string;
  tensileStrength: number;
  elasticityModulus: number;
}

export const STEEL_TABLE: SteelProperties[] = [
  { grade: 'A-I', tensileStrength: 2100, elasticityModulus: 2100000 },
  { grade: 'A-II', tensileStrength: 3000, elasticityModulus: 2100000 },
  { grade: 'A-III', tensileStrength: 4000, elasticityModulus: 2100000 },
] as const;

// ─── دوال الاستيفاء I-2: معاملات الموجة في التربة ───
export interface SoilWaveParameters {
  name: string;
  nameAr: string;
  rhoMin: number;
  rhoMax: number;
  a0Min: number;
  a0Max: number;
  a0_a1: number;
  xiMin: number;
  xiMax: number;
}

export const SOIL_WAVE_TABLE: SoilWaveParameters[] = [
  { name: 'loose_sand', nameAr: 'رمل مفكوك', rhoMin: 150, rhoMax: 155, a0Min: 100, a0Max: 150, a0_a1: 2.5, xiMin: 0.4, xiMax: 0.5 },
  { name: 'sandy_limestone', nameAr: 'تربة رملية/جيرية', rhoMin: 160, rhoMax: 165, a0Min: 200, a0Max: 500, a0_a1: 2.5, xiMin: 0.35, xiMax: 0.4 },
  { name: 'clay_stones', nameAr: 'طين مع حجارة', rhoMin: 180, rhoMax: 185, a0Min: 400, a0Max: 600, a0_a1: 2.0, xiMin: 0.5, xiMax: 0.6 },
  { name: 'medium_clay', nameAr: 'طين متوسط', rhoMin: 195, rhoMax: 200, a0Min: 500, a0Max: 800, a0_a1: 1.5, xiMin: 0.5, xiMax: 0.7 },
] as const;

// ─── دوال الاستيفاء I-3: معاملات A و n1 ───
export interface StressCoefficients {
  name: string;
  nameAr: string;
  A: number;
  n1: number;
}

export const STRESS_COEFFICIENT_TABLE: StressCoefficients[] = [
  { name: 'loose_sand', nameAr: 'رمل مفكوك/مشوب', A: 2.5, n1: 3 },
  { name: 'clay_stones', nameAr: 'طين مع حجارة', A: 5, n1: 3 },
  { name: 'medium_clay', nameAr: 'طين متوسط', A: 18, n1: 2.8 },
  { name: 'sandy_limestone', nameAr: 'تربة رملية/جيرية', A: 4, n1: 3 },
] as const;
