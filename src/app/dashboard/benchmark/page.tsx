// ═══════════════════════════════════════════════════════════════════════
// صفحة اختبارات المرجعية — Benchmark Test Runner
// منصة المدقق الديناميكي الموحد V3.0
// RTL Arabic · Dark Theme · shadcn/ui
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useCallback } from 'react';
import { BENCHMARK_SUITE, getBenchmarkById } from '@/lib/engine/benchmarks';
import type { BenchmarkRunReport, BenchmarkResult } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Shield,
  Activity,
  TrendingUp,
} from 'lucide-react';

// ─── Types ───

interface OverallSummary {
  totalBenchmarks: number;
  totalChecks: number;
  totalPassed: number;
  totalFailed: number;
  maxDeviationPercent: number;
  allPassed: boolean;
}

interface BenchmarkRunState {
  reports: BenchmarkRunReport[];
  overall: OverallSummary;
}

// ─── Priority config ───

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'حرج', color: 'bg-red-900/50 text-red-400 border-red-800' },
  2: { label: 'مهم', color: 'bg-amber-900/50 text-amber-400 border-amber-800' },
  3: { label: 'عادي', color: 'bg-slate-800/50 text-slate-400 border-slate-700' },
};

const PRIORITY_AR: Record<number, string> = {
  1: 'حرج',
  2: 'مهم',
  3: 'عادي',
};

// ═══════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════

export default function BenchmarkPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [runState, setRunState] = useState<BenchmarkRunState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedBenchmarks, setExpandedBenchmarks] = useState<Set<string>>(
    new Set()
  );

  const toggleBenchmark = (id: string) => {
    setExpandedBenchmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runAllBenchmarks = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setRunState(null);

    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: BENCHMARK_SUITE.map((b) => b.id),
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `خطأ في الخادم: ${res.status}`);
      }

      const data = await res.json();
      setRunState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsRunning(false);
    }
  }, []);

  // ─── Render ───

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-900/30 border border-emerald-800/50 rounded-xl">
            <FlaskConical className="size-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              اختبارات المرجعية
            </h1>
            <p className="text-sm text-slate-500">
              تشغيل والتحقق من حالات الاختبار المرجعية للمحرك
            </p>
          </div>
        </div>
        <Button
          onClick={runAllBenchmarks}
          disabled={isRunning}
          className="bg-emerald-700 hover:bg-emerald-600 text-white gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              جارٍ التشغيل...
            </>
          ) : (
            <>
              <Play className="size-4" />
              تشغيل جميع الاختبارات
            </>
          )}
        </Button>
      </div>

      <Separator className="bg-slate-800/60" />

      {/* ─── Benchmark Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BENCHMARK_SUITE.map((bmk) => {
          const report = runState?.reports.find(
            (r) => r.benchmarkId === bmk.id
          );
          const priorityConf = PRIORITY_CONFIG[bmk.priority];

          return (
            <Card
              key={bmk.id}
              className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono text-slate-200">
                    {bmk.id}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {bmk.isLocked && (
                      <Badge
                        variant="outline"
                        className="border-emerald-800 text-emerald-400 text-[10px]"
                      >
                        🔒 مقفل
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`${priorityConf.color} text-[10px]`}
                    >
                      {PRIORITY_AR[bmk.priority]}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-slate-400 text-xs leading-relaxed">
                  {bmk.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>السلاح</span>
                    <span className="text-slate-300 font-mono">
                      {bmk.inputSpec.weaponId}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>السرعة</span>
                    <span className="text-slate-300 font-mono">
                      {bmk.inputSpec.impactVelocity} m/s
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>التربة</span>
                    <span className="text-slate-300 font-mono">
                      {bmk.inputSpec.soilTypeCode}
                    </span>
                  </div>
                  {report && (
                    <div className="mt-3 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        {report.overallPassed ? (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        ) : (
                          <XCircle className="size-4 text-red-400" />
                        )}
                        <span
                          className={
                            report.overallPassed
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }
                        >
                          {report.summary.passed}/{report.summary.total} نجح
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Error Display ─── */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
          <p className="font-bold mb-1">خطأ في التشغيل</p>
          <p>{error}</p>
        </div>
      )}

      {/* ─── Overall Summary ─── */}
      {runState && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard
              title="إجمالي الفحوصات"
              value={runState.overall.totalChecks}
              icon={<Activity className="size-5 text-slate-400" />}
              color="text-slate-200"
            />
            <SummaryCard
              title="نجح"
              value={runState.overall.totalPassed}
              icon={<CheckCircle2 className="size-5 text-emerald-400" />}
              color="text-emerald-400"
            />
            <SummaryCard
              title="فشل"
              value={runState.overall.totalFailed}
              icon={<XCircle className="size-5 text-red-400" />}
              color="text-red-400"
            />
            <SummaryCard
              title="أقصى انحراف"
              value={`${runState.overall.maxDeviationPercent.toFixed(2)}%`}
              icon={<TrendingUp className="size-5 text-amber-400" />}
              color="text-amber-400"
            />
          </div>

          {/* ─── Combined Results Table ─── */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                <Shield className="size-4 text-emerald-400" />
                جدول النتائج الموحد
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs font-semibold">
                        الرمز
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold">
                        القيمة المتوقعة
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold">
                        القيمة المحسوبة
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold">
                        الانحراف
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold text-center">
                        الحالة
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runState.reports.map((report) =>
                      report.results.map((result, idx) => (
                        <TableRow
                          key={`${report.benchmarkId}-${result.symbol}-${idx}`}
                          className="border-slate-800/50 hover:bg-slate-800/30"
                        >
                          <TableCell className="font-mono text-sm text-slate-300">
                            <span className="text-slate-500 text-xs ml-1">
                              {report.benchmarkId}
                            </span>
                            {result.symbol}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-400">
                            {formatNumber(result.expectedValue)}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-300">
                            {formatNumber(result.actualValue)}
                          </TableCell>
                          <TableCell
                            className={`font-mono text-sm ${
                              result.passed
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {result.deviationPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-center">
                            {result.passed ? (
                              <CheckCircle2 className="size-4 text-emerald-400 inline-block" />
                            ) : (
                              <XCircle className="size-4 text-red-400 inline-block" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ─── Individual Benchmark Expandable Details ─── */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-400" />
              تفاصيل كل اختبار
            </h2>
            {runState.reports.map((report) => {
              const bmk = getBenchmarkById(report.benchmarkId);
              const isExpanded = expandedBenchmarks.has(report.benchmarkId);

              return (
                <Collapsible
                  key={report.benchmarkId}
                  open={isExpanded}
                  onOpenChange={() => toggleBenchmark(report.benchmarkId)}
                >
                  <Card className="bg-slate-900/60 border-slate-800">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-slate-800/20 transition-colors rounded-t-lg pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {report.overallPassed ? (
                              <CheckCircle2 className="size-5 text-emerald-400" />
                            ) : (
                              <XCircle className="size-5 text-red-400" />
                            )}
                            <div>
                              <CardTitle className="text-sm font-mono text-slate-200">
                                {report.benchmarkId}
                                <span className="text-slate-500 font-normal mr-2 text-xs">
                                  {bmk?.title}
                                </span>
                              </CardTitle>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {report.summary.passed} نجح /{' '}
                                {report.summary.failed} فشل / أقصى انحراف{' '}
                                {report.summary.maxDeviationPercent.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className={`size-4 text-slate-500 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-500 text-[11px]">
                                  الرمز
                                </TableHead>
                                <TableHead className="text-slate-500 text-[11px]">
                                  المتوقعة
                                </TableHead>
                                <TableHead className="text-slate-500 text-[11px]">
                                  المحسوبة
                                </TableHead>
                                <TableHead className="text-slate-500 text-[11px]">
                                  الانحراف
                                </TableHead>
                                <TableHead className="text-slate-500 text-[11px] text-center">
                                  الحالة
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.results.map((result, idx) => (
                                <ResultRow
                                  key={`${result.symbol}-${idx}`}
                                  result={result}
                                />
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Engine notes */}
                        {bmk?.engineNotes && (
                          <div className="mt-3 bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">
                              ملاحظات المحرك
                            </p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {bmk.engineNotes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════════

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">{title}</span>
          {icon}
        </div>
        <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ResultRow({ result }: { result: BenchmarkResult }) {
  return (
    <TableRow className="border-slate-800/30 hover:bg-slate-800/20">
      <TableCell className="font-mono text-xs text-slate-300">
        {result.symbol}
      </TableCell>
      <TableCell className="font-mono text-xs text-slate-400">
        {formatNumber(result.expectedValue)}
      </TableCell>
      <TableCell className="font-mono text-xs text-slate-300">
        {formatNumber(result.actualValue)}
      </TableCell>
      <TableCell
        className={`font-mono text-xs ${
          result.passed ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {result.deviationPercent.toFixed(2)}%
      </TableCell>
      <TableCell className="text-center">
        {result.passed ? (
          <CheckCircle2 className="size-3.5 text-emerald-400 inline-block" />
        ) : (
          <XCircle className="size-3.5 text-red-400 inline-block" />
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Utility ───

function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1000000) return n.toExponential(3);
  if (Math.abs(n) >= 100) return n.toFixed(2);
  if (Math.abs(n) >= 1) return n.toFixed(4);
  if (Math.abs(n) >= 0.01) return n.toFixed(6);
  return n.toExponential(3);
}
