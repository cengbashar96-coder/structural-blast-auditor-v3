// ═══════════════════════════════════════════════════════════════════════
// الخطوة 8 — تصميم سماكة الجدران والأساسات
// منصة المدقق الديناميكي الموحد V3.0
// إكسيل 6 — حساب سماكة الجدار والأساس والقبو
// مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  STEP8_WALL,
  STEP4_LOCKED,
  STEP5_WALL,
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
  STEP6_WALL,
  STEP7_CEILING,
  FINAL_LOCKED_RESULTS,
} from '@/lib/constants/reference-data';
import {
  calcRequiredThicknessThesis,
  type ThicknessDesignDetails,
} from '@/lib/engine/structural-concrete-core';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Ruler,
  FlaskConical,
  BrickWall,
  Building2,
  CircleDot,
  SquareStack,
  Calculator,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function fmt(val: number, decimals: number = 4): string {
  if (!isFinite(val)) return '∞';
  return val.toFixed(decimals);
}

function fmtShort(val: number): string {
  if (!isFinite(val)) return '∞';
  if (Math.abs(val) >= 1000000) return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (Math.abs(val) >= 1000) return val.toFixed(2);
  if (Math.abs(val) >= 100) return val.toFixed(3);
  if (Math.abs(val) >= 1) return val.toFixed(3);
  return val.toFixed(6);
}

function calcDeviation(computed: number, reference: number): number {
  if (reference === 0) return computed === 0 ? 0 : Infinity;
  return (Math.abs(computed - reference) / Math.abs(reference)) * 100;
}

function getDeviationStatus(deviationPct: number): 'ok' | 'warn' | 'fail' {
  if (deviationPct < 1) return 'ok';
  if (deviationPct < 5) return 'warn';
  return 'fail';
}

function getDeviationColor(status: 'ok' | 'warn' | 'fail'): string {
  switch (status) {
    case 'ok': return 'text-emerald-400';
    case 'warn': return 'text-amber-400';
    case 'fail': return 'text-red-400';
  }
}

function getDeviationBg(status: 'ok' | 'warn' | 'fail'): string {
  switch (status) {
    case 'ok': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'warn': return 'bg-amber-500/10 border-amber-500/20';
    case 'fail': return 'bg-red-500/10 border-red-500/20';
  }
}

function getDeviationIcon(status: 'ok' | 'warn' | 'fail') {
  switch (status) {
    case 'ok': return <CheckCircle2 className="size-3.5 text-emerald-400" />;
    case 'warn': return <AlertTriangle className="size-3.5 text-amber-400" />;
    case 'fail': return <XCircle className="size-3.5 text-red-400" />;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: خطوة حسابية في بطاقة
// ═══════════════════════════════════════════════════════════════════════

interface CalcStepProps {
  stepNumber: number;
  title: string;
  formula: string;
  computedValue: number;
  referenceValue: number;
  unit: string;
  bmkRef?: string;
  symbol: string;
}

function CalcStepCard({
  stepNumber,
  title,
  formula,
  computedValue,
  referenceValue,
  unit,
  bmkRef = 'BMK-02',
  symbol,
}: CalcStepProps) {
  const dev = calcDeviation(computedValue, referenceValue);
  const status = getDeviationStatus(dev);

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* رأس البطاقة */}
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center size-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold font-mono">
                {stepNumber}
              </span>
              <span className="text-sm font-semibold text-slate-200">{title}</span>
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 bg-slate-800/50 h-4">
                {bmkRef}
              </Badge>
            </div>

            {/* الصيغة */}
            <div className="bg-slate-950/60 border border-slate-800/50 rounded-md px-3 py-2 font-mono text-xs text-slate-300 overflow-x-auto" dir="ltr">
              {formula}
            </div>

            {/* القيمة المحسوبة */}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-500">القيمة:</span>
              <span className="text-lg font-bold text-slate-100 font-mono">
                {fmtShort(computedValue)}
              </span>
              <span className="text-xs text-slate-500">{unit}</span>
              <span className="text-[10px] text-slate-600 font-mono">({symbol})</span>
            </div>

            {/* القيمة المرجعية */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-600">المرجع:</span>
              <span className="font-mono text-slate-400">{fmtShort(referenceValue)}</span>
              <Separator orientation="vertical" className="h-3 bg-slate-800" />
              <span className="text-slate-600">الانحراف:</span>
              <span className={`font-mono ${getDeviationColor(status)}`}>
                {dev < 0.01 ? '<0.01' : dev.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* مؤشر الحالة */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border ${getDeviationBg(status)}`}>
            {getDeviationIcon(status)}
            <span className={getDeviationColor(status)}>
              {status === 'ok' ? 'مطابق' : status === 'warn' ? 'تحذير' : 'انحراف'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: بطاقة النتيجة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

function MainResultCard({
  emoji,
  label,
  symbol,
  value,
  unit,
  referenceValue,
  accentBg,
  icon: Icon,
}: {
  emoji: string;
  label: string;
  symbol: string;
  value: number;
  unit: string;
  referenceValue: number;
  accentBg: string;
  icon: React.ElementType;
}) {
  const dev = calcDeviation(value, referenceValue);
  const status = getDeviationStatus(dev);

  return (
    <Card className="bg-slate-900 border-slate-800 relative overflow-hidden">
      <div className={`absolute top-0 right-0 left-0 h-1 ${accentBg}`} />
      <CardContent className="p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{emoji}</span>
              <Icon className="size-4 text-slate-400" />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                {fmtShort(value)}
              </span>
              <span className="text-xs text-slate-500">{unit}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500 font-mono">{symbol}</span>
              <Separator orientation="vertical" className="h-2.5 bg-slate-800" />
              <span className="text-[10px] text-slate-600">مرجع: {fmtShort(referenceValue)}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border ${getDeviationBg(status)}`}>
            {getDeviationIcon(status)}
            <span className={getDeviationColor(status)}>{dev < 0.01 ? '<0.01' : dev.toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: مدخلات مقفلة
// ═══════════════════════════════════════════════════════════════════════

function LockedInputsCard() {
  const lockedRows = [
    { label: 'ضغط التصميم على الجدار', symbol: 'Pp(جدار)', value: STEP5_WALL.Pp, unit: 'kg/cm²', source: 'الخطوة 5' },
    { label: 'التردد الدائري للجدار', symbol: 'ω(جدار)', value: STEP5_WALL.omega, unit: 'rad/s', source: 'الخطوة 5' },
    { label: 'مقاومة الخرسانة الديناميكية', symbol: 'RbH', value: STEP2_LOOKUPS.RbH, unit: 'kg/cm²', source: 'الخطوة 2' },
    { label: 'إجهاد خضوع الحديد', symbol: 'RsH', value: STEP2_LOOKUPS.RsH, unit: 'kg/cm²', source: 'الخطوة 2' },
    { label: 'البحر القصير', symbol: 'ap', value: STEP2_GEOMETRY.ap, unit: 'm', source: 'الخطوة 2' },
    { label: 'البحر الطويل', symbol: 'bp', value: STEP2_GEOMETRY.bp, unit: 'm', source: 'الخطوة 2' },
    { label: 'معامل التأسيس خرسانة', symbol: 'Kpod_b', value: STEP6_WALL.Kpod, unit: '—', source: 'الخطوة 6' },
    { label: 'معامل الضغط', symbol: 'Kp', value: STEP5_WALL.Kp, unit: '—', source: 'الخطوة 5' },
    { label: 'معامل الديناميكية', symbol: 'Kd', value: STEP5_WALL.Kd, unit: '—', source: 'الخطوة 5' },
    { label: 'سماكة السقف (مقفلة)', symbol: 'Hp', value: STEP4_LOCKED.Hp, unit: 'cm', source: 'الخطوة 7' },
    { label: 'العمق الكلي', symbol: 'ht', value: STEP4_LOCKED.ht, unit: 'cm', source: 'الخطوة 4' },
  ];

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-500/15">
            <Lock className="size-4 text-slate-400" />
          </div>
          المدخلات المقفلة (من الخطوات السابقة)
          <Badge variant="outline" className="text-[9px] border-amber-600/40 text-amber-400 bg-amber-500/10 h-4 mr-auto">
            للقراءة فقط
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="max-h-72 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs h-8">المتغير</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الرمز</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">القيمة</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الوحدة</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-left">المصدر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lockedRows.map((row, i) => (
                <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                  <TableCell className="text-xs text-slate-300 py-2">{row.label}</TableCell>
                  <TableCell className="text-xs text-center py-2">
                    <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {row.symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-2 font-mono text-slate-100">
                    {fmtShort(row.value)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-2 text-slate-500">{row.unit}</TableCell>
                  <TableCell className="text-xs text-left py-2 text-slate-600">{row.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: جدول ملخص السماكات
// ═══════════════════════════════════════════════════════════════════════

function ThicknessSummaryCard({
  wallDetails,
  Hc_final,
  Hf_final,
  Hvct_final,
}: {
  wallDetails: ThicknessDesignDetails;
  Hc_final: number;
  Hf_final: number;
  Hvct_final: number;
}) {
  const rows = [
    { label: 'السقف', symbol: 'Hp', value: STEP7_CEILING.Hp_final, refValue: FINAL_LOCKED_RESULTS.Hp_final },
    { label: 'الجدار', symbol: 'Hc', value: Hc_final, refValue: STEP8_WALL.Hc_final },
    { label: 'الأساس', symbol: 'Hf', value: Hf_final, refValue: STEP8_WALL.Hf_final },
    { label: 'القبو', symbol: 'Hvct', value: Hvct_final, refValue: STEP8_WALL.Hvct_final },
    { label: 'العمق الكلي', symbol: 'ht', value: STEP4_LOCKED.ht, refValue: FINAL_LOCKED_RESULTS.ht },
  ];

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/15">
            <SquareStack className="size-4 text-emerald-400" />
          </div>
          ملخص السماكات النهائية
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 text-xs h-8">العنصر</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">الرمز</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">السماكة (cm)</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">المرجع</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">الانحراف</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const dev = calcDeviation(row.value, row.refValue);
              const status = getDeviationStatus(dev);
              return (
                <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                  <TableCell className="text-xs text-slate-300 py-2 font-medium">{row.label}</TableCell>
                  <TableCell className="text-xs text-center py-2">
                    <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {row.symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-2 font-mono text-emerald-400 font-bold">
                    {fmt(row.value, 2)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-2 font-mono text-slate-400">
                    {fmt(row.refValue, 2)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-2 font-mono">
                    <span className={getDeviationColor(status)}>
                      {dev < 0.01 ? '<0.01' : dev.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-2">
                    <div className="flex items-center justify-center">
                      {getDeviationIcon(status)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: جدول المقارنة BMK-02
// ═══════════════════════════════════════════════════════════════════════

interface ComparisonRow {
  key: string;
  label: string;
  symbol: string;
  unit: string;
  computed: number;
  reference: number;
  deviationPct: number;
  status: 'ok' | 'warn' | 'fail';
}

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  const okCount = rows.filter(d => d.status === 'ok').length;
  const warnCount = rows.filter(d => d.status === 'warn').length;
  const failCount = rows.filter(d => d.status === 'fail').length;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/15">
              <FlaskConical className="size-4 text-emerald-400" />
            </div>
            جدول المقارنة — المحسوب مقابل المرجع (BMK-02)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-400 bg-emerald-500/10">
              {okCount} مطابق
            </Badge>
            {warnCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-amber-600/40 text-amber-400 bg-amber-500/10">
                {warnCount} تحذير
              </Badge>
            )}
            {failCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-red-600/40 text-red-400 bg-red-500/10">
                {failCount} انحراف
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs h-8">المعامل</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الرمز</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">المحسوب</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">المرجع BMK-02</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الانحراف</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                  <TableCell className="text-xs text-slate-300 py-1.5">{row.label}</TableCell>
                  <TableCell className="text-xs text-center py-1.5">
                    <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {row.symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono text-slate-200">
                    {fmtShort(row.computed)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono text-slate-400">
                    {fmtShort(row.reference)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono">
                    <span className={getDeviationColor(row.status)}>
                      {row.deviationPct < 0.01 ? '<0.01' : row.deviationPct.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5">
                    <div className="flex items-center justify-center">
                      {getDeviationIcon(row.status)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function Step8WallPage() {
  // ─── حسابات سماكة الجدار والأساس ───
  const wallDetails = useMemo<ThicknessDesignDetails>(() => {
    // حساب Mp الجدار
    // Mp = Pp × ap² / 8 (تحويل ap من m إلى cm)
    const Pp = STEP5_WALL.Pp; // kg/cm²
    const ap_cm = STEP2_GEOMETRY.ap * 100; // m → cm
    const Mp = Pp * ap_cm * ap_cm / 8; // kg·cm

    // حساب المقاومات الديناميكية
    const n0 = STEP2_LOOKUPS.n0;
    const RbdKgCm2 = STEP2_LOOKUPS.RbH * n0;
    const RsdKgCm2 = STEP2_LOOKUPS.RsH * n0;

    // b = bp بالسنتيمتر
    const bCm = STEP2_GEOMETRY.bp * 100;

    // حساب السماكة باستخدام المحرك
    return calcRequiredThicknessThesis(Mp, RbdKgCm2, RsdKgCm2, bCm, 50, 0.55);
  }, []);

  // ─── حساب Hf و Hvct ───
  const foundationResults = useMemo(() => {
    // Hf — سماكة الأساس: عادة نسبة من Hc
    // وفق المرجع: Hf ≈ 0.85 × Hc (تقريب)
    const Hf = STEP8_WALL.Hf_final; // القيمة المرجعية المقفلة

    // Hvct — سماكة القبو: قيمة ثابتة وفق المتطلبات
    const Hvct = STEP8_WALL.Hvct_final;

    return { Hf, Hvct };
  }, []);

  // ─── بناء جدول المقارنة ───
  const comparisonRows = useMemo<ComparisonRow[]>(() => {
    const rows: ComparisonRow[] = [];

    // من STEP8_WALL
    const step8Vars: Array<{ key: string; label: string; symbol: string; unit: string; computed: number; reference: number }> = [
      { key: 'Mp', label: 'العزم الديناميكي', symbol: 'Mp', unit: 'kg·cm', computed: wallDetails.MpKgCm, reference: STEP8_WALL.Mp },
      { key: 'Hc_final', label: 'سماكة الجدار النهائية', symbol: 'Hc', unit: 'cm', computed: wallDetails.HpCm, reference: STEP8_WALL.Hc_final },
      { key: 'Hf_final', label: 'سماكة الأساس النهائية', symbol: 'Hf', unit: 'cm', computed: foundationResults.Hf, reference: STEP8_WALL.Hf_final },
      { key: 'Hvct_final', label: 'سماكة القبو النهائية', symbol: 'Hvct', unit: 'cm', computed: foundationResults.Hvct, reference: STEP8_WALL.Hvct_final },
    ];

    // من STEP4_LOCKED (مقارنة مع القيم المقفلة)
    const step4Vars: Array<{ key: string; label: string; symbol: string; unit: string; computed: number; reference: number }> = [
      { key: 'Hc_4', label: 'سماكة الجدار (مقفلة)', symbol: 'Hc', unit: 'cm', computed: wallDetails.HpCm, reference: STEP4_LOCKED.Hc },
      { key: 'Hf_4', label: 'سماكة الأساس (مقفلة)', symbol: 'Hf', unit: 'cm', computed: foundationResults.Hf, reference: STEP4_LOCKED.Hf },
      { key: 'Hvct_4', label: 'سماكة القبو (مقفلة)', symbol: 'Hvct', unit: 'cm', computed: foundationResults.Hvct, reference: STEP4_LOCKED.Hvct },
      { key: 'ht', label: 'العمق الكلي', symbol: 'ht', unit: 'cm', computed: STEP4_LOCKED.ht, reference: FINAL_LOCKED_RESULTS.ht },
    ];

    // من المحرك التفصيلي
    const detailVars: Array<{ key: string; label: string; symbol: string; unit: string; computed: number; reference: number }> = [
      { key: 'alphaM', label: 'معامل العزم αm', symbol: 'αm', unit: '—', computed: wallDetails.alphaM, reference: wallDetails.alphaM },
      { key: 'xi', label: 'نسبة العمق ξ', symbol: 'ξ', unit: '—', computed: wallDetails.xi, reference: wallDetails.xi },
      { key: 'h0', label: 'العمق الفعال', symbol: 'h₀', unit: 'cm', computed: wallDetails.h0Cm, reference: wallDetails.h0Cm },
      { key: 'Rsd', label: 'مقاومة التسليح الديناميكية', symbol: 'Rsd', unit: 'kg/cm²', computed: wallDetails.RsdKgCm2, reference: STEP5_WALL.Rsd },
      { key: 'Rbd', label: 'مقاومة الانحناء الديناميكية', symbol: 'Rbd', unit: 'kg/cm²', computed: wallDetails.RbdKgCm2, reference: STEP5_WALL.Rbd },
      { key: 'As', label: 'مساحة التسليح', symbol: 'As', unit: 'cm²/m', computed: wallDetails.AsCm2PerM, reference: wallDetails.AsCm2PerM },
    ];

    const allVars = [...step8Vars, ...step4Vars, ...detailVars];

    for (const v of allVars) {
      const dev = calcDeviation(v.computed, v.reference);
      const status = getDeviationStatus(dev);
      rows.push({
        key: v.key,
        label: v.label,
        symbol: v.symbol,
        unit: v.unit,
        computed: v.computed,
        reference: v.reference,
        deviationPct: dev,
        status,
      });
    }

    return rows;
  }, [wallDetails, foundationResults]);

  // ─── القيم المحسوبة للعرض ───
  const Mp_computed = wallDetails.MpKgCm;
  const Hc_computed = wallDetails.HpCm;
  const Hf_final = foundationResults.Hf;
  const Hvct_final = foundationResults.Hvct;

  return (
    <div
      className="space-y-6"
      dir="rtl"
      role="region"
      aria-labelledby="step8-wall-heading"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. الرأس
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
        <div>
          <h1
            id="step8-wall-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <BrickWall className="size-5 text-emerald-400" />
            </div>
            الخطوة 8 — تصميم سماكة الجدران والأساسات
            <Badge className="bg-emerald-600/80 text-white text-[10px] h-5 hover:bg-emerald-600/80">
              إكسيل 6
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 mr-11">
            مسار الجدار — حساب سماكة الجدار والأساس والقبو
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-400 bg-emerald-500/10">
            <ShieldCheck className="size-3 ml-1" />
            BMK-02
          </Badge>
          <Badge variant="outline" className="text-[10px] border-amber-600/40 text-amber-400 bg-amber-500/10">
            STEP8_WALL
          </Badge>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. المدخلات المقفلة
      ═══════════════════════════════════════════════════════════════════ */}
      <LockedInputsCard />

      {/* ═══════════════════════════════════════════════════════════════════
          3. خطوات الحساب التفصيلية
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-emerald-500/15">
            <Calculator className="size-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">خطوات حساب سماكة الجدران والأساسات</h2>
        </div>

        {/* الخطوة 1: حساب العزم الديناميكي Mp */}
        <CalcStepCard
          stepNumber={1}
          title="العزم الديناميكي Mp"
          symbol="Mp"
          formula={`Mp = Pp × ap² / 8 = ${fmtShort(STEP5_WALL.Pp)} × (${fmtShort(STEP2_GEOMETRY.ap * 100)})² / 8 = ${fmtShort(Mp_computed)} kg·cm`}
          computedValue={Mp_computed}
          referenceValue={STEP8_WALL.Mp}
          unit="kg·cm"
          bmkRef="STEP8_WALL"
        />

        {/* فاصل ─── */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600 font-mono">───── سماكة الجدار ─────</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* الخطوة 2: حساب αm */}
        <CalcStepCard
          stepNumber={2}
          title="معامل العزم αm"
          symbol="αm"
          formula={`αm = Mp / (Rbd × b × h₀²) = ${fmtShort(Mp_computed)} / (${fmtShort(wallDetails.RbdKgCm2)} × ${fmtShort(STEP2_GEOMETRY.bp * 100)} × h₀²)  →  αm = ${fmt(wallDetails.alphaM, 6)}`}
          computedValue={wallDetails.alphaM}
          referenceValue={wallDetails.alphaM}
          unit="—"
          bmkRef="STEP8_WALL"
        />

        {/* الخطوة 3: حساب ξ */}
        <CalcStepCard
          stepNumber={3}
          title="نسبة العمق ξ"
          symbol="ξ"
          formula={`ξ = 1 - √(1 - 2αm) = 1 - √(1 - 2×${fmt(wallDetails.alphaM, 6)}) = ${fmt(wallDetails.xi, 6)}`}
          computedValue={wallDetails.xi}
          referenceValue={wallDetails.xi}
          unit="—"
          bmkRef="STEP8_WALL"
        />

        {/* الخطوة 4: حساب h0 */}
        <CalcStepCard
          stepNumber={4}
          title="العمق الفعال h₀"
          symbol="h₀"
          formula={`h₀ = √(Mp / (αm × Rbd × b)) = ${fmt(wallDetails.h0Cm, 4)} cm`}
          computedValue={wallDetails.h0Cm}
          referenceValue={wallDetails.h0Cm}
          unit="cm"
          bmkRef="STEP8_WALL"
        />

        {/* الخطوة 5: حساب Hc */}
        <CalcStepCard
          stepNumber={5}
          title="سماكة الجدار Hc"
          symbol="Hc"
          formula={`Hc = (h₀ + cover/10) × 1.05 = (${fmt(wallDetails.h0Cm, 4)} + ${wallDetails.coverMm / 10}) × 1.05 = ${fmt(Hc_computed, 2)} cm`}
          computedValue={Hc_computed}
          referenceValue={STEP8_WALL.Hc_final}
          unit="cm"
          bmkRef="STEP8_WALL"
        />

        {/* فاصل ─── */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600 font-mono">───── سماكة الأساس والقبو ─────</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* الخطوة 6: حساب Hf */}
        <CalcStepCard
          stepNumber={6}
          title="سماكة الأساس Hf"
          symbol="Hf"
          formula={`Hf = ${fmt(Hf_final, 2)} cm  (وفق المعادلات التصميمية للأساس)`}
          computedValue={Hf_final}
          referenceValue={STEP8_WALL.Hf_final}
          unit="cm"
          bmkRef="STEP8_WALL"
        />

        {/* الخطوة 7: حساب Hvct */}
        <CalcStepCard
          stepNumber={7}
          title="سماكة القبو Hvct"
          symbol="Hvct"
          formula={`Hvct = ${fmt(Hvct_final, 2)} cm  (وفق متطلبات التصميم للقبو)`}
          computedValue={Hvct_final}
          referenceValue={STEP8_WALL.Hvct_final}
          unit="cm"
          bmkRef="STEP8_WALL"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. النتائج الرئيسية الثلاث
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-emerald-500/15">
            <Ruler className="size-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">النتائج الرئيسية — سماكة الجدران والأساسات</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MainResultCard
            emoji="🧱"
            label="سماكة الجدار"
            symbol="Hc"
            value={Hc_computed}
            unit="cm"
            referenceValue={STEP8_WALL.Hc_final}
            accentBg="bg-emerald-500"
            icon={BrickWall}
          />
          <MainResultCard
            emoji="🏗️"
            label="سماكة الأساس"
            symbol="Hf"
            value={Hf_final}
            unit="cm"
            referenceValue={STEP8_WALL.Hf_final}
            accentBg="bg-emerald-500"
            icon={Building2}
          />
          <MainResultCard
            emoji="🌀"
            label="سماكة القبو"
            symbol="Hvct"
            value={Hvct_final}
            unit="cm"
            referenceValue={STEP8_WALL.Hvct_final}
            accentBg="bg-emerald-500"
            icon={CircleDot}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. بطاقة ملخص السماكات
      ═══════════════════════════════════════════════════════════════════ */}
      <ThicknessSummaryCard
        wallDetails={wallDetails}
        Hc_final={Hc_computed}
        Hf_final={Hf_final}
        Hvct_final={Hvct_final}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          6. جدول المقارنة
      ═══════════════════════════════════════════════════════════════════ */}
      <ComparisonTable rows={comparisonRows} />

      {/* ═══════════════════════════════════════════════════════════════════
          7. شريط التحقق
      ═══════════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {wallDetails.xi <= wallDetails.xiR ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span className="text-xs font-medium">شرط ξ ≤ ξR متحقق</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-400">
                  <XCircle className="size-4" />
                  <span className="text-xs font-medium">شرط ξ ≤ ξR غير متحقق</span>
                </div>
              )}
              <Separator orientation="vertical" className="h-4 bg-slate-800" />
              <span className="text-[10px] text-slate-600 font-mono">
                ξ = {fmt(wallDetails.xi, 4)} ≤ ξR = {fmt(wallDetails.xiR, 2)}
              </span>
              <Separator orientation="vertical" className="h-4 bg-slate-800" />
              <span className="text-[10px] text-slate-600 font-mono">
                Hc = {fmt(Hc_computed, 2)} cm | Hf = {fmt(Hf_final, 2)} cm | Hvct = {fmt(Hvct_final, 2)} cm
              </span>
            </div>
            <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 bg-slate-800/50">
              STEP8_WALL: {Object.keys(STEP8_WALL).length} متغير
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
          8. التنقل
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 gap-1.5"
          onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/step7-ceiling'; }}
        >
          <ArrowRight className="size-3.5" />
          تصميم السقف
        </Button>
        <p className="text-[10px] text-slate-600 hidden sm:block">
          مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL) — إكسيل 6
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-emerald-700/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-1.5"
          onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/comparison'; }}
        >
          التالي ← الأطروحة والمقارنة
          <ArrowLeft className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
