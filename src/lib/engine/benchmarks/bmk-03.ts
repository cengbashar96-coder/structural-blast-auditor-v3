// ═══════════════════════════════════════════════════════════════════════
// Benchmark 3 — الحالة الحرجة — فشل هش و spalling
// منصة المدقق الديناميكي الموحد V3.0
// الحالة الأصعب — تختبر الحد الحرج والقرار الإنشائي عند الصخر
// ═══════════════════════════════════════════════════════════════════════
//
// الهدف: اختبار الاختراق الحرج و spalling والقرار الإنشائي عند الوسط الصخري
// السلاح: FAB-1500 | السرعة: 450 m/s | التربة: HARD_ROCK (صخر شديد القساوة)
//
// هذه الحالة تختبر:
//   - ليس فقط حساب الاختراق، بل اختبار الحد الحرج: h0, spalling thickness
//   - إصدار حكم واضح: هل المقطع يدخل منطقة فشل هش؟
//   - هل يحتاج تضخيم استثنائي أم يرفض التصميم؟
//   - الفرق بين مجرد رقم وبين قرار هندسي
// ═══════════════════════════════════════════════════════════════════════

import type { BenchmarkCase } from '../types';

/**
 * BMK-03: Critical hard-rock failure benchmark
 *
 * FAB-1500 + V = 450 m/s + HARD_ROCK
 *
 * هذه الحالة صارمة جدًا في التحقق لأن:
 * 1. أي خطأ فيها سيفسد منطق الأمان في النواة كلها
 * 2. التربة/الصخر والاختراق والسمك الحاكم كلها مترابطة
 * 3. هنا يظهر الفرق بين مجرد رقم وبين قرار هندسي
 * 4. يجب أن يُجبر النظام على فحص:
 *    - h0 (السمك الحاكم)
 *    - spalling thickness
 *    - شرط اللامركزية e <= h/6
 *    - قرار الفشل الهش أو التضخيم الاستثنائي
 */
export const BMK_03: BenchmarkCase = {
  id: 'BMK-03',
  title: 'Critical hard-rock failure benchmark',
  objective:
    'اختبار الاختراق الحرج و spalling والقرار الإنشائي عند الوسط الصخري شديد القساوة. ' +
    'الهدف ليس فقط حساب أرقام، بل إجبار النظام على إصدار قرار هندسي واضح: ' +
    'هل المقطع يدخل منطقة فشل هش؟ هل يحتاج تضخيم استثنائي؟ أم يُرفض التصميم كلياً؟ ' +
    'التربة الصخرية والاختراق والسمك الحاكم كلها مترابطة — هنا يظهر الفرق بين رقم وقرار.',

  // ─── المدخلات ───
  inputSpec: {
    weaponId: 'FAB-1500',
    impactVelocity: 450,           // m/s — سرعة عالية جداً
    soilTypeCode: 'HARD_ROCK',
    impactAngleDeg: 0,             // عمودي — أسوأ حالة
    ceilingDepthMeters: 2.0,       // سقف قريب من السطح — خطير
    tunnelSpanShortMeters: 5.0,
    tunnelSpanLongMeters: 7.0,
    fcMpa: 40,                     // خرسانة عالية المقاومة
    fyMpa: 420,
  },

  // ─── المرجع ───
  referenceSpec: {
    weaponName: 'FAB-1500',
    soilNameAr: 'جرانيت/نايس (صخرية شديدة القساوة)',
    soilReferenceName: 'granite_gneiss',
    designCode: 'BOTH',
    excelSource: 'Excel-03: Critical Penetration & Spalling Check',
  },

  // ─── القيم الوسيطة المتوقعة ───
  expectedIntermediateValues: [
    {
      symbol: 'lambda1',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'معامل تأثير شكل الرأس (Eq. 14) — FAB-1500 لها Lh/D مختلف',
    },
    {
      symbol: 'lambda2',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'معامل تأثير القطر (Eq. 15) — قطر كبير',
    },
    {
      symbol: 'n',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'أُس التأثير (Eq. 16)',
    },
    {
      symbol: 'C_eff',
      unit: 'kg',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'الشحنة الفعالة — شحنة كبيرة جداً',
    },
    {
      symbol: 'x_critical',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'عمق الاختراق الحرج — يجب أن يكون كبيراً بسبب السرعة والشحنة',
    },
    {
      symbol: 'h0',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'عمق الحفرة / العمق المكافئ — الحاكم لقرار spalling',
    },
    {
      symbol: 'h_bar_z',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'العمق المكافئ المختزل — هل هو < 0.7؟ (يُغيّر معامل الإجهاد)',
    },
    {
      symbol: 'Z',
      unit: 'm/kg^(1/3)',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'البعد المختزل — قريب جداً بسبب عمق السقف الضحل',
    },
    {
      symbol: 'sigma_max',
      unit: 'MPa',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'الإجهاد الأقصى — مرتفع جداً في الصخر مع مسافة قريبة',
    },
  ],

  // ─── القيم النهائية المتوقعة ───
  expectedFinalValues: [
    {
      symbol: 'penetrationDepth',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'عمق الاختراق الكلي — يجب أن يتجاوز عمق السقف',
    },
    {
      symbol: 'spallingThickness',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'سماكة spalling المطلوبة — الحاكم لقرار الفشل الهش',
    },
    {
      symbol: 'P_design',
      unit: 'MPa',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'الضغط التصميمي — يجب أن يكون مرتفعاً جداً',
    },
    {
      symbol: 'e/h',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'نسبة اللامركزية — متوقع أن تتجاوز 1/6 (خارج النواة)',
    },
  ],

  // ─── القرار المتوقع ───
  expectedFinalDecision: {
    validationStatus: 'WARNING_OR_FAILURE' as any,  // يُعدَّل بعد ملء القيم
    expectedFailures: [
      // المتوقع: فشل هش أو تجاوز spalling
      'ERR-SPALL-01: عمق الاختراق يتجاوز السماكة المتاحة — خطر فشل هش',
      'ERR-CORE-01: اللامركزية تتجاوز حد النواة (e > h/6)',
    ],
    expectedWarnings: [
      'المقطع يدخل منطقة فشل هش — التضخيم الاستثنائي مطلوب',
      'التحقق من إمكانية رفض التصميم كلياً في هذه الحالة',
      'طبقة صخرية شديدة القساوة فوق السقف تُغيّر سلوك الموجة',
    ],
  },

  // ─── ملاحظات المحرك ───
  engineNotes:
    'هذه الحالة هي الأصعب في النظام. ' +
    'الصخر شديد القساوة يُغيّر سلوك الاختراق والموجة بشكل جذري. ' +
    'Kpr للجرانيت/نايس = 7.00e-7 — أصغر بمرتين من التربة المتوسطة، ' +
    'لكن سرعة الاصطدام 450 m/s والشحنة الكبيرة تعوض جزئياً. ' +
    'المفتاح هنا ليس الأرقام بل القرار: هل يُصدر النظام حكماً صريحاً بالفشل؟ ' +
    'إذا مرت الحالة بدون إنذار — فالنواة كلها مشكوك فيها. ' +
    'شرط e <= h/6 يجب أن يُفحص بصرامة لأن اللامركزية هنا حاكمة. ' +
    'يجب مقارنة كل قيمة مع Excel-03 بدقة متناهية.',

  // ─── بيانات وصفية ───
  priority: 1,
  isLocked: false,            // يُقفل بعد ملء القيم المرجعية من Excel
  lastUpdated: '2026-06-12',
};
