// ═══════════════════════════════════════════════════════════════════════
// جدول المتطلبات الحي مع الـ Accessibility المعزز
// منصة المدقق الديناميكي الموحد V3.0
// فرز وترشيح وبحث ديناميكي حي — يدعم قارئات الشاشة بالكامل
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import type { RtmRecord } from '@/lib/storage/storageSchemas';

interface RtmTableProps {
  records: RtmRecord[];
  onTriggerReRun: () => void;
  isPending: boolean;
}

export function RtmTable({ records, onTriggerReRun, isPending }: RtmTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');

  // تصفية ديناميكية حية مبنية على فهارس البحث والحالة
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.associatedRequirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.testCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.scenarioId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // إحصائيات مختصرة
  const passedCount = records.filter((r) => r.status === 'PASSED').length;
  const failedCount = records.filter((r) => r.status === 'FAILED').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      {/* لوحة التحكم والفرز والبحث */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-200">
            سجل فحص وتغطية المتطلبات الوظيفية الحي
          </h2>
          <div className="flex items-center gap-3 mt-1 text-[10px]">
            <span className="text-emerald-400 font-mono font-bold">
              ✔ {passedCount} ناجح
            </span>
            {failedCount > 0 && (
              <span className="text-red-400 font-mono font-bold animate-pulse">
                ❌ {failedCount} فاشل
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
          <input
            type="text"
            placeholder="بحث بواسطة المعرّف (FR ID) أو الاختبار (TC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            aria-label="البحث داخل مصفوفة الامتثال"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PASSED' | 'FAILED')}
            className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            aria-label="تصفية السجلات حسب حالة النجاح أو السقوط"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="PASSED">الناجحة (PASSED)</option>
            <option value="FAILED">العيوب المكسورة (FAILED)</option>
          </select>
          <button
            onClick={onTriggerReRun}
            disabled={isPending}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded transition-colors"
          >
            {isPending
              ? 'جاري قراءة خط الأساس وإعادة الحساب المتبادل...'
              : '⟳ تشغيل الفحص والـ Re-run Triggers'}
          </button>
        </div>
      </div>

      {/* الـ Accessibility الكامل للجدول الهيكلي */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse">
          <caption className="sr-only">
            جدول يوضح حالة امتثال المتطلبات الهندسية لحالات الاختبار الحالية في
            قاعدة البيانات المحلية
          </caption>
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
              <th scope="col" className="p-3">
                المتطلب الحاكم (FR ID)
              </th>
              <th scope="col" className="p-3">
                حالة الاختبار (Test Case ID)
              </th>
              <th scope="col" className="p-3">
                السيناريو المرتبط
              </th>
              <th scope="col" className="p-3">
                التوقيت الزمني
              </th>
              <th scope="col" className="p-3 text-center">
                الحالة الحوكمية
              </th>
              <th scope="col" className="p-3">
                سجل العيب
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  {records.length === 0
                    ? 'لا توجد سجلات امتثال في قاعدة البيانات المحلية بعد. قم بتشغيل محركات الحساب وحفظ نتائج التدقيق لإنشاء سجلات RTM.'
                    : 'لا توجد سجلات امتثال حية متطابقة مع خيارات الفرز الحالية.'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className={`hover:bg-slate-950/20 transition-colors ${
                    record.status === 'FAILED' ? 'bg-red-950/10' : ''
                  }`}
                >
                  <th
                    scope="row"
                    className="p-3 font-mono font-bold text-emerald-400"
                  >
                    {record.associatedRequirement}
                  </th>
                  <td className="p-3 font-mono text-slate-300">
                    {record.testCaseId}
                  </td>
                  <td className="p-3 font-mono text-slate-500 text-[10px]">
                    {record.scenarioId.slice(0, 8)}...
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {new Date(record.timestamp).toLocaleString('ar-SY')}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                        record.status === 'PASSED'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
                          : 'bg-red-950/50 text-red-400 border border-red-900/40 animate-pulse'
                      }`}
                    >
                      {record.status === 'PASSED' ? '✔ PASSED' : '❌ FAILED'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-[10px] max-w-[200px] truncate">
                    {record.defectLog || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ملخص التغطية حسب حالة الاختبار */}
      {records.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <h3 className="text-[10px] font-bold text-slate-400 mb-2">
            ملخص التغطية حسب حالة الاختبار:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(
              records.reduce<Record<string, { passed: number; failed: number }>>(
                (acc, r) => {
                  if (!acc[r.testCaseId]) acc[r.testCaseId] = { passed: 0, failed: 0 };
                  if (r.status === 'PASSED') acc[r.testCaseId].passed++;
                  else acc[r.testCaseId].failed++;
                  return acc;
                },
                {}
              )
            ).map(([tcId, counts]) => (
              <div
                key={tcId}
                className="bg-slate-950 rounded p-2 text-[10px] font-mono border border-slate-800"
              >
                <span className="text-slate-300">{tcId}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-emerald-400">✔{counts.passed}</span>
                  {counts.failed > 0 && (
                    <span className="text-red-400">✗{counts.failed}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
