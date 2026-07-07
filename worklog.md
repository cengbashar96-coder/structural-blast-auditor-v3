---
Task ID: 1
Agent: main
Task: إعادة هيكلة الواجهات + إصلاح المحرك + ملء BMK-01/03 + رفع GitHub

Work Log:
- إصلاح نوع المتفجرات في weapons-library.json (Tritonal → Tritonal_80_20)
- إصلاح دالة getExplosiveK1 بمطابقة مرنة
- ملء قيم BMK-01 (FAB-250 + SOFT_SOIL): lambda1=1.1347, C_ef=95kg, x1=9.53m, Pso=0.287MPa
- ملء قيم BMK-03 (FAB-1500 + HARD_ROCK): lambda1=1.1347, C_ef=646kg, x1=1.903m, sigma=260MPa
- إعادة بناء 7 واجهات مستقلة + لوحة التحكم الرئيسية
- اختبار البناء بنجاح (35 صفحة)
- رفع التحديثات إلى git (commit محلي)

Stage Summary:
- البناء ينجح: npx next build ✓
- الواجهات: step2-inputs, step3-penetration, step5-roof-blast, step5-wall-blast, step7-ceiling, step8-wall, thesis-comparison
- BMK-01 و BMK-03 مقفلان بقيم محسوبة من المحرك
- يحتاج: رفع يدوي إلى GitHub + إضافة متغيرات Netlify البيئية
