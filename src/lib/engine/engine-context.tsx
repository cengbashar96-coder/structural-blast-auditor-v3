// ═══════════════════════════════════════════════════════════════════════
// سياق المحرك الموحد — Engine Context Provider
// منصة المدقق الديناميكي الموحد V3.1
// يخزن مدخلات المستخدم ومخرجات المحرك ويشتركها بين كل الواجهات
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SoilTypeCode, GeometryType } from './types';
import type { EngineInput, EngineOutput } from './orchestrator';

// ─── مدخلات المستخدم الموحدة ───

export interface UserInputForm {
  // القنبلة
  weaponId: string;
  impactVelocity: number;       // m/s
  impactAngleDeg: number;       // درجات
  slopeAngleDeg: number;        // درجات — زاوية ميول الجبل (β)

  // الموقع والتربة
  soilTypeCode: SoilTypeCode;
  facilityDepth: number;        // m — عمق توضع المنشأة (Z)

  // أبعاد المنشأة
  ceilingHeight: number;        // m — ارتفاع السقف (a_et)
  longSpan: number;             // m — المجاز الطويل (bp)
  shortSpan: number;            // m — المجاز القصير (ap)
  facilityLength: number;       // m — طول المنشأة (Lk)
  facilityWidth: number;        // m — عرض المنشأة (Bk)

  // المواد
  concreteGrade: string;        // مثل 'B200', 'B250', 'B300'
  steelGrade: string;           // مثل 'A400', 'A500'
  fcMpa: number;                // MPa — مقاومة ضغط الخرسانة
  fyMpa: number;                // MPa — إجهاد خضوع الحديد
  concreteDensity: number;      // kg/m³
  steelElasticModulus: number;  // kg/cm² — معامل المرونة

  // سماكات أولية (اختيارية)
  initialCeilingThickness: number; // cm — Hp
  initialWallThickness: number;    // cm — Hct
  initialFloorThickness: number;   // cm — Hf
  innerWallThickness: number;      // cm — Hvct

  // طبقات إضافية
  concealmentThickness: number; // m — سماكة طبقة التمويه
  psiP: number;                 // معامل ديناميكي للسقف
  rhoPc: number;                // معامل طبقة توزيع الضغط
  rhoG: number;                 // معامل التربة حول الجدار
}

// ─── حالة المحرك ───

export interface EngineState {
  /** مدخلات المستخدم */
  userInput: UserInputForm;
  /** مخرجات المحرك (null = لم يُشغَّل بعد) */
  engineOutput: EngineOutput | null;
  /** هل المحرك قيد التشغيل؟ */
  isComputing: boolean;
  /** رسائل الخطأ */
  error: string | null;
  /** هل تم التشغيل مرة واحدة على الأقل؟ */
  hasComputed: boolean;
}

// ─── القيم الافتراضية ───

export const DEFAULT_USER_INPUT: UserInputForm = {
  weaponId: 'W_MK83',
  impactVelocity: 350,
  impactAngleDeg: 20,
  slopeAngleDeg: 22,
  soilTypeCode: 'MEDIUM_SOIL',
  facilityDepth: 3.7,
  ceilingHeight: 3,
  longSpan: 5,
  shortSpan: 4,
  facilityLength: 50,
  facilityWidth: 20,
  concreteGrade: 'B300',
  steelGrade: 'A400',
  fcMpa: 30,
  fyMpa: 400,
  concreteDensity: 2500,
  steelElasticModulus: 2100000,
  initialCeilingThickness: 75,
  initialWallThickness: 50,
  initialFloorThickness: 45,
  innerWallThickness: 30,
  concealmentThickness: 0.5,
  psiP: 0.012,
  rhoPc: 150,
  rhoG: 180,
};

// ─── السياق ───

interface EngineContextValue extends EngineState {
  /** تحديث حقل واحد في المدخلات */
  updateField: <K extends keyof UserInputForm>(key: K, value: UserInputForm[K]) => void;
  /** تحديث عدة حقول دفعة واحدة */
  updateFields: (partial: Partial<UserInputForm>) => void;
  /** إعادة تعيين المدخلات للقيم الافتراضية */
  resetInputs: () => void;
  /** تشغيل المحرك */
  runComputation: () => Promise<void>;
  /** بناء كائن EngineInput من المدخلات الحالية */
  buildEngineInput: () => EngineInput;
}

const EngineContext = createContext<EngineContextValue | null>(null);

// ─── المزوّد (Provider) ───

export function EngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngineState>({
    userInput: { ...DEFAULT_USER_INPUT },
    engineOutput: null,
    isComputing: false,
    error: null,
    hasComputed: false,
  });

  const updateField = useCallback(<K extends keyof UserInputForm>(key: K, value: UserInputForm[K]) => {
    setState(prev => ({
      ...prev,
      userInput: { ...prev.userInput, [key]: value },
    }));
  }, []);

  const updateFields = useCallback((partial: Partial<UserInputForm>) => {
    setState(prev => ({
      ...prev,
      userInput: { ...prev.userInput, ...partial },
    }));
  }, []);

  const resetInputs = useCallback(() => {
    setState(prev => ({
      ...prev,
      userInput: { ...DEFAULT_USER_INPUT },
      engineOutput: null,
      error: null,
      hasComputed: false,
    }));
  }, []);

  const buildEngineInput = useCallback((): EngineInput => {
    const u = state.userInput;
    return {
      penetration: {
        weaponId: u.weaponId,
        impactVelocity: u.impactVelocity,
        soilTypeCode: u.soilTypeCode,
        impactAngleDeg: u.impactAngleDeg,
      },
      blast: {
        radialDistance: u.facilityDepth,
        ceilingDepth: u.facilityDepth,
      },
      design: {
        tunnelSpanShort: u.shortSpan,
        tunnelSpanLong: u.longSpan,
        fcMpa: u.fcMpa,
        fyMpa: u.fyMpa,
        slabThicknessHintMm: u.initialCeilingThickness * 10, // cm → mm
        reinforcementRatio: 0.005,
      },
    };
  }, [state.userInput]);

  const runComputation = useCallback(async () => {
    setState(prev => ({ ...prev, isComputing: true, error: null }));

    try {
      const engineInput = buildEngineInput();

      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(engineInput),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `خطأ HTTP: ${response.status}`);
      }

      const output: EngineOutput = await response.json();

      setState(prev => ({
        ...prev,
        engineOutput: output,
        isComputing: false,
        hasComputed: true,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isComputing: false,
        error: err instanceof Error ? err.message : 'خطأ غير معروف',
      }));
    }
  }, [buildEngineInput]);

  return (
    <EngineContext.Provider
      value={{
        ...state,
        updateField,
        updateFields,
        resetInputs,
        runComputation,
        buildEngineInput,
      }}
    >
      {children}
    </EngineContext.Provider>
  );
}

// ─── الخطاف (Hook) ───

export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContext);
  if (!ctx) {
    throw new Error('useEngine must be used within <EngineProvider>');
  }
  return ctx;
}
