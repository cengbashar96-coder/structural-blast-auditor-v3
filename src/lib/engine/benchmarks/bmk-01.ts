// ═══════════════════════════════════════════════════════════════════════
// Benchmark 1 — الاختراق المنخفض في تربة لينة
// منصة المدقق الديناميكي الموحد V3.0
// الحالة المرجعية الأولى — سلسلة البداية لخط الحساب كله
// ═══════════════════════════════════════════════════════════════════════
//
// الهدف: اختبار عمق الاختراق الصافي والضغط العصفي المنخفض
// السلاح: FAB-250 | السرعة: 200 m/s | التربة: SOFT_SOIL (غضارية طينية لينة)
//
// هذه الحالة تختبر:
//   - سلسلة البداية: الاختراق → الحفرة → الضغط العصفي الأولي
//   - أن جميع القيم موجبة ومنطقية
//   - لا حاجة لتسليح أو سماكات إنشائية في هذه المرحلة
// ═══════════════════════════════════════════════════════════════════════

import type { BenchmarkCase } from '../types';

/**
 * BMK-01: Low-impact penetration benchmark
 *
 * FAB-250 + V = 200 m/s + SOFT_SOIL
 *
 * هذه هي أول حالة Regression Test لأنها تُثبت أن:
 * 1. معرف السلاح يُربط بشكل صحيح بمكتبة الأسلحة
 * 2. اسم التربة يُربط بشكل صحيح بجداول الاستيفاء
 * 3. القيم الوسيطة (x1, h0, Pso) تحسب بشكل صحيح
 * 4. سلسلة الاختراق والتربة هي بداية خط الحساب كله
 */
export const BMK_01: BenchmarkCase = {
  id: 'BMK-01',
  title: 'Low-impact penetration benchmark',
  objective:
    'اختبار عمق الاختراق الصافي والضغط العصفي المنخفض في تربة غضارية طينية لينة. ' +
    'التحقق أن سلسلة البداية (الاختراق → الحفرة → الضغط) تُنتج قيماً موجبة ومنطقية. ' +
    'هذه الحالة لا تتطلب تسليحاً أو سماكات إنشائية — فقط تثبيت مدخلات القنبلة والتربة ونتائج الاختراق والضغط.',

  // ─── المدخلات ───
  inputSpec: {
    weaponId: 'FAB-250',
    impactVelocity: 200,           // m/s
    soilTypeCode: 'SOFT_SOIL',
    impactAngleDeg: 0,             // عمودي
  },

  // ─── المرجع ───
  referenceSpec: {
    weaponName: 'FAB-250',
    soilNameAr: 'طين رطب مشبع (غضارية طينية لينة)',
    soilReferenceName: 'water_saturated_clay',
    designCode: 'UFC_3-340-02',
    excelSource: 'Excel-01: Penetration & Soil Tables',
  },

  // ─── القيم الوسيطة المتوقعة ───
  // ملاحظة: القيم المرجعية ستُملأ من Excel بعد تشغيل المحرك الأول
  // التسامح الافتراضي: 2% (0.02) — يُضيق لاحقاً بعد التحقق
  expectedIntermediateValues: [
    {
      symbol: 'lambda1',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'معامل تأثير شكل الرأس الحربي (Eq. 14)',
    },
    {
      symbol: 'lambda2',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'معامل تأثير القطر (Eq. 15)',
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
      description: 'الشحنة الفعالة (Eq. 19)',
    },
    {
      symbol: 'tsu',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'معامل زاوية الاختراق (Eq. 17)',
    },
    {
      symbol: 'h_bar_z',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'العمق المكافئ المختزل',
    },
  ],

  // ─── القيم النهائية المتوقعة ───
  expectedFinalValues: [
    {
      symbol: 'x1',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel — عمق الاختراق
      tolerance: 0.02,
      description: 'عمق الاختراق الصافي في التربة اللينة',
    },
    {
      symbol: 'h0',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel — عمق الحفرة
      tolerance: 0.02,
      description: 'عمق الحفرة / العمق المكافئ',
    },
    {
      symbol: 'Pso',
      unit: 'MPa',
      expectedValue: 0,        // TODO: ملء من Excel — الضغط الجانبي
      tolerance: 0.02,
      description: 'الضغط العصفي الجانبي عند مسافة قريبة',
    },
  ],

  // ─── القرار المتوقع ───
  expectedFinalDecision: {
    validationStatus: 'SUCCESS',
    expectedFailures: [],
    expectedWarnings: [
      'قيم الاختراق في التربة اللينة قد تكون كبيرة نسبياً — التحقق من عمق السقف مطلوب عند ربط المحرك التصميمي',
    ],
  },

  // ─── ملاحظات المحرك ───
  engineNotes:
    'هذه الحالة هي البداية المطلقة لخط الحساب. ' +
    'سلسلة الاختراق والتربة هي أول ما يُنفَّذ في penetration-core. ' +
    'أي خطأ هنا يُفسد كل ما يليه. ' +
    'القيم المرجعية يجب أن تُقارن مباشرة مع Excel-01 بعد تشغيل المحرك الأول. ' +
    'التسامح 2% مبدئي ويجب أن يُضيَّق إلى ≤0.5% بعد اعتماد النتائج.',

  // ─── بيانات وصفية ───
  priority: 1,
  isLocked: false,            // يُقفل بعد ملء القيم المرجعية من Excel
  lastUpdated: '2026-06-12',
};
