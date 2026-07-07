// ═══════════════════════════════════════════════════════════════════════
// الخطوة 5 — مسار الجدار: أحمال الانفجار على الجدران
// منصة المدقق الديناميكي الموحد V3.0
// إكسيل 4 — حساب الضغط التصميمي على الجدران
// مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  STEP5_WALL,
  STEP5_ROOF,
  STEP4_LOCKED,
  STEP3_PENETRATION,
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
  STEP6_WALL,
} from '@/lib/constants/reference-data';
import {
  calculateBlastLoad,
  type BlastLoadInput,
  type BlastLoadOutput,
  calcHBar,
  calcRekv,
  calcRStar,
  calcPmaxSadovsky,
  calcKpsi,
  calcPekv,
  calcPp,
  calcPct,
} from '@/lib/engine/blast-loads';

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
  Waves,
  Activity,
  Timer,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Gauge,
  FlaskConical,
  ArrowLeftRight,
  Building2,
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
    { label: 'الشحنة الفعالة', symbol: 'C_ef', value: STEP3_PENETRATION.C_ef, unit: 'kg', source: 'الخطوة 3' },
    { label: 'عمق الاختراق', symbol: 'h_pr', value: STEP3_PENETRATION.h_pr, unit: 'm', source: 'الخطوة 3' },
    { label: 'البعد الشعاعي الفعلي', symbol: 'R_actual', value: STEP3_PENETRATION.R_actual, unit: 'm', source: 'الخطوة 3' },
    { label: 'البعد المختزل', symbol: 'Z', value: STEP3_PENETRATION.Zp, unit: '—', source: 'الخطوة 3' },
    { label: 'عمق مركز الانفجار', symbol: 'h_z', value: STEP3_PENETRATION.h_z, unit: 'm', source: 'الخطوة 3' },
    { label: 'سماكة الجدار', symbol: 'Hc', value: STEP4_LOCKED.Hc, unit: 'cm', source: 'الخطوة 4' },
    { label: 'البحر القصير', symbol: 'ap', value: STEP2_GEOMETRY.ap, unit: 'm', source: 'الخطوة 2' },
    { label: 'البحر الطويل', symbol: 'bp', value: STEP2_GEOMETRY.bp, unit: 'm', source: 'الخطوة 2' },
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
// مكون: جدول المقارنة BMK-02
// ═══════════════════════════════════════════════════════════════════════

function ComparisonTable({ data }: { data: BlastLoadOutput }) {
  const comparisonRows = useMemo(() => {
    const keys: Array<{ key: keyof BlastLoadOutput; label: string; symbol: string; unit: string; refValue: number }> = [
      { key: 'R_ekv', label: 'البعد المكافئ', symbol: 'R_ekv', unit: 'm', refValue: STEP5_WALL.R_ekv },
      { key: 'R_star', label: 'البعد النجمي', symbol: 'R*', unit: 'm', refValue: STEP5_WALL.R_star },
      { key: 'Pmax', label: 'الضغط الأقصى', symbol: 'Pmax', unit: 'kg/cm²', refValue: STEP5_WALL.Pmax },
      { key: 'Kd', label: 'معامل الديناميكية', symbol: 'Kd', unit: '—', refValue: STEP5_WALL.Kd },
      { key: 'kpsi', label: 'معامل psi', symbol: 'kψ', unit: '—', refValue: STEP5_WALL.kpsi },
      { key: 'P_ekv', label: 'الضغط المكافئ', symbol: 'P_ekv', unit: 'kg/cm²', refValue: STEP5_WALL.P_ekv },
      { key: 'Pct', label: 'ضغط الشد الثابت', symbol: 'Pct', unit: 'kg/cm²', refValue: STEP5_WALL.Pct },
      { key: 'Pp', label: 'ضغط التصميم', symbol: 'Pp', unit: 'kg/cm²', refValue: STEP5_WALL.Pp },
      { key: 'omega', label: 'التردد الدائري', symbol: 'ω', unit: 'rad/s', refValue: STEP5_WALL.omega },
      { key: 'tau', label: 'زمن الطور الموجب', symbol: 'τ', unit: 's', refValue: STEP5_WALL.tau },
      { key: 'tau_ef', label: 'الزمن الفعال', symbol: 'τ_ef', unit: 's', refValue: STEP5_WALL.tau_ef },
      { key: 'tau_n', label: 'الزمن الطبيعي', symbol: 'τ_n', unit: 's', refValue: STEP5_WALL.tau_n },
      { key: 'C_dyn', label: 'السرعة الديناميكية', symbol: 'C_dyn', unit: 'm/s', refValue: STEP5_WALL.C_dyn },
      { key: 'a0cp', label: 'معامل a₀ للضغط', symbol: 'a0cp', unit: 'm/s', refValue: STEP5_WALL.a0cp },
      { key: 'a1cp', label: 'معامل a₁ للضغط', symbol: 'a1cp', unit: 'm/s', refValue: STEP5_WALL.a1cp },
      { key: 'h_bar', label: 'النسبة المختزلة للسماكة', symbol: 'h̄', unit: '—', refValue: STEP5_WALL.h_bar },
      { key: 'mu_struct', label: 'المطاوعة الإنشائية', symbol: 'μ_struct', unit: '—', refValue: STEP5_WALL.mu_struct },
      { key: 'eta', label: 'معامل الكفاءة', symbol: 'η', unit: '—', refValue: STEP5_WALL.eta },
    ];

    return keys.map(({ key, label, symbol, unit, refValue }) => {
      const computedVal = data[key];
      const isBoolean = typeof computedVal === 'boolean';
      const computed = isBoolean ? 0 : (computedVal as number);
      const dev = isBoolean ? 0 : calcDeviation(computed, refValue);
      const status = isBoolean ? 'ok' as const : getDeviationStatus(dev);

      return { key: key as string, label, symbol, unit, computed: isBoolean ? '—' : computed, reference: refValue, deviationPct: dev, status };
    });
  }, [data]);

  const okCount = comparisonRows.filter(d => d.status === 'ok').length;
  const warnCount = comparisonRows.filter(d => d.status === 'warn').length;
  const failCount = comparisonRows.filter(d => d.status === 'fail').length;

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
              {comparisonRows.map((row, i) => (
                <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                  <TableCell className="text-xs text-slate-300 py-1.5">{row.label}</TableCell>
                  <TableCell className="text-xs text-center py-1.5">
                    <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {row.symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono text-slate-200">
                    {typeof row.computed === 'number' ? fmtShort(row.computed) : row.computed}
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
// مكون: جدول مقارنة السقف مقابل الجدار
// ═══════════════════════════════════════════════════════════════════════

function RoofVsWallComparisonTable() {
  const rows = [
    { label: 'ضغط التصميم', symbol: 'Pp', roof: STEP5_ROOF.Pp, wall: STEP5_WALL.Pp, unit: 'kg/cm²' },
    { label: 'التردد الدائري', symbol: 'ω', roof: STEP5_ROOF.omega, wall: STEP5_WALL.omega, unit: 'rad/s' },
    { label: 'معامل الديناميكية', symbol: 'Kd', roof: STEP5_ROOF.Kd, wall: STEP5_WALL.Kd, unit: '—' },
    { label: 'معامل psi', symbol: 'kψ', roof: STEP5_ROOF.kpsi, wall: STEP5_WALL.kpsi, unit: '—' },
    { label: 'الزمن الفعال', symbol: 'τ_ef', roof: STEP5_ROOF.tau_ef, wall: STEP5_WALL.tau_ef, unit: 's' },
    { label: 'معامل a₀ للضغط', symbol: 'a0cp', roof: STEP5_ROOF.a0cp, wall: STEP5_WALL.a0cp, unit: 'm/s' },
    { label: 'معامل a₁ للضغط', symbol: 'a1cp', roof: STEP5_ROOF.a1cp, wall: STEP5_WALL.a1cp, unit: 'm/s' },
  ];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-orange-500/15">
            <ArrowLeftRight className="size-4 text-orange-400" />
          </div>
          مقارنة جانبية — السقف مقابل الجدار
          <Badge variant="outline" className="text-[9px] border-orange-600/40 text-orange-400 bg-orange-500/10 h-4 mr-auto">
            فروقات جوهرية
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs h-8">المعيار</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الرمز</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Waves className="size-3 text-sky-400" />
                    <span>السقف</span>
                  </div>
                </TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Building2 className="size-3 text-emerald-400" />
                    <span>الجدار</span>
                  </div>
                </TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الوحدة</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الفرق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const diff = row.wall - row.roof;
                const diffPct = row.roof !== 0 ? (diff / Math.abs(row.roof)) * 100 : 0;
                const isHigher = diff > 0;
                return (
                  <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                    <TableCell className="text-xs text-slate-300 py-1.5">{row.label}</TableCell>
                    <TableCell className="text-xs text-center py-1.5">
                      <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                        {row.symbol}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-center py-1.5 font-mono text-sky-300">
                      {fmtShort(row.roof)}
                    </TableCell>
                    <TableCell className="text-xs text-center py-1.5 font-mono text-emerald-300 font-semibold">
                      {fmtShort(row.wall)}
                    </TableCell>
                    <TableCell className="text-xs text-center py-1.5 text-slate-500">{row.unit}</TableCell>
                    <TableCell className="text-xs text-center py-1.5 font-mono">
                      <span className={isHigher ? 'text-amber-400' : 'text-sky-400'}>
                        {isHigher ? '↑' : '↓'} {Math.abs(diffPct).toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* ملخص الفروقات */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 text-center">
            <p className="text-[10px] text-amber-400/80 mb-1">Kd أعلى للجدار</p>
            <p className="text-sm font-bold text-amber-400 font-mono">
              {fmtShort(STEP5_WALL.Kd)} مقابل {fmtShort(STEP5_ROOF.Kd)}
            </p>
            <p className="text-[9px] text-slate-600 mt-1">1.0 بدلاً من 0.92</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 text-center">
            <p className="text-[10px] text-amber-400/80 mb-1">ω أعلى بكثير للجدار</p>
            <p className="text-sm font-bold text-amber-400 font-mono">
              {fmtShort(STEP5_WALL.omega)} مقابل {fmtShort(STEP5_ROOF.omega)}
            </p>
            <p className="text-[9px] text-slate-600 mt-1">جدار أكثر صلابة</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 text-center">
            <p className="text-[10px] text-amber-400/80 mb-1">τ_ef أقصر للجدار</p>
            <p className="text-sm font-bold text-amber-400 font-mono">
              {fmt(STEP5_WALL.tau_ef, 3)} مقابل {fmt(STEP5_ROOF.tau_ef, 3)}
            </p>
            <p className="text-[9px] text-slate-600 mt-1">حمل أقصر بكثير</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function Step5WallBlastPage() {
  // ─── حساب نتائج مسار الجدار ───
  const wallData = useMemo<BlastLoadOutput>(() => {
    const input: BlastLoadInput = {
      path: 'wall',
      C_ef: STEP3_PENETRATION.C_ef,
      h_pr: STEP3_PENETRATION.h_pr,
      R_actual: STEP3_PENETRATION.R_actual,
      Z: STEP3_PENETRATION.Zp,
      ap: STEP2_GEOMETRY.ap,
      bp: STEP2_GEOMETRY.bp,
      Hp_cm: STEP4_LOCKED.Hc, // سماكة الجدار بدلاً من السقف
      Ea: STEP2_GEOMETRY.Ea,
      xi: STEP2_GEOMETRY.xi,
      RbH: STEP2_LOOKUPS.RbH,
      RsH: STEP2_LOOKUPS.RsH,
      gamma_b: STEP2_LOOKUPS.gamma_b,
      gamma_g: STEP2_LOOKUPS.gamma_g,
      Kpod: STEP6_WALL.Kpod,
      R_bar_b1: STEP5_WALL.R_bar_b1,
      a0z: STEP6_WALL.a0z,
      a1z: STEP6_WALL.a1z,
      Kp: STEP5_WALL.Kp,
      Kd: STEP5_WALL.Kd,
    };

    return calculateBlastLoad(input);
  }, []);

  // ─── حساب القيم الوسيطة للعرض التفصيلي ───
  const intermediate = useMemo(() => {
    const C_ef = STEP3_PENETRATION.C_ef;
    const h_pr = STEP3_PENETRATION.h_pr;
    const R_actual = STEP3_PENETRATION.R_actual;
    const Hc_cm = STEP4_LOCKED.Hc;
    const ht_cm = STEP4_LOCKED.ht;

    const h_bar = calcHBar(Hc_cm, C_ef);
    const R_ekv = calcRekv(R_actual, h_pr, Hc_cm, ht_cm);
    const R_star = calcRStar(STEP2_LOOKUPS.R_bar, C_ef);
    const Pmax = calcPmaxSadovsky(C_ef, R_ekv, STEP5_WALL.Kp);
    const kpsi = calcKpsi('wall');
    const P_ekv = calcPekv(STEP5_WALL.Kd, kpsi, Pmax);
    const Pct = calcPct(STEP2_LOOKUPS.gamma_g, STEP3_PENETRATION.Zp, Hc_cm, 'wall');
    const Pp = calcPp(P_ekv, Pct);

    return { h_bar, R_ekv, R_star, Pmax, kpsi, P_ekv, Pct, Pp };
  }, []);

  return (
    <div
      className="space-y-6"
      dir="rtl"
      role="region"
      aria-labelledby="step5-wall-heading"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. الرأس
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
        <div>
          <h1
            id="step5-wall-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Building2 className="size-5 text-emerald-400" />
            </div>
            الخطوة 5 — أحمال الانفجار على الجدران
            <Badge className="bg-emerald-600/80 text-white text-[10px] h-5 hover:bg-emerald-600/80">
              إكسيل 4
            </Badge>
            <Badge variant="outline" className="text-[10px] border-orange-600/40 text-orange-400 bg-orange-500/10 h-5">
              مسار الجدار
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 mr-11">
            مسار الجدار — حساب الضغط التصميمي على الجدران (Kd = 1.0، kψ = 0.85)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-400 bg-emerald-500/10">
            <ShieldCheck className="size-3 ml-1" />
            BMK-02
          </Badge>
          <Badge variant="outline" className="text-[10px] border-orange-600/40 text-orange-400 bg-orange-500/10">
            <Building2 className="size-3 ml-1" />
            مسار الجدار
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
            <Activity className="size-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">خطوات حساب أحمال الانفجار — مسار الجدار</h2>
          <Badge variant="outline" className="text-[9px] border-orange-600/40 text-orange-400 bg-orange-500/10 h-4">
            STEP5_WALL
          </Badge>
        </div>

        {/* الخطوة 1: R_ekv */}
        <CalcStepCard
          stepNumber={1}
          title="البعد المكافئ R_ekv (جدار)"
          symbol="R_ekv"
          formula={`R_ekv = f(R_actual, h_pr, Hc, ht) = ${fmtShort(STEP3_PENETRATION.R_actual)} - ${fmtShort(STEP3_PENETRATION.h_pr)} × (1 - ${fmtShort(STEP4_LOCKED.Hc)}/${fmtShort(STEP4_LOCKED.ht)}) = ${fmtShort(intermediate.R_ekv)} m`}
          computedValue={intermediate.R_ekv}
          referenceValue={STEP5_WALL.R_ekv}
          unit="m"
          bmkRef="BMK-02 §4.1"
        />

        {/* الخطوة 2: R* */}
        <CalcStepCard
          stepNumber={2}
          title="البعد النجمي R*"
          symbol="R*"
          formula={`R* = R̄ × (C_ef)^0.333 = ${fmtShort(STEP2_LOOKUPS.R_bar)} × ∛(${fmtShort(STEP3_PENETRATION.C_ef)}) = ${fmtShort(intermediate.R_star)} m`}
          computedValue={intermediate.R_star}
          referenceValue={STEP5_WALL.R_star}
          unit="m"
          bmkRef="BMK-02 §4.2"
        />

        {/* الخطوة 3: Pmax */}
        <CalcStepCard
          stepNumber={3}
          title="الضغط الأقصى Pmax — صيغة سادوفسكي (جدار)"
          symbol="Pmax"
          formula={`Pmax = Sadovsky(R_ekv, C_ef) × Kp = ${fmtShort(intermediate.Pmax)} kg/cm²  [Kp = ${STEP5_WALL.Kp}]`}
          computedValue={intermediate.Pmax}
          referenceValue={STEP5_WALL.Pmax}
          unit="kg/cm²"
          bmkRef="BMK-02 §4.3"
        />

        {/* فاصل ─── ضغط التصميم */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600 font-mono">───── ضغط التصميم ─────</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* الخطوة 4: Kd × kψ */}
        <CalcStepCard
          stepNumber={4}
          title="معاملات التصحيح Kd و kψ (جدار)"
          symbol="Kd × kψ"
          formula={`Kd = ${STEP5_WALL.Kd},  kψ = ${intermediate.kpsi} (جدار — مختلف عن السقف 0.9)`}
          computedValue={STEP5_WALL.Kd * intermediate.kpsi}
          referenceValue={STEP5_WALL.Kd * STEP5_WALL.kpsi}
          unit="—"
          bmkRef="BMK-02 §4.4"
        />

        {/* الخطوة 5: P_ekv */}
        <CalcStepCard
          stepNumber={5}
          title="الضغط المكافئ P_ekv (جدار)"
          symbol="P_ekv"
          formula={`P_ekv = Pmax × Kd × kψ = ${fmtShort(intermediate.Pmax)} × ${STEP5_WALL.Kd} × ${intermediate.kpsi} = ${fmtShort(intermediate.P_ekv)} kg/cm²`}
          computedValue={intermediate.P_ekv}
          referenceValue={STEP5_WALL.P_ekv}
          unit="kg/cm²"
          bmkRef="BMK-02 §4.5"
        />

        {/* الخطوة 6: Pp */}
        <CalcStepCard
          stepNumber={6}
          title="ضغط التصميم على الجدران Pp"
          symbol="Pp"
          formula={`Pp = P_ekv + Pct = ${fmtShort(intermediate.P_ekv)} + ${fmtShort(intermediate.Pct)} = ${fmtShort(intermediate.Pp)} kg/cm²`}
          computedValue={intermediate.Pp}
          referenceValue={STEP5_WALL.Pp}
          unit="kg/cm²"
          bmkRef="BMK-02 §4.6"
        />

        {/* فاصل ─── الديناميكية */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600 font-mono">───── الديناميكية ─────</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* الخطوة 7: ω */}
        <CalcStepCard
          stepNumber={7}
          title="التردد الدائري الطبيعي ω (جدار)"
          symbol="ω"
          formula={`ω = (π²/L²) × √(Ea·I / (γ·A·g))  [Hc = ${fmtShort(STEP4_LOCKED.Hc)} cm] = ${fmtShort(wallData.omega)} rad/s`}
          computedValue={wallData.omega}
          referenceValue={STEP5_WALL.omega}
          unit="rad/s"
          bmkRef="BMK-02 §4.7"
        />

        {/* الخطوة 8: τ_ef */}
        <CalcStepCard
          stepNumber={8}
          title="الزمن الفعال τ_ef (جدار)"
          symbol="τ_ef"
          formula={`τ_ef = τ × f(ΔPmax) = ${fmtShort(wallData.tau_ef)} s`}
          computedValue={wallData.tau_ef}
          referenceValue={STEP5_WALL.tau_ef}
          unit="s"
          bmkRef="BMK-02 §4.8"
        />

        {/* الخطوة 9: a0cp, a1cp */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center size-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold font-mono shrink-0">
                9
              </span>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">معاملات السرعة الديناميكية (جدار)</span>
                  <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 bg-slate-800/50 h-4">
                    BMK-02 §4.9
                  </Badge>
                  <Badge variant="outline" className="text-[9px] border-amber-600/40 text-amber-400 bg-amber-500/10 h-4">
                    أعلى من السقف
                  </Badge>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/50 rounded-md px-3 py-2 font-mono text-xs text-slate-300" dir="ltr">
                  a₀cp = {fmt(STEP5_WALL.a0cp, 1)} m/s, &nbsp; a₁cp = {fmt(STEP5_WALL.a1cp, 1)} m/s
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600">a₀cp:</span>
                    <span className="font-mono text-slate-200">{fmtShort(STEP5_WALL.a0cp)}</span>
                    <span className="text-slate-500">m/s</span>
                    <span className="text-[9px] text-amber-400/70">(سقف: {fmtShort(STEP5_ROOF.a0cp)})</span>
                  </div>
                  <Separator orientation="vertical" className="h-3 bg-slate-800" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600">a₁cp:</span>
                    <span className="font-mono text-slate-200">{fmtShort(STEP5_WALL.a1cp)}</span>
                    <span className="text-slate-500">m/s</span>
                    <span className="text-[9px] text-amber-400/70">(سقف: {fmtShort(STEP5_ROOF.a1cp)})</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. النتائج الرئيسية الثلاث
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-emerald-500/15">
            <Gauge className="size-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">النتائج الرئيسية — مسار الجدار</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MainResultCard
            emoji="💥"
            label="ضغط التصميم على الجدران"
            symbol="Pp"
            value={wallData.Pp}
            unit="kg/cm²"
            referenceValue={STEP5_WALL.Pp}
            accentBg="bg-emerald-500"
            icon={ShieldCheck}
          />
          <MainResultCard
            emoji="📊"
            label="تردد الاهتزاز"
            symbol="ω"
            value={wallData.omega}
            unit="rad/s"
            referenceValue={STEP5_WALL.omega}
            accentBg="bg-emerald-500"
            icon={Activity}
          />
          <MainResultCard
            emoji="⏱️"
            label="مدة الحمل"
            symbol="τ_ef"
            value={wallData.tau_ef}
            unit="s"
            referenceValue={STEP5_WALL.tau_ef}
            accentBg="bg-emerald-500"
            icon={Timer}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. جدول المقارنة
      ═══════════════════════════════════════════════════════════════════ */}
      <ComparisonTable data={wallData} />

      {/* ═══════════════════════════════════════════════════════════════════
          6. مقارنة السقف مقابل الجدار
      ═══════════════════════════════════════════════════════════════════ */}
      <RoofVsWallComparisonTable />

      {/* ═══════════════════════════════════════════════════════════════════
          7. شريط التحقق
      ═══════════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {wallData.R_ekv_gt_R_star ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span className="text-xs font-medium">شرط R_ekv &gt; R* متحقق</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-400">
                  <XCircle className="size-4" />
                  <span className="text-xs font-medium">شرط R_ekv &gt; R* غير متحقق</span>
                </div>
              )}
              <Separator orientation="vertical" className="h-4 bg-slate-800" />
              <span className="text-[10px] text-slate-600 font-mono">
                R_ekv = {fmtShort(wallData.R_ekv)} m &gt; R* = {fmtShort(wallData.R_star)} m
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 bg-slate-800/50">
                STEP5_WALL: {Object.keys(STEP5_WALL).length} متغير
              </Badge>
              <Badge variant="outline" className="text-[9px] border-amber-600/40 text-amber-400 bg-amber-500/10">
                إكسيل 4
              </Badge>
            </div>
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
          onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/step5-roof-blast'; }}
        >
          <ArrowRight className="size-3.5" />
          انفجار السقف
        </Button>
        <p className="text-[10px] text-slate-600 hidden sm:block">
          مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL) — إكسيل 4 — مسار الجدار
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-emerald-700/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-1.5"
          onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/structural-design'; }}
        >
          التالي ← تصميم السقف
          <ArrowLeft className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
