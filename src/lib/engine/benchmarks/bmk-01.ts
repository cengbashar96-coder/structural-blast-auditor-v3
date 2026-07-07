// ═══════════════════════════════════════════════════════════════════════
// Benchmark 1 — الاختراق المنخفض في تربة لينة
// منصة المدقق الديناميكي الموحد V3.0
// الحالة المرجعية الأولى — سلسلة البداية لخط الحساب كله
// ═══════════════════════════════════════════════════════════════════════
//
// الهدف: اختبار عمق الاختراق والضغط العصفي في تربة لينة
// السلاح: FAB-250 | السرعة: 200 m/s | التربة: SOFT_SOIL (غضارية طينية لينة)
//
// القيم محسوبة بواسطة المحرك وتحقق منها يدوياً
// ═══════════════════════════════════════════════════════════════════════

import type { BenchmarkCase } from '../types';

export const BMK_01: BenchmarkCase = {
  id: 'BMK-01',
  title: 'Low-impact penetration benchmark — FAB-250 + SOFT_SOIL',
  objective:
    'اختبار عمق الاختراق والضغط العصفي في تربة غضارية طينية لينة. ' +
    'التحقق أن سلسلة البداية (الاختراق → الضغط) تُنتج قيماً موجبة ومنطقية. ' +
    'التربة اللينة تسمح باختراق عميق لكنها تمتص جزءاً كبيراً من طاقة الانفجار.',

  inputSpec: {
    weaponId: 'W_FAB_250',
    impactVelocity: 200,
    soilTypeCode: 'SOFT_SOIL',
    impactAngleDeg: 0,
    ceilingDepthMeters: 3.7,
    tunnelSpanShortMeters: 4,
    tunnelSpanLongMeters: 5,
    fcMpa: 20,
    fyMpa: 300,
  },

  referenceSpec: {
    weaponName: 'FAB-250',
    soilNameAr: 'طين رطب مشبع (غضارية طينية لينة)',
    soilReferenceName: 'water_saturated_clay',
    designCode: 'UFC_3-340-02',
    excelSource: 'Excel-01: FAB-250 + SOFT_SOIL',
  },

  expectedIntermediateValues: [
    { symbol: 'lambda1', unit: '-', expectedValue: 1.1347, tolerance: 0.02, description: 'معامل تأثير شكل الرأس الحربي (Eq. 14)' },
    { symbol: 'lambda2', unit: '-', expectedValue: 1.1631, tolerance: 0.02, description: 'معامل تأثير القطر (Eq. 15)' },
    { symbol: 'n', unit: '-', expectedValue: 1.5, tolerance: 0.02, description: 'أُس التأثير (Eq. 16)' },
    { symbol: 'C_eff', unit: 'kg', expectedValue: 95.0, tolerance: 0.02, description: 'الشحنة الفعالة (Eq. 19)' },
    { symbol: 'tsu', unit: 'm', expectedValue: 0.475, tolerance: 0.02, description: 'معامل زاوية الاختراق (Eq. 18)' },
    { symbol: 'h_bar_z', unit: '-', expectedValue: 1.9848, tolerance: 0.05, description: 'العمق المكافئ المختزل' },
  ],

  expectedFinalValues: [
    { symbol: 'x1', unit: 'm', expectedValue: 9.5316, tolerance: 0.02, description: 'عمق الاختراق الصافي في التربة اللينة — عميق بسبب kp العالي' },
    { symbol: 'h0', unit: 'm', expectedValue: 10.6868, tolerance: 0.05, description: 'عمق الحفرة المكافئ' },
    { symbol: 'Pso', unit: 'MPa', expectedValue: 0.2873, tolerance: 0.05, description: 'الضغط العصفي الجانبي — منخفض بسبب البعد الكبير' },
    { symbol: 'R_actual', unit: 'm', expectedValue: 9.7095, tolerance: 0.02, description: 'البعد الشعاعي الفعلي' },
    { symbol: 'Zp', unit: '-', expectedValue: 2.1279, tolerance: 0.05, description: 'البعد المختزل' },
  ],

  expectedFinalDecision: {
    validationStatus: 'SUCCESS',
    expectedFailures: [],
    expectedWarnings: [
      'الاختراق عميق جداً في التربة اللينة (x1 > 9m) — تأكد من كفاية عمق الدفن',
      'h̄z > 0.7 — لا حاجة لتخفيض معامل الإجهاد',
    ],
  },

  engineNotes:
    'حالة التربة اللينة: kp = 1.3e-5 (أعلى من التربة المتوسطة بمرتين). ' +
    'الاختراق عميق (≈9.5m) بسبب سهولة اختراق التربة اللينة. ' +
    'الضغط العصفي منخفض نسبياً بسبب البعد الشعاعي الكبير (≈9.7m). ' +
    'K1 = 1.0 (TNT) لأن FAB-250 تستخدم متفجرات TNT. ' +
    'القيم محسوبة من المحرك ومتحقق منها يدوياً.',

  priority: 1,
  isLocked: true,
  lastUpdated: '2026-07-08',
};
