// ═══════════════════════════════════════════════════════════════════════
// صفحة الأطروحة والمقارنة بين الأشكال الإنشائية — واجهة 7
// منصة المدقق الديناميكي الموحد V3.0
// مقارنة الأشكال الإنشائية الثلاثة بناءً على الحسابات ومعادلات الأطروحة المرجعية
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
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  FINAL_LOCKED_RESULTS,
  STEP4_LOCKED,
  STEP5_ROOF,
  STEP5_WALL,
  STEP7_CEILING,
  STEP8_WALL,
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
} from '@/lib/constants/reference-data';
import type {
  GeometryType,
  SectionDesignResult,
} from '@/lib/engine/types';
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Target,
  TrendingDown,
  Trophy,
  Scale,
  Info,
  Hexagon,
  Circle,
  Square,
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════
// ثوابت العرض
// ═══════════════════════════════════════════════════════════════════════

const GEOMETRY_LABELS: Record<GeometryType, string> = {
  RECTANGULAR: 'مستطيل',
  ARCHED: 'قوسي',
  CIRCULAR: 'دائري',
};

const GEOMETRY_COLORS: Record<GeometryType, string> = {
  RECTANGULAR: 'text-sky-400',
  ARCHED: 'text-violet-400',
  CIRCULAR: 'text-amber-400',
};

const GEOMETRY_BG: Record<GeometryType, string> = {
  RECTANGULAR: 'bg-sky-500/10 border-sky-500/30',
  ARCHED: 'bg-violet-500/10 border-violet-500/30',
  CIRCULAR: 'bg-amber-500/10 border-amber-500/30',
};

const SHAPE_ICONS: Record<GeometryType, React.ReactNode> = {
  RECTANGULAR: <Square className="h-5 w-5 text-sky-400" />,
  ARCHED: <Hexagon className="h-5 w-5 text-violet-400" />,
  CIRCULAR: <Circle className="h-5 w-5 text-amber-400" />,
};

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function formatNum(val: number, decimals: number = 2): string {
  return val.toFixed(decimals);
}

function getBestShape(
  rowValues: Record<GeometryType, number>,
  lowerIsBetter: boolean = true
): GeometryType {
  const shapes: GeometryType[] = ['RECTANGULAR', 'ARCHED', 'CIRCULAR'];
  return shapes.reduce((best, current) => {
    const bestVal = rowValues[best];
    const currentVal = rowValues[current];
    return lowerIsBetter
      ? currentVal < bestVal ? current : best
      : currentVal > bestVal ? current : best;
  });
}

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════════════════════════════

export default function ThesisComparisonPage() {
  // ─── حسابات المقارنة ─────────────────────────────────────────────

  const computedResults = useMemo(() => {
    // البيانات المرجعية المقفلة
    const PpRoof = STEP5_ROOF.Pp;    // 4.921 kg/cm²
    const PpWall = STEP5_WALL.Pp;    // 3.785 kg/cm²
    const HpRef = STEP4_LOCKED.Hp;   // 70.46 cm
    const HcRef = STEP4_LOCKED.Hc;   // 49.82 cm
    const ap = STEP2_GEOMETRY.ap;    // 4 m
    const bp = STEP2_GEOMETRY.bp;    // 5 m
    const fcMpa = 30;                // مقاومة الخرسانة المرجعية
    const fyMpa = 400;               // إجهاد خضوع الحديد

    // تحويل Pp من kg/cm² إلى MPa (1 MPa ≈ 0.0980665 kg/cm²)
    const PpRoofMpa = PpRoof * 0.0980665;
    const PpWallMpa = PpWall * 0.0980665;

    // حساب designConcreteSection لكل شكل (للسقف)
    const shapes: GeometryType[] = ['RECTANGULAR', 'ARCHED', 'CIRCULAR'];

    const roofResults: Record<GeometryType, SectionDesignResult> = {} as any;
    const wallResults: Record<GeometryType, SectionDesignResult> = {} as any;

    for (const shape of shapes) {
      // سقف: Pp مُصحّح حسب الشكل
      const adjustedPpRoofMpa = getGeometryAdjustedPressure(PpRoofMpa, shape);
      roofResults[shape] = designConcreteSection({
        pDesignMpa: adjustedPpRoofMpa,
        geometryType: shape,
        tunnelSpanShort: ap,
        tunnelSpanLong: bp,
        fcMpa,
        fyMpa,
      });

      // جدار: Pp مُصحّح حسب الشكل (الدائري ليس له جدار بالمعنى التقليدي)
      const adjustedPpWallMpa = getGeometryAdjustedPressure(PpWallMpa, shape);
      wallResults[shape] = designConcreteSection({
        pDesignMpa: adjustedPpWallMpa,
        geometryType: shape,
        tunnelSpanShort: ap,
        tunnelSpanLong: bp,
        fcMpa,
        fyMpa,
      });
    }

    // مقارنة الأشكال باستخدام المحرك
    const comparisonReport = compareGeometries(roofResults, DEFAULT_WEIGHTS);

    // حساب السماكات المرجعية لكل شكل
    const HpByShape: Record<GeometryType, number> = {} as any;
    const HcByShape: Record<GeometryType, number> = {} as any;

    for (const shape of shapes) {
      HpByShape[shape] = roofResults[shape].requiredThicknessMeters * 100; // m → cm
      HcByShape[shape] = wallResults[shape].requiredThicknessMeters * 100; // m → cm
    }

    // حساب Pp المُصحّح لكل شكل
    const PpRoofByShape: Record<GeometryType, number> = {} as any;
    const PpWallByShape: Record<GeometryType, number> = {} as any;
    for (const shape of shapes) {
      PpRoofByShape[shape] = PpRoof * GEOMETRY_FACTORS[shape].pressureReductionFactor;
      PpWallByShape[shape] = PpWall * GEOMETRY_FACTORS[shape].pressureReductionFactor;
    }

    // معاملات التخفيض
    const momentReduction: Record<GeometryType, number> = {
      RECTANGULAR: GEOMETRY_FACTORS.RECTANGULAR.momentReductionFactor * 100,
      ARCHED: GEOMETRY_FACTORS.ARCHED.momentReductionFactor * 100,
      CIRCULAR: GEOMETRY_FACTORS.CIRCULAR.momentReductionFactor * 100,
    };
    const pressureReduction: Record<GeometryType, number> = {
      RECTANGULAR: GEOMETRY_FACTORS.RECTANGULAR.pressureReductionFactor * 100,
      ARCHED: GEOMETRY_FACTORS.ARCHED.pressureReductionFactor * 100,
      CIRCULAR: GEOMETRY_FACTORS.CIRCULAR.pressureReductionFactor * 100,
    };

    // المطيلية
    const ductility: Record<GeometryType, number> = {
      RECTANGULAR: GEOMETRY_FACTORS.RECTANGULAR.muStruct,
      ARCHED: GEOMETRY_FACTORS.ARCHED.muStruct,
      CIRCULAR: GEOMETRY_FACTORS.CIRCULAR.muStruct,
    };

    // نسبة التخفيض في التسليح والخرسانة (مقارنة بالمستطيل)
    const steelReduction: Record<GeometryType, number> = {} as any;
    const concreteReduction: Record<GeometryType, number> = {} as any;
    const refSteel = roofResults.RECTANGULAR.requiredSteelAreaCm2PerMeter;
    const refConcrete = HpByShape.RECTANGULAR;
    for (const shape of shapes) {
      steelReduction[shape] = ((refSteel - roofResults[shape].requiredSteelAreaCm2PerMeter) / refSteel) * 100;
      concreteReduction[shape] = ((refConcrete - HpByShape[shape]) / refConcrete) * 100;
    }

    // نسبة الأمان لكل شكل
    const safetyRatio: Record<GeometryType, string> = {} as any;
    for (const shape of shapes) {
      const status = roofResults[shape].validation.status;
      safetyRatio[shape] = status === 'SUCCESS' ? 'آمن ✓' : status === 'WARNING' ? 'تحذير ⚠' : 'غير آمن ✗';
    }

    // ─── جدول التسجيل التفصيلي (Scoring Breakdown) ───
    const maxThickness = Math.max(...shapes.map(s => HpByShape[s]));
    const maxSteel = Math.max(...shapes.map(s => roofResults[s].requiredSteelAreaCm2PerMeter));
    const maxDuctility = Math.max(...shapes.map(s => ductility[s]));
    const maxConcrete = Math.max(...shapes.map(s => HpByShape[s] * (s === 'CIRCULAR' ? Math.PI * 2 : s === 'ARCHED' ? 8 : 10)));

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
      { name: 'السماكة', nameEn: 'thickness', weight: weights.thicknessWeight, getScore: (s: GeometryType) => normalizeInvert(HpByShape[s], maxThickness) },
      { name: 'التسليح', nameEn: 'steel', weight: weights.steelWeight, getScore: (s: GeometryType) => normalizeInvert(roofResults[s].requiredSteelAreaCm2PerMeter, maxSteel) },
      { name: 'الأمان', nameEn: 'safety', weight: weights.safetyWeight, getScore: (s: GeometryType) => safetyScore(roofResults[s].validation.status) },
      { name: 'المطيلية', nameEn: 'ductility', weight: weights.ductilityWeight, getScore: (s: GeometryType) => normalizeKeep(ductility[s], maxDuctility) },
      { name: 'كفاءة المواد', nameEn: 'materialEfficiency', weight: weights.materialEfficiencyWeight, getScore: (s: GeometryType) => normalizeInvert(HpByShape[s] * (s === 'CIRCULAR' ? Math.PI * 2 : s === 'ARCHED' ? 8 : 10), maxConcrete) },
    ];

    const scoringTable = scoringCriteria.map(criterion => {
      const scores: Record<GeometryType, number> = {} as any;
      for (const s of shapes) {
        scores[s] = Number((criterion.getScore(s) * criterion.weight / 100).toFixed(2));
      }
      return { ...criterion, scores };
    });

    const totalScores: Record<GeometryType, number> = {} as any;
    for (const s of shapes) {
      totalScores[s] = Number(scoringTable.reduce((sum, row) => sum + row.scores[s], 0).toFixed(2));
    }

    // نسبة التفضيل
    const maxTotalScore = Math.max(...shapes.map(s => totalScores[s]));
    const preferenceRatio = maxTotalScore > 0
      ? ((maxTotalScore / shapes.reduce((sum, s) => sum + totalScores[s], 0)) * 100).toFixed(1)
      : '0';

    return {
      roofResults,
      wallResults,
      comparisonReport,
      HpByShape,
      HcByShape,
      PpRoofByShape,
      PpWallByShape,
      momentReduction,
      pressureReduction,
      ductility,
      steelReduction,
      concreteReduction,
      safetyRatio,
      scoringTable,
      totalScores,
      preferenceRatio,
      HpRef,
      HcRef,
      PpRoof,
      PpWall,
    };
  }, []);

  // ─── بنود جدول المقارنة ─────────────────────────────────────────

  const comparisonRows = useMemo(() => {
    const r = computedResults;
    return [
      {
        criterion: 'Hp سماكة السقف (cm)',
        values: { RECTANGULAR: r.HpByShape.RECTANGULAR, ARCHED: r.HpByShape.ARCHED, CIRCULAR: r.HpByShape.CIRCULAR },
        lowerBetter: true,
        format: (v: number) => formatNum(v, 1),
      },
      {
        criterion: 'Hc سماكة الجدار (cm)',
        values: { RECTANGULAR: r.HcByShape.RECTANGULAR, ARCHED: r.HcByShape.ARCHED, CIRCULAR: 0 },
        lowerBetter: true,
        format: (v: number, shape?: GeometryType) => shape === 'CIRCULAR' ? 'N/A' : formatNum(v, 1),
      },
      {
        criterion: 'Pp سقف ضغط تصميم (kg/cm²)',
        values: { RECTANGULAR: r.PpRoofByShape.RECTANGULAR, ARCHED: r.PpRoofByShape.ARCHED, CIRCULAR: r.PpRoofByShape.CIRCULAR },
        lowerBetter: true,
        format: (v: number) => formatNum(v, 2),
      },
      {
        criterion: 'Pp جدار ضغط تصميم (kg/cm²)',
        values: { RECTANGULAR: r.PpWallByShape.RECTANGULAR, ARCHED: r.PpWallByShape.ARCHED, CIRCULAR: 0 },
        lowerBetter: true,
        format: (v: number, shape?: GeometryType) => shape === 'CIRCULAR' ? 'N/A' : formatNum(v, 2),
      },
      {
        criterion: 'معامل تخفيض العزم (%)',
        values: r.momentReduction,
        lowerBetter: true,
        format: (v: number) => `${formatNum(v, 0)}%`,
      },
      {
        criterion: 'معامل تخفيض الضغط (%)',
        values: r.pressureReduction,
        lowerBetter: true,
        format: (v: number) => `${formatNum(v, 0)}%`,
      },
      {
        criterion: 'كمية التسليح',
        values: r.steelReduction,
        lowerBetter: true,
        format: (v: number, shape?: GeometryType) =>
          shape === 'RECTANGULAR' ? 'مرجع' : `${v > 0 ? '−' : '+'}${formatNum(Math.abs(v), 0)}%`,
      },
      {
        criterion: 'كمية الخرسانة',
        values: r.concreteReduction,
        lowerBetter: true,
        format: (v: number, shape?: GeometryType) =>
          shape === 'RECTANGULAR' ? 'مرجع' : `${v > 0 ? '−' : '+'}${formatNum(Math.abs(v), 0)}%`,
      },
      {
        criterion: 'نسبة الأمان',
        values: r.safetyRatio as unknown as Record<GeometryType, number>,
        lowerBetter: false,
        format: (v: unknown) => v as string,
        skipBest: true,
      },
      {
        criterion: 'مطيلية (μ)',
        values: r.ductility,
        lowerBetter: false,
        format: (v: number) => formatNum(v, 3),
      },
    ];
  }, [computedResults]);

  // ─── بيانات تحليل الأشكال ────────────────────────────────────────

  const shapeAnalysisData: Record<GeometryType, {
    advantages: string;
    disadvantages: string;
    factors: { Kd: number; kpsi: number; mu: number; eta: number };
    momentReductionPct: number;
    suitability: string;
  }> = {
    RECTANGULAR: {
      advantages: 'سهل التنفيذ، أقل تكلفة تشييد، تصميم مباشر',
      disadvantages: 'أضعف تحت الحمل الانفجاري، لحظات انحناء عالية في الزوايا',
      factors: {
        Kd: GEOMETRY_FACTORS.RECTANGULAR.KdFactor,
        kpsi: GEOMETRY_FACTORS.RECTANGULAR.kpsiFactor,
        mu: GEOMETRY_FACTORS.RECTANGULAR.muStruct,
        eta: GEOMETRY_FACTORS.RECTANGULAR.etaFactor,
      },
      momentReductionPct: 0,
      suitability: 'للمنشآت التقليدية ذات الميزانية المحدودة',
    },
    ARCHED: {
      advantages: 'يوزّع الأحمال على شكل قوس ضاغط، يقلل اللحظات بنسبة 20-30%',
      disadvantages: 'أكثر تعقيداً في التنفيذ والصبّ، يحتاج قوالب خاصة للسقف',
      factors: {
        Kd: GEOMETRY_FACTORS.ARCHED.KdFactor,
        kpsi: GEOMETRY_FACTORS.ARCHED.kpsiFactor,
        mu: GEOMETRY_FACTORS.ARCHED.muStruct,
        eta: GEOMETRY_FACTORS.ARCHED.etaFactor,
      },
      momentReductionPct: 28,
      suitability: 'للمنشآت التي تحتاج توازن بين الكلفة والأداء',
    },
    CIRCULAR: {
      advantages: 'أفضل توزيع للضغط الشعاعي، يقلل السماكة 25-35%',
      disadvantages: 'الأكثر تعقيداً في التنفيذ، يحتاج قوالب دائرية خاصة',
      factors: {
        Kd: GEOMETRY_FACTORS.CIRCULAR.KdFactor,
        kpsi: GEOMETRY_FACTORS.CIRCULAR.kpsiFactor,
        mu: GEOMETRY_FACTORS.CIRCULAR.muStruct,
        eta: GEOMETRY_FACTORS.CIRCULAR.etaFactor,
      },
      momentReductionPct: 42,
      suitability: 'للمنشآت ذات الأولوية القصوى للحماية',
    },
  };

  // ─── render ────────────────────────────────────────────────────────

  const recommendedShape = computedResults.comparisonReport.recommendedGeometry;
  const recommendedNameAr = GEOMETRY_LABELS[recommendedShape];
  const totalScores = computedResults.totalScores;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" dir="rtl">
      {/* ─── الرأس ────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            الأطروحة والمقارنة بين الأشكال
          </h1>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 text-sm px-3 py-1">
            واجهة 7
          </Badge>
        </div>
        <p className="text-slate-400 text-sm md:text-base max-w-3xl">
          مقارنة الأشكال الإنشائية الثلاثة بناءً على الحسابات ومعادلات الأطروحة المرجعية
        </p>
        <Separator className="mt-4 bg-slate-800/60" />
      </div>

      {/* ─── التبويبات ────────────────────────────────────────── */}
      <Tabs defaultValue="comparison" dir="rtl" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800/60 h-auto p-1">
          <TabsTrigger
            value="comparison"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400 px-4 py-2 text-sm"
          >
            <BarChart3 className="h-4 w-4 ml-2" />
            جدول المقارنة
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400 px-4 py-2 text-sm"
          >
            <Scale className="h-4 w-4 ml-2" />
            تحليل الأشكال
          </TabsTrigger>
          <TabsTrigger
            value="decision"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400 px-4 py-2 text-sm"
          >
            <Brain className="h-4 w-4 ml-2" />
            القرار النهائي
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════
            التبويب 1 — جدول المقارنة
            ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                جدول المقارنة بين الأشكال الإنشائية الثلاثة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800/60 hover:bg-transparent">
                      <TableHead className="text-slate-300 font-bold text-right w-[200px]">المعيار</TableHead>
                      <TableHead className="text-center text-sky-400 font-bold">مستطيل</TableHead>
                      <TableHead className="text-center text-violet-400 font-bold">قوسي</TableHead>
                      <TableHead className="text-center text-amber-400 font-bold">دائري</TableHead>
                      <TableHead className="text-center text-emerald-400 font-bold">الأفضل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonRows.map((row, idx) => {
                      // تحديد الأفضل
                      let bestShape: GeometryType = 'RECTANGULAR';
                      if (!row.skipBest) {
                        const numericValues = (row.values as Record<GeometryType, number>);
                        if (row.lowerBetter) {
                          const shapes: GeometryType[] = ['RECTANGULAR', 'ARCHED', 'CIRCULAR'];
                          let minVal = Infinity;
                          for (const s of shapes) {
                            if (s === 'CIRCULAR' && (row.criterion.includes('الجدار') || row.criterion.includes('Hc'))) continue;
                            if (numericValues[s] < minVal) {
                              minVal = numericValues[s];
                              bestShape = s;
                            }
                          }
                        } else {
                          const shapes: GeometryType[] = ['RECTANGULAR', 'ARCHED', 'CIRCULAR'];
                          let maxVal = -Infinity;
                          for (const s of shapes) {
                            if (numericValues[s] > maxVal) {
                              maxVal = numericValues[s];
                              bestShape = s;
                            }
                          }
                        }
                      }

                      return (
                        <TableRow key={idx} className="border-slate-800/40 hover:bg-slate-800/30">
                          <TableCell className="text-slate-300 font-medium text-right text-sm">
                            {row.criterion}
                          </TableCell>
                          {(['RECTANGULAR', 'ARCHED', 'CIRCULAR'] as GeometryType[]).map((shape) => {
                            const val = row.values[shape];
                            const isBest = !row.skipBest && bestShape === shape;
                            return (
                              <TableCell
                                key={shape}
                                className={`text-center text-sm ${isBest ? 'font-bold' : ''} ${GEOMETRY_COLORS[shape]}`}
                              >
                                {row.format(val as number, shape)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            {!row.skipBest ? (
                              <Badge className={`bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs`}>
                                {GEOMETRY_LABELS[bestShape]}
                              </Badge>
                            ) : (
                              <span className="text-slate-500 text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ملخص سريع */}
              <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-300">ملخص المرجع</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
                  <div>Hp مرجعي: <span className="text-sky-400 font-bold">{formatNum(computedResults.HpRef, 1)} cm</span></div>
                  <div>Hc مرجعي: <span className="text-sky-400 font-bold">{formatNum(computedResults.HcRef, 1)} cm</span></div>
                  <div>Pp سقف: <span className="text-sky-400 font-bold">{formatNum(computedResults.PpRoof, 2)} kg/cm²</span></div>
                  <div>Pp جدار: <span className="text-sky-400 font-bold">{formatNum(computedResults.PpWall, 2)} kg/cm²</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════
            التبويب 2 — تحليل الأشكال
            ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['RECTANGULAR', 'ARCHED', 'CIRCULAR'] as GeometryType[]).map((shape) => {
              const data = shapeAnalysisData[shape];
              const isRecommended = shape === recommendedShape;

              return (
                <Card
                  key={shape}
                  className={`bg-slate-900/50 border ${isRecommended ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-800/60'} transition-all`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {SHAPE_ICONS[shape]}
                        <span className={GEOMETRY_COLORS[shape]}>{GEOMETRY_LABELS[shape]}</span>
                      </CardTitle>
                      {isRecommended && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          <Trophy className="h-3 w-3 ml-1" />
                          مُوصى به
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* المزايا */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">مزايا</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pr-5">
                        {data.advantages}
                      </p>
                    </div>

                    {/* العيوب */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400">عيوب</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pr-5">
                        {data.disadvantages}
                      </p>
                    </div>

                    <Separator className="bg-slate-800/40" />

                    {/* معاملات */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Target className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">معاملات الأطروحة</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                          <span className="text-slate-400">Kd</span>
                          <span className="text-slate-200 font-mono">{data.factors.Kd}</span>
                        </div>
                        <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                          <span className="text-slate-400">kψ</span>
                          <span className="text-slate-200 font-mono">{data.factors.kpsi}</span>
                        </div>
                        <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                          <span className="text-slate-400">μ</span>
                          <span className="text-slate-200 font-mono">{data.factors.mu}</span>
                        </div>
                        <div className="flex justify-between bg-slate-800/40 rounded px-2 py-1.5">
                          <span className="text-slate-400">η</span>
                          <span className="text-slate-200 font-mono">{data.factors.eta}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-slate-800/40" />

                    {/* تخفيض العزم */}
                    <div className="flex items-center justify-between bg-slate-800/40 rounded px-3 py-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <TrendingDown className="h-3.5 w-3.5" />
                        تخفيض العزم
                      </span>
                      <Badge
                        className={`text-xs ${
                          data.momentReductionPct > 30
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : data.momentReductionPct > 0
                            ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                            : 'bg-slate-700/50 text-slate-400 border-slate-700/50'
                        }`}
                      >
                        {data.momentReductionPct > 0 ? `${data.momentReductionPct}%` : '0%'}
                      </Badge>
                    </div>

                    {/* الملاءمة */}
                    <div className="p-3 bg-slate-800/20 rounded border border-slate-800/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300">ملاءمة</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {data.suitability}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════
            التبويب 3 — القرار النهائي
            ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="decision" className="space-y-6">
          {/* بطاقة القرار */}
          <Card className="bg-slate-900/50 border-emerald-500/40 ring-1 ring-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-400" />
                القرار النهائي — نتيجة المفاضلة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* الشكل الموصى به */}
              <div className="flex items-center gap-4 p-5 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Trophy className="h-7 w-7 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-emerald-400 font-medium mb-1">الشكل المُوصى به</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {recommendedNameAr}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-slate-400 mb-1">نسبة التفضيل</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {computedResults.preferenceRatio}%
                  </div>
                </div>
              </div>

              {/* المبرر من الأطروحة */}
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800/40">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">المبرر من الأطروحة</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {computedResults.comparisonReport.explanation}
                </p>
              </div>

              {/* ملاحظة التكلفة */}
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-300">
                    ملاحظة: إذا كانت التكلفة أولوية → القوسي يوفر توازناً أفضل بين الكلفة والأداء
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جدول التسجيل التفصيلي */}
          <Card className="bg-slate-900/50 border-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                جدول التسجيل التفصيلي (Scoring Breakdown)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800/60 hover:bg-transparent">
                      <TableHead className="text-slate-300 font-bold text-right">المعيار</TableHead>
                      <TableHead className="text-center text-slate-300 font-bold">الوزن</TableHead>
                      <TableHead className="text-center text-sky-400 font-bold">مستطيل</TableHead>
                      <TableHead className="text-center text-violet-400 font-bold">قوسي</TableHead>
                      <TableHead className="text-center text-amber-400 font-bold">دائري</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedResults.scoringTable.map((row, idx) => (
                      <TableRow key={idx} className="border-slate-800/40 hover:bg-slate-800/30">
                        <TableCell className="text-slate-300 font-medium text-right text-sm">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-400">
                          {row.weight}%
                        </TableCell>
                        {(['RECTANGULAR', 'ARCHED', 'CIRCULAR'] as GeometryType[]).map((shape) => {
                          const score = row.scores[shape];
                          const isMax = score === Math.max(
                            row.scores.RECTANGULAR,
                            row.scores.ARCHED,
                            row.scores.CIRCULAR
                          );
                          return (
                            <TableCell
                              key={shape}
                              className={`text-center text-sm ${isMax ? 'font-bold' : ''} ${GEOMETRY_COLORS[shape]}`}
                            >
                              {formatNum(score, 2)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    {/* صف المجموع */}
                    <TableRow className="border-t-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10">
                      <TableCell className="text-emerald-400 font-bold text-right text-sm">
                        المجموع
                      </TableCell>
                      <TableCell className="text-center text-emerald-400 font-bold text-sm">
                        100%
                      </TableCell>
                      {(['RECTANGULAR', 'ARCHED', 'CIRCULAR'] as GeometryType[]).map((shape) => {
                        const total = totalScores[shape];
                        const isRecommended = shape === recommendedShape;
                        return (
                          <TableCell
                            key={shape}
                            className={`text-center text-sm font-bold ${
                              isRecommended ? 'text-emerald-400 text-base' : GEOMETRY_COLORS[shape]
                            }`}
                          >
                            {formatNum(total, 2)}
                            {isRecommended && (
                              <Trophy className="h-3.5 w-3.5 inline mr-1 text-emerald-400" />
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

          {/* تفاصيل درجات كل شكل */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['RECTANGULAR', 'ARCHED', 'CIRCULAR'] as GeometryType[]).map((shape) => {
              const total = totalScores[shape];
              const isRecommended = shape === recommendedShape;
              return (
                <Card
                  key={shape}
                  className={`bg-slate-900/50 border ${
                    isRecommended ? 'border-emerald-500/40' : 'border-slate-800/60'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {SHAPE_ICONS[shape]}
                        <span className={`font-bold ${GEOMETRY_COLORS[shape]}`}>
                          {GEOMETRY_LABELS[shape]}
                        </span>
                      </div>
                      {isRecommended && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          الأفضل
                        </Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-slate-100 mb-1">
                      {formatNum(total, 2)}
                    </div>
                    <div className="text-xs text-slate-400">درجة كلية من 100</div>
                    {/* شريط تقدم بصري */}
                    <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isRecommended ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, total))}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── التنقل السفلي ────────────────────────────────────── */}
      <Separator className="my-8 bg-slate-800/60" />
      <div className="flex items-center justify-between pb-6">
        <Link href="/dashboard/structural-design">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            تصميم الجدران
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 gap-2"
          >
            لوحة التحكم
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
