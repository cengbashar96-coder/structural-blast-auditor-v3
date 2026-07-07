// ═══════════════════════════════════════════════════════════════════════
// الخطوة 5 (سقف): أحمال الانفجار على السقف
// منصة المدقق الديناميكي الموحد V3.1
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { STEP5_ROOF } from '@/lib/constants/reference-data';
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
import {
  Zap,
  ArrowDownFromLine,
  ArrowRightLeft,
  Lock,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function fmt(val: number, decimals: number = 4): string {
  if (!isFinite(val)) return '∞';
  return val.toFixed(decimals);
}

// ═══════════════════════════════════════════════════════════════════════
// واجهة صف البيانات
// ═══════════════════════════════════════════════════════════════════════

interface ParamRow {
  symbol: string;
  label: string;
  value: string;
  unit: string;
  note?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: جدول المعاملات
// ═══════════════════════════════════════════════════════════════════════

function ParamsTable({ rows }: { rows: ParamRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700/50 hover:bg-transparent">
          <TableHead className="text-slate-400 text-xs font-medium">الرمز</TableHead>
          <TableHead className="text-slate-400 text-xs font-medium">الوصف</TableHead>
          <TableHead className="text-slate-400 text-xs font-medium text-center">القيمة</TableHead>
          <TableHead className="text-slate-400 text-xs font-medium">الوحدة</TableHead>
          <TableHead className="text-slate-400 text-xs font-medium">ملاحظة</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i} className="border-slate-800/40 hover:bg-slate-800/30">
            <TableCell className="font-mono text-emerald-400 font-semibold text-sm" dir="ltr">
              {row.symbol}
            </TableCell>
            <TableCell className="text-slate-300 text-sm">
              {row.label}
            </TableCell>
            <TableCell className="text-center font-mono text-emerald-400 font-bold text-sm" dir="ltr">
              {row.value}
            </TableCell>
            <TableCell className="text-slate-500 text-xs" dir="ltr">
              {row.unit}
            </TableCell>
            <TableCell className="text-slate-500 text-xs">
              {row.note || '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية — الخطوة 5 سقف
// ═══════════════════════════════════════════════════════════════════════

export default function Step5RoofBlastPage() {
  const d = STEP5_ROOF;

  // ── المعاملات الهندسية ──
  const geoParams: ParamRow[] = [
    { symbol: 'h̄', label: 'النسبة المختزلة للسماكة', value: fmt(d.h_bar, 4), unit: '—', note: 'مختزل' },
    { symbol: 'R̄_b1', label: 'البعد المختزل', value: fmt(d.R_bar_b1, 2), unit: '—' },
    { symbol: 'R_ekv', label: 'البعد المكافئ', value: fmt(d.R_ekv, 4), unit: 'm' },
    { symbol: 'R*', label: 'البعد الحرج', value: fmt(d.R_star, 4), unit: 'm' },
    {
      symbol: 'R_ekv > R*',
      label: 'شرط التحقق',
      value: d.R_ekv_gt_R_star ? '✓ محقق' : '✗ غير محقق',
      unit: '—',
      note: d.R_ekv_gt_R_star ? 'R_ekv > R*' : 'انحراف!',
    },
  ];

  // ── المعاملات الديناميكية ──
  const dynParams: ParamRow[] = [
    { symbol: 'ω', label: 'التردد الدائري', value: fmt(d.omega, 3), unit: 'rad/s' },
    { symbol: 'C_dyn', label: 'سرعة الانتشار الديناميكي', value: fmt(d.C_dyn, 3), unit: 'm/s' },
    { symbol: 'τ', label: 'زمن التأثير', value: fmt(d.tau, 4), unit: 's' },
    { symbol: 'τ_ef', label: 'الزمن الفعال', value: fmt(d.tau_ef, 4), unit: 's', note: 'فعّال' },
    { symbol: 'τ_n', label: 'زمن الدورة الطبيعية', value: fmt(d.tau_n, 4), unit: 's' },
  ];

  // ── أحمال الضغط ──
  const pressureParams: ParamRow[] = [
    { symbol: 'Pmax', label: 'الضغط الأقصى', value: fmt(d.Pmax, 4), unit: 'kg/cm²' },
    { symbol: 'Kd', label: 'معامل الديناميكية', value: fmt(d.Kd, 2), unit: '—' },
    { symbol: 'kψ', label: 'معامل التخامد', value: fmt(d.kpsi, 2), unit: '—' },
    { symbol: 'P_ekv', label: 'الضغط المكافئ', value: fmt(d.P_ekv, 4), unit: 'kg/cm²' },
    { symbol: 'Pct', label: 'الضغط الثابت', value: fmt(d.Pct, 4), unit: 'kg/cm²' },
  ];

  // ── المعاملات الإنشائية ──
  const structParams: ParamRow[] = [
    { symbol: 'μ_struct', label: 'معامل التسليح', value: fmt(d.mu_struct, 4), unit: '—' },
    { symbol: 'η', label: 'معامل الأمان الإضافي', value: fmt(d.eta, 4), unit: '—' },
    { symbol: 'Rsd', label: 'مقاومة التسليح الديناميكية', value: fmt(d.Rsd, 1), unit: 'kg/cm²' },
    { symbol: 'Rbd', label: 'مقاومة الخرسانة الديناميكية', value: fmt(d.Rbd, 1), unit: 'kg/cm²' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── رأس الصفحة ── */}
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
              <Zap className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                الخطوة 5 (سقف): أحمال الانفجار على السقف
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                منصة المدقق الديناميكي الموحد V3.1 — مسار السقف
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20 text-xs">
              <Lock className="size-3 ml-1" />
              مقفل BMK-02
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
              مسار: سقف
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
              الخطوة 5
            </Badge>
          </div>
          <Separator className="bg-slate-800/60" />
        </header>

        {/* ── بطاقة Pp المميزة ── */}
        <Card className="bg-slate-900/80 border-emerald-500/40 border-2 shadow-lg shadow-emerald-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <AlertTriangle className="size-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">
                  الحمل التصميمي على السقف
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pp — القيمة الحاكمة للتصميم الإنشائي
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight" dir="ltr">
                {fmt(d.Pp, 4)}
              </span>
              <span className="text-lg text-slate-400 font-medium">kg/cm²</span>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-mono" dir="ltr">
              Pp = P_ekv + Pct = {fmt(d.P_ekv, 4)} + {fmt(d.Pct, 4)} = {fmt(d.Pp, 4)} kg/cm²
            </p>
          </CardContent>
        </Card>

        {/* ── أ) المعاملات الهندسية ── */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowDownFromLine className="size-4 text-emerald-400" />
              <CardTitle className="text-base text-slate-200">
                أ) المعاملات الهندسية
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 mr-auto">
                Geometric Parameters
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-2">
            <ParamsTable rows={geoParams} />
          </CardContent>
        </Card>

        {/* ── ب) المعاملات الديناميكية ── */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-emerald-400" />
              <CardTitle className="text-base text-slate-200">
                ب) المعاملات الديناميكية
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 mr-auto">
                Dynamic Parameters
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-2">
            <ParamsTable rows={dynParams} />
          </CardContent>
        </Card>

        {/* ── ج) أحمال الضغط ── */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-emerald-400" />
              <CardTitle className="text-base text-slate-200">
                ج) أحمال الضغط
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 mr-auto">
                Pressure Loads
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-2">
            <ParamsTable rows={pressureParams} />
          </CardContent>
        </Card>

        {/* ── د) المعاملات الإنشائية ── */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-400" />
              <CardTitle className="text-base text-slate-200">
                د) المعاملات الإنشائية
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 mr-auto">
                Structural Coefficients
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-2">
            <ParamsTable rows={structParams} />
          </CardContent>
        </Card>

        {/* ── ملخص سريع ── */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="size-4 text-emerald-400" />
              <CardTitle className="text-base text-slate-200">
                ملخص الحمل التصميمي
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1 text-center">
                <p className="text-xs text-slate-500">Pmax</p>
                <p className="text-lg font-bold text-emerald-400 font-mono" dir="ltr">{fmt(d.Pmax, 4)}</p>
                <p className="text-[10px] text-slate-600">kg/cm²</p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs text-slate-500">P_ekv</p>
                <p className="text-lg font-bold text-emerald-400 font-mono" dir="ltr">{fmt(d.P_ekv, 4)}</p>
                <p className="text-[10px] text-slate-600">kg/cm²</p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs text-slate-500">Pct</p>
                <p className="text-lg font-bold text-emerald-400 font-mono" dir="ltr">{fmt(d.Pct, 4)}</p>
                <p className="text-[10px] text-slate-600">kg/cm²</p>
              </div>
              <div className="space-y-1 text-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3">
                <p className="text-xs text-emerald-400 font-semibold">Pp (تصميمي)</p>
                <p className="text-2xl font-black text-emerald-400 font-mono" dir="ltr">{fmt(d.Pp, 4)}</p>
                <p className="text-[10px] text-emerald-500/70">kg/cm²</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── تنقل ── */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <Link
            href="/dashboard/step5-wall-blast"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ArrowRightLeft className="size-4" />
            مسار الجدار ←
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            لوحة التحكم
          </Link>
        </div>

      </div>
    </div>
  );
}
