// ═══════════════════════════════════════════════════════════════════════
// الخطوة 2 — المدخلات والجداول المرجعية
// منصة المدقق الديناميكي الموحد V3.1
// عرض بيانات السلاح، جداول الاستيفاء، والبيانات الهندسية (مقفلة BMK-02)
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import {
  STEP2_INPUTS,
  STEP2_LOOKUPS,
  STEP2_GEOMETRY,
} from '@/lib/constants/reference-data';

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
  Lock,
  Database,
  Table2,
  Layers,
  Crosshair,
  ShieldCheck,
  Cuboid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════════════
// أنواع مساعدة
// ═══════════════════════════════════════════════════════════════════════

interface DataRow {
  key: string;
  labelAr: string;
  symbol: string;
  value: number;
  unit: string;
  locked: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// بيانات الجداول
// ═══════════════════════════════════════════════════════════════════════

const WEAPON_DATA: DataRow[] = [
  { key: 'P', labelAr: 'وزن القنبلة', symbol: 'P', value: STEP2_INPUTS.P, unit: 'kg', locked: true },
  { key: 'lo_b', labelAr: 'الطول الكلي', symbol: 'l₀_b', value: STEP2_INPUTS.lo_b, unit: 'm', locked: true },
  { key: 'lk', labelAr: 'طول الجسم', symbol: 'lk', value: STEP2_INPUTS.lk, unit: 'm', locked: true },
  { key: 'dk', labelAr: 'قطر القنبلة', symbol: 'dk', value: STEP2_INPUTS.dk, unit: 'm', locked: true },
  { key: 'ld_ratio', labelAr: 'نسبة الطول للقطر', symbol: 'L/D', value: STEP2_INPUTS.ld_ratio, unit: '—', locked: true },
  { key: 'lhd_ratio', labelAr: 'نسبة طول الرأس للقطر', symbol: 'Lh/D', value: STEP2_INPUTS.lhd_ratio, unit: '—', locked: true },
  { key: 'C', labelAr: 'وزن الشحنة', symbol: 'C', value: STEP2_INPUTS.C, unit: 'kg', locked: true },
  { key: 'V', labelAr: 'سرعة الاصطدام', symbol: 'V', value: STEP2_INPUTS.V, unit: 'm/s', locked: true },
  { key: 'alpha', labelAr: 'زاوية الاصطدام', symbol: 'α', value: STEP2_INPUTS.alpha, unit: '°', locked: true },
  { key: 'beta', labelAr: 'زاوية الانعكاس', symbol: 'β', value: STEP2_INPUTS.beta, unit: '°', locked: true },
  { key: 'Z', labelAr: 'عمق السقف', symbol: 'Z', value: STEP2_INPUTS.Z, unit: 'm', locked: true },
];

const LOOKUP_DATA: DataRow[] = [
  { key: 'K1', labelAr: 'معامل المتفجرات', symbol: 'K₁', value: STEP2_LOOKUPS.K1, unit: '—', locked: true },
  { key: 'kpr_g', labelAr: 'معامل اختراق التربة', symbol: 'kpr_g', value: STEP2_LOOKUPS.kpr_g, unit: '—', locked: true },
  { key: 'kpr_b', labelAr: 'معامل اختراق الخرسانة', symbol: 'kpr_b', value: STEP2_LOOKUPS.kpr_b, unit: '—', locked: true },
  { key: 'RbH', labelAr: 'مقاومة الخرسانة', symbol: 'RbH', value: STEP2_LOOKUPS.RbH, unit: 'kg/cm²', locked: true },
  { key: 'RsH', labelAr: 'إجهاد خضوع الحديد', symbol: 'RsH', value: STEP2_LOOKUPS.RsH, unit: 'kg/cm²', locked: true },
  { key: 'gamma_b', labelAr: 'كثافة الخرسانة', symbol: 'γb', value: STEP2_LOOKUPS.gamma_b, unit: 'kg/m³', locked: true },
  { key: 'gamma_g', labelAr: 'كثافة التربة', symbol: 'γg', value: STEP2_LOOKUPS.gamma_g, unit: 'kg/m³', locked: true },
  { key: 'Kpod_b', labelAr: 'معامل التأسيس خرسانة', symbol: 'Kpod_b', value: STEP2_LOOKUPS.Kpod_b, unit: '—', locked: true },
  { key: 'Kpod_s', labelAr: 'معامل التأسيس تربة', symbol: 'Kpod_s', value: STEP2_LOOKUPS.Kpod_s, unit: '—', locked: true },
  { key: 'n0', labelAr: 'معامل الأمان', symbol: 'n₀', value: STEP2_LOOKUPS.n0, unit: '—', locked: true },
  { key: 'R_bar', labelAr: 'معامل البعد المختزل', symbol: 'R̄', value: STEP2_LOOKUPS.R_bar, unit: '—', locked: true },
];

const GEOMETRY_DATA: DataRow[] = [
  { key: 'a_et', labelAr: 'عدد الطوابق', symbol: 'a_et', value: STEP2_GEOMETRY.a_et, unit: '—', locked: true },
  { key: 'bp', labelAr: 'البحر الطويل', symbol: 'bp', value: STEP2_GEOMETRY.bp, unit: 'm', locked: true },
  { key: 'ap', labelAr: 'البحر القصير', symbol: 'ap', value: STEP2_GEOMETRY.ap, unit: 'm', locked: true },
  { key: 'Lk', labelAr: 'طول الكابول', symbol: 'Lk', value: STEP2_GEOMETRY.Lk, unit: 'cm', locked: true },
  { key: 'Bk', labelAr: 'عرض الكابول', symbol: 'Bk', value: STEP2_GEOMETRY.Bk, unit: 'cm', locked: true },
  { key: 'Pk', labelAr: 'حمل الكابول', symbol: 'Pk', value: STEP2_GEOMETRY.Pk, unit: '—', locked: true },
  { key: 'Hct', labelAr: 'سماكة السقف التصميمية', symbol: 'Hct', value: STEP2_GEOMETRY.Hct, unit: 'm', locked: true },
  { key: 'Hvct', labelAr: 'سماكة الجدار الداخلي', symbol: 'Hvct', value: STEP2_GEOMETRY.Hvct, unit: 'm', locked: true },
  { key: 'Hf', labelAr: 'سماكة الأرضية', symbol: 'Hf', value: STEP2_GEOMETRY.Hf, unit: 'm', locked: true },
  { key: 'Hp', labelAr: 'سماكة السقف', symbol: 'Hp', value: STEP2_GEOMETRY.Hp, unit: 'm', locked: true },
  { key: 'Ea', labelAr: 'معامل المرونة', symbol: 'Ea', value: STEP2_GEOMETRY.Ea, unit: 'kg/cm²', locked: true },
  { key: 'xi', labelAr: 'معامل التخميد', symbol: 'ξ', value: STEP2_GEOMETRY.xi, unit: '—', locked: true },
];

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function formatValue(value: number): string {
  if (!isFinite(value)) return '—';
  if (Math.abs(value) < 0.001 && value !== 0) return value.toExponential(1);
  if (value >= 10000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 100) return value.toFixed(2);
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(4);
}

// ═══════════════════════════════════════════════════════════════════════
// المكوّن الفرعي: جدول بيانات
// ═══════════════════════════════════════════════════════════════════════

function DataTable({
  title,
  icon: Icon,
  badgeText,
  data,
}: {
  title: string;
  icon: React.ElementType;
  badgeText: string;
  data: DataRow[];
}) {
  return (
    <Card className="bg-slate-900/80 border-slate-800/60 overflow-hidden">
      {/* شريط علوي ملون */}
      <div className="h-0.5 bg-emerald-500/60" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Icon className="size-4 text-emerald-400" />
          {title}
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0 mr-2"
          >
            {badgeText}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-700/40 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs font-semibold w-8 text-center">
                  #
                </TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold">
                  الوصف
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
                <TableHead className="text-slate-400 text-xs font-semibold text-center">
                  الحالة
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow
                  key={row.key}
                  className={`border-b border-slate-800/60 ${
                    idx % 2 === 0 ? 'bg-slate-800/20' : ''
                  } hover:bg-slate-800/40`}
                >
                  <TableCell className="py-2.5 text-center text-slate-600 text-xs font-mono">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-300 font-medium">
                    {row.labelAr}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 font-mono text-[11px] px-1.5 py-0"
                    >
                      {row.symbol}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-left font-mono text-emerald-400 font-semibold">
                    {formatValue(row.value)}
                  </TableCell>
                  <TableCell className="py-2.5 text-center text-xs text-slate-500 font-mono">
                    {row.unit}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {row.locked ? (
                      <Lock className="size-3.5 text-amber-500/80 inline-block" />
                    ) : (
                      <span className="text-slate-600 text-[10px]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function Step2InputsPage() {
  const totalFields = WEAPON_DATA.length + LOOKUP_DATA.length + GEOMETRY_DATA.length;
  const lockedFields = [...WEAPON_DATA, ...LOOKUP_DATA, ...GEOMETRY_DATA].filter(
    (d) => d.locked
  ).length;

  return (
    <div
      className="space-y-6"
      dir="rtl"
      role="region"
      aria-labelledby="step2-main-heading"
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* الرأس الرئيسي                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-4 gap-4">
        <div>
          <h1
            id="step2-main-heading"
            className="text-xl font-bold text-slate-100 flex items-center gap-2"
          >
            <Database className="size-5 text-emerald-400" />
            الخطوة 2: المدخلات والجداول المرجعية
            <Badge className="bg-emerald-600/80 text-white text-[10px] px-2 py-0.5 mr-2">
              إكسيل 1
            </Badge>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            بيانات السلاح ومعاملات التربة والقيم الهندسية المرجعية للحالة القياسية BMK-02
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-400 text-[10px] px-2 py-0.5"
          >
            <Lock className="size-3 ml-1" />
            مقفل
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-700 text-slate-400 font-mono text-[10px]"
          >
            {lockedFields}/{totalFields} قيم مقفلة
          </Badge>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* القسم أ — بيانات السلاح                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="weapon-heading">
        <DataTable
          title="بيانات السلاح"
          icon={Crosshair}
          badgeText={`${WEAPON_DATA.length} حقول`}
          data={WEAPON_DATA}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* القسم ب — جداول الاستيفاء                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="lookup-heading">
        <DataTable
          title="جداول الاستيفاء"
          icon={Table2}
          badgeText={`${LOOKUP_DATA.length} حقول`}
          data={LOOKUP_DATA}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* القسم ج — البيانات الهندسية                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="geometry-heading">
        <DataTable
          title="البيانات الهندسية"
          icon={Cuboid}
          badgeText={`${GEOMETRY_DATA.length} حقول`}
          data={GEOMETRY_DATA}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* حالة القفل                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-900/80 border-slate-800/60 overflow-hidden">
        <div className="h-0.5 bg-amber-500/40" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="size-4 text-amber-400" />
            حالة القفل — الحالة المرجعية BMK-02
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* بيانات السلاح */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/40">
              <div className="flex items-center gap-2 mb-3">
                <Crosshair className="size-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  بيانات السلاح
                </span>
                <Lock className="size-3 text-amber-500/70 mr-auto" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">السلاح</span>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 text-[10px] px-1.5 py-0"
                  >
                    MK-83
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">المتفجرات</span>
                  <Badge
                    variant="outline"
                    className="border-slate-600 text-slate-300 text-[10px] px-1.5 py-0"
                  >
                    Tritonal 80/20
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">الحقول</span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {WEAPON_DATA.length} مقفل
                  </span>
                </div>
              </div>
            </div>

            {/* جداول الاستيفاء */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/40">
              <div className="flex items-center gap-2 mb-3">
                <Table2 className="size-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  جداول الاستيفاء
                </span>
                <Lock className="size-3 text-amber-500/70 mr-auto" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">التربة</span>
                  <Badge
                    variant="outline"
                    className="border-slate-600 text-slate-300 text-[10px] px-1.5 py-0"
                  >
                    MEDIUM_SOIL
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">المصدر</span>
                  <span className="text-[11px] text-slate-400">
                    الكود السوري / UFC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">الحقول</span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {LOOKUP_DATA.length} مقفل
                  </span>
                </div>
              </div>
            </div>

            {/* البيانات الهندسية */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/40">
              <div className="flex items-center gap-2 mb-3">
                <Cuboid className="size-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  البيانات الهندسية
                </span>
                <Lock className="size-3 text-amber-500/70 mr-auto" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">النوع</span>
                  <Badge
                    variant="outline"
                    className="border-slate-600 text-slate-300 text-[10px] px-1.5 py-0"
                  >
                    منشأة وقائية
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">المرجع</span>
                  <span className="text-[11px] text-slate-400">
                    BMK-02 (مقفل)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">الحقول</span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {GEOMETRY_DATA.length} مقفل
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ملخص القفل */}
          <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg flex items-center gap-3">
            <Lock className="size-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs text-amber-300/90 font-semibold">
                جميع القيم مرجعية مقفلة لحالة BMK-02
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                هذه القيم لا يمكن تعديلها — تُستخدم كأساس لحسابات الخطوات اللاحقة
                (3→8). أي تعديل يتطلب إنشاء سيناريو جديد.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ملخص سريع — البطاقات                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-900/80 border-slate-800/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-emerald-600/0 opacity-50 pointer-events-none" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500">وزن القنبلة</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {STEP2_INPUTS.P}
              </span>
              <span className="text-xs text-slate-500">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-amber-600/0 opacity-50 pointer-events-none" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-slate-500">سرعة الاصطدام</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {STEP2_INPUTS.V}
              </span>
              <span className="text-xs text-slate-500">m/s</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-red-600/0 opacity-50 pointer-events-none" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-slate-500">وزن الشحنة</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-red-400">
                {STEP2_INPUTS.C}
              </span>
              <span className="text-xs text-slate-500">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-sky-600/0 opacity-50 pointer-events-none" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-sky-500" />
              <span className="text-[10px] text-slate-500">عمق السقف</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-sky-400">
                {STEP2_INPUTS.Z}
              </span>
              <span className="text-xs text-slate-500">m</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* التنقل بين الخطوات                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Separator className="bg-slate-800/60" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-4">
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 gap-2 w-full sm:w-auto"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard';
            }
          }}
        >
          <ChevronRight className="size-4" />
          ← لوحة التحكم
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard/step3-penetration';
            }
          }}
        >
          التالي ← حسابات الاختراق
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
