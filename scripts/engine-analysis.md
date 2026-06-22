# تحليل شامل لمحرك الحسابات — منصة المدقق الديناميكي الموحد V3.0

**Comprehensive Engine Analysis — Unified Dynamic Auditor Platform V3.0**

**تاريخ التحليل:** جلسة فحص دفعة واحدة  
**النطاق:** `/home/z/my-project/src/lib/engine/` + `/home/z/my-project/src/lib/structural/` + `/home/z/my-project/src/lib/constants/reference-data.ts`  
**الهدف:** توثيق كل ملف وكل معادلة وكل ثابت لتمكين التدقيق والتحقق من كل حساب.

---

## TABLE OF CONTENTS

1. [نظرة عامة على العمارة (Architecture Overview)](#1-نظرة-عامة-على-العمارة)
2. [ملف الأنواع types.ts — مصدر الحقيقة الموحد](#2-ملف-الأنواع-typests)
3. [ملف المنسّق orchestrator.ts — خط الأنابيب الرئيسي](#3-ملف-المنسق-orchestratorts)
4. [محرك الاختراق penetration-core.ts (Eq. 13-19)](#4-محرك-الاختراق-penetration-corets)
5. [محرك الضغط العصفي blast-pressure-core.ts (Eq. 1-12)](#5-محرك-الضغط-العصفي-blast-pressure-corets)
6. [محرك الحمل الانفجاري blast-loads.ts — الخطوة 5 (سقف + جدار)](#6-محرك-الحمل-الانفجاري-blast-loadsts)
7. [محرك التصميم الإنشائي structural.ts — الخطوتان 7 و 8](#7-محرك-التصميم-الإنشائي-structuraltss)
8. [محرك الخرسانة structural-concrete-core.ts](#8-محرك-الخرسانة-structural-concrete-corets)
9. [محرك التسليح rebar.ts](#9-محرك-التسليح-reparts)
10. [محرك المفاضلة geometry-comparator.ts](#10-محرك-المفاضلة-geometry-comparatorts)
11. [محرك التحقق validators.ts](#11-محرك-التحقق-validatorsts)
12. [مكتبة الأسلحة weapons-library.ts](#12-مكتبة-الأسلحة-weapons-libraryts)
13. [ثوابت الانفجار constants/blast-coefficients.ts](#13-ثوابت-الانفجار-constantsblast-coefficientsts)
14. [الحالة المرجعية constants/reference-case-bmk02.ts](#14-الحالة-المرجعية-constantsreference-case-bmk02ts)
15. [النموذج الموحد constants/unified-variable-model.ts](#15-النموذج-الموحد-constantsunified-variable-modelts)
16. [الملفات الداعمة reference-data.ts و JSON](#16-الملفات-الداعمة)
17. [الطبقة الإنشائية القديمة /lib/structural/](#17-الطبقة-الإنشائية-القديمة-libstructural)
18. [خط أنابيب المنسّق الكامل (End-to-End Pipeline)](#18-خط-أنابيب-المنسق-الكامل)
19. [نظام الـ Benchmarks (BMK-01, BMK-02, BMK-03)](#19-نظام-ال-benchmarks)
20. [ملاحظات تدقيقية وأخطاء محتملة](#20-ملاحظات-تدقيقية)

---

## 1. نظرة عامة على العمارة

### 1.1 الوصف العام

منصة **المدقق الديناميكي الموحد V3.0** هي حزمة حسابات هندسية لحماية المنشآت من الانفجارات (خصوصاً القنابل). تتبع المنصة نهج "محرك واحد لكل خطوة" مع منسّق (orchestrator) يربط المحركات ببعضها بدون أن يحتوي على أي منطق حسابي داخلي.

### 1.2 المحركات الأساسية الأربعة

| # | الملف | الخطوة | الوظيفة |
|---|------|--------|---------|
| 1 | `penetration-core.ts` | 3 | حساب عمق الاختراق + الشحنة الفعالة + البعد المختزل |
| 2 | `blast-pressure-core.ts` | 5 | حساب الضغط العصفي بمعادلات سادوفسكي (نسخة مبسطة) |
| 3 | `structural-concrete-core.ts` | 7-8 | تصميم المقطع الخرساني + فحص القص الثاقب + اللامركزية |
| 4 | `geometry-comparator.ts` | 9 | المفاضلة بين RECTANGULAR / CIRCULAR / ARCHED |

### 1.3 المحركات الثانوية

| الملف | الخطوة | الوظيفة |
|------|--------|---------|
| `blast-loads.ts` | 5 (مسار السقف + الجدار) | نسخة موسعة من محرك الضغط مع 10 خطوات تحقق من BMK-02 |
| `structural.ts` | 7-8 | نسخة موسعة من محرك التصميم تعتمد على reference-data |
| `rebar.ts` | 9 | تصميم التسليح التفصيلي (اختيار الأقطار والأعداد) |
| `validators.ts` | 0 | تحقق Zod + تحذيرات |
| `weapons-library.ts` | — | بنك الأسلحة (US + RU FAB) |
| `orchestrator.ts` | 0-9 | المنسّق العام بدون منطق حسابي |

### 1.4 الأكواد والمعايير الحاكمة

- **الكود السوري 2024 (WSD)** — للقص الثاقب ونسبة التسليح الدنيا والغطاء الخرساني
- **UFC 3-340-02** — لمعاملات تضخيم المواد الديناميكية (DIF)
- **معادلات سادوفسكي** — للضغط العصفي وزمن الطور الموجب
- **الأطروحة العلمية المرجعية** — لمعادلات الاختراق (Eq. 13-19) والضغط (Eq. 1-12)

### 1.5 فلسفة القيم المقفلة (Locked Variables)

المنصة تطبّق مبدأ صارماً: المتغيرات التي يُنتجها محرك ويستهلكها المحرك التالي تُعامل كـ **read-only**. كل محرك يستدعي `assertLockedNotOverwritten()` لتأكيد أن حساباته لا تنحرف عن المرجع الذهبي BMK-02 بأكثر من 5%.

---

## 2. ملف الأنواع types.ts

**الوظيفة:** مصدر الحقيقة الموحد (Single Source of Truth) لكل الأنواع المستخدمة عبر المحرك والواجهة والاختبارات.

### 2.1 الأنواع الحصرية (Union Types)

| النوع | القيم المسموحة | الوصف |
|------|-----------------|------|
| `GeometryType` | `'RECTANGULAR' \| 'CIRCULAR' \| 'ARCHED'` | شكل المقطع الهندسي |
| `SoilTypeCode` | `'SOFT_SOIL' \| 'MEDIUM_SOIL' \| 'HARD_ROCK' \| 'REINFORCED_SAND' \| 'CONCRETE' \| 'REINFORCED_CONCRETE'` | رمز نوع التربة |
| `DesignMethod` | `'SYRIAN_WSD_2024' \| 'USD_GLOBAL'` | طريقة التصميم |
| `ValidationStatus` | `'SUCCESS' \| 'WARNING' \| 'FAILURE'` | حالة التحقق النهائية |
| `DesignCode` | `'SYRIAN_CODE_2024' \| 'UFC_3-340-02' \| 'BOTH'` | الكود المعتمد |
| `ExplosiveType` | `'Tritonal_80_20' \| 'Mixture_V' \| 'Torpex_H6' \| 'Tritonal_90_40' \| 'Ednaloud' \| 'TNT'` | نوع المتفجر |

### 2.2 واجهة السلاح `WeaponData`

| الحقل | النوع | الوحدة | الوصف |
|------|------|------|------|
| `id` | string | — | معرف فريد (مثل `'W_MK83'`, `'W_FAB_250'`) |
| `weightKg` | number | kg | الوزن الكامل |
| `diameterMeters` | number | m | القطر |
| `ldRatio` | number | — | نسبة الطول للقطر |
| `lhdRatio` | number | — | نسبة طول الرأس للقطر |
| `chargeKg` | number | kg | وزن الشحنة المتفجرة |
| `lengthMeters` | number | m | الطول الكلي |
| `bodyLengthMeters` | number | m | طول الجسم |

### 2.3 واجهة التربة `SoilCoefficients`

| الحقل | الوحدة | الوصف |
|------|------|------|
| `kp` | — | معامل اختراق التربة |
| `kv` | — | معامل السرعة |
| `densityKgM3` | kg/m³ | الكثافة |
| `destructionCoeff` | — | معامل التدمير (I-1) |
| `crackingCoeff` | — | معامل التشقق (I-1) |

### 2.4 مخطط المدخلات/المخرجات الرئيسية

```
PenetrationInput  → calculatePenetration  → PenetrationOutput
BlastInput        → calculateBlastPressure → BlastOutput
DesignInput       → designConcreteSection  → SectionDesignResult
```

### 2.5 خرائط ربط التربة

`SOIL_CODE_TO_REFERENCE_NAME` و `SOIL_CODE_TO_AR` تربط كل `SoilTypeCode` باسم مرجعي في `SOIL_TABLE` (مثل `'SOFT_SOIL' → 'water_saturated_clay'`). هذا يضمن عدم وجود تضارب بين Benchmarks وجداول الاستيفاء.

---

## 3. ملف المنسّق orchestrator.ts

**الوظيفة:** تنسيق المحركات الأربعة بتسلسل صحيح بدون منطق حسابي داخلي.

### 3.1 الواجهة الموحدة

```typescript
interface EngineInput {
  penetration: PenetrationInput;
  blast: { radialDistance: number; ceilingDepth?: number };
  design: {
    tunnelSpanShort: number;
    tunnelSpanLong: number;
    fcMpa: number;
    fyMpa: number;
    slabThicknessHintMm?: number;
    reinforcementRatio?: number;
  };
}

interface EngineOutput {
  inputs: EngineInput;
  intermediates: { penetration: PenetrationOutput; blast: BlastOutput };
  structural: Record<GeometryType, SectionDesignResult>;
  comparison: GeometryComparisonReport;
  warnings: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  validationErrors: ValidationResult[];
}
```

### 3.2 خط الأنابيب (5 مراحل)

```
1. validateInput(PenetrationInputSchema)       ← تحقق مدخلات الاختراق
2. calculatePenetration(input.penetration)      ← محرك الاختراق
3. C_effective = 0.95 * K1 * weapon.chargeKg   ← الشحنة الفعالة (ملاحظة: مكررة)
   calculateBlastPressure(...)                  ← محرك الضغط العصفي
4. for geo in [RECTANGULAR, CIRCULAR, ARCHED]:  ← محرك التصميم (3 مرات)
     designConcreteSection(designInput)
5. compareGeometries(structural)                ← محرك المفاضلة
```

### 3.3 ملاحظة تدقيقية مهمة

في السطر 122:
```typescript
const C_effective = 0.95 * K1 * weapon.chargeKg;
```

هذا الحساب **مكرر** لما يفعله `calcCEffective` داخل `penetration-core.ts`، لكن النتيجة تُمرّر مباشرة إلى `calculateBlastPressure` بدون استخدام `penetration.cEffective` من مخرجات الاختراق. هذا قد يُسبب تضارباً إذا تغيرت معادلة الشحنة الفعالة في مكان واحد فقط.

### 3.4 حالات الفشل

إذا فشل أي محرك، يُسجَّل التحذير وتُملأ النتائج بأصفار، مع تخفيض `status` إلى `PARTIAL` أو `FAILED`. هذا يضمن استمرار بقية المحركات.

---

## 4. محرك الاختراق penetration-core.ts

**الوظيفة:** حساب عمق اختراق القنبلة في التربة + الشحنة الفعالة + العمق المكافئ المختزل.  
**المرجع:** الأطروحة العلمية — المعادلات 13-19.

### 4.1 المعادلات المستقلة (Pure Functions)

#### المعادلة (14): معامل تأثير شكل الرأس الحربي

```
λ₁ = 0.5 + 0.4 × (Lh/D)^(2/3)
```

- **Lh/D** = نسبة طول الرأس الحربي إلى القطر (dimensionless)
- **الناتج:** dimensionless
- **التطبيق:** `calcLambda1(lhdRatio: number)`

```typescript
return 0.5 + 0.4 * Math.pow(lhdRatio, 0.666);
```

#### المعادلة (15): معامل تأثير القطر

```
λ₂ = 2.8 × d^(1/3) − 1.3 × d^(1/2)
```

- **d** = قطر القنبلة (m)
- **الناتج:** dimensionless

```typescript
return 2.8 * Math.pow(d, 0.333) - 1.3 * Math.pow(d, 0.5);
```

#### المعادلة (16): أُس التأثير

```
n = 3.5 − (Lh/D)
```

- **الناتج:** dimensionless

#### المعادلة (19): الشحنة الفعالة

```
C_eff = 0.95 × K₁ × C
```

- **K₁** = معامل المادة المتفجرة (من جدول I-5)
- **C** = وزن الشحنة (kg)
- **الناتج:** kg

قيم K₁ المرجعية:

| المتفجر | K₁ |
|--------|-----|
| Tritonal 80-20 | 1.639 |
| Mixture V | 1.340 |
| Torpex H6 | 1.260 |
| Tritonal 90/40 | 1.230 |
| Ednaloud | 1.050 |
| TNT | 1.000 |

#### المعادلة (17): معامل زاوية الاختراق — قنبلة خارقة

```
τ = 0.5 × lₖ × cos((α + n×α) / 2)
```

- **lₖ** = طول جسم القنبلة (m)
- **α** = زاوية الاصطدام (درجات)
- **n** = أُس التأثير (من المعادلة 16)
- **الناتج:** m

ملاحظة: الكود يطبّق `Math.cos(((angleDeg + nExp * angleDeg) / 2) * Math.PI / 180)` مما يعني أن الزاوية الكلية = `α × (1 + n)`، ثم تُقسم على 2.

#### المعادلة (18): معامل زاوية الاختراق — قنبلة انفجارية

```
τ = 0.5 × dₖ
```

#### المعادلة (13): عمق الاختراق في التربة

```
x₁ = λ₁ × λ₂ × Kpr × (P / d²) × V × cos(α)
```

- **λ₁, λ₂** = معاملا الشكل والقطر (dimensionless)
- **Kpr** = معامل اختراق التربة (من جدول I-1)
- **P** = وزن القنبلة (kg)
- **d** = القطر (m)
- **V** = سرعة الاصطدام (m/s)
- **α** = زاوية الاصطدام (rad)
- **الناتج:** m

### 4.2 خط الحساب الكامل `calculatePenetration(input)`

```
1. weapon = getWeaponById(input.weaponId)
2. soil = getSoilByCode(input.soilTypeCode)
3. K1 = getExplosiveK1(weapon.explosive)
4. angleDeg = input.impactAngleDeg ?? 0
5. lambda1 = calcLambda1(weapon.lhdRatio)
6. lambda2 = calcLambda2(weapon.diameterMeters)
7. nExp = calcN(weapon.lhdRatio)
8. cEffective = calcCEffective(K1, weapon.chargeKg)
9. isPenetrating = weapon.lhdRatio > 1.5
10. tsu = isPenetrating ? calcTsuPenetrating(...) : calcTsuExplosive(...)
11. penetrationDepth = calcPenetrationDepth(...)
12. hz = max(penetrationDepth - tsu, 0)        // العمق الصافي
13. craterDepth = hz × 1.18                    // معامل مرجعي 1.18
14. hBarZ = hz / cbrt(cEffective)              // العمق المكافئ المختزل
15. requiredSpallingThickness = penetrationDepth × 0.65
```

### 4.3 معاملات التربة (Kpr) من SOIL_TABLE

| referenceName | nameAr | Kpr |
|--------------|--------|-----|
| water_saturated_clay | طين رطب مشبع | 1.30e-5 |
| medium_clay | طين متوسط | 7.00e-6 |
| clay_with_stones | طين مع حجارة | 6.00e-6 |
| sand_with_impurities | رمل مشوب | 5.00e-6 |
| pure_sand_limestone | رمل نقي/جيري | 4.50e-6 |
| stone_paving | بلاط حجري | 3.00e-6 |
| cemented_stone | بلاط مأسّد | 2.50e-6 |
| granite_gneiss | جرانيت/نايس | 7.00e-7 |
| limestone_rock | صخر كلسي | 1.50e-6 |
| plain_concrete_170 | خرسانة عادية 170 | 1.20e-6 |
| plain_concrete_225 | خرسانة عادية 225 | 1.00e-6 |
| rc_concrete_200 | خرسانة مسلحة 200 | 8.00e-7 |
| rc_concrete_250_300 | خرسانة مسلحة 250-300 | 7.00e-7 |

### 4.4 التحذيرات

| الرمز | الشرط | المعنى |
|------|------|------|
| ERR-PEN-01 | penetrationDepth ≤ 0 | عمق الاختراق سالب أو صفر |
| WARN-PEN-01 | hz ≤ 0 | القنبلة لم تخترق السقف |
| WARN-PEN-02 | hBarZ < 0.7 | معامل الإجهاد يُخفَّض × 0.6 |
| WARN-PEN-03 | impactVelocity > 400 | سرعة عالية — تحقق من المعادلة |

### 4.5 المخرجات `PenetrationOutput`

| الحقل | الوحدة | الوصف |
|------|------|------|
| `penetrationDepth` | m | عمق الاختراق x₁ |
| `craterDepth` | m | عمق الحفرة = hz × 1.18 |
| `requiredSpallingThickness` | m | = penetrationDepth × 0.65 |
| `lambda1` | — | معامل شكل الرأس |
| `lambda2` | — | معامل القطر |
| `nExp` | — | أُس التأثير |
| `cEffective` | kg | الشحنة الفعالة |
| `tsu` | m | معامل زاوية الاختراق |
| `hBarZ` | — | العمق المكافئ المختزل |

---

## 5. محرك الضغط العصفي blast-pressure-core.ts

**الوظيفة:** حساب الضغط العصفي بمعادلات سادوفسكي + الإجهاد في التربة + ضغط التصميم.  
**المرجع:** الأطروحة العلمية — المعادلات 1-12.

### 5.1 المعادلة (1): الضغط الزائد الساقط — سادوفسكي

```
ΔP = 0.1 × ∛C / R + 0.43 × ∛C² / R² + 1.4 × C / R³
```

- **C** = وزن TNT المكافئ (kg)
- **R** = البعد الشعاعي (m)
- **الناتج:** MPa

```typescript
const cbrtC = Math.cbrt(C);
const cbrtC2 = Math.cbrt(C * C);
return 0.1 * cbrtC / R + 0.43 * cbrtC2 / (R * R) + 1.4 * C / (R * R * R);
```

### 5.2 المعادلة (4): زمن الطور الموجب

```
τ⁺ = 1.7 × 10⁻³ × ∛(√C) × √R
```

- **C** = kg, **R** = m
- **الناتج:** s

### 5.3 المعادلة (5): الاندثار (Impulse)

```
I = 6.3 × ∛C² / R
```

### 5.4 المعادلة (8): الزمن الفعال للموجة (دالة الاستيفاء I-9)

```
τ_eff = τ⁺ × f(ΔPmax)

f(ΔPmax) = 0.0008 × ΔPmax² − 0.0384 × ΔPmax + 1.0013
```

- **ΔPmax** = الضغط الأقصى (MPa)
- **الناتج:** s

### 5.5 خط الحساب الكامل `calculateBlastPressure(input)`

```
1. C = equivalentTNTWeight, R = radialDistance
2. cbrtC = ∛C
3. scaledDistanceZ = R / cbrtC                     // البعد المختزل (m/kg^1/3)
4. rCritical = 1.1 × cbrtC                          // البعد الحرج (m)
5. {A, n1} = getStressCoeffForSoil(soilTypeCode)
6. sigmaMaxMpa = A × Z^(-n1)                        // الإجهاد الأقصى في التربة (MPa)
7. pSideOnMpa = calcSadovskyOverpressure(C, R)      // الضغط الجانبي (MPa)
8. Kp = 0.86                                        // معامل النفاذية المرجعي
9. pReflectedMpa = 2 × Kp × max(sigmaMaxMpa, pSideOnMpa)
10. tauPlus = calcPositivePhaseTime(C, R)
11. tauEffective = calcEffectiveTime(tauPlus, sigmaMaxMpa)
12. omega = 100                                     // rad/s — قيمة مرجعية مؤقتة
13. dynamicConditionMet = tauEffective ≥ 0.2 × π / omega
14. Kd = dynamicConditionMet ? 0.9 : 0
15. P_max = pReflectedMpa
16. P_equivalent = Kd × P_max
17. P_static = ceilingDepth × 2000 / 10000 × 0.0980665  // MPa (تحويل kg/m² → MPa)
18. pDesignMpa = P_static + P_equivalent
19. pDesignKPa = pDesignMpa × 1000
```

### 5.6 معاملات الإجهاد (جدول I-3)

| referenceName | nameAr | A | n₁ |
|--------------|--------|---|----|
| loose_sand | رمل مفكوك/مشوب | 2.5 | 3 |
| clay_with_stones | طين مع حجارة | 5 | 3 |
| medium_clay | طين متوسط | 18 | 2.8 |
| sandy_limestone | تربة رملية/جيرية | 4 | 3 |

### 5.7 المخرجات `BlastOutput`

| الحقل | الوحدة | الوصف |
|------|------|------|
| `scaledDistanceZ` | m/kg^(1/3) | Z = R / ∛C |
| `pSideOnMpa` | MPa | الضغط الجانبي (سادوفسكي) |
| `pReflectedMpa` | MPa | الضغط المنعكس = 2 × Kp × σ_max |
| `durationMs` | ms | = τ_eff × 1000 |
| `pDesignMpa` | MPa | = P_static + Kd × P_max |
| `pDesignKPa` | kPa | = pDesignMpa × 1000 |
| `sigmaMaxMpa` | MPa | = A × Z^(-n1) |
| `tauPlus` | s | زمن الطور الموجب |
| `tauEffective` | s | الزمن الفعال |
| `rCritical` | m | = 1.1 × ∛C |
| `dynamicConditionMet` | boolean | τ_eff ≥ 0.2π/ω |
| `coreConditionMet` | boolean | placeholder = true |

### 5.8 ملاحظات تدقيقية

1. **`omega = 100` hardcoded** — السطر 99: قيمة مؤقتة يجب استبدالها بحساب فعلي من بحور النفق وسماكة السقف.
2. **معامل 0.0980665** للتحويل kg/m² → MPa: 1 kg/m² = 0.00980665 kPa = 9.80665e-6 MPa. الكود يضرب بـ 0.0980665 مما يعني أن المعادلة الكاملة هي: `P_static (MPa) = ceilingDepth × 2000 / 10000 × 0.0980665` والتي تبسّط إلى `ceilingDepth × 0.00196133` (أي kg/m² ÷ 10197.16).

---

## 6. محرك الحمل الانفجاري blast-loads.ts

**الوظيفة:** الخطوة 5 الكاملة — مسار السقف ومسار الجدار مع التحقق من BMK-02.  
**المرجع:** ملفات الإكسيل المرجعية + الأطروحة.

### 6.1 واجهة المدخلات `BlastLoadInput`

| الحقل | الوحدة | الوصف |
|------|------|------|
| `path` | `'roof' \| 'wall'` | مسار الحمل |
| `C_ef` | kg | الشحنة الفعالة (من الخطوة 3) |
| `h_pr` | m | عمق الاختراق (من الخطوة 3) |
| `R_actual` | m | البعد الشعاعي الفعلي |
| `Z` | m/kg^(1/3) | البعد المختزل |
| `ap` | m | البحر القصير |
| `bp` | m | البحر الطويل |
| `Hp_cm` | cm | سماكة السقف/الجدار |
| `Ea` | kg/cm² | معامل المرونة |
| `xi` | — | معامل التخميد النسبي |
| `RbH` | kg/cm² | مقاومة الضغط الديناميكية للخرسانة |
| `RsH` | kg/cm² | إجهاد الخضوع الديناميكي للحديد |
| `gamma_b` | kg/m³ | كثافة الخرسانة |
| `gamma_g` | kg/m³ | كثافة التربة |
| `Kpod` | — | معامل التأسيس |
| `R_bar_b1` | — | البعد المختزل B1 |
| `a0z, a1z` | — | معاملات السرعة الديناميكية |
| `Kp` | — | معامل الضغط |
| `Kd` | — | معامل الديناميكية |

### 6.2 المعادلات المستقلة

#### النسبة المختزلة للسماكة

```
h̄ = Hp_cm / (100 × ∛C_ef)
```

#### البعد المكافئ R_ekv

```
R_ekv = R_actual − h_pr × (1 − min(Hp_cm / ht_cm, 1.0))
```

حيث `ht_cm` هو سماكة بلاطة الحماية الكلية (من الخطوة 4).

#### البعد النجمي R*

```
R* = R̄ × ∛C_ef
```

حيث `R̄` = 1.1 (مرجعي للتربة الطينية).

#### زمن الطور الموجب — سادوفسكي

```
τ = 1.7 × 10⁻³ × ∛(√C_ef) × √R_ekv
```

- **C_ef** = kg, **R_ekv** = m
- **الناتج:** s

#### دالة الاستيفاء I-9 للزمن الفعال

```
f(ΔPmax) = 0.0008 × ΔPmax² − 0.0384 × ΔPmax + 1.0013
τ_ef = τ × f(ΔPmax)
```

#### الزمن الطبيعي

```
τ_n = 2π / ω
```

#### التردد الدائري الطبيعي للوحة ببساطة بسيطة

```
ω = (π/L)² × √(Ea × I × g / (γ × A))

حيث:
  I = b × Hp³ / 12     (cm⁴, b=100 cm للمتر الطولي)
  A = b × Hp            (cm²)
  g = 981 cm/s²
  γ (kgf/cm³) = gamma_b × 1e-6
```

ملاحظة: الكود يحتوي على تعليقات تدقيقية عديدة حول صحة التحويلات الوحدوية. الصيغة الفعالة المستخدمة في النهاية هي:

```typescript
const omega_val = (π² / L²) × √((Ea × I) / (massDensity × A))
// حيث massDensity = (gamma_b × 1e-6) / g
```

#### السرعة الديناميكية للموجة

```
C_dyn = a0z + a1z × max_bv
```

#### الضغط الأقصى — سادوفسكي المحسّن

```
ΔP (MPa) = 0.1 × ∛C / R + 0.43 × ∛C² / R² + 1.4 × C / R³

Pmax (kg/cm²) = Kp × ΔP × 10.197
```

(معامل التحويل: 1 MPa ≈ 10.197 kg/cm²)

#### الضغط الأقصى من الإجهاد في التربة

```
σ_max (MPa) = A × Z^(-n1)
Pmax (kg/cm²) = Kpod × σ_max × 10.197 × Kp
```

#### معامل psi

```
kpsi = 0.9  للسقف
kpsi = 0.85 للجدار
```

#### الضغط المكافئ

```
P_ekv = Kd × kpsi × Pmax
```

#### الضغط الثابت (الساكن)

**للسقف:**
```
Pct = γ_g × (Z − Hp_cm/100) / 10000     (kg/cm²)
```

**للجدار:**
```
Pct = γ_g × (Hp_cm/100) × Ka / 10000
```

حيث `Ka = 0.5` (معامل الضغط الأفقي للتربة المتوسطة).

#### ضغط التصميم

```
Pp = P_ekv + Pct
```

#### نسبة المطاوعة الإنشائية

```
mu_struct = (RsH / RbH) × ξ × (1 − 0.5×ξ)
```

حيث `ξ` = معامل التخميد النسبي (من STEP2_GEOMETRY.xi = 0.55).

#### مقاومة القص الديناميكية

```
Rsd = RsH × DIF_steel × n0 = RsH × 1.20 × 1.25 = RsH × 1.5
```

#### مقاومة الانحناء الديناميكية

```
Rbd = RbH × DIF_concrete × n0 / 10 = RbH × 1.25 × 1.25 / 10 = RbH × 0.15625
```

ملاحظة: القسمة على 10 قد تكون لتحويل kg/cm² إلى وحدة أخرى، لكنها غير موثقة بوضوح.

#### نسبة البعد lambda

```
λ = ap / (2 × Hp_cm / 100)
```

### 6.3 معامل الكفاءة eta

`calcEta(R_bar_b1)` يعطي قيمًا مُجزّأة (阶梯) من جدول ب:

| R_bar_b1 | eta |
|----------|------|
| ≤ 0.35 | 1.25 |
| ≤ 0.5 | 1.5 |
| ≤ 0.7 | 1.6 |
| > 0.7 | 1.667 |

(في الكود TODO لتنفيذ الاستيفاء الكامل)

### 6.4 خط الحساب الكامل `calculateBlastLoad(input)` — 10 خطوات

```
1. ht_cm = STEP4_LOCKED.ht
   h_bar = calcHBar(Hp_cm, C_ef)
   R_ekv = calcRekv(R_actual, h_pr, Hp_cm, ht_cm)
   R_star = calcRStar(STEP2_LOOKUPS.R_bar, C_ef)

2. tau = calcTauSadovsky(C_ef, R_ekv)              // سادوفسكي

3. tau_ef = calcTauEf(tau, Pmax_ref)               // f(ΔPmax)

4. L_cm = isRoof ? STEP4_LOCKED.Bt × 100 : ap × 100
   omega = calcOmega(L_cm, Hp_cm, Ea, gamma_b)

5. max_bv = reference.max_bv                        // TODO: اشتقاق كامل
   C_dyn = calcCdyn(a0z, a1z, max_bv)

6. A = (m1 == 1.65) ? 5 : 2.5
   n1 = (m1 == 1.65) ? 3 : 2.8
   Pmax = calcPmaxFromStress(A, n1, Z, Kpod, Kp)

7. kpsi = calcKpsi(path)                            // 0.9 أو 0.85
   P_ekv = calcPekv(Kd, kpsi, Pmax)

8. Pct = calcPct(gamma_g, Z, Hp_cm, path)

9. Pp = P_ekv + Pct

10. R_ekv_gt_R_star = R_ekv > R_star                // شرط القبول
```

### 6.5 التحقق من القيم المقفلة (BMK-02)

في النهاية، يُحسب الانحراف عن المرجع:

```typescript
const computeDeviation = (computed, ref) => |computed - ref| / |ref| × 100
const pickByDeviation = (computed, ref, dev) => dev < 5 ? computed : ref
```

- إذا انحرف الحساب عن المرجع بأقل من 5%: يُستخدم الحساب
- إذا انحرف أكثر: تُستخدم القيمة المرجعية المقفلة + تعليق TODO

هذا يضمن أن النتائج النهائية لا تخرج عن نطاق BMK-02.

### 6.6 القيم المرجعية لـ BMK-02 (MK83 + MEDIUM_SOIL)

#### STEP5_ROOF (مسار السقف)

| الرمز | القيمة | الوحدة |
|------|-------|------|
| h_bar | 0.1180386444 | — |
| R_ekv | 6.1162229173 | m |
| R_star | 2.4255308549 | m |
| max_bv | 2.8802590566 | m/s |
| tau | 0.2649955477 | s |
| tau_ef | 0.2377897178 | s |
| tau_n | 0.0364676512 | s |
| omega | 561.6673670487 | rad/s |
| C_dyn | 46.8110958109 | — |
| mu_struct | 0.8861875 | — |
| eta | 1.25 | — |
| Rsd | 3937.5 | kg/cm² |
| Rbd | 236 | kg/cm² |
| lambda | 0.124184033 | — |
| Kp | 0.8 | — |
| Pmax | 4.6084144906 | kg/cm² |
| Kd | 0.92 | — |
| kpsi | 0.9 | — |
| P_ekv | 3.8157671982 | kg/cm² |
| Pct | 1.1053490592 | kg/cm² |
| Pp | 4.9211162574 | kg/cm² |

#### STEP5_WALL (مسار الجدار)

| الرمز | القيمة | الوحدة |
|------|-------|------|
| tau_theta | 0.5767495645 | — |
| Z_wall | 7.5042156903 | m |
| h_b | 3.4417407889 | m |
| h_bar | 0.4966373747 | — |
| R_ekv | 7.0437416025 | m |
| R_star | 6.2370793411 | m |
| max_bv | 3.1428233472 | m/s |
| tau | 0.0684870163 | s |
| tau_ef | 0.0608519094 | s |
| omega | 1024.0477954056 | rad/s |
| C_dyn | 72.0811111111 | — |
| mu_struct | 0.9123333333 | — |
| eta | 1.6666666667 | — |
| lambda | 3.1449305556 | — |
| Kp | 1.0 | — |
| Pmax | 6.2856466944 | kg/cm² |
| Kd | 1.0 | — |
| kpsi | 0.85 | — |
| P_ekv | 3.0828604505 | kg/cm² |
| Pct | 0.701644167 | kg/cm² |
| Pp | 3.7845046175 | kg/cm² |

### 6.7 جداول B-1 إلى B-6 (الخطوة 6)

**STEP6_TABLES_ROOF:**
| المعامل | القيمة | المصدر |
|--------|------|------|
| R_bar_b1 | 0.35 | B-1 |
| mu_table | 0.025 | B-2 |
| eta_table | 0.015 | B-2 |
| Kt | 1.0 | B-2 |
| a0z | 180 m/s | B-3 |
| a1z | 80 m/s | B-3 |
| Kpod | 1.25 | B-4 |
| Kp | 0.8 | B-5 |
| Kd | 0.92 | B-6 |

**STEP6_TABLES_WALL:**
| المعامل | القيمة | المصدر |
|--------|------|------|
| R_bar_b1 | 0.9 | B-1 |
| mu_table | 0.009 | B-2 |
| eta_table | 0.001 | B-2 |
| Kt | 1.1 | B-2 |
| a0z | 580 m/s | B-3 |
| a1z | 290 m/s | B-3 |
| Kpod | 1.18 | B-4 |
| Kp | 1.0 | B-5 |
| Kd | 1.0 | B-6 |

### 6.8 دالة مساعدة: كلا المسارين

`calculateBlastLoadBothPaths(commonInput, roofSpecific, wallSpecific)` تنشئ مدخلين منفصلين (سقف + جدار) وتستدعي `calculateBlastLoad` لكل منهما.

---

## 7. محرك التصميم الإنشائي structural.ts

**الوظيفة:** الخطوة 7 (سماكة السقف) + الخطوة 8 (سماكة الجدار + الأرضية + الجدار الداخلي).  
**الكود الحاكم:** الكود السوري 2024 + UFC 3-340-02.

### 7.1 المعادلات المستقلة

#### العزم البلاستيكي للوحة ببساطة بسيطة

```
Mp = Pp × b × ap² × η / (8 × n₀)
```

- **Pp** = ضغط التصميم (kg/cm²)
- **ap** = البحر القصير (يُحوّل من m إلى cm)
- **b** = 100 cm (عرض المتر الطولي)
- **η** = معامل الكفاءة (يزيد العزم بسبب الاستمرارية)
- **n₀** = معامل الأمان (= 1.25)
- **الناتج:** kg.cm

#### العمق الفعال h₀

```
h₀ = √(Mp / (Rbd × b × αm))
```

حيث `αm = ξ × (1 − 0.5ξ)`.

#### معامل العزم النسبي

```
αm = ξ × (1 − 0.5 × ξ)
```

#### العمق النسبي من معامل العزم

```
ξ = 1 − √(1 − 2 × αm)
```

#### السماكة النهائية

```
Hp_final = h₀ × 1.05     (هامش 5% للغطاء الخرساني والتسامح)
```

#### سماكة الأرضية

```
Hf = Hp_final × 0.6     (60% من سماكة السقف)
```

#### سماكة الجدار الداخلي

```
Hvct = 30 cm     (الحد الأدنى وفق الكود السوري 2024)
```

### 7.2 خط الحساب — الخطوة 7 `calculateCeilingDesign`

```
1. Mp = calcPlasticMoment(Pp, ap, bp, eta, n0)
2. RbH = STEP2_LOOKUPS.RbH = 200 kg/cm²
3. RsH = STEP2_LOOKUPS.RsH = 3000 kg/cm²
4. alpha_m = mu_struct × RbH / RsH
5. h0 = calcEffectiveDepth(Mp, Rbd, alpha_m)
6. Hp_final = h0 × 1.05
```

### 7.3 خط الحساب — الخطوة 8 `calculateWallDesign`

نفس خطوات السقف، لكن:
- `Pp` من مسار الجدار (Pp_wall)
- يُحسب `Hf_final = Hp_final × 0.6` (للأرضية)
- يُحسب `Hvct_final = 30 cm` (للجدار الداخلي)

### 7.4 القيم المرجعية المقفلة

**STEP7_CEILING (السقف):**
- Mp = 20,000,000 kg.cm
- mu_struct = 0.8861875
- Rsd = 3937.5 kg/cm²
- h0 = 67.1042712976 cm
- Hp_final = 70.4594848625 cm

**STEP8_WALL (الجدار):**
- Mp = 10,000,000 kg.cm
- Hc_final = 49.8223795452 cm
- Hf_final = 42.3490226134 cm
- Hvct_final = 30 cm

### 7.5 ملاحظة تدقيقية

حساب `alpha_m = mu_struct × RbH / RsH` يعكس العلاقة المضادة:

```
mu_struct = (RsH / RbH) × αm     ← من blast-loads.ts
∴  αm = mu_struct × RbH / RsH    ← الاشتقاق العكسي
```

هذا يربط m خرج محرك الضغط بمدخل محرك التصميم.

---

## 8. محرك الخرسانة structural-concrete-core.ts

**الوظيفة:** تصميم المقطع الخرساني الكامل + فحص القص الثاقب + فحص اللامركزية.

### 8.1 المعادلات المستقلة

#### العمق الفعال

```
d_eff = h − cover
```

حيث `cover = 50 mm` (الكود السوري 2024).

#### المحيط الحرج للقص الثاقب

```
b₀ = 2 × (b_col + d_eff) + 2 × (h_col + d_eff)
```

#### حد النواة

```
e_limit = h / 6
```

#### إجهاد القص الثاقب المسموح — الكود السوري

```
v_cd = 0.25 × √(f_cd)
```

حيث `V_CD_COEFF = 0.25`.

#### إجهاد القص الثاقب المسموح — USD

```
v_cd = φ × 0.33 × √(f_cd) = 0.85 × 0.33 × √(f_cd) = 0.2805 × √(f_cd)
```

#### DIF — معامل تضخيم المواد الديناميكي

```
f_cd = f_c × 1.25      (DIF_CONCRETE_COMPRESSION)
f_sd = f_y × 1.20      (DIF_STEEL_TENSION)
```

#### السماكة المطلوبة (مبسط)

```
Rb = f_c × 0.9 × 10    (تقريب kg/cm²)
h₀ = √((M × 10⁵) / (Rb × width × 0.3))
h_t = h₀ + cover       (mm)
```

#### التسليح المطلوب

```
As = (M × 10⁶) / (f_sd × 0.875 × d_eff)    (mm²/m)
```

#### نسبة المطاوعة

```
Ductility Ratio = f_y / f_c
```

### 8.2 خط الحساب الكامل `designConcreteSection(input)`

```
1. {fcd, fsd} = applyDIF(fcMpa, fyMpa)
2. pDesignKPa = pDesignMpa × 1000
3. momentKnm = (pDesignKPa × ap²) / 8         // عزم لوح بسيط
4. coverMm = 50                                 // COVER_MIN_MM
5. requiredThicknessMm = calcRequiredThickness(momentKnm, fcd, spanLong × 1000, coverMm)
6. requiredThicknessMeters = requiredThicknessMm / 1000
7. dEffMm = calcEffectiveDepth(requiredThicknessMm, coverMm)
8. requiredSteelAreaCm2PerMeter = calcRequiredSteel(momentKnm, fsd, dEffMm)
9. reinforcementRatio = max(As / (dEff × 100), RHO_MIN=0.0025)
10. ductilityRatio = fyMpa / fcMpa

# التحققات:
11. axialForceKn = pDesignKPa × ap × bp
12. eccentricityMm = (M × 10⁶) / (N × 10³)
13. eLimitMm = requiredThicknessMm / 6
14. eccentricityRatio = eccentricityMm / requiredThicknessMm
15. ERR-CORE-01 if eccentricityMm > eLimitMm

16. bColumnMm = hColumnMm = 400 (افتراضي!)
17. b0 = 2(b_col+d) + 2(h_col+d)
18. criticalArea = (b_col+d)(h_col+d) / 1e6  (m²)
19. vActualKn = pDesignKPa × (tributaryArea - criticalArea)
20. vActualMpa = (vActualKn × 1000) / (b0 × dEffMm)
21. vCdMpa = 0.25 × √fcd
22. punchingShearRatio = vActualMpa / vCdMpa
23. ERR-PUNCH-01 if vActualMpa > vCdMpa

24. ERR-MAT-01 if fcMpa < 25
25. ERR-RHO-01 if reinforcementRatio < 0.0025

# القرار النهائي:
26. status = SUCCESS if no failures
          = FAILURE if ERR-PUNCH or ERR-CORE
          = WARNING otherwise
```

### 8.3 ثوابت الكود

**SYRIAN_CODE_2024:**
| الثابت | القيمة |
|------|------|
| V_CD_COEFF | 0.25 |
| PHI_V | 0.85 |
| RHO_MIN | 0.0025 |
| RHO_MAX_COEFF | 0.5 |
| SAFETY_FACTOR_KN | 1.4 |
| COVER_MIN_MM | 50 |

**UFC_340_02:**
| الثابت | القيمة |
|------|------|
| DIF_CONCRETE_COMPRESSION | 1.25 |
| DIF_CONCRETE_TENSION | 1.25 |
| DIF_STEEL_TENSION | 1.20 |
| DIF_PUNCHING_SHEAR | 1.25 |
| CONCRETE_F_C_MIN_PSI | 4000 |

### 8.4 ملاحظات تدقيقية

1. **`bColumnMm = hColumnMm = 400` hardcoded** (السطر 168-169): أبعاد العمود مُفترضة ثابتة. يجب أن تكون مدخلاً.
2. **معامل 0.3 في حساب h₀**: يستخدم `αm ≈ 0.3` كقيمة ابتدائية لجميع المواد — هذا تقريب خشن.
3. **معامل 0.875 في حساب As**: ذراع العزم = 0.875 × d_eff — تقريب شائع في التصميم الأولي.

---

## 9. محرك التسليح rebar.ts

**الوظيفة:** تصميم التسليح التفصيلي — حساب As المطلوبة + اختيار القضبان + فحص النسب.

### 9.1 مساحات القضبان القياسية (cm²)

| القطر (mm) | المساحة (cm²) |
|-----------|--------------|
| 10 | 0.785 |
| 12 | 1.131 |
| 14 | 1.539 |
| 16 | 2.011 |
| 18 | 2.545 |
| 20 | 3.142 |
| 22 | 3.801 |
| 25 | 4.909 |
| 28 | 6.158 |
| 32 | 8.042 |

### 9.2 المعادلات

#### مساحة التسليح المطلوبة (تكراري)

```
z₀ = 0.875 × h₀
As₀ = Mp / (Rsd × z₀)

# تكرار حتى التقارب:
x = Rsd × As / (Rbd × b)              // عمق منطقة الضغط
z = h₀ − 0.5 × x                      // ذراع العزم الجديد
As_new = Mp / (Rsd × z)

# شرط التوقف: |As_new - As| / As < 0.001
```

#### العمق النسبي لمنطقة الضغط

```
ξ = Rsd × As / (Rbd × b × h₀)
```

#### معامل العزم النسبي

```
αm = ξ × (1 − 0.5 × ξ)
```

#### نسبة التسليح

```
ρ = As / (b × h₀)
```

#### الحد الأدنى للتسليح — الكود السوري

```
# للأحمال الديناميكية:
ρ_min = 0.003   (0.3%)

# للأحمال العادية:
ρ_min = max(0.0025, 0.26 × fctm / fyk)
```

#### الحد الأقصى للتسليح

```
# للأحمال الديناميكية (UFC 3-340-02):
ρ_max = 0.04   (4%)

# للأحمال العادية:
ρ_max = 0.025  (2.5%)
```

#### العمق النسبي الأقصى المسموح

```
# للأحمال الديناميكية (UFC):
ξ_max = 0.65

# للأحمال العادية (الكود السوري):
ξ_max = 0.55
```

### 9.3 اختيار القضبان الأمثل `selectOptimalBars`

الخوارزمية:
1. لكل قطر متوفر (10-32 mm):
   - احسب `count = ceil(As_required / singleArea)`
   - فحص التباعد: `spacing = b_cm / count >= minSpacing_cm (5 cm)`
   - احسب `providedArea = count × singleArea`
   - اختر القطر الذي يحقق أصغر فائض
2. إذا فشل الجميع، استخدم أكبر قطر (32 mm)

### 9.4 خط الحساب الكامل `calculateRebarDesign(input)`

```
1. As_required = calcRequiredSteelArea(Mp, h0, Rsd, Rbd, b)   // تكراري
2. rho = calcReinforcementRatio(As_required, b, h0)
3. rho_min = 0.003 (للأحمال الديناميكية)
4. rho_max = 0.04 (للأحمال الديناميكية)
5. xi = calcRelativeCompressionDepth(As_required, Rsd, Rbd, b, h0)
6. xi_max = 0.65 (للأحمال الديناميكية)
7. alpha_m = calcAlphaM(xi)
8. {barDiameter, barCount, As_provided} = selectOptimalBars(As_required, b=100)

# الفحوصات:
9. minReinforcementOk = rho >= rho_min
10. maxReinforcementOk = rho <= rho_max
11. xiConditionOk = xi <= xi_max

# الملاحظات:
- WARN-RHO-01 if rho < rho_min
- ERR-RHO-02 if rho > rho_max
- ERR-XI-01 if xi > xi_max

# الحالة:
- OK if all pass
- WARNING if minReinforcement fails
- FAILURE if maxReinforcement or xi fails
```

### 9.5 ملاحظات تدقيقية

1. **التكرار قد لا يتقارب** لبعض مجموعات Mp و h₀. الحد الأقصى للتكرار هو 10.
2. **`b=100 cm` ثابت** — يفترض دائماً تصميم المتر الطولي.
3. **`minSpacing_cm = 5`** — قيمة افتراضية معقولة لكنها يجب أن تُعدّل حسب قطر القضيب.

---

## 10. محرك المفاضلة geometry-comparator.ts

**الوظيفة:** مقارنة RECTANGULAR / CIRCULAR / ARCHED واختيار الأنسب.

### 10.1 أوزان الترجيح الافتراضية

```
DEFAULT_WEIGHTS = {
  thicknessWeight: 35,   // السماكة (أخف = أفضل)
  steelWeight: 20,       // وزن الحديد (أقل = أفضل)
  safetyWeight: 35,      // الأمان (SUCCESS = أعلى)
  ductilityWeight: 10,   // المطاوعة (أعلى = أفضل)
}
```

### 10.2 دوال التطبيع

```
safetyScore(SUCCESS) = 100
safetyScore(WARNING) = 40
safetyScore(FAILURE) = -50

normalizeAndInvert(value, max) = max(0, 100 × (1 - value/max))
normalizeAndKeep(value, max)   = max(0, 100 × value/max)
```

### 10.3 حسابات الأشكال

**حجم الخرسانة التقريبي** (لكل m طول):
- RECTANGULAR: `thickness × 10` m³
- CIRCULAR: `thickness × 8` m³
- ARCHED: `thickness × 6` m³

**وزن الحديد التقريبي:**
```
steelWeightTon = As × 0.00785 × thickness × 7850 / 1000
```

(ملاحظة: هذه الصيغة غريبة لأنها تضرب As (cm²/m) × thickness (m) مما يعطي أبعاداً غير متجانسة. التحقق المطلوب.)

### 10.4 الدرجة الكلية

```
Score = thicknessScore × 35 + steelScore × 20 + safetyScore × 35 + ductilityScore × 10
```

### 10.5 التوصية

```typescript
const ranked = geometries.sort((a, b) => scores[b] - scores[a]);
const recommendedGeometry = ranked[0];
```

### 10.6 ملاحظات تدقيقية

1. **`maxDynamicMomentKnM = 0`** — قيمة placeholder لم تُحسب.
2. **صيغة وزن الحديد** تحتاج مراجعة وحدوية.
3. **حجوم الخرسانة التقريبية** (10, 8, 6) هي تقديرات يدوية يجب التحقق منها.

---

## 11. محرك التحقق validators.ts

**الوظيفة:** التحقق من المدخلات قبل دخولها المحركات باستخدام Zod.

### 11.1 مخططات Zod

#### PenetrationInputSchema

| الحقل | القيود |
|------|------|
| `weaponId` | string, min 1 |
| `impactVelocity` | 50 ≤ v ≤ 1000, finite |
| `soilTypeCode` | enum (6 قيم) |
| `impactAngleDeg` | 0 ≤ α ≤ 90, optional |
| `detonationDelayMs` | nonnegative, optional |

#### BlastInputSchema

| الحقل | القيود |
|------|------|
| `equivalentTNTWeight` | 0 < W ≤ 50000, finite |
| `radialDistance` | 0 < R ≤ 1000, finite |
| `soilTypeCode` | optional enum |
| `ceilingDepth` | positive, optional |

#### DesignInputSchema

| الحقل | القيود |
|------|------|
| `pDesignMpa` | 0 < P ≤ 500, finite |
| `geometryType` | enum (3 قيم) |
| `tunnelSpanShort` | 0 < ap ≤ 30 |
| `tunnelSpanLong` | 0 < bp ≤ 50 |
| `fcMpa` | 15 ≤ fc ≤ 80 |
| `fyMpa` | 200 ≤ fy ≤ 600 |
| `slabThicknessHintMm` | optional positive |
| `reinforcementRatio` | 0.001 ≤ ρ ≤ 0.04 |

### 11.2 التحذيرات الإضافية (لا تمنع التنفيذ)

- إذا `impactVelocity > 400`: تحذير عن دقة المعادلات
- إذا `fcMpa < 25`: تحذير عن خرسانة منخفضة المقاومة

### 11.3 دوال مساعدة

`sanitizeNumber(value, fieldName)` — فحص NaN/Infinity/null/undefined مع رموز أخطاء:
- SANITIZE-01: null/undefined
- SANITIZE-02: ليس رقماً
- SANITIZE-03: NaN/Infinity

---

## 12. مكتبة الأسلحة weapons-library.ts

**الوظيفة:** بنك موحّد للأسلحة الأمريكية (MK, AN-M) والروسية (FAB).

### 12.1 القنابل الروسية FAB (من الكود)

| المعرف | الوزن (kg) | القطر (m) | L/D | Lh/D | الشحنة (kg) | المتفجر |
|--------|---------|---------|-----|------|---------|--------|
| FAB-250 | 250 | 0.30 | 4.5 | 2.0 | 100 | TNT |
| FAB-500 | 500 | 0.40 | 4.0 | 2.0 | 200 | TNT |
| FAB-1500 | 1500 | 0.62 | 4.2 | 2.0 | 680 | TNT |

### 12.2 القنابل الأمريكية (من BOMB_DATABASE عبر JSON)

| المعرف | النوع | الوزن (kg) | القطر (m) | الشحنة (kg) |
|--------|------|---------|---------|---------|
| W_AN_M30A1 | AN-M30A1 | 61 | 0.21 | 23 |
| W_AN_M57A1 | AN-M57A1 | 131 | 0.28 | 62 |
| W_AN_M64A1 | AN-M64A1 | 264 | 0.36 | 128 |
| W_M117_M | M117(M) | 373 | 0.41 | 177 |
| W_AN_M65A1 | AN-M65A1 | 547 | 0.48 | 270 |
| W_AN_M66A1 | AN-M66A1 | 1033 | 0.59 | 526 |
| W_3000_GENERIC | 3000-كغ | 1383 | 0.61 | 816 |
| W_MK81 | MK81 | 118 | 0.23 | 45 |
| W_MK82 | MK82 | 241 | 0.27 | 87 |
| **W_MK83** | **MK83** | **441** | **0.36** | **215** |
| W_MK84 | MK84 | 894 | 0.46 | 430 |
| W_MK81_SNEKAY | MK81 سنيكاي | 134 | 0.23 | 45 |
| W_MK82_SNEKAY | MK82 سنيكاي | 260 | 0.27 | 87 |
| W_M117R | M117R | 380 | 0.11 | 177 |

**ملاحظة:** MK83 (W_MK83) هو السلاح المرجعي لحالة BMK-02.

### 12.3 دوال البحث

```typescript
getWeaponById('W_MK83')      // → WeaponData
getWeaponByName('FAB-250')   // → WeaponData
getWeaponsLibraryStats()     // → { total, usWeapons, ruWeapons, maxWeightKg, maxChargeKg }
```

### 12.4 ملاحظة تدقيقية

هناك **مصدران** للأسلحة:
1. `weapons-library.json` (يحمّلها `constants/index.ts`)
2. `BOMB_DATABASE` في `structural/baselineConstants.ts` (يحمّلها `weapons-library.ts`)

هذا قد يُسبب تضارباً. `constants/index.ts` يستخدم JSON، بينما `weapons-library.ts` يستخدم BOMB_DATABASE. يجب توحيد المصدر.

---

## 13. ثوابت الانفجار constants/blast-coefficients.ts

**الوظيفة:** طبقة المرجعية الثابتة — كل المعاملات من جداول I-1 إلى I-9.

### 13.1 معاملات المتفجرات (I-5)

| المتفجر | K₁ |
|--------|-----|
| Tritonal_80_20 | 1.639 |
| Mixture_V | 1.340 |
| Torpex_H6 | 1.260 |
| Tritonal_90_40 | 1.230 |
| Ednaloud | 1.050 |
| TNT | 1.000 |

### 13.2 معاملات الإجهاد (I-3)

| referenceName | A | n₁ |
|--------------|---|----|
| loose_sand | 2.5 | 3 |
| clay_with_stones | 5 | 3 |
| medium_clay | 18 | 2.8 |
| sandy_limestone | 4 | 3 |

### 13.3 معاملات الموجة في التربة (I-2)

| referenceName | ρ_min | ρ_max | a0_min | a0_max | a0/a1 | ξ_min | ξ_max |
|--------------|------|------|-------|-------|------|------|------|
| loose_sand | 150 | 155 | 100 | 150 | 2.5 | 0.4 | 0.5 |
| sandy_limestone | 160 | 165 | 200 | 500 | 2.5 | 0.35 | 0.4 |
| clay_with_stones | 180 | 185 | 400 | 600 | 2.0 | 0.5 | 0.6 |
| medium_clay | 195 | 200 | 500 | 800 | 1.5 | 0.5 | 0.7 |

### 13.4 مقاومة الضغط للخرسانة (I-6)

| الدرجة | المقاومة (kg/cm²) |
|------|----------------|
| M200 | 115 |
| M300 | 170 |
| M350 | 200 |
| M400 | 225 |
| M500 | 280 |
| M600 | 340 |
| M700 | 390 |
| M800 | 450 |

### 13.5 خصائص حديد التسليح (I-7)

| الدرجة | إجهاد الشد (kg/cm²) | معامل المرونة (kg/cm²) |
|------|-----------------|-------------------|
| A-I | 2100 | 2,100,000 |
| A-II | 3000 | 2,100,000 |
| A-III | 4000 | 2,100,000 |

### 13.6 ثوابت UFC 3-340-02

```typescript
DIF_CONCRETE_COMPRESSION: 1.25
DIF_CONCRETE_TENSION: 1.25
DIF_STEEL_TENSION: 1.20
DIF_PUNCHING_SHEAR: 1.25
CONCRETE_F_C_MIN_PSI: 4000
```

### 13.7 ثوابت الكود السوري 2024

```typescript
V_CD_COEFF: 0.25
PHI_V: 0.85
RHO_MIN: 0.0025
RHO_MAX_COEFF: 0.5
SAFETY_FACTOR_KN: 1.4
COVER_MIN_MM: 50
```

### 13.8 خرائط ربط التربة

`SOIL_TO_STRESS_MAP` و `SOIL_TO_WAVE_MAP` تربط `SoilTypeCode` بأسماء `referenceName`:

```typescript
SOFT_SOIL          → 'medium_clay'
MEDIUM_SOIL        → 'clay_with_stones'
HARD_ROCK          → 'sandy_limestone'  // ⚠️ لكن SOIL_TABLE يقول 'granite_gneiss'
REINFORCED_SAND    → 'loose_sand'
CONCRETE           → 'sandy_limestone'
REINFORCED_CONCRETE → 'clay_with_stones'
```

**ملاحظة تدقيقية حرجة:** `HARD_ROCK` في `SOIL_TO_STRESS_MAP` مُعين إلى `sandy_limestone` (A=4, n₁=3) بدلاً من `granite_gneiss` الذي قد يكون الأنسب. السبب أن `STRESS_COEFFICIENTS` لا يحتوي على `granite_gneiss`، فيتم استخدام أقرب بديل. هذا قد يُسبب خطأ في حساب σ_max لحالة BMK-03.

---

## 14. الحالة المرجعية constants/reference-case-bmk02.ts

**الوظيفة:** القيم المرجعية الكاملة لـ BMK-02 (MK83 + MEDIUM_SOIL) — الخطوات 2-8.

### 14.1 STEP2_INPUTS (مدخلات المستخدم)

| الرمز | القيمة | الوحدة | الوصف |
|------|------|------|------|
| P | 441 | kg | وزن القنبلة (MK83) |
| lo_b | 3.01 | m | الطول الكلي |
| lk | 1.92 | m | طول الجسم |
| dk | 0.36 | m | القطر |
| ld_ratio | 5.3 | — | L/D |
| lhd_ratio | 2 | — | Lh/D |
| C | 215 | kg | الشحنة |
| V | 350 | m/s | السرعة |
| alpha | 20 | deg | زاوية الاصطدام |
| beta | 22 | deg | زاوية الميل |
| Z | 3.7 | m | عمق السقف |

### 14.2 STEP2_LOOKUPS (قيم البحث)

| الرمز | القيمة | الوصف |
|------|------|------|
| K1 | 1.639 | معامل Tritonal |
| kpr_g | 1.8e-6 | معامل اختراق التربة |
| kpr_b | 8e-7 | معامل اختراق البيتون |
| kpr_bt | 8e-7 | معامل اختراق البلاطة |
| K_kp_ct | 1.1 | معامل تدمير الجدار |
| m1 | 1.65 | معامل الإجهاد |
| RbH | 200 | kg/cm² — مقاومة الخرسانة (M350) |
| RsH | 3000 | kg/cm² — إجهاد خضوع الحديد (A-II) |
| gamma_b | 2500 | kg/m³ — كثافة الخرسانة |
| gamma_g | 1700 | kg/m³ — كثافة التربة |
| Kpod_b | 1.18 | معامل التأسيس (بيتون) |
| Kpod_s | 1.25 | معامل التأسيس (تربة) |
| n0 | 1.25 | معامل الأمان |
| Kbt_bt | 0.13 | معامل التصدع للبلاطة |
| R_bar | 1.1 | معامل البعد المكافئ |

### 14.3 STEP2_GEOMETRY (الأبعاد)

| الرمز | القيمة | الوحدة |
|------|------|------|
| a_et | 3 | m (ارتفاع السقف) |
| bp | 5 | m (المجاز الطويل) |
| ap | 4 | m (المجاز القصير) |
| Lk | 50 | m (طول المنشأة) |
| Bk | 20 | m (عرض المنشأة) |
| Pk | 492.25 | t (الوزن الكلي) |
| Hct | 0.5 | m (سماكة الجدار الخارجي) |
| Hvct | 0.3 | m (سماكة الجدار الداخلي) |
| Hf | 0.45 | m (سماكة الأرضية) |
| Hp | 0.75 | m (سماكة السقف) |
| h_obs | 0.5 | m (سماكة طبقة التمويه) |
| psi_p | 0.012 | — |
| Ea | 2,100,000 | kg/cm² |
| xi | 0.55 | — |
| rho_pc | 150 | — |
| rho_g | 180 | — |

### 14.4 STEP4_LOCKED (السماكات الأولية المعتمدة)

| الرمز | القيمة | الوحدة |
|------|------|------|
| Hp | 70.4594848625 | cm |
| Hc | 49.8223795452 | cm |
| Hf | 42.3490226134 | cm |
| Hvct | 30 | cm |
| ht | 107.2167056901 | cm |
| Bt | 8.0520158398 | m |
| Hpc | 3.8320486334 | m |
| Pp_roof | 4.9211162574 | kg/cm² |
| Pp_wall | 3.7845046175 | kg/cm² |

### 14.5 سجل القيم المقفلة (LOCKED_REGISTRY)

يحتوي على 23 قيمة مقفلة مع تتبع المصدر:

| المفتاح | القيمة | أُنتجت في خطوة | تُستهلك في خطوة | المسار | التسامح |
|--------|------|-------------|-------------|------|------|
| C_ef | 334.76575 | 3 | 5, 6 | shared | 0.01 |
| h_pr | 2.7717367373 | 3 | 4, 5 | shared | 0.01 |
| R_actual | 7.6230969725 | 3 | 5 | shared | 0.02 |
| Zp | 5.8212740517 | 3 | 5 | shared | 0.02 |
| lambda1 | 1.1346670746 | 3 | 5 | shared | 0.01 |
| lambda2 | 1.2125386949 | 3 | 5 | shared | 0.01 |
| ht | 107.2167056901 | 4 | 7, 8 | shared | 0.01 |
| Bt | 8.0520158398 | 4 | 5 | shared | 0.01 |
| Hp | 70.4594848625 | 4 | 7 | shared | 0.01 |
| Hc | 49.8223795452 | 4 | 8 | wall | 0.01 |
| Hf | 42.3490226134 | 4 | 8 | wall | 0.01 |
| tau_ef_roof | 0.2377897178 | 5 | 6, 7 | roof | 0.01 |
| tau_ef_wall | 0.0608519094 | 5 | 6, 8 | wall | 0.01 |
| omega_roof | 561.6673670487 | 5 | 6 | roof | 0.01 |
| omega_wall | 1024.0477954056 | 5 | 6 | wall | 0.01 |
| Pmax_roof | 4.6084144906 | 5 | 6, 7 | roof | 0.01 |
| Pmax_wall | 6.2856466944 | 5 | 6, 8 | wall | 0.01 |
| P_ekv_roof | 3.8157671982 | 5 | 7 | roof | 0.01 |
| P_ekv_wall | 3.0828604505 | 5 | 8 | wall | 0.01 |
| Pp_roof | 4.9211162574 | 5 | 7 | roof | 0.01 |
| Pp_wall | 3.7845046175 | 5 | 8 | wall | 0.01 |
| Mp_roof | 20,000,000 | 7 | — | roof | 0.01 |
| Mp_wall | 10,000,000 | 8 | — | wall | 0.01 |

### 14.6 دالة الحماية `assertLockedNotOverwritten`

```typescript
function assertLockedNotOverwritten(
  computed: Record<string, number>,
  source: string,
  maxDeviationPct: number = 5
): void
```

لكل قيمة في `LOCKED_REGISTRY`:
- إذا تجاوز الانحراف النسبي `maxDeviationPct` (افتراضي 5%): يرمي خطأ `[LOCKED-ERR]`

---

## 15. النموذج الموحد constants/unified-variable-model.ts

**الوظيفة:** جدول موحد لـ ~130 متغير عبر كل المحركات مع تتبع الاعتماديات.

### 15.1 أنواع التصنيف

```typescript
type VariableType = 'input' | 'lookup' | 'computed' | 'locked' | 'output';
type EngineName = 'penetration' | 'blast' | 'structural';
type PathType = 'roof' | 'wall' | 'shared';
```

### 15.2 واجهة المتغير

```typescript
interface UnifiedVariable {
  name: string;
  symbol: string;
  descriptionAr: string;
  descriptionEn: string;
  unit: string;
  source: string;
  type: VariableType;
  dependsOn: string[];
  locked: boolean;
  engine: EngineName;
  path: PathType;
  formula?: string;
}
```

### 15.3 أقسام الجدول

| القسم | عدد المتغيرات | المحرك |
|------|---------|--------|
| 1. المدخلات الأساسية (input) | 11 | penetration |
| 2. معاملات التربة والمواد (lookup) | 14 | shared |
| 3. أبعاد المنشأة (input) | 17 | structural/blast |
| 4. محسوبات الاختراق | 14 | penetration |
| 5. مسار السقف — الانفجار | 13 | blast (roof) |
| 6. مسار الجدار — الانفجار | 12 | blast (wall) |
| 7. القيم الحاكمة — الأحمال | 14 | structural |
| 8. معاملات الخطوة 5 | 18 | blast |
| 9. جداول B-1 إلى B-6 | 12 | blast |
| 10. العزوم | 3 | structural |
| 11. المخرجات النهائية | 5 | structural |

### 15.4 حدود المحركات (ENGINE_BOUNDARIES)

```typescript
ENGINE_BOUNDARIES = {
  penetrationToBlast: ['C_ef', 'h_pr', 'R_actual', 'Zp'],
  blastRoofToStructural: ['tau_ef_roof', 'omega_roof', 'Pmax_roof', 'P_ekv_roof', 'Pp_roof', 'Bt', 'ht', 'Hpc', 'R_ekv_roof'],
  blastWallToStructural: ['tau_ef_wall', 'omega_wall', 'Pmax_wall', 'P_ekv_wall', 'Pp_wall', 'R_ekv_wall'],
  withinBlastRoof: ['tau_ef_roof', 'omega_roof', 'C_dyn_roof', 'Pmax_roof', 'P_ekv_roof'],
  withinBlastWall: ['tau_ef_wall', 'omega_wall', 'C_dyn_wall', 'Pmax_wall', 'P_ekv_wall'],
}
```

### 15.5 الرسم البياني للاعتماديات

`buildDependencyGraph()` يبني خريطة لكل متغير مع:
- `dependsOn`: من يعتمد عليّ
- `dependedBy`: من يعتمد عليّ

### 15.6 دوال مساعدة

```typescript
getVariableByName(name)              // بحث بالاسم
getVariablesByType(type)             // فلترة بالنوع
getVariablesByEngine(engine)         // فلترة بالمحرك
getVariablesByPath(path)             // فلترة بالمسار
getLockedForEngine(engine)           // القيم المقفلة لمحرك
isLocked(name)                       // فحص القفل
```

---

## 16. الملفات الداعمة

### 16.1 reference-data.ts (في /lib/constants/)

نسخة موازية من reference-case-bmk02.ts مع إضافات:

**STEP3_PENETRATION (جديد):**
| الرمز | القيمة |
|------|------|
| lambda1 | 1.1346670746 |
| lambda2 | 1.2125386949 |
| n_exp | 1.5 |
| C_ef | 334.76575 |
| tsu | 0.8700554756 |
| h_pr | 2.7717367373 |
| h_z | 1.9016812617 |
| h_z_bar | 0.2738524483 |
| R_actual | 7.6230969725 |
| Zp | 5.8212740517 |
| Y_diff | 0.9282632627 |
| hb_destruction | 3.0487140950 |
| hb_cracking | 3.6030257486 |

**ملاحظة:** `h_pr = 2.7717 m` (وليس 3.6495 كما في `STEP2_PENETRATION` من reference-case-bmk02.ts). هناك **اختلاف** بين الملفين! يجب توحيد القيمة المرجعية.

### 16.2 weapons-library.json

ملف JSON يحتوي على 17 سلاح (14 أمريكي + 3 روسي FAB). يُحمّل في `constants/index.ts` ويُحوّل إلى `WeaponData[]`.

### 16.3 soil-coefficients.json

ملف JSON يحتوي على 6 أنواع تربة مع معاملات Kp, Kv, density, destructionCoeff, crackCoeff. يُحمّل في `constants/index.ts`.

| code | kp | kv | densityKgM3 | destroyCoeff | crackCoeff |
|------|----|----|----------|----------|----------|
| SOFT_SOIL | 1.3e-5 | 0.6 | 1700 | 0.85 | 0.6 |
| MEDIUM_SOIL | 7e-6 | 0.5 | 1800 | 0.6 | 0.5 |
| REINFORCED_SAND | 5e-6 | 0.5 | 1900 | 0.6 | 0.5 |
| HARD_ROCK | 7e-7 | 0.2 | 2650 | 0.53 | 0.75 |
| CONCRETE | 1e-6 | 0.16 | 2500 | 0.34 | 0.48 |
| REINFORCED_CONCRETE | 7e-7 | 0.13 | 2500 | 0.3 | 0.44 |

---

## 17. الطبقة الإنشائية القديمة /lib/structural/

طبقة قديمة (legacy) قبل إعادة الهيكلة. تتضمن:

### 17.1 baselineConstants.ts

يحتوي على نفس ثوابت `blast-coefficients.ts` + `BOMB_DATABASE` (14 قنبلة) + `SOIL_TABLE` (13 نوع تربة مع Kpr, Kv, Kp, Kot).

### 17.2 structuralSchema.ts

مخطط Zod للمدخلات الإنشائية القديمة. الحقول الرئيسية:

```typescript
StructuralInputSchema = z.object({
  designMethod: z.enum(["SYRIAN_WSD_2024", "USD_GLOBAL"]),
  f_c: z.number().min(25).max(60),     // MPa
  f_y: z.number().min(240).max(420),   // MPa
  h_slab: z.number().min(300).max(2500), // mm
  b_column: z.number().min(200),
  h_column: z.number().min(200),
  a_tributary: z.number().positive(),  // m²
  p_design: z.number().positive(),     // kPa
  m_dynamic: z.number().nonnegative(), // kN.m
  n_dynamic: z.number().nonnegative(), // kN
});
```

### 17.3 structuralEngine.ts

محرك التحقق الإنشائي القديم. يحسب:

```
1. f_cd = f_c × 1.25        (DIF_CONCRETE_COMPRESSION)
2. d_eff = h_slab - 50      (COVER_MIN_MM)
3. b_0 = 2(b_col + d_eff) + 2(h_col + d_eff)
4. e_limit = h_slab / 6
5. eccentricity = (m_dynamic / n_dynamic) × 1000   (mm)
6. svgColor = eccentricity <= e_limit ? GREEN : RED_FLASHING

# للكود السوري:
7. v_cd = 0.25 × √f_cd
8. V_actual = p_design × (a_tributary - critical_area)
9. v_actual = (V_actual × 1000) / (b_0 × d_eff)
10. if v_actual > v_cd → PUNCHING_FAILURE

# للـ USD:
11. v_cd = 0.85 × 0.33 × √f_cd = 0.2805 × √f_cd
```

### 17.4 blastEngine.ts

محرك الانفجار القديم. يجمع كل الحسابات في دالة واحدة `calculateBlastLoad`:

```
1. lambda1 = 0.5 + 0.4 × (lhd_ratio)^0.666
2. lambda2 = 2.8 × d^0.333 - 1.3 × d^0.5
3. n_exp = 3.5 - lhd_ratio
4. C_effective = 0.95 × K1 × C
5. h_penetration = λ1 × λ2 × Kpr × (P/d²) × V × cos(α)
6. tsu = 0.5 × lk × cos((α + n×α)/2)
7. h_z = h_penetration - tsu
8. R_equivalent = ceilingDepth - h_z
9. R_bar = R_equivalent / ∛C_ef
10. R_critical = 1.1 × ∛C_ef
11. h_bar_z = h_z / ∛C_ef
12. sigma_max = A × R_bar^(-n1)
    if h_bar_z < 0.7: sigma_max × 0.6
13. tau_plus = 1.7e-3 × ∛(√C) × √R
14. tau_effective = tau_plus × (0.0008 ΔP² - 0.0384 ΔP + 1.0013)
15. tau_rise = h_bar_z × ∛C_ef / a_mean
16. omega = C_mu × 0.933 × √(B_stiffness / m_ed) / (ap × 100)
17. dynamicConditionMet = tau_effective >= 0.2π/omega
18. K_p = 0.86
19. K_d = dynamicConditionMet ? 0.9 : 0
20. P_max = 2 × K_p × sigma_max
21. P_equivalent = K_d × P_max
22. P_static = ceilingDepth × 2000 / 10000
23. P_design = P_static + P_equivalent
24. P_design_kPa = P_design × 98.0665

# السماكات المبسطة:
25. M_roof = P_design × ap × 100 × bp × 100 / 8
26. h0_roof = √(M_roof / (R_bd × bp × 100 × 0.3)) / 100
27. H_roof = (h0_roof + 0.05) × 100
28. H_wall = H_roof × 0.7
29. H_floor = H_roof × 0.6

# التحقق:
30. e = M_roof / (P_design × ap × bp × 10⁴)
31. e_limit = H_roof / 6
32. coreConditionMet = e <= e_limit
```

### 17.5 ملاحظة تدقيقية مهمة

هذه الطبقة القديمة **لا تُستخدم** في `orchestrator.ts` الحديث. المحركات الجديدة في `/lib/engine/` تحل محلها. لكن `weapons-library.ts` ما زال يستورد `BOMB_DATABASE` من `/lib/structural/baselineConstants.ts` مما يُسبب ازدواجية.

---

## 18. خط أنابيب المنسّق الكامل

### 18.1 الرسم البياني لتدفق البيانات

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INPUT (EngineInput)                              │
│  penetration: { weaponId, impactVelocity, soilTypeCode, impactAngle }   │
│  blast: { radialDistance, ceilingDepth }                                │
│  design: { tunnelSpanShort, tunnelSpanLong, fcMpa, fyMpa }              │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 0: VALIDATION (validators.ts)                                      │
│   PenetrationInputSchema → ValidationResult                             │
│   BlastInputSchema → ValidationResult                                   │
│   DesignInputSchema → ValidationResult                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1-2: PENETRATION (penetration-core.ts) — Eq. 13-19                │
│   getWeaponById(weaponId) → { weightKg, diameter, lhdRatio, ... }       │
│   getSoilByCode(soilTypeCode) → { kp, kv, ... }                         │
│   getExplosiveK1(explosive) → K1                                        │
│   λ1 = 0.5 + 0.4 × (Lh/D)^0.666                                        │
│   λ2 = 2.8 × d^0.333 - 1.3 × d^0.5                                    │
│   n = 3.5 - Lh/D                                                       │
│   C_ef = 0.95 × K1 × C                                                 │
│   τ = 0.5 × lk × cos((α + nα)/2)                                       │
│   x1 = λ1 × λ2 × Kpr × (P/d²) × V × cos(α)                            │
│   hz = max(x1 - τ, 0)                                                  │
│   craterDepth = hz × 1.18                                              │
│   hBarZ = hz / ∛C_ef                                                   │
│   OUTPUT: PenetrationOutput { penetrationDepth, craterDepth, ... }      │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3-4: BLAST PRESSURE (blast-pressure-core.ts) — Eq. 1-12           │
│   C = C_effective (ملاحظة: مكرر حسابه في orchestrator)                  │
│   R = radialDistance                                                    │
│   Z = R / ∛C                                                            │
│   rCritical = 1.1 × ∛C                                                  │
│   σ_max = A × Z^(-n1)   (A, n1 من جدول I-3)                            │
│   ΔP = 0.1 ∛C/R + 0.43 ∛C²/R² + 1.4 C/R³   (Sadovsky, MPa)            │
│   Pso = ΔP                                                              │
│   Kp = 0.86                                                             │
│   Pr = 2 × Kp × max(σ_max, Pso)                                         │
│   τ+ = 1.7e-3 × ∛(√C) × √R                                              │
│   τ_eff = τ+ × (0.0008ΔP² - 0.0384ΔP + 1.0013)                         │
│   ω = 100 (placeholder)                                                 │
│   dynamicConditionMet = τ_eff >= 0.2π/ω                                 │
│   Kd = dynamicConditionMet ? 0.9 : 0                                    │
│   P_static = ceilingDepth × 2000 / 10000 × 0.0980665                    │
│   P_design = P_static + Kd × Pr                                         │
│   OUTPUT: BlastOutput { pDesignMpa, sigmaMaxMpa, ... }                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5-6: STRUCTURAL DESIGN (structural-concrete-core.ts) — 3 أشكال    │
│   FOR geo IN [RECTANGULAR, CIRCULAR, ARCHED]:                           │
│     {fcd, fsd} = applyDIF(fcMpa, fyMpa)   // fcd = fc × 1.25, fsd = fy × 1.20 │
│     M = (pDesignKPa × ap²) / 8                                          │
│     Rb = fc × 0.9 × 10                                                  │
│     h0 = √((M × 10⁵) / (Rb × width × 0.3))                            │
│     h_t = h0 + 50 mm (cover)                                            │
│     d_eff = h_t - 50                                                    │
│     As = (M × 10⁶) / (fsd × 0.875 × d_eff)                            │
│     ρ = max(As / (d_eff × 100), 0.0025)                                 │
│     ductilityRatio = fy / fc                                            │
│     e = (M × 10⁶) / (N × 10³)                                          │
│     e_limit = h_t / 6                                                   │
│     b0 = 2(b_col + d) + 2(h_col + d)   (b_col = h_col = 400)           │
│     v_actual = (V × 10³) / (b0 × d_eff)                                │
│     v_cd = 0.25 × √fcd                                                  │
│     FAIL if e > e_limit (ERR-CORE-01)                                   │
│     FAIL if v_actual > v_cd (ERR-PUNCH-01)                              │
│     FAIL if fc < 25 (ERR-MAT-01)                                        │
│     FAIL if ρ < 0.0025 (ERR-RHO-01)                                     │
│     OUTPUT: SectionDesignResult { requiredThicknessMeters, As, ρ, ... } │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: GEOMETRY COMPARISON (geometry-comparator.ts)                    │
│   Score(g) = thicknessScore × 35 + steelScore × 20 +                    │
│              safetyScore × 35 + ductilityScore × 10                     │
│   recommendedGeometry = argmax(Score)                                   │
│   OUTPUT: GeometryComparisonReport { recommendedGeometry, ... }          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        OUTPUT (EngineOutput)                            │
│   inputs + intermediates + structural + comparison + warnings + status  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 18.2 حدود المحركات (Engine Boundaries)

القيم التي تنتقل بين المحركات:

**Penetration → Blast:**
- `C_ef` (الشحنة الفعالة, kg)
- `h_pr` (عمق الاختراق, m)
- `R_actual` (البعد الشعاعي, m)
- `Zp` (البعد المختزل, —)

**Blast (roof) → Structural:**
- `tau_ef_roof`, `omega_roof`, `Pmax_roof`, `P_ekv_roof`, `Pp_roof`, `Bt`, `ht`, `Hpc`, `R_ekv_roof`

**Blast (wall) → Structural:**
- `tau_ef_wall`, `omega_wall`, `Pmax_wall`, `P_ekv_wall`, `Pp_wall`, `R_ekv_wall`

---

## 19. نظام الـ Benchmarks

نظام ثلاثي من حالات الاختبار المرجعية (Regression Tests) للتحقق من صحة المحرك.

### 19.1 BMK-01 — اختراق منخفض في تربة لينة

| الحقل | القيمة |
|------|------|
| **السلاح** | FAB-250 |
| **السرعة** | 200 m/s |
| **التربة** | SOFT_SOIL (water_saturated_clay) |
| **زاوية الاصطدام** | 0° (عمودي) |
| **الكود** | UFC 3-340-02 |
| **المصدر** | Excel-01: Penetration & Soil Tables |

**الهدف:**
- اختبار عمق الاختراق الصافي والضغط العصفي المنخفض
- التحقق أن سلسلة البداية (الاختراق → الحفرة → الضغط) تُنتج قيماً موجبة ومنطقية
- إثبات ربط معرف السلاح بمكتبة الأسلحة
- إثبات ربط اسم التربة بجداول الاستيفاء

**القيم المتوقعة (TODO — تُملأ من Excel):**
- lambda1, lambda2, n, C_eff, tsu, h_bar_z (قيم وسيطة)
- x1, h0, Pso (قيم نهائية)

**القرار المتوقع:** SUCCESS مع تحذير عن عمق الاختراق في التربة اللينة.

**الأولوية:** 1 (حرج) | **مقفل:** لا (يُقفل بعد ملء القيم)

### 19.2 BMK-02 — المرجع الذهبي المقفل

| الحقل | القيمة |
|------|------|
| **السلاح** | MK83 (W_MK83) |
| **السرعة** | 350 m/s |
| **التربة** | MEDIUM_SOIL (clay_with_stones) |
| **زاوية الاصطدام** | 20° |
| **عمق السقف** | 3.7 m |
| **البحر القصير** | 4 m |
| **البحر الطويل** | 5 m |
| **fc** | 20 MPa |
| **fy** | 300 MPa |
| **الكود** | BOTH (Syrian + UFC) |
| **المصدر** | Excel-BMK02: MK83 + MEDIUM_SOIL Complete Pipeline (Steps 2-8) |

**الهدف:**
- المرجع الذهبي المقفل لخط الحساب الكامل
- يختبر من الاختراق عبر الانفجار حتى التصميم الإنشائي
- كل output يجب أن يُقاس مقابل هذه القيم
- المتغيرات المقفلة لا تُعاد كتابتها بين المحركات

**القيم الوسيطة المتوقعة (تسامح 1%):**

| الرمز | القيمة | الوحدة | الوصف |
|------|------|------|------|
| lambda1 | 1.1346670746 | — | معامل شكل الرأس (Eq.14) |
| lambda2 | 1.2125386949 | — | معامل القطر (Eq.15) |
| n_exp | 1.5 | — | أُس التأثير (Eq.16) |
| C_ef | 334.76575 | kg | الشحنة الفعالة (Eq.19) |
| h_pr | 2.7717367373 | m | عمق الاختراق المصحح |
| R_actual | 7.6230969725 | m | البعد الشعاعي الفعلي |
| Zp | 5.8212740517 | — | البعد المختزل |
| ht | 107.2167056901 | cm | العمق الكلي |
| Bt | 8.0520158398 | m | البحر المكافئ |
| omega_roof | 561.6673670487 | rad/s | تردد السقف الطبيعي |
| omega_wall | 1024.0477954056 | rad/s | تردد الجدار الطبيعي |
| Pmax_roof | 4.6084144906 | kg/cm² | الضغط الأقصى سقف |
| Pmax_wall | 6.2856466944 | kg/cm² | الضغط الأقصى جدار |
| P_ekv_roof | 3.8157671982 | kg/cm² | الضغط المكافئ سقف |
| P_ekv_wall | 3.0828604505 | kg/cm² | الضغط المكافئ جدار |
| Pp_roof | 4.9211162574 | kg/cm² | الحمل التصميمي سقف |
| Pp_wall | 3.7845046175 | kg/cm² | الحمل التصميمي جدار |
| Mp_roof | 20,000,000 | kg.cm | عزم السقف |
| Mp_wall | 10,000,000 | kg.cm | عزم الجدار |
| h0 | 67.1042712976 | cm | العمق الفعال من العزم |

**القيم النهائية المتوقعة (تسامح 1%):**

| الرمز | القيمة | الوحدة |
|------|------|------|
| Hp_final | 70.4594848625 | cm |
| Hc_final | 49.8223795452 | cm |
| Hf_final | 42.3490226134 | cm |
| Hvct_final | 30 | cm |

**القرار المتوقع:** SUCCESS (لا إخفاقات، لا تحذيرات).

**الأولوية:** 1 (حرج) | **مقفل:** نعم (المرجع الذهبي)

**ملاحظات هامة:**
- `h_pr المصححة = 2.7717367373 m` (ليست 3.65 m القديمة)
- `omega_wall = 1024.0478 rad/s` (منفصلة عن `omega_roof = 561.6674`)
- القيم المقفلة لا تُعاد كتابتها بين المحركات — التسامح 5% كحد أقصى
- `Hp_final = h0 × 1.05 = 70.46 cm`

### 19.3 BMK-03 — الحالة الحرجة — فشل هش و spalling

| الحقل | القيمة |
|------|------|
| **السلاح** | FAB-1500 (W_FAB_1500) |
| **السرعة** | 450 m/s (عالية جداً) |
| **التربة** | HARD_ROCK (granite_gneiss) |
| **زاوية الاصطدام** | 0° (عمودي — أسوأ حالة) |
| **عمق السقف** | 2.0 m (قريب من السطح — خطير) |
| **البحر القصير** | 5.0 m |
| **البحر الطويل** | 7.0 m |
| **fc** | 40 MPa (خرسانة عالية المقاومة) |
| **fy** | 420 MPa |
| **الكود** | BOTH |
| **المصدر** | Excel-03: Critical Penetration & Spalling Check |

**الهدف:**
- اختبار الاختراق الحرج و spalling والقرار الإنشائي عند الوسط الصخري
- إجبار النظام على إصدار قرار هندسي واضح: فشل هش؟ تضخيم استثنائي؟ رفض؟
- فحص `h0` (السمك الحاكم)
- فحص `spalling thickness`
- فحص شرط اللامركزية `e ≤ h/6`
- اختبار الفرق بين رقم وقرار هندسي

**القيم المتوقعة (TODO — تُملأ من Excel):**
- lambda1, lambda2, n, C_eff (قيم وسيطة)
- x_critical, h0, h_bar_z, Z, sigma_max (قيم وسيطة)
- penetrationDepth, spallingThickness, P_design, e/h (قيم نهائية)

**القرار المتوقع:** WARNING_OR_FAILURE
- إخفاقات متوقعة:
  - ERR-SPALL-01: عمق الاختراق يتجاوز السماكة المتاحة
  - ERR-CORE-01: اللامركزية تتجاوز حد النواة
- تحذيرات متوقعة:
  - المقطع يدخل منطقة فشل هش
  - التضخيم الاستثنائي مطلوب
  - طبقة صخرية شديدة القساوة فوق السقف تُغيّر سلوك الموجة

**ملاحظات المحرك:**
- Kpr للجرانيت/نايس = 7.00e-7 (أصغر بمرتين من التربة المتوسطة)
- لكن سرعة 450 m/s والشحنة الكبيرة تعوّض جزئياً
- المفتاح ليس الأرقام بل القرار
- شرط `e ≤ h/6` يجب أن يُفحص بصرامة
- يجب مقارنة كل قيمة مع Excel-03 بدقة متناهية

**الأولوية:** 1 (حرج) | **مقفل:** لا (يُقفل بعد ملء القيم)

### 19.4 جدول مقارنة الـ Benchmarks

| المعيار | BMK-01 | BMK-02 | BMK-03 |
|--------|--------|--------|--------|
| السلاح | FAB-250 (RU) | MK83 (US) | FAB-1500 (RU) |
| السرعة (m/s) | 200 | 350 | 450 |
| التربة | SOFT_SOIL | MEDIUM_SOIL | HARD_ROCK |
| Kpr | 1.30e-5 | 6.00e-6 | 7.00e-7 |
| زاوية الاصطدام | 0° | 20° | 0° |
| عمق السقف (m) | — | 3.7 | 2.0 |
| fc (MPa) | — | 20 | 40 |
| fy (MPa) | — | 300 | 420 |
| الحالة المتوقعة | SUCCESS | SUCCESS | WARNING/FAILURE |
| مقفل | لا | نعم | لا |
| الأولوية | 1 | 1 | 1 |

### 19.5 Suite API

```typescript
BENCHMARK_SUITE: readonly BenchmarkCase[]  // [BMK_01, BMK_02, BMK_03]
getBenchmarkById(id: string): BenchmarkCase | undefined
getBenchmarksBySoilType(soilTypeCode: string): readonly BenchmarkCase[]
getBenchmarksByPriority(priority: 1|2|3): readonly BenchmarkCase[]
```

---

## 20. ملاحظات تدقيقية وأخطاء محتملة

### 20.1 أخطاء وتناقضات تم اكتشافها

#### 20.1.1 تكرار حساب C_effective في orchestrator.ts

```typescript
// orchestrator.ts السطر 122:
const C_effective = 0.95 * K1 * weapon.chargeKg;

// لكن penetration-core.ts يحسب نفس القيمة أيضاً:
const cEffective = calcCEffective(K1, weapon.chargeKg);  // = 0.95 * K1 * chargeKg
```

المنسّق لا يستخدم `penetration.cEffective` بل يعيد الحساب. هذا قد يُسبب تضارباً إذا تغيرت المعادلة في مكان واحد.

#### 20.1.2 اختلاف h_pr المرجعي بين ملفين

- `reference-case-bmk02.ts` (في engine/constants): `h_pr: 3.6495332546231958`
- `reference-data.ts` (في lib/constants): `h_pr: 2.7717367373`
- `bmk-02.ts` (في benchmarks): `h_pr: 2.7717367373`

القيمة الصحيحة (وفق BMK-02) هي **2.7717367373 m**. القيمة في `reference-case-bmk02.ts` قديمة ويجب تحديثها.

#### 20.1.3 اختلاف مصدري الأسلحة

هناك مصدران:
1. `weapons-library.json` (يحمّله `constants/index.ts` كـ `WEAPONS`)
2. `BOMB_DATABASE` في `structural/baselineConstants.ts` (يحمّله `weapons-library.ts` كـ `UNIFIED_WEAPONS_LIBRARY`)

كلاهما يحتوي على MK83، لكن `getWeaponById` قد يرجع نتائج مختلفة حسب أي وحدة تُستورد. يجب توحيد المصدر.

#### 20.1.4 اختلاف STEP3_PENETRATION بين الملفين

`reference-data.ts` يحتوي على `STEP3_PENETRATION` (مقسمة بشكل أوضح)، بينما `reference-case-bmk02.ts` يدمجها في `STEP2_PENETRATION` مع قيم مختلفة.

#### 20.1.5 خرائط التربة غير متناسقة

- `SOIL_CODE_TO_REFERENCE_NAME['HARD_ROCK'] = 'granite_gneiss'` (في types.ts)
- `SOIL_TO_STRESS_MAP['HARD_ROCK'] = 'sandy_limestone'` (في blast-coefficients.ts)
- `SOIL_TABLE` تحتوي على `granite_gneiss` مع Kpr=7e-7
- `STRESS_COEFFICIENTS` لا تحتوي على `granite_gneiss` (لذلك يُستخدم sandy_limestone كبديل)

هذا قد يُسبب خطأ في حساب σ_max لحالة BMK-03.

#### 20.1.6 bColumnMm و hColumnMm hardcoded

في `structural-concrete-core.ts` السطر 168-169:
```typescript
const bColumnMm = 400; // افتراضي — يجب أن يكون مدخلاً
const hColumnMm = 400;
```

هذا قد يُسبب أخطاء في فحص القص الثاقب للمنشآت ذات الأعمدة المختلفة.

#### 20.1.7 omega hardcoded في blast-pressure-core.ts

في `blast-pressure-core.ts` السطر 99:
```typescript
const omega = 100; // rad/s — قيمة مرجعية مؤقتة
```

هذا قد يُسبب فشل `dynamicConditionMet` للحالات غير المرجعية.

#### 20.1.8 صيغة وزن الحديد في geometry-comparator.ts

```typescript
steelWeightTon: results[g].requiredSteelAreaCm2PerMeter *
                0.00785 *
                results[g].requiredThicknessMeters *
                7850 / 1000
```

تحليل الأبعاد:
- `As (cm²/m) × 0.00785 (?) × thickness (m) × 7850 (kg/m³) / 1000`
- الناتج: cm² × m × kg/m³ = cm²·kg/m² (وحدة غير صحيحة لطن)

الصيغة تحتاج مراجعة وحدوية. الصيغة الصحيحة تقريباً:
```
steelWeight (kg/m) = As (cm²) × 0.0001 (m²/cm²) × 7850 (kg/m³) = As × 0.785
steelWeightTon (per m length) = steelWeight × length / 1000
```

### 20.2 نقاط قوة المحرك

1. **فصل المحركات**: كل محرك له وظيفة واحدة مع pure functions قابلة للاختبار.
2. **نظام القيم المقفلة**: يحمي من الانحراف عن المرجع الذهبي.
3. **التحقق من المدخلات (Zod)**: طبقة دفاع أولى.
4. **التتبع الكامل للاعتماديات**: `UNIFIED_VARIABLE_TABLE` يوفر graph كامل.
5. **Benchmarks شاملة**: تغطي السيناريوهات المنخفضة والمتوسطة والحرجة.
6. **دعم الأسلحة المتعدد**: 14 أمريكية + 3 روسية.

### 20.3 توصيات للتحسين

| الأولوية | التوصية |
|--------|--------|
| حرج | توحيد مصدر الأسلحة (JSON أو BOMB_DATABASE) |
| حرج | توحيد قيمة h_pr المرجعية بين الملفات |
| حرج | إزالة hardcoded omega=100 في blast-pressure-core |
| حرج | إزالة hardcoded bColumnMm=400 في structural-concrete-core |
| عالي | استخدام penetration.cEffective في orchestrator بدلاً من إعادة الحساب |
| عالي | إضافة granite_gneiss إلى STRESS_COEFFICIENTS |
| عالي | مراجعة صيغة وزن الحديد في geometry-comparator |
| متوسط | تنفيذ الاستيفاء الكامل لـ eta في blast-loads |
| متوسط | اشتقاق max_bv الكامل بدلاً من استخدام القيمة المرجعية |
| متوسط | ملء قيم BMK-01 و BMK-03 من Excel |
| منخفض | توثيق صيغة Rbd = RbH × 1.25 × 1.25 / 10 (لماذا القسمة على 10؟) |

---

## ملخص نهائي

منصة **المدقق الديناميكي الموحد V3.0** هي حزمة حسابية متقدمة لحماية المنشآت من الانفجارات. تتبع المنصة معمارية "محرك واحد لكل خطوة" مع منسّق يربط المحركات ببعضها. كل محرك يحقق معادلات مرجعية من الأطروحة العلمية (Eq. 1-19) ويتحقق من النتائج مقابل BMK-02 (المرجع الذهبي المقفل).

**المحركات الرئيسية الأربعة:**
1. `penetration-core.ts` — الاختراق (Eq. 13-19)
2. `blast-pressure-core.ts` — الضغط العصفي (Eq. 1-12, سادوفسكي)
3. `structural-concrete-core.ts` — التصميم الإنشائي (الكود السوري + UFC)
4. `geometry-comparator.ts` — المفاضلة بين الأشكال

**المحركات الثانوية:**
- `blast-loads.ts` — نسخة موسعة للضغط مع التحقق من BMK-02
- `structural.ts` — نسخة موسعة للتصميم (الخطوات 7-8)
- `rebar.ts` — تصميم التسليح التفصيلي
- `validators.ts` — التحقق من المدخلات (Zod)
- `weapons-library.ts` — بنك الأسلحة

**خط الأنابيب الكامل:**
```
مدخلات → تحقق → اختراق → ضغط → تصميم (3 أشكال) → مفاضلة → قرار
```

**Benchmarks:**
- BMK-01: اختراق منخفض (FAB-250 + SOFT_SOIL) — TODO
- BMK-02: مرجع ذهبي مقفل (MK83 + MEDIUM_SOIL) — مكتمل
- BMK-03: حالة حرجة (FAB-1500 + HARD_ROCK) — TODO

المنصة جاهزة للإنتاج مع بعض التحسينات المطلوبة (راجع القسم 20.3).

---

**نهاية التحليل**
