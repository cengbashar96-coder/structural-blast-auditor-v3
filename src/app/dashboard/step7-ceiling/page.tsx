// ═══════════════════════════════════════════════════════════════════════
// الخطوة 7 — تصميم سماكة السقف (ديناميكي)
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Shield, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

function fmt(v: number, d = 2): string { return isFinite(v) ? v.toFixed(d) : '—'; }

const GEO_LABELS: Record<GeometryType, { ar: string; icon: string }> = {
  RECTANGULAR: { ar: 'مستطيل', icon: '▬' },
  CIRCULAR: { ar: 'دائري', icon: '●' },
  ARCHED: { ar: 'قوسي', icon: '⌓' },
};

export default function Step7CeilingPage() {
  const { engineOutput, hasComputed } = useEngine();

  if (!hasComputed || !engineOutput) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Header />
        <NoDataState description="أدخل معطيات المشروع ثم احسب للحصول على سماكة السقف المطلوبة" />
      </div>
    );
  }

  const { structural, comparison } = engineOutput;
  const recommended = comparison.recommendedGeometry;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <Header />
      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 mb-2">
        <CheckCircle2 className="w-3 h-3 ml-1" /> تم الحساب
      </Badge>

      {/* السماكة الموصى بها */}
      <Card className="border-emerald-500/30 bg-emerald-950/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs mb-1">الشكل الموصى به</p>
              <p className="text-2xl font-bold text-emerald-400">{GEO_LABELS[recommended].ar}</p>
            </div>
            <div className="text-left">
              <p className="text-slate-500 text-xs mb-1">سماكة السقف المطلوبة</p>
              <p className="text-3xl font-mono font-bold text-emerald-400">
                {fmt(structural[recommended].requiredThicknessMeters * 100, 1)}
                <span className="text-base text-slate-500 mr-1">cm</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مقارنة الأشكال */}
      <Tabs defaultValue={recommended} className="space-y-4">
        <TabsList className="bg-slate-900/60 border border-slate-800/60">
          {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
            <TabsTrigger
              key={geo}
              value={geo}
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-300"
            >
              <span className="ml-1">{GEO_LABELS[geo].icon}</span>
              {GEO_LABELS[geo].ar}
              {geo === recommended && (
                <Badge className="mr-2 bg-emerald-600 text-white text-[10px] px-1.5 py-0">موصى</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => {
          const s = structural[geo];
          const v = s.validation;
          return (
            <TabsContent key={geo} value={geo}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="border-cyan-500/30 bg-cyan-950/20">
                  <CardContent className="py-4 text-center">
                    <p className="text-slate-500 text-xs mb-1">السماكة المطلوبة</p>
                    <p className="text-3xl font-mono font-bold text-cyan-400">{fmt(s.requiredThicknessMeters * 100, 1)}</p>
                    <p className="text-slate-500 text-xs">cm</p>
                  </CardContent>
                </Card>
                <Card className="border-purple-500/30 bg-purple-950/20">
                  <CardContent className="py-4 text-center">
                    <p className="text-slate-500 text-xs mb-1">مساحة التسليح</p>
                    <p className="text-3xl font-mono font-bold text-purple-400">{fmt(s.requiredSteelAreaCm2PerMeter, 2)}</p>
                    <p className="text-slate-500 text-xs">cm²/m</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/30 bg-amber-950/20">
                  <CardContent className="py-4 text-center">
                    <p className="text-slate-500 text-xs mb-1">نسبة المطاوعة</p>
                    <p className="text-3xl font-mono font-bold text-amber-400">{fmt(s.ductilityRatio, 3)}</p>
                    <p className="text-slate-500 text-xs">μ</p>
                  </CardContent>
                </Card>
              </div>

              {/* تقرير التحقق */}
              <Card className="border-slate-800/60 bg-slate-950/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    تقرير التحقق — {GEO_LABELS[geo].ar}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={v.status === 'SUCCESS' ? 'default' : v.status === 'WARNING' ? 'secondary' : 'destructive'}
                      className={v.status === 'SUCCESS' ? 'bg-emerald-600' : ''}>
                      {v.status === 'SUCCESS' ? 'مقبول ✓' : v.status === 'WARNING' ? 'تحذير ⚠' : 'مرفوض ✗'}
                    </Badge>
                    <span className="text-slate-400 text-xs">{v.explanation}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <span className="text-slate-500">نسبة اللامركزية e/h</span>
                      <p className="font-mono text-slate-300">{fmt(v.eccentricityRatio, 3)}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-500">نسبة القص الثاقب</span>
                      <p className="font-mono text-slate-300">{fmt(v.punchingShearRatio, 3)}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-500">نسبة التسليح</span>
                      <p className="font-mono text-slate-300">{fmt(v.reinforcementRatio, 4)}</p>
                    </div>
                  </div>
                  {v.failures.length > 0 && (
                    <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-xs font-bold mb-1">إخفاقات:</p>
                      <ul className="space-y-0.5">
                        {v.failures.map((f, i) => (
                          <li key={i} className="text-red-400/80 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* شرح التوصية */}
      <Card className="border-slate-800/60 bg-slate-950/80">
        <CardContent className="py-3">
          <p className="text-slate-400 text-xs leading-relaxed">{comparison.explanation}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Shield className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-100">تصميم سماكة السقف</h1>
        <p className="text-xs text-slate-500">الحساب الإنشائي لسماكة السقف والتسليح المطلوب</p>
      </div>
    </div>
  );
}
