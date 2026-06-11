// ═══════════════════════════════════════════════════════════════════════
// لوحة رصد وتحليل العيوب والانهيارات الإنشائية
// منصة المدقق الديناميكي الموحد V3.0
// تربط فشل الـ Benchmark مباشرة بتقرير انهيار المقطع
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import type { RtmRecord } from '@/lib/storage/storageSchemas';

interface DefectLogProps {
  rtmRecords: RtmRecord[];
}

export function DefectLog({ rtmRecords }: DefectLogProps) {
  // فلترة السجلات الفاشلة فقط
  const defectRecords = rtmRecords.filter((r) => r.status === 'FAILED');
  const activeDefectCount = defectRecords.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-200">
          سجل العيوب البرمجية والانهيارات الإنشائية الكودية
        </h3>
        {activeDefectCount > 0 ? (
          <span className="px-2 py-0.5 bg-red-950 text-red-400 font-bold font-mono text-[10px] rounded border border-red-900/50 animate-pulse">
            {activeDefectCount} استثناء نشط
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-bold font-mono text-[10px] rounded border border-emerald-900/50">
            لا عيوب نشطة
          </span>
        )}
      </div>

      <div
        className="space-y-3 max-h-[320px] overflow-y-auto pr-1"
        role="log"
        aria-label="سجل العيوب والانهيارات الإنشائية"
      >
        {defectRecords.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-8">
            جميع حالات الاختبار ناجحة. لا توجد عيوب إنشائية أو برمجية مسجلة
            في قاعدة البيانات المحلية. المنصة في حالة مطابقة تامة مع الكود
            السوري 2024.
          </div>
        ) : (
          defectRecords.map((record) => (
            <div
              key={record.id}
              className="p-4 bg-slate-950 rounded-lg border border-red-950/40 space-y-3 text-xs"
              role="alert"
            >
              {/* رأس العيب */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-red-400">
                  DEFECT-ID: {record.testCaseId}-{record.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">
                  {new Date(record.timestamp).toLocaleString('ar-SY')}
                </span>
              </div>

              {/* وصف العيب */}
              <div className="text-slate-300 leading-relaxed">
                <span className="text-amber-400 font-bold">[فحص تلقائي]:</span>{' '}
                فشل اختبار{' '}
                <span className="font-mono text-slate-100 font-bold">
                  {record.testCaseId}
                </span>{' '}
                المرتبط بالمتطلب{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  {record.associatedRequirement}
                </span>
                .{' '}
                {record.defectLog || 'الخوارزمية أطلقت استثناء الانهيار المقفل.'}
              </div>

              {/* شريط الحالة المقفل */}
              <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-red-400 border border-slate-900">
                STATUS: LOCKED // REJECTION_TRIGGERED // PDF_GENERATION = BLOCKED
              </div>

              {/* معلومات إضافية */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-900/60">
                <span>
                  السيناريو:{' '}
                  <strong className="text-slate-300 font-mono">
                    {record.scenarioId.slice(0, 8)}...
                  </strong>
                </span>
                <span>
                  النوع:{' '}
                  <strong className="text-slate-300">
                    {record.testCaseId.startsWith('TC-STRUCT')
                      ? 'قص ثاقب ديناميكي هالك (Punching Failure)'
                      : 'انحراف في حسابات العصف (Blast Deviation)'}
                  </strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
