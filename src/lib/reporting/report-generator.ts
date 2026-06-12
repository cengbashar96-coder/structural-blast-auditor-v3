// ═══════════════════════════════════════════════════════════════════════
// محرك توليد التقارير — التصدير والطباعة
// منصة المدقق الديناميكي الموحد V3.0
// يدعم: JSON, CSV, Markdown, PDF (عبر المتصفح), RTM Matrix
// ═══════════════════════════════════════════════════════════════════════

import type { RtmRecord } from '@/lib/storage/storageSchemas';
import type { LockedValueSnapshot } from '@/lib/domain/locked-values';
import { FINAL_LOCKED_RESULTS, LOCKED_REGISTRY, UNIFIED_VARIABLE_TABLE } from '@/lib/constants/reference-data';
import { lockedValuesManager } from '@/lib/domain/locked-values';
import type { EngineStep, BlastLoadPath } from '@/types/engine';

// ─── أنواع التصدير ─────────────────────────────────────────────────

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'pdf-print' | 'rtm-matrix';

export interface ReportExportOptions {
  format: ExportFormat;
  includeDeviation: boolean;
  includeTraceability: boolean;
  includeLockedValues: boolean;
  locale: 'ar' | 'en';
  caseName?: string;
}

export interface ReportSectionData {
  step: EngineStep;
  stepNameAr: string;
  stepNameEn: string;
  path: BlastLoadPath | 'shared';
  values: Record<string, number>;
  units: Record<string, string>;
  deviations: LockedValueSnapshot[];
  lockedKeys: string[];
}

export interface ReportData {
  meta: {
    title: string;
    caseName: string;
    timestamp: string;
    designCodes: string[];
    platformVersion: string;
  };
  sections: ReportSectionData[];
  lockedValues: LockedValueSnapshot[];
  rtmRecords: RtmRecord[];
  overallStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  warnings: string[];
}

// ─── محرك توليد التقارير ────────────────────────────────────────────

export class ReportGenerator {
  /**
   * بناء بيانات التقرير من نتائج أنبوب المعالجة
   */
  static buildReportData(
    rtmRecords: RtmRecord[],
    pipelineValues?: Record<string, number>,
    caseName: string = 'BMK-02 (MK83 + MEDIUM_SOIL)',
  ): ReportData {
    const sections: ReportSectionData[] = [];
    const stepNames: Record<number, { ar: string; en: string }> = {
      2: { ar: 'المدخلات والاستيفاءات', en: 'Inputs & Lookups' },
      3: { ar: 'الاختراق', en: 'Penetration' },
      4: { ar: 'القفل الأولي', en: 'Initial Locking' },
      5: { ar: 'حمل الانفجار', en: 'Blast Load' },
      6: { ar: 'معاملات الجدول ب', en: 'B-Table Coefficients' },
      7: { ar: 'تصميم سماكة السقف', en: 'Ceiling Thickness Design' },
      8: { ar: 'تصميم الجدار النهائي', en: 'Final Wall Design' },
    };

    const stepPathMap: Record<number, BlastLoadPath | 'shared'> = {
      2: 'shared',
      3: 'shared',
      4: 'shared',
      5: 'roof',
      6: 'roof',
      7: 'roof',
      8: 'wall',
    };

    for (const [stepStr, names] of Object.entries(stepNames)) {
      const step = Number(stepStr) as EngineStep;
      const path = stepPathMap[step] || 'shared';
      const stepVars = UNIFIED_VARIABLE_TABLE.filter(v => v.step === step);
      const values: Record<string, number> = {};
      const units: Record<string, string> = {};

      for (const v of stepVars) {
        const val = pipelineValues?.[v.name] ?? (FINAL_LOCKED_RESULTS as Record<string, number>)[v.name];
        if (val !== undefined) {
          values[v.name] = val;
          units[v.name] = v.unit;
        }
      }

      if (Object.keys(values).length === 0) continue;

      const deviations = pipelineValues
        ? lockedValuesManager.checkAllDeviations(values).filter(d => d.status !== 'OK')
        : [];

      const lockedKeys = Object.keys(values).filter(k =>
        LOCKED_REGISTRY.some(e => e.key === k)
      );

      sections.push({
        step,
        stepNameAr: names.ar,
        stepNameEn: names.en,
        path,
        values,
        units,
        deviations,
        lockedKeys,
      });
    }

    const lockedValues = lockedValuesManager.checkAllDeviations(
      FINAL_LOCKED_RESULTS as Record<string, number>
    );

    const failedRtm = rtmRecords.filter(r => r.status === 'FAILED');
    const overallStatus: ReportData['overallStatus'] =
      failedRtm.length > 0 ? 'FAILED'
        : lockedValues.some(v => v.status === 'DEVIATED') ? 'PARTIAL'
        : 'SUCCESS';

    return {
      meta: {
        title: 'منصة المدقق الديناميكي الموحد V3.0 — تقرير التدقيق الهندسي',
        caseName,
        timestamp: new Date().toISOString(),
        designCodes: ['Syrian Code 2024', 'UFC 3-340-02'],
        platformVersion: 'V3.0',
      },
      sections,
      lockedValues,
      rtmRecords,
      overallStatus,
      warnings: lockedValues
        .filter(v => v.status === 'DEVIATED')
        .map(v => `انحراف في ${v.key}: ${v.deviationPct?.toFixed(2)}% عن القيمة المقفلة`),
    };
  }

  /**
   * تصدير التقرير بصيغة JSON
   */
  static exportJSON(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * تصدير التقرير بصيغة CSV
   */
  static exportCSV(data: ReportData): string {
    const rows: string[] = [];
    rows.push('الخطوة,المسار,المتغير,القيمة,الوحدة,مقفل,انحراف%');

    for (const section of data.sections) {
      for (const [key, value] of Object.entries(section.values)) {
        const isLocked = section.lockedKeys.includes(key) ? 'نعم' : 'لا';
        const deviation = section.deviations.find(d => d.key === key);
        const devPct = deviation ? deviation.deviationPct?.toFixed(2) ?? '0' : '0';
        rows.push(
          `${section.stepNameAr},${section.path},${key},${value},${section.units[key] || ''},${isLocked},${devPct}`
        );
      }
    }

    return rows.join('\n');
  }

  /**
   * تصدير التقرير بصيغة Markdown
   */
  static exportMarkdown(data: ReportData): string {
    const lines: string[] = [];

    lines.push(`# ${data.meta.title}`);
    lines.push(``);
    lines.push(`- **حالة التصميم**: ${data.meta.caseName}`);
    lines.push(`- **التاريخ**: ${new Date(data.meta.timestamp).toLocaleString('ar-SY')}`);
    lines.push(`- **أكواد التصميم**: ${data.meta.designCodes.join(', ')}`);
    lines.push(`- **الحالة العامة**: ${data.overallStatus}`);
    lines.push(``);

    if (data.warnings.length > 0) {
      lines.push(`## تحذيرات`);
      for (const w of data.warnings) {
        lines.push(`- ⚠️ ${w}`);
      }
      lines.push(``);
    }

    for (const section of data.sections) {
      const pathLabel = section.path === 'roof' ? 'سقف' : section.path === 'wall' ? 'جدار' : 'مشترك';
      lines.push(`## الخطوة ${section.step}: ${section.stepNameAr} (${pathLabel})`);
      lines.push(``);
      lines.push(`| المتغير | القيمة | الوحدة | مقفل | انحراف |`);
      lines.push(`|---------|--------|--------|-------|--------|`);

      for (const [key, value] of Object.entries(section.values)) {
        const isLocked = section.lockedKeys.includes(key) ? '🔒' : '';
        const deviation = section.deviations.find(d => d.key === key);
        const devStr = deviation ? `${deviation.deviationPct?.toFixed(2)}%` : '—';
        lines.push(`| ${key} | ${value} | ${section.units[key] || ''} | ${isLocked} | ${devStr} |`);
      }
      lines.push(``);
    }

    // مصفوفة القيم المقفلة
    lines.push(`## القيم المقفلة`);
    lines.push(``);
    lines.push(`| المتغير | القيمة المرجعية | القيمة المحسوبة | الانحراف | الحالة |`);
    lines.push(`|---------|----------------|----------------|----------|--------|`);
    for (const lv of data.lockedValues) {
      lines.push(`| ${lv.key} | ${lv.value} | ${lv.currentComputed ?? '—'} | ${lv.deviationPct?.toFixed(2) ?? '—'}% | ${lv.status} |`);
    }
    lines.push(``);

    // سجلات RTM
    if (data.rtmRecords.length > 0) {
      lines.push(`## مصفوفة تتبع المتطلبات (RTM)`);
      lines.push(``);
      lines.push(`| المتطلب | حالة الاختبار | السيناريو | الحالة |`);
      lines.push(`|---------|---------------|-----------|--------|`);
      for (const r of data.rtmRecords) {
        lines.push(`| ${r.associatedRequirement} | ${r.testCaseId} | ${r.scenarioId.slice(0, 8)}... | ${r.status} |`);
      }
    }

    return lines.join('\n');
  }

  /**
   * تصدير مصفوفة RTM بصيغة CSV
   */
  static exportRTMMatrix(records: RtmRecord[]): string {
    const rows: string[] = [];
    rows.push('المتطلب,حالة الاختبار,معرف السيناريو,الحالة,سجل العيب,التوقيت');

    for (const r of records) {
      rows.push(
        `${r.associatedRequirement},${r.testCaseId},${r.scenarioId},${r.status},${r.defectLog || ''},${new Date(r.timestamp).toLocaleString('ar-SY')}`
      );
    }

    return rows.join('\n');
  }

  /**
   * تنزيل ملف من المتصفح
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * تصدير التقرير بالصيغة المطلوبة
   */
  static export(data: ReportData, options: ReportExportOptions): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    switch (options.format) {
      case 'json': {
        const content = this.exportJSON(data);
        this.downloadFile(content, `audit-report-${timestamp}.json`, 'application/json');
        break;
      }
      case 'csv': {
        const content = this.exportCSV(data);
        this.downloadFile(content, `audit-report-${timestamp}.csv`, 'text/csv');
        break;
      }
      case 'markdown': {
        const content = this.exportMarkdown(data);
        this.downloadFile(content, `audit-report-${timestamp}.md`, 'text/markdown');
        break;
      }
      case 'pdf-print': {
        if (typeof window !== 'undefined') {
          window.print();
        }
        break;
      }
      case 'rtm-matrix': {
        const content = this.exportRTMMatrix(data.rtmRecords);
        this.downloadFile(content, `rtm-matrix-${timestamp}.csv`, 'text/csv');
        break;
      }
    }
  }
}
