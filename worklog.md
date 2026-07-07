---
Task ID: 1-10
Agent: Super Z (Main)
Task: إعادة هيكلة واجهات المنصة — تبسيط الحسابات والنتائج + إصلاح السماكات والمقارنة

Work Log:
- إصلاح محرك structural-concrete-core.ts: استبدال المعادلة التقريبية بالمسار المُصحّح من الأطروحة (αm → ξ → h0 → Hp)
- إصلاح محرك geometry-comparator.ts: إضافة معاملات تصحيح لكل شكل (GEOMETRY_FACTORS)، 5 معايير بدل 4
- تحديث الشريط الجانبي (app-sidebar.tsx): 8 عناصر حساب + أدوات مساعدة
- إنشاء 7 واجهات مستقلة جديدة:
  - /dashboard/step2-inputs (المدخلات والجداول المرجعية)
  - /dashboard/step3-penetration (حسابات الاختراق)
  - /dashboard/step5-roof-blast (أحمال الانفجار على السقف)
  - /dashboard/step5-wall-blast (أحمال الانفجار على الجدران)
  - /dashboard/step7-ceiling (تصميم سماكة السقف)
  - /dashboard/step8-wall (تصميم سماكة الجدران)
  - /dashboard/thesis-comparison (الأطروحة والمقارنة بين الأشكال)
- إعادة كتابة لوحة التحكم الرئيسية (dashboard/page.tsx): ملخص + تنقل سريع
- إصلاح خطأ استيراد SquareArch في step7-ceiling
- بناء ناجح لجميع الصفحات (next build ✓)

Stage Summary:
- 7 واجهات جديدة + واجهة رئيسية مُبسّطة
- محرك السماكات مُصحّح (αm → ξ → h0 → Hp)
- محرك المقارنة مُصحّح (معاملات ديناميكية لكل شكل)
- جميع الصفحات تُبنى بنجاح وتستجيب (307 redirect for protected pages)
