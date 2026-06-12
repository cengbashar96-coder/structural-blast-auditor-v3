// ═══════════════════════════════════════════════════════════════════════
// Benchmark 2 — المرجع الذهبي المقفل
// منصة المدقق الديناميكي الموحد V3.0
// السلاح: MK83 | السرعة: 350 m/s | التربة: MEDIUM_SOIL | fc=20 | fy=300
// جميع القيم مستخرجة من ملفات Excel والمرجع التحليلي
// ═══════════════════════════════════════════════════════════════════════

import type { BenchmarkCase } from '../types';

export const BMK_02: BenchmarkCase = {
  id: 'BMK-02',
  title: 'Golden Reference — MK83 + MEDIUM_SOIL (Locked)',
  objective:
    'المرجع الذهبي المقفل: يختبر خط الحساب الكامل من الاختراق عبر الانفجار حتى التصميم الإنشائي. ' +
    'كل output يجب أن يُقاس مقابل هذه القيم. ' +
    'المتغيرات المقفلة لا تُعاد كتابتها بين المحركات.',

  inputSpec: {
    weaponId: 'W_MK83',
    impactVelocity: 350,
    soilTypeCode: 'MEDIUM_SOIL',
    impactAngleDeg: 20,
    ceilingDepthMeters: 3.7,
    tunnelSpanShortMeters: 4,
    tunnelSpanLongMeters: 5,
    fcMpa: 20,
    fyMpa: 300,
  },

  referenceSpec: {
    weaponName: 'MK83',
    soilNameAr: 'طين مع حجارة (رملية حصوية متوسطة)',
    soilReferenceName: 'clay_with_stones',
    designCode: 'BOTH',
    excelSource: 'Excel-BMK02: MK83 + MEDIUM_SOIL Complete Pipeline (Steps 2-8)',
  },

  expectedIntermediateValues: [
    { symbol: 'lambda1', unit: '-', expectedValue: 1.134667074552914, tolerance: 0.01, description: 'معامل تأثير شكل الرأس (Eq.14)' },
    { symbol: 'lambda2', unit: '-', expectedValue: 1.21253869486675, tolerance: 0.01, description: 'معامل تأثير القطر (Eq.15)' },
    { symbol: 'n_exp', unit: '-', expectedValue: 1.5, tolerance: 0.01, description: 'أُس التأثير (Eq.16)' },
    { symbol: 'C_ef', unit: 'kg', expectedValue: 334.76575, tolerance: 0.01, description: 'الشحنة الفعالة (Eq.19)' },
    { symbol: 'h_pr', unit: 'm', expectedValue: 2.7717367373, tolerance: 0.01, description: 'عمق الاختراق المصحح' },
    { symbol: 'R_actual', unit: 'm', expectedValue: 7.6230969724513375, tolerance: 0.02, description: 'البعد الشعاعي الفعلي' },
    { symbol: 'Zp', unit: '-', expectedValue: 5.8212740516901125, tolerance: 0.02, description: 'البعد المختزل' },
    { symbol: 'ht', unit: 'cm', expectedValue: 107.2167056901, tolerance: 0.01, description: 'العمق الكلي' },
    { symbol: 'Bt', unit: 'm', expectedValue: 8.0520158398, tolerance: 0.01, description: 'البحر المكافئ' },
    { symbol: 'omega_roof', unit: 'rad/s', expectedValue: 561.6673670487, tolerance: 0.01, description: 'تردد السقف الطبيعي' },
    { symbol: 'omega_wall', unit: 'rad/s', expectedValue: 1024.0477954056, tolerance: 0.01, description: 'تردد الجدار الطبيعي' },
    { symbol: 'Pmax_roof', unit: 'kg/cm2', expectedValue: 4.6084144906, tolerance: 0.01, description: 'الضغط الأقصى سقف' },
    { symbol: 'Pmax_wall', unit: 'kg/cm2', expectedValue: 6.2856466944, tolerance: 0.01, description: 'الضغط الأقصى جدار' },
    { symbol: 'P_ekv_roof', unit: 'kg/cm2', expectedValue: 3.8157671982, tolerance: 0.01, description: 'الضغط المكافئ سقف' },
    { symbol: 'P_ekv_wall', unit: 'kg/cm2', expectedValue: 3.0828604505, tolerance: 0.01, description: 'الضغط المكافئ جدار' },
    { symbol: 'Pp_roof', unit: 'kg/cm2', expectedValue: 4.9211162574, tolerance: 0.01, description: 'الحمل التصميمي سقف' },
    { symbol: 'Pp_wall', unit: 'kg/cm2', expectedValue: 3.7845046175, tolerance: 0.01, description: 'الحمل التصميمي جدار' },
    { symbol: 'Mp_roof', unit: 'kg.cm', expectedValue: 20000000, tolerance: 0.01, description: 'عزم السقف' },
    { symbol: 'Mp_wall', unit: 'kg.cm', expectedValue: 10000000, tolerance: 0.01, description: 'عزم الجدار' },
    { symbol: 'h0', unit: 'cm', expectedValue: 67.1042712976, tolerance: 0.01, description: 'العمق الفعال من العزم' },
  ],

  expectedFinalValues: [
    { symbol: 'Hp_final', unit: 'cm', expectedValue: 70.4594848625, tolerance: 0.01, description: 'سماكة السقف النهائية' },
    { symbol: 'Hc_final', unit: 'cm', expectedValue: 49.8223795452, tolerance: 0.01, description: 'سماكة الجدار النهائية' },
    { symbol: 'Hf_final', unit: 'cm', expectedValue: 42.3490226134, tolerance: 0.01, description: 'سماكة الأرضية النهائية' },
    { symbol: 'Hvct_final', unit: 'cm', expectedValue: 30, tolerance: 0.01, description: 'سماكة الجدار الداخلي' },
  ],

  expectedFinalDecision: {
    validationStatus: 'SUCCESS',
    expectedFailures: [],
    expectedWarnings: [],
  },

  engineNotes:
    'المرجع الذهبي المقفل — BMK-02. ' +
    'h_pr المصححة = 2.7717367373 m (ليست 3.65 m القديمة). ' +
    'omega_wall = 1024.0478 rad/s (منفصلة عن omega_roof = 561.6674). ' +
    'القيم المقفلة لا تُعاد كتابتها بين المحركات — التسامح 5% كحد أقصى. ' +
    'Hp_final = h0 × 1.05 = 70.46 cm. ' +
    'لا تعِد الحسابات ما لم تتغير المدخلات الأساسية.',

  priority: 1,
  isLocked: true,
  lastUpdated: '2026-06-13',
};
