// ═══════════════════════════════════════════════════════════════════════
// صفحة تصميم التسليح — محرك الحديد والفحوصات
// منصة المدقق الديناميكي الموحد V3.0
// مساران مستقلان: السقف (Roof) والجدار (Wall)
// مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  calculateRebarDesign,
  calculateRebarBothPaths,
  type RebarDesignInput,
  type RebarDesignOutput,
} from '@/lib/engine/rebar';
import {
  STEP7_CEILING,
  STEP5_ROOF,
  STEP5_WALL,
  STEP8_WALL,
  STEP2_LOOKUPS,
} from '@/lib/constants/reference-data';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wrench,
  Ruler,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sigma,
  CircleDot,
  ArrowRightFromLine,
  ShieldCheck,
  FlaskConical,
  Grip,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// مكون مساعد: بطاقة النتيجة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

function KeyResultCard({
  label,
  symbol,
  value,
  unit,
  icon: Icon,
  colorClass = 'text-emerald-400',
  borderClass = 'border-emerald-500/30',
  bgClass = 'bg-emerald-500/5',
}: {
  label: string;
  symbol: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  colorClass?: string;
  borderClass?: string;
  bgClass?: string;
}) {
  return (
    <Card className={`border ${borderClass} ${bgClass} overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm text-slate-500 font-mono">{symbol} =</span>
              <span className={`text-2xl font-bold font-mono ${colorClass}`}>{value}</span>
              <span className="text-sm text-slate-400">{unit}</span>
            </div>
          </div>
          <div className={`p-2.5 rounded-lg ${bgClass} border ${borderClass}`}>
            <Icon className={`size-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: بطاقة اختيار القضبان
// ═══════════════════════════════════════════════════════════════════════

function RebarSelectionCard({ data }: { data: RebarDesignOutput }) {
  const spacing = data.barCount > 0 ? (100 / data.barCount) : 0;

  return (
    <Card className="border-slate-800/60 bg-slate-950/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Ruler className="size-4 text-cyan-400" />
          اختيار القضبان
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          تفاصيل القضبان المختارة بناءً على مساحة التسليح المطلوبة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نوع القضبان */}
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Grip className="size-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">نوع القضبان</p>
              <p className="text-base font-bold font-mono text-cyan-400">
                Φ{data.barDiameter} @ {spacing.toFixed(1)} cm
              </p>
            </div>
          </div>
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs px-2">
            {data.barCount} × Φ{data.barDiameter}
          </Badge>
        </div>

        {/* المساحة المقدمة */}
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Sigma className="size-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">المساحة المقدمة</p>
              <p className="text-base font-bold font-mono text-amber-400">
                A<sub>s,provided</sub> = {data.As_provided.toFixed(2)} cm²/m
              </p>
            </div>
          </div>
          <Badge className={
            data.As_provided >= data.As_required
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-2'
              : 'bg-red-500/10 text-red-400 border-red-500/30 text-xs px-2'
          }>
            {data.As_provided >= data.As_required ? 'كافية' : 'غير كافية'}
          </Badge>
        </div>

        {/* التباعد */}
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <ArrowRightFromLine className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">التباعد بين القضبان</p>
              <p className="text-base font-bold font-mono text-violet-400">
                s = {spacing.toFixed(1)} cm
              </p>
            </div>
          </div>
          <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-xs px-2">
            {data.barCount} قضيب/متر
          </Badge>
        </div>

        {/* نسبة الاستفادة */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">نسبة الاستفادة</span>
            <span className="text-xs font-mono text-slate-300">
              {((data.As_required / data.As_provided) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((data.As_required / data.As_provided) * 100, 100)}%`,
                backgroundColor:
                  data.As_required / data.As_provided > 0.95
                    ? '#f59e0b'
                    : data.As_required / data.As_provided > 0.85
                      ? '#10b981'
                      : '#22d3ee',
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: جدول فحوصات التصميم
// ═══════════════════════════════════════════════════════════════════════

function DesignChecksCard({ data }: { data: RebarDesignOutput }) {
  const checks = [
    {
      label: 'نسبة التسليح الدنيا',
      value: (data.rho * 100).toFixed(3),
      valueSymbol: 'ρ',
      limit: (data.rho_min * 100).toFixed(2),
      limitSymbol: 'ρ_min',
      unit: '%',
      passed: data.minReinforcementOk,
      condition: 'ρ ≥ ρ_min',
    },
    {
      label: 'نسبة التسليح القصوى',
      value: (data.rho * 100).toFixed(3),
      valueSymbol: 'ρ',
      limit: (data.rho_max * 100).toFixed(2),
      limitSymbol: 'ρ_max',
      unit: '%',
      passed: data.maxReinforcementOk,
      condition: 'ρ ≤ ρ_max',
    },
    {
      label: 'العمق النسبي',
      value: data.xi.toFixed(4),
      valueSymbol: 'ξ',
      limit: data.xi_max.toFixed(2),
      limitSymbol: 'ξ_max',
      unit: '',
      passed: data.xiConditionOk,
      condition: 'ξ ≤ ξ_max',
    },
    {
      label: 'المطاوعة',
      value: data.As_provided >= data.As_required ? 'مُحققة' : 'غير محققة',
      valueSymbol: 'μ_struct',
      limit: data.As_required.toFixed(2),
      limitSymbol: 'A_s,req',
      unit: 'cm²/m',
      passed: data.As_provided >= data.As_required && data.minReinforcementOk,
      condition: 'A_s,prov ≥ A_s,req',
    },
  ];

  const allPassed = checks.every((c) => c.passed);

  return (
    <Card className="border-slate-800/60 bg-slate-950/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ShieldCheck className={`size-4 ${allPassed ? 'text-emerald-400' : 'text-red-400'}`} />
          فحوصات التصميم
          <Badge
            className={
              allPassed
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] mr-2 px-1.5'
                : 'bg-red-500/10 text-red-400 border-red-500/30 text-[10px] mr-2 px-1.5'
            }
          >
            {allPassed ? 'جميع الفحوصات محققة' : 'يوجد فحوصات فاشلة'}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          وفق الكود السوري 2024 و UFC 3-340-02 للأحمال الديناميكية
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/60 hover:bg-transparent">
              <TableHead className="text-xs text-slate-400 text-right">الفحص</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">الشرط</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">القيمة</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">الحد</TableHead>
              <TableHead className="text-xs text-slate-400 text-center">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((check) => (
              <TableRow
                key={check.label}
                className="border-slate-800/30 hover:bg-slate-900/50"
              >
                <TableCell className="text-xs text-slate-300 text-right font-medium">
                  {check.label}
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-500 text-right">
                  {check.condition}
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-200 text-right">
                  {check.value}
                  {check.unit && (
                    <span className="text-slate-500 mr-1">{check.unit}</span>
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-400 text-right">
                  {check.limit}
                  {check.unit && check.label !== 'المطاوعة' && (
                    <span className="text-slate-500 mr-1">{check.unit}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {check.passed ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5">
                      <CheckCircle2 className="size-3 ml-0.5" />
                      ✓
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] px-1.5">
                      <XCircle className="size-3 ml-0.5" />
                      ✗
                    </Badge>
                  )}
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
// مكون: المقطع العرضي مع قضبان التسليح
// ═══════════════════════════════════════════════════════════════════════

function CrossSectionDiagram({ data, path }: { data: RebarDesignOutput; path: 'roof' | 'wall' }) {
  const barCount = data.barCount;
  const barDiameter = data.barDiameter;
  const spacing = barCount > 0 ? 100 / barCount : 0;

  // أبعاد SVG
  const sectionWidth = 400;
  const sectionHeight = 120;
  const padding = 40;
  const barRadius = Math.min(Math.max(barDiameter / 2, 3), 8);
  const barY = sectionHeight - 20; // موضع القضبان من الأسفل

  return (
    <Card className="border-slate-800/60 bg-slate-950/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="size-4 text-teal-400" />
          المقطع العرضي مع التسليح
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          عرض تقريبي للمقطع الخرساني مع توزيع قضبان التسليح
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-4">
        <div style={{ direction: 'ltr' }}>
          <svg
            width={sectionWidth + padding * 2}
            height={sectionHeight + padding + 40}
            viewBox={`0 0 ${sectionWidth + padding * 2} ${sectionHeight + padding + 40}`}
            className="max-w-full h-auto"
          >
            {/* خلفية المقطع الخرساني */}
            <rect
              x={padding}
              y={10}
              width={sectionWidth}
              height={sectionHeight}
              fill="#334155"
              fillOpacity="0.3"
              stroke="#64748b"
              strokeWidth="2"
              rx="3"
            />

            {/* نمط الخرسانة (خطوط مائلة) */}
            {Array.from({ length: Math.floor(sectionWidth / 20) }).map((_, i) => (
              <line
                key={`hatch-${i}`}
                x1={padding + i * 20}
                y1={10}
                x2={padding + i * 20 + 10}
                y2={10 + sectionHeight}
                stroke="#64748b"
                strokeWidth="0.4"
                opacity="0.3"
              />
            ))}

            {/* منطقة الضغط (أعلى المقطع) */}
            <rect
              x={padding}
              y={10}
              width={sectionWidth}
              height={sectionHeight * 0.15}
              fill="#f59e0b"
              fillOpacity="0.15"
              stroke="#f59e0b"
              strokeWidth="0.5"
              strokeOpacity="0.4"
              strokeDasharray="3 2"
            />
            <text
              x={padding + sectionWidth / 2}
              y={10 + sectionHeight * 0.1}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="9"
              opacity="0.8"
            >
              منطقة الضغط
            </text>

            {/* خط المحور المرن (Neutral Axis) */}
            {data.xi > 0 && (
              <>
                <line
                  x1={padding}
                  y1={10 + sectionHeight * (1 - data.xi)}
                  x2={padding + sectionWidth}
                  y2={10 + sectionHeight * (1 - data.xi)}
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="6 3"
                  opacity="0.6"
                />
                <text
                  x={padding - 5}
                  y={10 + sectionHeight * (1 - data.xi) + 3}
                  textAnchor="end"
                  fill="#ef4444"
                  fontSize="8"
                  opacity="0.7"
                >
                  N.A
                </text>
              </>
            )}

            {/* قضبان التسليح */}
            {Array.from({ length: barCount }).map((_, i) => {
              const x = padding + spacing / 2 + i * spacing;
              return (
                <g key={`bar-${i}`}>
                  {/* خط القضيب */}
                  <circle
                    cx={x}
                    cy={barY}
                    r={barRadius}
                    fill="#10b981"
                    fillOpacity="0.9"
                    stroke="#059669"
                    strokeWidth="1"
                  />
                  {/* نقطة مركز القضيب */}
                  <circle
                    cx={x}
                    cy={barY}
                    r={1.5}
                    fill="#065f46"
                  />
                </g>
              );
            })}

            {/* خط التسليح (خط أفقي يربط القضبان) */}
            {barCount > 1 && (
              <line
                x1={padding + spacing / 2}
                y1={barY}
                x2={padding + spacing / 2 + (barCount - 1) * spacing}
                y2={barY}
                stroke="#10b981"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.5"
              />
            )}

            {/* أبعاد: التباعد */}
            {barCount > 1 && (
              <>
                <line
                  x1={padding + spacing / 2}
                  y1={barY + barRadius + 8}
                  x2={padding + spacing / 2}
                  y2={barY + barRadius + 18}
                  stroke="#94a3b8"
                  strokeWidth="0.5"
                />
                <line
                  x1={padding + spacing / 2 + spacing}
                  y1={barY + barRadius + 8}
                  x2={padding + spacing / 2 + spacing}
                  y2={barY + barRadius + 18}
                  stroke="#94a3b8"
                  strokeWidth="0.5"
                />
                <line
                  x1={padding + spacing / 2}
                  y1={barY + barRadius + 14}
                  x2={padding + spacing / 2 + spacing}
                  y2={barY + barRadius + 14}
                  stroke="#94a3b8"
                  strokeWidth="0.5"
                />
                <text
                  x={padding + spacing / 2 + spacing / 2}
                  y={barY + barRadius + 26}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                >
                  s = {spacing.toFixed(1)} cm
                </text>
              </>
            )}

            {/* أبعاد: العمق الفعال h0 */}
            <line
              x1={padding + sectionWidth + 8}
              y1={10}
              x2={padding + sectionWidth + 8}
              y2={barY}
              stroke="#38bdf8"
              strokeWidth="0.8"
            />
            <line
              x1={padding + sectionWidth + 4}
              y1={10}
              x2={padding + sectionWidth + 12}
              y2={10}
              stroke="#38bdf8"
              strokeWidth="0.8"
            />
            <line
              x1={padding + sectionWidth + 4}
              y1={barY}
              x2={padding + sectionWidth + 12}
              y2={barY}
              stroke="#38bdf8"
              strokeWidth="0.8"
            />
            <text
              x={padding + sectionWidth + 16}
              y={(10 + barY) / 2 + 3}
              textAnchor="start"
              fill="#38bdf8"
              fontSize="9"
              fontWeight="bold"
            >
              h₀
            </text>

            {/* التسميات */}
            <text
              x={padding + sectionWidth / 2}
              y={sectionHeight + padding + 5}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
            >
              b = 100 cm
            </text>

            {/* ملخص القضبان */}
            <text
              x={padding + sectionWidth / 2}
              y={sectionHeight + padding + 22}
              textAnchor="middle"
              fill="#10b981"
              fontSize="11"
              fontWeight="bold"
            >
              {barCount}Φ{barDiameter} @ {spacing.toFixed(1)} cm
            </text>

            {/* سهم العمق */}
            <text
              x={padding + 5}
              y={(10 + barY) / 2}
              textAnchor="start"
              fill="#38bdf8"
              fontSize="8"
              opacity="0.6"
            >
              {path === 'roof' ? 'السقف' : 'الجدار'}
            </text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: بطاقة الملاحظات
// ═══════════════════════════════════════════════════════════════════════

function NotesCard({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;

  return (
    <Card className="border-slate-800/60 bg-slate-950/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FlaskConical className="size-4 text-amber-400" />
          ملاحظات المحرك
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {notes.map((note, i) => {
            const isError = note.startsWith('ERR');
            const isWarning = note.startsWith('WARN');
            const isOk = note.startsWith('OK');

            return (
              <div
                key={i}
                className={`flex items-start gap-2 py-2 px-3 rounded-md text-xs ${
                  isError
                    ? 'bg-red-500/5 border border-red-500/20'
                    : isWarning
                      ? 'bg-amber-500/5 border border-amber-500/20'
                      : isOk
                        ? 'bg-emerald-500/5 border border-emerald-500/20'
                        : 'bg-slate-900/50 border border-slate-800/50'
                }`}
              >
                {isError ? (
                  <XCircle className="size-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                ) : isWarning ? (
                  <AlertTriangle className="size-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                ) : isOk ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <CircleDot className="size-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={
                    isError
                      ? 'text-red-300'
                      : isWarning
                        ? 'text-amber-300'
                        : isOk
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                  }
                >
                  {note}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: محتوى تبويب المسار (سقف أو جدار)
// ═══════════════════════════════════════════════════════════════════════

function PathContent({
  data,
  pathLabel,
  path,
}: {
  data: RebarDesignOutput;
  pathLabel: string;
  path: 'roof' | 'wall';
}) {
  return (
    <div className="space-y-6">
      {/* بطاقات النتائج الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KeyResultCard
          label="مساحة التسليح المطلوبة"
          symbol="As"
          value={data.As_required.toFixed(2)}
          unit="cm²/m"
          icon={Sigma}
          colorClass="text-emerald-400"
          borderClass="border-emerald-500/30"
          bgClass="bg-emerald-500/5"
        />
        <KeyResultCard
          label="نسبة التسليح الفعلية"
          symbol="ρ"
          value={(data.rho * 100).toFixed(3)}
          unit="%"
          icon={Layers}
          colorClass="text-cyan-400"
          borderClass="border-cyan-500/30"
          bgClass="bg-cyan-500/5"
        />
        <KeyResultCard
          label="عدد القضبان والقطر"
          symbol="n × Φ"
          value={`${data.barCount} × ${data.barDiameter}`}
          unit="mm"
          icon={Ruler}
          colorClass="text-amber-400"
          borderClass="border-amber-500/30"
          bgClass="bg-amber-500/5"
        />
      </div>

      {/* صف ثانٍ: اختيار القضبان + المقطع العرضي */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RebarSelectionCard data={data} />
        <CrossSectionDiagram data={data} path={path} />
      </div>

      {/* فحوصات التصميم */}
      <DesignChecksCard data={data} />

      {/* الملاحظات */}
      <NotesCard notes={data.notes} />

      {/* ملخص الحالة */}
      <Card className={`border ${
        data.status === 'OK'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : data.status === 'WARNING'
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-red-500/30 bg-red-500/5'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {data.status === 'OK' ? (
              <CheckCircle2 className="size-6 text-emerald-400" />
            ) : data.status === 'WARNING' ? (
              <AlertTriangle className="size-6 text-amber-400" />
            ) : (
              <XCircle className="size-6 text-red-400" />
            )}
            <div>
              <p className={`text-sm font-bold ${
                data.status === 'OK'
                  ? 'text-emerald-400'
                  : data.status === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}>
                حالة التصميم:{' '}
                {data.status === 'OK'
                  ? 'مقبول'
                  : data.status === 'WARNING'
                    ? 'تحذير'
                    : 'مرفوض'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.status === 'OK'
                  ? `تصميم تسليح ${pathLabel} يحقق متطلبات الكود السوري 2024 و UFC 3-340-02`
                  : data.status === 'WARNING'
                    ? `تصميم تسليح ${pathLabel} يحتاج مراجعة — نسبة التسليح أقل من الحد الأدنى`
                    : `تصميم تسليح ${pathLabel} لا يحقق متطلبات الكود — المقطع يحتاج توسيع`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function RebarDesignPage() {
  // حساب تصميم التسليح لكلا المسارين
  const { roof: roofResult, wall: wallResult } = useMemo(() => {
    return calculateRebarBothPaths(
      {
        Mp: STEP7_CEILING.Mp,
        h0: STEP7_CEILING.h0,
        Hp_final: STEP7_CEILING.Hp_final,
      },
      {
        Mp: 10000000, // Mp_wall من STEP8_WALL
        h0: STEP8_WALL.Hc_final / 1.05, // h0 ≈ Hc / 1.05
        Hc_final: STEP8_WALL.Hc_final,
      },
      {
        Rsd: STEP5_ROOF.Rsd,
        Rbd: STEP5_ROOF.Rbd,
        mu_struct_roof: STEP5_ROOF.mu_struct,
        mu_struct_wall: STEP5_WALL.mu_struct,
      }
    );
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ رأس الصفحة ═══ */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30">
          <Wrench className="size-6 text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">تصميم التسليح</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            حساب مساحة الحديد المطلوبة وفحص النسب الدنيا والقصوى — الكود السوري 2024 + UFC 3-340-02
          </p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <Badge
            className={
              roofResult.status === 'OK' && wallResult.status === 'OK'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs'
                : roofResult.status === 'FAILURE' || wallResult.status === 'FAILURE'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 text-xs'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs'
            }
          >
            {roofResult.status === 'OK' && wallResult.status === 'OK'
              ? 'السقف والجدار: مقبول'
              : roofResult.status === 'FAILURE' || wallResult.status === 'FAILURE'
                ? 'يوجد رفض'
                : 'يوجد تحذير'}
          </Badge>
          <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] px-1.5">
            BMK-02
          </Badge>
        </div>
      </div>

      <Separator className="bg-slate-800/60" />

      {/* ═══ تبويبات المسارين ═══ */}
      <Tabs defaultValue="roof" dir="rtl" className="w-full">
        <TabsList className="bg-slate-900/80 border border-slate-800/60 p-1 h-auto">
          <TabsTrigger
            value="roof"
            className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 text-slate-400 px-4 py-2 text-sm border border-transparent rounded-md transition-all"
          >
            تسليح السقف
            <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] mr-2 px-1.5 py-0">
              {roofResult.status === 'OK' ? '✓' : roofResult.status === 'WARNING' ? '⚠' : '✗'}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="wall"
            className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 text-slate-400 px-4 py-2 text-sm border border-transparent rounded-md transition-all"
          >
            تسليح الجدار
            <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] mr-2 px-1.5 py-0">
              {wallResult.status === 'OK' ? '✓' : wallResult.status === 'WARNING' ? '⚠' : '✗'}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ═══ تبويب السقف ═══ */}
        <TabsContent value="roof" className="mt-6">
          <PathContent data={roofResult} pathLabel="السقف" path="roof" />
        </TabsContent>

        {/* ═══ تبويب الجدار ═══ */}
        <TabsContent value="wall" className="mt-6">
          <PathContent data={wallResult} pathLabel="الجدار" path="wall" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
