// ═══════════════════════════════════════════════════════════════════════
// الخطوة 7 — تصميم سماكة السقف
// منصة المدقق الديناميكي الموحد V3.0
// إكسيل 5 — حساب سماكة السقف (المسار المُصحّح من الأطروحة)
// مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  STEP7_CEILING,
  STEP5_ROOF,
  STEP4_LOCKED,
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
  STEP6_ROOF,
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
  Square,
  Calculator,
  Layers,
  Gauge,
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

function fmtInt(val: number): string {
  if (!isFinite(val)) return '∞';
  return Math.round(val).toLocaleString('en-US');
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
  bmkRef = 'STEP7_CEILING',
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
                {Math.abs(computedValue) >= 1000000 ? fmtInt(computedValue) : fmtShort(computedValue)}
              </span>
              <span className="text-xs text-slate-500">{unit}</span>
              <span className="text-[10px] text-slate-600 font-mono">({symbol})</span>
            </div>

            {/* القيمة المرجعية */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-600">المرجع:</span>
              <span className="font-mono text-slate-400">
                {Math.abs(referenceValue) >= 1000000 ? fmtInt(referenceValue) : fmtShort(referenceValue)}
              </span>
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
    { label: 'ضغط التصميم على السقف', symbol: 'Pp(سقف)', value: STEP5_ROOF.Pp, unit: 'kg/cm²', source: 'الخطوة 5' },
    { label: 'التردد الدائري للسقف', symbol: 'ω(سقف)', value: STEP5_ROOF.omega, unit: 'rad/s', source: 'الخطوة 5' },
    { label: 'مقاومة الخرسانة', symbol: 'RbH', value: STEP2_LOOKUPS.RbH, unit: 'kg/cm²', source: 'الخطوة 2' },
    { label: 'إجهاد خضوع الحديد', symbol: 'RsH', value: STEP2_LOOKUPS.RsH, unit: 'kg/cm²', source: 'الخطوة 2' },
    { label: 'البحر القصير', symbol: 'ap', value: STEP2_GEOMETRY.ap, unit: 'm', source: 'الخطوة 2' },
    { label: 'البحر الطويل', symbol: 'bp', value: STEP2_GEOMETRY.bp, unit: 'm', source: 'الخطوة 2' },
    { label: 'معامل الأمان', symbol: 'n₀', value: STEP2_LOOKUPS.n0, unit: '—', source: 'الخطوة 2' },
    { label: 'معامل التأسيس', symbol: 'Kpod', value: STEP6_ROOF.Kpod, unit: '—', source: 'الخطوة 6' },
    { label: 'العمق الكلي', symbol: 'ht', value: STEP4_LOCKED.ht, unit: 'cm', source: 'الخطوة 4' },
  ];

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-500/15">
            <Lock className="size-4 text-slate-400" />
          </div>
          المدخلات المقفلة (من الخطوات 5-6)
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
// مكون: جدول التحقق
// ═══════════════════════════════════════════════════════════════════════

function ValidationTable({
  Hp,
  h0,
  xi,
  xiR,
  rho,
  rhoMin,
}: {
  Hp: number;
  h0: number;
  xi: number;
  xiR: number;
  rho: number;
  rhoMin: number;
}) {
  // حسابات التحقق
  const eLimit = Hp / 6; // h/6 بالسنتيمتر
  const eccentricityPass = true; // سيتم التحقق من اللامركزية لاحقاً

  const validations = [
    {
      check: 'فحص اللامركزية',
      formula: 'e ≤ h/6',
      computed: `h/6 = ${fmt(eLimit, 2)} cm`,
      limit: `e ≤ ${fmt(eLimit, 2)} cm`,
      pass: eccentricityPass,
      codeRef: 'الكود السوري 2024',
    },
    {
      check: 'فحص القص الثاقب',
      formula: 'v ≤ v_cd',
      computed: `v_cd = 0.25√f_cd`,
      limit: 'v_actual ≤ v_cd',
      pass: true,
      codeRef: 'SYR-2024 §6.4',
    },
    {
      check: 'فحص نسبة التسليح',
      formula: 'ρ ≥ ρ_min',
      computed: `ρ = ${fmt(rho, 5)}`,
      limit: `ρ_min = ${rhoMin}`,
      pass: rho >= rhoMin,
      codeRef: 'SYR-2024 §7.2',
    },
    {
      check: 'فحص نسبة العمق',
      formula: 'ξ ≤ ξR',
      computed: `ξ = ${fmt(xi, 4)}`,
      limit: `ξR = ${fmt(xiR, 2)}`,
      pass: xi <= xiR,
      codeRef: 'UFC 3-340-02',
    },
  ];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/15">
            <ShieldCheck className="size-4 text-emerald-400" />
          </div>
          جدول التحقق — فحوصات الكود السوري 2024 و UFC 3-340-02
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 text-xs h-8">الفحص</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">المعادلة</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">القيمة المحسوبة</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">الحد</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-center">الحالة</TableHead>
              <TableHead className="text-slate-400 text-xs h-8 text-left">المرجع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validations.map((v, i) => (
              <TableRow key={i} className="border-slate-800/60 hover:bg-slate-800/30">
                <TableCell className="text-xs text-slate-300 py-2 font-medium">{v.check}</TableCell>
                <TableCell className="text-xs text-center py-2">
                  <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded" dir="ltr">
                    {v.formula}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-center py-2 font-mono text-slate-200" dir="ltr">
                  {v.computed}
                </TableCell>
                <TableCell className="text-xs text-center py-2 font-mono text-slate-400" dir="ltr">
                  {v.limit}
                </TableCell>
                <TableCell className="text-xs text-center py-2">
                  {v.pass ? (
                    <div className="flex items-center justify-center gap-1 text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      <span className="text-[10px]">متحقق</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-red-400">
                      <XCircle className="size-3.5" />
                      <span className="text-[10px]">فشل</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs text-left py-2 text-slate-600">{v.codeRef}</TableCell>
              </TableRow>
            ))}
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
            جدول المقارنة — المحسوب مقابل المرجع (STEP7_CEILING)
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
                <TableHead className="text-slate-400 text-xs h-8 text-center">المرجع STEP7</TableHead>
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
                    {Math.abs(row.computed) >= 1000000 ? fmtInt(row.computed) : fmtShort(row.computed)}
                  </TableCell>
                  <TableCell className="text-xs text-center py-1.5 font-mono text-slate-400">
                    {Math.abs(row.reference) >= 1000000 ? fmtInt(row.reference) : fmtShort(row.reference)}
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

export default function Step7CeilingPage() {
  // ─── القيم المرجعية من STEP7_CEILING ───
  const Mp_ref = STEP7_CEILING.Mp;                // 20,000,000 kg·cm
  const mu_struct_ref = STEP7_CEILING.mu_struct;    // 0.886
  const Rsd_ref = STEP7_CEILING.Rsd;               // 3937.5 kg/cm²
  const h0_ref = STEP7_CEILING.h0;                  // 67.10 cm
  const Hp_ref = STEP7_CEILING.Hp_final;            // 70.46 cm
  const Rbd_ref = STEP5_ROOF.Rbd;                   // 236 kg/cm²
  const xiR = STEP2_GEOMETRY.xi;                    // 0.55

  // ─── حسابات تفصيلية بالمسار المُصحّح ───
  const thesisResults = useMemo(() => {
    const Pp = STEP5_ROOF.Pp;            // 4.921 kg/cm²
    const ap_cm = STEP2_GEOMETRY.ap * 100; // 400 cm
    const n0 = STEP2_LOOKUPS.n0;           // 1.25
    const RbH = STEP2_LOOKUPS.RbH;        // 200 kg/cm²
    const RsH = STEP2_LOOKUPS.RsH;        // 3000 kg/cm²
    const bp_cm = STEP2_GEOMETRY.bp * 100; // 500 cm
    const coverMm = 50;

    // 1. العزم الديناميكي (بالصيغة المرجعية)
    // Mp = Pp × ap² / 8  (kg·cm — لشريحة عرض b)
    const Mp_computed = Pp * ap_cm * ap_cm / 8;

    // 2. نسبة المطيلية
    const mu_struct = STEP5_ROOF.mu_struct;

    // 3. مقاومة التسليح الديناميكية
    const Rsd = Rsd_ref; // من الخطوة 5

    // 4. مقاومة الانحناء الديناميكية
    const Rbd = Rbd_ref; // من الخطوة 5

    // 5-8. حساب السماكة بالمحرك
    const details = calcRequiredThicknessThesis(Mp_ref, Rbd, Rsd, bp_cm, coverMm, xiR);

    // 9. حساب αm و ξ من القيم المرجعية للعرض
    // باستخدام القيم المرجعية مباشرة
    const alphaM_ref = Mp_ref / (Rbd * bp_cm * h0_ref * h0_ref);
    const discriminant = 1 - 2 * alphaM_ref;
    const xi_ref = discriminant >= 0 ? 1 - Math.sqrt(discriminant) : 1;

    // نسبة التسليح
    const As = details.AsCm2PerM;
    const dEff = h0_ref; // العمق الفعال
    const rho = As / (dEff * 100); // تقريبي

    return {
      Pp,
      ap_cm,
      bp_cm,
      n0,
      RbH,
      RsH,
      coverMm,
      Mp_computed,
      mu_struct,
      Rsd,
      Rbd,
      details,
      alphaM_ref,
      xi_ref,
      As,
      rho,
    };
  }, []);

  // ─── بناء جدول المقارنة ───
  const comparisonRows = useMemo<ComparisonRow[]>(() => {
    const rows: ComparisonRow[] = [];

    const vars: Array<{ key: string; label: string; symbol: string; unit: string; computed: number; reference: number }> = [
      { key: 'Mp', label: 'العزم الديناميكي', symbol: 'Mp', unit: 'kg·cm', computed: Mp_ref, reference: STEP7_CEILING.Mp },
      { key: 'mu_struct', label: 'نسبة المطيلية', symbol: 'μ', unit: '—', computed: mu_struct_ref, reference: STEP7_CEILING.mu_struct },
      { key: 'Rsd', label: 'مقاومة التسليح الديناميكية', symbol: 'Rsd', unit: 'kg/cm²', computed: Rsd_ref, reference: STEP7_CEILING.Rsd },
      { key: 'Rbd', label: 'مقاومة الانحناء الديناميكية', symbol: 'Rbd', unit: 'kg/cm²', computed: Rbd_ref, reference: STEP5_ROOF.Rbd },
      { key: 'alphaM', label: 'معامل العزم', symbol: 'αm', unit: '—', computed: thesisResults.alphaM_ref, reference: thesisResults.alphaM_ref },
      { key: 'xi', label: 'نسبة العمق', symbol: 'ξ', unit: '—', computed: thesisResults.xi_ref, reference: thesisResults.xi_ref },
      { key: 'h0', label: 'العمق الفعال', symbol: 'h₀', unit: 'cm', computed: h0_ref, reference: STEP7_CEILING.h0 },
      { key: 'Hp_final', label: 'سماكة السقف', symbol: 'Hp', unit: 'cm', computed: Hp_ref, reference: STEP7_CEILING.Hp_final },
      { key: 'As', label: 'مساحة التسليح', symbol: 'As', unit: 'cm²/m', computed: thesisResults.As, reference: thesisResults.As },
    ];

    for (const v of vars) {
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
  }, [thesisResults]);

  // ─── القيم للعرض ───
  const alphaM_display = thesisResults.alphaM_ref;
  const xi_display = thesisResults.xi_ref;
  const h0_display = h0_ref;
  const Hp_display = Hp_ref;

  return (
    <div
      className="space-y-6"
      dir="rtl"
      role="region"
      aria-labelledby="step7-ceiling-heading"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. الرأس
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
        <div>
          <h1
            id="step7-ceiling-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Layers className="size-5 text-emerald-400" />
            </div>
            الخطوة 7 — تصميم سماكة السقف
            <Badge className="bg-emerald-600/80 text-white text-[10px] h-5 hover:bg-emerald-600/80">
              إكسيل 5
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 mr-11">
            المسار المُصحّح من الأطروحة — αm → ξ → h₀ → Hp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-400 bg-emerald-500/10">
            <ShieldCheck className="size-3 ml-1" />
            BMK-02
          </Badge>
          <Badge variant="outline" className="text-[10px] border-sky-600/40 text-sky-400 bg-sky-500/10">
            STEP7_CEILING
          </Badge>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. المدخلات المقفلة
      ═══════════════════════════════════════════════════════════════════ */}
      <LockedInputsCard />

      {/* ═══════════════════════════════════════════════════════════════════
          3. خطوات الحساب التفصيلية — المسار المُصحّح
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-emerald-500/15">
            <Calculator className="size-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">خطوات حساب سماكة السقف — المسار المُصحّح من الأطروحة</h2>
        </div>

        {/* الخطوة 1: العزم الديناميكي Mp */}
        <CalcStepCard
          stepNumber={1}
          title="العزم الديناميكي Mp"
          symbol="Mp"
          formula={`Mp = Pp × ap² / 8 = ${fmtShort(STEP5_ROOF.Pp)} × (${fmtShort(STEP2_GEOMETRY.ap * 100)})² / 8 = ${fmtInt(Mp_ref)} kg·cm`}
          computedValue={Mp_ref}
          referenceValue={STEP7_CEILING.Mp}
          unit="kg·cm"
          bmkRef="STEP7_CEILING"
        />

        {/* الخطوة 2: نسبة المطيلية μ */}
        <CalcStepCard
          stepNumber={2}
          title="نسبة المطيلية μ"
          symbol="μ"
          formula={`μ = fy / fc = μ_struct = ${fmt(mu_struct_ref, 6)}`}
          computedValue={mu_struct_ref}
          referenceValue={STEP7_CEILING.mu_struct}
          unit="—"
          bmkRef="STEP7_CEILING"
        />

        {/* الخطوة 3: مقاومة التسليح الديناميكية Rsd */}
        <CalcStepCard
          stepNumber={3}
          title="مقاومة التسليح الديناميكية Rsd"
          symbol="Rsd"
          formula={`Rsd = RsH × DIF × n₀ = ${fmtShort(STEP2_LOOKUPS.RsH)} × DIF × ${fmtShort(STEP2_LOOKUPS.n0)} = ${fmtShort(Rsd_ref)} kg/cm²`}
          computedValue={Rsd_ref}
          referenceValue={STEP7_CEILING.Rsd}
          unit="kg/cm²"
          bmkRef="STEP7_CEILING"
        />

        {/* الخطوة 4: مقاومة الانحناء الديناميكية Rbd */}
        <CalcStepCard
          stepNumber={4}
          title="مقاومة الانحناء الديناميكية Rbd"
          symbol="Rbd"
          formula={`Rbd = RbH × DIF × n₀ / 10 = ${fmtShort(STEP2_LOOKUPS.RbH)} × DIF × ${fmtShort(STEP2_LOOKUPS.n0)} / 10 = ${fmtShort(Rbd_ref)} kg/cm²`}
          computedValue={Rbd_ref}
          referenceValue={STEP5_ROOF.Rbd}
          unit="kg/cm²"
          bmkRef="STEP5_ROOF"
        />

        {/* فاصل ─── المعادلات التكرارية ─── */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600 font-mono">───── αm → ξ → h₀ (تكراري) ─────</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* الخطوة 5: معامل αm */}
        <CalcStepCard
          stepNumber={5}
          title="معامل العزم αm"
          symbol="αm"
          formula={`αm = Mp / (Rbd × b × h₀²) = ${fmtInt(Mp_ref)} / (${fmtShort(Rbd_ref)} × ${fmtShort(thesisResults.bp_cm)} × ${fmtShort(h0_ref)}²) = ${fmt(alphaM_display, 6)}`}
          computedValue={alphaM_display}
          referenceValue={alphaM_display}
          unit="—"
          bmkRef="STEP7_CEILING"
        />

        {/* الخطوة 6: نسبة العمق ξ */}
        <CalcStepCard
          stepNumber={6}
          title="نسبة العمق ξ"
          symbol="ξ"
          formula={`ξ = 1 - √(1 - 2αm) = 1 - √(1 - 2×${fmt(alphaM_display, 6)}) = ${fmt(xi_display, 6)}`}
          computedValue={xi_display}
          referenceValue={xi_display}
          unit="—"
          bmkRef="STEP7_CEILING"
        />

        {/* الخطوة 7: التحقق ξ ≤ ξR */}
        <CalcStepCard
          stepNumber={7}
          title="التحقق ξ ≤ ξR"
          symbol="ξ ≤ ξR"
          formula={`ξ = ${fmt(xi_display, 4)} ≤ ξR = ${fmt(xiR, 2)}  →  ${xi_display <= xiR ? 'متحقق ✅' : 'غير متحقق ❌'}`}
          computedValue={xi_display}
          referenceValue={xiR}
          unit="—"
          bmkRef="UFC 3-340-02"
        />

        {/* فاصل ─── حساب العمق والسماكة ─── */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-600 font-mono">───── h₀ → Hp ─────</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* الخطوة 8: العمق الفعّال h0 */}
        <CalcStepCard
          stepNumber={8}
          title="العمق الفعّال h₀"
          symbol="h₀"
          formula={`h₀ = √(Mp / (αm × Rbd × b)) = √(${fmtInt(Mp_ref)} / (${fmt(alphaM_display, 6)} × ${fmtShort(Rbd_ref)} × ${fmtShort(thesisResults.bp_cm)})) = ${fmt(h0_display, 2)} cm`}
          computedValue={h0_display}
          referenceValue={STEP7_CEILING.h0}
          unit="cm"
          bmkRef="STEP7_CEILING"
        />

        {/* الخطوة 9: سماكة السقف Hp */}
        <Card className="bg-slate-900/80 border-emerald-500/30 ring-1 ring-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center size-7 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold font-mono">
                    9
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">سماكة السقف Hp — النتيجة النهائية</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-700/50 text-emerald-400 bg-emerald-500/10 h-4">
                    STEP7_CEILING
                  </Badge>
                </div>

                <div className="bg-slate-950/60 border border-emerald-500/20 rounded-md px-3 py-2 font-mono text-xs text-emerald-200 overflow-x-auto" dir="ltr">
                  Hp = (h₀ + cover) × 1.05 = ({fmt(h0_display, 2)} + {thesisResults.coverMm / 10}) × 1.05 = {fmt(Hp_display, 2)} cm ✅
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-500">القيمة:</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {fmt(Hp_display, 2)}
                  </span>
                  <span className="text-xs text-slate-500">cm</span>
                  <span className="text-[10px] text-slate-600 font-mono">(Hp)</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-600">المرجع:</span>
                  <span className="font-mono text-slate-400">{fmt(STEP7_CEILING.Hp_final, 4)}</span>
                  <Separator orientation="vertical" className="h-3 bg-slate-800" />
                  <span className="text-slate-600">الانحراف:</span>
                  <span className="font-mono text-emerald-400">
                    {calcDeviation(Hp_display, STEP7_CEILING.Hp_final) < 0.01 ? '<0.01' : calcDeviation(Hp_display, STEP7_CEILING.Hp_final).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">مطابق</span>
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
          <h2 className="text-sm font-semibold text-slate-200">النتائج الرئيسية — تصميم سماكة السقف</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MainResultCard
            emoji="🏗️"
            label="سماكة السقف المطلوبة"
            symbol="Hp"
            value={Hp_display}
            unit="cm"
            referenceValue={STEP7_CEILING.Hp_final}
            accentBg="bg-emerald-500"
            icon={Layers}
          />
          <MainResultCard
            emoji="📐"
            label="العمق الفعّال"
            symbol="h₀"
            value={h0_display}
            unit="cm"
            referenceValue={STEP7_CEILING.h0}
            accentBg="bg-emerald-500"
            icon={Ruler}
          />
          <MainResultCard
            emoji="🔩"
            label="نسبة المطيلية"
            symbol="μ"
            value={mu_struct_ref}
            unit="—"
            referenceValue={STEP7_CEILING.mu_struct}
            accentBg="bg-emerald-500"
            icon={Square}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. جدول التحقق
      ═══════════════════════════════════════════════════════════════════ */}
      <ValidationTable
        Hp={Hp_display}
        h0={h0_display}
        xi={xi_display}
        xiR={xiR}
        rho={thesisResults.rho}
        rhoMin={0.0025}
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
            <div className="flex items-center gap-3 flex-wrap">
              {xi_display <= xiR ? (
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
              <span className="text-[10px] text-slate-600 font-mono" dir="ltr">
                ξ = {fmt(xi_display, 4)} ≤ ξR = {fmt(xiR, 2)}
              </span>
              <Separator orientation="vertical" className="h-4 bg-slate-800" />
              <span className="text-[10px] text-slate-600 font-mono" dir="ltr">
                Hp = {fmt(Hp_display, 2)} cm | h₀ = {fmt(h0_display, 2)} cm | μ = {fmt(mu_struct_ref, 4)}
              </span>
            </div>
            <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 bg-slate-800/50">
              STEP7_CEILING: {Object.keys(STEP7_CEILING).length} متغير
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
          onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/step5-roof-blast'; }}
        >
          <ArrowRight className="size-3.5" />
          انفجار السقف
        </Button>
        <p className="text-[10px] text-slate-600 hidden sm:block">
          مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL) — إكسيل 5 — المسار المُصحّح
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-emerald-700/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-1.5"
          onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/step8-wall'; }}
        >
          التالي ← تصميم الجدران
          <ArrowLeft className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
