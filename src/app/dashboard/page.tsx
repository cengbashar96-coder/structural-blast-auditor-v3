// ═══════════════════════════════════════════════════════════════════════
// صفحة لوحة التحكم الرئيسية — Dashboard Overview V3.1
// منصة المدقق الديناميكي الموحد V3.1
// صفحة ملخص تنقلية — روابط لصفحات الخطوات السبع + النتائج النهائية
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { FINAL_LOCKED_RESULTS, STEP3_PENETRATION, STEP5_ROOF, STEP5_WALL, STEP7_CEILING, STEP8_WALL } from '@/lib/constants/reference-data';
import { compareGeometries, GEOMETRY_FACTORS } from '@/lib/engine/geometry-comparator';
import { designConcreteSection } from '@/lib/engine/structural-concrete-core';
import type { GeometryType } from '@/lib/engine/types';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Layers,
  Target,
  Zap,
  ArrowDownFromLine,
  ArrowRightLeft,
  Building2,
  BookOpen,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// تعريف الخطوات السبع
// ═══════════════════════════════════════════════════════════════════════

interface StepCardData {
  stepNumber: string;
  nameAr: string;
  descriptionAr: string;
  href: string;
  resultLabel: string;
  resultValue: string;
  isComplete: boolean;
  icon: React.ReactNode;
  color: string;
}

const STEPS: StepCardData[] = [
  {
    stepNumber: '2',
    nameAr: 'المدخلات والجداول',
    descriptionAr: 'بيانات السلاح والتربة والاستيفاءات المرجعية',
    href: '/dashboard/step2-inputs',
    resultLabel: 'C_ef',
    resultValue: `${FINAL_LOCKED_RESULTS.C_ef.toFixed(2)} kg`,
    isComplete: true,
    icon: <Layers className="size-5" />,
    color: 'emerald',
  },
  {
    stepNumber: '3',
    nameAr: 'الاختراق',
    descriptionAr: 'عمق اختراق القنبلة في التربة (المعادلات 13-19)',
    href: '/dashboard/step3-penetration',
    resultLabel: 'h_pr',
    resultValue: `${FINAL_LOCKED_RESULTS.h_pr.toFixed(2)} m`,
    isComplete: true,
    icon: <Target className="size-5" />,
    color: 'emerald',
  },
  {
    stepNumber: '5 سقف',
    nameAr: 'انفجار السقف',
    descriptionAr: 'أحمال الانفجار على السقف — الضغط التصميمي',
    href: '/dashboard/step5-roof-blast',
    resultLabel: 'Pp',
    resultValue: `${STEP5_ROOF.Pp.toFixed(3)} kg/cm²`,
    isComplete: true,
    icon: <ArrowDownFromLine className="size-5" />,
    color: 'emerald',
  },
  {
    stepNumber: '5 جدار',
    nameAr: 'انفجار الجدار',
    descriptionAr: 'أحمال الانفجار على الجدران — الضغط التصميمي',
    href: '/dashboard/step5-wall-blast',
    resultLabel: 'Pp',
    resultValue: `${STEP5_WALL.Pp.toFixed(3)} kg/cm²`,
    isComplete: true,
    icon: <ArrowRightLeft className="size-5" />,
    color: 'emerald',
  },
  {
    stepNumber: '7',
    nameAr: 'تصميم السقف',
    descriptionAr: 'المسار αm → ξ → h₀ → Hp = 70.46 cm',
    href: '/dashboard/step7-ceiling',
    resultLabel: 'Hp',
    resultValue: `${STEP7_CEILING.Hp_final.toFixed(2)} cm`,
    isComplete: true,
    icon: <Layers className="size-5" />,
    color: 'emerald',
  },
  {
    stepNumber: '8',
    nameAr: 'تصميم الجدران',
    descriptionAr: 'سماكة الجدار والأرضية والجدار الداخلي',
    href: '/dashboard/step8-wall',
    resultLabel: 'Hc',
    resultValue: `${STEP8_WALL.Hc_final.toFixed(2)} cm`,
    isComplete: true,
    icon: <Building2 className="size-5" />,
    color: 'emerald',
  },
  {
    stepNumber: '—',
    nameAr: 'الأطروحة والمقارنة',
    descriptionAr: 'مقارنة الأشكال الثلاثة: مستطيل / قوسي / دائري',
    href: '/dashboard/thesis-comparison',
    resultLabel: 'الشكل الموصى به',
    resultValue: 'مستطيل/قوسي/دائري',
    isComplete: true,
    icon: <BookOpen className="size-5" />,
    color: 'amber',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// حساب الشكل الموصى به
// ═══════════════════════════════════════════════════════════════════════

function getRecommendedGeometryLabel(): string {
  try {
    const pDesignMpaRoof = STEP5_ROOF.Pp / 10.197;
    const fcMpa = 20;
    const fyMpa = 300;
    const ap = 4;
    const bp = 5;

    const results = {
      RECTANGULAR: designConcreteSection({
        pDesignMpa: pDesignMpaRoof,
        geometryType: 'RECTANGULAR',
        tunnelSpanShort: ap,
        tunnelSpanLong: bp,
        fcMpa,
        fyMpa,
      }),
      CIRCULAR: designConcreteSection({
        pDesignMpa: pDesignMpaRoof * GEOMETRY_FACTORS.CIRCULAR.pressureReductionFactor,
        geometryType: 'CIRCULAR',
        tunnelSpanShort: ap,
        tunnelSpanLong: bp,
        fcMpa,
        fyMpa,
      }),
      ARCHED: designConcreteSection({
        pDesignMpa: pDesignMpaRoof * GEOMETRY_FACTORS.ARCHED.pressureReductionFactor,
        geometryType: 'ARCHED',
        tunnelSpanShort: ap,
        tunnelSpanLong: bp,
        fcMpa,
        fyMpa,
      }),
    };

    const report = compareGeometries(results);
    const map: Record<GeometryType, string> = {
      RECTANGULAR: 'مستطيل',
      CIRCULAR: 'دائري',
      ARCHED: 'قوسي',
    };
    return map[report.recommendedGeometry];
  } catch {
    return 'مستطيل/قوسي/دائري';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// بيانات النتائج النهائية
// ═══════════════════════════════════════════════════════════════════════

interface SummaryItem {
  label: string;
  symbol: string;
  value: string;
  unit: string;
  accent?: boolean;
}

const SUMMARY_RESULTS: SummaryItem[] = [
  { label: 'سماكة السقف', symbol: 'Hp', value: FINAL_LOCKED_RESULTS.Hp_final.toFixed(2), unit: 'cm', accent: true },
  { label: 'سماكة الجدار', symbol: 'Hc', value: FINAL_LOCKED_RESULTS.Hc_final.toFixed(2), unit: 'cm' },
  { label: 'سماكة الأساس', symbol: 'Hf', value: FINAL_LOCKED_RESULTS.Hf_final.toFixed(2), unit: 'cm' },
  { label: 'سماكة القبو', symbol: 'Hvct', value: FINAL_LOCKED_RESULTS.Hvct_final.toFixed(0), unit: 'cm' },
  { label: 'عمق الاختراق', symbol: 'h_pr', value: FINAL_LOCKED_RESULTS.h_pr.toFixed(2), unit: 'm' },
  { label: 'الشحنة الفعالة', symbol: 'C_ef', value: FINAL_LOCKED_RESULTS.C_ef.toFixed(2), unit: 'kg' },
];

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const recommendedShape = React.useMemo(() => getRecommendedGeometryLabel(), []);

  return (
    <div dir="rtl" className="space-y-8">
      {/* ─── 1. الرأس ─── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
            لوحة التحكم — المدقق الديناميكي الموحد
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            عرض ملخص لخط الحساب والنتائج النهائية المرجعية — BMK-02 (MK83 + تربة متوسطة)
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs px-3 py-1"
        >
          V3.1
        </Badge>
      </div>

      {/* ─── 2. بطاقات خط الحساب ─── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Layers className="size-5 text-emerald-400" />
          خط الحساب — من المدخلات إلى القرار الإنشائي
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <Card
              key={step.href}
              className={`bg-slate-900/80 border-slate-800/60 hover:border-emerald-500/30 transition-colors group ${
                step.color === 'amber' ? 'border-amber-500/20' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono ${
                        step.color === 'amber'
                          ? 'border-amber-700 text-amber-300 bg-amber-900/30'
                          : 'border-slate-700 text-slate-300 bg-slate-800/60'
                      }`}
                    >
                      {step.stepNumber}
                    </Badge>
                    <CardTitle className="text-base text-slate-100">
                      {step.nameAr}
                    </CardTitle>
                  </div>
                  {step.isComplete ? (
                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="size-5 text-amber-400 shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.descriptionAr}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-slate-500 font-mono">
                      {step.resultLabel} =
                    </span>
                    <span className="text-sm font-semibold text-emerald-400 font-mono">
                      {step.resultValue}
                    </span>
                  </div>
                  <Link href={step.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1 text-xs"
                    >
                      فتح
                      <ArrowLeft className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── 3. النتائج النهائية ─── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Target className="size-5 text-emerald-400" />
          النتائج النهائية المقفلة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {SUMMARY_RESULTS.map((item) => (
            <Card
              key={item.symbol}
              className={`bg-slate-900/80 border-slate-800/60 text-center ${
                item.accent ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : ''
              }`}
            >
              <CardContent className="pt-4 pb-4 px-3 space-y-1">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`font-bold font-mono ${item.accent ? 'text-2xl text-emerald-400' : 'text-xl text-emerald-400/80'}`}>
                  {item.value}
                </p>
                <p className="text-xs text-slate-400">
                  <span className="font-mono">{item.symbol}</span> ({item.unit})
                </p>
              </CardContent>
            </Card>
          ))}
          {/* بطاقة الشكل الموصى به */}
          <Card className="bg-slate-900/80 border-amber-500/20 text-center">
            <CardContent className="pt-4 pb-4 px-3 space-y-1">
              <p className="text-xs text-slate-500">الشكل الموصى به</p>
              <p className="text-xl font-bold text-amber-400">
                {recommendedShape}
              </p>
              <p className="text-xs text-slate-400">مستطيل/قوسي/دائري</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── 4. تدفق البيانات ─── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Zap className="size-5 text-emerald-400" />
          تدفق البيانات بين الخطوات
        </h2>
        <Card className="bg-slate-900/80 border-slate-800/60 p-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/50">
              <Layers className="size-3.5 text-emerald-400" />
              <span className="text-slate-300">خطوة 2</span>
              <span className="text-emerald-400 font-mono text-xs">(C_ef)</span>
            </div>
            <ArrowLeft className="size-4 text-slate-600" />
            <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/50">
              <Target className="size-3.5 text-emerald-400" />
              <span className="text-slate-300">خطوة 3</span>
              <span className="text-emerald-400 font-mono text-xs">(h_pr, R_actual)</span>
            </div>
            <ArrowLeft className="size-4 text-slate-600" />
            <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-2 rounded-lg border border-emerald-500/30">
              <Zap className="size-3.5 text-emerald-400" />
              <span className="text-slate-300">خطوة 5</span>
              <span className="text-emerald-400 font-mono text-xs">(Pp, ω)</span>
            </div>
            <ArrowLeft className="size-4 text-slate-600" />
            <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-2 rounded-lg border border-emerald-500/30">
              <ArrowDownFromLine className="size-3.5 text-emerald-400" />
              <span className="text-slate-300">خطوة 7+8</span>
              <span className="text-emerald-400 font-mono text-xs">(Hp, Hc)</span>
            </div>
            <ArrowLeft className="size-4 text-slate-600" />
            <div className="flex items-center gap-1 bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-500/30">
              <BookOpen className="size-3.5 text-amber-400" />
              <span className="text-amber-300">المقارنة</span>
              <span className="text-amber-400 font-mono text-xs">(الشكل الأفضل)</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ─── 5. التنبيهات ─── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-400" />
          التنبيهات والملاحظات
        </h2>
        <div className="space-y-2">
          <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
            <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-500" />
            <span>جميع القيم معروضة وفق الحالة المرجعية BMK-02 (MK83 + تربة متوسطة) — مقفلة ولا تُعاد كتابتها</span>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            <AlertTriangle className="size-4 mt-0.5 shrink-0 text-amber-400" />
            <span>الشحنة الفعالة C_ef = 334.77 kg — K₁ = 1.639 (Tritonal 80-20) — تأكد من تطابق بيانات السلاح مع المكتبة</span>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
            <Shield className="size-4 mt-0.5 shrink-0 text-emerald-500" />
            <span>سماكة القبو Hvct = 30 cm هي قيمة دنيا وفق الكود السوري 2024 | مسار التصميم: αm → ξ → h₀ → Hp = h₀ × 1.05</span>
          </div>
        </div>
      </section>
    </div>
  );
}
