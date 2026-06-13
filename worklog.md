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
