# Task: Geometry Comparison Page

## Agent: main

## Summary
Created the Geometry Comparison page (`/dashboard/comparison`) for the Unified Dynamic Auditor Platform V3.0.

## Files Created/Modified

### Created:
1. **`/home/z/my-project/src/app/api/comparison/route.ts`** — API endpoint that:
   - Computes `SectionDesignResult` for all 3 geometry types (RECTANGULAR, CIRCULAR, ARCHED) using `designConcreteSection`
   - Runs `compareGeometries` to generate the `GeometryComparisonReport`
   - Returns comparison data, structural results, weights, and design inputs
   - Uses BMK-02 reference data (MK83 + MEDIUM_SOIL)

2. **`/home/z/my-project/src/app/dashboard/comparison/page.tsx`** — Full comparison page with:
   - **Header**: "المفاضلة الهندسية" with BarChart3 icon
   - **Comparison Table**: Side-by-side for 3 geometry types with 5 criteria rows (thickness, steel weight, concrete volume, dynamic moment, safety status), best values highlighted in emerald
   - **Recommended Geometry Card**: Emerald-bordered card with explanation and summary
   - **Visual Diagrams**: 3 SVG cross-sections (Rectangle, Circle, Arched) with labeled dimensions
   - **Decision Criteria Card**: 4 weight cards with progress bars showing the decision weights
   - **Design Inputs Summary**: 5 key design parameters displayed
   - Status badges: SUCCESS=green, WARNING=amber, FAILURE=red
   - Responsive: stacks vertically on mobile
   - RTL Arabic, dark theme, shadcn/ui components
   - Loading skeleton and error state handling

### Existing (verified):
- **`/home/z/my-project/src/components/app-sidebar.tsx`** — Already contains the navigation link to `/dashboard/comparison` with BarChart3 icon

## Technical Details
- API uses `GET /api/comparison` — computes on server side, no database needed
- Page fetches from API on mount via `useEffect`
- Uses `compareGeometries` and `DEFAULT_WEIGHTS` from `@/lib/engine/geometry-comparator`
- Types imported from `@/lib/engine/types`
- No TypeScript errors in the new files
- No lint errors in the new files
