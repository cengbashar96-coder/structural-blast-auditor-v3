'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Circle,
  Lock,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════
// الأنواع — Types
// ═══════════════════════════════════════════════════════════════════════

export interface PipelineStep {
  step: number;
  nameAr: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  duration?: number;
  lockedKeys?: string[];
  keyValues?: Record<string, number>;
}

export interface PipelineTimelineProps {
  steps: PipelineStep[];
  currentStep?: number;
  overallStatus?: 'idle' | 'running' | 'success' | 'partial' | 'failed';
}

// ═══════════════════════════════════════════════════════════════════════
// تعريف الخطوات الثابتة — Hardcoded Step Definitions
// ═══════════════════════════════════════════════════════════════════════

const STEP_DEFINITIONS: Record<
  number,
  { nameAr: string; lockedKeys: string[] }
> = {
  2: {
    nameAr: 'المدخلات والاستيفاءات',
    lockedKeys: [],
  },
  3: {
    nameAr: 'الاختراق',
    lockedKeys: ['C_ef', 'h_pr', 'R_actual', 'Zp'],
  },
  4: {
    nameAr: 'القفل الأولي',
    lockedKeys: ['Hp', 'Hc', 'Hf', 'Hvct'],
  },
  5: {
    nameAr: 'أحمال الانفجار',
    lockedKeys: ['Pmax', 'P_ekv', 'Pp', 'ω', 'τ_ef'],
  },
  6: {
    nameAr: 'معاملات الجدول ب',
    lockedKeys: [],
  },
  7: {
    nameAr: 'تصميم السقف',
    lockedKeys: ['Mp_roof', 'Hp_final'],
  },
  8: {
    nameAr: 'تصميم الجدار',
    lockedKeys: ['Hc_final', 'Hf_final', 'Hvct_final'],
  },
};

// ═══════════════════════════════════════════════════════════════════════
// أدوات مساعدة — Helpers
// ═══════════════════════════════════════════════════════════════════════

function getStatusIcon(status: PipelineStep['status']) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="size-4 text-emerald-400" />;
    case 'warning':
      return <AlertTriangle className="size-4 text-amber-400" />;
    case 'error':
      return <XCircle className="size-4 text-red-400" />;
    case 'running':
      return <Loader2 className="size-4 text-sky-400 animate-spin" />;
    case 'idle':
    default:
      return <Circle className="size-4 text-slate-500" />;
  }
}

function getStatusColor(status: PipelineStep['status']) {
  switch (status) {
    case 'success':
      return {
        border: 'border-emerald-700/60',
        bg: 'bg-emerald-950/30',
        glow: 'shadow-emerald-500/10',
        badge: 'bg-emerald-900/50 text-emerald-400 border-emerald-800/50',
        ring: 'ring-emerald-500/30',
      };
    case 'warning':
      return {
        border: 'border-amber-700/60',
        bg: 'bg-amber-950/30',
        glow: 'shadow-amber-500/10',
        badge: 'bg-amber-900/50 text-amber-400 border-amber-800/50',
        ring: 'ring-amber-500/30',
      };
    case 'error':
      return {
        border: 'border-red-700/60',
        bg: 'bg-red-950/30',
        glow: 'shadow-red-500/10',
        badge: 'bg-red-900/50 text-red-400 border-red-800/50',
        ring: 'ring-red-500/30',
      };
    case 'running':
      return {
        border: 'border-sky-700/60',
        bg: 'bg-sky-950/30',
        glow: 'shadow-sky-500/20',
        badge: 'bg-sky-900/50 text-sky-400 border-sky-800/50',
        ring: 'ring-sky-500/30',
      };
    case 'idle':
    default:
      return {
        border: 'border-slate-800',
        bg: 'bg-slate-950/50',
        glow: '',
        badge: 'bg-slate-800/50 text-slate-400 border-slate-700/50',
        ring: '',
      };
  }
}

function getStatusLabel(status: PipelineStep['status']): string {
  switch (status) {
    case 'success':
      return 'مكتمل';
    case 'warning':
      return 'تحذير';
    case 'error':
      return 'خطأ';
    case 'running':
      return 'جاري التنفيذ';
    case 'idle':
    default:
      return 'في الانتظار';
  }
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatValue(val: number): string {
  if (Number.isInteger(val)) return val.toString();
  if (Math.abs(val) >= 100) return val.toFixed(1);
  if (Math.abs(val) >= 1) return val.toFixed(3);
  return val.toExponential(2);
}

function getOverallStatusConfig(status: PipelineTimelineProps['overallStatus']) {
  switch (status) {
    case 'running':
      return {
        label: 'جاري التنفيذ',
        color: 'text-sky-400',
        bg: 'bg-sky-950/40 border-sky-800/50',
        icon: <Loader2 className="size-4 animate-spin" />,
      };
    case 'success':
      return {
        label: 'مكتمل بنجاح',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/40 border-emerald-800/50',
        icon: <CheckCircle2 className="size-4" />,
      };
    case 'partial':
      return {
        label: 'نجاح جزئي',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-800/50',
        icon: <AlertTriangle className="size-4" />,
      };
    case 'failed':
      return {
        label: 'فشل',
        color: 'text-red-400',
        bg: 'bg-red-950/40 border-red-800/50',
        icon: <XCircle className="size-4" />,
      };
    case 'idle':
    default:
      return {
        label: 'في الانتظار',
        color: 'text-slate-400',
        bg: 'bg-slate-900/40 border-slate-800/50',
        icon: <Circle className="size-4" />,
      };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// المكون الفرعي — StepNode
// ═══════════════════════════════════════════════════════════════════════

function StepNode({
  stepData,
  isCurrent,
  index,
}: {
  stepData: PipelineStep;
  isCurrent: boolean;
  index: number;
}) {
  const definition = STEP_DEFINITIONS[stepData.step];
  const lockedKeys = stepData.lockedKeys ?? definition?.lockedKeys ?? [];
  const colors = getStatusColor(stepData.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center"
    >
      <Card
        className={cn(
          'relative w-full min-w-[160px] max-w-[220px] border rounded-xl transition-all duration-300',
          'bg-slate-950/80 backdrop-blur-sm',
          colors.border,
          isCurrent && 'ring-2 ' + colors.ring,
          stepData.status === 'running' && 'shadow-lg ' + colors.glow,
          isCurrent &&
            stepData.status === 'running' &&
            'animate-[pulse-glow_2s_ease-in-out_infinite]'
        )}
        style={{ gap: 0 }}
      >
        {/* Pulsing glow for running step */}
        {isCurrent && stepData.status === 'running' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-sky-500/5 pointer-events-none"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <CardContent className="p-3.5 space-y-2.5">
          {/* Header: Step number + Status icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Step number badge */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-colors',
                  stepData.status === 'idle'
                    ? 'bg-slate-900 border-slate-700 text-slate-400'
                    : stepData.status === 'success'
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                      : stepData.status === 'warning'
                        ? 'bg-amber-950 border-amber-600 text-amber-400'
                        : stepData.status === 'error'
                          ? 'bg-red-950 border-red-600 text-red-400'
                          : 'bg-sky-950 border-sky-500 text-sky-400'
                )}
              >
                {stepData.step}
              </div>

              {/* Status tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">{getStatusIcon(stepData.status)}</div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-800 text-slate-100 border-slate-700">
                  {getStatusLabel(stepData.status)}
                  {stepData.duration ? ` — ${formatDuration(stepData.duration)}` : ''}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Duration badge */}
            {stepData.duration && stepData.status !== 'idle' && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 border-slate-700 text-slate-400 bg-slate-900/50"
              >
                {formatDuration(stepData.duration)}
              </Badge>
            )}
          </div>

          {/* Step name */}
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200 leading-relaxed">
              {stepData.nameAr || definition?.nameAr}
            </p>
          </div>

          {/* Key values mini-grid */}
          {stepData.keyValues &&
            Object.keys(stepData.keyValues).length > 0 && (
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(stepData.keyValues).map(([key, val]) => (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex flex-col items-center rounded-md px-1.5 py-1 border',
                          'bg-slate-900/60 border-slate-700/50 cursor-default'
                        )}
                      >
                        <span className="text-[9px] text-slate-500 font-mono leading-none">
                          {key}
                        </span>
                        <span className="text-[11px] text-slate-300 font-mono font-semibold leading-tight mt-0.5">
                          {formatValue(val)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-slate-800 text-slate-100 border-slate-700 font-mono"
                    >
                      {key} = {formatValue(val)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}

          {/* Locked keys */}
          {lockedKeys.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {lockedKeys.map((key) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] px-1.5 py-0 h-[18px] font-mono gap-0.5',
                        stepData.status === 'success'
                          ? 'bg-emerald-950/40 text-emerald-400/80 border-emerald-800/40'
                          : stepData.status === 'idle'
                            ? 'bg-slate-900/40 text-slate-500 border-slate-700/40'
                            : stepData.status === 'running'
                              ? 'bg-sky-950/40 text-sky-400/80 border-sky-800/40'
                              : 'bg-slate-900/40 text-slate-400 border-slate-700/40'
                      )}
                    >
                      <Lock className="size-2.5 opacity-60" />
                      {key}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-slate-800 text-slate-100 border-slate-700"
                  >
                    🔒 متغير مقفل: {key}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// الموصل بين الخطوات — Connector
// ═══════════════════════════════════════════════════════════════════════

function StepConnector({
  fromStatus,
  toStatus,
  direction = 'horizontal',
}: {
  fromStatus: PipelineStep['status'];
  toStatus: PipelineStep['status'];
  direction?: 'horizontal' | 'vertical';
}) {
  const isActive =
    fromStatus === 'success' ||
    fromStatus === 'warning' ||
    fromStatus === 'running';
  const isRunning = fromStatus === 'running';

  if (direction === 'vertical') {
    return (
      <div className="flex items-center justify-center h-8 py-1">
        <div className="relative w-0.5 h-full">
          {/* Background line */}
          <div className="absolute inset-0 bg-slate-800 rounded-full" />
          {/* Active line */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ transformOrigin: 'top' }}
            >
              <div
                className={cn(
                  'w-full h-full rounded-full',
                  isRunning ? 'bg-sky-500/60' : 'bg-emerald-500/40'
                )}
              />
            </motion.div>
          )}
          {/* Running pulse dot */}
          {isRunning && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-lg shadow-sky-500/50"
              animate={{ top: ['0%', '100%'] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-10 shrink-0">
      <div className="relative w-full h-0.5">
        {/* Background line */}
        <div className="absolute inset-0 bg-slate-800 rounded-full" />
        {/* Active line */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ transformOrigin: 'right' }}
          >
            <div
              className={cn(
                'w-full h-full rounded-full',
                isRunning ? 'bg-sky-500/60' : 'bg-emerald-500/40'
              )}
            />
          </motion.div>
        )}
        {/* Running pulse dot */}
        {isRunning && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-lg shadow-sky-500/50"
            animate={{ right: ['0%', '100%'] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>
      {/* Arrow head */}
      <ChevronLeft
        className={cn(
          'size-3.5 shrink-0 -mr-0.5',
          isActive
            ? isRunning
              ? 'text-sky-500'
              : 'text-emerald-500/60'
            : 'text-slate-700'
        )}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي — PipelineTimeline
// ═══════════════════════════════════════════════════════════════════════

export function PipelineTimeline({
  steps,
  currentStep,
  overallStatus = 'idle',
}: PipelineTimelineProps) {
  const overall = getOverallStatusConfig(overallStatus);

  // Merge incoming steps with hardcoded definitions
  const resolvedSteps: PipelineStep[] = steps.map((s) => {
    const def = STEP_DEFINITIONS[s.step];
    return {
      ...s,
      nameAr: s.nameAr || def?.nameAr || '',
      lockedKeys:
        s.lockedKeys && s.lockedKeys.length > 0
          ? s.lockedKeys
          : def?.lockedKeys || [],
    };
  });

  // Compute progress stats
  const completedCount = resolvedSteps.filter(
    (s) => s.status === 'success' || s.status === 'warning'
  ).length;
  const totalSteps = resolvedSteps.length;
  const progressPercent =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="w-full space-y-4" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100">
              خط أنابيب الحساب
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              (7 خطوات)
            </span>
          </div>
        </div>

        {/* Overall status + progress */}
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  overallStatus === 'failed'
                    ? 'bg-red-500'
                    : overallStatus === 'partial'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono tabular-nums">
              {progressPercent}%
            </span>
          </div>

          {/* Overall badge */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
              overall.bg
            )}
          >
            {overall.icon}
            <span className={overall.color}>{overall.label}</span>
          </div>
        </div>
      </div>

      {/* ─── Timeline ─── */}
      {/* Desktop: Horizontal */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex items-stretch gap-0 min-w-max px-1">
            <AnimatePresence>
              {resolvedSteps.map((step, idx) => (
                <React.Fragment key={step.step}>
                  <div className="flex-shrink-0 w-[190px]">
                    <StepNode
                      stepData={step}
                      isCurrent={currentStep === step.step}
                      index={idx}
                    />
                  </div>
                  {idx < resolvedSteps.length - 1 && (
                    <div className="flex items-center flex-shrink-0">
                      <StepConnector
                        fromStatus={step.status}
                        toStatus={resolvedSteps[idx + 1].status}
                        direction="horizontal"
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet: Vertical */}
      <div className="lg:hidden">
        <div className="flex flex-col items-stretch">
          <AnimatePresence>
            {resolvedSteps.map((step, idx) => (
              <React.Fragment key={step.step}>
                <StepNode
                  stepData={step}
                  isCurrent={currentStep === step.step}
                  index={idx}
                />
                {idx < resolvedSteps.length - 1 && (
                  <div className="flex justify-center">
                    <StepConnector
                      fromStatus={step.status}
                      toStatus={resolvedSteps[idx + 1].status}
                      direction="vertical"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مثال جاهز للاستخدام — Convenience Export
// ═══════════════════════════════════════════════════════════════════════

/** بناء خطوات افتراضية للعرض التجريبي */
export function buildDemoSteps(
  activeStep?: number
): PipelineStep[] {
  const stepNumbers = [2, 3, 4, 5, 6, 7, 8];

  return stepNumbers.map((num) => {
    const def = STEP_DEFINITIONS[num];

    if (activeStep === undefined) {
      return { step: num, nameAr: def.nameAr, status: 'idle' as const, lockedKeys: def.lockedKeys };
    }

    if (num < activeStep) {
      return {
        step: num,
        nameAr: def.nameAr,
        status: 'success' as const,
        duration: Math.round(80 + Math.random() * 300),
        lockedKeys: def.lockedKeys,
        keyValues: generateDemoKeyValues(num),
      };
    }

    if (num === activeStep) {
      return {
        step: num,
        nameAr: def.nameAr,
        status: 'running' as const,
        lockedKeys: def.lockedKeys,
      };
    }

    return { step: num, nameAr: def.nameAr, status: 'idle' as const, lockedKeys: def.lockedKeys };
  });
}

function generateDemoKeyValues(step: number): Record<string, number> | undefined {
  switch (step) {
    case 2:
      return { W: 220, V_0: 300, K_pr: 6e-6 };
    case 3:
      return { C_ef: 89.1, h_pr: 2.34, R_act: 5.67, Zp: 1.21 };
    case 4:
      return { Hp: 2.5, Hc: 2.1, Hf: 1.8, Hvct: 1.6 };
    case 5:
      return { Pmax: 3.42, P_ekv: 2.87, Pp: 1.95, omega: 0.78 };
    case 6:
      return { K_b1: 1.12, K_b2: 0.94, K_b3: 1.05 };
    case 7:
      return { Mp_roof: 45.6, Hp_final: 2.35 };
    case 8:
      return { Hc_final: 2.12, Hf_final: 1.88, Hvct_final: 1.65 };
    default:
      return undefined;
  }
}
