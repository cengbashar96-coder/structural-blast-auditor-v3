// ═══════════════════════════════════════════════════════════════════════
// الخطوة 3 — حسابات الاختراق
// منصة المدقق الديناميكي الموحد V3.0
// صفحة تفاعلية تعرض خطوات الحساب بالتفصيل مع المقارنة المرجعية BMK-02
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  calculatePenetration,
  calcLambda1,
  calcLambda2,
  calcN,
  calcCEffective,
  calcPenetrationDepth,
  calcTsuPenetrating,
  calcTsuExplosive,
} from '@/lib/engine/penetration-core';
import {
  STEP3_PENETRATION,
  STEP2_INPUTS,
  STEP2_LOOKUPS,
} from '@/lib/constants/reference-data';
import { WEAPONS, getWeaponById, getSoilByCode, getExplosiveK1 } from '@/lib/engine/constants';
import type { PenetrationOutput } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';

import {
  Target,
  ArrowDownFromLine,
  Atom,
  Ruler,
  Lock,
  Calculator,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// أنواع مساعدة
// ═══════════════════════════════════════════════════════════════════════

interface StepCalcResult {
  symbol: string;
  labelAr: string;
  formula: string;
  computed: number;
  reference: number;
  unit: string;
  deviationPct: number;
}

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function fmt(value: number, decimals: number = 4): string {
  if (!isFinite(value)) return '—';
  return value.toFixed(decimals);
}

function calcDeviation(computed: number, reference: number): number {
  if (reference === 0) return computed === 0 ? 0 : Infinity;
  return (Math.abs(computed - reference) / Math.abs(reference)) * 100;
}

function getDeviationColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 1) return 'text-emerald-400';
  if (abs < 5) return 'text-amber-400';
  return 'text-red-400';
}

function getDeviationBg(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 1) return 'bg-emerald-500/10 border-emerald-500/20';
  if (abs < 5) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function getDeviationIcon(pct: number) {
  const abs = Math.abs(pct);
  if (abs < 1) return <CheckCircle2 className="size-3.5 text-emerald-400" />;
  if (abs < 5) return <AlertTriangle className="size-3.5 text-amber-400" />;
  return <XCircle className="size-3.5 text-red-400" />;
}

// ═══════════════════════════════════════════════════════════════════════
// حسابات خطوة بخطوة
// ═══════════════════════════════════════════════════════════════════════

function computeStepByStep(): StepCalcResult[] {
  // بيانات السلاح MK83
  const weapon = getWeaponById('W_MK83');
  const soil = getSoilByCode('MEDIUM_SOIL');
  const K1 = getExplosiveK1(weapon.explosive);

  const { P, V, alpha, dk, C } = STEP2_INPUTS;
  const { K1: K1Ref, kpr_g } = STEP2_LOOKUPS;
  const lhdRatio = weapon.lhdRatio;
  const angleDeg = alpha;

  // λ₁ = 0.5 + 0.4 × (lhd/d)^0.667
  const lambda1 = calcLambda1(lhdRatio);

  // λ₂ = 2.8 × d^0.333 − 1.3 × d^0.5
  const lambda2 = calcLambda2(dk);

  // n = 3.5 − (lhd/d)
  const nExp = calcN(lhdRatio);

  // C_ef = 0.95 × K1 × C
  const cEf = calcCEffective(K1Ref, C);

  // τsu = 0.5 × lk × cos((α + nα)/2)
  const lk = STEP2_INPUTS.lk;
  const tsu = calcTsuPenetrating(lk, angleDeg, nExp);

  // h_pr = λ₁ × λ₂ × Kpr × (P/d²) × V × cos(α)
  const alphaRad = (angleDeg * Math.PI) / 180;
  const kp = kpr_g * 1e6; // تحويل من ×1e-6
  const hPr = calcPenetrationDepth(
    lambda1, lambda2, soil.kp,
    P, dk, V, angleDeg
  );

  // h_z = max(h_pr − τsu, 0)
  const hz = Math.max(hPr - tsu, 0);

  // R_actual = R̄ × (C_ef)^0.333
  const RBar = STEP2_LOOKUPS.R_bar;
  const rActual = RBar * Math.cbrt(cEf);

  // Zp = 1.5 × kpr_g × (C_ef)^0.333
  const zp = 1.5 * kpr_g * 1e6 * Math.cbrt(cEf);

  return [
    {
      symbol: 'λ₁',
      labelAr: 'معامل تأثير شكل الرأس الحربي',
      formula: `0.5 + 0.4 × (${lhdRatio})^0.667`,
      computed: lambda1,
      reference: STEP3_PENETRATION.lambda1,
      unit: '—',
      deviationPct: calcDeviation(lambda1, STEP3_PENETRATION.lambda1),
    },
    {
      symbol: 'λ₂',
      labelAr: 'معامل تأثير القطر',
      formula: `2.8 × ${dk}^0.333 − 1.3 × ${dk}^0.5`,
      computed: lambda2,
      reference: STEP3_PENETRATION.lambda2,
      unit: '—',
      deviationPct: calcDeviation(lambda2, STEP3_PENETRATION.lambda2),
    },
    {
      symbol: 'n',
      labelAr: 'أُس التأثير',
      formula: `3.5 − ${lhdRatio}`,
      computed: nExp,
      reference: STEP3_PENETRATION.n_exp,
      unit: '—',
      deviationPct: calcDeviation(nExp, STEP3_PENETRATION.n_exp),
    },
    {
      symbol: 'C_ef',
      labelAr: 'الشحنة الفعالة',
      formula: `0.95 × ${K1Ref} × ${C}`,
      computed: cEf,
      reference: STEP3_PENETRATION.C_ef,
      unit: 'kg',
      deviationPct: calcDeviation(cEf, STEP3_PENETRATION.C_ef),
    },
    {
      symbol: 'τsu',
      labelAr: 'معامل زاوية الاختراق',
      formula: `0.5 × ${lk} × cos((${angleDeg} + ${nExp}×${angleDeg})/2)`,
      computed: tsu,
      reference: STEP3_PENETRATION.tsu,
      unit: 'm',
      deviationPct: calcDeviation(tsu, STEP3_PENETRATION.tsu),
    },
    {
      symbol: 'h_pr',
      labelAr: 'عمق الاختراق',
      formula: `λ₁ × λ₂ × Kpr × (P/d²) × V × cos(α)`,
      computed: hPr,
      reference: STEP3_PENETRATION.h_pr,
      unit: 'm',
      deviationPct: calcDeviation(hPr, STEP3_PENETRATION.h_pr),
    },
    {
      symbol: 'h_z',
      labelAr: 'العمق الصافي',
      formula: `max(h_pr − τsu, 0)`,
      computed: hz,
      reference: STEP3_PENETRATION.h_z,
      unit: 'm',
      deviationPct: calcDeviation(hz, STEP3_PENETRATION.h_z),
    },
    {
      symbol: 'R_actual',
      labelAr: 'المسافة الفعلية',
      formula: `R̄ × (C_ef)^0.333`,
      computed: rActual,
      reference: STEP3_PENETRATION.R_actual,
      unit: 'm',
      deviationPct: calcDeviation(rActual, STEP3_PENETRATION.R_actual),
    },
    {
      symbol: 'Zp',
      labelAr: 'البعد المختزل',
      formula: `1.5 × kpr_g × (C_ef)^0.333`,
      computed: zp,
      reference: STEP3_PENETRATION.Zp,
      unit: '—',
      deviationPct: calcDeviation(zp, STEP3_PENETRATION.Zp),
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function Step3PenetrationPage() {
  // ─── حسابات المحرك — تُنفذ مرة واحدة عند التحميل ───
  const engineOutput = useMemo<PenetrationOutput | null>(() => {
    try {
      const input = {
        weaponId: 'W_MK83',
        impactVelocity: STEP2_INPUTS.V,
        soilTypeCode: 'MEDIUM_SOIL' as const,
        impactAngleDeg: STEP2_INPUTS.alpha,
      };
      return calculatePenetration(input);
    } catch (err) {
      console.error('Penetration engine error:', err);
      return null;
    }
  }, []);

  const stepCalcs = useMemo<StepCalcResult[]>(() => {
    try {
      return computeStepByStep();
    } catch {
      return [];
    }
  }, []);

  // ─── ملخص الانحرافات ───
  const deviationSummary = useMemo(() => {
    if (stepCalcs.length === 0) return null;
    const maxDev = Math.max(...stepCalcs.map((d) => d.deviationPct));
    const avgDev = stepCalcs.reduce((sum, d) => sum + d.deviationPct, 0) / stepCalcs.length;
    const passing = stepCalcs.filter((d) => d.deviationPct < 5).length;
    return { maxDev, avgDev, passing, total: stepCalcs.length };
  }, [stepCalcs]);

  // ─── المدخلات المقفلة من الخطوة 2 ───
  const lockedInputs = [
    { symbol: 'P', label: 'وزن القنبلة', value: STEP2_INPUTS.P, unit: 'kg' },
    { symbol: 'V', label: 'سرعة الاصطدام', value: STEP2_INPUTS.V, unit: 'm/s' },
    { symbol: 'α', label: 'زاوية الاصطدام', value: STEP2_INPUTS.alpha, unit: '°' },
    { symbol: 'dk', label: 'قطر القنبلة', value: STEP2_INPUTS.dk, unit: 'm' },
    { symbol: 'C_ef', label: 'معامل المتفجرات K₁', value: STEP2_LOOKUPS.K1, unit: '—' },
    { symbol: 'kpr_g', label: 'معامل اختراق التربة', value: STEP2_LOOKUPS.kpr_g, unit: '—' },
    { symbol: 'نوع التربة', label: 'MEDIUM_SOIL', value: 'طين مع حجارة', unit: '' },
  ];

  // ─── النتائج الرئيسية الثلاث ───
  const mainResults = [
    {
      label: 'عمق الاختراق',
      symbol: 'h_pr',
      value: STEP3_PENETRATION.h_pr,
      unit: 'm',
      color: 'text-red-400',
      bgGlow: 'from-red-500/20 to-red-600/5',
      borderColor: 'border-red-500/30',
      dotColor: 'bg-red-500',
      icon: ArrowDownFromLine,
    },
    {
      label: 'الشحنة الفعالة',
      symbol: 'C_ef',
      value: STEP3_PENETRATION.C_ef,
      unit: 'kg',
      color: 'text-amber-400',
      bgGlow: 'from-amber-500/20 to-amber-600/5',
      borderColor: 'border-amber-500/30',
      dotColor: 'bg-amber-500',
      icon: Atom,
    },
    {
      label: 'المسافة الفعلية',
      symbol: 'R_actual',
      value: STEP3_PENETRATION.R_actual,
      unit: 'm',
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/30',
      dotColor: 'bg-emerald-500',
      icon: Ruler,
    },
  ];

  return (
    <div
      className="space-y-6"
      dir="rtl"
      role="region"
      aria-labelledby="step3-main-heading"
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* الرأس الرئيسي                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-4 gap-4">
        <div>
          <h1
            id="step3-main-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2"
          >
            <Target className="size-5 text-emerald-400" />
            الخطوة 3 — حسابات الاختراق
            <Badge className="bg-emerald-600/80 text-white text-[10px] px-2 py-0.5 mr-2">
              إكسيل 2
            </Badge>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            حساب عمق اختراق القذيفة في التربة قبل الانفجار
          </p>
        </div>
        {deviationSummary && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`font-mono text-[10px] ${
                deviationSummary.maxDev < 5
                  ? 'border-emerald-500/30 text-emerald-400'
                  : 'border-red-500/30 text-red-400'
              }`}
            >
              أقصى انحراف: {fmt(deviationSummary.maxDev, 2)}%
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-400 font-mono text-[10px]"
            >
              {deviationSummary.passing}/{deviationSummary.total} ضمن التسامح
            </Badge>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* المدخلات المقفلة من الخطوة 2                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Lock className="size-4 text-slate-500" />
            المدخلات المقفلة — من الخطوة 2
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px] mr-2"
            >
              READ-ONLY
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {lockedInputs.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/40"
              >
                <div className="text-[10px] text-slate-500 mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-slate-200 truncate">
                  {typeof item.value === 'number'
                    ? item.value < 0.001
                      ? item.value.toExponential(1)
                      : fmt(item.value, item.value >= 100 ? 2 : 4)
                    : item.value}
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                  {item.symbol} {item.unit && `(${item.unit})`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* عرض الحسابات خطوة بخطوة                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Calculator className="size-4 text-emerald-400" />
          الحسابات التفصيلية — خطوة بخطوة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stepCalcs.map((step, idx) => (
            <Card
              key={step.symbol}
              className={`bg-slate-900 border-slate-800 overflow-hidden`}
            >
              {/* شريط علوي ملون حسب الانحراف */}
              <div
                className={`h-0.5 ${
                  step.deviationPct < 1
                    ? 'bg-emerald-500'
                    : step.deviationPct < 5
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
              />
              <CardContent className="p-4">
                {/* رمز واسم المعامل */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 font-mono text-sm px-2 py-0.5"
                    >
                      {step.symbol}
                    </Badge>
                    <span className="text-xs text-slate-400">{step.labelAr}</span>
                  </div>
                  {getDeviationIcon(step.deviationPct)}
                </div>

                {/* المعادلة */}
                <div className="bg-slate-800/60 rounded px-3 py-2 mb-3 border border-slate-700/30">
                  <code className="text-[11px] text-slate-300 font-mono leading-relaxed">
                    {step.formula}
                  </code>
                </div>

                {/* القيمة المحسوبة */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[10px] text-slate-500">القيمة:</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {fmt(step.computed, 4)}
                  </span>
                  {step.unit !== '—' && (
                    <span className="text-[10px] text-slate-500">{step.unit}</span>
                  )}
                </div>

                {/* القيمة المرجعية BMK-02 والانحراف */}
                <Separator className="bg-slate-700/40 my-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">BMK-02:</span>
                    <span className="text-xs font-mono text-slate-300">
                      {fmt(step.reference, 4)}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${getDeviationBg(
                      step.deviationPct
                    )}`}
                  >
                    <span className={getDeviationColor(step.deviationPct)}>
                      {fmt(step.deviationPct, 2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* النتائج الرئيسية الثلاث                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="size-4 text-emerald-400" />
          النتائج الرئيسية
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mainResults.map((result) => {
            const IconComp = result.icon;
            return (
              <Card
                key={result.symbol}
                className={`bg-slate-900 ${result.borderColor} border relative overflow-hidden`}
              >
                {/* تدرج لوني خلفي */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${result.bgGlow} opacity-50 pointer-events-none`}
                />
                <CardContent className="p-5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`size-2.5 rounded-full ${result.dotColor}`} />
                      <span className="text-xs text-slate-400">{result.label}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-slate-500 font-mono text-[10px] px-1.5 py-0"
                    >
                      {result.symbol}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <IconComp className={`size-5 ${result.color} opacity-60`} />
                    <span className={`text-3xl font-bold font-mono ${result.color}`}>
                      {fmt(result.value, 2)}
                    </span>
                    <span className="text-sm text-slate-500">{result.unit}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* جدول المقارنة: المحسوب مقابل المرجع                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Target className="size-4 text-slate-400" />
            جدول المقارنة — المحسوب مقابل BMK-02
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-700/40 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    الرمز
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    الوصف
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold text-left font-mono">
                    القيمة المحسوبة
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold text-left font-mono">
                    المرجع BMK-02
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold text-center">
                    الانحراف %
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold text-center">
                    الحالة
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stepCalcs.map((step, idx) => (
                  <TableRow
                    key={step.symbol}
                    className={`border-b border-slate-800/60 ${
                      idx % 2 === 0 ? 'bg-slate-800/20' : ''
                    } hover:bg-slate-800/40`}
                  >
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 font-mono text-[11px] px-1.5 py-0"
                      >
                        {step.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-medium py-2.5">
                      {step.labelAr}
                    </TableCell>
                    <TableCell className="text-xs text-left font-mono text-emerald-300 py-2.5">
                      {fmt(step.computed, 6)}
                    </TableCell>
                    <TableCell className="text-xs text-left font-mono text-slate-300 py-2.5">
                      {fmt(step.reference, 6)}
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      <span
                        className={`text-xs font-mono font-semibold ${getDeviationColor(
                          step.deviationPct
                        )}`}
                      >
                        {fmt(step.deviationPct, 2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      <div className="flex justify-center">
                        {getDeviationIcon(step.deviationPct)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* التنقل بين الخطوات                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Separator className="bg-slate-800/60" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-4">
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 gap-2 w-full sm:w-auto"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard/penetration';
            }
          }}
        >
          <ChevronRight className="size-4" />
          ← المدخلات
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard/blast-loads';
            }
          }}
        >
          التالي ← انفجار السقف
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
