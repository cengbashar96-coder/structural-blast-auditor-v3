// ═══════════════════════════════════════════════════════════════════════
// صفحة تفاصيل الاختراق — محرك الاختراق الخطوة 3
// منصة المدقق الديناميكي الموحد V3.0
// تعرض نتائج حسابات الاختراق مع المقارنة المرجعية BMK-02
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { calculatePenetration } from '@/lib/engine/penetration-core';
import { getWeaponById, getSoilByCode } from '@/lib/engine/constants';
import {
  STEP3_PENETRATION,
  STEP2_INPUTS,
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
} from '@/lib/constants/reference-data';
import type { PenetrationInput, PenetrationOutput, SoilTypeCode } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Play,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  Atom,
  BookOpen,
  ArrowDownFromLine,
  Layers,
  ShieldCheck,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// أنواع مساعدة
// ═══════════════════════════════════════════════════════════════════════

interface ExtendedPenetrationResult {
  /** نتائج المحرك الأساسي */
  engine: PenetrationOutput;
  /** عمق الاختراق h_pr (m) */
  hPr: number;
  /** الشحنة الفعالة C_ef (kg) */
  cEf: number;
  /** البعد الفعلي R_actual (m) */
  rActual: number;
  /** البعد المختزل Zp */
  zp: number;
  /** العمق الصافي h_z (m) */
  hz: number;
  /** العمق المختزل h̄_z */
  hzBar: number;
  /** فرق العمق Y_diff (m) */
  yDiff: number;
  /** سماكة التدمير h_b(dest) (m) */
  hbDest: number;
  /** سماكة التشقق h_b(crack) (m) */
  hbCrack: number;
}

interface DeviationEntry {
  label: string;
  symbol: string;
  computed: number;
  reference: number;
  deviationPct: number;
  unit: string;
}

// ═══════════════════════════════════════════════════════════════════════
// حسابات الاختراق الموسعة
// ═══════════════════════════════════════════════════════════════════════

function computeExtendedResults(
  engineOutput: PenetrationOutput,
  ceilingDepth: number,
  soilCode: SoilTypeCode
): ExtendedPenetrationResult {
  const hPr = engineOutput.penetrationDepth;
  const cEf = engineOutput.cEffective;
  const tsu = engineOutput.tsu;

  // العمق الصافي
  const hz = Math.max(hPr - tsu, 0);

  // العمق المختزل
  const cbrtCef = Math.cbrt(Math.max(cEf, 0.001));
  const hzBar = cbrtCef > 0 ? hz / cbrtCef : 0;

  // فرق العمق (المسافة من قاع الاختراق إلى سقف المنشأة)
  const yDiff = ceilingDepth - hPr;

  // البعد الفعلي R_actual — المسافة من مركز الانفجار إلى المنشأة
  // R_actual = sqrt(Z² + h_pr²) + offset بحسب الهندسة
  const rActual = Math.sqrt(
    Math.pow(ceilingDepth, 2) +
    Math.pow(hPr, 2) +
    Math.pow(STEP2_GEOMETRY.a_et + STEP2_GEOMETRY.ap / 2, 2) * 0.3
  );

  // البعد المختزل Zp = R_actual / ∛C_ef
  const zp = cbrtCef > 0 ? rActual / cbrtCef : 0;

  // سماكة التدمير والتشقق — من معاملات التربة
  let hbDest = hPr * 1.1;
  let hbCrack = hPr * 1.3;
  try {
    const soilData = getSoilByCode(soilCode);
    if (soilData?.destructionCoeff) hbDest = hPr * (1 + soilData.destructionCoeff);
    if (soilData?.crackingCoeff) hbCrack = hPr * (1 + soilData.crackingCoeff);
  } catch {
    // استخدام القيم الافتراضية
  }

  return {
    engine: engineOutput,
    hPr,
    cEf,
    rActual,
    zp,
    hz,
    hzBar,
    yDiff,
    hbDest,
    hbCrack,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة للعرض
// ═══════════════════════════════════════════════════════════════════════

function fmt(value: number, decimals: number = 4): string {
  if (!isFinite(value)) return '—';
  return value.toFixed(decimals);
}

function getDeviationColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 1) return 'text-emerald-400';
  if (abs < 5) return 'text-amber-400';
  return 'text-red-400';
}

function getDeviationBg(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 1) return 'bg-emerald-500/10 border-emerald-500/20';
  if (abs < 5) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function getDeviationBadgeVariant(pct: number): 'default' | 'secondary' | 'destructive' {
  const abs = Math.abs(pct);
  if (abs < 1) return 'default';
  if (abs < 5) return 'secondary';
  return 'destructive';
}

// ═══════════════════════════════════════════════════════════════════════
// بيانات جدول المعاملات
// ═══════════════════════════════════════════════════════════════════════

interface CoefficientRow {
  nameAr: string;
  symbol: string;
  value: number;
  unit: string;
  formula?: string;
}

function buildCoefficientsTable(ref: typeof STEP3_PENETRATION): CoefficientRow[] {
  return [
    { nameAr: 'معامل شكل الرأس', symbol: 'λ₁', value: ref.lambda1, unit: '-', formula: '0.5 + 0.4×(Lh/D)^0.666' },
    { nameAr: 'معامل تأثير القطر', symbol: 'λ₂', value: ref.lambda2, unit: '-', formula: '2.8×d^0.333 - 1.3×d^0.5' },
    { nameAr: 'أُس التأثير', symbol: 'n', value: ref.n_exp, unit: '-', formula: '3.5 - Lh/D' },
    { nameAr: 'معامل زاوية الاختراق', symbol: 'τ', value: ref.tsu, unit: 'm', formula: '0.5×lₖ×cos((α+nα)/2)' },
    { nameAr: 'العمق الصافي', symbol: 'h_z', value: ref.h_z, unit: 'm', formula: 'h_pr - τ' },
    { nameAr: 'العمق المختزل', symbol: 'h̄_z', value: ref.h_z_bar, unit: '-', formula: 'h_z / ∛C_ef' },
    { nameAr: 'فرق العمق', symbol: 'Y_diff', value: ref.Y_diff, unit: 'm', formula: 'Z - h_pr' },
    { nameAr: 'سماكة التدمير', symbol: 'h_b(dest)', value: ref.hb_destruction, unit: 'm' },
    { nameAr: 'سماكة التشقق', symbol: 'h_b(crack)', value: ref.hb_cracking, unit: 'm' },
  ];
}

// ═══════════════════════════════════════════════════════════════════════
// بيانات الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function PenetrationDetailPage() {
  const [engineResults, setEngineResults] = useState<ExtendedPenetrationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  // ─── بيانات المرجع BMK-02 ───
  const weapon = useMemo(() => {
    try {
      return getWeaponById('W_MK83');
    } catch {
      return null;
    }
  }, []);

  const soil = useMemo(() => {
    try {
      return getSoilByCode('MEDIUM_SOIL');
    } catch {
      return null;
    }
  }, []);

  const refCoefficients = useMemo(() => buildCoefficientsTable(STEP3_PENETRATION), []);

  // ─── تشغيل المحرك ───
  const handleRunEngine = useCallback(async () => {
    setIsRunning(true);
    setEngineError(null);

    try {
      // تأخير بسيط لتأثير بصري
      await new Promise((r) => setTimeout(r, 400));

      const input: PenetrationInput = {
        weaponId: 'W_MK83',
        impactVelocity: STEP2_INPUTS.V,
        soilTypeCode: 'MEDIUM_SOIL',
        impactAngleDeg: STEP2_INPUTS.alpha,
      };

      const engineOutput = calculatePenetration(input);
      const extended = computeExtendedResults(
        engineOutput,
        STEP2_INPUTS.Z,
        'MEDIUM_SOIL'
      );

      setEngineResults(extended);
    } catch (err) {
      setEngineError(
        err instanceof Error ? err.message : 'خطأ غير معروف في محرك الاختراق'
      );
    } finally {
      setIsRunning(false);
    }
  }, []);

  // ─── حساب الانحرافات ───
  const deviations = useMemo<DeviationEntry[]>(() => {
    if (!engineResults) return [];

    const entries: DeviationEntry[] = [
      {
        label: 'معامل شكل الرأس',
        symbol: 'λ₁',
        computed: engineResults.engine.lambda1,
        reference: STEP3_PENETRATION.lambda1,
        deviationPct:
          (Math.abs(engineResults.engine.lambda1 - STEP3_PENETRATION.lambda1) /
            Math.abs(STEP3_PENETRATION.lambda1)) *
          100,
        unit: '-',
      },
      {
        label: 'معامل تأثير القطر',
        symbol: 'λ₂',
        computed: engineResults.engine.lambda2,
        reference: STEP3_PENETRATION.lambda2,
        deviationPct:
          (Math.abs(engineResults.engine.lambda2 - STEP3_PENETRATION.lambda2) /
            Math.abs(STEP3_PENETRATION.lambda2)) *
          100,
        unit: '-',
      },
      {
        label: 'أُس التأثير',
        symbol: 'n',
        computed: engineResults.engine.nExp,
        reference: STEP3_PENETRATION.n_exp,
        deviationPct:
          (Math.abs(engineResults.engine.nExp - STEP3_PENETRATION.n_exp) /
            Math.abs(STEP3_PENETRATION.n_exp)) *
          100,
        unit: '-',
      },
      {
        label: 'الشحنة الفعالة',
        symbol: 'C_ef',
        computed: engineResults.cEf,
        reference: STEP3_PENETRATION.C_ef,
        deviationPct:
          (Math.abs(engineResults.cEf - STEP3_PENETRATION.C_ef) /
            Math.abs(STEP3_PENETRATION.C_ef)) *
          100,
        unit: 'kg',
      },
      {
        label: 'معامل زاوية الاختراق',
        symbol: 'τ',
        computed: engineResults.engine.tsu,
        reference: STEP3_PENETRATION.tsu,
        deviationPct:
          (Math.abs(engineResults.engine.tsu - STEP3_PENETRATION.tsu) /
            Math.abs(STEP3_PENETRATION.tsu)) *
          100,
        unit: 'm',
      },
      {
        label: 'عمق الاختراق',
        symbol: 'h_pr',
        computed: engineResults.hPr,
        reference: STEP3_PENETRATION.h_pr,
        deviationPct:
          (Math.abs(engineResults.hPr - STEP3_PENETRATION.h_pr) /
            Math.abs(STEP3_PENETRATION.h_pr)) *
          100,
        unit: 'm',
      },
      {
        label: 'العمق الصافي',
        symbol: 'h_z',
        computed: engineResults.hz,
        reference: STEP3_PENETRATION.h_z,
        deviationPct:
          (Math.abs(engineResults.hz - STEP3_PENETRATION.h_z) /
            Math.abs(STEP3_PENETRATION.h_z)) *
          100,
        unit: 'm',
      },
      {
        label: 'العمق المختزل',
        symbol: 'h̄_z',
        computed: engineResults.hzBar,
        reference: STEP3_PENETRATION.h_z_bar,
        deviationPct:
          (Math.abs(engineResults.hzBar - STEP3_PENETRATION.h_z_bar) /
            Math.abs(STEP3_PENETRATION.h_z_bar)) *
          100,
        unit: '-',
      },
      {
        label: 'البعد الفعلي',
        symbol: 'R_actual',
        computed: engineResults.rActual,
        reference: STEP3_PENETRATION.R_actual,
        deviationPct:
          (Math.abs(engineResults.rActual - STEP3_PENETRATION.R_actual) /
            Math.abs(STEP3_PENETRATION.R_actual)) *
          100,
        unit: 'm',
      },
      {
        label: 'البعد المختزل',
        symbol: 'Zp',
        computed: engineResults.zp,
        reference: STEP3_PENETRATION.Zp,
        deviationPct:
          (Math.abs(engineResults.zp - STEP3_PENETRATION.Zp) /
            Math.abs(STEP3_PENETRATION.Zp)) *
          100,
        unit: '-',
      },
      {
        label: 'فرق العمق',
        symbol: 'Y_diff',
        computed: engineResults.yDiff,
        reference: STEP3_PENETRATION.Y_diff,
        deviationPct:
          (Math.abs(engineResults.yDiff - STEP3_PENETRATION.Y_diff) /
            Math.abs(STEP3_PENETRATION.Y_diff)) *
          100,
        unit: 'm',
      },
      {
        label: 'سماكة التدمير',
        symbol: 'h_b(dest)',
        computed: engineResults.hbDest,
        reference: STEP3_PENETRATION.hb_destruction,
        deviationPct:
          (Math.abs(engineResults.hbDest - STEP3_PENETRATION.hb_destruction) /
            Math.abs(STEP3_PENETRATION.hb_destruction)) *
          100,
        unit: 'm',
      },
      {
        label: 'سماكة التشقق',
        symbol: 'h_b(crack)',
        computed: engineResults.hbCrack,
        reference: STEP3_PENETRATION.hb_cracking,
        deviationPct:
          (Math.abs(engineResults.hbCrack - STEP3_PENETRATION.hb_cracking) /
            Math.abs(STEP3_PENETRATION.hb_cracking)) *
          100,
        unit: 'm',
      },
    ];

    return entries;
  }, [engineResults]);

  // ─── ملخص الانحرافات ───
  const deviationSummary = useMemo(() => {
    if (deviations.length === 0) return null;
    const maxDev = Math.max(...deviations.map((d) => d.deviationPct));
    const avgDev =
      deviations.reduce((sum, d) => sum + d.deviationPct, 0) / deviations.length;
    const passing = deviations.filter((d) => d.deviationPct < 5).length;
    return { maxDev, avgDev, passing, total: deviations.length };
  }, [deviations]);

  // ─── القيم المرجعية الرئيسية ───
  const mainResults = [
    {
      label: 'عمق الاختراق',
      symbol: 'h_pr',
      value: STEP3_PENETRATION.h_pr,
      unit: 'm',
      description: 'القيمة الأساسية — عمق اختراق السلاح في التربة',
      isKey: true,
      icon: ArrowDownFromLine,
    },
    {
      label: 'الشحنة الفعالة',
      symbol: 'C_ef',
      value: STEP3_PENETRATION.C_ef,
      unit: 'kg',
      description: 'وزن الشحنة المتفجرة الفعالة بعد المعاملة',
      isKey: false,
      icon: Atom,
    },
    {
      label: 'البعد الفعلي',
      symbol: 'R_actual',
      value: STEP3_PENETRATION.R_actual,
      unit: 'm',
      description: 'البعد الشعاعي الفعلي من مركز الانفجار',
      isKey: false,
      icon: Ruler,
    },
    {
      label: 'البعد المختزل',
      symbol: 'Zp',
      value: STEP3_PENETRATION.Zp,
      unit: '—',
      description: 'البعد المختزل للضغط العصفي',
      isKey: false,
      icon: Layers,
    },
  ];

  return (
    <div
      className="space-y-6"
      dir="rtl"
      role="region"
      aria-labelledby="penetration-main-heading"
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* الرأس الرئيسي                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-4 gap-4">
        <div>
          <h1
            id="penetration-main-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2"
          >
            <Target className="size-5 text-emerald-400" />
            محرك الاختراق — الخطوة 3
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            حسابات الاختراق والشحنة الفعالة — المرجع الذهبي BMK-02 (MK83 + MEDIUM_SOIL)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 font-mono text-[10px] px-2 py-0.5"
          >
            BMK-02 LOCKED
          </Badge>
          <Button
            onClick={handleRunEngine}
            disabled={isRunning}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Play className="size-3.5" />
            {isRunning ? 'جاري الحساب...' : 'تشغيل المحرك'}
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* بطاقة ملخص المدخلات                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="size-4 text-slate-400" />
            ملخص المدخلات — BMK-02
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            المعطيات المرجعية المقفلة لحالة الاختبار الذهبية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'السلاح', value: weapon?.nameAr ?? 'MK83', sub: weapon?.name ?? 'MK83' },
              { label: 'نوع التربة', value: soil?.nameAr ?? 'طين مع حجارة', sub: soil?.referenceName ?? 'clay_with_stones' },
              { label: 'سرعة الاصطدام', value: `${STEP2_INPUTS.V} m/s`, sub: `V = ${STEP2_INPUTS.V}` },
              { label: 'زاوية الاصطدام', value: `${STEP2_INPUTS.alpha}°`, sub: `α = ${STEP2_INPUTS.alpha}` },
              { label: 'عمق السقف', value: `${STEP2_INPUTS.Z} m`, sub: `Z = ${STEP2_INPUTS.Z}` },
              { label: 'وزن الشحنة', value: `${STEP2_INPUTS.C} kg`, sub: `C = ${STEP2_INPUTS.C}` },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/40"
              >
                <div className="text-[10px] text-slate-500 mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-slate-200 truncate">
                  {item.value}
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* معاملات البحث الإضافية */}
          <Separator className="bg-slate-700/40 my-3" />
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { label: 'K₁', value: STEP2_LOOKUPS.K1 },
              { label: 'Kpr_g', value: STEP2_LOOKUPS.kpr_g },
              { label: 'Kpr_b', value: STEP2_LOOKUPS.kpr_b },
              { label: 'm₁', value: STEP2_LOOKUPS.m1 },
              { label: 'RbH', value: STEP2_LOOKUPS.RbH },
              { label: 'RsH', value: STEP2_LOOKUPS.RsH },
              { label: 'R̄', value: STEP2_LOOKUPS.R_bar },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-[10px] text-slate-500 font-mono">{item.label}</div>
                <div className="text-xs text-slate-300 font-mono">
                  {typeof item.value === 'number' && item.value < 0.001
                    ? item.value.toExponential(1)
                    : item.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* النتائج الرئيسية — بطاقات كبيرة                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainResults.map((result) => {
          const IconComp = result.icon;
          return (
            <Card
              key={result.symbol}
              className={`bg-slate-900 border-slate-800 relative overflow-hidden ${
                result.isKey ? 'ring-1 ring-emerald-500/30' : ''
              }`}
            >
              {result.isKey && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-emerald-500 to-emerald-400" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <IconComp
                      className={`size-4 ${
                        result.isKey ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs text-slate-400">{result.label}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] px-1.5 py-0 ${
                      result.isKey
                        ? 'border-emerald-500/30 text-emerald-400'
                        : 'border-slate-700 text-slate-500'
                    }`}
                  >
                    {result.symbol}
                  </Badge>
                </div>
                <div
                  className={`text-2xl font-bold font-mono tracking-tight ${
                    result.isKey ? 'text-emerald-400' : 'text-emerald-300/80'
                  }`}
                >
                  {fmt(result.value, 4)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-600">{result.unit}</span>
                  {result.isKey && (
                    <span className="text-[10px] text-emerald-500/60 font-medium">
                      القيمة المفتاحية
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                  {result.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* التبويبات: جدول المعاملات | المقارنة المرجعية | المعادلات      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Tabs defaultValue="coefficients" dir="rtl" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700/40">
          <TabsTrigger
            value="coefficients"
            className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 text-slate-400 text-xs"
          >
            جدول المعاملات
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 text-slate-400 text-xs"
          >
            مقارنة BMK-02
          </TabsTrigger>
          <TabsTrigger
            value="formulas"
            className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 text-slate-400 text-xs"
          >
            المعادلات المرجعية
          </TabsTrigger>
        </TabsList>

        {/* ─── جدول المعاملات ─── */}
        <TabsContent value="coefficients" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="size-4 text-slate-400" />
                معاملات الاختراق — الخطوة 3
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                جميع المعاملات الوسيطة والمشتقة لحساب عمق الاختراق
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-700/40 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs font-semibold">
                        المعامل
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold text-center">
                        الرمز
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold text-left font-mono">
                        القيمة
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold text-center">
                        الوحدة
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold">
                        المعادلة
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refCoefficients.map((row, idx) => (
                      <TableRow
                        key={row.symbol}
                        className={`border-b border-slate-800/60 ${
                          idx % 2 === 0 ? 'bg-slate-800/20' : ''
                        } hover:bg-slate-800/40`}
                      >
                        <TableCell className="text-xs text-slate-300 font-medium py-2.5">
                          {row.nameAr}
                        </TableCell>
                        <TableCell className="text-xs text-center py-2.5">
                          <Badge
                            variant="outline"
                            className="border-slate-600/50 text-emerald-400 font-mono text-[11px] px-1.5 py-0"
                          >
                            {row.symbol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-left font-mono text-slate-200 py-2.5">
                          {fmt(row.value, 6)}
                        </TableCell>
                        <TableCell className="text-xs text-center text-slate-500 py-2.5">
                          {row.unit}
                        </TableCell>
                        <TableCell className="text-[10px] text-slate-500 font-mono py-2.5">
                          {row.formula ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── مقارنة BMK-02 المرجعية ─── */}
        <TabsContent value="comparison" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-slate-400" />
                    مقارنة BMK-02 المرجعية
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    مقارنة القيم المحسوبة بالمحرك مقابل المرجع الذهبي المقفل
                  </CardDescription>
                </div>
                {deviationSummary && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={deviationSummary.maxDev < 5 ? 'default' : 'destructive'}
                      className="font-mono text-[10px]"
                    >
                      أقصى انحراف: {fmt(deviationSummary.maxDev, 2)}%
                    </Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono text-[10px]">
                      {deviationSummary.passing}/{deviationSummary.total} ضمن التسامح
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!engineResults ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-16 rounded-full bg-slate-800/50 border border-slate-700/40 flex items-center justify-center mb-4">
                    <Play className="size-6 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-400 mb-1">
                    لم يتم تشغيل المحرك بعد
                  </p>
                  <p className="text-xs text-slate-600 mb-4">
                    اضغط &quot;تشغيل المحرك&quot; لمقارنة النتائج المحسوبة مع المرجع BMK-02
                  </p>
                  <Button
                    onClick={handleRunEngine}
                    disabled={isRunning}
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                  >
                    <Play className="size-3.5" />
                    تشغيل المحرك الآن
                  </Button>
                </div>
              ) : engineError ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="size-4" />
                    <span className="text-sm font-medium">خطأ في المحرك</span>
                  </div>
                  <p className="text-xs text-red-300/80 font-mono">{engineError}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* شريط ملخص الانحرافات */}
                  {deviationSummary && (
                    <div
                      className={`rounded-lg border p-3 ${getDeviationBg(
                        deviationSummary.maxDev
                      )}`}
                    >
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            أقصى انحراف
                          </div>
                          <div
                            className={`text-lg font-bold font-mono ${getDeviationColor(
                              deviationSummary.maxDev
                            )}`}
                          >
                            {fmt(deviationSummary.maxDev, 2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            متوسط الانحراف
                          </div>
                          <div
                            className={`text-lg font-bold font-mono ${getDeviationColor(
                              deviationSummary.avgDev
                            )}`}
                          >
                            {fmt(deviationSummary.avgDev, 2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            ضمن التسامح
                          </div>
                          <div className="text-lg font-bold font-mono text-slate-200">
                            {deviationSummary.passing}
                            <span className="text-slate-600">/</span>
                            {deviationSummary.total}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* جدول المقارنة التفصيلي */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-700/40 hover:bg-transparent">
                          <TableHead className="text-slate-400 text-xs font-semibold">
                            المعامل
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold text-center">
                            الرمز
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold text-left font-mono">
                            المحسوب
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold text-left font-mono">
                            المرجعي
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold text-center">
                            الانحراف %
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold text-center">
                            الحالة
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deviations.map((dev, idx) => (
                          <TableRow
                            key={dev.symbol}
                            className={`border-b border-slate-800/60 ${
                              idx % 2 === 0 ? 'bg-slate-800/20' : ''
                            } hover:bg-slate-800/40`}
                          >
                            <TableCell className="text-xs text-slate-300 font-medium py-2.5">
                              {dev.label}
                            </TableCell>
                            <TableCell className="text-xs text-center py-2.5">
                              <Badge
                                variant="outline"
                                className="border-slate-600/50 text-emerald-400 font-mono text-[11px] px-1.5 py-0"
                              >
                                {dev.symbol}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-left font-mono text-slate-200 py-2.5">
                              {fmt(dev.computed, 6)}
                            </TableCell>
                            <TableCell className="text-xs text-left font-mono text-slate-400 py-2.5">
                              {fmt(dev.reference, 6)}
                            </TableCell>
                            <TableCell
                              className={`text-xs text-center font-mono font-bold py-2.5 ${getDeviationColor(
                                dev.deviationPct
                              )}`}
                            >
                              {fmt(dev.deviationPct, 2)}%
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              {dev.deviationPct < 1 ? (
                                <CheckCircle2 className="size-4 text-emerald-400 inline-block" />
                              ) : dev.deviationPct < 5 ? (
                                <AlertTriangle className="size-4 text-amber-400 inline-block" />
                              ) : (
                                <AlertTriangle className="size-4 text-red-400 inline-block" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* دليل الألوان */}
                  <div className="flex items-center gap-6 text-[10px] text-slate-500 pt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-emerald-400" />
                      <span>انحراف &lt; 1% — مطابقة ممتازة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-amber-400" />
                      <span>انحراف &lt; 5% — ضمن التسامح</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-red-400" />
                      <span>انحراف ≥ 5% — خارج التسامح</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── المعادلات المرجعية ─── */}
        <TabsContent value="formulas" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BookOpen className="size-4 text-slate-400" />
                المعادلات المرجعية — الأطروحة (Eq. 13-19)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                المعادلات الأساسية المستخدمة في محرك الاختراق مع الشرح العربي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* المعادلة 14: λ₁ */}
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                        Eq.14
                      </Badge>
                      <span className="text-sm font-semibold text-slate-200">
                        معامل شكل الرأس الحربي
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-600/50 text-emerald-400 font-mono text-[11px]"
                    >
                      λ₁ = {fmt(STEP3_PENETRATION.lambda1, 6)}
                    </Badge>
                  </div>
                  <div className="bg-slate-950/50 rounded p-3 font-mono text-sm text-emerald-300 mb-2 text-center tracking-wider" dir="ltr">
                    λ₁ = 0.5 + 0.4 × (Lh/D)^(2/3)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يحسب تأثير شكل رأس القنبلة على عمق الاختراق. كلما زادت نسبة طول الرأس
                    للقطر (Lh/D)، زادت قدرة القنبلة على الاختراق. القيمة المرجعية لـ MK83:
                    Lh/D = {STEP2_INPUTS.lhd_ratio}
                  </p>
                </div>

                {/* المعادلة 15: λ₂ */}
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                        Eq.15
                      </Badge>
                      <span className="text-sm font-semibold text-slate-200">
                        معامل تأثير القطر
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-600/50 text-emerald-400 font-mono text-[11px]"
                    >
                      λ₂ = {fmt(STEP3_PENETRATION.lambda2, 6)}
                    </Badge>
                  </div>
                  <div className="bg-slate-950/50 rounded p-3 font-mono text-sm text-emerald-300 mb-2 text-center tracking-wider" dir="ltr">
                    λ₂ = 2.8 × d^(1/3) − 1.3 × d^(1/2)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يحسب تأثير قطر القنبلة على الاختراق. التعويض عن قطر MK83:
                    d = {STEP2_INPUTS.dk} m
                  </p>
                </div>

                {/* المعادلة 19: C_ef */}
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                        Eq.19
                      </Badge>
                      <span className="text-sm font-semibold text-slate-200">
                        الشحنة الفعالة
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-600/50 text-emerald-400 font-mono text-[11px]"
                    >
                      C_ef = {fmt(STEP3_PENETRATION.C_ef, 2)} kg
                    </Badge>
                  </div>
                  <div className="bg-slate-950/50 rounded p-3 font-mono text-sm text-emerald-300 mb-2 text-center tracking-wider" dir="ltr">
                    C_eff = 0.95 × K₁ × C
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    وزن الشحنة المتفجرة الفعالة بعد الأخذ بالاعتبار معامل المتفجرات K₁
                    ومعامل الفعالية 0.95. التعويض: K₁ = {STEP2_LOOKUPS.K1}، C = {STEP2_INPUTS.C} kg
                  </p>
                </div>

                {/* المعادلة 13: h_pr */}
                <div className="bg-slate-800/40 rounded-lg p-4 border border-emerald-500/20 ring-1 ring-emerald-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                        Eq.13
                      </Badge>
                      <span className="text-sm font-semibold text-emerald-300">
                        عمق الاختراق — المعادلة الرئيسية
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 font-mono text-[11px]"
                    >
                      h_pr = {fmt(STEP3_PENETRATION.h_pr, 4)} m
                    </Badge>
                  </div>
                  <div className="bg-slate-950/50 rounded p-3 font-mono text-sm text-emerald-300 mb-2 text-center tracking-wider" dir="ltr">
                    x₁ = λ₁ × λ₂ × Kpr × (P/d²) × V × cos(α)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    المعادلة الأساسية لعمق الاختراق في التربة. تعتمد على معاملات الشكل والقطر
                    ومعامل التربة وسرعة الاصطدام وزاوية السقوط. التعويض المرجعي:
                    λ₁={fmt(STEP3_PENETRATION.lambda1, 4)}،
                    λ₂={fmt(STEP3_PENETRATION.lambda2, 4)}،
                    Kpr={STEP2_LOOKUPS.kpr_g.toExponential(1)}،
                    P={STEP2_INPUTS.P}kg،
                    d={STEP2_INPUTS.dk}m،
                    V={STEP2_INPUTS.V}m/s،
                    α={STEP2_INPUTS.alpha}°
                  </p>
                </div>

                {/* المعادلة 17: τ (قنبلة خارقة) */}
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                        Eq.17
                      </Badge>
                      <span className="text-sm font-semibold text-slate-200">
                        معامل زاوية الاختراق — قنبلة خارقة
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-600/50 text-emerald-400 font-mono text-[11px]"
                    >
                      τ = {fmt(STEP3_PENETRATION.tsu, 4)} m
                    </Badge>
                  </div>
                  <div className="bg-slate-950/50 rounded p-3 font-mono text-sm text-emerald-300 mb-2 text-center tracking-wider" dir="ltr">
                    τ = 0.5 × lₖ × cos((α + n×α)/2)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    تصحيح عمق الاختراق حسب زاوية السقوط. يُستخدم للقنابل الخارقة
                    (Lh/D &gt; 1.5). التعويض: lₖ={STEP2_INPUTS.lk}m، α={STEP2_INPUTS.alpha}°، n={STEP3_PENETRATION.n_exp}
                  </p>
                </div>

                {/* القيم المشتقة */}
                <Separator className="bg-slate-700/40" />
                <div className="text-xs text-slate-400 font-medium mb-2">
                  القيم المشتقة الإضافية:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: 'العمق الصافي',
                      formula: 'h_z = h_pr − τ',
                      value: `${fmt(STEP3_PENETRATION.h_z, 4)} m`,
                    },
                    {
                      label: 'العمق المختزل',
                      formula: 'h̄_z = h_z / ∛C_ef',
                      value: fmt(STEP3_PENETRATION.h_z_bar, 4),
                    },
                    {
                      label: 'فرق العمق',
                      formula: 'Y_diff = Z − h_pr',
                      value: `${fmt(STEP3_PENETRATION.Y_diff, 4)} m`,
                    },
                    {
                      label: 'البعد المختزل',
                      formula: 'Zp = R_actual / ∛C_ef',
                      value: fmt(STEP3_PENETRATION.Zp, 4),
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/20"
                    >
                      <div className="text-[10px] text-slate-500 mb-1">
                        {item.label}
                      </div>
                      <div className="font-mono text-xs text-emerald-400 mb-0.5" dir="ltr">
                        {item.formula}
                      </div>
                      <div className="font-mono text-xs text-slate-300">
                        = {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* تحذيرات المحرك                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {engineResults?.engine.warningMessages &&
        engineResults.engine.warningMessages.length > 0 && (
          <Card className="bg-slate-900 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                <AlertTriangle className="size-4" />
                <span className="text-sm font-medium">تحذيرات المحرك</span>
              </div>
              <div className="space-y-2">
                {engineResults.engine.warningMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-500/5 border border-amber-500/10 rounded px-3 py-2"
                  >
                    <p className="text-xs text-amber-300/80 font-mono">{msg}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* شرح المحرك                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {engineResults?.engine.explanation && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-300 mb-2">
              <BookOpen className="size-4 text-slate-400" />
              <span className="text-sm font-medium">شرح النتائج</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {engineResults.engine.explanation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
