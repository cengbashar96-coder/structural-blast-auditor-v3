// ═══════════════════════════════════════════════════════════════════════
// الخطوة 7 — المقارنة بين الأشكال والأطروحة (ديناميكي)
// منصة المدقق الديناميكي الموحد V3.1
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { useEngine } from '@/lib/engine/engine-context';
import { NoDataState } from '@/components/no-data-state';
import type { GeometryType } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { BookOpen, CheckCircle2, ArrowRightLeft, Trophy, AlertTriangle } from 'lucide-react';

function fmt(v: number, d = 2): string { return isFinite(v) ? v.toFixed(d) : '—'; }

const GEO_LABELS: Record<GeometryType, { ar: string; color: string }> = {
  RECTANGULAR: { ar: 'مستطيل', color: 'cyan' },
  CIRCULAR: { ar: 'دائري', color: 'purple' },
  ARCHED: { ar: 'قوسي', color: 'amber' },
};

export default function ThesisComparisonPage() {
  const { engineOutput, hasComputed } = useEngine();

  if (!hasComputed || !engineOutput) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Header />
        <NoDataState description="أدخل معطيات المشروع ثم احسب للحصول على مقارنة الأشكال الهندسية" />
      </div>
    );
  }

  const { structural, comparison } = engineOutput;
  const recommended = comparison.recommendedGeometry;
  const matrix = comparison.comparisonMatrix;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <Header />

      {/* التوصية */}
      <Card className="border-emerald-500/30 bg-emerald-950/20">
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-300 text-sm font-bold">الشكل الهندسي الموصى به</p>
              <p className="text-3xl font-bold text-emerald-400">{GEO_LABELS[recommended].ar}</p>
              <p className="text-slate-500 text-xs mt-1">{comparison.explanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول المقارنة */}
      <Card className="border-slate-800/60 bg-slate-950/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-base flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            مصفوفة المقارنة بين الأشكال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800/60 hover:bg-transparent">
                <TableHead className="text-slate-500 text-xs">المعيار</TableHead>
                {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
                  <TableHead key={geo} className="text-center text-xs">
                    <span className="font-bold">{GEO_LABELS[geo].ar}</span>
                    {geo === recommended && <Badge className="mr-1 bg-emerald-600 text-white text-[10px] px-1">موصى</Badge>}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-slate-800/40 hover:bg-slate-900/40">
                <TableCell className="text-slate-300 text-sm">السماكة (cm)</TableCell>
                {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
                  <TableCell key={geo} className="text-center font-mono text-sm text-slate-100">
                    {fmt(matrix[geo].thicknessMeters * 100, 1)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-slate-800/40 hover:bg-slate-900/40">
                <TableCell className="text-slate-300 text-sm">وزن الحديد (طن)</TableCell>
                {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
                  <TableCell key={geo} className="text-center font-mono text-sm text-slate-100">
                    {fmt(matrix[geo].steelWeightTon, 2)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-slate-800/40 hover:bg-slate-900/40">
                <TableCell className="text-slate-300 text-sm">حجم الخرسانة (m³)</TableCell>
                {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
                  <TableCell key={geo} className="text-center font-mono text-sm text-slate-100">
                    {fmt(matrix[geo].concreteVolumeM3, 1)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-slate-800/40 hover:bg-slate-900/40">
                <TableCell className="text-slate-300 text-sm">العزم الديناميكي (kN.m)</TableCell>
                {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
                  <TableCell key={geo} className="text-center font-mono text-sm text-slate-100">
                    {fmt(matrix[geo].maxDynamicMomentKnM, 1)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-slate-800/40 hover:bg-slate-900/40">
                <TableCell className="text-slate-300 text-sm">حالة الأمان</TableCell>
                {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
                  <TableCell key={geo} className="text-center">
                    <Badge variant={matrix[geo].safetyStatus === 'SUCCESS' ? 'default' : 'destructive'}
                      className={matrix[geo].safetyStatus === 'SUCCESS' ? 'bg-emerald-600' : ''}>
                      {matrix[geo].safetyStatus === 'SUCCESS' ? 'آمن ✓' : matrix[geo].safetyStatus === 'WARNING' ? 'تحذير ⚠' : 'خطر ✗'}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* تفصيل كل شكل */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => {
          const s = structural[geo];
          return (
            <Card key={geo} className={`border-${GEO_LABELS[geo].color}-500/30 bg-${GEO_LABELS[geo].color}-950/20`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  {GEO_LABELS[geo].ar}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">السماكة</span>
                  <span className="font-mono text-slate-200">{fmt(s.requiredThicknessMeters * 100, 1)} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التسليح</span>
                  <span className="font-mono text-slate-200">{fmt(s.requiredSteelAreaCm2PerMeter, 2)} cm²/m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المطاوعة</span>
                  <span className="font-mono text-slate-200">μ = {fmt(s.ductilityRatio, 3)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">الأمان</span>
                  <Badge variant={s.validation.status === 'SUCCESS' ? 'default' : 'destructive'}
                    className={s.validation.status === 'SUCCESS' ? 'bg-emerald-600' : ''}>
                    {s.validation.status === 'SUCCESS' ? 'مقبول' : 'مرفوض'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <BookOpen className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-100">المقارنة بين الأشكال</h1>
        <p className="text-xs text-slate-500">مقارنة المقاطع المستطيلة والدائرية والقوسية والتوصية بالأفضل</p>
      </div>
    </div>
  );
}
