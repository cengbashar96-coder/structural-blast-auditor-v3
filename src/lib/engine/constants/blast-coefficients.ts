// ═══════════════════════════════════════════════════════════════════════
// معاملات الانفجار والمواد — طبقة المرجعية الثابتة
// منصة المدقق الديناميكي الموحد V3.0
// المصدر: الأطروحة العلمية + ملفات الإكسيل (I-1 إلى I-9)
// ═══════════════════════════════════════════════════════════════════════

// ─── دوال الاستيفاء I-5: معاملات المواد المتفجرة ───
export const EXPLOSIVE_COEFFICIENTS = [
  { name: 'Tritonal_80_20', nameAr: 'Tritonal 80-20', K1: 1.639 },
  { name: 'Mixture_V', nameAr: 'Mixture V', K1: 1.340 },
  { name: 'Torpex_H6', nameAr: 'Torpex H6', K1: 1.260 },
  { name: 'Tritonal_90_40', nameAr: 'Tritonal 90/40', K1: 1.230 },
  { name: 'Ednaloud', nameAr: 'Ednaloud', K1: 1.050 },
  { name: 'TNT', nameAr: 'TNT', K1: 1.000 },
] as const;

// ─── دوال الاستيفاء I-3: معاملات الإجهاد A و n1 ───
export const STRESS_COEFFICIENTS = [
  { referenceName: 'loose_sand', nameAr: 'رمل مفكوك/مشوب', A: 2.5, n1: 3 },
  { referenceName: 'clay_with_stones', nameAr: 'طين مع حجارة', A: 5, n1: 3 },
  { referenceName: 'medium_clay', nameAr: 'طين متوسط', A: 18, n1: 2.8 },
  { referenceName: 'sandy_limestone', nameAr: 'تربة رملية/جيرية', A: 4, n1: 3 },
] as const;

// ─── دوال الاستيفاء I-2: معاملات الموجة في التربة ───
export const SOIL_WAVE_PARAMETERS = [
  { referenceName: 'loose_sand', nameAr: 'رمل مفكوك', rhoMin: 150, rhoMax: 155, a0Min: 100, a0Max: 150, a0_a1: 2.5, xiMin: 0.4, xiMax: 0.5 },
  { referenceName: 'sandy_limestone', nameAr: 'تربة رملية/جيرية', rhoMin: 160, rhoMax: 165, a0Min: 200, a0Max: 500, a0_a1: 2.5, xiMin: 0.35, xiMax: 0.4 },
  { referenceName: 'clay_with_stones', nameAr: 'طين مع حجارة', rhoMin: 180, rhoMax: 185, a0Min: 400, a0Max: 600, a0_a1: 2.0, xiMin: 0.5, xiMax: 0.6 },
  { referenceName: 'medium_clay', nameAr: 'طين متوسط', rhoMin: 195, rhoMax: 200, a0Min: 500, a0Max: 800, a0_a1: 1.5, xiMin: 0.5, xiMax: 0.7 },
] as const;

// ─── دوال الاستيفاء I-6: مقاومة الضغط للخرسانة ───
export const CONCRETE_RESISTANCE_TABLE: Record<string, number> = {
  M200: 115, M300: 170, M350: 200, M400: 225,
  M500: 280, M600: 340, M700: 390, M800: 450,
} as const;

// ─── دوال الاستيفاء I-7: خصائص حديد التسليح ───
export const STEEL_TABLE = [
  { grade: 'A-I', tensileStrength: 2100, elasticityModulus: 2100000 },
  { grade: 'A-II', tensileStrength: 3000, elasticityModulus: 2100000 },
  { grade: 'A-III', tensileStrength: 4000, elasticityModulus: 2100000 },
] as const;

// ─── ثوابت UFC 3-340-02 ───
export const UFC_340_02 = {
  DIF_CONCRETE_COMPRESSION: 1.25,
  DIF_CONCRETE_TENSION: 1.25,
  DIF_STEEL_TENSION: 1.20,
  DIF_PUNCHING_SHEAR: 1.25,
  CONCRETE_F_C_MIN_PSI: 4000,
} as const;

// ─── ثوابت الكود العربي السوري 2024 (WSD) ───
export const SYRIAN_CODE_2024 = {
  V_CD_COEFF: 0.25,
  PHI_V: 0.85,
  RHO_MIN: 0.0025,
  RHO_MAX_COEFF: 0.5,
  SAFETY_FACTOR_KN: 1.4,
  COVER_MIN_MM: 50,
} as const;

// ─── تعيين SoilTypeCode → referenceName لجداول الاستيفاء ───
export const SOIL_TO_STRESS_MAP: Record<string, string> = {
  SOFT_SOIL: 'medium_clay',
  MEDIUM_SOIL: 'clay_with_stones',
  HARD_ROCK: 'sandy_limestone',
  REINFORCED_SAND: 'loose_sand',
  CONCRETE: 'sandy_limestone',
  REINFORCED_CONCRETE: 'clay_with_stones',
} as const;

export const SOIL_TO_WAVE_MAP: Record<string, string> = {
  SOFT_SOIL: 'medium_clay',
  MEDIUM_SOIL: 'clay_with_stones',
  HARD_ROCK: 'sandy_limestone',
  REINFORCED_SAND: 'loose_sand',
  CONCRETE: 'sandy_limestone',
  REINFORCED_CONCRETE: 'clay_with_stones',
} as const;
