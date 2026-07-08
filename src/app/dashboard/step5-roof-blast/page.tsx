// ═══════════════════════════════════════════════════════════════════════
// الخطوة 5 — أحمال الانفجار على السقف (ديناميكي)
// منصة المدقق الديناميكي الموحد V3.1
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { useEngine } from '@/lib/engine/engine-context';
import { NoDataState } from '@/components/no-data-state';

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
import { ArrowDownFromLine, CheckCircle2, Lock, Calculator, AlertTriangle } from 'lucide-react';

function fmt(v: number, d = 4): string { return isFinite(v) ? v.toFixed(d) : '—'; }

export default function Step5RoofBlastPage() {
  const { engineOutput, hasComputed } = useEngine();

  if (!hasComputed || !engineOutput) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Header />
        <NoDataState description="أدخل معطيات المشروع ثم احسب للحصول على أحمال الانفجار على السقف" />
      </div>
    );
  }

  const blast = engineOutput.intermediates.blast;

  const rows = [
    { symbol: 'Z', label: 'البعد المختزل', value: blast.scaledDistanceZ, unit: 'm/kg^1/3', locked: true },
    { symbol: 'Pso', label: 'الضغط الجانبي', value: blast.pSideOnMpa, unit: 'MPa', locked: true },
    { symbol: 'Pr', label: 'الضغط المنعكس', value: blast.pReflectedMpa, unit: 'MPa', locked: true },
    { symbol: 'T0', label: 'مدة الطور الموجب', value: blast.durationMs, unit: 'ms', locked: true },
    { symbol: 'τ+', label: 'زمن الطور الموجب', value: blast.tauPlus, unit: 's', locked: false },
    { symbol: 'τэф', label: 'الزمن الفعال', value: blast.tauEffective, unit: 's', locked: true },
    { symbol: 'P_design', label: 'الضغط التصميمي', value: blast.pDesignMpa, unit: 'MPa', locked: true },
    { symbol: 'σ_max', label: 'الإجهاد الأقصى في التربة', value: blast.sigmaMaxMpa, unit: 'MPa', locked: false },
    { symbol: 'R_cr', label: 'البعد الحرج', value: blast.rCritical, unit: 'm', locked: false },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <Header />

      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 mb-2">
        <CheckCircle2 className="w-3 h-3 ml-1" /> تم الحساب
      </Badge>

      {/* النتائج الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-rose-500/30 bg-rose-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-slate-500 text-xs mb-1">الضغط التصميمي</p>
            <p className="text-3xl font-mono font-bold text-rose-400">{fmt(blast.pDesignMpa, 3)}</p>
            <p className="text-slate-500 text-xs">MPa</p>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/30 bg-cyan-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-slate-500 text-xs mb-1">الزمن الفعال</p>
            <p className="text-3xl font-mono font-bold text-cyan-400">{fmt(blast.tauEffective, 4)}</p>
            <p className="text-slate-500 text-xs">s</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-slate-500 text-xs mb-1">الضغط المنعكس</p>
            <p className="text-3xl font-mono font-bold text-amber-400">{fmt(blast.pReflectedMpa, 3)}</p>
            <p className="text-slate-500 text-xs">MPa</p>
          </CardContent>
        </Card>
      </div>

      {/* شروط الديناميكية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-800/60 bg-slate-950/80">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-slate-400 text-sm">شرط الديناميكية</span>
            <Badge variant={blast.dynamicConditionMet ? 'default' : 'destructive'} className={blast.dynamicConditionMet ? 'bg-emerald-600' : ''}>
              {blast.dynamicConditionMet ? 'مُحقق ✓' : 'غير مُحقق ✗'}
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-slate-800/60 bg-slate-950/80">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-slate-400 text-sm">شرط نواة المقطع</span>
            <Badge variant={blast.coreConditionMet ? 'default' : 'destructive'} className={blast.coreConditionMet ? 'bg-emerald-600' : ''}>
              {blast.coreConditionMet ? 'مُحقق ✓' : 'غير مُحقق ✗'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* جدول القيم */}
      <Card className="border-slate-800/60 bg-slate-950/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-rose-400" />
            القيم المحسوبة — انفجار السقف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800/60 hover:bg-transparent">
                <TableHead className="text-slate-500 text-xs">الرمز</TableHead>
                <TableHead className="text-slate-500 text-xs">الوصف</TableHead>
                <TableHead className="text-slate-500 text-xs text-center">القيمة</TableHead>
                <TableHead className="text-slate-500 text-xs text-center">الوحدة</TableHead>
                <TableHead className="text-slate-500 text-xs text-center">مقفل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.symbol} className="border-slate-800/40 hover:bg-slate-900/40">
                  <TableCell className="font-mono text-cyan-400 text-sm font-bold">{r.symbol}</TableCell>
                  <TableCell className="text-slate-300 text-sm">{r.label}</TableCell>
                  <TableCell className="text-center font-mono text-slate-100 text-sm">{fmt(r.value)}</TableCell>
                  <TableCell className="text-center text-slate-500 text-xs">{r.unit}</TableCell>
                  <TableCell className="text-center">
                    {r.locked ? <Lock className="w-3.5 h-3.5 text-amber-500 mx-auto" /> : <span className="text-slate-600 text-xs">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20">
        <ArrowDownFromLine className="w-5 h-5 text-rose-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-100">أحمال الانفجار — السقف</h1>
        <p className="text-xs text-slate-500">الضغط التصميمي والأحمال الديناميكية على سقف المنشأة</p>
      </div>
    </div>
  );
}
