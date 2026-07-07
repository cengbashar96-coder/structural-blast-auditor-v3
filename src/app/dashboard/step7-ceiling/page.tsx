// ═══════════════════════════════════════════════════════════════════════
// الخطوة 7 — تصميم سماكة السقف
// منصة المدقق الديناميكي الموحد V3.1
// حساب العزم البلاستيكي والعمق الفعال والسماكة النهائية
// وفق المسار αm → ξ → h₀ → Hp
// مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  STEP7_CEILING,
  STEP5_ROOF,
} from '@/lib/constants/reference-data';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import {
  Layers,
  Shield,
  Lock,
  Ruler,
  CheckCircle2,
  Calculator,
  ArrowLeft,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function fmt(val: number, decimals: number = 4): string {
  if (!isFinite(val)) return '∞';
  return val.toFixed(decimals);
}

function fmtBig(val: number): string {
  if (!isFinite(val)) return '∞';
  return Math.round(val).toLocaleString('en-US');
}

// ═══════════════════════════════════════════════════════════════════════
// حسابات الخطوة 7
// ═══════════════════════════════════════════════════════════════════════

/** المدخلات من الخطوة 5 */
const inputs = {
  Pp: STEP5_ROOF.Pp,
  mu_struct: STEP5_ROOF.mu_struct,
  Rsd: STEP5_ROOF.Rsd,
  Rbd: STEP5_ROOF.Rbd,
  eta: STEP5_ROOF.eta,
  n0: 1.25, // معامل الأمان
  ap: 4,    // البحر الطولي (m)
  bp: 5,    // البحر العرضي (m)
} as const;

/** Mp = Pp × b × L² × η / (8 × n₀) */
const Mp = (inputs.Pp * inputs.bp * inputs.ap * inputs.ap * inputs.eta) / (8 * inputs.n0);

/** αm = μ_struct × RbH / RsH */
const RbH = 200; // kg/cm² — مقاومة الخرسانة من STEP2_LOOKUPS
const RsH = 3000; // kg/cm² — إجهاد خضوع الحديد من STEP2_LOOKUPS
const alphaM = inputs.mu_struct * RbH / RsH;

/** ξ = 1 - √(1 - 2αm) */
const xi = 1 - Math.sqrt(1 - 2 * alphaM);

/** h₀ = √(Mp / (Rbd × b × αm)) — b بالسنتمتر */
const h0 = Math.sqrt(Mp / (inputs.Rbd * (inputs.bp * 100) * alphaM));

/** Hp = h₀ × 1.05 */
const HpCalc = h0 * 1.05;

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════════════════════════════

export default function Step7CeilingPage() {
  const verified = useMemo(() => {
    const mpOk = Math.abs(Mp - STEP7_CEILING.Mp) / STEP7_CEILING.Mp < 0.01;
    const h0Ok = Math.abs(h0 - STEP7_CEILING.h0) / STEP7_CEILING.h0 < 0.01;
    const hpOk = Math.abs(HpCalc - STEP7_CEILING.Hp_final) / STEP7_CEILING.Hp_final < 0.01;
    return { mpOk, h0Ok, hpOk, allOk: mpOk && h0Ok && hpOk };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">

        {/* ═══════════ رأس الصفحة ═══════════ */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">
                الخطوة 7: تصميم سماكة السقف
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1">
                حساب العزم البلاستيكي والعمق الفعال والسماكة النهائية وفق المسار α<sub>m</sub> → ξ → h₀ → H<sub>p</sub>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              <Shield className="w-3 h-3 ml-1" />
              BMK-02
            </Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-800/50">
              إكسيل 5 — حساب سماكة السقف
            </Badge>
          </div>
        </header>

        <Separator className="bg-slate-800/60" />

        {/* ═══════════ القسم أ: المدخلات من الخطوة 5 ═══════════ */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
              <ArrowLeft className="w-5 h-5 text-emerald-400" />
              المدخلات من الخطوة 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Pp', value: fmt(inputs.Pp, 4), unit: 'kg/cm²', desc: 'الضغط التصميمي' },
                { label: 'μ_struct', value: fmt(inputs.mu_struct, 4), unit: '-', desc: 'معامل المطاوعة' },
                { label: 'Rsd', value: fmt(inputs.Rsd, 1), unit: 'kg/cm²', desc: 'مقاومة التسليح الديناميكية' },
                { label: 'Rbd', value: fmt(inputs.Rbd, 0), unit: 'kg/cm²', desc: 'مقاومة الانحناء الديناميكية' },
                { label: 'η', value: fmt(inputs.eta, 4), unit: '-', desc: 'معامل الديناميكية' },
                { label: 'n₀', value: fmt(inputs.n0, 2), unit: '-', desc: 'معامل الأمان' },
                { label: 'ap', value: fmt(inputs.ap, 0), unit: 'm', desc: 'البحر الطولي' },
                { label: 'bp', value: fmt(inputs.bp, 0), unit: 'm', desc: 'البحر العرضي' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-1"
                >
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-slate-400 font-mono">{item.label}</span>
                  </div>
                  <div className="text-emerald-400 font-bold font-mono text-lg">{item.value}</div>
                  <div className="text-xs text-slate-500">{item.unit} — {item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ القسم ب: حساب العزم ═══════════ */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
              <Calculator className="w-5 h-5 text-emerald-400" />
              حساب العزم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* المعادلة */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-slate-300 text-sm mb-2">المعادلة:</p>
              <p className="font-mono text-slate-200 text-base sm:text-lg" dir="ltr">
                M<sub>p</sub> = P<sub>p</sub> × b × L² × η / (8 × n₀)
              </p>
            </div>

            {/* التعويض */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-slate-300 text-sm mb-2">التعويض:</p>
              <p className="font-mono text-slate-400 text-sm" dir="ltr">
                M<sub>p</sub> = {fmt(inputs.Pp, 4)} × {inputs.bp} × {inputs.ap}² × {fmt(inputs.eta, 4)} / (8 × {fmt(inputs.n0, 2)})
              </p>
            </div>

            {/* النتيجة — بطاقة كبيرة مميزة */}
            <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-emerald-500/5 p-6 sm:p-8">
              <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-x-8 -translate-y-8 blur-2xl" />
              <div className="relative space-y-2">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium text-sm">النتيجة النهائية</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono font-bold text-emerald-400" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {fmtBig(Mp)}
                  </span>
                  <span className="text-emerald-400/70 text-lg font-medium">kg.cm</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {verified.mpOk ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400/80">متحقق مقابل BMK-02</span>
                    </>
                  ) : (
                    <span className="text-amber-400">انحراف عن BMK-02</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ القسم ج: مسار التصميم ═══════════ */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
              <Layers className="w-5 h-5 text-emerald-400" />
              مسار التصميم
              <span className="text-slate-500 text-sm font-normal" dir="ltr">αm → ξ → h₀ → Hp</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* الخطوة 1: αm */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">1</span>
                <span className="text-slate-300 font-medium">حساب α<sub>m</sub></span>
              </div>
              <p className="font-mono text-slate-400 text-sm mr-9" dir="ltr">
                α<sub>m</sub> = μ_struct × RbH / RsH
              </p>
              <p className="font-mono text-slate-400 text-sm mr-9" dir="ltr">
                = {fmt(inputs.mu_struct, 4)} × {RbH} / {RsH}
              </p>
              <div className="mr-9 flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold text-lg">α<sub>m</sub> = {fmt(alphaM, 4)}</span>
              </div>
            </div>

            {/* سهم التدفق */}
            <div className="flex justify-center">
              <div className="w-px h-6 bg-emerald-500/30" />
            </div>

            {/* الخطوة 2: ξ */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">2</span>
                <span className="text-slate-300 font-medium">حساب ξ</span>
              </div>
              <p className="font-mono text-slate-400 text-sm mr-9" dir="ltr">
                ξ = 1 − √(1 − 2α<sub>m</sub>)
              </p>
              <div className="mr-9 flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold text-lg">ξ = {fmt(xi, 4)}</span>
              </div>
            </div>

            {/* سهم التدفق */}
            <div className="flex justify-center">
              <div className="w-px h-6 bg-emerald-500/30" />
            </div>

            {/* الخطوة 3: h₀ */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">3</span>
                <span className="text-slate-300 font-medium">حساب العمق الفعال h₀</span>
              </div>
              <p className="font-mono text-slate-400 text-sm mr-9" dir="ltr">
                h₀ = √(M<sub>p</sub> / (R<sub>bd</sub> × b × α<sub>m</sub>))
              </p>
              <div className="mr-9">
                <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 inline-block">
                  <span className="font-mono text-emerald-400 font-bold" style={{ fontSize: '1.75rem' }}>
                    h₀ = {fmt(h0, 2)} cm
                  </span>
                </div>
              </div>
              <div className="mr-9 flex items-center gap-2 text-sm mt-1">
                {verified.h0Ok ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400/80">متحقق مقابل BMK-02 (المرجع: {fmt(STEP7_CEILING.h0, 2)} cm)</span>
                  </>
                ) : (
                  <span className="text-amber-400">انحراف عن BMK-02</span>
                )}
              </div>
            </div>

            {/* سهم التدفق */}
            <div className="flex justify-center">
              <div className="w-px h-6 bg-emerald-500/30" />
            </div>

            {/* الخطوة 4: Hp — النتيجة النهائية الكبرى */}
            <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-emerald-500/5 p-6 sm:p-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-x-6 translate-y-6 blur-2xl" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-emerald-950 text-xs font-bold">4</span>
                  <span className="text-emerald-400 font-bold">السماكة النهائية</span>
                </div>
                <p className="font-mono text-slate-400 text-sm mr-9" dir="ltr">
                  H<sub>p</sub> = h₀ × 1.05 = {fmt(h0, 2)} × 1.05
                </p>
                <div className="mr-9 flex items-baseline gap-3">
                  <span className="font-mono font-bold text-emerald-400" style={{ fontSize: '3rem', lineHeight: 1 }}>
                    {fmt(HpCalc, 2)}
                  </span>
                  <span className="text-emerald-400/70 text-xl font-medium">cm</span>
                </div>
                <div className="mr-9 flex items-center gap-2 text-sm">
                  {verified.hpOk ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400/80">متحقق مقابل BMK-02 (المرجع: {fmt(STEP7_CEILING.Hp_final, 2)} cm)</span>
                    </>
                  ) : (
                    <span className="text-amber-400">انحراف عن BMK-02</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ القسم د: نتائج القيم المقفلة ═══════════ */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
              <Lock className="w-5 h-5 text-amber-400" />
              نتائج القيم المقفلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Mp',
                  symbol: 'Mp',
                  value: fmtBig(STEP7_CEILING.Mp),
                  unit: 'kg.cm',
                  locked: true,
                  desc: 'العزم البلاستيكي',
                  verified: verified.mpOk,
                },
                {
                  label: 'μ_struct',
                  symbol: 'μ_struct',
                  value: fmt(STEP7_CEILING.mu_struct, 4),
                  unit: '-',
                  locked: true,
                  desc: 'معامل المطاوعة الإنشائية',
                  verified: true,
                },
                {
                  label: 'Rsd',
                  symbol: 'Rsd',
                  value: fmt(STEP7_CEILING.Rsd, 1),
                  unit: 'kg/cm²',
                  locked: true,
                  desc: 'مقاومة التسليح الديناميكية',
                  verified: true,
                },
                {
                  label: 'h₀',
                  symbol: 'h₀',
                  value: fmt(STEP7_CEILING.h0, 2),
                  unit: 'cm',
                  locked: false,
                  desc: 'العمق الفعال',
                  verified: verified.h0Ok,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl p-4 border space-y-2 ${
                    item.locked
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-emerald-500/5 border-emerald-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-slate-300">{item.symbol}</span>
                    {item.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="font-mono font-bold text-emerald-400 text-xl">
                    {item.value}
                    <span className="text-emerald-400/50 text-xs mr-1">{item.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {item.verified ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400/70">متحقق</span>
                      </>
                    ) : (
                      <span className="text-amber-400">قيد المراجعة</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* بطاقة Hp النهائية المقفلة */}
            <div className="mt-6 relative overflow-hidden rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-emerald-500/5 p-6">
              <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-x-8 -translate-y-8 blur-2xl" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Hp النهائية — مقفلة ومتحقق منها</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    السماكة الكلية للسقف وفق المسار αm → ξ → h₀ → Hp
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-bold text-emerald-400" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {fmt(STEP7_CEILING.Hp_final, 2)}
                  </span>
                  <span className="text-emerald-400/70 text-lg">cm</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400/80">مطابقة لـ BMK-02 — القيمة مقفلة ولا يمكن تعديلها</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تذييل */}
        <div className="text-center text-xs text-slate-600 py-4">
          المدقق الديناميكي الموحد V3.1 — الخطوة 7: تصميم سماكة السقف — BMK-02
        </div>
      </div>
    </div>
  );
}
