# Task: Blast Loads Detail Page — `/dashboard/blast-loads`

## Summary
Created the Blast Loads detail page at `/home/z/my-project/src/app/dashboard/blast-loads/page.tsx` for the Unified Dynamic Auditor Platform V3.0.

## Implementation Details

### Page Structure
- **Header**: "أحمال الانفجار — الخطوة 5" with Waves icon and sky-blue accent
- **Quick Summary Bar**: 4 compact stats showing Pmax and Pp for both Roof and Wall paths
- **Tabs**: shadcn Tabs with "مسار السقف" (sky-blue tint) and "مسار الجدار" (orange tint)
- **Engine Controls**: "تشغيل المحرك" button to run `calculateBlastLoad` + "إعادة تعيين" button to reset to reference values

### Each Tab Contains:
1. **4 Key Result Cards**: Pmax, P_ekv, Pp, ω — with deviation badges against BMK-02 reference
2. **Time Parameters Table**: τ, τ_ef, τ_n, C_dyn
3. **Distance Parameters Table**: R_ekv, R*, h̄, R̄_b1, and R_ekv > R* condition check (✓/✗)
4. **Structural Coefficients Table**: μ_struct, η, Rsd, Rbd, Kp, Kd, kpsi
5. **BMK-02 Reference Comparison**: Full deviation table with computed vs reference values, color-coded status, progress bar

### Design
- Dark theme: bg-slate-950 (layout), bg-slate-900 cards, border-slate-800
- RTL Arabic throughout
- Roof tab: sky-blue accent (bg-sky-500/15)
- Wall tab: orange accent (bg-orange-500/15)
- Color-coded deviation: emerald (<1%), amber (1-5%), red (>5%)
- Responsive grid layout (1→2→4 columns)

### Data Source
- Default values: STEP5_ROOF and STEP5_WALL from `@/lib/constants/reference-data`
- Engine execution: `calculateBlastLoad` from `@/lib/engine/blast-loads`
- Input assembly: STEP2_LOOKUPS, STEP2_GEOMETRY, STEP3_PENETRATION, STEP4_LOCKED, STEP6_ROOF, STEP6_WALL

### TypeScript
- Fixed type compatibility by using `Omit<BlastLoadOutput, 'path'>` for reference data props
- Removed unused imports (BlastLoadInput, CardDescription, STEP2_INPUTS, TrendingUp/Down/Minus)
- All TypeScript checks pass with zero errors

## Files Modified
- Created: `/home/z/my-project/src/app/dashboard/blast-loads/page.tsx` (~860 lines)
