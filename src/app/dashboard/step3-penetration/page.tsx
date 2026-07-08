// ═══════════════════════════════════════════════════════════════════════
// الخطوة 3 — حسابات الاختراق (ديناميكي)
// منصة المدقق الديناميكي الموحد V3.1
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { useEngine } from '@/lib/engine/engine-context';
import { STEP3_PENETRATION } from '@/lib/constants/reference-data';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

function fmt(value: number, decimals: number = 4): string {
  if (!isFinite(value)) return '—';
  return value.toFixed(decimals);
}

// ═══════════════════════════════════════════════════════════════════════
// عرض حالة "لم يتم الحساب بعد"
// ═══════════════════════════════════════════════════════════════════════

function NoDataState() {
  return (
    <Card className="border-amber-500/30 bg-amber-950/20">
      <CardContent className="flex flex-col items-center gap-4 py-10">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Calculator className="w-8 h-8 text-amber-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-amber-300 font-bold text-lg">لم يتم حساب النتائج بعد</h3>
          <p className="text-slate-500 text-sm max-w-md">
            أدخل معطيات المشروع (القنبلة، التربة، الأبعاد) في صفحة المدخلات ثم اضغط &quot;احسب&quot; للحصول على نتائج الاختراق
          </p>
        </div>
        <Link href="/dashboard/step2-inputs">
          <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
            <ArrowRight className="w-4 h-4 ml-1.5" />
            انتقل إلى صفحة المدخلات
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function Step3PenetrationPage() {
  const { engineOutput, hasComputed } = useEngine();

  // إذا لم يتم الحساب بعد
  if (!hasComputed || !engineOutput) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">حسابات الاختراق</h1>
            <p className="text-xs text-slate-500">عمق اختراق القنبلة في التربة — المعادلات 13-19</p>
          </div>
        </div>
        <NoDataState />
      </div>
    );
  }

  const pen = engineOutput.intermediates.penetration;
  const warnings = pen.warningMessages ?? [];

  // جدول القيم المحسوبة
  const rows = [
    { symbol: 'λ₁', label: 'معامل شكل الرأس', value: pen.lambda1, unit: '—', locked: true },
    { symbol: 'λ₂', label: 'معامل تأثير القطر', value: pen.lambda2, unit: '—', locked: true },
    { symbol: 'n', label: 'أُس التأثير', value: pen.nExp, unit: '—', locked: false },
    { symbol: 'Cэф', label: 'الشحنة الفعالة', value: pen.cEffective, unit: 'kg', locked: true },
    { symbol: 'ц', label: 'إزاحة مركز الانفجار', value: pen.tsu, unit: 'm', locked: false },
    { symbol: 'hпр', label: 'عمق اختراق القنبلة', value: pen.penetrationDepth, unit: 'm', locked: true },
    { symbol: 'hз', label: 'عمق ما دون الحفرة', value: pen.craterDepth, unit: 'm', locked: false },
    { symbol: 'hз¯', label: 'العمق المكافئ المختزل', value: pen.hBarZ, unit: '—', locked: false },
    { symbol: 'hсп', label: 'سماكة Spalling المطلوبة', value: pen.requiredSpallingThickness, unit: 'm', locked: true },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">حسابات الاختراق</h1>
            <p className="text-xs text-slate-500">عمق اختراق القنبلة في التربة — المعادلات 13-19</p>
          </div>
        </div>
        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 ml-1" />
          تم الحساب
        </Badge>
      </div>

      {/* النتائج الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-slate-500 text-xs mb-1">عمق الاختراق</p>
            <p className="text-3xl font-mono font-bold text-emerald-400">{fmt(pen.penetrationDepth, 2)}</p>
            <p className="text-slate-500 text-xs">m</p>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/30 bg-cyan-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-slate-500 text-xs mb-1">الشحنة الفعالة</p>
            <p className="text-3xl font-mono font-bold text-cyan-400">{fmt(pen.cEffective, 2)}</p>
            <p className="text-slate-500 text-xs">kg</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-slate-500 text-xs mb-1">سماكة Spalling</p>
            <p className="text-3xl font-mono font-bold text-amber-400">{fmt(pen.requiredSpallingThickness, 2)}</p>
            <p className="text-slate-500 text-xs">m</p>
          </CardContent>
        </Card>
      </div>

      {/* تحذيرات */}
      {warnings.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-bold">تحذيرات</span>
            </div>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-yellow-400/80 text-xs">{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* جدول القيم التفصيلية */}
      <Card className="border-slate-800/60 bg-slate-950/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            القيم المحسوبة التفصيلية
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
              {rows.map((row) => (
                <TableRow key={row.symbol} className="border-slate-800/40 hover:bg-slate-900/40">
                  <TableCell className="font-mono text-cyan-400 text-sm font-bold">{row.symbol}</TableCell>
                  <TableCell className="text-slate-300 text-sm">{row.label}</TableCell>
                  <TableCell className="text-center font-mono text-slate-100 text-sm">{fmt(row.value)}</TableCell>
                  <TableCell className="text-center text-slate-500 text-xs">{row.unit}</TableCell>
                  <TableCell className="text-center">
                    {row.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500 mx-auto" />
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* شرح المحرك */}
      {pen.explanation && (
        <Card className="border-slate-800/60 bg-slate-950/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-blue-400" />
              شرح المحرك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-xs leading-relaxed">{pen.explanation}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
