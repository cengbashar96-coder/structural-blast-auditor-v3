// ═══════════════════════════════════════════════════════════════════════
// صفحة تفاصيل أحمال الانفجار — الخطوة 5
// منصة المدقق الديناميكي الموحد V3.0
// مساران مستقلان: السقف (Roof) والجدار (Wall)
// مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { STEP5_ROOF, STEP5_WALL, STEP6_ROOF, STEP6_WALL } from '@/lib/constants/reference-data';
import type { BlastLoadPath } from '@/types/engine';
import { calculateBlastLoad, type BlastLoadOutput } from '@/lib/engine/blast-loads';
import { STEP2_LOOKUPS, STEP2_GEOMETRY, STEP3_PENETRATION, STEP4_LOCKED } from '@/lib/constants/reference-data';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

import {
  Waves,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Activity,
  Timer,
  Ruler,
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Gauge,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// أنواع مساعدة
// ═══════════════════════════════════════════════════════════════════════

type PathType = 'roof' | 'wall';

interface DeviationInfo {
  key: string;
  label: string;
  symbol: string;
  computed: number;
  reference: number;
  deviationPct: number;
  status: 'ok' | 'warn' | 'fail';
}

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
  if (Math.abs(val) >= 1) return val.toFixed(4);
  return val.toFixed(6);
}

function calcDeviation(computed: number, reference: number): number {
  if (reference === 0) return computed === 0 ? 0 : Infinity;
  return Math.abs(computed - reference) / Math.abs(reference) * 100;
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
// مكون النتيجة الرئيسية الكبيرة
// ═══════════════════════════════════════════════════════════════════════

function KeyResultCard({
  label,
  symbol,
  value,
  unit,
  referenceValue,
  accentColor,
  icon: Icon,
}: {
  label: string;
  symbol: string;
  value: number;
  unit: string;
  referenceValue: number;
  accentColor: string;
  icon: React.ElementType;
}) {
  const dev = calcDeviation(value, referenceValue);
  const status = getDeviationStatus(dev);

  return (
    <Card className={`bg-slate-900 border-slate-800 relative overflow-hidden`}>
      {/* شريط اللون العلوي */}
      <div className={`absolute top-0 right-0 left-0 h-1 ${accentColor}`} />
      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`size-4 ${status === 'ok' ? 'text-slate-400' : getDeviationColor(status)}`} />
              <span className="text-xs text-slate-400 truncate">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
                {fmtShort(value)}
              </span>
              <span className="text-xs text-slate-500">{unit}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-slate-500 font-mono">{symbol}</span>
              <Separator orientation="vertical" className="h-2.5 bg-slate-800" />
              <span className="text-[10px] text-slate-600">مرجع: {fmtShort(referenceValue)}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${getDeviationBg(status)}`}>
            {getDeviationIcon(status)}
            <span className={getDeviationColor(status)}>{dev < 0.01 ? '<0.01' : dev.toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون جدول المعاملات
// ═══════════════════════════════════════════════════════════════════════

function ParameterTable({
  title,
  icon: Icon,
  accentColor,
  rows,
}: {
  title: string;
  icon: React.ElementType;
  accentColor: string;
  rows: Array<{
    label: string;
    symbol: string;
    value: string | React.ReactNode;
    unit: string;
  }>;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${accentColor}`}>
            <Icon className="size-4 text-slate-200" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 text-xs h-8">المعامل</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">الرمز</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">القيمة</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-left">الوحدة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                <TableCell className="text-xs text-slate-300 py-2">{row.label}</TableCell>
                <TableCell className="text-xs text-center py-2">
                  <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                    {row.symbol}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-center py-2 font-mono text-slate-100">
                  {row.value}
                </TableCell>
                <TableCell className="text-xs text-left py-2 text-slate-500">{row.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون جدول المعاملات الإنشائية
// ═══════════════════════════════════════════════════════════════════════

function StructuralCoefficientsCard({
  data,
  accentColor,
}: {
  data: BlastLoadOutput;
  accentColor: string;
}) {
  const rows = [
    { label: 'المطاوعة الإنشائية', symbol: 'μ_struct', value: fmt(data.mu_struct, 4) },
    { label: 'معامل الكفاءة', symbol: 'η', value: fmt(data.eta, 4) },
    { label: 'مقاومة القص الديناميكية', symbol: 'Rsd', value: fmt(data.Rsd, 2), unit: 'kg/cm²' },
    { label: 'مقاومة الانحناء', symbol: 'Rbd', value: fmt(data.Rbd, 2), unit: 'kg/cm²' },
    { label: 'معامل الضغط', symbol: 'Kp', value: fmt(data.Kp, 4) },
    { label: 'معامل الديناميكية', symbol: 'Kd', value: fmt(data.Kd, 4) },
    { label: 'معامل psi', symbol: 'kpsi', value: fmt(data.kpsi, 4) },
  ];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${accentColor}`}>
            <ShieldCheck className="size-4 text-slate-200" />
          </div>
          المعاملات الإنشائية
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 text-xs h-8">المعامل</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">الرمز</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">القيمة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                <TableCell className="text-xs text-slate-300 py-2">{row.label}</TableCell>
                <TableCell className="text-xs text-center py-2">
                  <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                    {row.symbol}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-center py-2 font-mono text-slate-100">
                  {row.value}
                  {row.unit && <span className="text-slate-500 mr-1 text-[10px]">{row.unit}</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون مقارنة BMK-02
// ═══════════════════════════════════════════════════════════════════════

function BMK02ComparisonCard({
  computed,
  reference,
  path,
  accentColor,
}: {
  computed: BlastLoadOutput;
  reference: Omit<BlastLoadOutput, 'path'>;
  path: PathType;
  accentColor: string;
}) {
  const deviations: DeviationInfo[] = useMemo(() => {
    const keys: Array<{ key: keyof BlastLoadOutput; label: string; symbol: string }> = [
      { key: 'Pmax', label: 'الضغط الأقصى', symbol: 'Pmax' },
      { key: 'P_ekv', label: 'الضغط المكافئ', symbol: 'P_ekv' },
      { key: 'Pp', label: 'ضغط التصميم', symbol: 'Pp' },
      { key: 'omega', label: 'التردد الدائري', symbol: 'ω' },
      { key: 'tau', label: 'زمن الطور الموجب', symbol: 'τ' },
      { key: 'tau_ef', label: 'الزمن الفعال', symbol: 'τ_ef' },
      { key: 'tau_n', label: 'الزمن الطبيعي', symbol: 'τ_n' },
      { key: 'C_dyn', label: 'السرعة الديناميكية', symbol: 'C_dyn' },
      { key: 'R_ekv', label: 'البعد المكافئ', symbol: 'R_ekv' },
      { key: 'R_star', label: 'البعد النجمي', symbol: 'R*' },
      { key: 'mu_struct', label: 'المطاوعة الإنشائية', symbol: 'μ_struct' },
      { key: 'eta', label: 'معامل الكفاءة', symbol: 'η' },
      { key: 'Kp', label: 'معامل الضغط', symbol: 'Kp' },
      { key: 'Kd', label: 'معامل الديناميكية', symbol: 'Kd' },
      { key: 'kpsi', label: 'معامل psi', symbol: 'kpsi' },
    ];

    return keys.map(({ key, label, symbol }) => {
      const computedVal = computed[key] as number;
      const refVal = reference[key as keyof Omit<BlastLoadOutput, 'path'>] as number;
      const dev = calcDeviation(computedVal, refVal);
      const status = getDeviationStatus(dev);
      return { key: key as string, label, symbol, computed: computedVal, reference: refVal, deviationPct: dev, status };
    });
  }, [computed, reference]);

  const okCount = deviations.filter(d => d.status === 'ok').length;
  const warnCount = deviations.filter(d => d.status === 'warn').length;
  const failCount = deviations.filter(d => d.status === 'fail').length;
  const totalScore = Math.round((okCount / deviations.length) * 100);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${accentColor}`}>
              <FlaskConical className="size-4 text-slate-200" />
            </div>
            مقارنة مرجعية — BMK-02
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
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>نسبة المطابقة</span>
            <span className={totalScore >= 80 ? 'text-emerald-400' : totalScore >= 50 ? 'text-amber-400' : 'text-red-400'}>
              {totalScore}%
            </span>
          </div>
          <Progress value={totalScore} className="h-1.5" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="max-h-72 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs h-8">المعامل</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الرمز</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">المحسوب</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">المرجع</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الانحراف</TableHead>
                <TableHead className="text-slate-400 text-xs h-8 text-center">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviations.map((d, i) => (
                <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                  <TableCell className="text-xs text-slate-300 py-1.5">{d.label}</TableCell>
                  <TableCell className="text-xs text-center py-1.5">
                    <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {d.symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono text-slate-200">
                    {fmtShort(d.computed)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono text-slate-400">
                    {fmtShort(d.reference)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono">
                    <span className={getDeviationColor(d.status)}>
                      {d.deviationPct < 0.01 ? '<0.01' : d.deviationPct.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5">
                    <div className="flex items-center justify-center">
                      {getDeviationIcon(d.status)}
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
// مكون تبويب المسار (سقف/جدار)
// ═══════════════════════════════════════════════════════════════════════

function PathTabContent({
  path,
  data,
  reference,
  accentColor,
  accentBg,
}: {
  path: PathType;
  data: BlastLoadOutput;
  reference: Omit<BlastLoadOutput, 'path'>;
  accentColor: string;
  accentBg: string;
}) {
  const timeRows = [
    { label: 'زمن الطور الموجب', symbol: 'τ', value: fmt(data.tau), unit: 's' },
    { label: 'الزمن الفعال', symbol: 'τ_ef', value: fmt(data.tau_ef), unit: 's' },
    { label: 'الزمن الطبيعي', symbol: 'τ_n', value: fmt(data.tau_n), unit: 's' },
    { label: 'السرعة الديناميكية', symbol: 'C_dyn', value: fmt(data.C_dyn), unit: 'm/s' },
  ];

  const distanceRows = [
    { label: 'البعد المكافئ', symbol: 'R_ekv', value: fmt(data.R_ekv), unit: 'm' },
    { label: 'البعد النجمي', symbol: 'R*', value: fmt(data.R_star), unit: 'm' },
    { label: 'النسبة المختزلة', symbol: 'h̄', value: fmt(data.h_bar), unit: '—' },
    { label: 'البعد المختزل B1', symbol: 'R̄_b1', value: fmt(data.R_bar_b1), unit: '—' },
    {
      label: 'شرط R_ekv > R*',
      symbol: '',
      value: data.R_ekv_gt_R_star ? (
        <span className="flex items-center justify-center gap-1 text-emerald-400">
          <CheckCircle2 className="size-3.5" /> ✓
        </span>
      ) : (
        <span className="flex items-center justify-center gap-1 text-red-400">
          <XCircle className="size-3.5" /> ✗
        </span>
      ),
      unit: '—',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── أ) النتائج الرئيسية — 4 بطاقات كبيرة ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KeyResultCard
          label="الضغط الأقصى"
          symbol="Pmax"
          value={data.Pmax}
          unit="kg/cm²"
          referenceValue={reference.Pmax}
          accentColor={accentBg}
          icon={Gauge}
        />
        <KeyResultCard
          label="الضغط المكافئ"
          symbol="P_ekv"
          value={data.P_ekv}
          unit="kg/cm²"
          referenceValue={reference.P_ekv}
          accentColor={accentBg}
          icon={ArrowUpFromLine}
        />
        <KeyResultCard
          label="ضغط التصميم"
          symbol="Pp"
          value={data.Pp}
          unit="kg/cm²"
          referenceValue={reference.Pp}
          accentColor={accentBg}
          icon={ShieldCheck}
        />
        <KeyResultCard
          label="التردد الدائري"
          symbol="ω"
          value={data.omega}
          unit="rad/s"
          referenceValue={reference.omega}
          accentColor={accentBg}
          icon={Activity}
        />
      </div>

      {/* ─── ب + ج) معاملات الزمن والمسافة ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ParameterTable
          title="معاملات الزمن"
          icon={Timer}
          accentColor={accentBg}
          rows={timeRows}
        />
        <ParameterTable
          title="معاملات البعد"
          icon={Ruler}
          accentColor={accentBg}
          rows={distanceRows}
        />
      </div>

      {/* ─── د) المعاملات الإنشائية ─── */}
      <StructuralCoefficientsCard data={data} accentColor={accentBg} />

      {/* ─── هـ) مقارنة BMK-02 ─── */}
      <BMK02ComparisonCard
        computed={data}
        reference={reference}
        path={path}
        accentColor={accentBg}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function BlastLoadsPage() {
  const [activeTab, setActiveTab] = useState<PathType>('roof');
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // ─── بيانات السقف والجدار (الافتراضية من المرجع) ───
  const [roofData, setRoofData] = useState<BlastLoadOutput>(() => ({
    path: 'roof',
    h_bar: STEP5_ROOF.h_bar,
    R_bar_b1: STEP5_ROOF.R_bar_b1,
    R_ekv: STEP5_ROOF.R_ekv,
    R_star: STEP5_ROOF.R_star,
    max_bv: STEP5_ROOF.max_bv,
    tau: STEP5_ROOF.tau,
    tau_ef: STEP5_ROOF.tau_ef,
    tau_n: STEP5_ROOF.tau_n,
    a0cp: STEP5_ROOF.a0cp,
    a1cp: STEP5_ROOF.a1cp,
    omega: STEP5_ROOF.omega,
    C_dyn: STEP5_ROOF.C_dyn,
    mu_struct: STEP5_ROOF.mu_struct,
    eta: STEP5_ROOF.eta,
    Rsd: STEP5_ROOF.Rsd,
    Rbd: STEP5_ROOF.Rbd,
    lambda: STEP5_ROOF.lambda,
    Kp: STEP5_ROOF.Kp,
    Pmax: STEP5_ROOF.Pmax,
    Kd: STEP5_ROOF.Kd,
    kpsi: STEP5_ROOF.kpsi,
    P_ekv: STEP5_ROOF.P_ekv,
    Pct: STEP5_ROOF.Pct,
    Pp: STEP5_ROOF.Pp,
    R_ekv_gt_R_star: STEP5_ROOF.R_ekv_gt_R_star,
  }));

  const [wallData, setWallData] = useState<BlastLoadOutput>(() => ({
    path: 'wall',
    h_bar: STEP5_WALL.h_bar,
    R_bar_b1: STEP5_WALL.R_bar_b1,
    R_ekv: STEP5_WALL.R_ekv,
    R_star: STEP5_WALL.R_star,
    max_bv: STEP5_WALL.max_bv,
    tau: STEP5_WALL.tau,
    tau_ef: STEP5_WALL.tau_ef,
    tau_n: STEP5_WALL.tau_n,
    a0cp: STEP5_WALL.a0cp,
    a1cp: STEP5_WALL.a1cp,
    omega: STEP5_WALL.omega,
    C_dyn: STEP5_WALL.C_dyn,
    mu_struct: STEP5_WALL.mu_struct,
    eta: STEP5_WALL.eta,
    Rsd: STEP5_WALL.Rsd,
    Rbd: STEP5_WALL.Rbd,
    lambda: STEP5_WALL.lambda,
    Kp: STEP5_WALL.Kp,
    Pmax: STEP5_WALL.Pmax,
    Kd: STEP5_WALL.Kd,
    kpsi: STEP5_WALL.kpsi,
    P_ekv: STEP5_WALL.P_ekv,
    Pct: STEP5_WALL.Pct,
    Pp: STEP5_WALL.Pp,
    R_ekv_gt_R_star: STEP5_WALL.R_ekv_gt_R_star,
  }));

  // ─── تشغيل محرك الحمل الانفجاري ───
  const handleRunEngine = useCallback(async () => {
    setIsRunning(true);
    try {
      // إعداد المدخلات من بيانات الخطوات السابقة
      const commonInput = {
        C_ef: STEP3_PENETRATION.C_ef,
        h_pr: STEP3_PENETRATION.h_pr,
        R_actual: STEP3_PENETRATION.R_actual,
        Z: STEP3_PENETRATION.Zp,
        ap: STEP2_GEOMETRY.ap,
        bp: STEP2_GEOMETRY.bp,
        Ea: STEP2_GEOMETRY.Ea,
        xi: STEP2_GEOMETRY.xi,
        RbH: STEP2_LOOKUPS.RbH,
        RsH: STEP2_LOOKUPS.RsH,
        gamma_b: STEP2_LOOKUPS.gamma_b,
        gamma_g: STEP2_LOOKUPS.gamma_g,
      };

      // حساب مسار السقف
      const roofResult = calculateBlastLoad({
        ...commonInput,
        path: 'roof',
        Hp_cm: STEP4_LOCKED.Hp,
        Kpod: STEP6_ROOF.Kpod,
        R_bar_b1: STEP5_ROOF.R_bar_b1,
        a0z: STEP6_ROOF.a0z,
        a1z: STEP6_ROOF.a1z,
        Kp: STEP5_ROOF.Kp,
        Kd: STEP5_ROOF.Kd,
      });

      // حساب مسار الجدار
      const wallResult = calculateBlastLoad({
        ...commonInput,
        path: 'wall',
        Hp_cm: STEP4_LOCKED.Hc,
        Kpod: STEP6_WALL.Kpod,
        R_bar_b1: STEP5_WALL.R_bar_b1,
        a0z: STEP6_WALL.a0z,
        a1z: STEP6_WALL.a1z,
        Kp: STEP5_WALL.Kp,
        Kd: STEP5_WALL.Kd,
      });

      setRoofData(roofResult);
      setWallData(wallResult);
      setHasRun(true);
    } catch (error) {
      console.error('[BLAST-LOADS-ENGINE] Error:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // ─── إعادة تعيين إلى القيم المرجعية ───
  const handleReset = useCallback(() => {
    setRoofData({
      path: 'roof',
      h_bar: STEP5_ROOF.h_bar,
      R_bar_b1: STEP5_ROOF.R_bar_b1,
      R_ekv: STEP5_ROOF.R_ekv,
      R_star: STEP5_ROOF.R_star,
      max_bv: STEP5_ROOF.max_bv,
      tau: STEP5_ROOF.tau,
      tau_ef: STEP5_ROOF.tau_ef,
      tau_n: STEP5_ROOF.tau_n,
      a0cp: STEP5_ROOF.a0cp,
      a1cp: STEP5_ROOF.a1cp,
      omega: STEP5_ROOF.omega,
      C_dyn: STEP5_ROOF.C_dyn,
      mu_struct: STEP5_ROOF.mu_struct,
      eta: STEP5_ROOF.eta,
      Rsd: STEP5_ROOF.Rsd,
      Rbd: STEP5_ROOF.Rbd,
      lambda: STEP5_ROOF.lambda,
      Kp: STEP5_ROOF.Kp,
      Pmax: STEP5_ROOF.Pmax,
      Kd: STEP5_ROOF.Kd,
      kpsi: STEP5_ROOF.kpsi,
      P_ekv: STEP5_ROOF.P_ekv,
      Pct: STEP5_ROOF.Pct,
      Pp: STEP5_ROOF.Pp,
      R_ekv_gt_R_star: STEP5_ROOF.R_ekv_gt_R_star,
    });
    setWallData({
      path: 'wall',
      h_bar: STEP5_WALL.h_bar,
      R_bar_b1: STEP5_WALL.R_bar_b1,
      R_ekv: STEP5_WALL.R_ekv,
      R_star: STEP5_WALL.R_star,
      max_bv: STEP5_WALL.max_bv,
      tau: STEP5_WALL.tau,
      tau_ef: STEP5_WALL.tau_ef,
      tau_n: STEP5_WALL.tau_n,
      a0cp: STEP5_WALL.a0cp,
      a1cp: STEP5_WALL.a1cp,
      omega: STEP5_WALL.omega,
      C_dyn: STEP5_WALL.C_dyn,
      mu_struct: STEP5_WALL.mu_struct,
      eta: STEP5_WALL.eta,
      Rsd: STEP5_WALL.Rsd,
      Rbd: STEP5_WALL.Rbd,
      lambda: STEP5_WALL.lambda,
      Kp: STEP5_WALL.Kp,
      Pmax: STEP5_WALL.Pmax,
      Kd: STEP5_WALL.Kd,
      kpsi: STEP5_WALL.kpsi,
      P_ekv: STEP5_WALL.P_ekv,
      Pct: STEP5_WALL.Pct,
      Pp: STEP5_WALL.Pp,
      R_ekv_gt_R_star: STEP5_WALL.R_ekv_gt_R_star,
    });
    setHasRun(false);
  }, []);

  return (
    <div
      className="space-y-6"
      dir="rtl"
      role="region"
      aria-labelledby="blast-loads-heading"
    >
      {/* ─── الرأس ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
        <div>
          <h1
            id="blast-loads-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <Waves className="size-5 text-sky-400" />
            </div>
            أحمال الانفجار — الخطوة 5
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 mr-11">
            حساب تفصيلي لأحمال الانفجار على مساري السقف والجدار — مرجع القياس BMK-02
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasRun && (
            <Badge variant="outline" className="text-[10px] border-sky-600/40 text-sky-400 bg-sky-500/10">
              <Activity className="size-3 ml-1" />
              تم التشغيل
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            <RotateCcw className="size-3.5 ml-1" />
            إعادة تعيين
          </Button>
          <Button
            size="sm"
            onClick={handleRunEngine}
            disabled={isRunning}
            className="text-xs bg-sky-600 hover:bg-sky-700 text-white"
          >
            <Play className="size-3.5 ml-1" />
            {isRunning ? 'جاري الحساب...' : 'تشغيل المحرك'}
          </Button>
        </div>
      </div>

      {/* ─── ملخص سريع علوي ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5">
          <div className="text-[10px] text-slate-500 mb-0.5">Pmax السقف</div>
          <div className="text-sm font-mono font-bold text-sky-400">{fmtShort(roofData.Pmax)} <span className="text-slate-500 font-normal text-[10px]">kg/cm²</span></div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5">
          <div className="text-[10px] text-slate-500 mb-0.5">Pp السقف</div>
          <div className="text-sm font-mono font-bold text-sky-300">{fmtShort(roofData.Pp)} <span className="text-slate-500 font-normal text-[10px]">kg/cm²</span></div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5">
          <div className="text-[10px] text-slate-500 mb-0.5">Pmax الجدار</div>
          <div className="text-sm font-mono font-bold text-orange-400">{fmtShort(wallData.Pmax)} <span className="text-slate-500 font-normal text-[10px]">kg/cm²</span></div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5">
          <div className="text-[10px] text-slate-500 mb-0.5">Pp الجدار</div>
          <div className="text-sm font-mono font-bold text-orange-300">{fmtShort(wallData.Pp)} <span className="text-slate-500 font-normal text-[10px]">kg/cm²</span></div>
        </div>
      </div>

      {/* ─── التبويبات: مسار السقف / مسار الجدار ─── */}
      <Tabs
        dir="rtl"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as PathType)}
      >
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger
            value="roof"
            className="data-[state=active]:bg-sky-500/15 data-[state=active]:text-sky-300 text-slate-400 text-xs gap-1.5"
          >
            <ArrowUpFromLine className="size-3.5" />
            مسار السقف
          </TabsTrigger>
          <TabsTrigger
            value="wall"
            className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 text-slate-400 text-xs gap-1.5"
          >
            <ArrowDownFromLine className="size-3.5" />
            مسار الجدار
          </TabsTrigger>
        </TabsList>

        {/* ─── تبويب مسار السقف ─── */}
        <TabsContent value="roof" className="mt-6">
          <PathTabContent
            path="roof"
            data={roofData}
            reference={STEP5_ROOF}
            accentColor="text-sky-400"
            accentBg="bg-sky-500/15"
          />
        </TabsContent>

        {/* ─── تبويب مسار الجدار ─── */}
        <TabsContent value="wall" className="mt-6">
          <PathTabContent
            path="wall"
            data={wallData}
            reference={STEP5_WALL}
            accentColor="text-orange-400"
            accentBg="bg-orange-500/15"
          />
        </TabsContent>
      </Tabs>

      {/* ─── تذييل معلوماتي ─── */}
      <div className="border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-[10px] text-slate-600">
          مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL) — القيم المقفلة محمية بقوة الحوكمة
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span>STEP5_ROOF: {Object.keys(STEP5_ROOF).length} متغير</span>
          <Separator orientation="vertical" className="h-2.5 bg-slate-800" />
          <span>STEP5_WALL: {Object.keys(STEP5_WALL).length} متغير</span>
          <Separator orientation="vertical" className="h-2.5 bg-slate-800" />
          <span>STEP6_ROOF: {Object.keys(STEP6_ROOF).length} معامل</span>
          <Separator orientation="vertical" className="h-2.5 bg-slate-800" />
          <span>STEP6_WALL: {Object.keys(STEP6_WALL).length} معامل</span>
        </div>
      </div>
    </div>
  );
}
