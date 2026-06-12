// ═══════════════════════════════════════════════════════════════════════
// المحرك الموحد — التصدير الرئيسي
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

// ─── الأنواع الموحدة (Single Source of Truth) ───
export * from './types';

// ─── مكتبة الأسلحة الموحدة ───
export {
  FAB_WEAPONS_LIBRARY,
  UNIFIED_WEAPONS_LIBRARY,
  getWeaponById,
  getWeaponByName,
  getWeaponsLibraryStats,
} from './weapons-library';

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
