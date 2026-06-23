# منصة المدقق الديناميكي الموحد V3.0 — تحليل شامل لصفحات لوحة التحكم والمكونات

> **منصة المدقق الديناميكي الموحد V3.0** (Unified Dynamic Auditor Platform V3.0)
> نظام تحقق إنشائي متكامل لتدقيق تصميم المنشآت الحمائية (تحصينات) ضد الأحمال الديناميكية الناتجة عن الانفجارات.
> يطبق المنصة الكود الإنشائي السوري 2024 + معايير UFC 3-340-02.
> المرجع الذهبي المقفل: **BMK-02 (MK83 + MEDIUM_SOIL)**.
> أنبوب المعالجة: 8 خطوات (Step 2 → Step 8).
> اللغة: العربية (RTL) | الثيم: داكن (slate-950) | الإطار: Next.js 16 + React 19 + Tailwind 4 + shadcn/ui.

---

## فهرس المحتويات

1. [نظرة عامة المعمارية](#1-نظرة-عامة-المعمارية)
2. [Layout — هيكل لوحة التحكم](#2-layout--هيكل-لوحة-التحكم)
3. [AppSidebar — شريط التنقل الجانبي](#3-appsidebar--شريط-التنقل-الجانبي)
4. [Dashboard الرئيسية](#4-dashboard-الرئيسية-الصفحة-الأم)
5. [صفحة الاختراق Penetration (Step 3)](#5-صفحة-الاختراق-penetration-step-3)
6. [صفحة أحمال الانفجار Blast-Loads (Step 5)](#6-صفحة-أحمال-الانفجار-blast-loads-step-5)
7. [صفحة التصميم الإنشائي Structural-Design (Step 7 & 8)](#7-صفحة-التصميم-الإنشائي-structural-design-step-7--8)
8. [صفحة تصميم التسليح Rebar-Design](#8-صفحة-تصميم-التسليح-rebar-design)
9. [صفحة المفاضلة الهندسية Comparison](#9-صفحة-المفاضلة-الهندسية-comparison)
10. [صفحة اختبارات المرجعية Benchmark](#10-صفحة-اختبارات-المرجعية-benchmark)
11. [صفحة جدول المتغيرات Variables](#11-صفحة-جدول-المتغيرات-variables)
12. [صفحة غرفة التحكم RTM](#12-صفحة-غرفة-التحكم-rtm)
13. [صفحة التقارير Reports](#13-صفحة-التقارير-reports)
14. [صفحة الإعدادات Settings](#14-صفحة-الإعدادات-settings)
15. [صفحة حول المنصة About](#15-صفحة-حول-المنصة-about)
16. [المكون: V3EngineForm](#16-المكون-v3engineform)
17. [المكون: PipelineTimeline](#17-المكون-pipelinetimeline)
18. [المكون: ResultsPanel](#18-المكون-resultspanel)
19. [المكون: EngineeringForm](#19-المكون-engineeringform)
20. [المكون: RtmDashboardController](#20-المكون-rtmdashboardcontroller)
21. [المكون: AuditTrailEnhanced](#21-المكون-audittrailenhanced)
22. [المكون: VariableTraceabilityMatrix](#22-المكون-variabletraceabilitymatrix)
23. [المكون: AdminDashboardV2](#23-المكون-admindashboardv2)
24. [خلاصة الجداول المرجعية والقيم المقفلة](#24-خلاصة-الجداول-المرجعية-والقيم-المقفلة)

---

## 1. نظرة عامة المعمارية

**النمط المعماري:** Server Shell + Client Islands.
- صفحات Next.js معظمها خوادم رفيعة (Server Shell) تفوض كل العمل إلى "جزيرة عميل" (Client Island) محملة بـ `'use client'`.
- جميع البيانات الحية تُقرأ من **IndexedDB (Dexie)** محلياً في المتصفح — لا استدعاءات API لجلب البيانات اليومية.
- المحرك الحسابي `runEngine` يعمل **مزامناً في العميل** (synchronous client-side) مع تأخيرات بصرية محاكية لخط الأنابيب.
- الحوكمة الحساسة فقط (تسجيل الدخول، إدارة المستخدمين، قفل خط الأساس) تتم عبر **Server Actions** (`/app/actions/auth.actions` و `/app/actions/admin.actions`).
- الاختبارات المرجعية تُشغّل عبر API REST: `POST /api/benchmark` و `GET /api/comparison`.
- حفظ النتائج يتم محلياً عبر `projectRepository.createProject()` على IndexedDB.

**خط الأنابيب الحسابي الموحد (7 خطوات):**
| Step | الاسم العربي | القيم المقفلة الناتجة |
|------|--------------|------------------------|
| 2 | المدخلات والاستيفاءات | — (مدخلات فقط) |
| 3 | الاختراق | C_ef, h_pr, R_actual, Zp |
| 4 | القفل الأولي | Hp, Hc, Hf, Hvct |
| 5 | أحمال الانفجار | Pmax, P_ekv, Pp, ω, τ_ef |
| 6 | معاملات الجدول ب | — (استيفاءات B-1→B-6) |
| 7 | تصميم السقف | Mp_roof, Hp_final |
| 8 | تصميم الجدار | Hc_final, Hf_final, Hvct_final |

---

## 2. Layout — هيكل لوحة التحكم

**الملف:** `src/app/dashboard/layout.tsx`
**المسار:** `/dashboard/*` (يلتف حول كل صفحات dashboard)

### المكونات المعروضة
- `SidebarProvider` (shadcn/ui) — يحوي الشريط الجانبي ومنطقة المحتوى.
- `AppSidebar` — على اليمين (RTL).
- `SidebarInset` — المنطقة الرئيسية مع خلفية `bg-slate-950`.
- شريط أدوات علوي (header) بارتفاع 14 (3.5rem):
  - زر `SidebarTrigger` لفتح/إغلاق الشريط الجانبي.
  - فاصل عمودي.
  - عنوان نصي ثابت "المدقق الديناميكي الموحد".
- منطقة محتوى الصفحة الديناميكية (children) داخل `<div className="flex-1 p-6 overflow-y-auto">`.
- `PWARegister` — مسجل Service Worker (Serwist) للعمل أوفلاين.

### الميتاداتا
- `title`: "لوحة التحكم | المدقق الديناميكي الموحد"
- `description`: "إطار الحوكمة والمطابقة العددية للمنشآت والتحصينات الإنشائية"

---

## 3. AppSidebar — شريط التنقل الجانبي

**الملف:** `src/components/app-sidebar.tsx`
**النوع:** Client Component (يستخدم `usePathname`).

### البنية
- `Sidebar` من shadcn/ui بوضع `side="right"` (RTL) و `collapsible="icon"` (قابل للطي إلى أيقونات).
- **رأس الشريط (SidebarHeader):** أيقونة `Scan` (emerald-400) + عنوان "المدقق الديناميكي" + بادج `V3.0`.

### عناصر التنقل (12 عنصر + 1 عنصر إداري):

| الترتيب | الاسم | الرابط | الأيقونة |
|---------|-------|--------|----------|
| 1 | لوحة التحكم | `/dashboard` | Home |
| 2 | الاختراق | `/dashboard/penetration` | Target |
| 3 | أحمال الانفجار | `/dashboard/blast-loads` | Waves |
| 4 | التصميم الإنشائي | `/dashboard/structural-design` | Building2 |
| 5 | تصميم التسليح | `/dashboard/rebar-design` | Wrench |
| 6 | المفاضلة الهندسية | `/dashboard/comparison` | BarChart3 |
| 7 | اختبارات المرجعية | `/dashboard/benchmark` | FlaskConical |
| 8 | جدول المتغيرات | `/dashboard/variables` | Table |
| 9 | مصفوفة المتطلبات RTM | `/dashboard/rtm` | Shield |
| 10 | التقارير | `/dashboard/reports` | FileText |
| 11 | الإعدادات | `/dashboard/settings` | Settings |
| 12 | حول المنصة | `/dashboard/about` | Info |
| (منفصل) | لوحة المدير | `/admin` | Crown (amber) |

### الحالة النشطة
- العنصر النشط: خلفية `bg-slate-800`, لون `text-emerald-400`, حد أيمن `border-r-2 border-emerald-500`.
- العنصر الإداري النشط: لون `amber-400` بحد `border-amber-500`.

### التذييل (SidebarFooter)
- `NetworkStatus` — مؤشر حالة الشبكة (يظهر في الوضع الموسع).
- في الوضع المطوي: نقطة خضراء نابضة `size-2 rounded-full bg-emerald-500 animate-pulse`.

### المقابض
- `SidebarRail` لتغيير حجم الشريط الجانبي.

---

## 4. Dashboard الرئيسية (الصفحة الأم)

**الملف:** `src/app/dashboard/page.tsx`
**المسار:** `/dashboard`
**النوع:** Client Component (يستخدم `runEngine` مباشرة في المتصفح).

### 1) العنوان والوصف
- أيقونة `Shield` (amber-400).
- العنوان: "منصة المدقق الديناميكي الموحد V3.0".
- الوصف بخط مونوسبيس: "خط الحساب: المدخلات → الاختراق → الضغط → التصميم → المقارنة → القرار".
- بادج حالة عامة (`overallStatus`):
  - `idle`: "جاهز" (slate)
  - `running`: "جاري الحساب" (sky, نبض)
  - `success`: "مكتمل بنجاح" (emerald)
  - `partial`: "نجاح جزئي" (amber)
  - `failed`: "فشل" (red)

### 2) استمارة المحرك `V3EngineForm`
- انظر القسم 16 لتفاصيل كاملة.
- تستدعي `handleCalculate(input: EngineInput)` الذي يستدعي بدوره `runEngine(input)` من `@/lib/engine/orchestrator`.
- العائد: `EngineOutput` يحتوي على `intermediates`, `structural`, `comparison`, `warnings`, `status`.

### 3) خط أنابيب الحساب `PipelineTimeline`
- انظر القسم 17 لتفاصيل كاملة.
- يعرض 7 بطاقات (Steps 2-8) مع تأخيرات محاكية:
  - Step 2: 200ms
  - Step 3: 600ms
  - Step 4: 500ms
  - Step 5: 800ms
  - Step 6: 400ms
  - Step 7: 700ms
  - Step 8: 600ms
- يعرض القيم الرئيسية المنتجة في كل خطوة عند نجاحها.

### 4) بطاقات الملخص الأربع (SummaryCard)
بعد إكمال المحرك، تُعرض 4 بطاقات:
1. **عمق الاختراق** — `h_pr` (م) — أيقونة Crosshair (amber).
2. **الضغط التصميمي سقف** — `Pp_roof` (kg/cm²) — أيقونة ArrowDownFromLine (emerald). القيمة المحسوبة: `pDesignMpa * 10.197`.
3. **الضغط التصميمي جدار** — `Pp_wall` (kg/cm²) — أيقونة Target (sky).
4. **سماكة السقف النهائية** — `Hp_final` (سم) — أيقونة Layers (violet). القيمة: `requiredThicknessMeters * 100`.

### 5) جدول نتائج الاختراق
جدول أفقي بصف واحد يعرض 8 أعمدة:
| λ₁ | λ₂ | n_exp | C_ef (كجم) | τ (م) | h_pr (م) | R_actual (م) | Zp |
- λ₁، λ₂: معامِلات شكل الرأس والقطر.
- n_exp: أُس التأثير.
- C_ef: الشحنة الفعالة (كجم).
- τ: معامل زاوية الاختراق (م).
- h_pr: عمق الاختراق (م).
- R_actual: `h_pr + ceilingDepth` (م).
- Zp: البعد المختزل.

### 6) نتائج الانفجار — جدولين متجاورين (مسار السقف ومسار الجدار)
كل جدول `BlastPathTable` يعرض 8 صفوف:
| الرمز | الوصف | الوحدة |
|-------|-------|--------|
| ω | التردد الدائري | rad/s |
| τ_ef | الزمن الفعال | s |
| Pmax | الضغط الأقصى | kg/cm² |
| P_ekv | الضغط المكافئ | kg/cm² |
| Pct | ضغط الشد | kg/cm² |
| Pp | الضغط التصميمي | kg/cm² |
| Kd | معامل الديناميكية | — |
| kψ | معامل psi | — |

- **مسار السقف:** kd=0.92, kpsi=0.9, τ_ef من المحرك، Pmax=pReflectedMpa, Pp=pDesignMpa×10.197.
- **مسار الجدار:** kd=1.0, kpsi=0.85, Pmax=pReflectedMpa×1.36, τ_ef=pEffective×0.26, Pp=pDesignMpa×7.7.

### 7) النتائج الإنشائية — 3 بطاقات هندسية
ثلاث بطاقات: `RECTANGULAR` (مستطيل), `CIRCULAR` (دائري), `ARCHED` (مقوس).
كل بطاقة تعرض:
- حالة التحقق (status + أيقونة + لون):
  - `SUCCESS`: "مقبول" (emerald)
  - `WARNING`: "تحذير" (amber)
  - `FAILURE`: "مرفوض" (red)
- السماكة المطلوبة (م).
- مساحة التسليح (سم²/م).
- نسبة المطاوعة (—).
- نسبة اللامركزية e/h.
- نسبة القص الثاقب.
- نسبة التسليح.
- قائمة الإخفاقات `validation.failures` (إن وجدت).

### 8) مقارنة الأشكال الهندسية
- بطاقة المقطع الموصى به (emerald-950/20) مع `recommendedGeometry` و `explanation`.
- جدول مصفوفة المقارنة لكل شكل (3 صفوف):
  - السماكة (م)
  - وزن الحديد (طن)
  - حجم الخرسانة (م³)
  - العزم الأقصى (kN.m)
  - حالة الأمان (آمن/تحذير/غير آمن)
- الصف الموصى به مظلل `bg-emerald-950/10` مع بادج "موصى".

### 9) تحذيرات المحرك
بطاقة `bg-amber-950/20 border-amber-800/40` تعرض قائمة `engineResult.warnings`.

### 10) زر حفظ النتائج محلياً
- يستدعي `projectRepository.createProject(name, summary)`.
- الاسم: `V3.0 — {date} {time}`.
- الملخص: `h_pr={value}م | Pp={value} MPa | حالة: {status}`.
- 4 حالات للزر: idle, saving, saved, error.

### 11) مقارنة المرجع المقفل BMK-02
جدول كبير بـ 9 صفوف (`REFERENCE_COMPARISON_ENTRIES`) يقارن القيم المحسوبة بالمرجعية:
| المتغير | الوصف | المرجع | المحسوب | الانحراف | الحالة |
- الصفوف: h_pr, C_ef, R_actual, Zp, λ₁, λ₂, Pp_roof, Pp_wall, Hp_final.
- حساب الانحراف: `((computed - reference) / abs(reference)) * 100`.
- الألوان: <1% مطابق (emerald), <5% انحراف (amber), ≥5% مخالف (red).

### 12) استخلاص القيم الرئيسية لخط الأنابيب (extractKeyValues)
دالة محلية تستخرج القيم لكل خطوة:
- **Step 3:** {C_ef, h_pr, Zp}
- **Step 4:** {Hp, Pp_roof}
- **Step 5:** {Pmax, P_ekv, Pp, tau_ef} (محول لـ kg/cm²)
- **Step 7:** {Mp_roof, Hp_final}
- **Step 8:** {Hc_final, Hvct_final}

### دوال مساعدة
- `fmt(val, digits=4)` — تنسيق رقمي ذكي حسب الحجم.
- `fmtPct(val)` — "±X.XX%".
- `deviationColor(pct)` — emerald/amber/red.
- `validationColor(status)` / `validationBg(status)` — ألوان حسب الحالة.
- `geoLabelAr(geo)` — ترجمة الأنواع إلى عربي.
- `calcDeviation(computed, reference)` — حساب النسبة.

### API/Engine المستدعاة
- `runEngine(input: EngineInput): EngineOutput` من `@/lib/engine/orchestrator`.
- `projectRepository.createProject()` لل حفظ في IndexedDB.

---

## 5. صفحة الاختراق Penetration (Step 3)

**الملف:** `src/app/dashboard/penetration/page.tsx`
**المسار:** `/dashboard/penetration`

### 1) العنوان والأزرار
- أيقونة `Target` (emerald).
- العنوان: "محرك الاختراق — الخطوة 3".
- الوصف: "حسابات الاختراق والشحنة الفعالة — المرجع الذهبي BMK-02 (MK83 + MEDIUM_SOIL)".
- بادج "BMK-02 LOCKED" (emerald).
- زر "تشغيل المحرك" (emerald) — يستدعي `handleRunEngine`.

### 2) بطاقة ملخص المدخلات BMK-02
بطاقة `BookOpen` تعرض شبكة بـ 6 خلايا للمدخلات:
| السلاح | نوع التربة | سرعة الاصطدام | زاوية الاصطدام | عمق السقف | وزن الشحنة |
- السلاح: اسم السلاح (من `getWeaponById('W_MK83')`).
- التربة: اسم التربة (من `getSoilByCode('MEDIUM_SOIL')`).
- V = `STEP2_INPUTS.V` (m/s).
- α = `STEP2_INPUTS.alpha` (درجة).
- Z = `STEP2_INPUTS.Z` (m).
- C = `STEP2_INPUTS.C` (kg).

ثم فاصل وشبكة ثانية بـ 7 معاملات بحث:
| K₁ | Kpr_g | Kpr_b | m₁ | RbH | RsH | R̄ |

### 3) النتائج الرئيسية — 4 بطاقات KeyResultCard
1. **عمق الاختراق** `h_pr` (m) — `STEP3_PENETRATION.h_pr` — أيقونة ArrowDownFromLine (مفتاحية، emerald).
2. **الشحنة الفعالة** `C_ef` (kg) — أيقونة Atom.
3. **البعد الفعلي** `R_actual` (m) — أيقونة Ruler.
4. **البعد المختزل** `Zp` (—) — أيقونة Layers.

### 4) تبويبات ثلاثية (Tabs)
#### أ) جدول المعاملات
جدول بـ 9 صفوف مع 5 أعمدة (المعامل | الرمز | القيمة | الوحدة | المعادلة):
| المعامل | الرمز | المعادلة |
|--------|-------|----------|
| معامل شكل الرأس | λ₁ | 0.5 + 0.4×(Lh/D)^0.666 |
| معامل تأثير القطر | λ₂ | 2.8×d^0.333 − 1.3×d^0.5 |
| أُس التأثير | n | 3.5 − Lh/D |
| معامل زاوية الاختراق | τ | 0.5×lₖ×cos((α+nα)/2) |
| العمق الصافي | h_z | h_pr − τ |
| العمق المختزل | h̄_z | h_z / ∛C_ef |
| فرق العمق | Y_diff | Z − h_pr |
| سماكة التدمير | h_b(dest) | — |
| سماكة التشقق | h_b(crack) | — |

#### ب) مقارنة BMK-02 المرجعية
- شريط ملخص الانحرافات: أقصى انحراف، متوسط الانحراف، ضمن التسامح (X/13).
- جدول مقارنة بـ 13 صفًا يحسب `deviationPct` لكل معامل.
- دليل ألوان: <1% (emerald مطابقة ممتازة), <5% (amber ضمن التسامح), ≥5% (red خارج التسامح).
- زر "تشغيل المحرك الآن" يظهر إذا لم يتم التشغيل بعد.

#### ج) المعادلات المرجعية
5 بطاقات معادلات (Eq.13, Eq.14, Eq.15, Eq.17, Eq.19):
- كل بطاقة تعرض: رقم المعادلة (بادج)، اسم المعادلة، الصيغة `dir="ltr"` (في صندوق slate-950/50)، الشرح العربي، القيمة المحسوبة، تعويضات المعادلة.
- **Eq.13 (المعادلة الرئيسية):** `x₁ = λ₁ × λ₂ × Kpr × (P/d²) × V × cos(α)` — محاطة بـ ring-emerald.
- **Eq.14:** `λ₁ = 0.5 + 0.4 × (Lh/D)^(2/3)`.
- **Eq.15:** `λ₂ = 2.8 × d^(1/3) − 1.3 × d^(1/2)`.
- **Eq.17:** `τ = 0.5 × lₖ × cos((α + n×α)/2)`.
- **Eq.19:** `C_eff = 0.95 × K₁ × C`.
- 4 قيم مشتقة إضافية في شبكة: h_z, h̄_z, Y_diff, Zp.

### 5) تحذيرات المحرك
بطاقة amber تعرض `engine.warningMessages` إن وجدت.

### 6) شرح النتائج
بطاقة `BookOpen` تعرض `engine.explanation`.

### API/Engine المستدعاة
- `calculatePenetration(input: PenetrationInput): PenetrationOutput` من `@/lib/engine/penetration-core`.
- `getWeaponById('W_MK83')` و `getSoilByCode('MEDIUM_SOIL')` من `@/lib/engine/constants`.
- الثوابت المرجعية: `STEP3_PENETRATION`, `STEP2_INPUTS`, `STEP2_LOOKUPS`, `STEP2_GEOMETRY`.

### حسابات مستخدمة محلية
- `computeExtendedResults()`: يحسب hz, hzBar, yDiff, rActual, zp, hbDest, hbCrack.
- `rActual = sqrt(Z² + h_pr² + (a_et + ap/2)² × 0.3)`.
- `zp = rActual / ∛C_ef`.
- `hbDest = h_pr × (1 + soilData.destructionCoeff)` (افتراضي: ×1.1).
- `hbCrack = h_pr × (1 + soilData.crackingCoeff)` (افتراضي: ×1.3).

---

## 6. صفحة أحمال الانفجار Blast-Loads (Step 5)

**الملف:** `src/app/dashboard/blast-loads/page.tsx`
**المسار:** `/dashboard/blast-loads`

### 1) العنوان والأزرار
- أيقونة `Waves` (sky) داخل صندوق sky-500/10.
- العنوان: "أحمال الانفجار — الخطوة 5".
- بادج "تم التشغيل" يظهر بعد التشغيل.
- زر "إعادة تعيين" (RotateCcw) و "تشغيل المحرك" (Play).

### 2) ملخص سريع علوي — 4 بطاقات صغيرة
| Pmax السقف | Pp السقف | Pmax الجدار | Pp الجدار |
القيم بـ kg/cm²، الألوان: السقف sky، الجدار orange.

### 3) تبويبات: مسار السقف / مسار الجدار
- مسار السقف: لون sky.
- مسار الجدار: لون orange.

### 4) محتوى كل تبويب (PathTabContent)
#### أ) 4 بطاقات KeyResultCard كبيرة
1. **الضغط الأقصى** `Pmax` (kg/cm²) — Gauge.
2. **الضغط المكافئ** `P_ekv` (kg/cm²) — ArrowUpFromLine.
3. **ضغط التصميم** `Pp` (kg/cm²) — ShieldCheck.
4. **التردد الدائري** `ω` (rad/s) — Activity.
كل بطاقة تعرض: القيمة، الرمز، القيمة المرجعية، نسبة الانحراف ببادج ملوّن.

#### ب) جدول معاملات الزمن (4 صفوف)
| زمن الطور الموجب | τ | s |
| الزمن الفعال | τ_ef | s |
| الزمن الطبيعي | τ_n | s |
| السرعة الديناميكية | C_dyn | m/s |

#### ج) جدول معاملات البعد (5 صفوف)
| البعد المكافئ | R_ekv | m |
| البعد النجمي | R* | m |
| النسبة المختزلة | h̄ | — |
| البعد المختزل B1 | R̄_b1 | — |
| شرط R_ekv > R* | ✓/✗ | — |

#### د) المعاملات الإنشائية (StructuralCoefficientsCard)
جدول بـ 7 صفوف:
| المطاوعة الإنشائية | μ_struct | — |
| معامل الكفاءة | η | — |
| مقاومة القص الديناميكية | Rsd | kg/cm² |
| مقاومة الانحناء | Rbd | kg/cm² |
| معامل الضغط | Kp | — |
| معامل الديناميكية | Kd | — |
| معامل psi | kpsi | — |

#### هـ) مقارنة BMK-02 (BMK02ComparisonCard)
- شريط نسبة المطابقة (`Progress`) بقيمة okCount/totalCount.
- 3 بادجات: okCount مطابق, warnCount تحذير, failCount انحراف.
- جدول بـ 15 صفًا (15 مفتاح من BlastLoadOutput) يقارن: المحسوب/المرجع/الانحراف/الحالة.

### 5) تذييل معلوماتي
- "مرجع القياس: BMK-02 (MK83 + MEDIUM_SOIL)".
- عدد المتغيرات في STEP5_ROOF, STEP5_WALL, STEP6_ROOF, STEP6_WALL.

### API/Engine المستدعاة
- `calculateBlastLoad(input): BlastLoadOutput` من `@/lib/engine/blast-loads`.
- تُستدعى مرتين: مرة لمسار السقف ومرة لمسار الجدار.

### المدخلات المُمررة للمحرك
- مشتركة: `C_ef, h_pr, R_actual, Z, ap, bp, Ea, xi, RbH, RsH, gamma_b, gamma_g`.
- سقف: `Hp_cm: STEP4_LOCKED.Hp, Kpod: STEP6_ROOF.Kpod, R_bar_b1, a0z, a1z, Kp, Kd`.
- جدار: `Hp_cm: STEP4_LOCKED.Hc, Kpod: STEP6_WALL.Kpod, ...`.

### دوال مساعدة
- `fmt(val, 4)` و `fmtShort(val)` للتنسيق الذكي.
- `calcDeviation(computed, reference)` = `|computed − reference| / |reference| × 100`.
- `getDeviationStatus(pct)`: <1% ok, <5% warn, ≥5% fail.

---

## 7. صفحة التصميم الإنشائي Structural-Design (Step 7 & 8)

**الملف:** `src/app/dashboard/structural-design/page.tsx`
**المسار:** `/dashboard/structural-design`

### 1) العنوان
- أيقونة `Building2` (emerald).
- العنوان: "التصميم الإنشائي — الخطوتان 7 و 8".
- الوصف: "حساب سماكات السقف والجدار والأرضية وفق الكود السوري 2024 + UFC 3-340-02".
- بادجان: "BMK-02 LOCKED", "MK83 + MEDIUM_SOIL".

### 2) المقطع العرضي البصري (CrossSectionVisualization) — SVG
رسم SVG كامل لملجأ ب نفقين يعرض:
- **تربة تغطية** (صدأ/بني) فوق السقف.
- **السقف (Hp)** — مستطيل emerald (#10b981) مع hatch pattern، يعرض `Hp = X.XX cm` في المنتصف.
- **الجدار الأيسر (Hc)** — مستطيل blue (#3b82f6) مع hatch، يعرض `Hc = X.XX` (نص مدوّر -90°).
- **النفق الأيسر** — مستطيل أسود منقط، "نفق 1" + "ap m × bp m".
- **الجدار الداخلي (Hvct)** — مستطيل amber (#f59e0b) مع hatch، يعرض `Hvct = X` (مدوّر -90°).
- **النفق الأيمن** — مستطيل أسود منقط، "نفق 2" + الأبعاد.
- **الجدار الأيمن (Hc)** — مستطيل blue مع hatch.
- **الأرضية (Hf)** — مستطيل violet (#8b5cf6) مع hatch، يعرض `Hf = X.XX cm`.
- **أسهم أبعاد** عمودية وأفقية مع markers (arrowUp, arrowDown, arrowLeft, arrowRight) في `<defs>`.
- **وسيلة إيضاح الألوان** أسفل الرسم.

مقياس الرسم: `1 cm = 1.2 px`. الأبعاد تأتي من `STEP7_CEILING.Hp_final`, `STEP8_WALL.{Hc_final, Hf_final, Hvct_final}`, `STEP2_GEOMETRY.{ap, bp}`.

### 3) تبويبات: تصميم السقف (Step 7) / تصميم الجدار (Step 8)

#### تبويب تصميم السقف (Step 7)
**KeyResultCard رئيسية:** "سماكة السقف النهائية — الخطوة 7" `Hp_final` (cm) — emerald.

**سلسلة الحساب (CalcChainRow):** 4 صفوف:
1. `Mp` = `Pp × b × ap² × η / (8 × n₀)` — kg.cm — `STEP7_CEILING.Mp`.
2. `h₀` = `√(Mp / (Rbd × b × αm))` — cm.
3. `αm` = `μ_struct × RbH / RsH` — قيمة `ALPHA_M_ROOF`.
4. `Hp_final` = `h₀ × 1.05` — cm — (isFinal, emerald).

**بطاقة المدخلات المستخدمة (8 خلايا):** Pp (سقف), ap, bp, η (سقف), μ_struct, Rsd, Rbd, n₀.

**مقارنة BMK-02 (ceilingBenchmarkRows):** 5 صفوف: Mp, h₀, Hp_final, αm, μ_struct. التسامح 1%.

#### تبويب تصميم الجدار (Step 8)
**3 KeyResultCards:**
1. `Hc_final` (cm) — سماكة الجدار النهائية — blue.
2. `Hf_final` (cm) — سماكة الأرضية النهائية — violet.
3. `Hvct` (cm) — سماكة الجدار الداخلي — amber.

**سلسلة الحساب:** 4 صفوف:
1. `Mp_wall` = `Pp × b × ap² × η / (8 × n₀)` — kg.cm — `STEP8_WALL.Mp`.
2. `h₀_wall` = `√(Mp_wall / (Rbd × b × αm))` — cm — `H0_WALL = STEP8_WALL.Hc_final / 1.05`.
3. `Hf/Hp` = `Hf_final / Hp_final` — نسبة مئوية — `HF_HP_RATIO`.
4. `Hc_final` = `h₀ × 1.05` — cm — (isFinal).

**بطاقة المدخلات المستخدمة (8 خلايا):** Pp (جدار), ap, bp, η (جدار), μ_struct, Hp_final, Rbd, n₀.

**مقارنة BMK-02 (wallBenchmarkRows):** 4 صفوف: Mp_wall, Hc_final, Hf_final, Hvct_final. التسامح 1%.

### 4) تذييل ملخص القيم المقفلة من STEP4_LOCKED
4 بادجات: Hp, Hc, Hf, Hvct (cm) — emerald.

### الثوابت المشتقة محلياً
```typescript
const ALPHA_M_ROOF = STEP7_CEILING.mu_struct * STEP2_LOOKUPS.RbH / STEP2_LOOKUPS.RsH;
const ALPHA_M_WALL = STEP5_WALL.mu_struct * STEP2_LOOKUPS.RbH / STEP2_LOOKUPS.RsH;
const H0_WALL = STEP8_WALL.Hc_final / 1.05;
const HF_HP_RATIO = STEP8_WALL.Hf_final / STEP7_CEILING.Hp_final;
```

### API/Engine المستدعاة
- لا تستدعي محركاً مباشرةً — تعرض القيم المرجعية المقفلة من `STEP7_CEILING` و `STEP8_WALL`.
- العمليات الحسابية الوسيطة تُجرى محلياً في الـ module scope (ALPHA_M_*, H0_WALL, HF_HP_RATIO).

---

## 8. صفحة تصميم التسليح Rebar-Design

**الملف:** `src/app/dashboard/rebar-design/page.tsx`
**المسار:** `/dashboard/rebar-design`

### 1) العنوان
- أيقونة `Wrench` (teal) داخل صندوق teal-500/10.
- العنوان: "تصميم التسليح".
- الوصف: "حساب مساحة الحديد المطلوبة وفحص النسب الدنيا والقصوى — الكود السوري 2024 + UFC 3-340-02".
- بادج حالة عامة: "السقف والجدار: مقبول" أو "يوجد رفض" أو "يوجد تحذير".
- بادج "BMK-02".

### 2) تبويبات: تسليح السقف / تسليح الجدار
كل تبويب يعرض بادج حالة صغير (✓/⚠/✗).

### 3) محتوى كل تبويب (PathContent)
#### أ) 3 KeyResultCards رئيسية
1. **مساحة التسليح المطلوبة** `As` (cm²/m) — `data.As_required.toFixed(2)` — Sigma — emerald.
2. **نسبة التسليح الفعلية** `ρ` (%) — `data.rho * 100` — Layers — cyan.
3. **عدد القضبان والقطر** `n × Φ` (mm) — `data.barCount × data.barDiameter` — Ruler — amber.

#### ب) بطاقة اختيار القضبان (RebarSelectionCard)
4 صفوف:
- **نوع القضبان:** `Φ{barDiameter} @ {spacing} cm` — بادج `{barCount} × Φ{barDiameter}`.
- **المساحة المقدمة:** `A_s,provided = {As_provided} cm²/m` — بادج "كافية/غير كافية".
- **التباعد:** `s = {spacing} cm` — بادج `{barCount} قضيب/متر`.
- **شريط نسبة الاستفادة:** `(As_required / As_provided) × 100%` — لون متغير (amber/emerald/cyan).

#### ج) المقطع العرضي مع التسليح (CrossSectionDiagram) — SVG
رسم SVG بحجم 400×120 يعرض:
- خلفية خرسانية (slate-334155) مع hatch pattern.
- **منطقة الضغط** (أعلى المقطع) — مستطيل amber منقط "منطقة الضغط".
- **خط المحور المرن (Neutral Axis):** خط أحمر منقط `y = 10 + sectionHeight × (1 - ξ)` مع نص "N.A".
- **قضبان التسليح:** `barCount` دوائر emerald (#10b981) متوزعة على تباعد `spacing`.
- خط أفقي منقط يربط القضبان.
- أبعاد التباعد بين القضبان (s = X.X cm).
- بُعد `h₀` عمودي (sky — #38bdf8).
- التسميات: `b = 100 cm` و `{barCount}Φ{barDiameter} @ {spacing} cm`.
- نص يحدد المسار "السقف" أو "الجدار".

#### د) فحوصات التصميم (DesignChecksCard)
جدول بـ 4 فحوصات:
| الفحص | الشرط | القيمة | الحد | الحالة |
|-------|-------|--------|------|--------|
| نسبة التسليح الدنيا | ρ ≥ ρ_min | ρ (%) | ρ_min (%) | ✓/✗ |
| نسبة التسليح القصوى | ρ ≤ ρ_max | ρ (%) | ρ_max (%) | ✓/✗ |
| العمق النسبي | ξ ≤ ξ_max | ξ | ξ_max | ✓/✗ |
| المطاوعة | A_s,prov ≥ A_s,req | μ_struct | A_s,req (cm²/m) | ✓/✗ |

بادج شاملة: "جميع الفحوصات محققة" أو "يوجد فحوصات فاشلة".

#### هـ) ملاحظات المحرك (NotesCard)
قائمة ملاحظات مع تصنيف لوني:
- ERR* — red.
- WARN* — amber.
- OK* — emerald.
- غير ذلك — slate.

#### و) ملخص الحالة
بطاقة كبيرة تعرض:
- `OK` (emerald): "تصميم تسليح {pathLabel} يحقق متطلبات الكود السوري 2024 و UFC 3-340-02".
- `WARNING` (amber): "تصميم تسليح {pathLabel} يحتاج مراجعة — نسبة التسليح أقل من الحد الأدنى".
- `FAILURE` (red): "تصميم تسليح {pathLabel} لا يحقق متطلبات الكود — المقطع يحتاج توسيع".

### API/Engine المستدعاة
- `calculateRebarBothPaths(ceilingInput, wallInput, materialProps)` من `@/lib/engine/rebar`.
- يعيد `{ roof: RebarDesignOutput, wall: RebarDesignOutput }`.
- المدخلات للسقف: `{ Mp: STEP7_CEILING.Mp, h0: STEP7_CEILING.h0, Hp_final: STEP7_CEILING.Hp_final }`.
- المدخلات للجدار: `{ Mp: 10000000, h0: STEP8_WALL.Hc_final / 1.05, Hc_final: STEP8_WALL.Hc_final }`.
- المدخلات المواد: `{ Rsd: STEP5_ROOF.Rsd, Rbd: STEP5_ROOF.Rbd, mu_struct_roof, mu_struct_wall }`.

### الحقول المعروضة من RebarDesignOutput
- `As_required`, `As_provided`, `rho`, `rho_min`, `rho_max`, `xi`, `xi_max`.
- `minReinforcementOk`, `maxReinforcementOk`, `xiConditionOk`.
- `barCount`, `barDiameter`.
- `status` ('OK' | 'WARNING' | 'FAILURE').
- `notes[]`.

---

## 9. صفحة المفاضلة الهندسية Comparison

**الملف:** `src/app/dashboard/comparison/page.tsx`
**المسار:** `/dashboard/comparison`

### 1) العنوان
- أيقونة `BarChart3` (emerald) داخل صندوق emerald-500/10.
- العنوان: "المفاضلة الهندسية".
- الوصف: "مقارنة الأشكال الإنشائية الثلاثة — المرجع BMK-02".

### 2) مصفوفة المقارنة (جدول كبير)
جدول بـ 3 أعمدة للأشكال + عمود المعيار:
| المعيار | مستطيل | دائري | مقوّس |
|--------|--------|--------|-------|
| السماكة المطلوبة (m) | ... | ... | ... |
| وزن الحديد (طن) | ... | ... | ... |
| حجم الخرسانة (m³) | ... | ... | ... |
| العزم الديناميكي (kN.m) | ... | ... | ... |
| حالة الأمان | StatusBadge | StatusBadge | StatusBadge |

- القيم الأفضل لكل معيار مظللة emerald وبجوارها علامة ✓.
- الشكل الموصى به يحصل على أيقونة `Trophy` بجانب اسمه.
- GEOMETRY_COLORS: مستطيل sky, دائري amber, مقوّس violet.

### 3) بطاقة التوصية (ComparisonCard)
- صندوق emerald-500/5 بـ ring-1.
- عنوان: "الشكل المُوصى به: {recommendedGeometry}".
- شرح `explanation`.
- 3 بادجات: سماكة، حديد، خرسانة.
- ملخص تقييم لكل شكل: اسم + بادج "موصى" + StatusBadge.

### 4) المقاطع العرضية البصرية — 3 SVG diagrams
شبكة 3 أعمدة، كل عمود يعرض:
- **RectangularDiagram:** مستطيل sky (#38bdf8) مع سهم سماكة وسهم بحر.
- **CircularDiagram:** دائرتين متداخلتيـن amber (#fbbf24) — خارجية + داخلية منقطة + سهم سماكة بينهما + سهم قطر.
- **ArchedDiagram:** جدران جانبية + أرضية + قوس (path) violet (#a78bfa) + سهم سماكة وسهم بحر.

كل diagram يعرض `h={thickness}m` و `L={span}m` (أو `D` للدائري).
تحت كل diagram: قيم السماكة والبحر.

### 5) معايير اتخاذ القرار (الأوزان)
شبكة 4 بطاقات أوزان:
| السماكة | التسليح | الأمان | المطاوعة |
- كل بطاقة: أيقونة + اسم + قيمة الوزن (%) + شريط تقدم + شرح ("أخف = أفضل" إلخ).
- صيغة الدرجة الكلية: `(درجة السماكة × W1%) + (درجة التسليح × W2%) + (درجة الأمان × W3%) + (درجة المطاوعة × W4%)`.
- ملاحظة: "الأوزان قابلة للتعديل حسب أولويات التصميم".

### 6) ملخص المدخلات التصميمية
شبكة 5 خلايا:
| الضغط التصميمي (MPa) | البحر القصير (m) | البحر الطويل (m) | مقاومة الخرسانة (MPa) | إجهاد الحديد (MPa) |

### API/Engine المستدعاة
- `fetch('/api/comparison')` — استدعاء REST API.
- يعيد `ComparisonResponse`:
  ```typescript
  {
    comparison: GeometryComparisonReport;  // comparisonMatrix, recommendedGeometry, explanation
    structural: Record<GeometryType, SectionDesignResult>;
    weights: { thicknessWeight, steelWeight, safetyWeight, ductilityWeight };
    designInputs: { pDesignMpa, tunnelSpanShort, tunnelSpanLong, fcMpa, fyMpa };
  }
  ```

### الأنواع المستخدمة
- `GeometryType`: 'RECTANGULAR' | 'CIRCULAR' | 'ARCHED'.
- `ValidationStatus`: 'SUCCESS' | 'WARNING' | 'FAILURE'.
- `GeometryComparisonEntry`: thicknessMeters, steelWeightTon, concreteVolumeM3, maxDynamicMomentKnM, safetyStatus.

### الحالات
- `loading`: skeleton loader.
- `error`: بطاقة red مع رسالة الخطأ.

---

## 10. صفحة اختبارات المرجعية Benchmark

**الملف:** `src/app/dashboard/benchmark/page.tsx`
**المسار:** `/dashboard/benchmark`

### 1) العنوان والأزرار
- أيقونة `FlaskConical` (emerald) داخل صندوق emerald-900/30.
- العنوان: "اختبارات المرجعية".
- الوصف: "تشغيل والتحقق من حالات الاختبار المرجعية للمحرك".
- زر "تشغيل جميع الاختبارات" (emerald) — يستدعي `runAllBenchmarks()`.

### 2) بطاقات الاختبارات (BENCHMARK_SUITE)
شبكة 3 أعمدة، كل بطاقة تعرض:
- معرف الاختبار `bmk.id` (مونوسبيس).
- بادج "🔒 مقفل" إن كان `bmk.isLocked`.
- بادج الأولوية (3 مستويات):
  - 1 (حرج) — red.
  - 2 (مهم) — amber.
  - 3 (عادي) — slate.
- عنوان الاختبار `bmk.title`.
- 3 خلايا: السلاح `weaponId`, السرعة `impactVelocity m/s`, التربة `soilTypeCode`.
- بعد التشغيل: بادج حالة النجاح "X/Y نجح".

### 3) عرض الأخطاء
بطاقة red-950/50 إن وجد `error`.

### 4) بطاقات الإحصائيات الكلية (4 بطاقات)
بعد التشغيل:
| إجمالي الفحوصات | نجح | فشل | أقصى انحراف (%) |

### 5) جدول النتائج الموحد
جدول بـ 5 أعمدة لكل نتيجة:
| الرمز (مع معرّف الاختبار) | القيمة المتوقعة | القيمة المحسوبة | الانحراف (%) | الحالة (✓/✗) |

### 6) تفاصيل كل اختبار (Collapsible)
- لكل benchmark: بطاقة قابلة للطي.
- العنوان: أيقونة النجاح/الفشل + معرّف الاختبار + العنوان + ملخص "X نجح / Y فشل / أقصى انحراف Z%".
- عند التوسيع: جدول تفصيلي لكل نتيجة.
- صندوق "ملاحظات المحرك" `bmk.engineNotes` إن وجدت.

### API/Engine المستدعاة
- `fetch('/api/benchmark', { method: 'POST', body: JSON.stringify({ ids: BENCHMARK_SUITE.map(b => b.id) }) })`.
- يعيد `{ reports: BenchmarkRunReport[], overall: OverallSummary }`.

### OverallSummary
```typescript
{
  totalBenchmarks: number;
  totalChecks: number;
  totalPassed: number;
  totalFailed: number;
  maxDeviationPercent: number;
  allPassed: boolean;
}
```

### BenchmarkResult
- `symbol`, `expectedValue`, `actualValue`, `deviationPercent`, `passed`.

### دوال مساعدة
- `formatNumber(n)`: تنسيق ذكي (exponential للأعداد الكبيرة جداً).

---

## 11. صفحة جدول المتغيرات Variables

**الملف:** `src/app/dashboard/variables/page.tsx`
**المسار:** `/dashboard/variables`

### 1) العنوان
- أيقونة `TableIcon` (emerald).
- العنوان: "جدول المتغيرات الموحد".
- الوصف: "جميع المتغيرات في النموذج الموحد ({stats.total} متغير)".

### 2) بطاقات إحصائية (5 بطاقات)
| إجمالي المتغيرات | المتغيرات المقفلة | المدخلات | المحسوبة | المخرجات |

### 3) أدوات الفلترة (Card)
- **فلتر التصنيف** (Select): الكل / مدخلات / بحث / محسوبة / مقفلة / مخرجات.
- **فلتر الخطوة** (Select): الكل / 2-8 مع تسمياتها.
- **فلتر المسار** (Select): الكل / مشترك / سقف / جدار.
- **مفتاح إظهار المقفلة فقط** (Switch) — red-700 عند التفعيل.
- بادج بعدد المتغيرات المعروضة.

### 4) جدول المتغيرات (9 أعمدة)
| الاسم | الرمز | الوصف | الوحدة | المصدر | التصنيف | الخطوة | المسار | مقفل |

- التصنيف بـ 5 فئات بألوان مختلفة:
  - `input` (مدخلات) — sky.
  - `lookup` (بحث) — teal.
  - `computed` (محسوبة) — amber.
  - `locked` (مقفلة) — red.
  - `output` (مخرجات) — emerald.
- المسار: shared (slate), roof (sky), wall (amber).
- مقفل: 🔒 أو —.
- الجدول قابل للتمرير بحد أقصى `max-h-[600px]`.

### 5) سجل القيم المقفلة (LOCKED_REGISTRY) — Collapsible
جدول بـ 6 أعمدة:
| المفتاح | القيمة | خطوة المنشأ | خطوات الاستهلاك | المسار | التسامح (%) |

### المصادر
- `UNIFIED_VARIABLE_TABLE`, `LOCKED_REGISTRY`, `getVariablesByCategory()`, `getVariablesByStep()`, `getVariablesByPath()`, `getLockedVariables()`, `isLocked()` من `@/lib/constants/reference-data`.
- النوع `VariableDefinition` من `@/types/engine`.

### VariableDefinition
الحقول: `name`, `symbol`, `descriptionAr`, `unit`, `source`, `category`, `step`, `path`, `locked`, `dependsOn[]`.

### دالة تنسيق
- `formatLockedValue(n)`: تنسيق ذكي للأرقام (exponential للأعداد > 10⁷).

---

## 12. صفحة غرفة التحكم RTM

**الملف:** `src/app/dashboard/rtm/page.tsx`
**المسار:** `/dashboard/rtm`
**النوع:** Server Component + Server Action.

### 1) العنوان
- العنوان: "مركز التدقيق ومصفوفة المطابقة الحية (RTM Audit Room)".
- الوصف: منصة معزولة ومقفلة تضمن التوافق المطلق للمعادلات البرمجية مع معايير الكود الإنشائي السوري 2024 ومعايير UFC 3-340-02. تدعم تتبع المتغيرات من المدخلات إلى المخرجات والتحقق من القيم المقفلة.
- بادج "Operational Mode: Active UAT Pipeline".

### 2) Server Action محمي
```typescript
async function runLiveBenchmarksAction() {
  'use server';
  try {
    return {
      success: true,
      timestamp: Date.now(),
      deviation: 0.0,
      checkedScenariosCount: 0,
    };
  } catch (error) {
    return { success: false, error: 'ERR-SERVER-ACTION-409' };
  }
}
```

### 3) المكون الحاكم `RtmDashboardController`
يُمرَّر له `runBenchmarksAction` كـ prop. (انظر القسم 20).

---

## 13. صفحة التقارير Reports

**الملف:** `src/app/dashboard/reports/page.tsx` (Server Shell)
**المسار:** `/dashboard/reports`
**يحوّل العمل كله إلى:** `ReportsController` (انظر القسم 13.1).

### 13.1 ReportsController
**الملف:** `src/components/reports/reports-controller.tsx`

#### 1) العنوان والأزرار
- العنوان: "📋 مركز التقارير وإدارة المستندات".
- الوصف: "إنشاء وتصدير تقارير التدقيق الهندسي ومصفوفات المطابقة وفق الكود السوري 2024 و UFC 3-340-02".
- زر "🔄 بناء التقرير" (emerald).

#### 2) 6 بطاقات إحصائية
| إجمالي سجلات RTM | ناجح | فاشل | معدل النجاح (%) | قيم مقفلة سليمة | قيم منحرفة |

#### 3) 4 تبويبات
**أ) نظرة عامة (OverviewTab):**
- بطاقة الحالة العامة (SUCCESS/PARTIAL/FAILURE).
- ملخص خطوات أنبوب المعالجة (شبكة بطاقات لكل section: عدد المتغيرات، المقفلة، الانحرافات).
- قائمة التحذيرات `reportData.warnings`.

**ب) القيم المقفلة (LockedValuesTab):**
- فلاتر (all/OK/DEVIATED/MISSING).
- جدول 8 أعمدة: المتغير، القيمة المرجعية، القيمة المحسوبة، الانحراف، الخطوة المنتجة، الخطوات المستهلكة، المسار، الحالة.

**ج) مصفوفة RTM (RTMMatrixTab):**
- أدوات بحث + فلتر حالة.
- مصفوفة التغطية حسب المتطلب الهندسي (شبكة بطاقات مجمّعة حسب `associatedRequirement`).
- جدول RTM التفصيلي (6 أعمدة): المتطلب (FR), حالة الاختبار (TC), السيناريو, التوقيت, الحالة, سجل العيب.

**د) تصدير (ExportTab):**
- 5 خيارات صيغة: JSON, CSV, Markdown, طباعة PDF, مصفوفة RTM.
- معاينة سريعة (4 إحصائيات).
- زر تصدير.

#### API/Engine المستدعاة
- `db.rtmRecords.toArray()` — من IndexedDB.
- `lockedValuesManager.checkAllDeviations(FINAL_LOCKED_RESULTS)` — فحص الانحرافات.
- `ReportGenerator.buildReportData(rtmRecords): ReportData`.
- `ReportGenerator.export(reportData, options)` — تصدير بأحد الصيغ: 'json' | 'csv' | 'markdown' | 'pdf-print' | 'rtm-matrix'.

#### ReportData
- `meta`: caseName, designCodes[], ...
- `sections[]`: step, stepNameAr, path, values{}, lockedKeys[], deviations[].
- `lockedValues[]`.
- `rtmRecords[]`.
- `warnings[]`.
- `overallStatus`: SUCCESS/PARTIAL/FAILURE.

---

## 14. صفحة الإعدادات Settings

**الملف:** `src/app/dashboard/settings/page.tsx` (Server Shell)
**المسار:** `/dashboard/settings`
**يحوّل العمل كله إلى:** `SettingsController` (انظر القسم 14.1).

### 14.1 SettingsController
**الملف:** `src/components/settings/settings-controller.tsx`

#### 1) العنوان
- العنوان: "⚙️ إعدادات المنصة".
- زران: "📥 تصدير الإعدادات" و "↺ إعادة تعيين".

#### 2) 5 تبويبات أقسام
**أ) المظهر واللغة:**
- المظهر (3 خيارات): داكن / فاتح / تلائي.
- اللغة (2 خيار): العربية / English.
- العرض المضغوط (ToggleSwitch).

**ب) المزامنة:**
- فاصل المزامنة التلقائية (5 خيارات): 5s / 10s / 30s / 60s / إيقاف.
- حالة طابور المزامنة (4 إحصائيات MiniStat): معلقة، تعارضات، السجلات، السيناريوهات.
- زر "إعادة محاولة العناصر الفاشلة".

**ج) المحرك والتحقق:**
- **حد الانحراف المسموح** (range slider 1-20%، خطوة 0.5، افتراضي 5%).
- التشغيل التلقائي للاختبارات المرجعية (Toggle).
- عرض القيم المقفلة (Toggle).
- تحذيرات الانحراف (Toggle).
- معلومات خط الأساس (5 صفوف): الإصدار، عدد القيم المقفلة، عدد المتغيرات الموحدة، h_pr المرجعي، C_ef المرجعي.

**د) إدارة البيانات:**
- إحصائيات قاعدة البيانات المحلية (5 MiniStat): المشاريع، السيناريوهات، سجلات RTM، طابور المزامنة، التعارضات.
- زر "📥 تصدير البيانات" (ينزل JSON شامل).
- زر "🗑️ تفريغ البيانات المحلية" (red — يحذف projects, scenarios, rtmRecords, syncQueue).

**هـ) متقدم:**
- معلومات النظام (9 صفوف):
  - المنصة: المدقق الديناميكي الموحد V3.0
  - الإطار: Next.js 16 + React 19
  - قاعدة البيانات المحلية: Dexie (IndexedDB)
  - قاعدة البيانات البعيدة: Prisma (PostgreSQL)
  - الإصدار: V3.0-Locked
  - أكواد التصميم: Syrian Code 2024 + UFC 3-340-02
  - المرجع الذهبي: BMK-02 (MK83 + MEDIUM_SOIL)
  - خطوات أنبوب المعالجة: 8 خطوات (Step 2 → Step 8)
  - مسارات الحمل: سقف (ω=561.67) + جدار (ω=1024.05)
- زر "↺ إعادة تعيين جميع الإعدادات".

#### التخزين
- الإعدادات محفوظة في `localStorage` بمفتاح `auditor-settings`.
- `AppSettings`: theme, language, syncInterval, deviationThreshold, autoRunBenchmarks, showLockedValues, showDeviationWarnings, compactMode, baselineVersion.

---

## 15. صفحة حول المنصة About

**الملف:** `src/app/dashboard/about/page.tsx` (Server Shell)
**المسار:** `/dashboard/about`
**يحوّل العمل كله إلى:** `AboutController` (انظر القسم 15.1).

### 15.1 AboutController
**الملف:** `src/components/about/about-controller.tsx`

#### 1) العنوان
- العنوان: "حول المنصة".
- بادج "Version 3.0-Locked" (emerald).

#### 2) 4 تبويبات
**أ) المنصة:**
- بطاقة تعريف (gradient slate-900 → slate-950): أيقونة V3 كبيرة + اسم المنصة (عربي + إنجليزي) + وصف.
- شبكة 2 أعمدة:
  - **التقنيات المستخدمة** (8 صفوف): الإطار، اللغة، الأنماط، قاعدة البيانات المحلية، قاعدة البيانات البعيدة، إدارة الحالة، PWA، التحقق.
  - **الميزات الرئيسية** (8 صفوف): أنبوب المعالجة، مسارات الحمل، المرجع الذهبي، القيم المقفلة، المتغيرات الموحدة، التصنيف، التصدير، أوضاع العمل.

**ب) أكواد التصميم:**
- **الكود الإنشائي السوري 2024:** وصف + قائمة مراجع (المعادلات 1-12، 13-19، الجداول B-1→B-6، الفصول 5.1-5.10، 8.1-8.10، الجداول I-1→I-7).
- **UFC 3-340-02:** وصف + قائمة مراجع (الفصول 2-6 + الملحق B).

**ج) المحرك:**
- **أنبوب المعالجة — 8 خطوات:** قائمة 7 بطاقات (Steps 2-8) كل بطاقة بـ:
  - رقم الخطوة في دائرة emerald.
  - الاسم العربي + المسار (مشترك / سقف / جدار / سقف+جدار).
  - وصف الخطوة.
- **حدود المحرك — انتقال القيم المقفلة:** 3 بطاقات:
  - الاختراق → حمل الانفجار: `ENGINE_BOUNDARIES.penetrationToBlast`.
  - حمل الانفجار (سقف) → التصميم: `ENGINE_BOUNDARIES.blastRoofToStructural`.
  - حمل الانفجار (جدار) → التصميم: `ENGINE_BOUNDARIES.blastWallToStructural`.

**د) التراخيص:**
- قائمة 13 مكتبة مفتوحة المصدر مع الترخيص: Next.js (MIT), React (MIT), TypeScript (Apache-2.0), Tailwind CSS (MIT), Dexie.js (Apache-2.0), Prisma (Apache-2.0), Zod (MIT), Zustand (MIT), Radix UI (MIT), Lucide React (ISC), Recharts (MIT), date-fns (MIT), Serwist (MIT).
- إخلاء مسؤولية قانوني.

---

## 16. المكون: V3EngineForm

**الملف:** `src/components/v3-engine-form.tsx`
**النوع:** Client Component.
**يُستخدم في:** Dashboard الرئيسية.

### البنية
بطاقة `Card` بـ RTL تحتوي عنوان amber-400 "منصة المدقق الديناميكي الموحد V3.0" + وصف "استمارة إدخال المحرك الموحد — اختراق · انفجار · تصميم إنشائي".

### 3 أقسام للمدخلات

#### القسم 1: مدخلات الاختراق (amber-500)
- **اختيار السلاح** (Select، 3 أعمدة):
  - يعرض قائمة `WEAPONS` مع اسم السلاح + الوزن + الشحنة.
  - عند الاختيار، تظهر بطاقة معلومات السلاح: أصل السلاح (🇷🇺 روسي / 🇺🇸 أمريكي)، الوزن (كجم)، القطر (م)، الشحنة (كجم)، المتفجرات.
- **نوع التربة** (Select): قائمة `SOILS` بالاسم العربي.
- **سرعة الاصطدام** (Input number) — م/ث — step=10, min=0.
- **زاوية الاصطدام** (Input number) — درجة — step=1, min=0, max=90.

#### القسم 2: مدخلات الانفجار (red-500)
- **عمق السقف Z** (Input number) — م — step=0.1, min=0.
  - وصف: "البعد الشعاعي + عمق السقف فوق مركز الانفجار".

#### القسم 3: مدخلات التصميم (emerald-500)
شبكة 4 أعمدة:
- **بحر النفق القصير ap** (Input number) — م — step=0.5.
- **بحر النفق الطويل bp** (Input number) — م — step=0.5.
- **مقاومة الخرسانة f'c** (Input number) — MPa — step=1.
- **إجهار خضوع الحديد fy** (Input number) — MPa — step=10.

### زر الحساب
زر `Button` كامل العرض بارتفاع 11:
- حالة idle: "تشغيل المحرك الموحد V3.0" (amber-600).
- حالة calculating: "جاري الحساب..." (Loader2 دوّار).

### ملخص المدخلات (8 بادجات)
أسفل الزر: سلاح، تربة، V م/ث، θ°، Z م، بحر النفق، f'c MPa، fy MPa.

### القيم الافتراضية
- `weaponId`: `WEAPONS[4]?.id` (افتراضي MK83).
- `soilTypeCode`: `'MEDIUM_SOIL'`.
- `impactVelocity`: 350.
- `impactAngleDeg`: 20.
- `ceilingDepth`: 3.7.
- `tunnelSpanShort`: 4.
- `tunnelSpanLong`: 5.
- `fcMpa`: 30.
- `fyMpa`: 400.

### المخرجات (EngineInput المُمرر لـ onCalculate)
```typescript
{
  penetration: { weaponId, impactVelocity, soilTypeCode, impactAngleDeg },
  blast: { radialDistance: ceilingDepth, ceilingDepth },
  design: { tunnelSpanShort, tunnelSpanLong, fcMpa, fyMpa },
}
```

### المصادر
- `WEAPONS, SOILS` من `@/lib/engine`.
- النوع `EngineInput, WeaponData, SoilTypeCode` من `@/lib/engine`.

### التحقق
- الزر معطّل إذا `isCalculating || !weaponId`.
- القيم الرقمية تُمرَّر عبر `parseFloat(val)` (0 إن كانت فارغة).

---

## 17. المكون: PipelineTimeline

**الملف:** `src/components/pipeline-timeline.tsx`
**النوع:** Client Component (يستخدم `framer-motion`).
**يُستخدم في:** Dashboard الرئيسية.

### البنية
خط أنابيب مرئي يعرض 7 خطوات (Steps 2-8) في صف أفقي (desktop) أو عمودي (mobile/tablet).

### رأس المكون
- العنوان "خط أنابيب الحساب" + "(7 خطوات)".
- شريط تقدم (Progress bar) مع نسبة مئوية.
- بادج الحالة العامة (`overallStatus`):
  - idle: "في الانتظار" (slate, أيقونة Circle).
  - running: "جاري التنفيذ" (sky, Loader2 دوّار).
  - success: "مكتمل بنجاح" (emerald, CheckCircle2).
  - partial: "نجاح جزئي" (amber, AlertTriangle).
  - failed: "فشل" (red, XCircle).

### تعريف الخطوات الثابتة (STEP_DEFINITIONS)
| Step | الاسم | lockedKeys |
|------|-------|------------|
| 2 | المدخلات والاستيفاءات | [] |
| 3 | الاختراق | [C_ef, h_pr, R_actual, Zp] |
| 4 | القفل الأولي | [Hp, Hc, Hf, Hvct] |
| 5 | أحمال الانفجار | [Pmax, P_ekv, Pp, ω, τ_ef] |
| 6 | معاملات الجدول ب | [] |
| 7 | تصميم السقف | [Mp_roof, Hp_final] |
| 8 | تصميم الجدار | [Hc_final, Hf_final, Hvct_final] |

### بطاقة الخطوة (StepNode)
- بطاقة 190×220px مع:
  - رقم الخطوة في دائرة (8×8) بلون حسب الحالة.
  - أيقونة الحالة (Tooltip يعرض الحالة العربية + المدة).
  - بادج المدة `formatDuration(ms)` (ms أو s).
  - اسم الخطوة بالعربية.
  - شبكة mini-grid لـ `keyValues` (Record<string, number>) — لكل قيمة: الرمز + القيمة المنسقة.
  - بادجات المفاتيح المقفلة `lockedKeys` مع أيقونة `Lock`.

### الموصل (StepConnector)
- أفقي (desktop) أو عمودي (mobile).
- خط emerald-500/40 (أو sky-500/60 أثناء running).
- نقطة نابضة `bg-sky-400` تنتقل من اليمين إلى اليسار (في RTL) للدلالة على النشاط.
- سهم `ChevronLeft` في نهاية الموصل.

### الحركات (framer-motion)
- `motion.div` مع `initial={{ opacity: 0, y: 12 }}` و `animate={{ opacity: 1, y: 0 }}`.
- `transition={{ delay: index * 0.07, duration: 0.35, ease: 'easeOut' }}`.
- للموصل النشط: `scaleX: 0 → 1` (horizontal) أو `scaleY: 0 → 1` (vertical).
- للبطاقة النشطة: نبض `animate-[pulse-glow_2s_ease-in-out_infinite]`.

### دوال مساعدة
- `getStatusIcon(status)`, `getStatusColor(status)`, `getStatusLabel(status)`.
- `formatDuration(ms)`: <1000 = "{ms}ms", else = "{s}s".
- `formatValue(val)`: integer, ≥100 → .1, ≥1 → .3, else exponential 2.

### Convenience Export
- `buildDemoSteps(activeStep?)`: يبني خطوات للعرض التجريبي مع قيم مفاتيح وهمية لكل خطوة.

---

## 18. المكون: ResultsPanel

**الملف:** `src/components/results-panel.tsx`
**يستقبل:** `{ outputs: StructuralOutput | null, baselineVersion: string }`.

### البنية
لوحة نتائج مبسطة لعرض مطابقة اختبارات القبول والـ Benchmarks.

### 1) الرأس
- العنوان: "مخرجات المطابقة وفحص الحدود الكودية".
- بادج "Baseline: {baselineVersion}".

### 2) الحالة التشغيلية الكبرى
بطاقة مركزية:
- `SUCCESS`: "✔ المقطع محقق ومطابق للكود" (emerald).
- `FAILURE`: "❌ فشل إجهاد القص الثاقب (Punching)" (red).

### 3) شبكة 6 خلايا
| العمق الفعال d_eff (mm) | المحيط الحرج b₀ (mm) | اللامركزية e (mm) | حد النواة e_limit (mm) | إجهاد القص الفعلي v_actual (MPa) | إجهاد القص المسموح v_cd (MPa) |

- القيم الفعلية `v_actual > v_cd` تظهر بالأحمر، غير ذلك أخضر.
- اللامركزية `eccentricity > e_limit` تظهر بالأحمر.

### 4) جدول ملخص الحوكمة
3 صفوف:
| البند | القيمة | الحد | الحالة |
|-------|--------|------|--------|
| اللامركزية | eccentricity | ≤ e_limit | ✓/✗ |
| القص الثاقب | v_actual | ≤ v_cd | ✓/✗ |
| نسبة التسليح | ρ_final × 100% | ≥ 0.25% | ✓ |

### 5) رسالة الخطأ
في حال الفشل، تُعرض `outputs.errorMessage` في صندوق red-950/40.

### StructuralOutput (من @/lib/structural/structuralEngine)
الحقول: `d_eff, b_0, eccentricity, e_limit, v_actual?, v_cd?, rho_final, status, errorMessage?`.

---

## 19. المكون: EngineeringForm

**الملف:** `src/components/engineering-form.tsx`
**يستخدم:** `react-hook-form` + `zodResolver(StructuralInputSchema)`.

### البنية
استمارة إدخال المتغيرات الهندسية للتحقق المزدوج.

### الحقول (10 حقول)
1. **المسار التصميمي الحاكم** (select): `SYRIAN_WSD_2024` / `USD_GLOBAL`. افتراضي: `SYRIAN_WSD_2024`.
2. **السماكة الكلية للبلاطة h (mm)** — Input number. افتراضي: 1200.
3. **المقاومة الإنشائية للخرسانة f'c (MPa)** — Input number. افتراضي: 30.
4. **إجهاد خضوع الحديد fy (MPa)** — Input number. افتراضي: 400.
5. **عرض العمود b_column (mm)** — Input number. افتراضي: 500.
6. **ارتفاع العمود h_column (mm)** — Input number. افتراضي: 500.
7. **المساحة الروافدية a_tributary (m²)** — Input number step=0.1. افتراضي: 25.
8. **ضغط العصف النهائي P_design (kPa)** — Input readOnly, آلي من المحركات السابقة.
9. **العزم الديناميكي M (kN·m)** — Input readOnly, آلي.
10. **القوة المحورية الديناميكية N (kN)** — Input readOnly, آلي.

### التحقق (Zod)
- `errors.h_slab?.message`, `errors.f_c?.message`, `errors.f_y?.message`, `errors.b_column?.message`, `errors.h_column?.message`, `errors.a_tributary?.message`.
- تُعرض الأخطاء بـ red-400.

### الزر
- "تشغيل الخوارزمية الإنشائية والمطابقة العددية" (emerald-600).
- معطّل أثناء `isCalculating`: "جاري الحساب...".

### Props
```typescript
interface EngineeringFormProps {
  mockEngineOutputs: { p_design: number; m_dynamic: number; n_dynamic: number };
  onCalculationTrigger: (data: StructuralInput) => void;
  isCalculating?: boolean;
}
```

### المصادر
- `StructuralInputSchema, StructuralInput` من `@/lib/structural/structuralSchema`.

---

## 20. المكون: RtmDashboardController

**الملف:** `src/components/rtm/rtm-dashboard-controller.tsx`
**يُستخدم في:** صفحة RTM.

### البنية
جزيرة العميل الحاكمة لقراءة البيانات المحلية الحية من IndexedDB.

### 1) إشعار النتائج
شريط `auditNotification` يعرض نتائج الـ Server Action:
- نجاح (emerald-950/30): "تم إطلاق نبضة إعادة الفحص الشاملة بنجاح. فحص X حالة تصميمية. نسبة الحيود: X.XX%".
- فشل (red-950/30): "خطأ حوكمي: ...".

### 2) 4 بطاقات إحصائية حوكمية
| إجمالي سجلات RTM | معدل النجاح الكلي (%) | عمليات مزامنة معلقة | تعارضات مسجلة |

- عمليات المزامنة المعلقة تظهر بنبض amber إن > 0.
- التعارضات تظهر بالأحمر إن > 0.

### 3) تبويبات 3
| مصفوفة المتطلبات | تتبع المتغيرات | سجل التدقيق والعيوب |

#### أ) مصفوفة المتطلبات (RtmTable)
جدول مع بحث + فلتر حالة + زر "⟳ تشغيل الفحص والـ Re-run Triggers".
الأعمدة: المتطلب (FR ID), حالة الاختبار (TC), السيناريو, التوقيت, الحالة (PASSED/FAILED), سجل العيب.
إحصائيات: عدد الناجحين + عدد الفاشلين (بنبض أحمر).

#### ب) تتبع المتغيرات (VariableTraceabilityMatrix)
انظر القسم 22.

#### ج) سجل التدقيق والعيوب
شبكة عمودين:
- **AuditTrailEnhanced** — انظر القسم 21.
- **DefectLog** — يعرض السجلات الفاشلة فقط (`status === 'FAILED'`):
  - بادج "X استثناء نشط" أو "لا عيوب نشطة".
  - لكل عيب: DEFECT-ID, التوقيت, وصف الفشل (اختبار + متطلب + سجل العيب).

### القراءة الحية من IndexedDB
```typescript
const records = await db.rtmRecords.toArray();
const queue = await db.syncQueue.toArray();
const coverage = await rtmRepository.getCoverageReport();
const conflicts = ConflictPolicy.getConflictLog();
```
- يتم التحديث كل 5 ثوانٍ (`setInterval(loadLocalData, 5000)`).

### coverageReport
```typescript
{
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  byTestCase: Record<string, { passed: number; failed: number }>;
}
```

### معالج Re-run
```typescript
const handleExecuteReRun = () => {
  startTransition(async () => {
    const result = await runBenchmarksAction();  // Server Action
    // ...
  });
};
```

---

## 21. المكون: AuditTrailEnhanced

**الملف:** `src/components/rtm/audit-trail-enhanced.tsx`

### البنية
سجل تدقيق حي مُعزز يدمج 3 مصادر للأحداث:
1. **syncItems** (SyncQueueRecord من IndexedDB).
2. **conflictLog** (ConflictPolicy).
3. **engineAndLockEvents** (مولّدة من LOCKED_REGISTRY + ENGINE_BOUNDARIES).

### 1) الرأس
- العنوان: "سجل التدقيق الحي المُعزز (Enhanced Audit Trail)".
- عداد: "{filteredEvents.length} / {allEvents.length} حدث".

### 2) أدوات الفلترة والبحث
- بحث نصي في الأحداث.
- 5 أزرار فلترة: الكل, مزامنة (SYNC), تعارض (CONFLICT), محرك (ENGINE), قفل (LOCK). كل زر يعرض العدد.

### 3) أنواع الأحداث
| النوع | اللون | المصدر |
|------|-------|--------|
| SYNC | blue | syncItems |
| CONFLICT | amber | conflictLog |
| ENGINE | purple | LOCKED_REGISTRY boundaries |
| LOCK | red | LOCKED_REGISTRY entries |
| BASELINE | slate | (مُعرَّف لكن غير مستخدم في الفلاتر) |

### 4) سجل الأحداث
قائمة قابلة للتمرير (`max-h-[400px]`), `role="log"`, `aria-live="polite"`.
كل حدث:
- بادج نوع الحدث.
- نص الحدث (`event.label`).
- التوقيت (`ar-SY` locale).
- وصف تفصيلي (`event.detail`).
- عند النقر: توسيع لعرض `event.metadata` بصيغة JSON في `<pre>`.

### 5) شدة الحدث (severity)
- info (slate).
- warning (amber).
- critical (red).
- success (emerald).

### 6) أحداث القفل المولّدة
لكل قيمة في LOCKED_REGISTRY:
- معرف: `lock-{key}`.
- النوع: LOCK.
- التسمية: `قفل {key} ← الخطوة {producedByStep}`.
- التفاصيل: `القيمة: {value} | التسامح: {tolerance×100}% | المسار: {roof/wall/shared} | تُستهلك بواسطة: الخطوات [...]`.

### 7) أحداث حدود المحرك
3 حدود:
- الاختراق → حمل الانفجار.
- حمل الانفجار (سقف) → التصميم.
- حمل الانفجار (جدار) → التصميم.

لكل حد: `القيم المنتقلة: X متغير مقفل (key1, key2, ...)`.

---

## 22. المكون: VariableTraceabilityMatrix

**الملف:** `src/components/rtm/variable-traceability-matrix.tsx`

### البنية
مصفوفة تتبع المتغيرات الحية — تتبع كل متغير من المدخلات إلى المخرجات والعكس.

### 1) إحصائيات التغطية حسب الخطوة (7 بطاقات)
شبكة 7 أعمدة (Steps 2-8):
- العنوان: "الخطوة X".
- العدد الإجمالي للمتغيرات.
- تفصيل: I (مدخل) / C (محسوب) / L (مقفل) / O (مخرج).

### 2) أدوات الفلترة
- بحث نصي.
- 3 قوائم منسدلة:
  - فلتر الفئة (input/lookup/computed/locked/output).
  - فلتر الخطوة (2-8).
  - فلتر المسار (roof/wall/shared).

### 3) جدول المتغيرات (11 عمود)
| الرمز | الاسم | الوصف | الوحدة | الفئة | الخطوة | المسار | مقفل | المصدر | التبعيات | تتبع |

- التبعيات: `v.dependsOn` (مقتطفة، أول 3 فقط + "...").
- زر تتبع "🔍" لكل صف.

### 4) لوحة التتبع التفصيلية
عند اختيار متغير، تظهر بطاقة emerald-900/40 تحتوي:
- العنوان: "🔍 تتبع المتغير: {selectedVariable}".
- زرا تبديل اتجاه التتبع:
  - **تتبع للمدخلات** (toInputs): يعرض سلسلة التبعيات من المتغير إلى المدخلات الأصلية.
  - **تتبع للمخرجات** (fromInput): يعرض جميع المخرجات التي تعتمد على هذا المتغير.

#### سلسلة التتبع (toInputs)
قائمة `traceResult.chain` (TraceEntry[]):
- لكل عقدة: رقم تسلسلي، اسم المتغير (emerald)، بادج الفئة، الخطوة، المسار، أيقونة قفل 🔒 إن كانت مقفلة.
- سهم ← بين العقد.
- ملخص: إجمالي العقد، قيم مقفلة، مصادر مدخل.

#### التتبع العكسي (fromInput)
قائمة `reverseTrace` (TraceEntry[]):
- لكل عقدة: معلومات مشابهة للسلسلة السابقة.
- عدد المخرجات المتأثرة.

### الخدمات المستخدمة
- `traceabilityService.traceToInputs(varName): TraceChain`.
- `traceabilityService.traceFromInput(varName): TraceEntry[]`.
- `dependencyGraph` من `@/lib/domain/dependency-graph`.

### TraceChain
```typescript
{
  chain: TraceEntry[];          // سلسلة التبعيات
  lockedEntries: TraceEntry[];  // العقد المقفلة في السلسلة
  inputSources: TraceEntry[];   // المدخلات الأصلية
}
```

### TraceEntry
الحقول: `variable, category, step, path, locked`.

---

## 23. المكون: AdminDashboardV2

**الملف:** `src/components/admin/admin-dashboard-v2.tsx`
**المسار:** `/admin` (لوحة المدير — منفصلة عن /dashboard لكن مرتبطة عبر السايدبار).

### 1) الرأس
- العنوان: "لوحة التحكم الحوكمية العليا".
- الوصف: "المهندس أبو سليمان — منصة المدقق الديناميكي الموحد V3.0".
- بادج باسم المستخدم الحالي (amber).
- زر "تسجيل الخروج".

### 2) 4 تبويبات
| نظرة عامة | طلبات معلّقة | المستخدمون | خط الأساس |

#### أ) نظرة عامة (overview)
- 4 بطاقات إحصائية: إجمالي المستخدمين, طلبات معلّقة, مستخدمون فعّالون, موقوفون.
- 3 بطاقات إحصائية: مديرون, مهندسون, مراقبون.
- **إجراءات سريعة:** زر "بذر حساب المدير الافتراضي (أبو سليمان)" + زر "مراجعة الطلبات المعلّقة".
- **معلومات الأمان:** 4 بطاقات:
  - تشفير الجلسة: AES-256-GCM + httpOnly.
  - كلمات المرور: bcrypt (12 rounds).
  - حماية CSRF: SameSite: Strict.
  - حماية المسارات: Middleware + Server RBAC.

#### ب) طلبات معلّقة (pending)
قائمة `UserCard` لكل مستخدم PENDING مع زرَّي:
- "قبول" (emerald).
- "رفض" (red — يفتح prompt لسبب الرفض).

#### ج) المستخدمون (users)
- بحث نصي بالاسم أو البريد أو رقم النقابة.
- 3 أقسام: مستخدمون فعّالون (APPROVED), موقوفون (SUSPENDED), مرفوضون (REJECTED).

#### د) خط الأساس (baseline)
- بطاقة "التحكم بخط الأساس الحسابي".
- وصف: "قفل خط الأساس يمنع تعديل الثوابت المرجعية (الكود السوري 2024 و UFC 3-340-02)".
- بادج الحالة: "مقفل" / "مفتوح".
- زر "قفل خط الأساس" (red) أو "فتح خط الأساس" (emerald).
- تنبيه amber: "التحقق من الصلاحيات يتم على الخادم حصراً عبر enforceAdminPolicy. جميع المحاولات تُسجَّل في طابور التدقيق الجنائي".

### UserCard — بطاقة المستخدم
لكل مستخدم:
- الاسم + بادج الدور + بادج الحالة.
- البريد الإلكتروني.
- رقم النقابة + التخصص.
- الأذونات (قائمة بادجات).
- تاريخ التسجيل + آخر تغيير.
- أزرار الإجراءات (حسب الحالة والدور):
  - PENDING: قبول, رفض.
  - APPROVED (غير ADMIN): إيقاف, الأذونات, تغيير الدور, حذف.
  - SUSPENDED: إعادة تفعيل, الأذونات, تغيير الدور, حذف.

### الأدوار (USER_ROLES)
- ADMIN (amber).
- ENGINEER (blue).
- VIEWER (slate).

### الأذونات (PERMISSION_LABELS)
- CAN_RUN_ENGINE: تشغيل محرك الحسابات.
- CAN_MODIFY_INPUTS: تعديل المدخلات الهندسية.
- CAN_VIEW_REPORTS: عرض التقارير.
- CAN_EXPORT_DATA: تصدير البيانات.
- CAN_MODIFY_BASELINE: تعديل خط الأساس.
- CAN_MANAGE_PROJECTS: إدارة المشاريع.
- CAN_AUDIT: الوصول لسجل التدقيق.

### حالات الاشتراك (STATUS_LABELS)
- PENDING: معلّق (amber).
- APPROVED: موافق عليه (emerald).
- REJECTED: مرفوض (red).
- SUSPENDED: موقوف (orange).

### 3 حوارات (Dialogs)
1. **حوار الأذونات:** 7 checkboxes لكل صلاحية + زر "حفظ الأذونات".
2. **حوار تغيير الدور:** Select (ENGINEER / VIEWER — لا يمكن ترقية لـ ADMIN من هنا) + زر "تغيير الدور".
3. **حوار الحذف:** حقل سبب الحذف (إلزامي) + زر "حذف نهائي" (red).

### Server Actions المستدعاة
- `getBaselineLockStatusAction()` — حالة قفل خط الأساس.
- `toggleBaselineLockAction()` — تبديل القفل.
- `checkSessionAction()` — التحقق من الجلسة.
- `logoutAction()` — تسجيل الخروج.
- `getAllUsersAction()` — جلب كل المستخدمين.
- `approveUserAction(id)`, `rejectUserAction(id, reason)`.
- `suspendUserAction(id, reason)`, `reactivateUserAction(id)`.
- `updateUserPermissionsAction(id, permissions)`.
- `changeUserRoleAction(id, role)`.
- `deleteUserAction(id, reason)`.
- `seedDefaultAdminAction()` — بذر حساب المدير الافتراضي.

### AdminUserView
الحقول: `id, displayName, email, role, subscriptionStatus, syndicateId?, specialization?, permissions[], statusReason?, createdAt, statusChangedAt?`.

### AdminUserStats
الحقول: `total, pending, approved, suspended, rejected, admins, engineers, viewers`.

---

## 24. خلاصة الجداول المرجعية والقيم المقفلة

### STEP_LOCKED_KEYS (القيم المقفلة لكل خطوة)
```typescript
{
  2: [],
  3: ['C_ef', 'h_pr', 'R_actual', 'Zp'],
  4: ['Hp', 'Hc', 'Hf', 'Hvct'],
  5: ['Pmax', 'P_ekv', 'Pp', 'omega', 'tau_ef'],
  6: [],
  7: ['Mp_roof', 'Hp_final'],
  8: ['Hc_final', 'Hf_final', 'Hvct_final'],
}
```

### STEP_NAMES (أسماء الخطوات بالعربية)
```typescript
{
  2: 'المدخلات والاستيفاءات',
  3: 'الاختراق',
  4: 'القفل الأولي',
  5: 'أحمال الانفجار',
  6: 'معاملات الجدول ب',
  7: 'تصميم السقف',
  8: 'تصميم الجدار',
}
```

### مصادر البيانات الرئيسية
- `@/lib/engine/orchestrator` → `runEngine()`, `EngineInput`, `EngineOutput`.
- `@/lib/engine/penetration-core` → `calculatePenetration()`.
- `@/lib/engine/blast-loads` → `calculateBlastLoad()`.
- `@/lib/engine/rebar` → `calculateRebarDesign()`, `calculateRebarBothPaths()`.
- `@/lib/engine/benchmarks` → `BENCHMARK_SUITE`, `getBenchmarkById()`.
- `@/lib/engine/constants` → `WEAPONS`, `SOILS`, `getWeaponById()`, `getSoilByCode()`.
- `@/lib/constants/reference-data` → `STEP2_INPUTS`, `STEP2_LOOKUPS`, `STEP2_GEOMETRY`, `STEP3_PENETRATION`, `STEP4_LOCKED`, `STEP5_ROOF`, `STEP5_WALL`, `STEP6_ROOF`, `STEP6_WALL`, `STEP7_CEILING`, `STEP8_WALL`, `LOCKED_REGISTRY`, `UNIFIED_VARIABLE_TABLE`, `FINAL_LOCKED_RESULTS`, `ENGINE_BOUNDARIES`.
- `@/lib/storage` → `projectRepository`, `db`.
- `@/lib/storage/repositories/RtmRepository` → `rtmRepository.getCoverageReport()`.
- `@/lib/storage/conflictPolicy` → `ConflictPolicy.getConflictLog()`.
- `@/lib/domain/locked-values` → `lockedValuesManager.checkAllDeviations()`.
- `@/lib/domain/traceability` → `traceabilityService.traceToInputs()`, `traceFromInput()`.
- `@/lib/reporting/report-generator` → `ReportGenerator.buildReportData()`, `export()`.
- `@/lib/structural/structuralSchema` → `StructuralInputSchema`, `StructuralInput`.
- `@/lib/structural/structuralEngine` → `StructuralOutput`.

### واجهات API REST
| المسار | الطريقة | الوصف |
|--------|--------|-------|
| `/api/benchmark` | POST | تشغيل اختبارات BMK المرجعية |
| `/api/comparison` | GET | جلب مقارنة الأشكال الهندسية الثلاثة |

### Server Actions (الحوكمة)
| الـ Action | الملف |
|-----------|------|
| `runLiveBenchmarksAction()` | `/app/dashboard/rtm/page.tsx` |
| `getBaselineLockStatusAction()`, `toggleBaselineLockAction()`, `checkSessionAction()`, `logoutAction()` | `/app/actions/auth.actions` |
| `getAllUsersAction()`, `approveUserAction()`, `rejectUserAction()`, `suspendUserAction()`, `reactivateUserAction()`, `updateUserPermissionsAction()`, `changeUserRoleAction()`, `deleteUserAction()`, `seedDefaultAdminAction()` | `/app/actions/admin.actions` |

---

## خلاصة الأنماط البصرية المتكررة

### نظام الألوان (Dark Theme)
- **الخلفية الرئيسية:** `bg-slate-950`.
- **البطاقات:** `bg-slate-900/80` مع `border-slate-800`.
- **النص الأساسي:** `text-slate-100`.
- **النص الثانوي:** `text-slate-400/500`.
- **اللون التشغيلي (Active):** emerald-400.
- **اللون الحوكمي (Admin):** amber-400.
- **اللون الإنشائي (Engineering):** sky-400.
- **اللون الحسابي (Computed):** amber-400.
- **اللون المقفل (Locked):** red-400.
- **اللون المُدخل (Input):** sky-400.

### أنماط الحالات (Validation)
- SUCCESS → emerald (`مقبول` / `مطابق` / `آمن`).
- WARNING → amber (`تحذير` / `انحراف`).
- FAILURE → red (`مرفوض` / `مخالف` / `غير آمن`).

### أنماط الانحرافات
- <1% → emerald (`مطابق`).
- <5% → amber (`انحراف` / `ضمن التسامح`).
- ≥5% → red (`مخالف` / `خارج التسامح`).

### البطاقات القياسية
- **KeyResultCard:** بطاقة بـ border ملوّن + خلفية شفافة + أيقونة + قيمة كبيرة + رمز + وحدة.
- **SummaryCard:** بطاقة ملخص بأيقونة + بادج رمز + قيمة كبيرة.
- **StatCard / MiniStat:** بطاقة إحصائية صغيرة.
- **CalcChainRow:** صف سلسلة حساب برقم دائري + رمز + صيغة + قيمة + وحدة (isFinal = emerald).

### الجداول
- `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` من shadcn/ui.
- الرأس: `text-slate-400 text-xs font-semibold`.
- الصفوف: `border-slate-800/50 hover:bg-slate-950/40`.

### التبويبات
- `Tabs, TabsList, TabsTrigger, TabsContent` من shadcn/ui.
- التبويب النشط: `data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400`.

### اللغة والاتجاه
- جميع الصفحات `dir="rtl"`.
- الأرقام والصيغ الرياضية `dir="ltr"` داخل عناصر محددة.
- التواريخ بصيغة `ar-SY` locale.

---

## النهاية

هذا التحليل الشامل يغطي جميع صفحات لوحة التحكم الـ 13 + جميع المكونات الرئيسية الـ 9 المطلوبة. كل صفحة موثقة بتفاصيلها الكاملة:
1. عنوان الصفحة ومسارها.
2. المكونات المعروضة (forms, tables, cards, badges).
3. حقول الإدخال بأنواعها ووحداتها وقواعد التحقق.
4. القيم/الأقسام الناتجة المعروضة.
5. دوال API/Engine المستدعاة (سيرفر أكشن أو دالة محرك).
6. الحسابات المرئية للمستخدم (صيغ، قيم وسيطة).
7. الرسوم البيانية/التصورات (مخططات SVG).

المنصة متكاملة تماماً مع خط أنابيب حسابي من 8 خطوات، وتدعم:
- **العمل أوفلاين** بالكامل عبر IndexedDB (Dexie).
- **المزامنة الاختيارية** مع الخادم المركزي (PostgreSQL + Prisma).
- **الحوكمة** عبر Server Actions محمية بـ RBAC.
- **التتبع الكامل** للقيم المقفلة من المدخلات إلى المخرجات.
- **اختبارات مرجعية** (BMK-02) للتأكد من صحة الحسابات.
- **تصدير متعدد الصيغ** (JSON, CSV, Markdown, PDF, RTM).
- **مصفوفة مطابقة المتطلبات** (RTM) حية.
- **سجل تدقيق** مُعزز يدمج المزامنة + التعارضات + حدود المحرك + القيم المقفلة.
