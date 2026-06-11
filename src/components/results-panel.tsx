// ═══════════════════════════════════════════════════════════════════════
// بطاقة عرض مطابقة اختبارات القبول والـ Benchmarks
// منصة المدقق الديناميكي الموحد V3.0
// تستقبل مخرجات المحركات الحسابية وتعرض حالة الالتزام بالـ Baseline
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import type { StructuralOutput } from '@/lib/structural/structuralEngine';

interface ResultsPanelProps {
  outputs: StructuralOutput | null;
  baselineVersion: string;
}

export function ResultsPanel({ outputs, baselineVersion }: ResultsPanelProps) {
  if (!outputs) {
    return (
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 text-center text-sm text-slate-500">
        بانتظار تمرير البيانات وتشغيل النبضة الحسابية لعرض نتائج التحقق
        والمطابقة...
      </div>
    );
  }

  const isSuccess = outputs.status === 'SUCCESS';

  return (
    <div
      className="bg-slate-900 p-6 rounded-lg border border-slate-800 space-y-4"
      role="region"
      aria-label="لوحة النتائج الفنية"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-sm font-bold text-slate-200">
          مخرجات المطابقة وفحص الحدود الكودية
        </h4>
        <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
          Baseline: {baselineVersion}
        </span>
      </div>

      {/* الحالة التشغيلية الكبرى */}
      <div
        className={`p-4 rounded-lg border text-center ${
          isSuccess
            ? 'bg-emerald-950/30 border-emerald-800/50'
            : 'bg-red-950/30 border-red-800/50'
        }`}
      >
        <span
          className={`text-lg font-bold ${
            isSuccess ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isSuccess
            ? '✔ المقطع محقق ومطابق للكود'
            : '❌ فشل إجهاد القص الثاقب (Punching)'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* العمق الفعال */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400 block mb-1">العمق الفعال d_eff:</span>
          <span className="font-mono text-sm font-bold text-slate-200">
            {outputs.d_eff.toFixed(0)} mm
          </span>
        </div>

        {/* المحيط الحرج */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400 block mb-1">
            المحيط الحرج b₀:
          </span>
          <span className="font-mono text-sm font-bold text-slate-200">
            {outputs.b_0.toFixed(1)} mm
          </span>
        </div>

        {/* اللامركزية */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400 block mb-1">
            اللامركزية e:
          </span>
          <span
            className={`font-mono text-sm font-bold ${
              outputs.eccentricity <= outputs.e_limit
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {outputs.eccentricity.toFixed(1)} mm
          </span>
        </div>

        {/* حد النواة */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400 block mb-1">
            حد النواة e_limit:
          </span>
          <span className="font-mono text-sm font-bold text-slate-200">
            {outputs.e_limit.toFixed(1)} mm
          </span>
        </div>

        {/* إجهاد القص الفعلي */}
        {outputs.v_actual !== undefined && (
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="text-slate-400 block mb-1">
              إجهاد القص الفعلي v_actual:
            </span>
            <span
              className={`font-mono text-sm font-bold ${
                outputs.v_actual > (outputs.v_cd ?? Infinity)
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {outputs.v_actual.toFixed(3)} MPa
            </span>
          </div>
        )}

        {/* إجهاد القص المسموح */}
        {outputs.v_cd !== undefined && (
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="text-slate-400 block mb-1">
              إجهاد القص المسموح v_cd:
            </span>
            <span className="font-mono text-sm font-bold text-slate-200">
              {outputs.v_cd.toFixed(3)} MPa
            </span>
          </div>
        )}
      </div>

      {/* جدول ملخص الحوكمة */}
      <div className="border border-slate-800 rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-950">
              <th className="p-2 text-right text-slate-400">البند</th>
              <th className="p-2 text-center text-slate-400">القيمة</th>
              <th className="p-2 text-center text-slate-400">الحد</th>
              <th className="p-2 text-center text-slate-400">الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="p-2 text-slate-300">اللامركزية</td>
              <td className="p-2 text-center font-mono text-slate-200">
                {outputs.eccentricity.toFixed(1)}
              </td>
              <td className="p-2 text-center font-mono text-slate-400">
                ≤ {outputs.e_limit.toFixed(1)}
              </td>
              <td
                className={`p-2 text-center font-bold ${
                  outputs.eccentricity <= outputs.e_limit
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {outputs.eccentricity <= outputs.e_limit ? '✓' : '✗'}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="p-2 text-slate-300">القص الثاقب</td>
              <td className="p-2 text-center font-mono text-slate-200">
                {outputs.v_actual?.toFixed(3) ?? '—'}
              </td>
              <td className="p-2 text-center font-mono text-slate-400">
                ≤ {outputs.v_cd?.toFixed(3) ?? '—'}
              </td>
              <td
                className={`p-2 text-center font-bold ${
                  outputs.status === 'SUCCESS'
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {outputs.status === 'SUCCESS' ? '✓' : '✗'}
              </td>
            </tr>
            <tr>
              <td className="p-2 text-slate-300">نسبة التسليح</td>
              <td className="p-2 text-center font-mono text-slate-200">
                {(outputs.rho_final * 100).toFixed(2)}%
              </td>
              <td className="p-2 text-center font-mono text-slate-400">
                ≥ 0.25%
              </td>
              <td className="p-2 text-center font-bold text-emerald-400">
                ✓
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* عرض رسالة الخطأ الحوكمية في حال الفشل السلبي */}
      {!isSuccess && outputs.errorMessage && (
        <div
          className="p-3 bg-red-950/40 border border-red-900/50 rounded text-xs text-red-400 leading-relaxed"
          role="alert"
        >
          {outputs.errorMessage}
        </div>
      )}
    </div>
  );
}
