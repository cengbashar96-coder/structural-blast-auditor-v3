// ═══════════════════════════════════════════════════════════════════════
// صفحة الأطروحة والمقارنة بين الأشكال الإنشائية — V3.1
// منصة المدقق الديناميكي الموحد V3.1
// مقارنة المقطع المستطيل والدائري والقوسي وفقاً لمعايير الأطروحة المرجعية
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  compareGeometries,
  GEOMETRY_FACTORS,
  DEFAULT_WEIGHTS,
  getGeometryAdjustedPressure,
} from '@/lib/engine/geometry-comparator';
import {
  designConcreteSection,
} from '@/lib/engine/structural-concrete-core';
import {
  STEP5_ROOF,
  STEP5_WALL,
  STEP7_CEILING,
  STEP8_WALL,
  FINAL_LOCKED_RESULTS,
  STEP4_LOCKED,
  STEP2_GEOMETRY,
} from '@/lib/constants/reference-data';
import type {
  GeometryType,
  SectionDesignResult,
} from '@/lib/engine/types';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart3,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// ثوابت العرض
// ═══════════════════════════════════════════════════════════════════════

const GEOMETRY_LABELS: Record<GeometryType, string> = {
  RECTANGULAR: 'المستطيل',
  CIRCULAR: 'الدائري',
  ARCHED: 'القوسي',
};

const SHAPES: GeometryType[] = ['RECTANGULAR', 'CIRCULAR', 'ARCHED'];

function formatNum(val: number, decimals: number = 2): string {
  return val.toFixed(decimals);
}

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════════════════════════════

export default function ThesisComparisonPage() {
  // ─── حسابات المقارنة ─────────────────────────────────────────────

  const computed = useMemo(() => {
    const PpRoof = STEP5_ROOF.Pp;      // 4.921 kg/cm²
    const PpWall = STEP5_WALL.Pp;      // 3.785 kg/cm²
    const ap = STEP2_GEOMETRY.ap;      // 4 m
    const bp = STEP2_GEOMETRY.bp;      // 5 m
    const fcMpa = 30;                  // مقاومة الخرسانة المرجعية
    const fyMpa = 400;                 // إجهاد خضوع الحديد

    // تحويل Pp من kg/cm² إلى MPa
    const PpRoofMpa = PpRoof * 0.0980665;
    const PpWallMpa = PpWall * 0.0980665;

    // حساب designConcreteSection لكل شكل
    const roofResults: Record<GeometryType, SectionDesignResult> = {} as any;

    for (const shape of SHAPES) {
      const adjustedPpRoofMpa = getGeometryAdjustedPressure(PpRoofMpa, shape);
      roofResults[shape] = designConcreteSection({
        pDesignMpa: adjustedPpRoofMpa,
        geometryType: shape,
        tunnelSpanShort: ap,
        tunnelSpanLong: bp,
        fcMpa,
        fyMpa,
      });
    }

    // مقارنة الأشكال
    const comparisonReport = compareGeometries(roofResults, DEFAULT_WEIGHTS);

    // السماكات
    const HpByShape: Record<GeometryType, number> = {} as any;
    for (const shape of SHAPES) {
      HpByShape[shape] = roofResults[shape].requiredThicknessMeters * 100; // m → cm
    }

    // Pp المُصحّح لكل شكل
    const PpRoofByShape: Record<GeometryType, number> = {} as any;
    for (const shape of SHAPES) {
      PpRoofByShape[shape] = PpRoof * GEOMETRY_FACTORS[shape].pressureReductionFactor;
    }

    // ─── جدول التسجيل ───
    const maxThickness = Math.max(...SHAPES.map(s => HpByShape[s]));
    const maxSteel = Math.max(...SHAPES.map(s => roofResults[s].requiredSteelAreaCm2PerMeter));
    const maxDuctility = Math.max(...SHAPES.map(s => GEOMETRY_FACTORS[s].muStruct));
    const maxConcrete = Math.max(...SHAPES.map(s =>
      HpByShape[s] * (s === 'CIRCULAR' ? Math.PI * 2 : s === 'ARCHED' ? 8 : 10)
    ));

    function normalizeInvert(value: number, max: number): number {
      if (max <= 0) return 50;
      return Math.max(0, 100 * (1 - value / max));
    }
    function normalizeKeep(value: number, max: number): number {
      if (max <= 0) return 50;
      return Math.max(0, 100 * (value / max));
    }
    function safetyScore(status: string): number {
      if (status === 'SUCCESS') return 100;
      if (status === 'WARNING') return 40;
      return -50;
    }

    const weights = DEFAULT_WEIGHTS;
    const scoringCriteria = [
      { name: 'السماكة', weight: weights.thicknessWeight, getScore: (s: GeometryType) => normalizeInvert(HpByShape[s], maxThickness) },
      { name: 'التسليح', weight: weights.steelWeight, getScore: (s: GeometryType) => normalizeInvert(roofResults[s].requiredSteelAreaCm2PerMeter, maxSteel) },
      { name: 'الأمان', weight: weights.safetyWeight, getScore: (s: GeometryType) => safetyScore(roofResults[s].validation.status) },
      { name: 'المطيلية', weight: weights.ductilityWeight, getScore: (s: GeometryType) => normalizeKeep(GEOMETRY_FACTORS[s].muStruct, maxDuctility) },
      { name: 'كفاءة المواد', weight: weights.materialEfficiencyWeight, getScore: (s: GeometryType) =>
        normalizeInvert(HpByShape[s] * (s === 'CIRCULAR' ? Math.PI * 2 : s === 'ARCHED' ? 8 : 10), maxConcrete) },
    ];

    const scoringTable = scoringCriteria.map(criterion => {
      const scores: Record<GeometryType, number> = {} as any;
      for (const s of SHAPES) {
        scores[s] = Number((criterion.getScore(s) * criterion.weight / 100).toFixed(2));
      }
      return { ...criterion, scores };
    });

    const totalScores: Record<GeometryType, number> = {} as any;
    for (const s of SHAPES) {
      totalScores[s] = Number(scoringTable.reduce((sum, row) => sum + row.scores[s], 0).toFixed(2));
    }

    return {
      roofResults,
      comparisonReport,
      HpByShape,
      PpRoofByShape,
      scoringTable,
      totalScores,
      PpRoof,
    };
  }, []);

  const recommendedShape = computed.comparisonReport.recommendedGeometry;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" dir="rtl">
      {/* ─── الرأس ────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-emerald-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            الأطروحة والمقارنة بين الأشكال الإنشائية
          </h1>
        </div>
        <p className="text-slate-400 text-sm md:text-base max-w-3xl mr-13">
          مقارنة المقطع المستطيل والدائري والقوسي وفقاً لمعايير الأطروحة المرجعية
        </p>
        <Separator className="mt-4 bg-slate-800/60" />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          القسم 1 — بطاقات المقارنة الثلاث
          ═══════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-200">مقارنة الأشكال الإنشائية الثلاثة</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHAPES.map((shape) => {
            const gf = GEOMETRY_FACTORS[shape];
            const result = computed.roofResults[shape];
            const isRecommended = shape === recommendedShape;

            return (
              <Card
                key={shape}
                className={`bg-slate-900/80 border transition-all ${
                  isRecommended
                    ? 'border-emerald-400/60 ring-2 ring-emerald-400/20 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800/60'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <span className="text-emerald-400">{GEOMETRY_LABELS[shape]}</span>
                    </CardTitle>
                    {isRecommended && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1">
                        <Award className="h-3 w-3" />
                        مُوصى به
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* معاملات التخفيض */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/50 rounded-md px-3 py-2">
                      <div className="text-[10px] text-slate-500 mb-0.5">معامل تخفيض العزم</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {(gf.momentReductionFactor * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-md px-3 py-2">
                      <div className="text-[10px] text-slate-500 mb-0.5">معامل تخفيض الضغط</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {(gf.pressureReductionFactor * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* معاملات الأطروحة */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Kd', value: gf.KdFactor },
                      { label: 'kψ', value: gf.kpsiFactor },
                      { label: 'μ', value: gf.muStruct },
                      { label: 'η', value: gf.etaFactor },
                    ].map((f) => (
                      <div key={f.label} className="bg-slate-800/40 rounded px-2 py-1.5 text-center">
                        <div className="text-[10px] text-slate-500">{f.label}</div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {typeof f.value === 'number' ? formatNum(f.value, 3) : f.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-slate-800/40" />

                  {/* السماكة والتسليح */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">السماكة المطلوبة</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatNum(computed.HpByShape[shape], 1)} cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">التسليح المطلوب</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatNum(result.requiredSteelAreaCm2PerMeter, 1)} cm²/m
                      </span>
                    </div>
                  </div>

                  {/* حالة الأمان */}
                  <div className="flex items-center justify-between bg-slate-800/40 rounded px-3 py-2">
                    <span className="text-xs text-slate-400">حالة الأمان</span>
                    {result.validation.status === 'SUCCESS' ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        آمن
                      </Badge>
                    ) : result.validation.status === 'WARNING' ? (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        تحذير
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        غير آمن
                      </Badge>
                    )}
                  </div>

                  <Separator className="bg-slate-800/40" />

                  {/* المزايا */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">المزايا</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pr-5">
                      {gf.advantagesAr}
                    </p>
                  </div>

                  {/* العيوب */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">العيوب</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pr-5">
                      {gf.disadvantagesAr}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          القسم 2 — جدول تسجيل المقارنة
          ═══════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <Award className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-200">جدول تسجيل المقارنة</h2>
        </div>

        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/60 hover:bg-transparent">
                    <TableHead className="text-slate-300 font-bold text-right w-[160px]">المعيار</TableHead>
                    <TableHead className="text-slate-300 font-bold text-center w-[80px]">الوزن</TableHead>
                    {SHAPES.map((shape) => (
                      <TableHead
                        key={shape}
                        className={`text-center font-bold ${
                          shape === recommendedShape ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {GEOMETRY_LABELS[shape]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.scoringTable.map((row, idx) => {
                    const maxScore = Math.max(row.scores.RECTANGULAR, row.scores.CIRCULAR, row.scores.ARCHED);
                    return (
                      <TableRow key={idx} className="border-slate-800/40 hover:bg-slate-800/30">
                        <TableCell className="text-slate-300 font-medium text-right text-sm">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-500">
                          {row.weight}%
                        </TableCell>
                        {SHAPES.map((shape) => {
                          const score = row.scores[shape];
                          const isMax = score === maxScore && score > 0;
                          return (
                            <TableCell
                              key={shape}
                              className={`text-center text-sm ${
                                isMax ? 'font-bold text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {formatNum(score, 2)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  {/* صف المجموع */}
                  <TableRow className="border-t-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10">
                    <TableCell className="text-emerald-400 font-bold text-right text-sm">
                      المجموع الكلي
                    </TableCell>
                    <TableCell className="text-center text-emerald-400 font-bold text-sm">
                      100%
                    </TableCell>
                    {SHAPES.map((shape) => {
                      const total = computed.totalScores[shape];
                      const isRecommended = shape === recommendedShape;
                      return (
                        <TableCell
                          key={shape}
                          className={`text-center text-sm font-bold ${
                            isRecommended ? 'text-emerald-400 text-base' : 'text-slate-400'
                          }`}
                        >
                          {formatNum(total, 2)}
                          {isRecommended && (
                            <Award className="h-3.5 w-3.5 inline mr-1 text-emerald-400" />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* بطاقة التوصية */}
        <div className="mt-5 p-5 bg-emerald-500/10 rounded-lg border border-emerald-400/40">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Award className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm text-emerald-400 font-medium mb-0.5">الشكل المُوصى به وفقاً للأطروحة</div>
              <div className="text-xl font-bold text-slate-100">
                {GEOMETRY_LABELS[recommendedShape]}
                <span className="text-sm font-normal text-slate-400 mr-2">
                  (درجة: {formatNum(computed.totalScores[recommendedShape], 2)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          القسم 3 — معاملات التصحيح التفصيلية
          ═══════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-200">معاملات التصحيح التفصيلية</h2>
        </div>

        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              مقارنة Kd, kψ, μ_struct, η لكل شكل هندسي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/60 hover:bg-transparent">
                    <TableHead className="text-slate-300 font-bold text-right w-[140px]">المعامل</TableHead>
                    <TableHead className="text-slate-300 font-bold text-right w-[200px]">التفسير</TableHead>
                    {SHAPES.map((shape) => (
                      <TableHead
                        key={shape}
                        className={`text-center font-bold ${
                          shape === recommendedShape ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {GEOMETRY_LABELS[shape]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      label: 'Kd',
                      explanation: 'معامل التصحيح الديناميكي — يقلل الضغط الفعلي على المقطع',
                      key: 'KdFactor' as const,
                    },
                    {
                      label: 'kψ',
                      explanation: 'معامل تصحيح الزاوية — يعكس تأثير توزيع الضغط الشعاعي',
                      key: 'kpsiFactor' as const,
                    },
                    {
                      label: 'μ_struct',
                      explanation: 'نسبة المطاوعة الإنشائية — مقياس قدرة المقطع على التشوه اللدن',
                      key: 'muStruct' as const,
                    },
                    {
                      label: 'η',
                      explanation: 'معامل الكفاءة — نسبة القدرة التحملية الفعلية للمقطع',
                      key: 'etaFactor' as const,
                    },
                  ].map((row) => {
                    const values: Record<GeometryType, number> = {
                      RECTANGULAR: GEOMETRY_FACTORS.RECTANGULAR[row.key],
                      CIRCULAR: GEOMETRY_FACTORS.CIRCULAR[row.key],
                      ARCHED: GEOMETRY_FACTORS.ARCHED[row.key],
                    };
                    // For Kd and kψ lower is better; for mu and eta higher is better
                    const lowerBetter = row.key === 'KdFactor' || row.key === 'kpsiFactor';
                    let bestShape: GeometryType = SHAPES[0];
                    for (const s of SHAPES) {
                      if (lowerBetter) {
                        if (values[s] < values[bestShape]) bestShape = s;
                      } else {
                        if (values[s] > values[bestShape]) bestShape = s;
                      }
                    }
                    return (
                      <TableRow key={row.label} className="border-slate-800/40 hover:bg-slate-800/30">
                        <TableCell className="text-emerald-400 font-mono font-bold text-right text-sm">
                          {row.label}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs text-right leading-relaxed">
                          {row.explanation}
                        </TableCell>
                        {SHAPES.map((shape) => {
                          const val = values[shape];
                          const isBest = bestShape === shape;
                          return (
                            <TableCell
                              key={shape}
                              className={`text-center text-sm font-mono ${
                                isBest ? 'font-bold text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {formatNum(val, 4)}
                              {isBest && (
                                <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-400" />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}

                  {/* صف معامل تخفيض العزم */}
                  <TableRow className="border-slate-800/40 hover:bg-slate-800/30">
                    <TableCell className="text-emerald-400 font-mono font-bold text-right text-sm">
                      معامل تخفيض العزم
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs text-right leading-relaxed">
                      يقلل العزم الانحنائي التصميمي — الأقل يعني عزماً أقل ومقطعاً أنحف
                    </TableCell>
                    {SHAPES.map((shape) => {
                      const val = GEOMETRY_FACTORS[shape].momentReductionFactor;
                      const isBest = val === Math.min(...SHAPES.map(s => GEOMETRY_FACTORS[s].momentReductionFactor));
                      return (
                        <TableCell
                          key={shape}
                          className={`text-center text-sm font-mono ${
                            isBest ? 'font-bold text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {(val * 100).toFixed(0)}%
                          {isBest && (
                            <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-400" />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* صف معامل تخفيض الضغط */}
                  <TableRow className="border-slate-800/40 hover:bg-slate-800/30">
                    <TableCell className="text-emerald-400 font-mono font-bold text-right text-sm">
                      معامل تخفيض الضغط
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs text-right leading-relaxed">
                      يقلل الضغط التصميمي الفعلي — الأقل يعني ضغطاً أقل على المقطع
                    </TableCell>
                    {SHAPES.map((shape) => {
                      const val = GEOMETRY_FACTORS[shape].pressureReductionFactor;
                      const isBest = val === Math.min(...SHAPES.map(s => GEOMETRY_FACTORS[s].pressureReductionFactor));
                      return (
                        <TableCell
                          key={shape}
                          className={`text-center text-sm font-mono ${
                            isBest ? 'font-bold text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {(val * 100).toFixed(0)}%
                          {isBest && (
                            <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-400" />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* شرح معاملات التصحيح */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {SHAPES.map((shape) => {
            const gf = GEOMETRY_FACTORS[shape];
            const isRecommended = shape === recommendedShape;
            return (
              <Card
                key={shape}
                className={`bg-slate-900/80 border ${
                  isRecommended ? 'border-emerald-400/40' : 'border-slate-800/60'
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-emerald-400">{GEOMETRY_LABELS[shape]}</span>
                    {isRecommended && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] gap-0.5">
                        <Award className="h-2.5 w-2.5" />
                        الأفضل
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                      <span className="text-slate-400">Kd = {gf.KdFactor}</span>
                      <span className="text-slate-500">
                        {shape === 'CIRCULAR' ? 'أقل ضغط ديناميكي' : shape === 'ARCHED' ? 'ضغط مخفّض جزئياً' : 'ضغط كامل'}
                      </span>
                    </div>
                    <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                      <span className="text-slate-400">kψ = {gf.kpsiFactor}</span>
                      <span className="text-slate-500">
                        {shape === 'CIRCULAR' ? 'أفضل توزيع شعاعي' : shape === 'ARCHED' ? 'توزيع قوسي جيد' : 'توزيع عادي'}
                      </span>
                    </div>
                    <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                      <span className="text-slate-400">μ = {gf.muStruct}</span>
                      <span className="text-slate-500">
                        {gf.muStruct > 0.92 ? 'مطاوعة عالية' : gf.muStruct > 0.89 ? 'مطاوعة متوسطة' : 'مطاوعة منخفضة'}
                      </span>
                    </div>
                    <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                      <span className="text-slate-400">η = {gf.etaFactor}</span>
                      <span className="text-slate-500">
                        {gf.etaFactor > 1.5 ? 'كفاءة ممتازة' : gf.etaFactor > 1.3 ? 'كفاءة جيدة' : 'كفاءة عادية'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
