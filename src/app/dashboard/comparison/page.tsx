// ═══════════════════════════════════════════════════════════════════════
// صفحة المفاضلة الهندسية — مقارنة RECTANGULAR / CIRCULAR / ARCHED
// منصة المدقق الديناميكي الموحد V3.0
// RTL Arabic + Dark Theme + shadcn/ui
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ruler,
  Weight,
  Cuboid,
  Zap,
  ShieldCheck,
  Scale,
  Info,
} from 'lucide-react';
import type {
  GeometryType,
  GeometryComparisonReport,
  GeometryComparisonEntry,
  ValidationStatus,
  SectionDesignResult,
} from '@/lib/engine/types';

// ═══════════════════════════════════════════════════════════════════════
// أنواع استجابة API
// ═══════════════════════════════════════════════════════════════════════

interface ComparisonWeightsDTO {
  thicknessWeight: number;
  steelWeight: number;
  safetyWeight: number;
  ductilityWeight: number;
}

interface ComparisonResponse {
  comparison: GeometryComparisonReport;
  structural: Record<GeometryType, SectionDesignResult>;
  weights: ComparisonWeightsDTO;
  designInputs: {
    pDesignMpa: number;
    tunnelSpanShort: number;
    tunnelSpanLong: number;
    fcMpa: number;
    fyMpa: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// ثوابت محلية
// ═══════════════════════════════════════════════════════════════════════

const GEOMETRY_LABELS: Record<GeometryType, string> = {
  RECTANGULAR: 'مستطيل',
  CIRCULAR: 'دائري',
  ARCHED: 'مقوّس',
};

const GEOMETRY_COLORS: Record<GeometryType, string> = {
  RECTANGULAR: 'text-sky-400',
  CIRCULAR: 'text-amber-400',
  ARCHED: 'text-violet-400',
};

const GEOMETRY_BG: Record<GeometryType, string> = {
  RECTANGULAR: 'bg-sky-500/10 border-sky-500/30',
  CIRCULAR: 'bg-amber-500/10 border-amber-500/30',
  ARCHED: 'bg-violet-500/10 border-violet-500/30',
};

const STATUS_CONFIG: Record<
  ValidationStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  SUCCESS: {
    label: 'آمن',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  WARNING: {
    label: 'تحذير',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  FAILURE: {
    label: 'فشل',
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// مكوّن شارة الحالة
// ═══════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: ValidationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`gap-1 px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكوّن الرسوم الهندسية (SVG Cross-Sections)
// ═══════════════════════════════════════════════════════════════════════

function RectangularDiagram({ thickness, span }: { thickness: number; span: number }) {
  const w = 160;
  const h = 120;
  const rectW = 110;
  const rectH = Math.min(70, Math.max(30, thickness * 100));
  const cx = w / 2;
  const cy = h / 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mx-auto">
      {/* المستطيل */}
      <rect
        x={cx - rectW / 2}
        y={cy - rectH / 2}
        width={rectW}
        height={rectH}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
        rx="2"
      />
      {/* سهم السماكة */}
      <line
        x1={cx + rectW / 2 + 8}
        y1={cy - rectH / 2}
        x2={cx + rectW / 2 + 8}
        y2={cy + rectH / 2}
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <text x={cx + rectW / 2 + 14} y={cy + 4} fill="#94a3b8" fontSize="9" textAnchor="start">
        h={thickness.toFixed(2)}m
      </text>
      {/* سهم البحر */}
      <line
        x1={cx - rectW / 2}
        y1={cy + rectH / 2 + 10}
        x2={cx + rectW / 2}
        y2={cy + rectH / 2 + 10}
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <text x={cx} y={cy + rectH / 2 + 22} fill="#94a3b8" fontSize="9" textAnchor="middle">
        L={span.toFixed(1)}m
      </text>
    </svg>
  );
}

function CircularDiagram({ thickness, span }: { thickness: number; span: number }) {
  const w = 160;
  const h = 120;
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(45, Math.max(20, span * 12));
  const innerR = outerR - Math.min(12, Math.max(4, thickness * 30));

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mx-auto">
      {/* الدائرة الخارجية */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#fbbf24" strokeWidth="2" />
      {/* الدائرة الداخلية */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* سهم السماكة */}
      <line x1={cx} y1={cy} x2={cx + innerR} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
      <line x1={cx + innerR} y1={cy} x2={cx + outerR} y2={cy} stroke="#94a3b8" strokeWidth="1.5" />
      <text x={cx + (innerR + outerR) / 2} y={cy - 6} fill="#94a3b8" fontSize="9" textAnchor="middle">
        h={thickness.toFixed(2)}m
      </text>
      {/* سهم القطر */}
      <line x1={cx - outerR} y1={cy + outerR + 8} x2={cx + outerR} y2={cy + outerR + 8} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
      <text x={cx} y={cy + outerR + 20} fill="#94a3b8" fontSize="9" textAnchor="middle">
        D={span.toFixed(1)}m
      </text>
    </svg>
  );
}

function ArchedDiagram({ thickness, span }: { thickness: number; span: number }) {
  const w = 160;
  const h = 130;
  const cx = w / 2;
  const baseY = 80;
  const rectW = 110;
  const rectH = Math.min(45, Math.max(20, thickness * 60));
  const archR = rectW / 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mx-auto">
      {/* الجدران الجانبية */}
      <line x1={cx - rectW / 2} y1={baseY} x2={cx - rectW / 2} y2={baseY - rectH} stroke="#a78bfa" strokeWidth="2" />
      <line x1={cx + rectW / 2} y1={baseY} x2={cx + rectW / 2} y2={baseY - rectH} stroke="#a78bfa" strokeWidth="2" />
      {/* الأرضية */}
      <line x1={cx - rectW / 2} y1={baseY} x2={cx + rectW / 2} y2={baseY} stroke="#a78bfa" strokeWidth="2" />
      {/* القوس */}
      <path
        d={`M ${cx - rectW / 2} ${baseY - rectH} A ${archR} ${archR * 0.6} 0 0 1 ${cx + rectW / 2} ${baseY - rectH}`}
        fill="none"
        stroke="#a78bfa"
        strokeWidth="2"
      />
      {/* سهم السماكة */}
      <line x1={cx + rectW / 2 + 8} y1={baseY} x2={cx + rectW / 2 + 8} y2={baseY - rectH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
      <text x={cx + rectW / 2 + 14} y={baseY - rectH / 2 + 4} fill="#94a3b8" fontSize="9" textAnchor="start">
        h={thickness.toFixed(2)}m
      </text>
      {/* سهم البحر */}
      <line x1={cx - rectW / 2} y1={baseY + 10} x2={cx + rectW / 2} y2={baseY + 10} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
      <text x={cx} y={baseY + 22} fill="#94a3b8" fontSize="9" textAnchor="middle">
        L={span.toFixed(1)}m
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مُحمّل هيكلي
// ═══════════════════════════════════════════════════════════════════════

function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function ComparisonPage() {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch('/api/comparison');
        if (!res.ok) throw new Error(`خطأ في الخادم: ${res.status}`);
        const json: ComparisonResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطأ غير معروف');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ─── أفضل قيمة لكل معيار ───
  const bestValues = useMemo(() => {
    if (!data) return null;
    const m = data.comparison.comparisonMatrix;
    const geos: GeometryType[] = ['RECTANGULAR', 'CIRCULAR', 'ARCHED'];

    return {
      thicknessMeters: geos.reduce((best, g) =>
        m[g].thicknessMeters < m[best].thicknessMeters ? g : best
      ),
      steelWeightTon: geos.reduce((best, g) =>
        m[g].steelWeightTon < m[best].steelWeightTon ? g : best
      ),
      concreteVolumeM3: geos.reduce((best, g) =>
        m[g].concreteVolumeM3 < m[best].concreteVolumeM3 ? g : best
      ),
      maxDynamicMomentKnM: geos.reduce((best, g) =>
        m[g].maxDynamicMomentKnM > m[best].maxDynamicMomentKnM ? g : best
      ),
    };
  }, [data]);

  // ─── صفوف الجدول ───
  const tableRows = useMemo(() => {
    if (!data) return [];
    const m = data.comparison.comparisonMatrix;

    return [
      {
        criterion: 'السماكة المطلوبة (m)',
        icon: <Ruler className="h-4 w-4 text-slate-400" />,
        key: 'thicknessMeters' as const,
        format: (v: number) => v.toFixed(3),
        best: bestValues?.thicknessMeters,
        lowerBetter: true,
      },
      {
        criterion: 'وزن الحديد (طن)',
        icon: <Weight className="h-4 w-4 text-slate-400" />,
        key: 'steelWeightTon' as const,
        format: (v: number) => v.toFixed(2),
        best: bestValues?.steelWeightTon,
        lowerBetter: true,
      },
      {
        criterion: 'حجم الخرسانة (m³)',
        icon: <Cuboid className="h-4 w-4 text-slate-400" />,
        key: 'concreteVolumeM3' as const,
        format: (v: number) => v.toFixed(2),
        best: bestValues?.concreteVolumeM3,
        lowerBetter: true,
      },
      {
        criterion: 'العزم الديناميكي (kN.m)',
        icon: <Zap className="h-4 w-4 text-slate-400" />,
        key: 'maxDynamicMomentKnM' as const,
        format: (v: number) => v.toFixed(1),
        best: bestValues?.maxDynamicMomentKnM,
        lowerBetter: false,
      },
    ];
  }, [data, bestValues]);

  if (loading) return <ComparisonSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 text-center">
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium">خطأ في تحميل البيانات</p>
            <p className="text-sm text-slate-500 mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { comparison, structural, weights, designInputs } = data;
  const { comparisonMatrix, recommendedGeometry, explanation } = comparison;
  const geos: GeometryType[] = ['RECTANGULAR', 'CIRCULAR', 'ARCHED'];

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══════════════ 1. الرأس ═══════════════ */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">المفاضلة الهندسية</h1>
          <p className="text-sm text-slate-500">
            مقارنة الأشكال الإنشائية الثلاثة — المرجع BMK-02
          </p>
        </div>
      </div>

      {/* ═══════════════ 2. جدول المقارنة ═══════════════ */}
      <Card className="border-slate-800/60 bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-400" />
            مصفوفة المقارنة
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            القيم المُبرزة بالأخضر هي الأفضل لكل معيار
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-medium text-xs w-[180px]">
                    المعيار
                  </TableHead>
                  {geos.map((geo) => (
                    <TableHead
                      key={geo}
                      className={`text-center font-semibold text-xs ${GEOMETRY_COLORS[geo]}`}
                    >
                      {GEOMETRY_LABELS[geo]}
                      {geo === recommendedGeometry && (
                        <Trophy className="h-3 w-3 inline-block mr-1 text-emerald-400" />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow
                    key={row.key}
                    className="border-slate-800/40 hover:bg-slate-800/20"
                  >
                    <TableCell className="text-slate-300 text-sm font-medium flex items-center gap-2">
                      {row.icon}
                      {row.criterion}
                    </TableCell>
                    {geos.map((geo) => {
                      const value = comparisonMatrix[geo][row.key];
                      const isBest = row.best === geo;
                      return (
                        <TableCell
                          key={geo}
                          className={`text-center text-sm tabular-nums ${
                            isBest
                              ? 'text-emerald-400 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          {row.format(value)}
                          {isBest && (
                            <span className="text-emerald-500 text-[10px] mr-1">✓</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* ─── صف حالة الأمان ─── */}
                <TableRow className="border-slate-800/40 hover:bg-slate-800/20">
                  <TableCell className="text-slate-300 text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    حالة الأمان
                  </TableCell>
                  {geos.map((geo) => (
                    <TableCell key={geo} className="text-center">
                      <StatusBadge status={comparisonMatrix[geo].safetyStatus} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════ 3. بطاقة التوصية ═══════════════ */}
      <Card className="border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-base font-bold text-emerald-300">
              الشكل المُوصى به: {GEOMETRY_LABELS[recommendedGeometry]}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* التفسير */}
            <div className="space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
              <Separator className="bg-emerald-500/20" />
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  سماكة: {comparisonMatrix[recommendedGeometry].thicknessMeters.toFixed(3)}m
                </span>
                <span className="flex items-center gap-1">
                  <Weight className="h-3 w-3" />
                  حديد: {comparisonMatrix[recommendedGeometry].steelWeightTon.toFixed(2)} طن
                </span>
                <span className="flex items-center gap-1">
                  <Cuboid className="h-3 w-3" />
                  خرسانة: {comparisonMatrix[recommendedGeometry].concreteVolumeM3.toFixed(2)}m³
                </span>
              </div>
            </div>

            {/* ملخص درجات كل شكل */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 mb-2">ملخص التقييم:</p>
              {geos.map((geo) => {
                const entry = comparisonMatrix[geo];
                const isRecommended = geo === recommendedGeometry;
                return (
                  <div
                    key={geo}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm ${
                      isRecommended
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-slate-800/30 border border-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${GEOMETRY_COLORS[geo]}`}>
                        {GEOMETRY_LABELS[geo]}
                      </span>
                      {isRecommended && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5">
                          موصى
                        </Badge>
                      )}
                    </div>
                    <StatusBadge status={entry.safetyStatus} />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════ 4. الأشكال الهندسية البصرية ═══════════════ */}
      <Card className="border-slate-800/60 bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Ruler className="h-4 w-4 text-emerald-400" />
            المقاطع العرضية
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            الأبعاد الرئيسية لكل شكل هندسي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* مستطيل */}
            <div
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${GEOMETRY_BG.RECTANGULAR} ${
                recommendedGeometry === 'RECTANGULAR' ? 'ring-1 ring-emerald-500/30' : ''
              }`}
            >
              <span className={`text-sm font-semibold ${GEOMETRY_COLORS.RECTANGULAR}`}>
                مقطع مستطيل
                {recommendedGeometry === 'RECTANGULAR' && (
                  <Trophy className="h-3.5 w-3.5 inline mr-1 text-emerald-400" />
                )}
              </span>
              <RectangularDiagram
                thickness={comparisonMatrix.RECTANGULAR.thicknessMeters}
                span={designInputs.tunnelSpanShort}
              />
              <div className="text-[11px] text-slate-500 text-center space-y-0.5">
                <p>سماكة: {comparisonMatrix.RECTANGULAR.thicknessMeters.toFixed(3)}m</p>
                <p>بحر: {designInputs.tunnelSpanShort}×{designInputs.tunnelSpanLong}m</p>
              </div>
            </div>

            {/* دائري */}
            <div
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${GEOMETRY_BG.CIRCULAR} ${
                recommendedGeometry === 'CIRCULAR' ? 'ring-1 ring-emerald-500/30' : ''
              }`}
            >
              <span className={`text-sm font-semibold ${GEOMETRY_COLORS.CIRCULAR}`}>
                مقطع دائري
                {recommendedGeometry === 'CIRCULAR' && (
                  <Trophy className="h-3.5 w-3.5 inline mr-1 text-emerald-400" />
                )}
              </span>
              <CircularDiagram
                thickness={comparisonMatrix.CIRCULAR.thicknessMeters}
                span={designInputs.tunnelSpanShort}
              />
              <div className="text-[11px] text-slate-500 text-center space-y-0.5">
                <p>سماكة: {comparisonMatrix.CIRCULAR.thicknessMeters.toFixed(3)}m</p>
                <p>قطر داخلي: {(designInputs.tunnelSpanShort * 0.8).toFixed(1)}m</p>
              </div>
            </div>

            {/* مقوّس */}
            <div
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${GEOMETRY_BG.ARCHED} ${
                recommendedGeometry === 'ARCHED' ? 'ring-1 ring-emerald-500/30' : ''
              }`}
            >
              <span className={`text-sm font-semibold ${GEOMETRY_COLORS.ARCHED}`}>
                مقطع مقوّس
                {recommendedGeometry === 'ARCHED' && (
                  <Trophy className="h-3.5 w-3.5 inline mr-1 text-emerald-400" />
                )}
              </span>
              <ArchedDiagram
                thickness={comparisonMatrix.ARCHED.thicknessMeters}
                span={designInputs.tunnelSpanShort}
              />
              <div className="text-[11px] text-slate-500 text-center space-y-0.5">
                <p>سماكة: {comparisonMatrix.ARCHED.thicknessMeters.toFixed(3)}m</p>
                <p>بحر: {designInputs.tunnelSpanShort}×{designInputs.tunnelSpanLong}m</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════ 5. معايير القرار (الأوزان) ═══════════════ */}
      <Card className="border-slate-800/60 bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-400" />
            معايير اتخاذ القرار
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            أوزان الترجيح المستخدمة في حساب الدرجة الكلية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* وزن السماكة */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-sky-400" />
                  <span className="text-sm font-medium text-slate-300">السماكة</span>
                </div>
                <span className="text-lg font-bold text-sky-400">{weights.thicknessWeight}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500/70 transition-all duration-500"
                  style={{ width: `${weights.thicknessWeight}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">أخف = أفضل</p>
            </div>

            {/* وزن الحديد */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">التسليح</span>
                </div>
                <span className="text-lg font-bold text-amber-400">{weights.steelWeight}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500/70 transition-all duration-500"
                  style={{ width: `${weights.steelWeight}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">أقل = أفضل</p>
            </div>

            {/* وزن الأمان */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-300">الأمان</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">{weights.safetyWeight}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500/70 transition-all duration-500"
                  style={{ width: `${weights.safetyWeight}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">SUCCESS = أعلى درجة</p>
            </div>

            {/* وزن المطاوعة */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">المطاوعة</span>
                </div>
                <span className="text-lg font-bold text-violet-400">{weights.ductilityWeight}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500/70 transition-all duration-500"
                  style={{ width: `${weights.ductilityWeight}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">أعلى = أفضل</p>
            </div>
          </div>

          {/* ملاحظة */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-slate-800/20 border border-slate-800/30">
            <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              الدرجة الكلية = (درجة السماكة × {weights.thicknessWeight}%) + (درجة التسليح × {weights.steelWeight}%) + (درجة الأمان × {weights.safetyWeight}%) + (درجة المطاوعة × {weights.ductilityWeight}%).
              الشكل الحاصل على أعلى درجة يُوصى به. الأوزان قابلة للتعديل حسب أولويات التصميم.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════ 6. ملخص المدخلات التصميمية ═══════════════ */}
      <Card className="border-slate-800/60 bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-400" />
            المدخلات التصميمية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'الضغط التصميمي', value: `${designInputs.pDesignMpa.toFixed(4)} MPa`, color: 'text-sky-400' },
              { label: 'البحر القصير', value: `${designInputs.tunnelSpanShort} m`, color: 'text-amber-400' },
              { label: 'البحر الطويل', value: `${designInputs.tunnelSpanLong} m`, color: 'text-amber-400' },
              { label: 'مقاومة الخرسانة', value: `${designInputs.fcMpa} MPa`, color: 'text-emerald-400' },
              { label: 'إجهاد الحديد', value: `${designInputs.fyMpa} MPa`, color: 'text-violet-400' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-lg bg-slate-800/30 border border-slate-800/40 text-center"
              >
                <p className="text-[11px] text-slate-500 mb-1">{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
