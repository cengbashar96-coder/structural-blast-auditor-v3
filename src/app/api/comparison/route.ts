// ═══════════════════════════════════════════════════════════════════════
// API Route: تقرير المفاضلة الهندسية
// منصة المدقق الديناميكي الموحد V3.0
// المرجع الذهبي: BMK-02 (MK83 + MEDIUM_SOIL)
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { designConcreteSection } from '@/lib/engine/structural-concrete-core';
import { compareGeometries, DEFAULT_WEIGHTS } from '@/lib/engine/geometry-comparator';
import type { GeometryType, GeometryComparisonReport, SectionDesignResult } from '@/lib/engine/types';

/** أوزان الترجيح المستخدمة */
export interface ComparisonWeightsDTO {
  thicknessWeight: number;
  steelWeight: number;
  safetyWeight: number;
  ductilityWeight: number;
}

/** استجابة API المفاضلة */
export interface ComparisonResponse {
  comparison: GeometryComparisonReport;
  structural: Record<GeometryType, SectionDesignResult>;
  weights: ComparisonWeightsDTO;
  designInputs: {
    pDesignMpa: number;
    tunnelSpanShort: number;
    tunnelSpanLong: number;
    fcMpa: number;
    fyMpa: number;
  };
}

export async function GET() {
  try {
    // ─── مدخلات BMK-02 المرجعية ───
    const pDesignMpa = 4.9211162574 / 10; // Pp_roof بالميكاباسكال
    const tunnelSpanShort = 4; // ap
    const tunnelSpanLong = 5; // bp
    const fcMpa = 25; // f_c
    const fyMpa = 300; // f_y

    const geometries: GeometryType[] = ['RECTANGULAR', 'CIRCULAR', 'ARCHED'];
    const structural: Record<GeometryType, SectionDesignResult> = {} as any;

    for (const geo of geometries) {
      structural[geo] = designConcreteSection({
        pDesignMpa,
        geometryType: geo,
        tunnelSpanShort,
        tunnelSpanLong,
        fcMpa,
        fyMpa,
      });
    }

    const comparison = compareGeometries(structural, DEFAULT_WEIGHTS);

    const response: ComparisonResponse = {
      comparison,
      structural,
      weights: {
        thicknessWeight: DEFAULT_WEIGHTS.thicknessWeight,
        steelWeight: DEFAULT_WEIGHTS.steelWeight,
        safetyWeight: DEFAULT_WEIGHTS.safetyWeight,
        ductilityWeight: DEFAULT_WEIGHTS.ductilityWeight,
      },
      designInputs: {
        pDesignMpa,
        tunnelSpanShort,
        tunnelSpanLong,
        fcMpa,
        fyMpa,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[COMPARISON API ERROR]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'خطأ داخلي في محرك المقارنة' },
      { status: 500 }
    );
  }
}
