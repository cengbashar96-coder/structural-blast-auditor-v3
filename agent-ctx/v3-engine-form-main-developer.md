# Task: Create V3EngineForm Component

## Agent: Main Developer

## Summary
Created the V3EngineForm component for the "Unified Dynamic Auditor Platform V3.0" (منصة المدقق الديناميكي الموحد V3.0).

## Files Created/Modified

### 1. `/home/z/my-project/src/components/v3-engine-form.tsx` (NEW)
- **Purpose**: Form component that collects all EngineInput fields for the V3.0 orchestrator
- **Features**:
  - Weapon selection dropdown populated from `WEAPONS` constant, showing nameAr + weightKg + chargeKg
  - Soil type dropdown populated from `SOILS` constant, showing nameAr
  - Number inputs for: impactVelocity (350), impactAngleDeg (20), ceilingDepth (3.7), tunnelSpanShort (4), tunnelSpanLong (5), fcMpa (30), fyMpa (400)
  - Weapon info card showing: الوزن, القطر, الشحنة, المتفجرات + origin badge
  - Three logical sections: مدخلات الاختراق / مدخلات الانفجار / مدخلات التصميم
  - Full-width amber/orange calculate button (bg-amber-600 hover:bg-amber-500)
  - RTL layout, Arabic labels, dark theme (bg-slate-900, border-slate-800)
  - Responsive grid: 2 cols mobile, 3-4 cols desktop
  - Summary badges at the bottom showing current input values
  - Loading state with spinner when calculating

- **Props**: `onCalculate: (input: EngineInput) => void`, `isCalculating: boolean`, `defaultValues?: Partial<EngineInput>`
- **Imports**: WEAPONS, SOILS, EngineInput, WeaponData, SoilTypeCode from `@/lib/engine`
- **UI Components**: Card, Select, Input, Label, Button, Badge, Separator from shadcn/ui
- **Icons**: Bomb, Mountain, Ruler, Crosshair, Triangle, ArrowDownFromLine, Square, RectangleHorizontal, FlaskConical, Construction, Loader2, Zap from lucide-react

### 2. `/home/z/my-project/src/app/page.tsx` (MODIFIED)
- Replaced old page with clean integration of V3EngineForm
- Includes API call to `/api/engine/run` on form submission
- Displays EngineOutput results with sections for:
  - Penetration results (depth, crater)
  - Blast results (design pressure, scaled distance Z)
  - Structural results per geometry type (RECTANGULAR, CIRCULAR, ARCHED)
  - Recommended geometry
  - Warnings list
- Error handling with user-friendly Arabic messages
- ResultCard helper component for displaying individual metrics

### 3. `/home/z/my-project/src/app/api/engine/route.ts` (NEW)
- POST endpoint at `/api/engine/run`
- Accepts EngineInput JSON body
- Validates required fields before running engine
- Calls `runEngine()` from orchestrator
- Returns EngineOutput or error response

## Design Decisions
- Used `ceilingDepth` value for both `blast.radialDistance` and `blast.ceilingDepth` in the EngineInput mapping, as per the spec: "Ceiling Depth (Z) — this becomes blast.radialDistance + blast.ceilingDepth"
- Default weapon: WEAPONS[4] (AN-M65A1, 1000 lbs class) - a mid-range weapon for initial testing
- Used `Triangle` icon instead of non-existent `Angle` icon for the impact angle field

## Lint & Type Check
- ✅ ESLint passes with no errors for all new/modified files
- ✅ TypeScript type check passes with no errors for all new/modified files
