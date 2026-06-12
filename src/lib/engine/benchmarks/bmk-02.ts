// ═══════════════════════════════════════════════════════════════════════
// Benchmark 2 — الحالة التصميمية الرئيسية
// منصة المدقق الديناميكي الموحد V3.0
// الحالة الأهم — تربط محرك الانفجار بمحرك التصميم والتسليح
// ═══════════════════════════════════════════════════════════════════════
//
// الهدف: اختبار الحالة التصميمية المتوسطة وربط محرك الانفجار بالتسليح والسماكة
// السلاح: FAB-500 | السرعة: 350 m/s | التربة: MEDIUM_SOIL | fc=35 | fy=420
//
// هذه الحالة تختبر:
//   - انتقال النظام من الانفجار إلى التصميم الإنشائي: Z, Pr, T0 → ht, As
//   - ربط محرك الانفجار بمحرك التصميم والتسليح
//   - المرجع الرئيسي للمقارنة مع Excel
// ═══════════════════════════════════════════════════════════════════════

import type { BenchmarkCase } from '../types';

/**
 * BMK-02: Design-critical medium case
 *
 * FAB-500 + V = 350 m/s + MEDIUM_SOIL + fc = 35 MPa + fy = 420 MPa
 *
 * هذه هي الحالة التصميمية الحاكمة لأنها:
 * 1. تربط بين الانفجار والتحميل الديناميكي ثم التصميم الإنشائي
 * 2. تختبر المتغيرات الوسيطة الحاكمة: Z, Pr, T0, ht, As
 * 3. تختبر DIF للمواد إذا كان المحرك سيستخدمها فعلياً
 * 4. ستكون المرجع الرئيسي للمقارنة مع Excel
 */
export const BMK_02: BenchmarkCase = {
  id: 'BMK-02',
  title: 'Design-critical medium case',
  objective:
    'اختبار الحالة التصميمية المتوسطة وربط محرك الانفجار بالتصميم الإنشائي. ' +
    'هذه هي الحالة الأهم لأنها تنتقل من حسابات الضغط (Z, Pr, T0) إلى التصميم (ht, As). ' +
    'تحتوي على متغيرات وسيطة حاكمة تربط المحركين معاً — أي انحراف هنا يعني خطأ في السلسلة الكاملة.',

  // ─── المدخلات ───
  inputSpec: {
    weaponId: 'FAB-500',
    impactVelocity: 350,           // m/s
    soilTypeCode: 'MEDIUM_SOIL',
    impactAngleDeg: 0,             // عمودي
    ceilingDepthMeters: 3.0,       // عمق نفق متوسط
    tunnelSpanShortMeters: 6.0,    // بحر قصير
    tunnelSpanLongMeters: 8.0,     // بحر طويل
    fcMpa: 35,
    fyMpa: 420,
  },

  // ─── المرجع ───
  referenceSpec: {
    weaponName: 'FAB-500',
    soilNameAr: 'طين مع حجارة (رملية حصوية متوسطة الكثافة)',
    soilReferenceName: 'clay_with_stones',
    designCode: 'BOTH',
    excelSource: 'Excel-02: Blast + Structural Design (Primary Reference)',
  },

  // ─── القيم الوسيطة المتوقعة (محرك الانفجار) ───
  expectedIntermediateValues: [
    {
      symbol: 'lambda1',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'معامل تأثير شكل الرأس (Eq. 14)',
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
      symbol: 'x1',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'عمق الاختراق في التربة المتوسطة',
    },
    {
      symbol: 'h_bar_z',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'العمق المكافئ المختزل',
    },
    {
      symbol: 'Z',
      unit: 'm/kg^(1/3)',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'البعد المختزل (Scaled Distance) — الحاكم لقيمة الضغط',
    },
    {
      symbol: 'sigma_max',
      unit: 'MPa',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'الإجهاد الأقصى في التربة',
    },
    {
      symbol: 'Pr',
      unit: 'MPa',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'الضغط المنعكس (Reflected Pressure)',
    },
    {
      symbol: 'T0',
      unit: 'ms',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'مدة الطور الموجب (Positive Phase Duration)',
    },
    {
      symbol: 'DIF_c',
      unit: 'dimensionless',
      expectedValue: 1.25,     // ثابت UFC 3-340-02
      tolerance: 0.001,
      description: 'معامل تضخيم الخرسانة الديناميكي (UFC Table)',
    },
    {
      symbol: 'DIF_s',
      unit: 'dimensionless',
      expectedValue: 1.20,     // ثابت UFC 3-340-02
      tolerance: 0.001,
      description: 'معامل تضخيم الحديد الديناميكي (UFC Table)',
    },
  ],

  // ─── القيم النهائية المتوقعة (محرك التصميم) ───
  expectedFinalValues: [
    {
      symbol: 'P_design',
      unit: 'MPa',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'الضغط التصميمي الكلي (ساكن + ديناميكي)',
    },
    {
      symbol: 'ht',
      unit: 'm',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'السماكة المطلوبة للسقف',
    },
    {
      symbol: 'As',
      unit: 'cm²/m',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'مساحة التسليح المطلوبة لكل متر',
    },
    {
      symbol: 'e/h',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'نسبة اللامركزية — يجب أن تكون ≤ 1/6',
    },
    {
      symbol: 'v_actual/v_cd',
      unit: 'dimensionless',
      expectedValue: 0,        // TODO: ملء من Excel
      tolerance: 0.02,
      description: 'نسبة إجهاد القص الثاقب الفعلي/المسموح',
    },
  ],

  // ─── القرار المتوقع ───
  expectedFinalDecision: {
    validationStatus: 'SUCCESS',
    expectedFailures: [],
    expectedWarnings: [
      'التحقق من شرط الديناميكية — إذا لم يتحقق يجب استخدام معاملات مختلفة',
      'التحقق من شرط نواة المقطع — اللامركزية يجب ألا تتجاوز h/6',
    ],
  },

  // ─── ملاحظات المحرك ───
  engineNotes:
    'هذه هي الحالة الأهم في النظام بأكمله. ' +
    'هنا يحدث الانتقال من محرك الانفجار (Blast Engine) إلى محرك التصميم الإنشائي (Design Engine). ' +
    'المتغيرات الوسيطة Z, Pr, T0 هي الجسر بين المحركين — أي خطأ فيها يُفسد التصميم بالكامل. ' +
    'DIF للمواد ثابتة (1.25 خرسانة، 1.20 حديد) وفق UFC 3-340-02. ' +
    'يجب مقارنة ALL values مع Excel-02 مباشرة بعد أول تشغيل للمحرك. ' +
    'التسامح يجب أن يُضيَّق إلى ≤1% بعد الاعتماد.',

  // ─── بيانات وصفية ───
  priority: 1,
  isLocked: false,            // يُقفل بعد ملء القيم المرجعية من Excel
  lastUpdated: '2026-06-12',
};
