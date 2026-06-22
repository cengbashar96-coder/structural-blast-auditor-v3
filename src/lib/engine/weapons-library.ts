// ═══════════════════════════════════════════════════════════════════════
// مكتبة الأسلحة — القنابل الروسية FAB (مكملة لـ BOMB_DATABASE الأمريكية)
// منصة المدقق الديناميكي الموحد V3.0
// المصدر: الأطروحة العلمية + ملفات الإكسيل المرجعية
// ═══════════════════════════════════════════════════════════════════════

import type { WeaponData, ExplosiveType } from './types';

/**
 * مكتبة القنابل الروسية FAB — المستخدمة في Benchmarks
 *
 * هذه البيانات مُكمِلة لـ BOMB_DATABASE في baselineConstants
 * التي تحتوي فقط على القنابل الأمريكية (AN-M, MK series)
 *
 * المرجع: مواصفات القنابل الروسية القياسية + ملفات الإكسيل
 *
 * ⚠️ هذه القيم تحتاج تحققاً نهائياً من Excel المرجعي
 *    يُرجى ملء/تصحيح أي قيمة بعد المقارنة مع المصدر
 */
export const FAB_WEAPONS_LIBRARY: readonly WeaponData[] = [
  {
    id: 'FAB-250',
    name: 'FAB-250',
    nameAr: 'فاب-250',
    weightKg: 250,
    diameterMeters: 0.30,
    ldRatio: 4.5,
    lhdRatio: 2.0,
    chargeKg: 100,
    explosive: 'TNT' as ExplosiveType,
    lengthMeters: 1.50,
    bodyLengthMeters: 0.95,
    noseRatio: 2.0,
    fillerRatio: 0.40,
    origin: 'RU',
  },
  {
    id: 'FAB-500',
    name: 'FAB-500',
    nameAr: 'فاب-500',
    weightKg: 500,
    diameterMeters: 0.40,
    ldRatio: 4.0,
    lhdRatio: 2.0,
    chargeKg: 200,
    explosive: 'TNT' as ExplosiveType,
    lengthMeters: 2.00,
    bodyLengthMeters: 1.30,
    noseRatio: 2.0,
    fillerRatio: 0.40,
    origin: 'RU',
  },
  {
    id: 'FAB-1500',
    name: 'FAB-1500',
    nameAr: 'فاب-1500',
    weightKg: 1500,
    diameterMeters: 0.62,
    ldRatio: 4.2,
    lhdRatio: 2.0,
    chargeKg: 680,
    explosive: 'TNT' as ExplosiveType,
    lengthMeters: 2.90,
    bodyLengthMeters: 1.85,
    noseRatio: 2.0,
    fillerRatio: 0.45,
    origin: 'RU',
  },
] as const;

/**
 * بنك الأسلحة الموحّد — يجمع الأمريكية والروسية
 *
 * يُستخدم من قبل penetration-core و blast-pressure-core
 * للوصول: getWeaponById('FAB-250') أو getWeaponById('MK82')
 */
import { BOMB_DATABASE } from '../structural/baselineConstants';
import type { BombData } from '../structural/baselineConstants';

/** تحويل BombData الأمريكية إلى WeaponData الموحدة */
function bombDataToWeaponData(bomb: BombData): WeaponData {
  return {
    id: `US-${bomb.id}`,
    name: bomb.type,
    nameAr: bomb.type,  // الأسماء الأمريكية تُترك كما هي
    weightKg: bomb.weight_kg,
    diameterMeters: bomb.diameter_m,
    ldRatio: bomb.ld_ratio,
    lhdRatio: bomb.lhd_ratio,
    chargeKg: bomb.charge_kg,
    explosive: 'Tritonal_80_20' as ExplosiveType,
    lengthMeters: bomb.total_length_m,
    bodyLengthMeters: bomb.body_length_m,
    origin: 'US',
  };
}

/** بنك الأسلحة الموحّد الكامل */
export const UNIFIED_WEAPONS_LIBRARY: readonly WeaponData[] = [
  ...BOMB_DATABASE.map(bombDataToWeaponData),
  ...FAB_WEAPONS_LIBRARY,
] as const;

/**
 * البحث عن سلاح بالمعرف
 *
 * @param id - معرف السلاح (مثل 'FAB-250' أو 'US-9' لـ MK82)
 * @returns WeaponData أو undefined
 */
export function getWeaponById(id: string): WeaponData | undefined {
  return UNIFIED_WEAPONS_LIBRARY.find((w) => w.id === id);
}

/**
 * البحث عن سلاح بالاسم
 *
 * @param name - اسم السلاح (مثل 'FAB-500' أو 'MK82')
 * @returns WeaponData أو undefined
 */
export function getWeaponByName(name: string): WeaponData | undefined {
  return UNIFIED_WEAPONS_LIBRARY.find((w) => w.name === name);
}

/**
 * إحصائيات بنك الأسلحة
 */
export function getWeaponsLibraryStats() {
  return {
    total: UNIFIED_WEAPONS_LIBRARY.length,
    usWeapons: BOMB_DATABASE.length,
    ruWeapons: FAB_WEAPONS_LIBRARY.length,
    maxWeightKg: Math.max(...UNIFIED_WEAPONS_LIBRARY.map((w) => w.weightKg)),
    maxChargeKg: Math.max(...UNIFIED_WEAPONS_LIBRARY.map((w) => w.chargeKg)),
  };
}
