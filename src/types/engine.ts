// ═══════════════════════════════════════════════════════════════════════
// الأنواع الموحدة الموسّعة — محرك الخطوات الديناميكي
// منصة المدقق الديناميكي الموحد V3.0
// هذا الملف يوسّع src/lib/engine/types.ts بأنواع الخطوات والأنابيب
// ═══════════════════════════════════════════════════════════════════════

// ─── إعادة تصدير جميع الأنواع من ملف الأنواع الأساسي ────────────────
export type {
  GeometryType,
  SoilTypeCode,
  DesignMethod,
  ValidationStatus,
  DesignCode,
  ExplosiveType,
  WeaponData,
  SoilCoefficients,
  PenetrationInput,
  PenetrationOutput,
  BlastInput,
  BlastOutput,
  DesignInput,
  ValidationReport,
  SectionDesignResult,
  GeometryComparisonEntry,
  GeometryComparisonReport,
  ExpectedValue,
  BenchmarkCase,
  BenchmarkResult,
  BenchmarkRunReport,
} from '@/lib/engine/types';

export {
  SOIL_CODE_TO_REFERENCE_NAME,
  SOIL_CODE_TO_AR,
} from '@/lib/engine/types';

// ─── 1. أنواع فصل مسار الحمل (Load Path Separation) ──────────────────

/**
 * فصل مسار الحمل — السقف مقابل الجدار
 * كل مسار يحسب بشكل مستقل ثم تُجمّع النتائج
 */
export type BlastLoadPath = 'roof' | 'wall';

// ─── 2. تصنيف المتغيرات (Variable Classification) ─────────────────────

/**
 * تصنيف المتغيرات إلى 5 فئات:
 * - input:      مدخلات من المستخدم (غير قابلة للحساب)
 * - lookup:     قيم من جداول الاستيفاء
 * - computed:   قيم محسوبة بخوارزمية
 * - locked:     قيم مقفلة من خطوة سابقة (لا يمكن الكتابة فوقها)
 * - output:     مخرجات نهائية
 */
export type VariableCategory = 'input' | 'lookup' | 'computed' | 'locked' | 'output';

// ─── 3. أرقام خطوات المحرك (Engine Step Numbers) ─────────────────────

/**
 * أرقام الخطوات في أنبوب المعالجة:
 * - 2: المدخلات والاستيفاءات (Inputs & Lookups)
 * - 3: الاختراق (Penetration)
 * - 4: القفل الأولي (Initial Locking)
 * - 5: حساب الحمل الانفجاري (Blast Load Calculation)
 * - 6: معاملات الجدول ب (B-Table Coefficients)
 * - 7: تصميم سماكة السقف (Ceiling Thickness Design)
 * - 8: تصميم الجدار النهائي (Final Wall Design)
 */
export type EngineStep = 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ─── 4. نتيجة الخطوة العامة (Step Result) ────────────────────────────

/**
 * نتيجة عامة لكل خطوة في أنبوب المعالجة
 * T يحدد شكل القيم المحسوبة في الخطوة
 */
export interface StepResult<T = Record<string, unknown>> {
  /** رقم الخطوة */
  step: EngineStep;
  /** اسم الخطوة بالعربية */
  stepNameAr: string;
  /** اسم الخطوة بالإنجليزية */
  stepNameEn: string;
  /** القيم المحسوبة في هذه الخطوة */
  values: T;
  /** المفاتيح المقفلة التي أنتجتها هذه الخطوة */
  lockedKeys: string[];
  /** حالة التحقق */
  validationStatus: 'PASS' | 'WARN' | 'FAIL';
  /** الانحرافات عن القيم المرجعية (اختياري) */
  deviations?: Array<{
    /** مفتاح المتغير */
    key: string;
    /** القيمة المحسوبة */
    computed: number;
    /** القيمة المرجعية */
    reference: number;
    /** نسبة الانحراف بالمئة */
    deviationPct: number;
  }>;
}

// ─── 5. نتيجة خطوة الاختراق (Penetration Step Result) ────────────────

/**
 * نتيجة خطوة الاختراق — الخطوة 3
 * تحسب أعماق الاختراق والمعاملات المرتبطة
 */
export type PenetrationStepResult = StepResult<{
  /** معامل تأثير شكل الرأس الحربي */
  lambda1: number;
  /** معامل تأثير القطر */
  lambda2: number;
  /** أُس التأثير */
  n_exp: number;
  /** الشحنة الفعالة */
  C_ef: number;
  /** معامل زاوية الاختراق */
  tsu: number;
  /** عمق الاختراق بالأمتار */
  h_pr: number;
  /** عمق الحفرة */
  h_z: number;
  /** العمق المكافئ المختزل */
  h_z_bar: number;
  /** البعد الفعلي */
  R_actual: number;
  /** البعد المختزل */
  Zp: number;
  /** فرق العمق */
  Y_diff: number;
  /** سماكة التدمير */
  hb_destruction: number;
  /** سماكة التشقق */
  hb_cracking: number;
}>;

// ─── 6. نتيجة خطوة الحمل الانفجاري (Blast Load Step Result) ─────────

/**
 * نتيجة خطوة حساب الحمل الانفجاري — الخطوة 5
 * تُحسب بشكل مستقل لكل مسار (سقف / جدار)
 */
export interface BlastLoadStepResult extends StepResult<{
  /** النسبة المختزلة للسماكة */
  h_bar: number;
  /** البعد المختزل B1 */
  R_bar_b1: number;
  /** البعد المكافئ */
  R_ekv: number;
  /** البعد النجمي */
  R_star: number;
  /** أقصى سرعة انفجار */
  max_bv: number;
  /** زمن الطور الموجب */
  tau: number;
  /** الزمن الفعال */
  tau_ef: number;
  /** الزمن الطبيعي */
  tau_n: number;
  /** معامل a0 للضغط */
  a0cp: number;
  /** معامل a1 للضغط */
  a1cp: number;
  /** التردد الدائري */
  omega: number;
  /** معامل الديناميكية */
  C_dyn: number;
  /** نسبة المطاوعة الإنشائية */
  mu_struct: number;
  /** معامل الكفاءة */
  eta: number;
  /** مقاومة القص الديناميكية */
  Rsd: number;
  /** مقاومة الانحناء الديناميكية */
  Rbd: number;
  /** نسبة البعد */
  lambda: number;
  /** معامل الضغط */
  Kp: number;
  /** الضغط الأقصى */
  Pmax: number;
  /** معامل الديناميكية */
  Kd: number;
  /** معامل psi */
  kpsi: number;
  /** الضغط المكافئ */
  P_ekv: number;
  /** ضغط الشد */
  Pct: number;
  /** ضغط الاختراق */
  Pp: number;
  /** هل البعد المكافئ أكبر من البعد النجمي */
  R_ekv_gt_R_star: boolean;
}> {
  /** مسار الحمل: سقف أو جدار */
  path: BlastLoadPath;
}

// ─── 7. معاملات الجدول ب (B-Table Coefficients) ──────────────────────

/**
 * معاملات الجدول ب — الخطوة 6
 * تُستخدم لحساب الاستجابة الديناميكية
 */
export interface BTableCoefficients {
  /** رقم الجدول (B-1, B-2, إلخ) */
  table: string;
  /** البعد المختزل B1 */
  R_bar_b1: number;
  /** نسبة المطاوعة من الجدول */
  mu_table: number;
  /** معامل الكفاءة من الجدول */
  eta_table: number;
  /** معامل الزمن */
  Kt: number;
  /** معامل a0z */
  a0z: number;
  /** معامل a1z */
  a1z: number;
  /** معامل القاعدة */
  Kpod: number;
  /** معامل الضغط */
  Kp: number;
  /** معامل الديناميكية */
  Kd: number;
}

// ─── 8. نتيجة السماكة بالعزم (Moment-based Thickness Result) ─────────

/**
 * نتيجة حساب السماكة بناءً على العزم — الخطوة 7
 * تحسب السماكة المطلوبة للسقف
 */
export interface MomentThicknessResult {
  /** العزم البلاستيكي */
  Mp: number;
  /** نسبة المطاوعة الإنشائية */
  mu_struct: number;
  /** مقاومة القص الديناميكية */
  Rsd: number;
  /** السماكة الأولية المحسوبة */
  h0: number;
  /** السماكة النهائية (h0 * 1.05 — هامش أمان 5%) */
  finalThickness: number;
}

// ─── 9. النتائج المقفلة النهائية (Final Locked Results) ──────────────

/**
 * النتائج المقفلة النهائية — تجمّع بعد اكتمال جميع الخطوات
 * لا يمكن الكتابة فوق أي قيمة بعد القفل
 */
export interface FinalLockedResults {
  /** السماكة النهائية للاختراق */
  Hp_final: number;
  /** سماكة التشقق النهائية */
  Hc_final: number;
  /** سماكة الأرضية النهائية */
  Hf_final: number;
  /** سماكة الجدار الخرساني النهائية */
  Hvct_final: number;
  /** ضغط اختراق السقف */
  Pp_roof: number;
  /** ضغط اختراق الجدار */
  Pp_wall: number;
  /** الضغط الأقصى على السقف */
  Pmax_roof: number;
  /** الضغط الأقصى على الجدار */
  Pmax_wall: number;
  /** الضغط المكافئ على السقف */
  P_ekv_roof: number;
  /** الضغط المكافئ على الجدار */
  P_ekv_wall: number;
  /** سماكة النفق */
  ht: number;
  /** عرض النفق */
  Bt: number;
  /** عمق مركز الانفجار */
  Hpc: number;
  /** عمق الاختراق */
  h_pr: number;
  /** التردد الدائري للسقف */
  omega_roof: number;
  /** التردد الدائري للجدار */
  omega_wall: number;
  /** الزمن الفعال للسقف */
  tau_ef_roof: number;
  /** الزمن الفعال للجدار */
  tau_ef_wall: number;
  /** العزم البلاستيكي للسقف */
  Mp_roof: number;
  /** العزم البلاستيكي للجدار */
  Mp_wall: number;
  /** الشحنة الفعالة */
  C_ef: number;
  /** البعد الفعلي */
  R_actual: number;
  /** البعد المختزل */
  Zp: number;
  /** معامل تأثير شكل الرأس */
  lambda1: number;
  /** معامل تأثير القطر */
  lambda2: number;
}

// ─── 10. نتيجة أنبوب المعالجة الكامل (Pipeline Result) ──────────────

/**
 * نتيجة أنبوب المعالجة الكامل — تجمّع كل نتائج الخطوات
 * هذا هو النوع الرئيسي الذي تعيده المحرك
 */
export interface PipelineResult {
  /** مدخلات الخطوة 2 */
  step2_inputs: Record<string, number>;
  /** استيفاءات الخطوة 2 */
  step2_lookups: Record<string, number>;
  /** هندسة الخطوة 2 */
  step2_geometry: Record<string, number>;
  /** نتيجة خطوة الاختراق (الخطوة 3) */
  step3_penetration: PenetrationStepResult;
  /** نتيجة خطوة القفل الأولي (الخطوة 4) */
  step4_locked: StepResult;
  /** نتيجة حساب حمل السقف (الخطوة 5 — مسار السقف) */
  step5_roof: BlastLoadStepResult;
  /** نتيجة حساب حمل الجدار (الخطوة 5 — مسار الجدار) */
  step5_wall: BlastLoadStepResult;
  /** معاملات الجدول ب للسقف (الخطوة 6 — مسار السقف) */
  step6_roof: StepResult<BTableCoefficients>;
  /** معاملات الجدول ب للجدار (الخطوة 6 — مسار الجدار) */
  step6_wall: StepResult<BTableCoefficients>;
  /** نتيجة تصميم سماكة السقف (الخطوة 7) */
  step7_ceiling: StepResult<MomentThicknessResult>;
  /** نتيجة تصميم الجدار النهائي (الخطوة 8) */
  step8_wall: StepResult;
  /** النتائج المقفلة النهائية */
  finalLocked: FinalLockedResults;
  /** الحالة العامة للأنبوب */
  overallStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  /** قائمة التحذيرات */
  warnings: string[];
}

// ─── 11. سجل القيم المقفلة (Locked Value Registry) ───────────────────

/**
 * سجل القيم المقفلة — يضمن عدم الكتابة فوق القيم المقفلة
 * كل قيمة مقفلة لها خطوة منشئة وخطوات مستهلكة
 */
export interface LockedValueEntry {
  /** مفتاح المتغير */
  key: string;
  /** القيمة المقفلة */
  value: number;
  /** الخطوة التي أنتجت القيمة */
  producedByStep: EngineStep;
  /** الخطوات التي تستهلك القيمة */
  consumedBySteps: EngineStep[];
  /** مسار الحمل (سقف / جدار / مشترك) */
  path: BlastLoadPath | 'shared';
  /** التسامح الأقصى المسموح (كسبة مئوية) */
  tolerance: number;
}

// ─── 12. حدود المحرك (Engine Boundary) ───────────────────────────────

/**
 * حدود المحرك — تحدد ما ينتقل بين المحركات الفرعية
 * يضمن عدم وجود تبعيات مخفية بين المحركات
 */
export interface EngineBoundary {
  /** المفاتيح المقفلة المنتقلة من الاختراق إلى الحمل الانفجاري */
  penetrationToBlast: string[];
  /** المفاتيح المقفلة المنتقلة من الحمل الانفجاري إلى التصميم الإنشائي */
  blastToStructural: string[];
  /** المفاتيح المقفلة ضمن الحمل الانفجاري (مسار السقف) */
  withinBlastRoof: string[];
  /** المفاتيح المقفلة ضمن الحمل الانفجاري (مسار الجدار) */
  withinBlastWall: string[];
}

// ─── 13. انحراف القيم (Value Deviation) ────────────────────────────────

/**
 * انحراف القيمة المحسوبة عن القيمة المرجعية المقفلة
 * يُستخدم في تقارير التدقيق والمطابقة
 */
export interface ValueDeviation {
  /** مفتاح المتغير */
  key: string;
  /** القيمة المرجعية المقفلة */
  value: number;
  /** القيمة المحسوبة الحالية */
  currentComputed?: number;
  /** نسبة الانحراف بالمئة */
  deviationPct?: number;
  /** حالة الانحراف */
  status: 'OK' | 'DEVIATED' | 'FAIL' | 'MISSING';
}

// ─── 14. تعريف المتغير للنموذج الموحد (Variable Definition) ─────────

/**
 * تعريف متغير كامل في النموذج الموحد
 * يحدد كل ما يلزم لعرض المتغير وحسابه وتتبعه
 */
export interface VariableDefinition {
  /** اسم المتغير */
  name: string;
  /** الرمز الرياضي */
  symbol: string;
  /** الوصف بالعربية */
  descriptionAr: string;
  /** الوصف بالإنجليزية */
  descriptionEn: string;
  /** الوحدة (مثل m, MPa, kg, ms) */
  unit: string;
  /** المصدر (مثل 'user', 'table-B-1', 'formula') */
  source: string;
  /** تصنيف المتغير */
  category: VariableCategory;
  /** قائمة المتغيرات التي يعتمد عليها */
  dependsOn: string[];
  /** هل المتغير مقفل */
  locked: boolean;
  /** رقم الخطوة */
  step: EngineStep;
  /** مسار الحمل */
  path: BlastLoadPath | 'shared';
  /** الصيغة الرياضية (اختياري) */
  formula?: string;
}
