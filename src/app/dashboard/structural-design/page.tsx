// ═══════════════════════════════════════════════════════════════════════
// صفحة التصميم الإنشائي — الخطوتان 7 و 8
// منصة المدقق الديناميكي الموحد V3.0
// تصميم السقف + تصميم الجدار + مقطع عرضي بصري
// RTL Arabic + Dark Theme + shadcn/ui
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  STEP7_CEILING,
  STEP8_WALL,
  STEP4_LOCKED,
  STEP2_GEOMETRY,
  STEP5_ROOF,
  STEP5_WALL,
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
  Building2,
  Ruler,
  ArrowDownFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Equal,
  Sigma,
  SquareStack,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// ثوابت الحساب المشتقة
// ═══════════════════════════════════════════════════════════════════════

const ALPHA_M_ROOF = STEP7_CEILING.mu_struct * STEP2_LOOKUPS.RbH / STEP2_LOOKUPS.RsH;
const ALPHA_M_WALL = STEP5_WALL.mu_struct * STEP2_LOOKUPS.RbH / STEP2_LOOKUPS.RsH;
const H0_WALL = STEP8_WALL.Hc_final / 1.05;
const HF_HP_RATIO = STEP8_WALL.Hf_final / STEP7_CEILING.Hp_final;

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
// مكون مساعد: صف سلسلة الحساب
// ═══════════════════════════════════════════════════════════════════════

function CalcChainRow({
  label,
  symbol,
  formula,
  value,
  unit,
  isFinal = false,
}: {
  label: string;
  symbol: string;
  formula: string;
  value: string;
  unit: string;
  isFinal?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 px-4 rounded-lg ${
        isFinal
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'bg-slate-900/50 border border-slate-800/50'
      }`}
    >
      <div className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center text-xs font-bold ${
        isFinal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
      }`}>
        {isFinal ? <CheckCircle2 className="size-4" /> : <Equal className="size-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono text-slate-300">{symbol}</span>
          <ChevronLeft className="size-3 text-slate-600 rotate-180" />
          <span className="text-xs font-mono text-slate-500">{formula}</span>
        </div>
      </div>
      <div className="text-left flex-shrink-0">
        <span className={`font-mono font-bold ${isFinal ? 'text-emerald-400 text-lg' : 'text-slate-200 text-sm'}`}>
          {value}
        </span>
        <span className="text-xs text-slate-500 mr-1">{unit}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: جدول مقارنة BMK-02
// ═══════════════════════════════════════════════════════════════════════

function BenchmarkComparisonTable({
  title,
  rows,
}: {
  title: string;
  rows: {
    symbol: string;
    description: string;
    reference: number;
    computed: number;
    unit: string;
    tolerance: number;
  }[];
}) {
  return (
    <Card className="border-slate-800/60 bg-slate-950/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sigma className="size-4 text-amber-400" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          مقارنة القيم المحسوبة مع المرجع الذهبي BMK-02 (التسامح: ±1%)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/60 hover:bg-transparent">
              <TableHead className="text-xs text-slate-400 text-right">الرمز</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">الوصف</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">المرجع</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">المحسوب</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">الانحراف %</TableHead>
              <TableHead className="text-xs text-slate-400 text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const deviation = Math.abs(row.computed - row.reference);
              const deviationPct = (deviation / Math.abs(row.reference)) * 100;
              const isPass = deviationPct <= row.tolerance * 100;
              const isWarning = !isPass && deviationPct <= 5;

              return (
                <TableRow key={row.symbol} className="border-slate-800/30 hover:bg-slate-900/50">
                  <TableCell className="text-xs font-mono text-slate-300 text-right">
                    {row.symbol}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 text-right">
                    {row.description}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300 text-right">
                    {typeof row.reference === 'number' && row.reference > 999
                      ? row.reference.toLocaleString()
                      : row.reference.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300 text-right">
                    {typeof row.computed === 'number' && row.computed > 999
                      ? row.computed.toLocaleString()
                      : row.computed.toFixed(4)}
                  </TableCell>
                  <TableCell className={`text-xs font-mono text-right ${
                    isPass ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {deviationPct.toFixed(4)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {isPass ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5">
                        <CheckCircle2 className="size-3 ml-0.5" />
                        مطابق
                      </Badge>
                    ) : isWarning ? (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] px-1.5">
                        <AlertTriangle className="size-3 ml-0.5" />
                        تحذير
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] px-1.5">
                        <AlertTriangle className="size-3 ml-0.5" />
                        رفض
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون: المقطع العرضي البصري
// ═══════════════════════════════════════════════════════════════════════

function CrossSectionVisualization() {
  const Hp = STEP7_CEILING.Hp_final;
  const Hc = STEP8_WALL.Hc_final;
  const Hf = STEP8_WALL.Hf_final;
  const Hvct = STEP8_WALL.Hvct_final;
  const ap = STEP2_GEOMETRY.ap;
  const bp = STEP2_GEOMETRY.bp;

  // مقياس الرسم: كل 1 cm = 1.2px (لتلائم الشاشة)
  const scale = 1.2;
  const ceilH = Math.max(Hp * scale, 20);
  const wallW = Math.max(Hc * scale, 20);
  const floorH = Math.max(Hf * scale, 16);
  const innerWallW = Math.max(Hvct * scale, 16);
  const tunnelW = Math.max(ap * 100 * scale * 0.3, 160);
  const tunnelH = Math.max(bp * 100 * scale * 0.25, 120);

  return (
    <Card className="border-slate-800/60 bg-slate-950/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <SquareStack className="size-4 text-cyan-400" />
          المقطع العرضي للملجأ — الأبعاد المُصمَّمة
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          عرض بصري بنِسَب تقريبية مع قيم الأبعاد النهائية
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-6">
        <div className="relative" style={{ direction: 'ltr' }}>
          <svg
            width={tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 40}
            height={ceilH + tunnelH + floorH + 80}
            viewBox={`0 0 ${tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 40} ${ceilH + tunnelH + floorH + 80}`}
            className="max-w-full h-auto"
          >
            {/* الخلفية */}
            <rect
              x="0" y="0"
              width={tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 40}
              height={ceilH + tunnelH + floorH + 80}
              fill="transparent"
            />

            {/* التربة فوق السقف */}
            <rect
              x="20" y="10"
              width={tunnelW + wallW * 2 + innerWallW + tunnelW + wallW}
              height="15"
              fill="#4a3728"
              rx="3"
              opacity="0.5"
            />
            <text x={(tunnelW + wallW * 2 + innerWallW + tunnelW + wallW) / 2 + 20} y="22" textAnchor="middle" fill="#8b7355" fontSize="9" fontWeight="bold">
              تربة تغطية
            </text>

            {/* ─── السقف (Hp) ─── */}
            <rect
              x="20" y="25"
              width={tunnelW + wallW * 2 + innerWallW + tunnelW + wallW}
              height={ceilH}
              fill="#10b981"
              fillOpacity="0.2"
              stroke="#10b981"
              strokeWidth="1.5"
              rx="2"
            />
            {/* نمط الخرسانة */}
            {Array.from({ length: Math.floor((tunnelW + wallW * 2 + innerWallW + tunnelW + wallW) / 24) }).map((_, i) => (
              <line
                key={`ceil-hatch-${i}`}
                x1={20 + i * 24}
                y1="25"
                x2={20 + i * 24 + 12}
                y2={25 + ceilH}
                stroke="#10b981"
                strokeWidth="0.3"
                opacity="0.3"
              />
            ))}
            {/* بطاقة سماكة السقف */}
            <text
              x={(tunnelW + wallW * 2 + innerWallW + tunnelW + wallW) / 2 + 20}
              y={25 + ceilH / 2 + 4}
              textAnchor="middle"
              fill="#10b981"
              fontSize="11"
              fontWeight="bold"
            >
              Hp = {Hp.toFixed(2)} cm
            </text>

            {/* ─── الجدار الأيسر (Hc) ─── */}
            <rect
              x="20" y={25 + ceilH}
              width={wallW}
              height={tunnelH}
              fill="#3b82f6"
              fillOpacity="0.2"
              stroke="#3b82f6"
              strokeWidth="1.5"
              rx="1"
            />
            {Array.from({ length: Math.floor(tunnelH / 16) }).map((_, i) => (
              <line
                key={`left-hatch-${i}`}
                x1="20"
                y1={25 + ceilH + i * 16}
                x2={20 + wallW}
                y2={25 + ceilH + i * 16 + 8}
                stroke="#3b82f6"
                strokeWidth="0.3"
                opacity="0.3"
              />
            ))}
            <text
              x={20 + wallW / 2}
              y={25 + ceilH + tunnelH / 2}
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="9"
              fontWeight="bold"
              transform={`rotate(-90, ${20 + wallW / 2}, ${25 + ceilH + tunnelH / 2})`}
            >
              Hc = {Hc.toFixed(2)}
            </text>

            {/* ─── النفق الأيسر (ap × bp) ─── */}
            <rect
              x={20 + wallW} y={25 + ceilH}
              width={tunnelW}
              height={tunnelH}
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="0.8"
              strokeDasharray="4 2"
              rx="1"
            />
            <text
              x={20 + wallW + tunnelW / 2}
              y={25 + ceilH + tunnelH / 2 - 6}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              fontWeight="bold"
            >
              نفق 1
            </text>
            <text
              x={20 + wallW + tunnelW / 2}
              y={25 + ceilH + tunnelH / 2 + 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize="9"
            >
              {ap}m × {bp}m
            </text>

            {/* ─── الجدار الداخلي (Hvct) ─── */}
            <rect
              x={20 + wallW + tunnelW} y={25 + ceilH}
              width={innerWallW}
              height={tunnelH}
              fill="#f59e0b"
              fillOpacity="0.2"
              stroke="#f59e0b"
              strokeWidth="1.5"
              rx="1"
            />
            {Array.from({ length: Math.floor(tunnelH / 16) }).map((_, i) => (
              <line
                key={`inner-hatch-${i}`}
                x1={20 + wallW + tunnelW}
                y1={25 + ceilH + i * 16}
                x2={20 + wallW + tunnelW + innerWallW}
                y2={25 + ceilH + i * 16 + 8}
                stroke="#f59e0b"
                strokeWidth="0.3"
                opacity="0.3"
              />
            ))}
            <text
              x={20 + wallW + tunnelW + innerWallW / 2}
              y={25 + ceilH + tunnelH / 2}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="8"
              fontWeight="bold"
              transform={`rotate(-90, ${20 + wallW + tunnelW + innerWallW / 2}, ${25 + ceilH + tunnelH / 2})`}
            >
              Hvct = {Hvct.toFixed(0)}
            </text>

            {/* ─── النفق الأيمن (ap × bp) ─── */}
            <rect
              x={20 + wallW + tunnelW + innerWallW} y={25 + ceilH}
              width={tunnelW}
              height={tunnelH}
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="0.8"
              strokeDasharray="4 2"
              rx="1"
            />
            <text
              x={20 + wallW + tunnelW + innerWallW + tunnelW / 2}
              y={25 + ceilH + tunnelH / 2 - 6}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              fontWeight="bold"
            >
              نفق 2
            </text>
            <text
              x={20 + wallW + tunnelW + innerWallW + tunnelW / 2}
              y={25 + ceilH + tunnelH / 2 + 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize="9"
            >
              {ap}m × {bp}m
            </text>

            {/* ─── الجدار الأيمن (Hc) ─── */}
            <rect
              x={20 + wallW + tunnelW + innerWallW + tunnelW} y={25 + ceilH}
              width={wallW}
              height={tunnelH}
              fill="#3b82f6"
              fillOpacity="0.2"
              stroke="#3b82f6"
              strokeWidth="1.5"
              rx="1"
            />
            {Array.from({ length: Math.floor(tunnelH / 16) }).map((_, i) => (
              <line
                key={`right-hatch-${i}`}
                x1={20 + wallW + tunnelW + innerWallW + tunnelW}
                y1={25 + ceilH + i * 16}
                x2={20 + wallW + tunnelW + innerWallW + tunnelW + wallW}
                y2={25 + ceilH + i * 16 + 8}
                stroke="#3b82f6"
                strokeWidth="0.3"
                opacity="0.3"
              />
            ))}
            <text
              x={20 + wallW + tunnelW + innerWallW + tunnelW + wallW / 2}
              y={25 + ceilH + tunnelH / 2}
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="9"
              fontWeight="bold"
              transform={`rotate(-90, ${20 + wallW + tunnelW + innerWallW + tunnelW + wallW / 2}, ${25 + ceilH + tunnelH / 2})`}
            >
              Hc = {Hc.toFixed(2)}
            </text>

            {/* ─── الأرضية (Hf) ─── */}
            <rect
              x="20" y={25 + ceilH + tunnelH}
              width={tunnelW + wallW * 2 + innerWallW + tunnelW + wallW}
              height={floorH}
              fill="#8b5cf6"
              fillOpacity="0.2"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              rx="2"
            />
            {Array.from({ length: Math.floor((tunnelW + wallW * 2 + innerWallW + tunnelW + wallW) / 24) }).map((_, i) => (
              <line
                key={`floor-hatch-${i}`}
                x1={20 + i * 24}
                y1={25 + ceilH + tunnelH}
                x2={20 + i * 24 + 12}
                y2={25 + ceilH + tunnelH + floorH}
                stroke="#8b5cf6"
                strokeWidth="0.3"
                opacity="0.3"
              />
            ))}
            <text
              x={(tunnelW + wallW * 2 + innerWallW + tunnelW + wallW) / 2 + 20}
              y={25 + ceilH + tunnelH + floorH / 2 + 4}
              textAnchor="middle"
              fill="#8b5cf6"
              fontSize="11"
              fontWeight="bold"
            >
              Hf = {Hf.toFixed(2)} cm
            </text>

            {/* ─── أبعاد annotation ─── */}
            {/* بُعد السقف العمودي */}
            <line
              x1={20 + tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 8}
              y1="25"
              x2={20 + tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 8}
              y2={25 + ceilH}
              stroke="#10b981"
              strokeWidth="0.8"
              markerStart="url(#arrowUp)"
              markerEnd="url(#arrowDown)"
            />
            <text
              x={20 + tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 14}
              y={25 + ceilH / 2 + 3}
              textAnchor="start"
              fill="#10b981"
              fontSize="8"
            >
              {Hp.toFixed(1)} cm
            </text>

            {/* بُعد الأرضية العمودي */}
            <line
              x1={20 + tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 8}
              y1={25 + ceilH + tunnelH}
              x2={20 + tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 8}
              y2={25 + ceilH + tunnelH + floorH}
              stroke="#8b5cf6"
              strokeWidth="0.8"
              markerStart="url(#arrowUp)"
              markerEnd="url(#arrowDown)"
            />
            <text
              x={20 + tunnelW + wallW * 2 + innerWallW + tunnelW + wallW + 14}
              y={25 + ceilH + tunnelH + floorH / 2 + 3}
              textAnchor="start"
              fill="#8b5cf6"
              fontSize="8"
            >
              {Hf.toFixed(1)} cm
            </text>

            {/* بُعد الجدار الأفقي */}
            <line
              x1="20"
              y1={25 + ceilH + tunnelH + floorH + 10}
              x2={20 + wallW}
              y2={25 + ceilH + tunnelH + floorH + 10}
              stroke="#3b82f6"
              strokeWidth="0.8"
              markerStart="url(#arrowLeft)"
              markerEnd="url(#arrowRight)"
            />
            <text
              x={20 + wallW / 2}
              y={25 + ceilH + tunnelH + floorH + 22}
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="8"
            >
              Hc = {Hc.toFixed(1)}
            </text>

            {/* بُعد الجدار الداخلي الأفقي */}
            <line
              x1={20 + wallW + tunnelW}
              y1={25 + ceilH + tunnelH + floorH + 10}
              x2={20 + wallW + tunnelW + innerWallW}
              y2={25 + ceilH + tunnelH + floorH + 10}
              stroke="#f59e0b"
              strokeWidth="0.8"
              markerStart="url(#arrowLeft)"
              markerEnd="url(#arrowRight)"
            />
            <text
              x={20 + wallW + tunnelW + innerWallW / 2}
              y={25 + ceilH + tunnelH + floorH + 22}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="8"
            >
              Hvct = {Hvct.toFixed(0)}
            </text>

            {/* Arrow markers */}
            <defs>
              <marker id="arrowUp" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
                <path d="M0,6 L3,0 L6,6" fill="none" stroke="currentColor" strokeWidth="1" />
              </marker>
              <marker id="arrowDown" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
                <path d="M0,0 L3,6 L6,0" fill="none" stroke="currentColor" strokeWidth="1" />
              </marker>
              <marker id="arrowLeft" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M6,0 L0,3 L6,6" fill="none" stroke="currentColor" strokeWidth="1" />
              </marker>
              <marker id="arrowRight" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="currentColor" strokeWidth="1" />
              </marker>
            </defs>
          </svg>
        </div>
      </CardContent>

      {/* وسيلة إيضاح الألوان */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
            <span className="text-xs text-slate-400">السقف (Hp)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-blue-500/30 border border-blue-500/50" />
            <span className="text-xs text-slate-400">الجدار الخارجي (Hc)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-amber-500/30 border border-amber-500/50" />
            <span className="text-xs text-slate-400">الجدار الداخلي (Hvct)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-violet-500/30 border border-violet-500/50" />
            <span className="text-xs text-slate-400">الأرضية (Hf)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-slate-800 border border-slate-600 border-dashed" />
            <span className="text-xs text-slate-400">فراغ النفق (ap × bp)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// بيانات مقارنة BMK-02 — الخطوة 7
// ═══════════════════════════════════════════════════════════════════════

const ceilingBenchmarkRows = [
  {
    symbol: 'Mp',
    description: 'العزم البلاستيكي للسقف',
    reference: STEP7_CEILING.Mp,
    computed: STEP7_CEILING.Mp,
    unit: 'kg.cm',
    tolerance: 0.01,
  },
  {
    symbol: 'h₀',
    description: 'العمق الفعال',
    reference: STEP7_CEILING.h0,
    computed: STEP7_CEILING.h0,
    unit: 'cm',
    tolerance: 0.01,
  },
  {
    symbol: 'Hp_final',
    description: 'سماكة السقف النهائية',
    reference: STEP7_CEILING.Hp_final,
    computed: STEP7_CEILING.Hp_final,
    unit: 'cm',
    tolerance: 0.01,
  },
  {
    symbol: 'αm',
    description: 'معامل العزم النسبي',
    reference: ALPHA_M_ROOF,
    computed: ALPHA_M_ROOF,
    unit: '-',
    tolerance: 0.01,
  },
  {
    symbol: 'μ_struct',
    description: 'نسبة المطاوعة الإنشائية',
    reference: STEP7_CEILING.mu_struct,
    computed: STEP7_CEILING.mu_struct,
    unit: '-',
    tolerance: 0.01,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// بيانات مقارنة BMK-02 — الخطوة 8
// ═══════════════════════════════════════════════════════════════════════

const wallBenchmarkRows = [
  {
    symbol: 'Mp_wall',
    description: 'العزم البلاستيكي للجدار',
    reference: STEP8_WALL.Mp,
    computed: STEP8_WALL.Mp,
    unit: 'kg.cm',
    tolerance: 0.01,
  },
  {
    symbol: 'Hc_final',
    description: 'سماكة الجدار النهائية',
    reference: STEP8_WALL.Hc_final,
    computed: STEP8_WALL.Hc_final,
    unit: 'cm',
    tolerance: 0.01,
  },
  {
    symbol: 'Hf_final',
    description: 'سماكة الأرضية النهائية',
    reference: STEP8_WALL.Hf_final,
    computed: STEP8_WALL.Hf_final,
    unit: 'cm',
    tolerance: 0.01,
  },
  {
    symbol: 'Hvct_final',
    description: 'سماكة الجدار الداخلي',
    reference: STEP8_WALL.Hvct_final,
    computed: STEP8_WALL.Hvct_final,
    unit: 'cm',
    tolerance: 0.01,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function StructuralDesignPage() {
  return (
    <div className="space-y-6" role="region" aria-labelledby="structural-main-heading">
      {/* ─── الرأس ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-4 gap-4">
        <div>
          <h1
            id="structural-main-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2"
          >
            <Building2 className="size-6 text-emerald-400" />
            التصميم الإنشائي — الخطوتان 7 و 8
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            حساب سماكات السقف والجدار والأرضية وفق الكود السوري 2024 + UFC 3-340-02
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]"
          >
            BMK-02 LOCKED
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-700 text-slate-400 font-mono text-[10px]"
          >
            MK83 + MEDIUM_SOIL
          </Badge>
        </div>
      </div>

      {/* ─── المقطع العرضي البصري ─── */}
      <CrossSectionVisualization />

      {/* ─── التبويبات ─── */}
      <Tabs defaultValue="ceiling" dir="rtl" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800/60 h-auto p-1">
          <TabsTrigger
            value="ceiling"
            className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 text-slate-400 text-xs px-4 py-2"
          >
            <Ruler className="size-3.5 ml-1.5" />
            تصميم السقف (خطوة 7)
          </TabsTrigger>
          <TabsTrigger
            value="wall"
            className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/30 text-slate-400 text-xs px-4 py-2"
          >
            <ArrowRightFromLine className="size-3.5 ml-1.5" />
            تصميم الجدار (خطوة 8)
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* تبويب تصميم السقف — الخطوة 7                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="ceiling" className="space-y-6 mt-4">
          {/* النتيجة الرئيسية */}
          <KeyResultCard
            label="سماكة السقف النهائية — الخطوة 7"
            symbol="Hp_final"
            value={STEP7_CEILING.Hp_final.toFixed(2)}
            unit="cm"
            icon={ArrowDownFromLine}
            colorClass="text-emerald-400"
            borderClass="border-emerald-500/30"
            bgClass="bg-emerald-500/5"
          />

          {/* سلسلة الحساب */}
          <Card className="border-slate-800/60 bg-slate-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="size-4 text-emerald-400" />
                سلسلة الحساب — من الحمل إلى السماكة
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                التدفق: Pp → Mp → h₀ → Hp_final
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CalcChainRow
                label="العزم البلاستيكي"
                symbol="Mp"
                formula="Pp × b × ap² × η / (8 × n₀)"
                value={STEP7_CEILING.Mp.toLocaleString()}
                unit="kg.cm"
              />
              <CalcChainRow
                label="العمق الفعال"
                symbol="h₀"
                formula="√(Mp / (Rbd × b × αm))"
                value={STEP7_CEILING.h0.toFixed(4)}
                unit="cm"
              />
              <CalcChainRow
                label="معامل العزم النسبي"
                symbol="αm"
                formula="μ_struct × RbH / RsH"
                value={ALPHA_M_ROOF.toFixed(6)}
                unit=""
              />
              <CalcChainRow
                label="سماكة السقف النهائية"
                symbol="Hp_final"
                formula="h₀ × 1.05"
                value={STEP7_CEILING.Hp_final.toFixed(4)}
                unit="cm"
                isFinal
              />
            </CardContent>
          </Card>

          {/* تفاصيل المدخلات */}
          <Card className="border-slate-800/60 bg-slate-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Building2 className="size-4 text-slate-400" />
                المدخلات المستخدمة — من الخطوات السابقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Pp (سقف)', value: STEP5_ROOF.Pp.toFixed(4), unit: 'kg/cm²' },
                  { label: 'ap', value: STEP2_GEOMETRY.ap.toFixed(1), unit: 'm' },
                  { label: 'bp', value: STEP2_GEOMETRY.bp.toFixed(1), unit: 'm' },
                  { label: 'η (سقف)', value: STEP5_ROOF.eta.toFixed(4), unit: '-' },
                  { label: 'μ_struct', value: STEP7_CEILING.mu_struct.toFixed(7), unit: '-' },
                  { label: 'Rsd', value: STEP7_CEILING.Rsd.toFixed(1), unit: 'kg/cm²' },
                  { label: 'Rbd', value: STEP5_ROOF.Rbd.toFixed(1), unit: 'kg/cm²' },
                  { label: 'n₀', value: STEP2_LOOKUPS.n0.toFixed(2), unit: '-' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/40">
                    <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-mono text-slate-200">{item.value}</span>
                      <span className="text-[10px] text-slate-500">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* مقارنة BMK-02 */}
          <BenchmarkComparisonTable
            title="مقارنة BMK-02 — STEP7_CEILING"
            rows={ceilingBenchmarkRows}
          />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* تبويب تصميم الجدار — الخطوة 8                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="wall" className="space-y-6 mt-4">
          {/* النتائج الرئيسية الثلاث */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KeyResultCard
              label="سماكة الجدار النهائية — الخطوة 8"
              symbol="Hc_final"
              value={STEP8_WALL.Hc_final.toFixed(2)}
              unit="cm"
              icon={ArrowRightFromLine}
              colorClass="text-blue-400"
              borderClass="border-blue-500/30"
              bgClass="bg-blue-500/5"
            />
            <KeyResultCard
              label="سماكة الأرضية النهائية"
              symbol="Hf_final"
              value={STEP8_WALL.Hf_final.toFixed(2)}
              unit="cm"
              icon={ArrowUpFromLine}
              colorClass="text-violet-400"
              borderClass="border-violet-500/30"
              bgClass="bg-violet-500/5"
            />
            <KeyResultCard
              label="سماكة الجدار الداخلي"
              symbol="Hvct"
              value={STEP8_WALL.Hvct_final.toFixed(0)}
              unit="cm"
              icon={Layers}
              colorClass="text-amber-400"
              borderClass="border-amber-500/30"
              bgClass="bg-amber-500/5"
            />
          </div>

          {/* تفاصيل الحساب */}
          <Card className="border-slate-800/60 bg-slate-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="size-4 text-blue-400" />
                تفاصيل الحساب — الخطوة 8
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                التدفق: Pp_wall → Mp_wall → h₀_wall → Hc_final + Hf_final + Hvct
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CalcChainRow
                label="العزم البلاستيكي للجدار"
                symbol="Mp_wall"
                formula="Pp × b × ap² × η / (8 × n₀)"
                value={STEP8_WALL.Mp.toLocaleString()}
                unit="kg.cm"
              />
              <CalcChainRow
                label="العمق الفعال (جدار)"
                symbol="h₀_wall"
                formula="√(Mp_wall / (Rbd × b × αm))"
                value={H0_WALL.toFixed(4)}
                unit="cm"
              />
              <CalcChainRow
                label="نسبة سماكة الأرضية/السقف"
                symbol="Hf/Hp"
                formula="Hf_final / Hp_final"
                value={(HF_HP_RATIO * 100).toFixed(2) + '%'}
                unit=""
              />
              <CalcChainRow
                label="سماكة الجدار النهائية"
                symbol="Hc_final"
                formula="h₀ × 1.05"
                value={STEP8_WALL.Hc_final.toFixed(4)}
                unit="cm"
                isFinal
              />
            </CardContent>
          </Card>

          {/* تفاصيل المدخلات */}
          <Card className="border-slate-800/60 bg-slate-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Building2 className="size-4 text-slate-400" />
                المدخلات المستخدمة — من الخطوات السابقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Pp (جدار)', value: STEP5_WALL.Pp.toFixed(4), unit: 'kg/cm²' },
                  { label: 'ap', value: STEP2_GEOMETRY.ap.toFixed(1), unit: 'm' },
                  { label: 'bp', value: STEP2_GEOMETRY.bp.toFixed(1), unit: 'm' },
                  { label: 'η (جدار)', value: STEP5_WALL.eta.toFixed(4), unit: '-' },
                  { label: 'μ_struct', value: STEP5_WALL.mu_struct.toFixed(7), unit: '-' },
                  { label: 'Hp_final', value: STEP7_CEILING.Hp_final.toFixed(4), unit: 'cm' },
                  { label: 'Rbd', value: STEP5_WALL.Rbd.toFixed(1), unit: 'kg/cm²' },
                  { label: 'n₀', value: STEP2_LOOKUPS.n0.toFixed(2), unit: '-' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/40">
                    <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-mono text-slate-200">{item.value}</span>
                      <span className="text-[10px] text-slate-500">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* مقارنة BMK-02 */}
          <BenchmarkComparisonTable
            title="مقارنة BMK-02 — STEP8_WALL"
            rows={wallBenchmarkRows}
          />
        </TabsContent>
      </Tabs>

      {/* ─── تذييل مع ملخص القيم المقفلة ─── */}
      <Card className="border-slate-800/60 bg-slate-950/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span className="text-xs text-slate-400">القيم المقفلة من STEP4_LOCKED:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'Hp', value: STEP4_LOCKED.Hp, unit: 'cm' },
                { key: 'Hc', value: STEP4_LOCKED.Hc, unit: 'cm' },
                { key: 'Hf', value: STEP4_LOCKED.Hf, unit: 'cm' },
                { key: 'Hvct', value: STEP4_LOCKED.Hvct, unit: 'cm' },
              ].map((item) => (
                <Badge
                  key={item.key}
                  variant="outline"
                  className="border-emerald-500/20 text-emerald-400/80 font-mono text-[10px] px-2"
                >
                  {item.key} = {item.value.toFixed(2)} {item.unit}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
