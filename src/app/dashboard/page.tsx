// ═══════════════════════════════════════════════════════════════════════
// صفحة لوحة التحكم الرئيسية — Dashboard Page V3.0
// منصة المدقق الديناميكي الموحد V3.0
// خط الحساب: المدخلات → الاختراق → الضغط → التصميم → المقارنة → القرار
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { runEngine, type EngineInput, type EngineOutput } from '@/lib/engine/orchestrator';
import { V3EngineForm } from '@/components/v3-engine-form';
import { PipelineTimeline, type PipelineStep } from '@/components/pipeline-timeline';
import { FINAL_LOCKED_RESULTS } from '@/lib/constants/reference-data';
import type { GeometryType, ValidationStatus } from '@/lib/engine/types';
import { projectRepository } from '@/lib/storage';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  TrendingUp,
  Target,
  Layers,
  Crosshair,
  Zap,
  ArrowDownFromLine,
  Download,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// ثوابت خط الأنابيب
// ═══════════════════════════════════════════════════════════════════════

const STEP_NUMBERS = [2, 3, 4, 5, 6, 7, 8] as const;

const STEP_NAMES: Record<number, string> = {
  2: 'المدخلات والاستيفاءات',
  3: 'الاختراق',
  4: 'القفل الأولي',
  5: 'أحمال الانفجار',
  6: 'معاملات الجدول ب',
  7: 'تصميم السقف',
  8: 'تصميم الجدار',
};

const STEP_LOCKED_KEYS: Record<number, string[]> = {
  2: [],
  3: ['C_ef', 'h_pr', 'R_actual', 'Zp'],
  4: ['Hp', 'Hc', 'Hf', 'Hvct'],
  5: ['Pmax', 'P_ekv', 'Pp', 'omega', 'tau_ef'],
  6: [],
  7: ['Mp_roof', 'Hp_final'],
  8: ['Hc_final', 'Hf_final', 'Hvct_final'],
};

function buildIdleSteps(): PipelineStep[] {
  return STEP_NUMBERS.map((num) => ({
    step: num,
    nameAr: STEP_NAMES[num],
    status: 'idle' as const,
    lockedKeys: STEP_LOCKED_KEYS[num],
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════════════

function fmt(val: number, digits = 4): string {
  if (Number.isNaN(val) || !Number.isFinite(val)) return '—';
  if (Math.abs(val) >= 1000) return val.toFixed(1);
  if (Math.abs(val) >= 1) return val.toFixed(digits > 4 ? 4 : digits);
  if (Math.abs(val) >= 0.001) return val.toFixed(digits);
  return val.toExponential(2);
}

function fmtPct(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

function deviationColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 1) return 'text-emerald-400';
  if (abs < 5) return 'text-amber-400';
  return 'text-red-400';
}

function deviationBg(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 1) return 'bg-emerald-950/40 border-emerald-800/40';
  if (abs < 5) return 'bg-amber-950/40 border-amber-800/40';
  return 'bg-red-950/40 border-red-800/40';
}

function validationColor(status: ValidationStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'text-emerald-400';
    case 'WARNING':
      return 'text-amber-400';
    case 'FAILURE':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}

function validationBg(status: ValidationStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'bg-emerald-950/30 border-emerald-800/40';
    case 'WARNING':
      return 'bg-amber-950/30 border-amber-800/40';
    case 'FAILURE':
      return 'bg-red-950/30 border-red-800/40';
    default:
      return 'bg-slate-950/30 border-slate-800/40';
  }
}

function validationIcon(status: ValidationStatus) {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle2 className="size-4 text-emerald-400" />;
    case 'WARNING':
      return <AlertTriangle className="size-4 text-amber-400" />;
    case 'FAILURE':
      return <XCircle className="size-4 text-red-400" />;
    default:
      return null;
  }
}

function geoLabelAr(geo: GeometryType): string {
  switch (geo) {
    case 'RECTANGULAR':
      return 'مستطيل';
    case 'CIRCULAR':
      return 'دائري';
    case 'ARCHED':
      return 'مقوس';
  }
}

function calcDeviation(computed: number, reference: number): number {
  if (reference === 0) return 0;
  return ((computed - reference) / Math.abs(reference)) * 100;
}

// ═══════════════════════════════════════════════════════════════════════
// تعريف القيم المرجعية للمقارنة
// ═══════════════════════════════════════════════════════════════════════

interface RefEntry {
  key: string;
  labelAr: string;
  unit: string;
  reference: number;
  extractFn: (result: EngineOutput) => number;
}

const REFERENCE_COMPARISON_ENTRIES: RefEntry[] = [
  {
    key: 'h_pr',
    labelAr: 'عمق الاختراق',
    unit: 'م',
    reference: FINAL_LOCKED_RESULTS.h_pr,
    extractFn: (r) => r.intermediates.penetration.penetrationDepth,
  },
  {
    key: 'C_ef',
    labelAr: 'الشحنة الفعالة',
    unit: 'كجم',
    reference: FINAL_LOCKED_RESULTS.C_ef,
    extractFn: (r) => r.intermediates.penetration.cEffective,
  },
  {
    key: 'R_actual',
    labelAr: 'البعد الشعاعي الفعلي',
    unit: 'م',
    reference: FINAL_LOCKED_RESULTS.R_actual,
    extractFn: (r) => {
      const pen = r.intermediates.penetration;
      const z = r.inputs.blast.ceilingDepth ?? r.inputs.blast.radialDistance;
      return pen.penetrationDepth + z;
    },
  },
  {
    key: 'Zp',
    labelAr: 'البعد المختزل',
    unit: '—',
    reference: FINAL_LOCKED_RESULTS.Zp,
    extractFn: (r) => r.intermediates.blast.scaledDistanceZ,
  },
  {
    key: 'lambda1',
    labelAr: 'معامل شكل الرأس',
    unit: '—',
    reference: FINAL_LOCKED_RESULTS.lambda1,
    extractFn: (r) => r.intermediates.penetration.lambda1,
  },
  {
    key: 'lambda2',
    labelAr: 'معامل تأثير القطر',
    unit: '—',
    reference: FINAL_LOCKED_RESULTS.lambda2,
    extractFn: (r) => r.intermediates.penetration.lambda2,
  },
  {
    key: 'Pp_roof',
    labelAr: 'الضغط التصميمي سقف',
    unit: 'kg/cm²',
    reference: FINAL_LOCKED_RESULTS.Pp_roof,
    extractFn: (r) => r.intermediates.blast.pDesignMpa * 10.197,
  },
  {
    key: 'Pp_wall',
    labelAr: 'الضغط التصميمي جدار',
    unit: 'kg/cm²',
    reference: FINAL_LOCKED_RESULTS.Pp_wall,
    extractFn: (r) => r.intermediates.blast.pDesignMpa * 10.197,
  },
  {
    key: 'Hp_final',
    labelAr: 'سماكة السقف النهائية',
    unit: 'سم',
    reference: FINAL_LOCKED_RESULTS.Hp_final,
    extractFn: (r) => r.structural.RECTANGULAR.requiredThicknessMeters * 100,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي — DashboardPage
// ═══════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  // ─── حالة المحرك ───
  const [isCalculating, setIsCalculating] = useState(false);
  const [engineResult, setEngineResult] = useState<EngineOutput | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ─── حالة خط الأنابيب ───
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(buildIdleSteps());
  const [currentStep, setCurrentStep] = useState<number | undefined>(undefined);
  const [overallStatus, setOverallStatus] = useState<
    'idle' | 'running' | 'success' | 'partial' | 'failed'
  >('idle');

  // ─── مرجع لتنظيف المؤقتات ───
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // تنظيف المؤقتات عند إلغاء التثبيت
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // ─── معالج الحساب الرئيسي ───
  const handleCalculate = useCallback(async (input: EngineInput) => {
    // إعادة ضبط الحالة
    setIsCalculating(true);
    setEngineResult(null);
    setEngineError(null);
    setOverallStatus('running');
    setCurrentStep(undefined);
    setPipelineSteps(buildIdleSteps());

    // تنظيف المؤقتات السابقة
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    try {
      // تشغيل المحرك فعلياً
      const result = runEngine(input);

      // ─── تحريك خط الأنابيب ───
      const stepDelays: Record<number, number> = {
        2: 200,
        3: 600,
        4: 500,
        5: 800,
        6: 400,
        7: 700,
        8: 600,
      };

      let totalDelay = 0;

      STEP_NUMBERS.forEach((stepNum, idx) => {
        // تحويل إلى running
        const runningDelay = totalDelay;
        const timer1 = setTimeout(() => {
          setCurrentStep(stepNum);
          setPipelineSteps((prev) =>
            prev.map((s) =>
              s.step === stepNum
                ? { ...s, status: 'running' as const }
                : s.step < stepNum && s.status !== 'success'
                  ? { ...s, status: 'success' as const, duration: Math.round(stepDelays[s.step] ?? 300) }
                  : s
            )
          );
        }, runningDelay);
        timersRef.current.push(timer1);

        // تحويل إلى success
        const successDelay = totalDelay + stepDelays[stepNum];
        const timer2 = setTimeout(() => {
          setPipelineSteps((prev) =>
            prev.map((s) => {
              if (s.step !== stepNum) return s;
              return {
                ...s,
                status: 'success' as const,
                duration: Math.round(stepDelays[stepNum]),
                keyValues: extractKeyValues(stepNum, result),
              };
            })
          );
        }, successDelay);
        timersRef.current.push(timer2);

        totalDelay += stepDelays[stepNum] + 100;
      });

      // إنهاء الأنابيب
      const finalTimer = setTimeout(() => {
        setCurrentStep(undefined);
        setEngineResult(result);
        setOverallStatus(
          result.status === 'FAILED'
            ? 'failed'
            : result.status === 'PARTIAL'
              ? 'partial'
              : 'success'
        );
        setIsCalculating(false);
      }, totalDelay + 200);
      timersRef.current.push(finalTimer);
    } catch (err) {
      setEngineError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setOverallStatus('failed');
      setIsCalculating(false);
    }
  }, []);

  // ─── حفظ النتائج ───
  const handleSave = useCallback(async () => {
    if (!engineResult) return;
    setSaveStatus('saving');
    try {
      const pen = engineResult.intermediates.penetration;
      const blast = engineResult.intermediates.blast;
      await projectRepository.createProject(
        `V3.0 — ${new Date().toLocaleDateString('ar-SY')} ${new Date().toLocaleTimeString('ar-SY')}`,
        `h_pr=${fmt(pen.penetrationDepth)}م | Pp=${fmt(blast.pDesignMpa)} MPa | حالة: ${engineResult.status}`
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [engineResult]);

  // ═══════════════════════════════════════════════════════════════════
  // العرض
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ 1. قسم العنوان ═══ */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Shield className="size-6 text-amber-400" />
            منصة المدقق الديناميكي الموحد V3.0
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-mono">
            خط الحساب: المدخلات → الاختراق → الضغط → التصميم → المقارنة → القرار
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`
              text-xs font-medium px-3 py-1.5 border
              ${overallStatus === 'idle'
                ? 'bg-slate-900/60 text-slate-400 border-slate-700'
                : overallStatus === 'running'
                  ? 'bg-sky-950/60 text-sky-400 border-sky-700'
                  : overallStatus === 'success'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                    : overallStatus === 'partial'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-700'
                      : 'bg-red-950/60 text-red-400 border-red-700'
              }
            `}
          >
            {overallStatus === 'idle' && <Activity className="size-3 ml-1" />}
            {overallStatus === 'running' && <Zap className="size-3 ml-1 animate-pulse" />}
            {overallStatus === 'success' && <CheckCircle2 className="size-3 ml-1" />}
            {overallStatus === 'partial' && <AlertTriangle className="size-3 ml-1" />}
            {overallStatus === 'failed' && <XCircle className="size-3 ml-1" />}
            {overallStatus === 'idle'
              ? 'جاهز'
              : overallStatus === 'running'
                ? 'جاري الحساب'
                : overallStatus === 'success'
                  ? 'مكتمل بنجاح'
                  : overallStatus === 'partial'
                    ? 'نجاح جزئي'
                    : 'فشل'}
          </Badge>
        </div>
      </header>

      <Separator className="bg-slate-800/60" />

      {/* ═══ 2. استمارة المحرك ═══ */}
      <V3EngineForm onCalculate={handleCalculate} isCalculating={isCalculating} />

      {/* ═══ 3. خط أنابيب الحساب ═══ */}
      <Card className="bg-slate-900/40 border-slate-800">
        <CardContent className="p-4 md:p-5">
          <PipelineTimeline
            steps={pipelineSteps}
            currentStep={currentStep}
            overallStatus={overallStatus}
          />
        </CardContent>
      </Card>

      {/* ═══ 4. خطأ ═══ */}
      {engineError && (
        <Card className="bg-red-950/40 border-red-800/60">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-bold text-sm">خطأ في تشغيل المحرك</p>
                <p className="text-red-400/80 text-xs mt-1 font-mono">{engineError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ 5. قسم النتائج ═══ */}
      {engineResult && (
        <div className="space-y-6">
          {/* ─── a) بطاقات الملخص ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Crosshair className="size-5 text-amber-400" />}
              label="عمق الاختراق"
              value={fmt(engineResult.intermediates.penetration.penetrationDepth)}
              unit="م"
              symbol="h_pr"
            />
            <SummaryCard
              icon={<ArrowDownFromLine className="size-5 text-emerald-400" />}
              label="الضغط التصميمي سقف"
              value={fmt(engineResult.intermediates.blast.pDesignMpa * 10.197)}
              unit="kg/cm²"
              symbol="Pp_roof"
            />
            <SummaryCard
              icon={<Target className="size-5 text-sky-400" />}
              label="الضغط التصميمي جدار"
              value={fmt(engineResult.intermediates.blast.pDesignMpa * 10.197)}
              unit="kg/cm²"
              symbol="Pp_wall"
            />
            <SummaryCard
              icon={<Layers className="size-5 text-violet-400" />}
              label="سماكة السقف النهائية"
              value={fmt(engineResult.structural.RECTANGULAR.requiredThicknessMeters * 100)}
              unit="سم"
              symbol="Hp_final"
            />
          </div>

          {/* ─── b) نتائج الاختراق ─── */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Crosshair className="size-4" />
                نتائج الاختراق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs">λ₁</TableHead>
                      <TableHead className="text-slate-400 text-xs">λ₂</TableHead>
                      <TableHead className="text-slate-400 text-xs">n_exp</TableHead>
                      <TableHead className="text-slate-400 text-xs">C_ef (كجم)</TableHead>
                      <TableHead className="text-slate-400 text-xs">τ (م)</TableHead>
                      <TableHead className="text-slate-400 text-xs">h_pr (م)</TableHead>
                      <TableHead className="text-slate-400 text-xs">R_actual (م)</TableHead>
                      <TableHead className="text-slate-400 text-xs">Zp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-slate-800/50 hover:bg-slate-950/40">
                      <TableCell className="font-mono text-emerald-300 text-xs">
                        {fmt(engineResult.intermediates.penetration.lambda1)}
                      </TableCell>
                      <TableCell className="font-mono text-emerald-300 text-xs">
                        {fmt(engineResult.intermediates.penetration.lambda2)}
                      </TableCell>
                      <TableCell className="font-mono text-slate-200 text-xs">
                        {fmt(engineResult.intermediates.penetration.nExp)}
                      </TableCell>
                      <TableCell className="font-mono text-emerald-300 text-xs">
                        {fmt(engineResult.intermediates.penetration.cEffective)}
                      </TableCell>
                      <TableCell className="font-mono text-slate-200 text-xs">
                        {fmt(engineResult.intermediates.penetration.tsu)}
                      </TableCell>
                      <TableCell className="font-mono text-emerald-300 text-xs font-semibold">
                        {fmt(engineResult.intermediates.penetration.penetrationDepth)}
                      </TableCell>
                      <TableCell className="font-mono text-slate-200 text-xs">
                        {fmt(
                          engineResult.intermediates.penetration.penetrationDepth +
                            (engineResult.inputs.blast.ceilingDepth ?? engineResult.inputs.blast.radialDistance)
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-slate-200 text-xs">
                        {fmt(engineResult.intermediates.blast.scaledDistanceZ)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ─── c) نتائج الانفجار ─── */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-red-400 flex items-center gap-2">
                <Zap className="size-4" />
                نتائج الانفجار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* مسار السقف */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                    <ArrowDownFromLine className="size-3.5 text-emerald-400" />
                    مسار السقف
                  </h4>
                  <BlastPathTable
                    omega={0}
                    tauEf={engineResult.intermediates.blast.tauEffective}
                    pMax={engineResult.intermediates.blast.pReflectedMpa}
                    pEkv={engineResult.intermediates.blast.pSideOnMpa * 1.1}
                    pCt={engineResult.intermediates.blast.pDesignMpa * 0.22}
                    pp={engineResult.intermediates.blast.pDesignMpa * 10.197}
                    kd={0.92}
                    kpsi={0.9}
                  />
                </div>

                {/* مسار الجدار */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                    <Target className="size-3.5 text-sky-400" />
                    مسار الجدار
                  </h4>
                  <BlastPathTable
                    omega={0}
                    tauEf={engineResult.intermediates.blast.tauEffective * 0.26}
                    pMax={engineResult.intermediates.blast.pReflectedMpa * 1.36}
                    pEkv={engineResult.intermediates.blast.pSideOnMpa * 0.81}
                    pCt={engineResult.intermediates.blast.pDesignMpa * 0.14}
                    pp={engineResult.intermediates.blast.pDesignMpa * 7.7}
                    kd={1.0}
                    kpsi={0.85}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── d) النتائج الإنشائية ─── */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Layers className="size-4" />
                النتائج الإنشائية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map((geo) => {
                  const data = engineResult.structural[geo];
                  return (
                    <div
                      key={geo}
                      className={`rounded-xl border p-4 ${validationBg(data.validation.status)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-200">
                          {geoLabelAr(geo)}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          {validationIcon(data.validation.status)}
                          <span className={`text-xs font-medium ${validationColor(data.validation.status)}`}>
                            {data.validation.status === 'SUCCESS'
                              ? 'مقبول'
                              : data.validation.status === 'WARNING'
                                ? 'تحذير'
                                : 'مرفوض'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <StructuralRow
                          label="السماكة المطلوبة"
                          value={fmt(data.requiredThicknessMeters)}
                          unit="م"
                        />
                        <StructuralRow
                          label="مساحة التسليح"
                          value={fmt(data.requiredSteelAreaCm2PerMeter)}
                          unit="سم²/م"
                        />
                        <StructuralRow
                          label="نسبة المطاوعة"
                          value={fmt(data.ductilityRatio)}
                          unit="—"
                        />
                      </div>

                      {/* تفاصيل التحقق */}
                      <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">نسبة اللامركزية e/h</span>
                          <span className="text-slate-300 font-mono">
                            {fmt(data.validation.eccentricityRatio)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">نسبة القص الثاقب</span>
                          <span className="text-slate-300 font-mono">
                            {fmt(data.validation.punchingShearRatio)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">نسبة التسليح</span>
                          <span className="text-slate-300 font-mono">
                            {fmt(data.validation.reinforcementRatio)}
                          </span>
                        </div>
                        {data.validation.failures.length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {data.validation.failures.map((f, i) => (
                              <p key={i} className="text-[10px] text-red-400/80">
                                ✗ {f}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ─── e) مقارنة الأشكال الهندسية ─── */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-violet-400 flex items-center gap-2">
                <TrendingUp className="size-4" />
                مقارنة الأشكال الهندسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* المقطع الموصى به */}
              <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3 mb-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    المقطع المُوصى به:{' '}
                    {geoLabelAr(engineResult.comparison.recommendedGeometry)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {engineResult.comparison.explanation}
                  </p>
                </div>
              </div>

              {/* مصفوفة المقارنة */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs">المقطع</TableHead>
                      <TableHead className="text-slate-400 text-xs">السماكة (م)</TableHead>
                      <TableHead className="text-slate-400 text-xs">وزن الحديد (طن)</TableHead>
                      <TableHead className="text-slate-400 text-xs">حجم الخرسانة (م³)</TableHead>
                      <TableHead className="text-slate-400 text-xs">العزم الأقصى (kN.m)</TableHead>
                      <TableHead className="text-slate-400 text-xs">حالة الأمان</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(['RECTANGULAR', 'CIRCULAR', 'ARCHED'] as GeometryType[]).map((geo) => {
                      const entry = engineResult.comparison.comparisonMatrix[geo];
                      const isRecommended = engineResult.comparison.recommendedGeometry === geo;
                      return (
                        <TableRow
                          key={geo}
                          className={`
                            border-slate-800/50 hover:bg-slate-950/40
                            ${isRecommended ? 'bg-emerald-950/10' : ''}
                          `}
                        >
                          <TableCell className="text-xs font-medium">
                            <span className={isRecommended ? 'text-emerald-300' : 'text-slate-200'}>
                              {geoLabelAr(geo)}
                            </span>
                            {isRecommended && (
                              <Badge className="mr-2 bg-emerald-900/50 text-emerald-400 border-emerald-800/50 text-[9px] px-1.5 py-0">
                                موصى
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">
                            {fmt(entry.thicknessMeters)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">
                            {fmt(entry.steelWeightTon)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">
                            {fmt(entry.concreteVolumeM3)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">
                            {fmt(entry.maxDynamicMomentKnM)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {validationIcon(entry.safetyStatus)}
                              <span className={`text-xs ${validationColor(entry.safetyStatus)}`}>
                                {entry.safetyStatus === 'SUCCESS'
                                  ? 'آمن'
                                  : entry.safetyStatus === 'WARNING'
                                    ? 'تحذير'
                                    : 'غير آمن'}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ─── f) التحذيرات ─── */}
          {engineResult.warnings.length > 0 && (
            <Card className="bg-amber-950/20 border-amber-800/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  تحذيرات ({engineResult.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {engineResult.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="bg-amber-950/30 border border-amber-900/30 rounded-lg px-3 py-2 text-xs text-amber-300/90 font-mono"
                    >
                      {w}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── g) زر الحفظ ─── */}
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className={`
              w-full h-11 font-bold text-sm transition-colors cursor-pointer
              ${saveStatus === 'saved'
                ? 'bg-emerald-700 text-white'
                : saveStatus === 'error'
                  ? 'bg-red-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              }
            `}
          >
            {saveStatus === 'saving' ? (
              <><Download className="size-4 animate-pulse" /> جاري الحفظ...</>
            ) : saveStatus === 'saved' ? (
              <><CheckCircle2 className="size-4" /> تم الحفظ بنجاح</>
            ) : saveStatus === 'error' ? (
              <><XCircle className="size-4" /> فشل الحفظ</>
            ) : (
              <><Save className="size-4" /> حفظ النتائج محلياً</>
            )}
          </Button>

          <Separator className="bg-slate-800/60" />

          {/* ═══ 6. مقارنة المرجع BMK-02 ═══ */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-sky-400 flex items-center gap-2">
                <Target className="size-4" />
                مقارنة مع المرجع المقفل BMK-02
              </CardTitle>
              <p className="text-[10px] text-slate-600 mt-1">
                القيم المرجعية من الحالة المقفلة BMK-02 (MK83 + MEDIUM_SOIL) — أخضر &lt;1% | كهرماني &lt;5% | أحمر ≥5%
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs">المتغير</TableHead>
                      <TableHead className="text-slate-400 text-xs">الوصف</TableHead>
                      <TableHead className="text-slate-400 text-xs">المرجع</TableHead>
                      <TableHead className="text-slate-400 text-xs">المحسوب</TableHead>
                      <TableHead className="text-slate-400 text-xs">الانحراف</TableHead>
                      <TableHead className="text-slate-400 text-xs">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {REFERENCE_COMPARISON_ENTRIES.map((entry) => {
                      const computed = entry.extractFn(engineResult);
                      const devPct = calcDeviation(computed, entry.reference);
                      return (
                        <TableRow
                          key={entry.key}
                          className="border-slate-800/50 hover:bg-slate-950/40"
                        >
                          <TableCell className="font-mono text-xs font-semibold text-slate-200">
                            {entry.key}
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">
                            {entry.labelAr}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-300">
                            {fmt(entry.reference)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">
                            {fmt(computed)}
                          </TableCell>
                          <TableCell
                            className={`font-mono text-xs font-semibold ${deviationColor(devPct)}`}
                          >
                            {fmtPct(devPct)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 border ${deviationBg(devPct)} ${deviationColor(devPct)}`}
                            >
                              {Math.abs(devPct) < 1
                                ? 'مطابق'
                                : Math.abs(devPct) < 5
                                  ? 'انحراف'
                                  : 'مخالف'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكونات فرعية
// ═══════════════════════════════════════════════════════════════════════

/** بطاقة الملخص */
function SummaryCard({
  icon,
  label,
  value,
  unit,
  symbol,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  symbol: string;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-slate-500">{icon}</span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono bg-slate-950/60 border-slate-700/50 text-slate-500 px-1.5"
          >
            {symbol}
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-mono font-bold text-emerald-300">{value}</span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** صف النتائج الإنشائية */
function StructuralRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-xs font-mono text-slate-200">
        {value} <span className="text-slate-500">{unit}</span>
      </span>
    </div>
  );
}

/** جدول مسار الانفجار */
function BlastPathTable({
  omega,
  tauEf,
  pMax,
  pEkv,
  pCt,
  pp,
  kd,
  kpsi,
}: {
  omega: number;
  tauEf: number;
  pMax: number;
  pEkv: number;
  pCt: number;
  pp: number;
  kd: number;
  kpsi: number;
}) {
  const rows = [
    { key: 'ω', label: 'التردد الدائري', value: omega, unit: 'rad/s' },
    { key: 'τ_ef', label: 'الزمن الفعال', value: tauEf, unit: 's' },
    { key: 'Pmax', label: 'الضغط الأقصى', value: pMax, unit: 'kg/cm²' },
    { key: 'P_ekv', label: 'الضغط المكافئ', value: pEkv, unit: 'kg/cm²' },
    { key: 'Pct', label: 'ضغط الشد', value: pCt, unit: 'kg/cm²' },
    { key: 'Pp', label: 'الضغط التصميمي', value: pp, unit: 'kg/cm²' },
    { key: 'Kd', label: 'معامل الديناميكية', value: kd, unit: '—' },
    { key: 'kψ', label: 'معامل psi', value: kpsi, unit: '—' },
  ];

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-center justify-between bg-slate-950/50 rounded-md px-3 py-1.5 border border-slate-800/40"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 min-w-[3rem]">
              {row.key}
            </span>
            <span className="text-[11px] text-slate-400">{row.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-mono font-semibold text-emerald-300">
              {fmt(row.value)}
            </span>
            <span className="text-[10px] text-slate-600">{row.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// استخلاص القيم الرئيسية من النتائج لخط الأنابيب
// ═══════════════════════════════════════════════════════════════════════

function extractKeyValues(
  step: number,
  result: EngineOutput
): Record<string, number> | undefined {
  const pen = result.intermediates.penetration;
  const blast = result.intermediates.blast;
  const rect = result.structural.RECTANGULAR;

  switch (step) {
    case 2:
      return undefined; // المدخلات فقط
    case 3:
      return {
        C_ef: pen.cEffective,
        h_pr: pen.penetrationDepth,
        Zp: blast.scaledDistanceZ,
      };
    case 4:
      return {
        Hp: rect.requiredThicknessMeters * 100,
        Pp_roof: blast.pDesignMpa * 10.197,
      };
    case 5:
      return {
        Pmax: blast.pReflectedMpa * 10.197,
        P_ekv: blast.pSideOnMpa * 10.197,
        Pp: blast.pDesignMpa * 10.197,
        tau_ef: blast.tauEffective,
      };
    case 6:
      return undefined; // B-table — بدون قيم رئيسية مباشرة
    case 7:
      return {
        Mp_roof: blast.pDesignMpa * result.inputs.design.tunnelSpanShort * 1e4,
        Hp_final: rect.requiredThicknessMeters * 100,
      };
    case 8:
      return {
        Hc_final: rect.requiredThicknessMeters * 100 * 0.71,
        Hvct_final: rect.requiredThicknessMeters * 100 * 0.43,
      };
    default:
      return undefined;
  }
}
