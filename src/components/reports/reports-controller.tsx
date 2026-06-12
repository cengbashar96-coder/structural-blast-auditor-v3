// ═══════════════════════════════════════════════════════════════════════
// وحدة التحكم بالتقارير — جزيرة العميل الحاكمة
// منصة المدقق الديناميكي الموحد V3.0
// يقرأ البيانات من IndexedDB ويبني التقارير ويدير التصدير
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/storage/db';
import { rtmRepository } from '@/lib/storage/repositories/RtmRepository';
import { ReportGenerator, type ReportData, type ExportFormat, type ReportExportOptions } from '@/lib/reporting/report-generator';
import type { RtmRecord } from '@/lib/storage/storageSchemas';
import type { LockedValueSnapshot } from '@/lib/domain/locked-values';
import { lockedValuesManager } from '@/lib/domain/locked-values';
import { FINAL_LOCKED_RESULTS, LOCKED_REGISTRY } from '@/lib/constants/reference-data';

export function ReportsController() {
  const [rtmRecords, setRtmRecords] = useState<RtmRecord[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [lockedDeviations, setLockedDeviations] = useState<LockedValueSnapshot[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'locked' | 'rtm' | 'export'>('overview');

  // جلب البيانات من IndexedDB
  const loadData = useCallback(async () => {
    try {
      const records = await db.rtmRecords.toArray();
      setRtmRecords(records);

      // فحص الانحرافات عن القيم المقفلة
      const deviations = lockedValuesManager.checkAllDeviations(
        FINAL_LOCKED_RESULTS as Record<string, number>
      );
      setLockedDeviations(deviations);
    } catch (err) {
      console.error('[REPORTS] Failed to load data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // بناء التقرير
  const handleGenerateReport = useCallback(() => {
    setIsGenerating(true);
    try {
      const data = ReportGenerator.buildReportData(rtmRecords);
      setReportData(data);
      setLastGenerated(new Date().toLocaleString('ar-SY'));
    } catch (err) {
      console.error('[REPORTS] Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [rtmRecords]);

  // تصدير التقرير
  const handleExport = useCallback(() => {
    if (!reportData) return;

    const options: ReportExportOptions = {
      format: selectedFormat,
      includeDeviation: true,
      includeTraceability: true,
      includeLockedValues: true,
      locale: 'ar',
    };

    ReportGenerator.export(reportData, options);
  }, [reportData, selectedFormat]);

  // حساب الإحصائيات
  const stats = {
    totalRecords: rtmRecords.length,
    passed: rtmRecords.filter(r => r.status === 'PASSED').length,
    failed: rtmRecords.filter(r => r.status === 'FAILED').length,
    lockedOk: lockedDeviations.filter(d => d.status === 'OK').length,
    lockedDeviated: lockedDeviations.filter(d => d.status === 'DEVIATED').length,
    lockedMissing: lockedDeviations.filter(d => d.status === 'MISSING').length,
    passRate: rtmRecords.length > 0
      ? ((rtmRecords.filter(r => r.status === 'PASSED').length / rtmRecords.length) * 100).toFixed(1)
      : '0',
  };

  return (
    <div className="space-y-6">
      {/* ═══ شريط الأدوات العلوي ═══ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📋 مركز التقارير وإدارة المستندات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إنشاء وتصدير تقارير التدقيق الهندسي ومصفوفات المطابقة وفق الكود السوري 2024 و UFC 3-340-02
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastGenerated && (
            <span className="text-[10px] font-mono text-slate-500">
              آخر توليد: {lastGenerated}
            </span>
          )}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded transition-colors"
          >
            {isGenerating ? '⏳ جاري البناء...' : '🔄 بناء التقرير'}
          </button>
        </div>
      </div>

      {/* ═══ بطاقات الإحصائيات ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="إجمالي سجلات RTM" value={stats.totalRecords} color="slate" />
        <StatCard label="ناجح" value={stats.passed} color="emerald" />
        <StatCard label="فاشل" value={stats.failed} color={stats.failed > 0 ? 'red' : 'slate'} />
        <StatCard label="معدل النجاح" value={`${stats.passRate}%`} color="emerald" />
        <StatCard label="قيم مقفلة سليمة" value={stats.lockedOk} color="emerald" />
        <StatCard label="قيم منحرفة" value={stats.lockedDeviated} color={stats.lockedDeviated > 0 ? 'amber' : 'slate'} />
      </div>

      {/* ═══ تبويبات المحتوى ═══ */}
      <div className="flex gap-1 border-b border-slate-800">
        {([
          { key: 'overview', label: 'نظرة عامة' },
          { key: 'locked', label: 'القيم المقفلة' },
          { key: 'rtm', label: 'مصفوفة RTM' },
          { key: 'export', label: 'تصدير' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'text-emerald-400 border-emerald-500 bg-slate-900/40'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ محتوى التبويبات ═══ */}
      {activeTab === 'overview' && (
        <OverviewTab reportData={reportData} stats={stats} />
      )}

      {activeTab === 'locked' && (
        <LockedValuesTab deviations={lockedDeviations} />
      )}

      {activeTab === 'rtm' && (
        <RTMMatrixTab records={rtmRecords} />
      )}

      {activeTab === 'export' && (
        <ExportTab
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          onExport={handleExport}
          reportData={reportData}
        />
      )}
    </div>
  );
}

// ─── مكونات فرعية ──────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    red: 'text-red-400 animate-pulse',
    amber: 'text-amber-400',
    slate: 'text-slate-300',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
      <div className={`text-xl font-bold font-mono ${colorMap[color] || colorMap.slate}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function OverviewTab({ reportData, stats }: { reportData: ReportData | null; stats: { totalRecords: number; passRate: string; lockedOk: number; lockedDeviated: number } }) {
  if (!reportData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-500 text-sm">
          اضغط &quot;بناء التقرير&quot; لإنشاء تقرير التدقيق الهندسي الشامل
        </div>
        <div className="text-slate-600 text-xs mt-2">
          سيتم تجميع بيانات سجلات RTM والقيم المقفلة والانحرافات في تقرير واحد
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* الحالة العامة */}
      <div className={`p-4 rounded-lg border ${
        reportData.overallStatus === 'SUCCESS'
          ? 'bg-emerald-950/20 border-emerald-900/40'
          : reportData.overallStatus === 'PARTIAL'
            ? 'bg-amber-950/20 border-amber-900/40'
            : 'bg-red-950/20 border-red-900/40'
      }`}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-200">الحالة العامة للتقرير</span>
          <span className={`px-3 py-1 rounded text-xs font-bold font-mono ${
            reportData.overallStatus === 'SUCCESS'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
              : reportData.overallStatus === 'PARTIAL'
                ? 'bg-amber-950/60 text-amber-400 border border-amber-900/40'
                : 'bg-red-950/60 text-red-400 border border-red-900/40 animate-pulse'
          }`}>
            {reportData.overallStatus === 'SUCCESS' ? '✔ نجاح' : reportData.overallStatus === 'PARTIAL' ? '⚠ جزئي' : '✗ فشل'}
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          حالة التصميم: <strong className="text-slate-200">{reportData.meta.caseName}</strong> — الأكواد: {reportData.meta.designCodes.join(' + ')}
        </div>
      </div>

      {/* ملخص الأقسام */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">ملخص خطوات أنبوب المعالجة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {reportData.sections.map((section) => {
            const valueCount = Object.keys(section.values).length;
            const deviationCount = section.deviations.length;
            const lockedCount = section.lockedKeys.length;
            const pathLabel = section.path === 'roof' ? 'سقف' : section.path === 'wall' ? 'جدار' : 'مشترك';

            return (
              <div key={section.step} className="bg-slate-950 rounded p-3 border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-400 font-bold text-xs">الخطوة {section.step}</span>
                  <span className="text-[10px] font-mono text-slate-500">{pathLabel}</span>
                </div>
                <div className="text-xs text-slate-300 font-semibold">{section.stepNameAr}</div>
                <div className="flex gap-3 mt-2 text-[10px]">
                  <span className="text-slate-400">{valueCount} متغير</span>
                  <span className="text-amber-400">{lockedCount} مقفل</span>
                  {deviationCount > 0 && (
                    <span className="text-red-400">{deviationCount} انحراف</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* التحذيرات */}
      {reportData.warnings.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4">
          <h3 className="text-sm font-bold text-amber-400 mb-2">تحذيرات</h3>
          <ul className="space-y-1">
            {reportData.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-300">⚠️ {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LockedValuesTab({ deviations }: { deviations: LockedValueSnapshot[] }) {
  const [filter, setFilter] = useState<'all' | 'OK' | 'DEVIATED' | 'MISSING'>('all');

  const filtered = filter === 'all'
    ? deviations
    : deviations.filter(d => d.status === filter);

  const statusLabel: Record<string, string> = {
    OK: '✔ سليم',
    DEVIATED: '⚠ منحرف',
    MISSING: '✗ مفقود',
  };

  const statusColor: Record<string, string> = {
    OK: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40',
    DEVIATED: 'bg-amber-950/50 text-amber-400 border-amber-900/40',
    MISSING: 'bg-red-950/50 text-red-400 border-red-900/40',
  };

  return (
    <div className="space-y-4">
      {/* فلاتر */}
      <div className="flex gap-2">
        {(['all', 'OK', 'DEVIATED', 'MISSING'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              filter === f
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40 font-bold'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            {f === 'all' ? 'الكل' : statusLabel[f]} ({f === 'all' ? deviations.length : deviations.filter(d => d.status === f).length})
          </button>
        ))}
      </div>

      {/* جدول القيم المقفلة */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                <th className="p-3">المتغير</th>
                <th className="p-3">القيمة المرجعية</th>
                <th className="p-3">القيمة المحسوبة</th>
                <th className="p-3">الانحراف</th>
                <th className="p-3">الخطوة المنتجة</th>
                <th className="p-3">الخطوات المستهلكة</th>
                <th className="p-3">المسار</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لا توجد قيم مقفلة مطابقة للفلتر المحدد
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.key} className={`hover:bg-slate-950/20 transition-colors ${d.status === 'DEVIATED' ? 'bg-amber-950/10' : ''}`}>
                    <td className="p-3 font-mono font-bold text-emerald-400">{d.key}</td>
                    <td className="p-3 font-mono text-slate-300">{d.value}</td>
                    <td className="p-3 font-mono text-slate-300">{d.currentComputed ?? '—'}</td>
                    <td className="p-3 font-mono text-slate-300">{d.deviationPct?.toFixed(4) ?? '—'}%</td>
                    <td className="p-3 font-mono text-slate-500">الخطوة {d.producedByStep}</td>
                    <td className="p-3 font-mono text-slate-500">{d.consumedBySteps.join(', ') || '—'}</td>
                    <td className="p-3 font-mono text-slate-500">{d.path === 'roof' ? 'سقف' : d.path === 'wall' ? 'جدار' : 'مشترك'}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor[d.status]}`}>
                        {statusLabel[d.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RTMMatrixTab({ records }: { records: RtmRecord[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');

  const filtered = records.filter(r => {
    const matchesSearch = r.associatedRequirement.toLowerCase().includes(search.toLowerCase()) ||
      r.testCaseId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // تجميع حسب المتطلب
  const byRequirement = records.reduce<Record<string, { passed: number; failed: number }>>((acc, r) => {
    if (!acc[r.associatedRequirement]) acc[r.associatedRequirement] = { passed: 0, failed: 0 };
    if (r.status === 'PASSED') acc[r.associatedRequirement].passed++;
    else acc[r.associatedRequirement].failed++;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* أدوات البحث والفلترة */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="بحث بالمتطلب أو حالة الاختبار..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PASSED' | 'FAILED')}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="PASSED">ناجح</option>
          <option value="FAILED">فاشل</option>
        </select>
      </div>

      {/* مصفوفة التغطية حسب المتطلب */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-slate-200 mb-3">مصفوفة التغطية حسب المتطلب الهندسي</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(byRequirement).map(([req, counts]) => (
            <div
              key={req}
              className={`p-2 rounded border text-[11px] ${
                counts.failed > 0
                  ? 'bg-red-950/20 border-red-900/40'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="font-mono font-bold text-emerald-400">{req}</div>
              <div className="flex gap-2 mt-1 font-mono text-[10px]">
                <span className="text-emerald-400">✔{counts.passed}</span>
                {counts.failed > 0 && <span className="text-red-400">✗{counts.failed}</span>}
              </div>
            </div>
          ))}
          {Object.keys(byRequirement).length === 0 && (
            <div className="col-span-full text-center text-slate-500 text-xs py-4">
              لا توجد سجلات RTM. قم بتشغيل المحرك وحفظ النتائج أولاً.
            </div>
          )}
        </div>
      </div>

      {/* جدول RTM التفصيلي */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                <th className="p-3">المتطلب (FR)</th>
                <th className="p-3">حالة الاختبار (TC)</th>
                <th className="p-3">السيناريو</th>
                <th className="p-3">التوقيت</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3">سجل العيب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {records.length === 0
                      ? 'لا توجد سجلات RTM في قاعدة البيانات المحلية.'
                      : 'لا توجد سجلات مطابقة للبحث.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className={`hover:bg-slate-950/20 ${r.status === 'FAILED' ? 'bg-red-950/10' : ''}`}>
                    <td className="p-3 font-mono font-bold text-emerald-400">{r.associatedRequirement}</td>
                    <td className="p-3 font-mono text-slate-300">{r.testCaseId}</td>
                    <td className="p-3 font-mono text-slate-500 text-[10px]">{r.scenarioId.slice(0, 8)}...</td>
                    <td className="p-3 font-mono text-slate-500">{new Date(r.timestamp).toLocaleString('ar-SY')}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.status === 'PASSED'
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40'
                          : 'bg-red-950/50 text-red-400 border-red-900/40 animate-pulse'
                      }`}>
                        {r.status === 'PASSED' ? '✔ PASSED' : '✗ FAILED'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[10px] max-w-[200px] truncate">{r.defectLog || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExportTab({
  selectedFormat,
  onFormatChange,
  onExport,
  reportData,
}: {
  selectedFormat: ExportFormat;
  onFormatChange: (f: ExportFormat) => void;
  onExport: () => void;
  reportData: ReportData | null;
}) {
  const formats: Array<{ key: ExportFormat; label: string; description: string; icon: string }> = [
    { key: 'json', label: 'JSON', description: 'تصدير البيانات المهيكلة الكاملة بصيغة JSON', icon: '{}' },
    { key: 'csv', label: 'CSV', description: 'جدول بيانات قابل للفتح في Excel', icon: '📊' },
    { key: 'markdown', label: 'Markdown', description: 'تقرير نصي منسق بصيغة Markdown', icon: '📝' },
    { key: 'pdf-print', label: 'طباعة PDF', description: 'طباعة التقرير الحالي كملف PDF عبر المتصفح', icon: '🖨️' },
    { key: 'rtm-matrix', label: 'مصفوفة RTM', description: 'تصدير مصفوفة تتبع المتطلبات بصيغة CSV', icon: '🛡️' },
  ];

  return (
    <div className="space-y-4">
      {/* اختيار الصيغة */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-4">اختر صيغة التصدير</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {formats.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => onFormatChange(fmt.key)}
              className={`p-4 rounded-lg border text-right transition-all ${
                selectedFormat === fmt.key
                  ? 'bg-emerald-950/20 border-emerald-700/50 ring-1 ring-emerald-500/30'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{fmt.icon}</span>
                <span className={`font-bold text-sm ${selectedFormat === fmt.key ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {fmt.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{fmt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* معاينة سريعة */}
      {reportData && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3">معاينة التقرير</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 rounded p-3">
              <div className="text-slate-500">الأقسام</div>
              <div className="text-slate-200 font-mono font-bold">{reportData.sections.length}</div>
            </div>
            <div className="bg-slate-950 rounded p-3">
              <div className="text-slate-500">القيم المقفلة</div>
              <div className="text-slate-200 font-mono font-bold">{reportData.lockedValues.length}</div>
            </div>
            <div className="bg-slate-950 rounded p-3">
              <div className="text-slate-500">سجلات RTM</div>
              <div className="text-slate-200 font-mono font-bold">{reportData.rtmRecords.length}</div>
            </div>
            <div className="bg-slate-950 rounded p-3">
              <div className="text-slate-500">الحالة</div>
              <div className={`font-mono font-bold ${
                reportData.overallStatus === 'SUCCESS' ? 'text-emerald-400'
                  : reportData.overallStatus === 'PARTIAL' ? 'text-amber-400'
                  : 'text-red-400'
              }`}>{reportData.overallStatus}</div>
            </div>
          </div>
        </div>
      )}

      {/* زر التصدير */}
      <div className="flex justify-end">
        <button
          onClick={onExport}
          disabled={!reportData}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📥</span>
          <span>تصدير التقرير بصيغة {formats.find(f => f.key === selectedFormat)?.label}</span>
        </button>
      </div>

      {!reportData && (
        <div className="text-center text-xs text-slate-500 py-4">
          يرجى بناء التقرير أولاً قبل التصدير
        </div>
      )}
    </div>
  );
}
