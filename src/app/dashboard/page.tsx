// ═══════════════════════════════════════════════════════════════════════
// صفحة لوحة التحكم الرئيسية — Dashboard Overview V3.1 (ديناميكي)
// منصة المدقق الديناميكي الموحد V3.1
// صفحة ملخص تنقلية مع نتائج ديناميكية من المحرك
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import Link from 'next/link';
import { useEngine } from '@/lib/engine/engine-context';
import { WEAPONS, SOILS } from '@/lib/engine/constants';
import type { GeometryType } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
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
  Calculator,
  Loader2,
} from 'lucide-react';

function fmt(v: number, d = 2): string { return isFinite(v) ? v.toFixed(d) : '—'; }

const GEO_LABELS: Record<GeometryType, string> = {
  RECTANGULAR: 'مستطيل',
  CIRCULAR: 'دائري',
  ARCHED: 'قوسي',
};

export default function DashboardPage() {
  const { engineOutput, hasComputed, isComputing, userInput, runComputation } = useEngine();

  const selectedWeapon = WEAPONS.find(w => w.id === userInput.weaponId);
  const selectedSoil = SOILS.find(s => s.code === userInput.soilTypeCode);

  // بناء بطاقات الخطوات
  const steps = hasComputed && engineOutput ? buildStepsFromOutput(engineOutput) : buildStepsEmpty();

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">لوحة التحكم</h1>
          <p className="text-xs text-slate-500">منصة تصميم المنشآت المقاومة للانفجار</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/step2-inputs">
            <Button variant="outline" size="sm" className="text-slate-400 border-slate-700 hover:text-slate-200">
              <Layers className="w-3.5 h-3.5 ml-1.5" />
              تعديل المدخلات
            </Button>
          </Link>
          <Button
            onClick={runComputation}
            disabled={isComputing}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
          >
            {isComputing ? (
              <><Loader2 className="w-4 h-4 ml-1.5 animate-spin" />جاري الحساب...</>
            ) : (
              <><Zap className="w-4 h-4 ml-1.5" />احسب الآن</>
            )}
          </Button>
        </div>
      </div>

      {/* ملخص المدخلات */}
      <Card className="border-slate-800/60 bg-slate-950/80">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <InputChip label="القنبلة" value={selectedWeapon?.nameAr ?? '—'} />
            <InputChip label="التربة" value={selectedSoil?.nameAr ?? '—'} />
            <InputChip label="السرعة" value={`${userInput.impactVelocity} m/s`} />
            <InputChip label="العمق" value={`${userInput.facilityDepth} m`} />
            <InputChip label="الخرسانة" value={userInput.concreteGrade} />
            <InputChip label="المجاز" value={`${userInput.shortSpan}×${userInput.longSpan} m`} />
          </div>
        </CardContent>
      </Card>

      {/* حالة الحساب */}
      {!hasComputed && (
        <Card className="border-amber-500/30 bg-amber-950/20">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-300 font-bold">لم يتم الحساب بعد</p>
              <p className="text-slate-500 text-sm">أدخل معطيات المشروع في صفحة المدخلات ثم اضغط &quot;احسب&quot;</p>
            </div>
            <Link href="/dashboard/step2-inputs" className="mr-auto">
              <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                <ArrowRight className="w-4 h-4 ml-1.5" />
                صفحة المدخلات
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {hasComputed && engineOutput && (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardContent className="flex items-center gap-4 py-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-emerald-300 font-bold">تم الحساب بنجاح</p>
              <p className="text-slate-500 text-sm">الحالة: {engineOutput.status === 'SUCCESS' ? 'نجاح' : engineOutput.status === 'PARTIAL' ? 'جزئي' : 'فشل'}</p>
            </div>
            {engineOutput.warnings.length > 0 && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 mr-auto">
                <AlertTriangle className="w-3 h-3 ml-1" />
                {engineOutput.warnings.length} تحذير
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* بطاقات الخطوات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => (
          <Link key={step.href} href={step.href}>
            <Card className={`border-${step.color}-500/20 bg-${step.color}-950/10 hover:bg-${step.color}-950/30 transition-colors cursor-pointer h-full`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-${step.color}-500/10 flex items-center justify-center`}>
                    {step.icon}
                  </div>
                  <Badge variant="outline" className={`text-${step.color}-400 border-${step.color}-500/30 text-[10px]`}>
                    خطوة {step.stepNumber}
                  </Badge>
                </div>
                <h3 className="text-slate-200 font-bold text-sm mb-1">{step.nameAr}</h3>
                <p className="text-slate-500 text-xs mb-2">{step.descriptionAr}</p>
                {step.resultValue && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-[10px]">{step.resultLabel}</span>
                    <span className="font-mono text-xs text-slate-300">{step.resultValue}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── بناء بطاقات الخطوات من مخرجات المحرك ───

interface StepCardData {
  stepNumber: string;
  nameAr: string;
  descriptionAr: string;
  href: string;
  resultLabel: string;
  resultValue: string;
  icon: React.ReactNode;
  color: string;
}

function buildStepsFromOutput(output: import('@/lib/engine/orchestrator').EngineOutput): StepCardData[] {
  const pen = output.intermediates.penetration;
  const blast = output.intermediates.blast;
  const { structural, comparison } = output;
  const rec = comparison.recommendedGeometry;

  return [
    {
      stepNumber: '2',
      nameAr: 'المدخلات',
      descriptionAr: 'بيانات السلاح والتربة والأبعاد',
      href: '/dashboard/step2-inputs',
      resultLabel: 'تم الإدخال',
      resultValue: '✓',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      color: 'cyan',
    },
    {
      stepNumber: '3',
      nameAr: 'الاختراق',
      descriptionAr: 'عمق اختراق القنبلة في التربة',
      href: '/dashboard/step3-penetration',
      resultLabel: 'hпр',
      resultValue: `${fmt(pen.penetrationDepth)} m`,
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      color: 'emerald',
    },
    {
      stepNumber: '5 سقف',
      nameAr: 'انفجار السقف',
      descriptionAr: 'أحمال الانفجار على السقف',
      href: '/dashboard/step5-roof-blast',
      resultLabel: 'P_design',
      resultValue: `${fmt(blast.pDesignMpa, 3)} MPa`,
      icon: <ArrowDownFromLine className="w-4 h-4 text-rose-400" />,
      color: 'rose',
    },
    {
      stepNumber: '5 جدار',
      nameAr: 'انفجار الجدران',
      descriptionAr: 'أحمال الانفجار على الجدران',
      href: '/dashboard/step5-wall-blast',
      resultLabel: 'P_design',
      resultValue: `${fmt(blast.pDesignMpa, 3)} MPa`,
      icon: <ArrowRightLeft className="w-4 h-4 text-orange-400" />,
      color: 'orange',
    },
    {
      stepNumber: '7',
      nameAr: 'تصميم السقف',
      descriptionAr: 'سماكة السقف والتسليح',
      href: '/dashboard/step7-ceiling',
      resultLabel: 'Hp',
      resultValue: `${fmt(structural[rec].requiredThicknessMeters * 100, 1)} cm`,
      icon: <Shield className="w-4 h-4 text-blue-400" />,
      color: 'blue',
    },
    {
      stepNumber: '8',
      nameAr: 'تصميم الجدران',
      descriptionAr: 'سماكة الجدران والتسليح',
      href: '/dashboard/step8-wall',
      resultLabel: 'Hct',
      resultValue: `${fmt(structural[rec].requiredThicknessMeters * 100, 1)} cm`,
      icon: <Building2 className="w-4 h-4 text-amber-400" />,
      color: 'amber',
    },
    {
      stepNumber: 'مقارنة',
      nameAr: 'المقارنة بين الأشكال',
      descriptionAr: 'مقارنة المستطيل/الدائري/القوسي',
      href: '/dashboard/thesis-comparison',
      resultLabel: 'الموصى',
      resultValue: GEO_LABELS[rec],
      icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
      color: 'indigo',
    },
  ];
}

function buildStepsEmpty(): StepCardData[] {
  return [
    {
      stepNumber: '2', nameAr: 'المدخلات', descriptionAr: 'بيانات السلاح والتربة والأبعاد',
      href: '/dashboard/step2-inputs', resultLabel: '', resultValue: 'أدخل البيانات ←',
      icon: <Layers className="w-4 h-4 text-cyan-400" />, color: 'cyan',
    },
    {
      stepNumber: '3', nameAr: 'الاختراق', descriptionAr: 'عمق اختراق القنبلة في التربة',
      href: '/dashboard/step3-penetration', resultLabel: '', resultValue: '—',
      icon: <Target className="w-4 h-4 text-emerald-400" />, color: 'emerald',
    },
    {
      stepNumber: '5 سقف', nameAr: 'انفجار السقف', descriptionAr: 'أحمال الانفجار على السقف',
      href: '/dashboard/step5-roof-blast', resultLabel: '', resultValue: '—',
      icon: <ArrowDownFromLine className="w-4 h-4 text-rose-400" />, color: 'rose',
    },
    {
      stepNumber: '5 جدار', nameAr: 'انفجار الجدران', descriptionAr: 'أحمال الانفجار على الجدران',
      href: '/dashboard/step5-wall-blast', resultLabel: '', resultValue: '—',
      icon: <ArrowRightLeft className="w-4 h-4 text-orange-400" />, color: 'orange',
    },
    {
      stepNumber: '7', nameAr: 'تصميم السقف', descriptionAr: 'سماكة السقف والتسليح',
      href: '/dashboard/step7-ceiling', resultLabel: '', resultValue: '—',
      icon: <Shield className="w-4 h-4 text-blue-400" />, color: 'blue',
    },
    {
      stepNumber: '8', nameAr: 'تصميم الجدران', descriptionAr: 'سماكة الجدران والتسليح',
      href: '/dashboard/step8-wall', resultLabel: '', resultValue: '—',
      icon: <Building2 className="w-4 h-4 text-amber-400" />, color: 'amber',
    },
    {
      stepNumber: 'مقارنة', nameAr: 'المقارنة بين الأشكال', descriptionAr: 'مقارنة المستطيل/الدائري/القوسي',
      href: '/dashboard/thesis-comparison', resultLabel: '', resultValue: '—',
      icon: <BookOpen className="w-4 h-4 text-indigo-400" />, color: 'indigo',
    },
  ];
}

// ─── مكون مساعد ───

function InputChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 px-3 py-1.5 text-center">
      <p className="text-[10px] text-slate-600">{label}</p>
      <p className="text-xs font-mono text-slate-300">{value}</p>
    </div>
  );
}
