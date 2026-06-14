// ═══════════════════════════════════════════════════════════════════════
// نموذج التقرير — بناء تقرير هندسي من نتائج أنبوب المعالجة
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import type { EngineStep, BlastLoadPath, FinalLockedResults, ValueDeviation } from '@/types/engine';
import { FINAL_LOCKED_RESULTS } from '@/lib/constants/reference-data';
import { lockedValuesManager } from './locked-values';
import { traceabilityService } from './traceability';

export interface ReportSection {
  title: string;
  titleAr: string;
  step: EngineStep;
  path: BlastLoadPath | 'shared';
  values: Record<string, number>;
  units: Record<string, string>;
  deviations: ValueDeviation[];
  lockedKeys: string[];
  traceEntries: Array<{ variable: string; source: string; step: number }>;
}

export interface EngineeringReport {
  meta: {
    title: string;
    caseName: string;
    timestamp: string;
    designCodes: string[];
  };
  sections: ReportSection[];
  finalResults: FinalLockedResults;
  overallStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  warnings: string[];
}

export class ReportModelBuilder {
  private sections: ReportSection[] = [];
  private warnings: string[] = [];

  addStepSection(
    step: EngineStep,
    titleAr: string,
    titleEn: string,
    path: BlastLoadPath | 'shared',
    values: Record<string, number>,
    units: Record<string, string>,
    referenceValues: Record<string, number> | null,
  ): this {
    const deviations = referenceValues
      ? lockedValuesManager.checkAllDeviations(values).filter(d => d.status !== 'OK')
      : [];

    const lockedKeys = Object.keys(values).filter(k => lockedValuesManager.checkDeviation(k, values[k]).status !== 'MISSING');

    const traceEntries = Object.keys(values).map(v => {
      const trace = traceabilityService.traceToInputs(v);
      return {
        variable: v,
        source: trace.chain.length > 0 ? trace.chain[0].source : v,
        step: step,
      };
    });

    this.sections.push({
      title: titleEn,
      titleAr,
      step,
      path,
      values,
      units,
      deviations,
      lockedKeys,
      traceEntries,
    });

    return this;
  }

  build(): EngineeringReport {
    const failedDeviations = this.sections.flatMap(s => s.deviations.filter(d => d.status === 'FAIL'));
    const hasFailures = failedDeviations.length > 0;

    return {
      meta: {
        title: 'Unified Dynamic Auditor Platform V3.0 — Engineering Report',
        caseName: 'BMK-02 (MK83 + MEDIUM_SOIL)',
        timestamp: new Date().toISOString(),
        designCodes: ['Syrian Code 2024', 'UFC 3-340-02'],
      },
      sections: this.sections,
      finalResults: FINAL_LOCKED_RESULTS,
      overallStatus: hasFailures ? 'FAILED' : this.warnings.length > 0 ? 'PARTIAL' : 'SUCCESS',
      warnings: this.warnings,
    };
  }
}
