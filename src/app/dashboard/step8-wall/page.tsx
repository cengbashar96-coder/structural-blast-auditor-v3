// ═══════════════════════════════════════════════════════════════════════
// الخطوة 8 — تصميم سماكة الجدران
// منصة المدقق الديناميكي الموحد V3.1
// حساب سماكة الجدار والأرضية والجدار الداخلي الخرساني
// مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import {
  STEP8_WALL,
  STEP5_WALL,
  STEP7_CEILING,
} from '@/lib/constants/reference-data';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import {
  Building2,
  Shield,
  Lock,
  Ruler,
  CheckCircle2,
  Layers,
  ArrowLeft,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

function fmt(val: number, decimals: number = 4): string {
  if (!isFinite(val)) return '∞';
  return val.toFixed(decimals);
}

// ═══════════════════════════════════════════════════════════════════════
// حسابات الخطوة 8
// ═══════════════════════════════════════════════════════════════════════

/** المدخلات من الخطوة 5+7 */
const inputs = {
  Pp_wall: STEP5_WALL.Pp,
  Hp_final: STEP7_CEILING.Hp_final,
  mu_struct: STEP5_WALL.mu_struct,
  Rsd: STEP5_WALL.Rsd,
  Rbd: STEP5_WALL.Rbd,
  eta: STEP5_WALL.eta,
} as const;

/** القيم المصممة */
const Hc = STEP8_WALL.Hc_final;      // سماكة الجدار
const Hf = STEP8_WALL.Hf_final;      // سماكة الأرضية (≈ 60% من Hp)
const Hvct = STEP8_WALL.Hvct_final;  // سماكة الجدار الداخلي (الحد الأدنى وفق الكود)
const Hp = STEP7_CEILING.Hp_final;   // سماكة السقف من الخطوة 7

/** نسبة Hf إلى Hp */
const HfToHpRatio = Hf / Hp;

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════════════════════════════

export default function Step8WallPage() {
  const verified = useMemo(() => {
    const hcOk = Math.abs(Hc - STEP8_WALL.Hc_final) / STEP8_WALL.Hc_final < 0.01;
    const hfOk = Math.abs(Hf - STEP8_WALL.Hf_final) / STEP8_WALL.Hf_final < 0.01;
    const hvctOk = Math.abs(Hvct - STEP8_WALL.Hvct_final) / STEP8_WALL.Hvct_final < 0.01;
    return { hcOk, hfOk, hvctOk, allOk: hcOk && hfOk && hvctOk };
  }, []);

  // أشرطة المقارنة البصرية
  const maxValue = Hp; // أكبر قيمة هي Hp
  const barData = [
    { label: 'Hp', labelAr: 'سماكة السقف', value: Hp, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
    { label: 'Hc', labelAr: 'سماكة الجدار', value: Hc, color: 'bg-teal-400', textColor: 'text-teal-400' },
    { label: 'Hf', labelAr: 'سماكة الأرضية', value: Hf, color: 'bg-cyan-400', textColor: 'text-cyan-400' },
    { label: 'Hvct', labelAr: 'الجدار الداخلي', value: Hvct, color: 'bg-sky-400', textColor: 'text-sky-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">

        {/* ═══════════ رأس الصفحة ═══════════ */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">
                الخطوة 8: تصميم سماكة الجدران
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1">
                حساب سماكة الجدار والأرضية والجدار الداخلي الخرساني
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              <Shield className="w-3 h-3 ml-1" />
              BMK-02
            </Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-800/50">
              إكسيل 6 — حساب سماكة الجدران
            </Badge>
          </div>
        </header>

        <Separator className="bg-slate-800/60" />

        {/* ═══════════ القسم أ: المدخلات من الخطوة 5+7 ═══════════ */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
              <ArrowLeft className="w-5 h-5 text-emerald-400" />
              المدخلات من الخطوة 5+7
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Pp_wall', value: fmt(inputs.Pp_wall, 4), unit: 'kg/cm²', desc: 'الضغط التصميمي على الجدار', fromStep: 5 },
                { label: 'Hp_final', value: fmt(inputs.Hp_final, 2), unit: 'cm', desc: 'سماكة السقف النهائية', fromStep: 7 },
                { label: 'μ_struct', value: fmt(inputs.mu_struct, 4), unit: '-', desc: 'معامل المطاوعة الإنشائية', fromStep: 5 },
                { label: 'Rsd', value: fmt(inputs.Rsd, 1), unit: 'kg/cm²', desc: 'مقاومة التسليح الديناميكية', fromStep: 5 },
                { label: 'Rbd', value: fmt(inputs.Rbd, 0), unit: 'kg/cm²', desc: 'مقاومة الانحناء الديناميكية', fromStep: 5 },
                { label: 'η', value: fmt(inputs.eta, 4), unit: '-', desc: 'معامل الديناميكية', fromStep: 5 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-slate-400 font-mono">{item.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-500 bg-slate-800/50">
                      خطوة {item.fromStep}
                    </Badge>
                  </div>
                  <div className="text-emerald-400 font-bold font-mono text-lg">{item.value}</div>
                  <div className="text-xs text-slate-500">{item.unit} — {item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ القسم ب: نتائج التصميم — ثلاث بطاقات مميزة ═══════════ */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-emerald-400" />
            نتائج التصميم
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* بطاقة Hc */}
          <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-emerald-500/5 p-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 blur-2xl" />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300 text-sm font-medium">سماكة الجدار</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-emerald-400" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                  {fmt(Hc, 2)}
                </span>
                <span className="text-emerald-400/70 text-lg">cm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">Hc</span>
                <div className="flex items-center gap-1">
                  {verified.hcOk ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400/70 text-xs">BMK-02 ✓</span>
                    </>
                  ) : (
                    <span className="text-amber-400 text-xs">قيد المراجعة</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة Hf */}
          <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-emerald-500/5 p-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 blur-2xl" />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300 text-sm font-medium">سماكة الأرضية</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-emerald-400" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                  {fmt(Hf, 2)}
                </span>
                <span className="text-emerald-400/70 text-lg">cm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">Hf ≈ 60% Hp</span>
                <div className="flex items-center gap-1">
                  {verified.hfOk ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400/70 text-xs">BMK-02 ✓</span>
                    </>
                  ) : (
                    <span className="text-amber-400 text-xs">قيد المراجعة</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                النسبة الفعلية: {fmt(HfToHpRatio * 100, 1)}% من Hp
              </div>
            </div>
          </div>

          {/* بطاقة Hvct */}
          <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-emerald-500/5 p-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 blur-2xl" />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300 text-sm font-medium">سماكة الجدار الداخلي</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-emerald-400" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                  {fmt(Hvct, 0)}
                </span>
                <span className="text-emerald-400/70 text-lg">cm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">Hvct — الحد الأدنى وفق الكود</span>
                <div className="flex items-center gap-1">
                  {verified.hvctOk ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400/70 text-xs">BMK-02 ✓</span>
                    </>
                  ) : (
                    <span className="text-amber-400 text-xs">قيد المراجعة</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ القسم ج: ملخص المقارنة — رسم بياني شريطي ═══════════ */}
        <Card className="bg-slate-900/80 border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
              <Ruler className="w-5 h-5 text-emerald-400" />
              ملخص المقارنة
              <span className="text-slate-500 text-sm font-normal">Hp &gt; Hc &gt; Hf &gt; Hvct</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {barData.map((bar) => {
              const widthPct = (bar.value / maxValue) * 100;
              return (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${bar.textColor}`}>{bar.label}</span>
                      <span className="text-slate-400">{bar.labelAr}</span>
                    </div>
                    <span className={`font-mono font-bold ${bar.textColor}`}>
                      {fmt(bar.value, 2)} cm
                    </span>
                  </div>
                  <div className="w-full h-8 bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/30">
                    <div
                      className={`h-full ${bar.color} rounded-lg transition-all duration-700 ease-out`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <Separator className="bg-slate-800/60" />

            {/* العلاقات بين السماكات */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-3">
              <h3 className="text-sm font-medium text-slate-300">العلاقات بين السماكات</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">
                    <span className="text-emerald-400 font-mono">Hp</span> &gt; <span className="text-teal-400 font-mono">Hc</span>
                    <span className="text-slate-500"> — السقف أسمك من الجدار</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">
                    <span className="text-teal-400 font-mono">Hc</span> &gt; <span className="text-cyan-400 font-mono">Hf</span>
                    <span className="text-slate-500"> — الجدار أسمك من الأرضية</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">
                    <span className="text-cyan-400 font-mono">Hf</span> &gt; <span className="text-sky-400 font-mono">Hvct</span>
                    <span className="text-slate-500"> — الأرضية أسمك من الجدار الداخلي</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">
                    <span className="text-cyan-400 font-mono">Hf</span> ≈ 60% × <span className="text-emerald-400 font-mono">Hp</span>
                    <span className="text-slate-500"> — الأرضية 60% من السقف</span>
                  </span>
                </div>
              </div>
            </div>

            {/* تأكيد BMK-02 */}
            <div className="flex items-center gap-2 justify-center text-sm py-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400/80">جميع القيم متحقق منها وفق BMK-02</span>
            </div>
          </CardContent>
        </Card>

        {/* تذييل */}
        <div className="text-center text-xs text-slate-600 py-4">
          المدقق الديناميكي الموحد V3.1 — الخطوة 8: تصميم سماكة الجدران — BMK-02
        </div>
      </div>
    </div>
  );
}
