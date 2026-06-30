---
Task ID: 4
Agent: Main Agent
Task: المرحلة 4 — بناء واجهات المستخدم (UI Pages) المتصلة بالمحرك V3.0

Work Log:
- بناء AppSidebar مع shadcn Sidebar (9 عناصر تنقل + RTL + dark theme)
- تحديث Dashboard Layout لاستخدام SidebarProvider + SidebarInset
- بناء V3EngineForm متصل بـ EngineInput (سلاح + تربة + هندسة + تصميم)
- بناء PipelineTimeline مع 7 خطوات وتصور متحرك
- بناء صفحة لوحة التحكم /dashboard مع runEngine + مقارنة BMK-02
- بناء صفحة الاختراق /dashboard/penetration مع نتائج تفصيلية
- بناء صفحة أحمال الانفجار /dashboard/blast-loads مع tabs سقف/جدار
- بناء صفحة التصميم الإنشائي /dashboard/structural-design مع SVG مقطع
- بناء صفحة التسليح /dashboard/rebar-design مع فحوصات التصميم
- بناء صفحة المقارنة /dashboard/comparison مع 3 أشكال هندسية
- بناء صفحة Benchmark /dashboard/benchmark مع تشغيل الاختبارات
- بناء صفحة المتغيرات /dashboard/variables مع جدول 42 متغير + فلاتر
- إصلاح خطأ TypeScript في rebar-design (path property)
- التحقق من عمل جميع الصفحات عبر agent-browser

Stage Summary:
- 9 صفحات جديدة متصلة بالمحرك V3.0
- مكونان أساسيان: V3EngineForm + PipelineTimeline
- Sidebar محدث مع shadcn/ui
- جميع الصفحات تعمل بدون أخطاء TypeScript
- مقارنة BMK-02 مرجعية مدمجة في كل صفحة

---
Task ID: 5-6-7
Agent: Main Agent
Task: بناء لوحة تحكم المدير الحوكمي الأعلى + نظام المصادقة الكامل

Work Log:
- تحديث Prisma Schema: إضافة SubscriptionStatus enum (PENDING/APPROVED/REJECTED/SUSPENDED) + Permission enum (7 أذونات) + حقول جديدة في User (subscriptionStatus, statusReason, permissions, approvedBy, statusChangedAt)
- تثبيت bcryptjs + @types/bcryptjs لتشفير كلمات المرور
- إنشاء src/lib/password.ts: hashPassword() + verifyPassword() باستخدام bcrypt (12 rounds)
- تحديث src/app/actions/auth.actions.ts: تفعيل التحقق الحقيقي من كلمات المرور، حفظ المستخدمين في Prisma، حالة PENDING افتراضية، تحقق من حالة الاشتراك عند الدخول
- إنشاء src/app/actions/admin.actions.ts: 9 إجراءات مدير (seedDefaultAdmin, getAllUsers, getPendingUsers, approveUser, rejectUser, suspendUser, reactivateUser, updateUserPermissions, changeUserRole, deleteUser)
- إنشاء src/middleware.ts: حماية مسارات /admin و /dashboard و /auth
- إنشاء src/components/admin/admin-dashboard-v2.tsx: لوحة تحكم كاملة مع 4 تبويبات (نظرة عامة + طلبات معلقة + المستخدمون + خط الأساس) + إدارة الأذونات + تغيير الأدوار + حذف المستخدمين
- تحديث src/app/admin/page.tsx: استخدام AdminDashboardV2
- تحديث src/components/app-sidebar.tsx: إضافة قسم الإدارة الحوكمية مع رابط لوحة المدير (Crown icon + amber theme)
- إنشاء src/app/auth/pending/page.tsx: صفحة انتظار موافقة المدير
- تحديث src/components/auth/register-form.tsx: رسالة انتظار الموافقة + تحويل لصفحة pending
- تحديث src/components/auth/login-form.tsx: تحويل لـ /dashboard بدلاً من /admin
- إصلاح خطأ parse في password.ts (تعليق متداخل)
- إصلاح مشكلة Edge Runtime في middleware (استبدال node:crypto بفحص بسيط)

Stage Summary:
- نظام مصادقة كامل مع bcrypt + Prisma
- حالة اشتراك PENDING افتراضياً حتى موافقة المدير
- لوحة تحكم مدير مع 9 إجراءات سيادية
- 7 أذونات تفصيلية قابلة للإدارة
- حماية مسارات عبر middleware
- بذر حساب المدير الافتراضي (أبو سليمان)
- Build ناجح بدون أخطاء
---
Task ID: 1
Agent: Main Agent
Task: إصلاح خلل تسجيل الدخول على Netlify - تحليل عمق وإصلاح شامل

Work Log:
- قراءة وتحليل جميع ملفات المصادقة: auth.actions.ts, login-form.tsx, session.ts, crypto-vault.ts, password.ts, middleware/proxy.ts, prisma.ts
- تحديد 5 أعطال رئيسية في مسار تسجيل الدخول
- إنشاء Supabase REST API adapter جديد (supabase-adapter.ts) بديل كامل لـ PrismaClient
- تحديث prisma.ts و db.ts لاستخدام Supabase adapter
- إصلاح next.config.ts: إزالة output: "standalone" و withSerwist
- إصلاح crypto-vault.ts: التحقق من طول ENCRYPTION_KEY + رسائل خطأ أوضح
- تحديث session.ts: sameSite='lax' بدلاً من 'strict' لمنع مشاكل redirect
- تحويل middleware.ts → proxy.ts مع export function proxy() (Next.js 16 convention)
- إصلاح صفحة الجذر: عرض قائمة رئيسية بدلاً من redirect
- تحديث Netlify build command من "npx prisma generate && npx prisma migrate deploy && npx next build" إلى "npx next build"
- البناء الناجح محلياً وعلى Netlify (74 ثانية)
- اختبار شامل: Supabase REST API يعمل، bcrypt يعمل، AES-256-GCM يعمل، proxy يعمل

Stage Summary:
- الموقع: https://structural-blast-auditor.netlify.app/
- صفحة تسجيل الدخول: /auth/login (200 OK)
- الـ proxy يعمل: /dashboard → redirect إلى /auth/login (307)
- المستخدم المدير: abu-sulaiman@structural-blast.sy / Admin@2024
- جميع المكونات تعمل: REST API, bcrypt, crypto, proxy
---
Task ID: offline-mode
Agent: Super Z
Task: تحويل التطبيق للعمل أوفلاين بدون Supabase

Work Log:
- استكشاف بنية المشروع وتحليل جميع ملفات قاعدة البيانات والمصادقة
- إنشاء محول SQLite محلي (sqlite-adapter.ts) باستخدام better-sqlite3
- إنشاء محول JSON محلي (json-adapter.ts) كبديل مستقر بدون وحدات أصلية
- إنشاء محول موحد (unified-adapter.ts) يبدل تلقائياً بين Supabase و JSON
- تحديث ملفات إعادة التصدير (prisma.ts, db.ts) لاستخدام المحول الموحد
- إضافة checkDatabaseConnection للمحول الموحد
- تحديث next.config.ts لدعم الحزم الخارجية
- حل مشكلة تعارض middleware.ts مع proxy.ts في Next.js 16
- إنشاء .env.local لإعداد الوضع الأوفلاين تلقائياً
- بناء واختبار التطبيق بنجاح أوفلاين

Stage Summary:
- التطبيق يعمل أوفلاين بالكامل عبر قاعدة بيانات JSON محلية
- تسجيل الدخول والجلسات يعملان بدون اتصال بالإنترنت
- بذر تلقائي لحساب المدير الافتراضي (abu-sulaiman@structural-blast.sy / Admin@2024)
- تبديل تلقائي: FORCE_OFFLINE=true أو غياب متغيرات Supabase → JSON محلي
- جميع API routes تعمل: auth-login, auth-session, auth-logout, setup-db, health
- ملفات تم إنشاؤها:
  - src/lib/db/json-adapter.ts (قاعدة بيانات JSON محلية)
  - src/lib/db/sqlite-adapter.ts (قاعدة بيانات SQLite محلية)
  - src/lib/db/unified-adapter.ts (محول موحد)
  - .env.local (إعدادات الوضع الأوفلاين)
