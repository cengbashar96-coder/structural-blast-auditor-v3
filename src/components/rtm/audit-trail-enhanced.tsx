// ═══════════════════════════════════════════════════════════════════════
// سجل التدقيق الحي المُعزز — عرض تفصيلي لعمليات النظام
// منصة المدقق الديناميكي الموحد V3.0
// يتتبع: مزامنة، تعارضات، قرارات المحرك، عمليات القفل
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useMemo } from 'react';
import type { SyncQueueRecord } from '@/lib/storage/storageSchemas';
import { LOCKED_REGISTRY } from '@/lib/constants/reference-data';
import type { EngineStep, BlastLoadPath } from '@/types/engine';

interface ConflictLogEntry {
  id: string;
  timestamp: number;
  payloadType: string;
  localId: string;
  source: string;
  summary: string;
}

interface AuditTrailEnhancedProps {
  syncItems: SyncQueueRecord[];
  conflictLog: ConflictLogEntry[];
}

type AuditEventType = 'SYNC' | 'CONFLICT' | 'ENGINE' | 'LOCK' | 'BASELINE';
type AuditSeverity = 'info' | 'warning' | 'critical' | 'success';
type AuditFilter = 'all' | AuditEventType;

export function AuditTrailEnhanced({ syncItems, conflictLog }: AuditTrailEnhancedProps) {
  const [filter, setFilter] = useState<AuditFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // بناء أحداث المحرك والقفل من البيانات المرجعية
  const engineAndLockEvents = useMemo(() => {
    const events: Array<{
      id: string;
      timestamp: number;
      type: AuditEventType;
      label: string;
      detail: string;
      severity: AuditSeverity;
      metadata: Record<string, unknown>;
    }> = [];

    // أحداث حدود المحرك — القيم المقفلة
    const stepLabels: Record<number, string> = {
      3: 'محرك الاختراق (Step 3)',
      4: 'القفل الأولي (Step 4)',
      5: 'محرك حمل الانفجار (Step 5)',
      6: 'معاملات الجدول ب (Step 6)',
      7: 'تصميم سماكة السقف (Step 7)',
      8: 'تصميم الجدار النهائي (Step 8)',
    };

    for (const entry of LOCKED_REGISTRY) {
      events.push({
        id: `lock-${entry.key}`,
        timestamp: Date.now() - Math.random() * 86400000,
        type: 'LOCK',
        label: `قفل ${entry.key} ← الخطوة ${entry.producedByStep}`,
        detail: `القيمة: ${entry.value} | التسامح: ${(entry.tolerance * 100).toFixed(0)}% | المسار: ${entry.path === 'roof' ? 'سقف' : entry.path === 'wall' ? 'جدار' : 'مشترك'} | تُستهلك بواسطة: الخطوات [${entry.consumedBySteps.join(', ')}]`,
        severity: 'success',
        metadata: {
          key: entry.key,
          value: entry.value,
          producedByStep: entry.producedByStep,
          consumedBySteps: entry.consumedBySteps,
          path: entry.path,
          tolerance: entry.tolerance,
        },
      });
    }

    // حدود المحرك
    const boundaries = [
      { from: 'الاختراق → حمل الانفجار', keys: LOCKED_REGISTRY.filter(e => e.producedByStep === 3 && e.consumedBySteps.includes(5)).map(e => e.key) },
      { from: 'حمل الانفجار (سقف) → التصميم', keys: LOCKED_REGISTRY.filter(e => e.producedByStep === 5 && e.path === 'roof').map(e => e.key) },
      { from: 'حمل الانفجار (جدار) → التصميم', keys: LOCKED_REGISTRY.filter(e => e.producedByStep === 5 && e.path === 'wall').map(e => e.key) },
    ];

    for (const boundary of boundaries) {
      events.push({
        id: `boundary-${boundary.from}`,
        timestamp: Date.now() - Math.random() * 86400000,
        type: 'ENGINE',
        label: `حد المحرك: ${boundary.from}`,
        detail: `القيم المنتقلة: ${boundary.keys.length} متغير مقفل (${boundary.keys.join(', ')})`,
        severity: 'info',
        metadata: { boundary: boundary.from, keys: boundary.keys },
      });
    }

    return events;
  }, []);

  // دمج جميع الأحداث
  const allEvents = useMemo(() => {
    const syncEvents = syncItems.map((item) => ({
      id: item.id,
      timestamp: item.timestamp,
      type: 'SYNC' as AuditEventType,
      label: `${item.action} // ${item.status}`,
      detail: `Payload: ${item.payloadType} | Retry: ${item.retryCount}/${item.maxRetries}${item.lastError ? ` | Error: ${item.lastError}` : ''}`,
      severity: (item.status === 'FAILED' ? 'critical' : item.status === 'SYNCING' ? 'info' : item.status === 'COMPLETED' ? 'success' : 'warning') as AuditSeverity,
      metadata: { action: item.action, status: item.status, payloadType: item.payloadType, retryCount: item.retryCount, maxRetries: item.maxRetries, lastError: item.lastError },
    }));

    const conflictEvents = conflictLog.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      type: 'CONFLICT' as AuditEventType,
      label: `${entry.source} — ${entry.payloadType}`,
      detail: entry.summary,
      severity: (entry.source === 'SERVER_FORCE' ? 'critical' : 'warning') as AuditSeverity,
      metadata: { source: entry.source, payloadType: entry.payloadType, localId: entry.localId },
    }));

    return [...syncEvents, ...conflictEvents, ...engineAndLockEvents]
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [syncItems, conflictLog, engineAndLockEvents]);

  // فلترة الأحداث
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const matchesFilter = filter === 'all' || event.type === filter;
      const matchesSearch = searchQuery === '' ||
        event.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.detail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allEvents, filter, searchQuery]);

  // إحصائيات
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEvents.length };
    for (const event of allEvents) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts;
  }, [allEvents]);

  const typeLabel: Record<string, string> = {
    SYNC: 'مزامنة',
    CONFLICT: 'تعارض',
    ENGINE: 'محرك',
    LOCK: 'قفل',
    BASELINE: 'خط أساس',
  };

  const typeColor: Record<string, string> = {
    SYNC: 'bg-blue-950/60 text-blue-400 border border-blue-900/40',
    CONFLICT: 'bg-amber-950/60 text-amber-400 border border-amber-900/40',
    ENGINE: 'bg-purple-950/60 text-purple-400 border border-purple-900/40',
    LOCK: 'bg-red-950/60 text-red-400 border border-red-900/40',
    BASELINE: 'bg-slate-950/60 text-slate-400 border border-slate-800',
  };

  const severityColor: Record<string, string> = {
    info: 'bg-slate-950 border-slate-800',
    warning: 'bg-amber-950/20 border-amber-900/40',
    critical: 'bg-red-950/20 border-red-900/40',
    success: 'bg-emerald-950/20 border-emerald-900/40',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-sm font-bold text-slate-200">
          سجل التدقيق الحي المُعزز (Enhanced Audit Trail)
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {filteredEvents.length} / {allEvents.length} حدث
        </span>
      </div>

      {/* أدوات الفلترة والبحث */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="بحث في الأحداث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <div className="flex gap-1 flex-wrap">
          {(['all', 'SYNC', 'CONFLICT', 'ENGINE', 'LOCK'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                filter === f
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40 font-bold'
                  : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'الكل' : typeLabel[f]} ({eventCounts[f] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* سجل الأحداث */}
      <div
        className="space-y-2 max-h-[400px] overflow-y-auto pr-1"
        role="log"
        aria-live="polite"
        aria-label="سجل التدقيق الزمني المُعزز"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-8">
            لا توجد أحداث مطابقة للفلتر الحالي.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded border text-xs transition-all cursor-pointer ${severityColor[event.severity]}`}
              onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${typeColor[event.type]}`}>
                    {typeLabel[event.type]}
                  </span>
                  <span className="text-slate-300 font-mono text-[11px]">{event.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(event.timestamp).toLocaleString('ar-SY')}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[10px] mt-1">
                {event.detail}
              </p>

              {/* تفاصيل موسعة */}
              {expandedEvent === event.id && event.metadata && (
                <div className="mt-2 pt-2 border-t border-slate-800/50">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">بيانات وصفية:</div>
                  <pre className="text-[9px] text-slate-400 font-mono bg-slate-950 rounded p-2 overflow-x-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
