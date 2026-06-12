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
