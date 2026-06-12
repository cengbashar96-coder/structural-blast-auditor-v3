// ═══════════════════════════════════════════════════════════════════════
// Benchmark Suite — التصدير الموحد لحالات الاختبار المرجعية
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

export { BMK_01 } from './bmk-01';
export { BMK_02 } from './bmk-02';
export { BMK_03 } from './bmk-03';

import { BMK_01 } from './bmk-01';
import { BMK_02 } from './bmk-02';
import { BMK_03 } from './bmk-03';
import type { BenchmarkCase } from '../types';

/**
 * المجموعة الكاملة لحالات الاختبار المرجعية
 *
 * الترتيب:
 *   BMK-01: اختراق منخفض (سلسلة البداية)
 *   BMK-02: حالة تصميمية رئيسية (الجسر بين الانفجار والتصميم)
 *   BMK-03: حالة حرجة (الفشل الهش و spalling)
 *
 * لا تُعدَّل هذه القائمة بدون موافقة — هي المرجع الحاكم للـ CI/CD
 */
export const BENCHMARK_SUITE: readonly BenchmarkCase[] = [
  BMK_01,
  BMK_02,
  BMK_03,
] as const;

/**
 * الوصول لحالة Benchmark بالمعرف
 */
export function getBenchmarkById(id: string): BenchmarkCase | undefined {
  return BENCHMARK_SUITE.find((b) => b.id === id);
}

/**
 * الوصول لحالات Benchmark حسب نوع التربة
 */
export function getBenchmarksBySoilType(
  soilTypeCode: string
): readonly BenchmarkCase[] {
  return BENCHMARK_SUITE.filter((b) => b.inputSpec.soilTypeCode === soilTypeCode);
}

/**
 * الوصول لحالات Benchmark حسب الأولوية
 */
export function getBenchmarksByPriority(
  priority: 1 | 2 | 3
): readonly BenchmarkCase[] {
  return BENCHMARK_SUITE.filter((b) => b.priority === priority);
}
