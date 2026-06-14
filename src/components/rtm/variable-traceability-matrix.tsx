// ═══════════════════════════════════════════════════════════════════════
// مصفوفة تتبع المتغيرات الحية — Variable Traceability Matrix
// منصة المدقق الديناميكي الموحد V3.0
// تتبع كل متغير من المدخلات إلى المخرجات والعكس
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useMemo } from 'react';
import { traceabilityService } from '@/lib/domain/traceability';
import { dependencyGraph } from '@/lib/domain/dependency-graph';
import { UNIFIED_VARIABLE_TABLE, LOCKED_REGISTRY } from '@/lib/constants/reference-data';
import type { VariableDefinition, EngineStep, BlastLoadPath } from '@/types/engine';
import type { TraceEntry, TraceChain } from '@/lib/domain/traceability';

interface VariableTraceabilityMatrixProps {
  /** القيم المحسوبة الحالية (اختياري — يعرض القيم المرجعية إذا لم تتوفر) */
  computedValues?: Record<string, number>;
}

export function VariableTraceabilityMatrix({ computedValues }: VariableTraceabilityMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<VariableDefinition['category'] | 'all'>('all');
  const [stepFilter, setStepFilter] = useState<EngineStep | 'all'>('all');
  const [pathFilter, setPathFilter] = useState<BlastLoadPath | 'shared' | 'all'>('all');
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [traceDirection, setTraceDirection] = useState<'toInputs' | 'fromInput'>('toInputs');

  // تصفية المتغيرات
  const filteredVariables = useMemo(() => {
    return UNIFIED_VARIABLE_TABLE.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.descriptionAr.includes(searchQuery);
      const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
      const matchesStep = stepFilter === 'all' || v.step === stepFilter;
      const matchesPath = pathFilter === 'all' || v.path === pathFilter;
      return matchesSearch && matchesCategory && matchesStep && matchesPath;
    });
  }, [searchQuery, categoryFilter, stepFilter, pathFilter]);

  // تتبع المتغير المحدد
  const traceResult = useMemo((): TraceChain | null => {
    if (!selectedVariable) return null;
    return traceabilityService.traceToInputs(selectedVariable);
  }, [selectedVariable]);

  // تتبع عكسي من مدخل
  const reverseTrace = useMemo((): TraceEntry[] => {
    if (!selectedVariable || traceDirection !== 'fromInput') return [];
    return traceabilityService.traceFromInput(selectedVariable);
  }, [selectedVariable, traceDirection]);

  // إحصائيات التغطية حسب الخطوة
  const stepCoverage = useMemo(() => {
    const steps: EngineStep[] = [2, 3, 4, 5, 6, 7, 8];
    return steps.map(step => {
      const vars = UNIFIED_VARIABLE_TABLE.filter(v => v.step === step);
      const locked = vars.filter(v => v.locked);
      return {
        step,
        total: vars.length,
        locked: locked.length,
        input: vars.filter(v => v.category === 'input').length,
        computed: vars.filter(v => v.category === 'computed').length,
        output: vars.filter(v => v.category === 'output').length,
      };
    });
  }, []);

  const categoryLabel: Record<string, string> = {
    input: 'مدخل',
    lookup: 'استيفاء',
    computed: 'محسوب',
    locked: 'مقفل',
    output: 'مخرج',
  };

  const categoryColor: Record<string, string> = {
    input: 'bg-blue-950/50 text-blue-400 border-blue-900/40',
    lookup: 'bg-purple-950/50 text-purple-400 border-purple-900/40',
    computed: 'bg-amber-950/50 text-amber-400 border-amber-900/40',
    locked: 'bg-red-950/50 text-red-400 border-red-900/40',
    output: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40',
  };

  const pathLabel: Record<string, string> = {
    roof: 'سقف',
    wall: 'جدار',
    shared: 'مشترك',
  };

  return (
    <div className="space-y-4">
      {/* ═══ إحصائيات التغطية حسب الخطوة ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">تغطية المتغيرات حسب خطوة أنبوب المعالجة</h3>
        <div className="grid grid-cols-7 gap-2">
          {stepCoverage.map(sc => (
            <div key={sc.step} className="bg-slate-950 rounded p-2 text-center border border-slate-800">
              <div className="text-emerald-400 font-bold text-xs mb-1">الخطوة {sc.step}</div>
              <div className="text-slate-300 font-mono text-lg font-bold">{sc.total}</div>
              <div className="flex justify-center gap-1 mt-1 text-[9px]">
                <span className="text-blue-400">{sc.input}I</span>
                <span className="text-amber-400">{sc.computed}C</span>
                <span className="text-red-400">{sc.locked}L</span>
                <span className="text-emerald-400">{sc.output}O</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-[9px] text-slate-500 justify-center">
          <span>I = مدخل</span>
          <span>C = محسوب</span>
          <span>L = مقفل</span>
          <span>O = مخرج</span>
        </div>
      </div>

      {/* ═══ أدوات الفلترة ═══ */}
      <div className="flex flex-col lg:flex-row gap-2">
        <input
          type="text"
          placeholder="بحث بالاسم أو الرمز أو الوصف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          aria-label="البحث في المتغيرات"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">كل الفئات</option>
          <option value="input">مدخل</option>
          <option value="lookup">استيفاء</option>
          <option value="computed">محسوب</option>
          <option value="locked">مقفل</option>
          <option value="output">مخرج</option>
        </select>
        <select
          value={stepFilter}
          onChange={(e) => setStepFilter(e.target.value as typeof stepFilter)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">كل الخطوات</option>
          <option value="2">الخطوة 2</option>
          <option value="3">الخطوة 3</option>
          <option value="4">الخطوة 4</option>
          <option value="5">الخطوة 5</option>
          <option value="6">الخطوة 6</option>
          <option value="7">الخطوة 7</option>
          <option value="8">الخطوة 8</option>
        </select>
        <select
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value as typeof pathFilter)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">كل المسارات</option>
          <option value="roof">سقف</option>
          <option value="wall">جدار</option>
          <option value="shared">مشترك</option>
        </select>
      </div>

      {/* ═══ جدول المتغيرات ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                <th className="p-3">الرمز</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">الوصف</th>
                <th className="p-3">الوحدة</th>
                <th className="p-3">الفئة</th>
                <th className="p-3">الخطوة</th>
                <th className="p-3">المسار</th>
                <th className="p-3">مقفل</th>
                <th className="p-3">المصدر</th>
                <th className="p-3">التبعيات</th>
                <th className="p-3 text-center">تتبع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredVariables.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    لا توجد متغيرات مطابقة لخيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredVariables.map((v) => (
                  <tr
                    key={v.name}
                    className={`hover:bg-slate-950/20 transition-colors cursor-pointer ${
                      selectedVariable === v.name ? 'bg-emerald-950/10 ring-1 ring-emerald-500/20' : ''
                    }`}
                    onClick={() => setSelectedVariable(selectedVariable === v.name ? null : v.name)}
                  >
                    <td className="p-3 font-mono font-bold text-emerald-400">{v.symbol}</td>
                    <td className="p-3 font-mono text-slate-300">{v.name}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{v.descriptionAr}</td>
                    <td className="p-3 font-mono text-slate-500">{v.unit}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border ${categoryColor[v.category]}`}>
                        {categoryLabel[v.category]}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{v.step}</td>
                    <td className="p-3 text-[11px] text-slate-500">{pathLabel[v.path]}</td>
                    <td className="p-3 text-center">{v.locked ? '🔒' : ''}</td>
                    <td className="p-3 text-[11px] text-slate-500">{v.source}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">
                      {v.dependsOn.length > 0 ? v.dependsOn.slice(0, 3).join(', ') + (v.dependsOn.length > 3 ? '...' : '') : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVariable(v.name);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded transition-colors"
                      >
                        🔍
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-800 p-2 text-[10px] text-slate-500 text-center">
          عرض {filteredVariables.length} من أصل {UNIFIED_VARIABLE_TABLE.length} متغير
        </div>
      </div>

      {/* ═══ لوحة التتبع التفصيلية ═══ */}
      {selectedVariable && traceResult && (
        <div className="bg-slate-900 border border-emerald-900/40 rounded-lg p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-emerald-400">
              🔍 تتبع المتغير: <span className="font-mono">{selectedVariable}</span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTraceDirection('toInputs')}
                className={`px-3 py-1 text-[10px] rounded border transition-colors ${
                  traceDirection === 'toInputs'
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40 font-bold'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                تتبع للمدخلات
              </button>
              <button
                onClick={() => setTraceDirection('fromInput')}
                className={`px-3 py-1 text-[10px] rounded border transition-colors ${
                  traceDirection === 'fromInput'
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40 font-bold'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                تتبع للمخرجات
              </button>
            </div>
          </div>

          {traceDirection === 'toInputs' ? (
            <div className="space-y-3">
              {/* سلسلة التتبع */}
              <div className="text-[11px] text-slate-400">
                سلسلة التبعيات من <strong className="text-emerald-400">{selectedVariable}</strong> إلى جميع المدخلات:
              </div>
              <div className="space-y-2">
                {traceResult.chain.map((entry, idx) => (
                  <div
                    key={`${entry.variable}-${idx}`}
                    className={`flex items-center gap-3 p-2 rounded border ${
                      idx === 0
                        ? 'bg-emerald-950/20 border-emerald-900/40'
                        : entry.locked
                          ? 'bg-red-950/10 border-red-900/30'
                          : entry.category === 'input' || entry.category === 'lookup'
                            ? 'bg-blue-950/10 border-blue-900/30'
                            : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <span className="text-slate-600 font-mono text-[10px] w-4">{idx + 1}</span>
                    <span className="font-mono text-emerald-400 text-xs w-24">{entry.variable}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${categoryColor[entry.category] || ''}`}>
                      {categoryLabel[entry.category] || entry.category}
                    </span>
                    <span className="text-[10px] text-slate-500">الخطوة {entry.step}</span>
                    <span className="text-[10px] text-slate-500">{pathLabel[entry.path]}</span>
                    {entry.locked && <span className="text-red-400 text-[10px]">🔒</span>}
                    {idx < traceResult.chain.length - 1 && (
                      <span className="text-slate-700 mr-auto">←</span>
                    )}
                  </div>
                ))}
              </div>

              {/* ملخص */}
              <div className="flex gap-4 text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                <span>إجمالي العقد: <strong className="text-slate-300">{traceResult.chain.length}</strong></span>
                <span>قيم مقفلة: <strong className="text-red-400">{traceResult.lockedEntries.length}</strong></span>
                <span>مصادر مدخل: <strong className="text-blue-400">{traceResult.inputSources.length}</strong></span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">
                جميع المخرجات التي تعتمد على <strong className="text-emerald-400">{selectedVariable}</strong>:
              </div>
              {reverseTrace.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">
                  هذا المتغير لا يؤثر على أي مخرج آخر مباشرة
                </div>
              ) : (
                <div className="space-y-2">
                  {reverseTrace.map((entry, idx) => (
                    <div
                      key={`${entry.variable}-${idx}`}
                      className={`flex items-center gap-3 p-2 rounded border ${
                        entry.locked
                          ? 'bg-red-950/10 border-red-900/30'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <span className="text-slate-600 font-mono text-[10px] w-4">{idx + 1}</span>
                      <span className="font-mono text-emerald-400 text-xs w-24">{entry.variable}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${categoryColor[entry.category] || ''}`}>
                        {categoryLabel[entry.category] || entry.category}
                      </span>
                      <span className="text-[10px] text-slate-500">الخطوة {entry.step}</span>
                      <span className="text-[10px] text-slate-500">{pathLabel[entry.path]}</span>
                      {entry.locked && <span className="text-red-400 text-[10px]">🔒</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                عدد المخرجات المتأثرة: <strong className="text-slate-300">{reverseTrace.length}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
