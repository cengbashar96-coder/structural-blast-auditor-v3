// ═══════════════════════════════════════════════════════════════════════
// الخطوة 3 — حسابات الاختراق
// منصة المدقق الديناميكي الموحد V3.1
// صفحة تفاعلية تعرض حسابات عمق الاختراق (المعادلات 13-19)
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { STEP3_PENETRATION } from '@/lib/constants/reference-data';

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

import {
  Target,
  ArrowDown,
  Lock,
  Calculator,
  AlertTriangle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function fmt(value: number, decimals: number = 4): string {
  if (!isFinite(value)) return '—';
  return value.toFixed(decimals);
}

// ═══════════════════════════════════════════════════════════════════════
// بيانات المعاملات الوسيطة
// ═══════════════════════════════════════════════════════════════════════

interface CoefficientRow {
  symbol: string;
  labelAr: string;
  equation: string;
  value: number;
  unit: string;
}

const intermediateCoefficients: CoefficientRow[] = [
  {
    symbol: 'λ₁',
    labelAr: 'معامل شكل الرأس',
    equation: 'Eq.14',
    value: STEP3_PENETRATION.lambda1,
    unit: '—',
  },
  {
    symbol: 'λ₂',
    labelAr: 'معامل تأثير القطر',
    equation: 'Eq.15',
    value: STEP3_PENETRATION.lambda2,
    unit: '—',
  },
  {
    symbol: 'n',
    labelAr: 'أُس التأثير',
    equation: 'Eq.16',
    value: STEP3_PENETRATION.n_exp,
    unit: '—',
  },
  {
    symbol: 'C_ef',
    labelAr: 'الشحنة الفعالة',
    equation: 'Eq.19',
    value: STEP3_PENETRATION.C_ef,
    unit: 'kg',
  },
  {
    symbol: 'τ',
    labelAr: 'معامل زاوية الاختراق',
    equation: 'Eq.17',
    value: STEP3_PENETRATION.tsu,
    unit: 'm',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// بيانات نتائج الاختراق
// ═══════════════════════════════════════════════════════════════════════

interface PenetrationResult {
  symbol: string;
  labelAr: string;
  value: number;
  unit: string;
  isKeyOutput?: boolean;
}

const penetrationResults: PenetrationResult[] = [
  {
    symbol: 'h_pr',
    labelAr: 'عمق الاختراق المصحح',
    value: STEP3_PENETRATION.h_pr,
    unit: 'm',
    isKeyOutput: true,
  },
  {
    symbol: 'h_z',
    labelAr: 'العمق الصافي',
    value: STEP3_PENETRATION.h_z,
    unit: 'm',
  },
  {
    symbol: 'h_z̄',
    labelAr: 'العمق المكافئ المختزل',
    value: STEP3_PENETRATION.h_z_bar,
    unit: '—',
  },
  {
    symbol: 'R_actual',
    labelAr: 'البعد الشعاعي الفعلي',
    value: STEP3_PENETRATION.R_actual,
    unit: 'm',
  },
  {
    symbol: 'Zp',
    labelAr: 'البعد المختزل',
    value: STEP3_PENETRATION.Zp,
    unit: '—',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// بيانات التدفق
// ═══════════════════════════════════════════════════════════════════════

const flowSteps = [
  { symbol: 'λ₁, λ₂', label: 'المعاملات' },
  { symbol: 'C_ef', label: 'الشحنة الفعالة' },
  { symbol: 'h_pr', label: 'عمق الاختراق' },
  { symbol: 'h_z', label: 'العمق الصافي' },
  { symbol: 'R_actual', label: 'البعد الشعاعي' },
  { symbol: 'Zp', label: 'البعد المختزل' },
];

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function Step3PenetrationPage() {
  return (
    <div
      className="space-y-8"
      dir="rtl"
      role="region"
      aria-labelledby="step3-main-heading"
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* الرأس الرئيسي                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-800/60 pb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Target className="size-5 text-emerald-400" />
          </div>
          <div>
            <h1
              id="step3-main-heading"
              className="text-xl font-bold text-slate-100 flex items-center gap-2"
            >
              الخطوة 3: حسابات الاختراق
              <Badge className="bg-emerald-600/80 text-white text-[10px] px-2 py-0.5">
                V3.1
              </Badge>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              حسابات عمق اختراق القذيفة في التربة قبل الانفجار — المعادلات 13 إلى 19
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* القسم أ — المعاملات الوسيطة                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="coeff-heading">
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle
              id="coeff-heading"
              className="text-base font-semibold text-slate-200 flex items-center gap-2"
            >
              <Calculator className="size-4 text-emerald-400" />
              المعاملات الوسيطة
              <Badge
                variant="outline"
                className="border-slate-700 text-slate-500 text-[10px] mr-2"
              >
                Eq. 14-19
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-700/40 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs font-semibold w-20">
                      الرمز
                    </TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold">
                      الوصف
                    </TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold w-20 text-center">
                      المعادلة
                    </TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold w-32 text-left font-mono">
                      القيمة
                    </TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold w-16 text-center">
                      الوحدة
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intermediateCoefficients.map((row, idx) => (
                    <TableRow
                      key={row.symbol}
                      className={`border-b border-slate-800/60 ${
                        idx % 2 === 0 ? 'bg-slate-800/20' : ''
                      } hover:bg-slate-800/40`}
                    >
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 font-mono text-xs px-2 py-0.5"
                        >
                          {row.symbol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-300 font-medium py-3">
                        {row.labelAr}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className="text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-0.5 rounded">
                          {row.equation}
                        </span>
                      </TableCell>
                      <TableCell className="text-left font-mono text-emerald-400 font-semibold text-sm py-3">
                        {fmt(row.value, 4)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-500 py-3">
                        {row.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* القسم ب — نتائج الاختراق                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="results-heading">
        <div className="flex items-center gap-2 mb-4">
          <Target className="size-4 text-emerald-400" />
          <h2
            id="results-heading"
            className="text-base font-semibold text-slate-200"
          >
            نتائج الاختراق
          </h2>
        </div>

        {/* بطاقة h_pr المميزة — النتيجة الرئيسية */}
        <Card className="bg-slate-900/80 border-2 border-emerald-500/40 mb-4 relative overflow-hidden">
          {/* تدرج زمراوي علوي */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-emerald-600/5 to-transparent pointer-events-none" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-14 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                  <ArrowDown className="size-7 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-400 font-mono text-xs px-2.5 py-0.5"
                    >
                      h_pr
                    </Badge>
                    <Badge className="bg-emerald-600/30 text-emerald-300 text-[10px] px-2 py-0.5 border border-emerald-500/20">
                      النتيجة الرئيسية
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    عمق الاختراق المصحح — المعادلة 13
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mr-auto sm:mr-0">
                <span className="text-4xl font-bold font-mono text-emerald-400 tracking-tight">
                  {fmt(STEP3_PENETRATION.h_pr, 4)}
                </span>
                <span className="text-lg text-slate-500 font-medium">m</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* باقي النتائج */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {penetrationResults
            .filter((r) => !r.isKeyOutput)
            .map((result) => (
              <Card
                key={result.symbol}
                className="bg-slate-900/80 border-slate-800/60 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 left-0 h-0.5 bg-emerald-500/30" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 font-mono text-xs px-2 py-0.5"
                    >
                      {result.symbol}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{result.labelAr}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {fmt(result.value, 4)}
                    </span>
                    {result.unit !== '—' && (
                      <span className="text-sm text-slate-500">{result.unit}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* القسم ج — معاملات التدمير والتشقق                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="destruction-heading">
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle
              id="destruction-heading"
              className="text-base font-semibold text-slate-200 flex items-center gap-2"
            >
              <AlertTriangle className="size-4 text-amber-400" />
              معاملات التدمير والتشقق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* hb_destruction */}
              <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-0.5 bg-red-500/50" />
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="outline"
                    className="border-red-500/30 text-red-400 font-mono text-xs px-2 py-0.5"
                  >
                    hb_destruction
                  </Badge>
                  <Lock className="size-3.5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  عمق التدمير
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-red-400">
                    {fmt(STEP3_PENETRATION.hb_destruction, 4)}
                  </span>
                  <span className="text-sm text-slate-500">m</span>
                </div>
              </div>

              {/* hb_cracking */}
              <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-0.5 bg-amber-500/50" />
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 text-amber-400 font-mono text-xs px-2 py-0.5"
                  >
                    hb_cracking
                  </Badge>
                  <Lock className="size-3.5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  عمق التشقق
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {fmt(STEP3_PENETRATION.hb_cracking, 4)}
                  </span>
                  <span className="text-sm text-slate-500">m</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* مخطط التدفق الحسابي                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="flow-heading">
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle
              id="flow-heading"
              className="text-base font-semibold text-slate-200 flex items-center gap-2"
            >
              <Calculator className="size-4 text-emerald-400" />
              مخطط التدفق الحسابي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {flowSteps.map((step, idx) => (
                <React.Fragment key={step.symbol}>
                  {/* عقدة التدفق */}
                  <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 min-w-[80px] hover:border-emerald-500/30 transition-colors">
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {step.symbol}
                    </span>
                    <span className="text-[10px] text-slate-500 text-center leading-tight">
                      {step.label}
                    </span>
                  </div>

                  {/* سهم بين العقد — لا يظهر بعد الأخير */}
                  {idx < flowSteps.length - 1 && (
                    <ArrowDown className="size-4 text-slate-600 rotate-[-90deg] shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ملخص التدفق */}
            <Separator className="bg-slate-700/40 my-4" />
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="size-3 text-slate-600" />
              <span>
                المدخلات من الخطوة 2 → المعاملات الوسيطة → عمق الاختراق → الأبعاد المختزلة
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
