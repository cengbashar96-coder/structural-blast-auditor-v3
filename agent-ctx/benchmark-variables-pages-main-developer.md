# Task: Create Benchmark and Variables Dashboard Pages

## Summary

Created two full-featured dashboard pages for the "Unified Dynamic Auditor Platform V3.0":

### Files Created/Modified

1. **`/src/app/api/benchmark/route.ts`** — API route for benchmark test runner
   - POST endpoint that accepts benchmark IDs
   - Builds EngineInput from each benchmark's inputSpec
   - Calls runEngine() for each benchmark
   - Compares engine output against expectedIntermediateValues + expectedFinalValues
   - Calculates deviation percentages and pass/fail status
   - Returns detailed BenchmarkRunReport[] with overall summary

2. **`/src/app/dashboard/benchmark/page.tsx`** — Benchmark test runner page
   - Header with FlaskConical icon and "اختبارات المرجعية" title
   - 3 benchmark cards (BMK-01, BMK-02, BMK-03) showing id, title, priority, isLocked status, weapon, velocity, soil
   - "تشغيل جميع الاختبارات" button to run all benchmarks
   - Results table with columns: الرمز, القيمة المتوقعة, القيمة المحسوبة, الانحراف, الحالة
   - Overall summary cards: Total checks, Passed, Failed, Max deviation
   - Individual benchmark expandable sections with detailed results and engine notes

3. **`/src/app/dashboard/variables/page.tsx`** — Variable table page
   - Header with Table icon and "جدول المتغيرات الموحد" title
   - Filter controls: Category (6 options), Step (8 options), Path (4 options), Lock status toggle
   - Variable table with columns: الاسم, الرمز, الوصف, الوحدة, المصدر, التصنيف, الخطوة, المسار, مقفل
   - Statistics cards: Total variables, Locked, Inputs, Computed, Outputs
   - Locked Values Detail expandable section with LOCKED_REGISTRY table
   - Category color coding: input=sky, lookup=teal, computed=amber, locked=red, output=emerald
   - Responsive with horizontal scroll on mobile

4. **`/src/app/page.tsx`** — Updated root page to redirect to /dashboard

### Key Design Decisions

- RTL Arabic throughout with `dir="rtl"` on root containers
- Dark theme using slate-950/900/800 color palette with emerald accents
- All shadcn/ui components (Card, Table, Select, Badge, Switch, Collapsible, etc.)
- API route pattern for engine execution (not server actions)
- Skip TODO benchmark entries (expectedValue=0) as "not yet validated" instead of failing
- Proper error handling with fallback values when engine fails
