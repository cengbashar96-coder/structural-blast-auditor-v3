// ═══════════════════════════════════════════════════════════════════════
// صفحة الرسوم الهندسية — Structural Drawings
// منصة المدقق الديناميكي الموحد V3.1
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { useEngine } from '@/lib/engine/engine-context';
import { NoDataState } from '@/components/no-data-state';
import { CrossSectionSVG } from '@/components/structural/cross-section-svg';
import { LongitudinalSectionSVG } from '@/components/structural/longitudinal-section-svg';
import type { GeometryType } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PenTool, CheckCircle2, AlertTriangle,
} from 'lucide-react';

const GEO: Record<GeometryType, { ar: string }> = {
  RECTANGULAR: { ar: 'مستطيل' },
  CIRCULAR: { ar: 'دائري' },
  ARCHED: { ar: 'قوسي' },
};

export default function StructuralDrawingsPage() {
  const { engineOutput, hasComputed, userInput } = useEngine();

  if (!hasComputed || !engineOutput) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Header />
        <NoDataState description="أدخل معطيات المشروع ثم احسب للحصول على الرسوم الهندسية" />
      </div>
    );
  }

  const { structural, comparison, intermediates } = engineOutput;
  const recommended = comparison.recommendedGeometry;
  const pen = intermediates.penetration;
  const blast = intermediates.blast;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <Header />

      <Card className="border-emerald-500/30 bg-emerald-950/20">
        <CardContent className="flex items-center gap-3 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm">الرسوم الهندسية جاهزة — اختر الشكل لعرض المقطع</p>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 mr-auto">
            الموصى: {GEO[recommended].ar}
          </Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue={recommended} className="space-y-4">
        <TabsList className="bg-slate-900/60 border border-slate-800/60">
          {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => (
            <TabsTrigger key={geo} value={geo} className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-300">
              {GEO[geo].ar}
              {geo === recommended && <Badge className="mr-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0">موصى</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>

        {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => {
          const s = structural[geo];
          return (
            <TabsContent key={geo} value={geo} className="space-y-6">
              {/* المقطع العرضي */}
              <Card className="border-slate-800/60 bg-slate-950/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-cyan-400" />
                      المقطع العرضي — {GEO[geo].ar}
                    </CardTitle>
                    <Badge variant={s.validation.status === 'SUCCESS' ? 'default' : 'destructive'}
                      className={s.validation.status === 'SUCCESS' ? 'bg-emerald-600' : ''}>
                      {s.validation.status === 'SUCCESS' ? 'مقبول ✓' : s.validation.status === 'WARNING' ? 'تحذير ⚠' : 'مرفوض ✗'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-950 rounded-lg border border-slate-800/40 p-2">
                    <CrossSectionSVG
                      geometryType={geo}
                      userInput={userInput}
                      structural={s}
                      isRecommended={geo === recommended}
                      pDesignMpa={blast.pDesignMpa}
                      penetrationDepth={pen.penetrationDepth}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* المقطع الطولي */}
              <Card className="border-slate-800/60 bg-slate-950/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-amber-400" />
                    المقطع الطولي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-950 rounded-lg border border-slate-800/40 p-2">
                    <LongitudinalSectionSVG
                      userInput={userInput}
                      penetrationDepth={pen.penetrationDepth}
                      blastRadius={blast.rCritical}
                      pDesignMpa={blast.pDesignMpa}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ملخص */}
              <Card className="border-slate-800/60 bg-slate-950/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200 text-sm">ملخص النتائج — {GEO[geo].ar}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <Chip label="سماكة السقف" value={`${(s.requiredThicknessMeters * 100).toFixed(1)} cm`} c="cyan" />
                    <Chip label="التسليح" value={`${s.requiredSteelAreaCm2PerMeter.toFixed(2)} cm²/m`} c="purple" />
                    <Chip label="المطاوعة" value={`μ = ${s.ductilityRatio.toFixed(3)}`} c="amber" />
                    <Chip label="اللامركزية" value={`e/h = ${s.validation.eccentricityRatio.toFixed(3)}`} c="slate" />
                    <Chip label="القص الثاقب" value={`${s.validation.punchingShearRatio.toFixed(3)}`} c="slate" />
                    <Chip label="نسبة التسليح" value={`${s.validation.reinforcementRatio.toFixed(4)}`} c="slate" />
                  </div>
                  {s.validation.failures.length > 0 && (
                    <div className="mt-3 bg-red-950/30 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-xs font-bold mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> إخفاقات:
                      </p>
                      <ul className="space-y-0.5">
                        {s.validation.failures.map((f, i) => (
                          <li key={i} className="text-red-400/80 text-xs">{f}</li>
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

      {/* مقارنة */}
      <Card className="border-slate-800/60 bg-slate-950/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">مقارنة سريعة بين الأشكال</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map(geo => {
              const s = structural[geo];
              return (
                <div key={geo} className={`rounded-lg border p-3 text-center ${geo === recommended ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-slate-800/40 bg-slate-900/40'}`}>
                  <p className="text-xs text-slate-500 mb-1">{GEO[geo].ar}</p>
                  <p className="text-lg font-mono font-bold text-slate-200">{(s.requiredThicknessMeters * 100).toFixed(1)} cm</p>
                  <p className="text-[10px] text-slate-600">سماكة السقف</p>
                  {geo === recommended && <Badge className="mt-1 bg-emerald-600 text-white text-[9px]">✦ الأفضل</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <PenTool className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-100">الرسوم الهندسية</h1>
        <p className="text-xs text-slate-500">المقطع العرضي والطولي مع النتائج على الرسم</p>
      </div>
    </div>
  );
}

function Chip({ label, value, c }: { label: string; value: string; c: string }) {
  const m: Record<string, string> = {
    cyan: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300',
    purple: 'border-purple-500/30 bg-purple-950/30 text-purple-300',
    amber: 'border-amber-500/30 bg-amber-950/30 text-amber-300',
    slate: 'border-slate-700/50 bg-slate-900/40 text-slate-300',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${m[c] ?? m.slate}`}>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-xs font-mono font-bold">{value}</p>
    </div>
  );
}
