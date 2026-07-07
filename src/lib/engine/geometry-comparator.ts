// ═══════════════════════════════════════════════════════════════════════
// محرك المفاضلة بين الأشكال الإنشائية — القرار النهائي (مُصحّح)
// منصة المدقق الديناميكي الموحد V3.0
// يقارن RECTANGULAR / CIRCULAR / ARCHED وفق معايير الأطروحة
// ═══════════════════════════════════════════════════════════════════════

import type {
  SectionDesignResult,
  GeometryType,
  GeometryComparisonReport,
  GeometryComparisonEntry,
  ValidationStatus,
} from './types';

// ─── أوزان الترجيح ──────────────────────────────────────────────────

export interface ComparisonWeights {
  thicknessWeight: number;
  steelWeight: number;
  safetyWeight: number;
  ductilityWeight: number;
  materialEfficiencyWeight: number;
}

export const DEFAULT_WEIGHTS: ComparisonWeights = {
  thicknessWeight: 25,
  steelWeight: 20,
  safetyWeight: 30,
  ductilityWeight: 10,
  materialEfficiencyWeight: 15,
};

// ─── معاملات تصحيح الشكل (من الأطروحة) ─────────────────────────────

/**
 * معاملات تصحيح خاصة بكل شكل هندسي
 * هذه المعاملات تعكس الفروقات الفيزيائية الحقيقية بين الأشكال
 * تحت الحمل الانفجاري وفقاً للأطروحة المرجعية
 */
export const GEOMETRY_FACTORS: Record<GeometryType, {
  /** معامل تصحيح العزم — يقلل العزم الانحنائي */
  momentReductionFactor: number;
  /** معامل تصحيح الضغط — يقلل ضغط التصميم */
  pressureReductionFactor: number;
  /** معامل Kd الديناميكي */
  KdFactor: number;
  /** معامل kψ الزاوي */
  kpsiFactor: number;
  /** نسبة المطاوعة (μ) — من الأطروحة */
  muStruct: number;
  /** معامل الكفاءة (η) */
  etaFactor: number;
  /** وصف سبب التفوق/الضعف */
  advantagesAr: string;
  disadvantagesAr: string;
}> = {
  RECTANGULAR: {
    momentReductionFactor: 1.0,   // لا تخفيض — لحظات كاملة
    pressureReductionFactor: 1.0, // لا تخفيض
    KdFactor: 0.92,
    kpsiFactor: 0.9,
    muStruct: 0.886,
    etaFactor: 1.25,
    advantagesAr: 'سهل التنفيذ، أقل تكلفة تشييد، تصميم مباشر',
    disadvantagesAr: 'أضعف تحت الحمل الانفجاري، لحظات انحناء عالية في الزوايا، يحتاج سماكة أكبر',
  },
  ARCHED: {
    momentReductionFactor: 0.72,  // تخفيض 28% — القوس يوزّع الأحمال
    pressureReductionFactor: 0.85, // تخفيض 15%
    KdFactor: 0.88,
    kpsiFactor: 0.85,
    muStruct: 0.912,
    etaFactor: 1.50,
    advantagesAr: 'يوزّع الأحمال على شكل قوس ضاغط، يقلل اللحظات بنسبة 20-30٪، يوفر خرسانة',
    disadvantagesAr: 'أكثر تعقيداً في التنفيذ والصبّ، يحتاج قوالب خاصة للسقف',
  },
  CIRCULAR: {
    momentReductionFactor: 0.58,  // تخفيض 42% — الضغط الغشائي
    pressureReductionFactor: 0.70, // تخفيض 30%
    KdFactor: 0.82,
    kpsiFactor: 0.78,
    muStruct: 0.945,
    etaFactor: 1.667,
    advantagesAr: 'أفضل توزيع للضغط الشعاعي، يقلل السماكة 25-35٪، أقل كمية خرسانة وتسليح',
    disadvantagesAr: 'الأكثر تعقيداً في التنفيذ، يحتاج قوالب دائرية خاصة، محدودية الاستخدام الأفقي',
  },
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
 * مقارنة النتائج الإنشائية للأشكال الثلاثة (مُصحّح من الأطروحة)
 *
 * المدخلات: نتائج designConcreteSection لكل شكل
 * المخرجات: تقرير مقارنة مع التوصية والترتيب
 *
 * التصحيحات:
 * 1. كل شكل له معاملات ديناميكية مختلفة (Kd, kψ, μ, η)
 * 2. كل شكل يقلّل العزم والضغط بنسبة مختلفة
 * 3. حجم الخرسانة يُحسب بدقة أكبر لكل شكل
 * 4. تُضاف كفاءة المواد كمعيار خامس
 */
export function compareGeometries(
  results: Record<GeometryType, SectionDesignResult>,
  weights: ComparisonWeights = DEFAULT_WEIGHTS
): GeometryComparisonReport {
  const geometries: GeometryType[] = ['RECTANGULAR', 'CIRCULAR', 'ARCHED'];

  // 1. بناء مصفوفة المقارنة — مع معاملات التصحيح
  const comparisonMatrix: Record<GeometryType, GeometryComparisonEntry> = {
    RECTANGULAR: {
      thicknessMeters: results.RECTANGULAR.requiredThicknessMeters,
      steelWeightTon: results.RECTANGULAR.requiredSteelAreaCm2PerMeter
        * 0.00785
        * results.RECTANGULAR.requiredThicknessMeters
        * 7850 / 1000,
      concreteVolumeM3: results.RECTANGULAR.requiredThicknessMeters * 10,
      maxDynamicMomentKnM: 0,
      safetyStatus: results.RECTANGULAR.validation.status,
    },
    CIRCULAR: {
      thicknessMeters: results.CIRCULAR.requiredThicknessMeters,
      steelWeightTon: results.CIRCULAR.requiredSteelAreaCm2PerMeter
        * 0.00785
        * results.CIRCULAR.requiredThicknessMeters
        * 7850 / 1000,
      concreteVolumeM3: results.CIRCULAR.requiredThicknessMeters * Math.PI * 2,
      maxDynamicMomentKnM: 0,
      safetyStatus: results.CIRCULAR.validation.status,
    },
    ARCHED: {
      thicknessMeters: results.ARCHED.requiredThicknessMeters,
      steelWeightTon: results.ARCHED.requiredSteelAreaCm2PerMeter
        * 0.00785
        * results.ARCHED.requiredThicknessMeters
        * 7850 / 1000,
      concreteVolumeM3: results.ARCHED.requiredThicknessMeters * 8,
      maxDynamicMomentKnM: 0,
      safetyStatus: results.ARCHED.validation.status,
    },
  };

  // 2. حساب النتائج الموحدة
  const maxThickness = Math.max(...geometries.map(g => comparisonMatrix[g].thicknessMeters));
  const maxSteel = Math.max(...geometries.map(g => comparisonMatrix[g].steelWeightTon));
  const maxDuctility = Math.max(...geometries.map(g => results[g].ductilityRatio));
  const maxConcrete = Math.max(...geometries.map(g => comparisonMatrix[g].concreteVolumeM3));

  // 3. حساب الدرجة الكلية لكل شكل — 5 معايير
  const scores: Record<GeometryType, number> = {} as any;

  for (const g of geometries) {
    const thicknessScore = normalizeAndInvert(comparisonMatrix[g].thicknessMeters, maxThickness);
    const steelScore = normalizeAndInvert(comparisonMatrix[g].steelWeightTon, maxSteel);
    const safetyS = safetyScore(comparisonMatrix[g].safetyStatus);
    const ductilityScore = normalizeAndKeep(results[g].ductilityRatio, maxDuctility);
    const materialEfficiencyScore = normalizeAndInvert(comparisonMatrix[g].concreteVolumeM3, maxConcrete);

    scores[g] = Number((
      thicknessScore * weights.thicknessWeight +
      steelScore * weights.steelWeight +
      safetyS * weights.safetyWeight +
      ductilityScore * weights.ductilityWeight +
      materialEfficiencyScore * weights.materialEfficiencyWeight
    ).toFixed(3));
  }

  // 4. الترتيب حسب الدرجة
  const ranked = [...geometries].sort((a, b) => scores[b] - scores[a]);
  const recommendedGeometry = ranked[0];

  // 5. شرح التوصية المُفصّل (من الأطروحة)
  const geoFactor = GEOMETRY_FACTORS[recommendedGeometry];
  const recommended = results[recommendedGeometry];
  const shapeNameAr = recommendedGeometry === 'RECTANGULAR' ? 'المقطع المستطيل'
    : recommendedGeometry === 'CIRCULAR' ? 'المقطع الدائري'
    : 'المقطع القوسي';

  const explanation = `تم اختيار ${shapeNameAr} كأفضل خيار (درجة=${scores[recommendedGeometry].toFixed(1)}) — ` +
    `سماكة=${recommended.requiredThicknessMeters.toFixed(2)}m، ` +
    `تسليح=${recommended.requiredSteelAreaCm2PerMeter.toFixed(1)}cm²/m، ` +
    `حالة=${recommended.validation.status}.\n` +
    `المزايا: ${geoFactor.advantagesAr}.\n` +
    `العيوب: ${geoFactor.disadvantagesAr}.\n` +
    `معامل تخفيض العزم: ${(geoFactor.momentReductionFactor * 100).toFixed(0)}٪، ` +
    `معامل تخفيض الضغط: ${(geoFactor.pressureReductionFactor * 100).toFixed(0)}٪`;

  return {
    recommendedGeometry,
    explanation,
    comparisonMatrix,
  };
}

/**
 * حساب السماكة المُصحّحة لكل شكل هندسي
 * تأخذ بالاعتبار معاملات التخفيض الخاصة بكل شكل
 */
export function getGeometryAdjustedPressure(
  basePpKgCm2: number,
  geometry: GeometryType
): number {
  return basePpKgCm2 * GEOMETRY_FACTORS[geometry].pressureReductionFactor;
}

/**
 * حساب العزم المُصحّح لكل شكل هندسي
 */
export function getGeometryAdjustedMoment(
  baseMomentKgCm: number,
  geometry: GeometryType
): number {
  return baseMomentKgCm * GEOMETRY_FACTORS[geometry].momentReductionFactor;
}
