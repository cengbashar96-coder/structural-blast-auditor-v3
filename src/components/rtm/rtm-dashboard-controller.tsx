// ═══════════════════════════════════════════════════════════════════════
// جزيرة التحكم الكلية وقراءة البيانات المحلية الحية
// منصة المدقق الديناميكي الموحد V3.0
// يقرأ مباشرة من Dexie/IndexedDB المحلية داخل المتصفح
// لا يعتمد على السيرفر لجلب البيانات — أوفلاين بالكامل
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { db } from '@/lib/storage/db';
import { rtmRepository } from '@/lib/storage/repositories/RtmRepository';
import { syncQueueRepository } from '@/lib/storage/repositories/SyncQueueRepository';
import { ConflictPolicy } from '@/lib/storage/conflictPolicy';
import type { RtmRecord, SyncQueueRecord } from '@/lib/storage/storageSchemas';
import { RtmTable } from './rtm-table';
import { AuditTrail } from './audit-trail';
import { DefectLog } from './defect-log';

interface BenchmarkResult {
  success: boolean;
  deviation?: number;
  checkedScenariosCount?: number;
  error?: string;
}

interface ControllerProps {
  runBenchmarksAction: () => Promise<BenchmarkResult>;
}

export function RtmDashboardController({ runBenchmarksAction }: ControllerProps) {
  const [rtmRecords, setRtmRecords] = useState<RtmRecord[]>([]);
  const [syncQueueItems, setSyncQueueItems] = useState<SyncQueueRecord[]>([]);
  const [coverageReport, setCoverageReport] = useState<{
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    byTestCase: Record<string, { passed: number; failed: number }>;
  } | null>(null);
  const [conflictLog, setConflictLog] = useState<
    { id: string; timestamp: number; payloadType: string; localId: string; source: string; summary: string }[]
  >([]);
  const [auditNotification, setAuditNotification] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // جلب البيانات حركياً ومحلياً من IndexedDB فور رندر المكون على المتصفح
  const loadLocalData = useCallback(async () => {
    try {
      const records = await db.rtmRecords.toArray();
      const queue = await db.syncQueue.toArray();
      const coverage = await rtmRepository.getCoverageReport();
      const conflicts = ConflictPolicy.getConflictLog();

      setRtmRecords(records);
      setSyncQueueItems(queue);
      setCoverageReport(coverage);
      setConflictLog(conflicts);
    } catch (err) {
      console.error('[RTM-CONTROLLER] Failed to read from local subsystem store:', err);
    }
  }, []);

  useEffect(() => {
    loadLocalData();

    // تحديث دوري كل 5 ثوانٍ لمراقبة التغييرات الحية
    const interval = setInterval(loadLocalData, 5000);
    return () => clearInterval(interval);
  }, [loadLocalData]);

  const handleExecuteReRun = () => {
    startTransition(async () => {
      const result = await runBenchmarksAction();
      if (result.success) {
        setAuditNotification(
          `✔ تم إطلاق نبضة إعادة الفحص الشاملة بنجاح. فحص ${result.checkedScenariosCount} حالة تصميمية. نسبة الحيود: ${result.deviation?.toFixed(2)}%`
        );
        // تحديث البيانات المحلية بعد تشغيل النبضة
        await loadLocalData();
      } else {
        setAuditNotification(`❌ خطأ حوكمي: ${result.error}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* لوحة إشعار حية لعرض نتائج الـ Server Action */}
      {auditNotification && (
        <div
          className={`p-3 rounded text-xs flex justify-between items-center ${
            auditNotification.startsWith('✔')
              ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-400'
              : 'bg-red-950/30 border border-red-900/50 text-red-400'
          }`}
          role="alert"
        >
          <span>{auditNotification}</span>
          <button
            onClick={() => setAuditNotification(null)}
            className="text-slate-500 hover:text-slate-300 text-sm font-bold mr-3"
            aria-label="إغلاق الإشعار"
          >
            ×
          </button>
        </div>
      )}

      {/* بطاقات الإحصائيات الحوكمية المختصرة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {coverageReport?.total ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">إجمالي سجلات RTM</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {coverageReport?.passRate.toFixed(0) ?? 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">معدل النجاح الكلي</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold font-mono ${syncQueueItems.filter(s => s.status === 'PENDING').length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
            {syncQueueItems.filter((s) => s.status === 'PENDING').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">عمليات مزامنة معلقة</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold font-mono ${conflictLog.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {conflictLog.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">تعارضات مسجلة</div>
        </div>
      </div>

      {/* لوحة التحكم والجدول الإنشائي المحكم للـ Accessibility */}
      <RtmTable
        records={rtmRecords}
        onTriggerReRun={handleExecuteReRun}
        isPending={isPending}
      />

      {/* شاشات تتبع العيوب والتراجع الزمني للتعارضات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuditTrail syncItems={syncQueueItems} conflictLog={conflictLog} />
        <DefectLog rtmRecords={rtmRecords} />
      </div>
    </div>
  );
}
