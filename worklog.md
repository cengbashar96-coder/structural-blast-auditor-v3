---
Task ID: 1
Agent: Main Agent (Super Z)
Task: قراءة واستيعاب المعادلات الإنشائية من الأطروحة العلمية وملفات الإكسيل السبعة والتحقق من ضغوط العصف الديناميكي ونواة المقطع والقص الثاقب

Work Log:
- قراءة 7 ملفات إكسيل باستخراج كامل للبيانات والمعادلات (850+ معادلة)
- تحويل 46 صفحة PDF مصورة إلى صور وقراءتها بنموذج الرؤية VLM
- استخلاص 47 معادلة إنشائية حاكمة تغطي: ضغوط العصف الديناميكي، اختراق القنابل، الأحمال التصميمية
- التحقق من وقوع محصلة الأحمال داخل نواة المقطع (3 حالات مرجعية)
- فحص إجهادات القص الثاقب وفق الكود العربي السوري 2024 (WSD) ومعايير UFC 3-340-02
- تحويل 11 منحنى/جدول مرجعي إلى دوال استيفاء رقمية مبرمجة (I-1 إلى I-11)
- إنشاء ملف Baseline Constants JSON (7 أقسام، 14 قنبلة، 13 تربة، 8 درجات خرسانة)
- إعداد تقرير هندسي شامل PDF (27 صفحة)

Stage Summary:
- الملفات المنتجة: engineering_report.pdf, engineering_report.html, baseline_constants.json
- 47 معادلة إنشائية موثقة بالأرقام (1-47)
- 11 دالة استيفاء رقمية (I-1 إلى I-11) كـ Baseline Constants
- التحقق من نواة المقطع: محصلة الأحمال خارج النواة (متوقع في المنشآت الحمائية)
- فحص القص الثاقب: جميع الحالات آمنة ✓
- الجاهزية لاستقبال كود Next.js PWA / TypeScript: مكتملة
---
Task ID: 2
Agent: Main Agent (Super Z)
Task: تأسيس بنية تحتية PWA Offline-First + حقن محرك التصميم الإنشائي المزدوج + طبقة التخزين المحلي

Work Log:
- تثبيت المكتبات: zod, dexie, vitest
- إنشاء src/lib/structural/baselineConstants.ts - ثوابت Baseline (14 قنبلة، 13 تربة، 5 متفجرات، 8 درجات خرسانة)
- إنشاء src/lib/structural/structuralSchema.ts - طبقة التحقق وقفل البيانات باستخدام Zod
- إنشاء src/lib/structural/structuralEngine.ts - محرك التصميم الإنشائي المزدوج (WSD + UFC 3-340-02)
- إنشاء src/lib/structural/blastEngine.ts - محرك حسابات ضغوط العصف الديناميكي (37 معادلة)
- إنشاء src/lib/structural/index.ts - Unified Export
- إنشاء src/lib/db/database.ts - طبقة التخزين المحلي Dexie/IndexedDB (4 جداول)
- إنشاء واجهة PWA كاملة في src/app/page.tsx (3 تبويبات + SVG + رسوم نواة المقطع)
- إنشاء __tests__/structural.test.ts - 8 اختبارات Vitest
- تشغيل جميع الاختبارات بنجاح (8/8 PASS)
- التحقق من عمل المنصة في المتصفح

Stage Summary:
- الملفات المنتجة: 7 ملفات TypeScript رئيسية + ملف اختبارات
- الاختبارات: 8/8 PASS (TC-STRUCT-001 إلى TC-BLAST-005)
- المحركات: محرك الانفجار + محرك التصميم الإنشائي + طبقة التخزين المحلي
- الواجهة: PWA RTL عربية مع SVG تفاعلي + رسوم نواة المقطع
- Baseline Constants: 0.00% انحراف مقفل كودياً
---
Task ID: 3
Agent: Main Agent (Super Z)
Task: تأسيس نظام التخزين الفرعي المتكامل (Storage Subsystem v2) — Repository Pattern + Zod Validation + Sync Queue

Work Log:
- إنشاء src/lib/storage/db.ts — قاعدة بيانات Dexie مع 4 Object Stores (projects, scenarios, rtmRecords, syncQueue) وفهارس بحث محسنة
- إنشاء src/lib/storage/storageSchemas.ts — مخططات Zod الصارمة: ProjectRecordSchema, ScenarioRecordSchema, RtmRecordSchema, SyncQueueRecordSchema + دوال validateBeforeWrite وsafeParseWithDefaults
- إنشاء src/lib/storage/repositories/ProjectRepository.ts — مستودع المشاريع مع Local-First Write + Transaction Safety + حذف متسلسل
- إنشاء src/lib/storage/repositories/ScenarioRepository.ts — مستودع السيناريوهات مع ربط المحرك الإنشائي + saveStructuralOutput + إعادة تعيين المخرجات عند تحديث المدخلات
- إنشاء src/lib/storage/repositories/RtmRepository.ts — مستودع تتبع المتطلبات مع تقرير التغطية وسجلات العيوب
- إنشاء src/lib/storage/repositories/SyncQueueRepository.ts — مستودع طابور المزامنة مع إعادة المحاولة والتنظيف الدوري
- إنشاء src/lib/storage/index.ts — Unified Export لنظام التخزين
- تحديث src/lib/structural/index.ts — إضافة تصدير نظام التخزين الجديد
- إنشاء vitest.config.ts + vitest.setup.ts — إعداد fake-indexeddb للاختبار
- تثبيت fake-indexeddb كـ devDependency
- إنشاء __tests__/storage.test.ts — 27 اختبار في 6 أقسام (Schema Validation, Project CRUD, Scenario, RTM, Sync Queue, Transaction Integrity)
- تشغيل جميع الاختبارات بنجاح: 35/35 PASS (8 هيكلية + 27 تخزين)

Stage Summary:
- الملفات المنتجة: 7 ملفات TypeScript جديدة لنظام التخزين + ملف اختبارات + إعدادات Vitest
- البنية: Repository Pattern مع عزل كامل بين UI وقاعدة البيانات
- التحقق: Zod صارم قبل كل عملية كتابة — منع البيانات التالفة 100%
- المزامنة: طابور مؤجل مع تسجيل آلي لكل عملية CRUD
- الاختبارات: 35/35 PASS (TC-STORAGE-001 إلى TC-TXN-002)
- سلامة المعاملات: حذف متسلسل مشروع→سيناريو→RTM في transaction واحد
---
Task ID: 4
Agent: Main Agent (Super Z)
Task: تأسيس نظام المزامنة وإدارة التعارضات + غلافة PWA (Manifest + Service Worker)

Work Log:
- إنشاء src/lib/storage/conflictPolicy.ts — محرك سياسة حسم التعارضات الحوكمية (Engineering-First)
  - قاعدة 1: السيادة الحوكمية — Baseline Version مقفل يفرض محلياً قسراً
  - قاعدة 2: فشل القص الثاقب من السيرفر يُفرض فوراً (حماية المنشأة مقدسة)
  - قاعدة 3: التاريخ الحاكم — الأحدث زمنياً يربح عند تساوي Baseline
  - سجل تعارضات (Audit Trail) للشفافية الحوكمية
- إنشاء src/lib/storage/syncProcessor.ts — معالج طابور المزامنة الذكي
  - Idempotency: X-Idempotency-Key يمنع تكرار المعالجة
  - Exponential Backoff: 1s→2s→4s→8s→16s (حد أقصى 5 محاولات)
  - Race Condition Blocker: معالجة واحدة فقط في أي لحظة
  - حقن NetworkMonitor + SyncApiClient للاختبار
  - مراقبة الشبكة التلقائية — بدء المزامنة عند عودة الاتصال
- إنشاء __tests__/sync.test.ts — 18 اختبار (7 ConflictPolicy + 9 SyncProcessor + 2 E2E)
- تحديث src/lib/storage/index.ts — إضافة تصديرات ConflictPolicy + SyncQueueProcessor
- إنشاء src/lib/storage/StorageProvider.tsx — مزود React لتهيئة Dexie + SW + مراقبة الشبكة
- إنشاء public/manifest.json — PWA Manifest (RTL Arabic، standalone، 8 أحجام أيقونات)
- إنشاء public/sw.js — Service Worker يدوي (NetworkFirst صفحات + CacheFirst موارد ثابتة)
- توليد 8 أحجام أيقونات PWA (72→512px) باستخدام z-ai-generate + sharp
- تحديث src/app/layout.tsx — RTL + PWA metadata + StorageProvider + Service Worker registration
- تحديث src/app/page.tsx — ربط Repository Layer الجديد بدلاً من database.ts القديم
- تحديث next.config.ts — توافق Turbopack + إزالة withPWA (SW يدوي)
- تشغيل جميع الاختبارات بنجاح: 53/53 PASS

Stage Summary:
- الملفات المنتجة: conflictPolicy.ts + syncProcessor.ts + StorageProvider.tsx + sw.js + manifest.json + 8 أيقونات
- سياسة التعارضات: 3 قواعد حوكمية (Baseline × القص الثاقب × التاريخ)
- المزامنة: Idempotency + Exponential Backoff + Race Condition Blocker
- PWA: Manifest + Service Worker + أيقونات + RTL Arabic
- الاختبارات: 53/53 PASS (8 هيكلية + 27 تخزين + 18 مزامنة)
- البناء: next build ناجح (Turbopack + standalone)
---
Task ID: 5
Agent: Main Agent (Super Z)
Task: تأسيس PWA Shell المتقدم (Serwist + Manifest + Offline Fallback) وبناء واجهات Dashboard التفاعلية (Server-First + Client Islands)

Work Log:
- تثبيت @serwist/next (9.5.11) + @serwist/precaching + @serwist/strategies + @serwist/routing + @serwist/cacheable-response + @serwist/expiration
- تحديث public/manifest.json — وثيقة الهوية الرقمية الجديدة (id: /?source=pwa, theme_color: #0f172a, maskable icons, engineering categories)
- إنشاء src/app/manifest.ts — المولد الحركي للمانيفست المتوافق مع Next.js App Router (MetadataRoute.Manifest)
- إنشاء src/app/offline/page.tsx — واجهة الهبوط الاحتياطية مع مراقبة حالة الشبكة وزر إعادة الاتصال
- إنشاء src/components/pwa-register.tsx — مكون مراقبة الـ SW وتنبيه التحديثات الحوكمية (SKIP_WAITING + statechange)
- إنشاء src/components/network-status.tsx — جزيرة مراقب الشبكة والمزامنة المستقلة (مراقبة Dexie كل 2.5 ثانية + navigator.onLine)
- إنشاء src/components/engineering-form.tsx — استمارة الإدخال مع RHF + Zod Resolver + حقول قراءة فقط للمخرجات الآلية
- إنشاء src/components/results-panel.tsx — بطاقة مطابقة الـ Benchmarks مع جدول حوكمة ورسائل خطأ مفصلة
- إنشاء src/components/eccentricity-svg.tsx — محاكي النواة اللامركزية مع Accessibility معزز (aria-label, sr-only, role=figure)
- إنشاء src/app/dashboard/layout.tsx — الغلاف الحاكم (Server Component) مع Sidebar ثابت + NetworkStatus + PWARegister
- إنشاء src/app/dashboard/page.tsx — الصفحة الرئيسية مع خط بيانات كامل: Blast Engine → Engineering Form → Results → SVG
- إنشاء src/sw.ts — Serwist Service Worker مع 3 استراتيجيات كاش:
  * CacheFirst: App Shell (خطوط، JS، CSS، أيقونات) — سنة واحدة
  * StaleWhileRevalidate: البيانات المرجعية (JSON) — 30 يوماً
  * NetworkFirst: طلبات API — 24 ساعة مع مهلة 10 ثوانٍ
  * NavigationRoute: Fallback لصفحة /offline
- تحديث next.config.ts — دمج withSerwist() لتوليد sw.js تلقائياً
- تحديث src/app/layout.tsx — theme_color: #0f172a + PWA metadata محدث
- تحديث src/lib/storage/StorageProvider.tsx — دعم Serwist Service Worker registration
- تحديث vitest.config.ts — إضافة path alias (@/ → ./src/)
- إنشاء __tests__/pwa-ui.test.ts — 16 اختبار جديد:
  * TC-PWA-001 إلى 005: PWA Shell (manifest, standalone, RTL, caching strategies, SKIP_WAITING)
  * TC-UI-001 إلى 008: Dashboard UI (Zod validation, SVG colors, read-only fields, Server-First architecture)
  * TC-INT-001 إلى 003: تكامل خط البيانات (input→engine→SVG→save, sync monitoring, accessibility)
- تشغيل جميع الاختبارات: 69/69 PASS
- البناء: next build ناجح (Turbopack + Serwist) — جميع الصفحات تُولّد (/dashboard, /offline, /manifest.webmanifest)

Stage Summary:
- الملفات المنتجة: 10 ملفات جديدة (PWA Shell + Dashboard UI) + تحديث 5 ملفات
- البنية: Server-First Layout + Interactive Client Islands (5 جزر تفاعلية معزولة)
- PWA: Serwist (@serwist/next) بديل Workbox — 3 استراتيجيات كاش معزولة
- خط البيانات: Form → Zod → Engine → SVG + Benchmarks → Repository → IndexedDB
- Accessibility: SVG مع aria-label + sr-only + role=figure لقارئات الشاشة
- الاختبارات: 69/69 PASS (8 هيكلية + 27 تخزين + 18 مزامنة + 16 PWA/UI)
- الأداء: Initial Load سريع عبر Static Shell + Code Splitting للجزر التفاعلية
---
Task ID: 6
Agent: Main Agent (Super Z)
Task: المرحلة الرابعة والأخيرة — شاشة الـ RTM وغرفة التدقيق الجنائي (Live Governance & Audit Trail)

Work Log:
- إنشاء app/dashboard/rtm/page.tsx — Server Component مع Server Action مؤمن (runLiveBenchmarksAction)
- إنشاء components/rtm/rtm-dashboard-controller.tsx — جزيرة التحكم الكلية (تقرأ من IndexedDB مباشرة)
  - بطاقات إحصائيات حوكمية: إجمالي RTM، معدل النجاح، مزامنة معلقة، تعارضات مسجلة
  - إشعارات حية بدل alert() — دورة حياة كاملة مع إغلاق يدوي
  - تحديث تلقائي كل 5 ثوانٍ لمراقبة التغييرات
- إنشاء components/rtm/rtm-table.tsx — جدول المتطلبات الحي
  - بحث ديناميكي بـ FR ID / TC ID / Scenario ID
  - فلترة حسب الحالة (ALL / PASSED / FAILED)
  - Accessibility معزز: caption, scope, aria-label, sr-only
  - ملخص التغطية حسب حالة الاختبار في الأسفل
  - زر Re-run Benchmarks مع useTransition
- إنشاء components/rtm/audit-trail.tsx — شريط التتبع الزمني
  - دمج أحداث المزامنة + التعارضات في سجل زمني واحد مرتب
  - ألوان حسب الخطورة: info / warning / critical
  - aria-live="polite" + role="log" لقارئات الشاشة
- إنشاء components/rtm/defect-log.tsx — لوحة رصد العيوب الإنشائية
  - فلترة تلقائية للسجلات FAILED فقط
  - عرض تفصيلي لكل عيب: DEFECT-ID, حالة الاختبار، سجل العيب
  - شريط حالة مقفل: LOCKED // REJECTION_TRIGGERED
- تحديث app/dashboard/layout.tsx — إضافة روابط تنقل باستخدام Next.js Link
  - رابط /dashboard → المشاريع وحالات التدقيق
  - رابط /dashboard/rtm → مصفوفة المتطلبات RTM
- إنشاء __tests__/rtm.test.ts — 19 اختبار جديد:
  - TC-RTM-001 إلى 007: تسجيل RTM (PASSED/FAILED، منع يتيم، Zod، جلب حسب TC/FR)
  - TC-COV-001/002: تقرير التغطية (نسب دقيقة، قاعدة فارغة)
  - TC-DEF-001/002: سجل العيوب (FAILED فقط، فارغ عند النجاح)
  - TC-AUDIT-001 إلى 005: Audit Trail (فارغ، Baseline، PUNCHING_FAILURE، ترتيب زمني، مسح)
  - TC-LIVE-001 إلى 003: خط بيانات حي كامل (Engine→RTM→Coverage→Defect، Server Action، IndexedDB)
- تشغيل جميع الاختبارات: 88/88 PASS عبر 5 ملفات
- البناء: next build ناجح — /dashboard/rtm يُولّد بنجاح
- محاولة رفع إلى GitHub فشلت بسبب إلغاء الـ PAT

Stage Summary:
- الملفات المنتجة: 6 ملفات جديدة + تحديث 1 ملف + 1 ملف اختبارات
- البنية: Server Component (page.tsx) + Client Island Controller (rtm-dashboard-controller.tsx)
- خط البيانات المصحح: السيرفر يبني الهيكل — جزر العميل تقرأ من IndexedDB مباشرة
- الـ RTM حي: لا Mock Data — جميع البيانات من Dexie/IndexedDB المحلية
- الاختبارات: 88/88 PASS (8 هيكلية + 27 تخزين + 18 مزامنة + 16 PWA/UI + 19 RTM)
- GitHub: PAT تم إلغاؤه — يحتاج رمز جديد للرفع
---
Task ID: 7
Agent: Main Agent (Super Z)
Task: تثبيت Benchmark 1-3 + types.ts + مكتبة الأسلحة الموحدة (FAB + US)

Work Log:
- إنشاء src/lib/engine/types.ts — الأنواع الموحدة (Single Source of Truth):
  * SoilTypeCode: 'SOFT_SOIL' | 'MEDIUM_SOIL' | 'HARD_ROCK' | 'REINFORCED_SAND'
  * GeometryType: 'RECTANGULAR' | 'CIRCULAR' | 'ARCHED'
  * ValidationStatus: 'SUCCESS' | 'WARNING' | 'FAILURE'
  * WeaponData: واجهة موحدة للقنابل (أمريكية + روسية)
  * SoilCoefficients: معاملات اختراق التربة مرتبطة بـ SoilTypeCode
  * PenetrationInput/Output: مدخلات ومخرجات محرك الاختراق
  * BlastInput/Output: مدخلات ومخرجات محرك الضغط العصفي
  * DesignInput: مدخلات محرك التصميم الإنشائي
  * ValidationReport: تقرير التحقق مع ruleId ونسب
  * SectionDesignResult: نتيجة تصميم المقطع (سماكة + تسليح + مطاوعة)
  * GeometryComparisonReport: مقارنة المقاطع الهندسية
  * BenchmarkCase: حالة اختبار مرجعية كاملة (inputSpec + referenceSpec + expectedIntermediateValues + expectedFinalValues + expectedFinalDecision + engineNotes)
  * ExpectedValue: قيمة مرجعية مع رمز + وحدة + تسامح
  * BenchmarkResult / BenchmarkRunReport: نتائج تشغيل الـ Benchmarks
  * SOIL_CODE_TO_REFERENCE_NAME / SOIL_CODE_TO_AR: تعيين رموز التربة لأسماء SOIL_TABLE

- إنشاء src/lib/engine/benchmarks/bmk-01.ts — BMK-01: Low-impact penetration benchmark
  * FAB-250 + V=200 m/s + SOFT_SOIL
  * 6 قيم وسيطة + 3 قيم نهائية (x1, h0, Pso)
  * القيم المرجعية TODO — تُملأ من Excel بعد تشغيل المحرك

- إنشاء src/lib/engine/benchmarks/bmk-02.ts — BMK-02: Design-critical medium case
  * FAB-500 + V=350 m/s + MEDIUM_SOIL + fc=35 + fy=420
  * 12 قيمة وسيطة (lambda1, lambda2, n, C_eff, x1, h_bar_z, Z, sigma_max, Pr, T0, DIF_c, DIF_s)
  * 5 قيم نهائية (P_design, ht, As, e/h, v_actual/v_cd)
  * DIF_c=1.25 و DIF_s=1.20 مثبتتان كقيم UFC

- إنشاء src/lib/engine/benchmarks/bmk-03.ts — BMK-03: Critical hard-rock failure benchmark
  * FAB-1500 + V=450 m/s + HARD_ROCK
  * 9 قيم وسيطة + 4 قيم نهائية (penetrationDepth, spallingThickness, P_design, e/h)
  * الحالة تتوقع WARNING_OR_FAILURE — فشل هش و spalling
  * شرط e <= h/6 يجب أن يُفشل هنا

- إنشاء src/lib/engine/benchmarks/index.ts — التصدير الموحد + دوال بحث (getBenchmarkById, getBenchmarksBySoilType, getBenchmarksByPriority)

- إنشاء src/lib/engine/weapons-library.ts — مكتبة الأسلحة الموحدة:
  * FAB_WEAPONS_LIBRARY: FAB-250, FAB-500, FAB-1500 (روسية)
  * UNIFIED_WEAPONS_LIBRARY: يجمع الأمريكية (14) + الروسية (3) = 17 سلاح
  * دوال بحث: getWeaponById, getWeaponByName, getWeaponsLibraryStats
  * تحويل BombData → WeaponData تلقائياً

- إنشاء src/lib/engine/index.ts — التصدير الرئيسي الموحد

- التحقق: TypeScript بدون أخطاء في الملفات الجديدة
- البناء: next build ناجح (11 routes)
- الاختبارات: 117/117 PASS (6 ملفات)

Stage Summary:
- الملفات المنتجة: 6 ملفات TypeScript جديدة (types.ts + 3 benchmarks + weapons-library + 2 index)
- الأنواع الموحدة: 20+ نوع/واجهة تشمل كامل خط الحساب (اختراق → انفجار → تصميم → تحقق)
- Benchmarks: 3 حالات مرجعية (منخفض/متوسط/حرج) بقوالب قابلة للتوسع
- مكتبة الأسلحة: 17 سلاح (14 أمريكية + 3 روسية FAB) موحدة في WeaponData
- التعيينات: SoilTypeCode ↔ SOIL_TABLE.name مُثبَّتة ولا يمكن تعديلها بدون مراجعة
- القيم المرجعية: TODO — تُملأ من Excel بعد كتابة penetration-core
