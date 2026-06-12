// ═══════════════════════════════════════════════════════════════════════
// محرك المفاضلة بين الأشكال الإنشائية — القرار النهائي
// منصة المدقق الديناميكي الموحد V3.0
// يقارن RECTANGULAR / CIRCULAR / ARCHED وفق السماكة والتسليح والأمان
// ═══════════════════════════════════════════════════════════════════════

import type {
  SectionDesignResult,
  GeometryType,
  GeometryComparisonReport,
  GeometryComparisonEntry,
  ValidationStatus,
} from './types';

// ─── أوزان الترجيح ──────────────────────────────────────────────────

/**
 * أوزان الترجيح — قابلة للتعديل حسب أولويات التصميم
 *
 * thicknessWeight: وزن السماكة (أخف = أفضل)
 * steelWeight: وزن التسليح (أقل = أفضل)
 * safetyWeight: وزن الأمان (SUCCESS = أعلى)
 * ductilityWeight: وزن المطاوعة (أعلى = أفضل)
 */
export interface ComparisonWeights {
  thicknessWeight: number;
  steelWeight: number;
  safetyWeight: number;
  ductilityWeight: number;
}

export const DEFAULT_WEIGHTS: ComparisonWeights = {
  thicknessWeight: 35,
  steelWeight: 20,
  safetyWeight: 35,
  ductilityWeight: 10,
};

// ─── دوال مساعدة ─────────────────────────────────────────────────────

function safetyScore(status: ValidationStatus): number {
  switch (status) {
    case 'SUCCESS': return 100;
    case 'WARNING': return 40;
    case 'FAILURE': return -50;
    default: return 0;
  }
}

function normalizeAndInvert(value: number, max: number): number {
  if (max <= 0) return 50;
  return Math.max(0, 100 * (1 - value / max));
}

function normalizeAndKeep(value: number, max: number): number {
  if (max <= 0) return 50;
  return Math.max(0, 100 * (value / max));
}

// ─── المحرك الرئيسي ─────────────────────────────────────────────────

/**
 * مقارنة النتائج الإنشائية للأشكال الثلاثة
 *
 * المدخلات: نتائج designConcreteSection لكل شكل
 * المخرجات: تقرير مقارنة مع التوصية والترتيب
 */
export function compareGeometries(
  results: Record<GeometryType, SectionDesignResult>,
  weights: ComparisonWeights = DEFAULT_WEIGHTS
): GeometryComparisonReport {
  const geometries: GeometryType[] = ['RECTANGULAR', 'CIRCULAR', 'ARCHED'];

  // 1. بناء مصفوفة المقارنة
  const comparisonMatrix: Record<GeometryType, GeometryComparisonEntry> = {
    RECTANGULAR: {
      thicknessMeters: results.RECTANGULAR.requiredThicknessMeters,
      steelWeightTon: results.RECTANGULAR.requiredSteelAreaCm2PerMeter * 0.00785 * results.RECTANGULAR.requiredThicknessMeters * 7850 / 1000,
      concreteVolumeM3: results.RECTANGULAR.requiredThicknessMeters * 10, // تقريبي لكل m طول
      maxDynamicMomentKnM: 0, // يُحسب لاحقاً
      safetyStatus: results.RECTANGULAR.validation.status,
    },
    CIRCULAR: {
      thicknessMeters: results.CIRCULAR.requiredThicknessMeters,
      steelWeightTon: results.CIRCULAR.requiredSteelAreaCm2PerMeter * 0.00785 * results.CIRCULAR.requiredThicknessMeters * 7850 / 1000,
      concreteVolumeM3: results.CIRCULAR.requiredThicknessMeters * 8,
      maxDynamicMomentKnM: 0,
      safetyStatus: results.CIRCULAR.validation.status,
    },
    ARCHED: {
      thicknessMeters: results.ARCHED.requiredThicknessMeters,
      steelWeightTon: results.ARCHED.requiredSteelAreaCm2PerMeter * 0.00785 * results.ARCHED.requiredThicknessMeters * 7850 / 1000,
      concreteVolumeM3: results.ARCHED.requiredThicknessMeters * 6,
      maxDynamicMomentKnM: 0,
      safetyStatus: results.ARCHED.validation.status,
    },
  };

  // 2. حساب النتائج الموحدة
  const maxThickness = Math.max(...geometries.map(g => comparisonMatrix[g].thicknessMeters));
  const maxSteel = Math.max(...geometries.map(g => comparisonMatrix[g].steelWeightTon));
  const maxDuctility = Math.max(...geometries.map(g => results[g].ductilityRatio));

  // 3. حساب الدرجة الكلية لكل شكل
  const scores: Record<GeometryType, number> = {} as any;

  for (const g of geometries) {
    const thicknessScore = normalizeAndInvert(comparisonMatrix[g].thicknessMeters, maxThickness);
    const steelScore = normalizeAndInvert(comparisonMatrix[g].steelWeightTon, maxSteel);
    const safetyS = safetyScore(comparisonMatrix[g].safetyStatus);
    const ductilityScore = normalizeAndKeep(results[g].ductilityRatio, maxDuctility);

    scores[g] = Number((
      thicknessScore * weights.thicknessWeight +
      steelScore * weights.steelWeight +
      safetyS * weights.safetyWeight +
      ductilityScore * weights.ductilityWeight
    ).toFixed(3));
  }

  // 4. الترتيب حسب الدرجة
  const ranked = geometries.sort((a, b) => scores[b] - scores[a]);
  const recommendedGeometry = ranked[0];

  // 5. شرح التوصية
  const recommended = results[recommendedGeometry];
  const explanation = `تم اختيار ${recommendedGeometry === 'RECTANGULAR' ? 'المقطع المستطيل' : recommendedGeometry === 'CIRCULAR' ? 'المقطع الدائري' : 'المقطع المقوّس'} كأفضل خيار (درجة=${scores[recommendedGeometry]}) — ` +
    `سماكة=${recommended.requiredThicknessMeters.toFixed(2)}m، تسليح=${recommended.requiredSteelAreaCm2PerMeter.toFixed(1)}cm²/m، ` +
    `حالة=${recommended.validation.status}`;

  return {
    recommendedGeometry,
    explanation,
    comparisonMatrix,
  };
}
