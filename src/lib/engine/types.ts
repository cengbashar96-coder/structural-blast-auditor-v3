// ═══════════════════════════════════════════════════════════════════════
// الأنواع الموحدة — مصدر الحقيقة الوحيد (Single Source of Truth)
// منصة المدقق الديناميكي الموحد V3.0
// هذا الملف هو العقد الذي يمنع أي تضارب بين المحرك والواجهة والاختبارات
// ═══════════════════════════════════════════════════════════════════════

// ─── 1. الأنواع الحصرية (Enums / Unions) ────────────────────────────

/** نوع المقطع الهندسي */
export type GeometryType = 'RECTANGULAR' | 'CIRCULAR' | 'ARCHED';

/**
 * رموز أنواع التربة — تربط بين Benchmarks وجداول الاستيفاء
 * كل رمز يربط بمعاملات اختراق محددة في SOIL_TABLE (baselineConstants)
 *
 * SOFT_SOIL       → water_saturated_clay (طين رطب مشبع) — Kpr=1.30e-5
 * MEDIUM_SOIL     → clay_with_stones (طين مع حجارة) — Kpr=6.00e-6
 * HARD_ROCK       → granite_gneiss (جرانيت/نايس) — Kpr=7.00e-7
 * REINFORCED_SAND → sand_with_impurities (رمل مشوب) — Kpr=5.00e-6
 */
export type SoilTypeCode =
  | 'SOFT_SOIL'
  | 'MEDIUM_SOIL'
  | 'HARD_ROCK'
  | 'REINFORCED_SAND'
  | 'CONCRETE'
  | 'REINFORCED_CONCRETE';

/** طريقة التصميم الإنشائي */
export type DesignMethod = 'SYRIAN_WSD_2024' | 'USD_GLOBAL';

/** حالة التحقق النهائية */
export type ValidationStatus = 'SUCCESS' | 'WARNING' | 'FAILURE';

/** كود التصميم المعتمد */
export type DesignCode = 'SYRIAN_CODE_2024' | 'UFC_3-340-02' | 'BOTH';

/** نوع المتفجرات */
export type ExplosiveType =
  | 'Tritonal_80_20'
  | 'Mixture_V'
  | 'Torpex_H6'
  | 'Tritonal_90_40'
  | 'Ednaloud'
  | 'TNT';

// ─── 2. بيانات الأسلحة (Weapon Data) ────────────────────────────────

/**
 * قاعدة بيانات السلاح — تشمل القنابل الأمريكية (MK/AN-M) والروسية (FAB)
 *
 * الحقول الاختيارية (noseRatio, fillerRatio) تُستخدم عند كتابة
 * محرك الاختراق الكامل (penetration-core) لاحقاً
 */
export interface WeaponData {
  /** المعرف الفريد — يُستخدم كمرجع في Benchmarks والمحرك */
  id: string;
  /** الاسم الشائع بالإنجليزية */
  name: string;
  /** الاسم بالعربية */
  nameAr: string;
  /** الوزن الكامل بالكيلوغرام */
  weightKg: number;
  /** القطر بالأمتار */
  diameterMeters: number;
  /** نسبة الطول للقطر (L/D) */
  ldRatio: number;
  /** نسبة طول الرأس للقطر (Lh/D) */
  lhdRatio: number;
  /** وزن الشحنة المتفجرة بالكيلوغرام */
  chargeKg: number;
  /** نوع المتفجرات */
  explosive: ExplosiveType;
  /** الطول الكلي بالأمتار */
  lengthMeters?: number;
  /** طول الجسم بالأمتار */
  bodyLengthMeters?: number;
  /** معامل شكل الرأس الحربي (اختياري — يُحسب من lhdRatio) */
  noseRatio?: number;
  /** نسبة الملء (charge/weight) */
  fillerRatio?: number;
  /** الأصل: أمريكي أو روسي */
  origin?: 'US' | 'RU' | 'OTHER';
}

// ─── 3. معاملات التربة (Soil Coefficients) ──────────────────────────

/**
 * معاملات اختراق التربة — مرتبطة بـ SoilTypeCode
 * الحقول الاختيارية destructionCoeff / crackingCoeff تُستخدم
 * عند فحص spalling والفشل الهش
 */
export interface SoilCoefficients {
  /** الرمز الحاكم — يربط بـ SoilTypeCode */
  code: SoilTypeCode;
  /** الاسم المرجعي بالإنجليزية (يطابق SOIL_TABLE.name) */
  referenceName: string;
  /** الاسم بالعربية */
  nameAr: string;
  /** معامل اختراق التربة */
  kp: number;
  /** معامل السرعة */
  kv: number;
  /** الكثافة kg/m³ */
  densityKgM3: number;
  /** معامل تدمير التربة Kp (من جداول الاستيفاء I-1) */
  destructionCoeff?: number;
  /** معامل تشقق التربة Kot (من جداول الاستيفاء I-1) — null يعني غير مطبّق */
  crackingCoeff?: number;
  /** معامل التشقق المعاكس Kot (للتربة التي لها سلوك مختلف بالاتجاه المعاكس) */
  oppositeCrackCoeff?: number | null;
}

// ─── 4. مدخلات ومخرجات الاختراق (Penetration I/O) ──────────────────

/** مدخلات محرك الاختراق */
export interface PenetrationInput {
  /** معرف السلاح — يربط بـ WeaponData.id */
  weaponId: string;
  /** سرعة الاصطدام m/s */
  impactVelocity: number;
  /** نوع التربة — يربط بـ SoilTypeCode */
  soilTypeCode: SoilTypeCode;
  /** زاوية الاصطدام بالدرجات (0 = عمودي) */
  impactAngleDeg?: number;
  /** تأخير التفجير بالمللي ثانية */
  detonationDelayMs?: number;
}

/** مخرجات محرك الاختراق */
export interface PenetrationOutput {
  /** عمق الاختراق x1 بالأمتار */
  penetrationDepth: number;
  /** عمق الحفرة / العمق المكافئ h0 بالأمتار */
  craterDepth: number;
  /** سماكة spalling المطلوبة بالأمتار */
  requiredSpallingThickness: number;
  /** معامل تأثير شكل الرأس lambda1 */
  lambda1: number;
  /** معامل تأثير القطر lambda2 */
  lambda2: number;
  /** أُس التأثير n */
  nExp: number;
  /** الشحنة الفعالة kg */
  cEffective: number;
  /** معامل زاوية الاختراق tsu بالأمتار */
  tsu: number;
  /** العمق المكافئ المختزل h_bar_z */
  hBarZ: number;
  /** شرح تفصيلي للنتائج */
  explanation: string;
  /** رسائل تحذيرية إن وُجدت */
  warningMessages?: string[];
}

// ─── 5. مدخلات ومخرجات الانفجار (Blast I/O) ────────────────────────

/** مدخلات محرك الضغط العصفي */
export interface BlastInput {
  /** وزن TNT المكافئ بالكيلوغرام */
  equivalentTNTWeight: number;
  /** البعد الشعاعي عن مركز الانفجار بالأمتار */
  radialDistance: number;
  /** نوع التربة لحسابات الموجة (اختياري) */
  soilTypeCode?: SoilTypeCode;
  /** عمق السقف فوق مركز الانفجار بالأمتار */
  ceilingDepth?: number;
}

/** مخرجات محرك الضغط العصفي */
export interface BlastOutput {
  /** البعد المختزل Z (m/kg^1/3) */
  scaledDistanceZ: number;
  /** الضغط الجانبي Pso بـ MPa */
  pSideOnMpa: number;
  /** الضغط المنعكس Pr بـ MPa */
  pReflectedMpa: number;
  /** مدة الطور الموجب T0 بالمللي ثانية */
  durationMs: number;
  /** الضغط التصميمي P_design بـ MPa */
  pDesignMpa: number;
  /** الضغط التصميمي بـ kPa (للتصميم الإنشائي) */
  pDesignKPa: number;
  /** الإجهاد الأقصى في التربة sigma_max بـ MPa */
  sigmaMaxMpa: number;
  /** زمن الطور الموجب بالثواني */
  tauPlus: number;
  /** الزمن الفعال بالثواني */
  tauEffective: number;
  /** البعد الحرج R_critical بالأمتار */
  rCritical: number;
  /** شرط الديناميكية مُحقق أم لا */
  dynamicConditionMet: boolean;
  /** شرط نواة المقطع مُحقق أم لا */
  coreConditionMet: boolean;
}

// ─── 6. مدخلات ومخرجات التصميم الإنشائي (Design I/O) ──────────────

/** مدخلات محرك التصميم الإنشائي */
export interface DesignInput {
  /** الضغط التصميمي بـ MPa — يُسحب من BlastOutput */
  pDesignMpa: number;
  /** نوع المقطع الهندسي */
  geometryType: GeometryType;
  /** بحر النفق القصير (ap) بالأمتار */
  tunnelSpanShort: number;
  /** بحر النفق الطويل (bp) بالأمتار */
  tunnelSpanLong: number;
  /** مقاومة ضغط الخرسانة f_c بـ MPa */
  fcMpa: number;
  /** إجهاد خضوع الحديد f_y بـ MPa */
  fyMpa: number;
  /** سماكة البلاطة المقترحة بالملم (اختياري) */
  slabThicknessHintMm?: number;
  /** نسبة التسليح (اختياري — القيمة الافتراضية من الكود) */
  reinforcementRatio?: number;
}

/** تقرير التحقق الإنشائي */
export interface ValidationReport {
  /** حالة التحقق النهائية */
  status: ValidationStatus;
  /** نسبة اللامركزية e/h */
  eccentricityRatio: number;
  /** نسبة إجهاد القص الثاقب الفعلي/المسموح */
  punchingShearRatio: number;
  /** نسبة التسليح الفعلية */
  reinforcementRatio: number;
  /** قائمة الإخفاقات التفصيلية */
  failures: string[];
  /** شرح تفصيلي لقرار التحقق */
  explanation: string;
  /** معرف القاعدة الحاكمة (مثل SYR-8.3.1 أو UFC-F-8.3.2) */
  ruleId?: string;
}

/** نتيجة تصميم المقطع */
export interface SectionDesignResult {
  /** السماكة المطلوبة بالأمتار */
  requiredThicknessMeters: number;
  /** مساحة التسليح المطلوبة بـ cm²/m */
  requiredSteelAreaCm2PerMeter: number;
  /** نسبة المطاوعة (Ductility Ratio) */
  ductilityRatio: number;
  /** تقرير التحقق */
  validation: ValidationReport;
}

// ─── 7. مقارنة المقاطع الهندسية (Geometry Comparison) ──────────────

/** نتيجة المقارنة لمقطع واحد */
export interface GeometryComparisonEntry {
  /** السماكة المطلوبة بالأمتار */
  thicknessMeters: number;
  /** وزن الحديد بالطن */
  steelWeightTon: number;
  /** حجم الخرسانة بـ m³ */
  concreteVolumeM3: number;
  /** العزم الديناميكي الأقصى بـ kN.m */
  maxDynamicMomentKnM: number;
  /** حالة الأمان */
  safetyStatus: ValidationStatus;
}

/** تقرير مقارنة المقاطع الهندسية */
export interface GeometryComparisonReport {
  /** المقطع المُوصى به */
  recommendedGeometry: GeometryType;
  /** شرح التوصية */
  explanation: string;
  /** مصفوفة المقارنة لكل نوع مقطع */
  comparisonMatrix: Record<GeometryType, GeometryComparisonEntry>;
}

// ─── 8. نظام الـ Benchmarks (Regression Tests) ──────────────────────

/** قيمة مرجعية متوقعة — رقم مع وحدة وتسامح */
export interface ExpectedValue {
  /** الرمز الرياضي (مثل x1, h0, Pso) */
  symbol: string;
  /** الوحدة (مثل m, MPa, ms) */
  unit: string;
  /** القيمة المتوقعة من Excel */
  expectedValue: number;
  /** التسامح المسموح (نسبة مئوية، مثل 0.02 = 2%) */
  tolerance: number;
  /** وصف مختصر */
  description: string;
}

/** حالة Benchmark كاملة */
export interface BenchmarkCase {
  /** المعرف الفريد — يُستخدم في CI/CD والتقارير */
  id: string;
  /** العنوان الوصفي */
  title: string;
  /** وصف الهدف من الحالة */
  objective: string;

  // ─── المدخلات (inputSpec) ───
  inputSpec: {
    weaponId: string;
    impactVelocity: number;      // m/s
    soilTypeCode: SoilTypeCode;
    impactAngleDeg?: number;
    ceilingDepthMeters?: number;
    tunnelSpanShortMeters?: number;
    tunnelSpanLongMeters?: number;
    fcMpa?: number;
    fyMpa?: number;
  };

  // ─── المرجع (referenceSpec) ───
  referenceSpec: {
    weaponName: string;
    soilNameAr: string;
    soilReferenceName: string;   // يطابق SOIL_TABLE.name
    designCode: DesignCode;
    excelSource: string;
  };

  // ─── القيم الوسيطة المتوقعة (expectedIntermediateValues) ───
  expectedIntermediateValues: ExpectedValue[];

  // ─── القيم النهائية المتوقعة (expectedFinalValues) ───
  expectedFinalValues: ExpectedValue[];

  // ─── القرار المتوقع (expectedFinalDecision) ───
  expectedFinalDecision: {
    validationStatus: ValidationStatus;
    expectedFailures: string[];
    expectedWarnings: string[];
  };

  // ─── ملاحظات المحرك (engineNotes) ───
  engineNotes: string;

  // ─── بيانات وصفية ───
  /** الأولوية: 1 = حرج، 2 = مهم، 3 = عادي */
  priority: 1 | 2 | 3;
  /** هل الحالة مُقفلة (لا يمكن تعديلها بدون مراجعة) */
  isLocked: boolean;
  /** تاريخ آخر تحديث */
  lastUpdated: string;
}

// ─── 9. أنواع مساعدة ────────────────────────────────────────────────

/** نتيجة مقارنة قيمة محسوبة مع قيمة مرجعية */
export interface BenchmarkResult {
  benchmarkId: string;
  symbol: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;          // الانحراف المطلق
  deviationPercent: number;   // الانحراف كنسبة مئوية
  passed: boolean;
}

/** تقرير تشغيل Benchmark كامل */
export interface BenchmarkRunReport {
  benchmarkId: string;
  timestamp: number;
  results: BenchmarkResult[];
  overallPassed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    maxDeviationPercent: number;
  };
}

// ─── 10. تعيين رموز التربة لأسماء SOIL_TABLE ────────────────────────

/**
 * تعيين SoilTypeCode → اسم مرجعي في SOIL_TABLE (baselineConstants)
 * هذا التعيين يضمن عدم وجود تضارب بين Benchmarks وجداول الاستيفاء
 */
export const SOIL_CODE_TO_REFERENCE_NAME: Record<SoilTypeCode, string> = {
  SOFT_SOIL: 'water_saturated_clay',
  MEDIUM_SOIL: 'clay_with_stones',
  HARD_ROCK: 'granite_gneiss',
  REINFORCED_SAND: 'sand_with_impurities',
  CONCRETE: 'plain_concrete_225',
  REINFORCED_CONCRETE: 'rc_concrete_250_300',
} as const;

/**
 * تعيين SoilTypeCode → الاسم العربي
 */
export const SOIL_CODE_TO_AR: Record<SoilTypeCode, string> = {
  SOFT_SOIL: 'طين رطب مشبع (غضارية طينية لينة)',
  MEDIUM_SOIL: 'طين مع حجارة (رملية حصوية متوسطة)',
  HARD_ROCK: 'جرانيت/نايس (صخرية شديدة القساوة)',
  REINFORCED_SAND: 'رمل مشوب (رملية محسّنة)',
  CONCRETE: 'بيتون عادي 225 كغ/سم²',
  REINFORCED_CONCRETE: 'بيتون مسلح 250-300 كغ/سم²',
} as const;
