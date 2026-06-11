// ═══════════════════════════════════════════════════════════════════════
// شريط التتبع الزمني لقرارات طابور المزامنة والتعارضات
// منصة المدقق الديناميكي الموحد V3.0
// يرتبط آلياً بحالة طابور المزامنة وسجل التعارضات الحي
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import type { SyncQueueRecord } from '@/lib/storage/storageSchemas';

interface ConflictLogEntry {
  id: string;
  timestamp: number;
  payloadType: string;
  localId: string;
  source: string;
  summary: string;
}

interface AuditTrailProps {
  syncItems: SyncQueueRecord[];
  conflictLog: ConflictLogEntry[];
}

export function AuditTrail({ syncItems, conflictLog }: AuditTrailProps) {
  // دمج أحداث المزامنة والتعارضات في سجل زمني واحد مرتب
  type TimelineEvent = {
    id: string;
    timestamp: number;
    type: 'SYNC' | 'CONFLICT' | 'BASELINE';
    label: string;
    detail: string;
    severity: 'info' | 'warning' | 'critical';
  };

  const timelineEvents: TimelineEvent[] = [
    // تحويل عناصر طابور المزامنة إلى أحداث زمنية
    ...syncItems.map((item): TimelineEvent => ({
      id: item.id,
      timestamp: item.timestamp,
      type: 'SYNC',
      label: `${item.action} // ${item.status}`,
      detail: `Payload: ${item.payloadType} | Retry: ${item.retryCount}/${item.maxRetries}${item.lastError ? ` | Error: ${item.lastError}` : ''}`,
      severity:
        item.status === 'FAILED'
          ? 'critical'
          : item.status === 'SYNCING'
            ? 'info'
            : 'warning',
    })),
    // تحويل سجل التعارضات إلى أحداث زمنية
    ...conflictLog.map((entry): TimelineEvent => ({
      id: entry.id,
      timestamp: entry.timestamp,
      type: 'CONFLICT',
      label: `${entry.source} — ${entry.payloadType}`,
      detail: entry.summary,
      severity: entry.source === 'SERVER_FORCE' ? 'critical' : 'warning',
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-200">
          سجل التدقيق الحي لحسم النزاعات وطابور المزامنة (Audit Trail)
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {timelineEvents.length} حدث
        </span>
      </div>

      <div
        className="space-y-3 max-h-[320px] overflow-y-auto pr-1"
        role="log"
        aria-live="polite"
        aria-label="سجل التدقيق الزمني"
      >
        {timelineEvents.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-8">
            قاعدة البيانات المحلية في حالة استقرار تام (Synced). لا توجد
            عمليات معلقة أو تعارضات في الطابور حالياً.
          </div>
        ) : (
          timelineEvents.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded border text-xs flex flex-col gap-1 ${
                event.severity === 'critical'
                  ? 'bg-red-950/20 border-red-900/40'
                  : event.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-900/40'
                    : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    event.type === 'CONFLICT'
                      ? 'bg-amber-950/60 text-amber-400 border border-amber-900/40'
                      : event.severity === 'critical'
                        ? 'bg-red-950/60 text-red-400 border border-red-900/40'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
                  }`}
                >
                  {event.type}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(event.timestamp).toLocaleString('ar-SY')}
                </span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] mt-1">
                {event.label}
              </p>
              <p className="text-slate-400 leading-relaxed text-[10px]">
                {event.detail}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
