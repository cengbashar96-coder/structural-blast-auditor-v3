// ═══════════════════════════════════════════════════════════════════════
// Benchmark 3 — الحالة الحرجة — فشل هش و spalling
// منصة المدقق الديناميكي الموحد V3.0
// الحالة الأصعب — تختبر الحد الحرج والقرار الإنشائي عند الصخر
// ═══════════════════════════════════════════════════════════════════════
//
// الهدف: اختبار الاختراق الحرج و spalling والقرار الإنشائي عند الوسط الصخري
// السلاح: FAB-1500 | السرعة: 450 m/s | التربة: HARD_ROCK (صخر شديد القساوة)
//
// القيم محسوبة بواسطة المحرك وتحقق منها يدوياً
// ═══════════════════════════════════════════════════════════════════════

import type { BenchmarkCase } from '../types';

export const BMK_03: BenchmarkCase = {
  id: 'BMK-03',
  title: 'Critical hard-rock failure benchmark — FAB-1500 + HARD_ROCK',
  objective:
    'اختبار الاختراق الحرج و spalling والقرار الإنشائي عند الوسط الصخري شديد القساوة. ' +
    'الهدف إجبار النظام على إصدار قرار هندسي واضح: هل المقطع يدخل منطقة فشل هش؟ ' +
    'الضغط التصميمي مرتفع جداً بسبب قرب البعد الشعاعي (≈2.15m) مع شحنة كبيرة (646 kg TNT).',

  inputSpec: {
    weaponId: 'W_FAB_1500',
    impactVelocity: 450,
    soilTypeCode: 'HARD_ROCK',
    impactAngleDeg: 0,
    ceilingDepthMeters: 2.0,
    tunnelSpanShortMeters: 5.0,
    tunnelSpanLongMeters: 7.0,
    fcMpa: 40,
    fyMpa: 420,
  },

  referenceSpec: {
    weaponName: 'FAB-1500',
    soilNameAr: 'جرانيت/نايس (صخرية شديدة القساوة)',
    soilReferenceName: 'granite_gneiss',
    designCode: 'BOTH',
    excelSource: 'Excel-03: FAB-1500 + HARD_ROCK Critical',
  },

  expectedIntermediateValues: [
    { symbol: 'lambda1', unit: '-', expectedValue: 1.1347, tolerance: 0.02, description: 'معامل تأثير شكل الرأس (Eq. 14) — FAB-1500 نفس Lh/D=2' },
    { symbol: 'lambda2', unit: '-', expectedValue: 1.3643, tolerance: 0.02, description: 'معامل تأثير القطر (Eq. 15) — قطر كبير 0.62m' },
    { symbol: 'n', unit: '-', expectedValue: 1.5, tolerance: 0.02, description: 'أُس التأثير (Eq. 16)' },
    { symbol: 'C_eff', unit: 'kg', expectedValue: 646.0, tolerance: 0.02, description: 'الشحنة الفعالة — شحنة كبيرة جداً' },
    { symbol: 'x_critical', unit: 'm', expectedValue: 1.9029, tolerance: 0.05, description: 'عمق الاختراق — صغير نسبياً بسبب صلابة الصخر' },
    { symbol: 'h0', unit: 'm', expectedValue: 1.1539, tolerance: 0.05, description: 'عمق الحفرة المكافئ' },
    { symbol: 'h_bar_z', unit: '-', expectedValue: 0.1131, tolerance: 0.05, description: 'العمق المكافئ المختزل — أقل من 0.7 ← تخفيض معامل الإجهاد' },
    { symbol: 'Z', unit: 'm/kg^(1/3)', expectedValue: 0.2487, tolerance: 0.05, description: 'البعد المختزل — قريب جداً بسبب عمق السقف الضحل' },
    { symbol: 'sigma_max', unit: 'MPa', expectedValue: 260.14, tolerance: 0.10, description: 'الإجهاد الأقصى — مرتفع جداً في الصخر مع مسافة قريبة' },
  ],

  expectedFinalValues: [
    { symbol: 'penetrationDepth', unit: 'm', expectedValue: 1.9029, tolerance: 0.05, description: 'عمق الاختراق الكلي — أقل من عمق السقف (2.0m) لكن قريب جداً' },
    { symbol: 'spallingThickness', unit: 'm', expectedValue: 1.2369, tolerance: 0.05, description: 'سماكة spalling المطلوبة — الحاكم لقرار الفشل الهش' },
    { symbol: 'P_design', unit: 'kg/cm2', expectedValue: 853.19, tolerance: 0.10, description: 'الضغط التصميمي — مرتفع جداً (أكبر بكثير من BMK-02)' },
    { symbol: 'R_actual', unit: 'm', expectedValue: 2.1496, tolerance: 0.05, description: 'البعد الشعاعي الفعلي — قريب جداً من مركز الانفجار' },
  ],

  expectedFinalDecision: {
    validationStatus: 'FAILURE',
    expectedFailures: [
      'ERR-CORE-01: اللامركزية تتجاوز حد النواة (e > h/6) — الضغط التصميمي مرتفع جداً',
      'ERR-XI-01: نسبة العمق ξ تتجاوز الحد ξR — المقطع يدخل منطقة فشل هش',
      'ERR-MAT-01: مقاومة الخرسانة (40 MPa) غير كافية للضغط التصميمي المرتفع',
    ],
    expectedWarnings: [
      'المقطع يدخل منطقة فشل هش — التضخيم الاستثنائي مطلوب',
      'h̄z < 0.7 — معامل الإجهاد يُخفَّض بعامل 0.6 مما يزيد الضغط أكثر',
      'الضغط التصميمي (≈853 kg/cm²) يتجاوز قدرة الخرسانة العادية بكثير',
      'طبقة صخرية شديدة القساوة فوق السقف تُغيّر سلوك الموجة جذرياً',
    ],
  },

  engineNotes:
    'الحالة الأصعب في النظام. ' +
    'الصخر شديد القساوة (kp=7e-7) يمنع الاختراق العميق (≈1.9m فقط)، ' +
    'لكن الشحنة الكبيرة (646 kg TNT) والبعد الشعاعي القريب (≈2.15m) ' +
    'يُنتجان ضغطاً تصميمياً هائلاً (≈853 kg/cm²). ' +
    'h̄z = 0.113 < 0.7 ← معامل الإجهاد يُخفَّض بـ 0.6. ' +
    'المفتاح: هل يُصدر النظام حكماً صريحاً بالفشل؟ ' +
    'إذا مرت الحالة بدون إنذار — فالنواة كلها مشكوك فيها. ' +
    'K1 = 1.0 (TNT) لأن FAB-1500 تستخدم متفجرات TNT. ' +
    'القيم محسوبة من المحرك ومتحقق منها يدوياً.',

  priority: 1,
  isLocked: true,
  lastUpdated: '2026-07-08',
};
