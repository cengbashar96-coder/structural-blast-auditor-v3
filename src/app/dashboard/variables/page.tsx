// ═══════════════════════════════════════════════════════════════════════
// صفحة جدول المتغيرات الموحد — Variable Table Page
// منصة المدقق الديناميكي الموحد V3.0
// RTL Arabic · Dark Theme · shadcn/ui
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useMemo } from 'react';
import {
  UNIFIED_VARIABLE_TABLE,
  LOCKED_REGISTRY,
  getVariablesByCategory,
  getVariablesByStep,
  getVariablesByPath,
  getLockedVariables,
  isLocked,
} from '@/lib/constants/reference-data';
import type { VariableDefinition, VariableCategory, EngineStep, BlastLoadPath } from '@/types/engine';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table as TableIcon,
  ChevronDown,
  Lock,
  Database,
  ArrowDownToLine,
  Calculator,
  FileOutput,
  Search,
  Shield,
} from 'lucide-react';

// ─── Category colors & labels ───

const CATEGORY_STYLES: Record<
  VariableCategory,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  input: {
    label: 'مدخلات',
    color: 'text-sky-400',
    bgColor: 'bg-sky-900/30 border-sky-800/50',
    icon: <ArrowDownToLine className="size-3" />,
  },
  lookup: {
    label: 'بحث',
    color: 'text-teal-400',
    bgColor: 'bg-teal-900/30 border-teal-800/50',
    icon: <Search className="size-3" />,
  },
  computed: {
    label: 'محسوبة',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30 border-amber-800/50',
    icon: <Calculator className="size-3" />,
  },
  locked: {
    label: 'مقفلة',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30 border-red-800/50',
    icon: <Lock className="size-3" />,
  },
  output: {
    label: 'مخرجات',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30 border-emerald-800/50',
    icon: <FileOutput className="size-3" />,
  },
};

const STEP_LABELS: Record<number, string> = {
  2: 'المدخلات والاستيفاءات',
  3: 'الاختراق',
  4: 'القفل الأولي',
  5: 'حمل الانفجار',
  6: 'معاملات الجدول ب',
  7: 'تصميم السقف',
  8: 'تصميم الجدار',
};

const PATH_LABELS: Record<string, string> = {
  shared: 'مشترك',
  roof: 'سقف',
  wall: 'جدار',
};

// ═══════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════

export default function VariablesPage() {
  // ─── Filter State ───
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [pathFilter, setPathFilter] = useState<string>('all');
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [lockedExpanded, setLockedExpanded] = useState(false);

  // ─── Filtered Variables ───
  const filteredVariables = useMemo(() => {
    let vars = [...UNIFIED_VARIABLE_TABLE];

    if (categoryFilter !== 'all') {
      vars = vars.filter((v) => v.category === categoryFilter);
    }

    if (stepFilter !== 'all') {
      vars = vars.filter((v) => v.step === Number(stepFilter));
    }

    if (pathFilter !== 'all') {
      vars = vars.filter((v) => v.path === pathFilter);
    }

    if (showLockedOnly) {
      vars = vars.filter((v) => v.locked);
    }

    return vars;
  }, [categoryFilter, stepFilter, pathFilter, showLockedOnly]);

  // ─── Statistics ───
  const stats = useMemo(() => {
    const total = UNIFIED_VARIABLE_TABLE.length;
    const locked = getLockedVariables().length;
    const inputs = getVariablesByCategory('input').length;
    const computed = getVariablesByCategory('computed').length;
    const outputs = getVariablesByCategory('output').length;
    const lookups = getVariablesByCategory('lookup').length;
    const lockedCategory = getVariablesByCategory('locked').length;

    return { total, locked, inputs, computed, outputs, lookups, lockedCategory };
  }, []);

  // ─── Render ───

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-900/30 border border-emerald-800/50 rounded-xl">
          <TableIcon className="size-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            جدول المتغيرات الموحد
          </h1>
          <p className="text-sm text-slate-500">
            جميع المتغيرات في النموذج الموحد ({stats.total} متغير)
          </p>
        </div>
      </div>

      <Separator className="bg-slate-800/60" />

      {/* ─── Statistics Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <StatCard
          title="إجمالي المتغيرات"
          value={stats.total}
          icon={<Database className="size-4 text-slate-400" />}
          color="text-slate-200"
        />
        <StatCard
          title="المتغيرات المقفلة"
          value={stats.locked}
          icon={<Lock className="size-4 text-red-400" />}
          color="text-red-400"
        />
        <StatCard
          title="المدخلات"
          value={stats.inputs}
          icon={<ArrowDownToLine className="size-4 text-sky-400" />}
          color="text-sky-400"
        />
        <StatCard
          title="المحسوبة"
          value={stats.computed}
          icon={<Calculator className="size-4 text-amber-400" />}
          color="text-amber-400"
        />
        <StatCard
          title="المخرجات"
          value={stats.outputs}
          icon={<FileOutput className="size-4 text-emerald-400" />}
          color="text-emerald-400"
        />
      </div>

      {/* ─── Filter Controls ─── */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Category Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">التصنيف</Label>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-slate-300 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="input">مدخلات</SelectItem>
                  <SelectItem value="lookup">بحث</SelectItem>
                  <SelectItem value="computed">محسوبة</SelectItem>
                  <SelectItem value="locked">مقفلة</SelectItem>
                  <SelectItem value="output">مخرجات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Step Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">الخطوة</Label>
              <Select value={stepFilter} onValueChange={setStepFilter}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-slate-300 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">الكل</SelectItem>
                  {[2, 3, 4, 5, 6, 7, 8].map((step) => (
                    <SelectItem key={step} value={String(step)}>
                      {step} — {STEP_LABELS[step]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Path Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">المسار</Label>
              <Select value={pathFilter} onValueChange={setPathFilter}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-slate-300 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="shared">مشترك</SelectItem>
                  <SelectItem value="roof">سقف</SelectItem>
                  <SelectItem value="wall">جدار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lock Status Toggle */}
            <div className="flex items-center gap-2 pb-0.5">
              <Switch
                id="locked-only"
                checked={showLockedOnly}
                onCheckedChange={setShowLockedOnly}
                className="data-[state=checked]:bg-red-700"
              />
              <Label
                htmlFor="locked-only"
                className="text-xs text-slate-400 cursor-pointer"
              >
                إظهار المقفلة فقط
              </Label>
            </div>

            {/* Count badge */}
            <div className="mr-auto pb-0.5">
              <Badge
                variant="outline"
                className="border-slate-700 text-slate-400 text-xs"
              >
                {filteredVariables.length} متغير
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Variable Table ─── */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-200 flex items-center gap-2">
            <Database className="size-4 text-emerald-400" />
            المتغيرات ({filteredVariables.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    الاسم
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    الرمز
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    الوصف
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    الوحدة
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    المصدر
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    التصنيف
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    الخطوة
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold">
                    المسار
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold text-center">
                    مقفل
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariables.map((variable) => (
                  <VariableRow
                    key={variable.name}
                    variable={variable}
                  />
                ))}
                {filteredVariables.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-slate-500 py-8 text-sm"
                    >
                      لا توجد متغيرات تطابق عوامل التصفية
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Locked Values Detail ─── */}
      <Collapsible
        open={lockedExpanded}
        onOpenChange={setLockedExpanded}
      >
        <Card className="bg-slate-900/80 border-slate-800">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-slate-800/20 transition-colors rounded-t-lg pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                  <Shield className="size-4 text-red-400" />
                  سجل القيم المقفلة — LOCKED_REGISTRY
                  <Badge
                    variant="outline"
                    className="border-red-800 text-red-400 text-[10px]"
                  >
                    {LOCKED_REGISTRY.length} قيمة
                  </Badge>
                </CardTitle>
                <ChevronDown
                  className={`size-4 text-slate-500 transition-transform ${
                    lockedExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-500 text-[11px]">
                        المفتاح
                      </TableHead>
                      <TableHead className="text-slate-500 text-[11px]">
                        القيمة
                      </TableHead>
                      <TableHead className="text-slate-500 text-[11px]">
                        خطوة المنشأ
                      </TableHead>
                      <TableHead className="text-slate-500 text-[11px]">
                        خطوات الاستهلاك
                      </TableHead>
                      <TableHead className="text-slate-500 text-[11px]">
                        المسار
                      </TableHead>
                      <TableHead className="text-slate-500 text-[11px]">
                        التسامح
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LOCKED_REGISTRY.map((entry) => (
                      <TableRow
                        key={entry.key}
                        className="border-slate-800/30 hover:bg-slate-800/20"
                      >
                        <TableCell className="font-mono text-xs text-red-300">
                          {entry.key}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-300">
                          {formatLockedValue(entry.value)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 text-center">
                          <Badge
                            variant="outline"
                            className="border-slate-700 text-slate-400 text-[10px]"
                          >
                            {entry.producedByStep}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          <div className="flex gap-1 flex-wrap">
                            {entry.consumedBySteps.map((step) => (
                              <Badge
                                key={step}
                                variant="outline"
                                className="border-slate-700 text-slate-500 text-[10px] px-1"
                              >
                                {step}
                              </Badge>
                            ))}
                            {entry.consumedBySteps.length === 0 && (
                              <span className="text-slate-600 text-[10px]">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              entry.path === 'shared'
                                ? 'border-slate-700 text-slate-400'
                                : entry.path === 'roof'
                                  ? 'border-sky-800 text-sky-400'
                                  : 'border-amber-800 text-amber-400'
                            }`}
                          >
                            {PATH_LABELS[entry.path] ?? entry.path}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {(entry.tolerance * 100).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════════

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-500">{title}</span>
          {icon}
        </div>
        <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function VariableRow({ variable }: { variable: VariableDefinition }) {
  const catStyle = CATEGORY_STYLES[variable.category];

  return (
    <TableRow className="border-slate-800/30 hover:bg-slate-800/20">
      <TableCell className="font-mono text-sm text-slate-300">
        {variable.name}
      </TableCell>
      <TableCell className="font-mono text-sm text-slate-400">
        {variable.symbol}
      </TableCell>
      <TableCell className="text-xs text-slate-400 max-w-[200px] truncate">
        {variable.descriptionAr}
      </TableCell>
      <TableCell className="text-xs text-slate-500 font-mono">
        {variable.unit}
      </TableCell>
      <TableCell className="text-xs text-slate-500">
        {variable.source}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`${catStyle.bgColor} ${catStyle.color} text-[10px] gap-1`}
        >
          {catStyle.icon}
          {catStyle.label}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className="border-slate-700 text-slate-400 text-[10px]"
        >
          {variable.step}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`text-[10px] ${
            variable.path === 'shared'
              ? 'border-slate-700 text-slate-400'
              : variable.path === 'roof'
                ? 'border-sky-800 text-sky-400'
                : 'border-amber-800 text-amber-400'
          }`}
        >
          {PATH_LABELS[variable.path] ?? variable.path}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        {variable.locked ? (
          <span className="text-base" title="مقفل">
            🔒
          </span>
        ) : (
          <span className="text-slate-700 text-xs">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Utility ───

function formatLockedValue(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 10000000) return n.toExponential(3);
  if (Math.abs(n) >= 100) return n.toFixed(2);
  if (Math.abs(n) >= 1) return n.toFixed(4);
  return n.toFixed(10).replace(/0+$/, '');
}
