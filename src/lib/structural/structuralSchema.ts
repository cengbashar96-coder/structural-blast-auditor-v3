// ═══════════════════════════════════════════════════════════════════════
// طبقة التحقق وقفل البيانات المرجعية - structuralSchema.ts
// منصة المدقق الديناميكي الموحد V3.0
// باستخدام مكتبة Zod لقفل المدخلات والمخرجات ومنع العبث
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';

// القوانين والحدود الصارمة المقفلة كودياً
export const SYRIAN_CODE_2024 = {
  V_CD_COEFF: 0.25,
  PHI_V: 0.85,
  RHO_MIN: 0.0025,
  RHO_MAX_COEFF: 0.5,
  SAFETY_FACTOR_KN: 1.4,
  COVER_MIN_MM: 50,
} as const;

// التحقق الصارم من مدخلات خط البيانات (Data Pipeline) للقراءة فقط
export const StructuralInputSchema = z.object({
  designMethod: z.enum(["SYRIAN_WSD_2024", "USD_GLOBAL"]),
  f_c: z.number().min(25).max(60),       // المقاومة المميزة للخرسانة MPa
  f_y: z.number().min(240).max(420),     // إجهاد خضوع الحديد MPa
  h_slab: z.number().min(300).max(2500), // سماكة البلاطة mm
  b_column: z.number().min(200),          // أبعاد العمود mm
  h_column: z.number().min(200),
  a_tributary: z.number().positive(),     // المساحة الروافدية m^2
  
  // المدخلات الحرجة المسحوبة تلقائياً (Read-Only) من مخرجات المحرك الثاني (ب)
  p_design: z.number().positive(),       // ضغط العصف النهائي kPa
  m_dynamic: z.number().nonnegative(),   // العزم الديناميكي kN.m
  n_dynamic: z.number().nonnegative(),   // القوة المحورية الديناميكية kN
});

export type StructuralInput = z.infer<typeof StructuralInputSchema>;

// مخطط مخرجات المحرك الإنشائي
export const StructuralOutputSchema = z.object({
  status: z.enum(['SUCCESS', 'PUNCHING_FAILURE', 'CRITICAL_ERROR']),
  d_eff: z.number().positive(),
  b_0: z.number().positive(),
  eccentricity: z.number(),
  e_limit: z.number().positive(),
  svgColor: z.enum(['GREEN', 'RED_FLASHING']),
  rho_final: z.number().min(0.0025),
  v_actual: z.number().optional(),
  v_cd: z.number().optional(),
  errorMessage: z.string().optional(),
});

export type StructuralOutput = z.infer<typeof StructuralOutputSchema>;
