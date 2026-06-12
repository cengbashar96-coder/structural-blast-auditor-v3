// ═══════════════════════════════════════════════════════════════════════
// المنسّق العام — Orchestrator
// منصة المدقق الديناميكي الموحد V3.0
// يربط المحركات الأربعة بتسلسل صحيح بدون منطق حسابي داخلي
// ═══════════════════════════════════════════════════════════════════════

import type {
  PenetrationInput,
  PenetrationOutput,
  BlastInput,
  BlastOutput,
  DesignInput,
  SectionDesignResult,
  GeometryComparisonReport,
  SoilTypeCode,
  GeometryType,
} from './types';
import type { ValidationResult } from './validators';

import { calculatePenetration } from './penetration-core';
import { calculateBlastPressure } from './blast-pressure-core';
import { designConcreteSection } from './structural-concrete-core';
import { compareGeometries } from './geometry-comparator';
import { validateInput, PenetrationInputSchema, BlastInputSchema, DesignInputSchema } from './validators';
import { getWeaponById, getSoilByCode, getExplosiveK1 } from './constants';

// ─── المدخلات الموحدة ───

export interface EngineInput {
  penetration: PenetrationInput;
  blast: {
    radialDistance: number;
    ceilingDepth?: number;
  };
  design: {
    tunnelSpanShort: number;
    tunnelSpanLong: number;
    fcMpa: number;
    fyMpa: number;
    slabThicknessHintMm?: number;
    reinforcementRatio?: number;
  };
}

// ─── المخرجات الموحدة ───

export interface EngineOutput {
  /** المدخلات كما استُلمت */
  inputs: EngineInput;

  /** القيم الوسيطة — من كل محرك */
  intermediates: {
    penetration: PenetrationOutput;
    blast: BlastOutput;
  };

  /** النتائج النهائية — لكل شكل هندسي */
  structural: Record<GeometryType, SectionDesignResult>;

  /** قرار المقارنة */
  comparison: GeometryComparisonReport;

  /** التحذيرات المتراكمة من كل المراحل */
  warnings: string[];

  /** حالة التنفيذ الإجمالية */
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';

  /** أخطاء التحقق (إن وُجدت) */
  validationErrors: ValidationResult[];
}

// ─── المنسّق الرئيسي ────────────────────────────────────────────────

/**
 * تشغيل خط الحساب الكامل:
 *
 *   المدخلات → تحقق → اختراق → ضغط → تصميم → مقارنة → قرار
 *
 * لا يحتوي على أي منطق حسابي — فقط ينسق بين المحركات
 */
export function runEngine(input: EngineInput): EngineOutput {
  const warnings: string[] = [];
  const validationErrors: ValidationResult[] = [];
  let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';

  // ─── 1. التحقق من المدخلات ───
  const penValidation = validateInput(PenetrationInputSchema, input.penetration, 'penetration');
  if (!penValidation.valid) {
    validationErrors.push(penValidation);
    status = 'FAILED';
  }
  warnings.push(...penValidation.warnings);

  // ─── 2. محرك الاختراق ───
  let penetration: PenetrationOutput;
  try {
    penetration = calculatePenetration(input.penetration);
    if (penetration.warningMessages) {
      warnings.push(...penetration.warningMessages);
    }
  } catch (err) {
    status = 'FAILED';
    penetration = {
      penetrationDepth: 0,
      craterDepth: 0,
      requiredSpallingThickness: 0,
      lambda1: 0,
      lambda2: 0,
      nExp: 0,
      cEffective: 0,
      tsu: 0,
      hBarZ: 0,
      explanation: `فشل محرك الاختراق: ${err instanceof Error ? err.message : String(err)}`,
      warningMessages: ['ENGINE-FAIL: محرك الاختراق فشل'],
    };
  }

  // ─── 3. محرك الضغط العصفي ───
  const weapon = getWeaponById(input.penetration.weaponId);
  const K1 = getExplosiveK1(weapon.explosive);
  const C_effective = 0.95 * K1 * weapon.chargeKg;

  let blast: BlastOutput;
  try {
    blast = calculateBlastPressure({
      equivalentTNTWeight: C_effective,
      radialDistance: input.blast.radialDistance,
      soilTypeCode: input.penetration.soilTypeCode,
      ceilingDepth: input.blast.ceilingDepth,
    });
  } catch (err) {
    status = status === 'FAILED' ? 'FAILED' : 'PARTIAL';
    blast = {
      scaledDistanceZ: 0,
      pSideOnMpa: 0,
      pReflectedMpa: 0,
      durationMs: 0,
      pDesignMpa: 0,
      pDesignKPa: 0,
      sigmaMaxMpa: 0,
      tauPlus: 0,
      tauEffective: 0,
      rCritical: 0,
      dynamicConditionMet: false,
      coreConditionMet: false,
    };
    warnings.push(`ENGINE-FAIL: محرك الضغط فشل: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ─── 4. محرك التصميم الإنشائي — لكل شكل ───
  const geometries: GeometryType[] = ['RECTANGULAR', 'CIRCULAR', 'ARCHED'];
  const structural: Record<GeometryType, SectionDesignResult> = {} as any;

  for (const geo of geometries) {
    const designInput: DesignInput = {
      pDesignMpa: blast.pDesignMpa,
      geometryType: geo,
      tunnelSpanShort: input.design.tunnelSpanShort,
      tunnelSpanLong: input.design.tunnelSpanLong,
      fcMpa: input.design.fcMpa,
      fyMpa: input.design.fyMpa,
      slabThicknessHintMm: input.design.slabThicknessHintMm,
      reinforcementRatio: input.design.reinforcementRatio,
    };

    const designValidation = validateInput(DesignInputSchema, designInput, `design.${geo}`);
    if (!designValidation.valid) {
      validationErrors.push(designValidation);
      if (status === 'SUCCESS') status = 'PARTIAL';
    }

    try {
      structural[geo] = designConcreteSection(designInput);
    } catch (err) {
      status = status === 'FAILED' ? 'FAILED' : 'PARTIAL';
      structural[geo] = {
        requiredThicknessMeters: 0,
        requiredSteelAreaCm2PerMeter: 0,
        ductilityRatio: 0,
        validation: {
          status: 'FAILURE',
          eccentricityRatio: 0,
          punchingShearRatio: 0,
          reinforcementRatio: 0,
          failures: [`فشل محرك التصميم: ${err instanceof Error ? err.message : String(err)}`],
          explanation: 'فشل حسابي',
        },
      };
    }
  }

  // ─── 5. مقارنة الأشكال ───
  let comparison: GeometryComparisonReport;
  try {
    comparison = compareGeometries(structural);
  } catch (err) {
    comparison = {
      recommendedGeometry: 'RECTANGULAR',
      explanation: `فشلت المقارنة: ${err instanceof Error ? err.message : String(err)}`,
      comparisonMatrix: {
        RECTANGULAR: { thicknessMeters: 0, steelWeightTon: 0, concreteVolumeM3: 0, maxDynamicMomentKnM: 0, safetyStatus: 'FAILURE' },
        CIRCULAR: { thicknessMeters: 0, steelWeightTon: 0, concreteVolumeM3: 0, maxDynamicMomentKnM: 0, safetyStatus: 'FAILURE' },
        ARCHED: { thicknessMeters: 0, steelWeightTon: 0, concreteVolumeM3: 0, maxDynamicMomentKnM: 0, safetyStatus: 'FAILURE' },
      },
    };
    if (status === 'SUCCESS') status = 'PARTIAL';
  }

  return {
    inputs: input,
    intermediates: { penetration, blast },
    structural,
    comparison,
    warnings,
    status,
    validationErrors,
  };
}
