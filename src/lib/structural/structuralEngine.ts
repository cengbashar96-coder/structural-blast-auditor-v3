// ═══════════════════════════════════════════════════════════════════════
// طبقة محرك الحساب والتحقق المزدوج - structuralEngine.ts
// منصة المدقق الديناميكي الموحد V3.0
// مخرجات هذا المحرك تربط النواة الهندسية وتتحكم مباشرة بلون واجهة الـ SVG
// ═══════════════════════════════════════════════════════════════════════

import { StructuralInput, SYRIAN_CODE_2024 } from './structuralSchema';
import { UFC_340_02 } from './baselineConstants';

export interface StructuralOutput {
  status: 'SUCCESS' | 'PUNCHING_FAILURE' | 'CRITICAL_ERROR';
  d_eff: number;
  b_0: number;
  eccentricity: number;
  e_limit: number;
  svgColor: 'GREEN' | 'RED_FLASHING';
  rho_final: number;
  v_actual?: number;
  v_cd?: number;
  errorMessage?: string;
}

export function calculateStructuralVerification(input: StructuralInput): StructuralOutput {
  // 1. تفعيل تضخيم المواد ديناميكياً (DIF) بناءً على أطروحة الماجستير
  const dif_c = UFC_340_02.DIF_CONCRETE_COMPRESSION; // 1.25
  const f_cd = input.f_c * dif_c; // الإجهاد الديناميكي للخرسانة
  
  // 2. الحسابات الهندسية للمقطع ونواة اللامركزية
  const d_eff = input.h_slab - SYRIAN_CODE_2024.COVER_MIN_MM; // العمق الفعال مع غطاء حماية 50 ملم
  const b_0 = 2 * (input.b_column + d_eff) + 2 * (input.h_column + d_eff); // المحيط الحرج F-8.3.1
  const e_limit = input.h_slab / 6.0; // حد النواة الصارم F-8.3.2
  
  const eccentricity = input.n_dynamic > 0 
    ? (input.m_dynamic / input.n_dynamic) * 1000 // mm
    : 9999;
  const svgColor = eccentricity <= e_limit ? 'GREEN' : 'RED_FLASHING';

  // 3. خوارزمية التحقق السلبي من القص الثاقب الديناميكي (Punching Shear)
  if (input.designMethod === "SYRIAN_WSD_2024") {
    // إجهاد القص الثاقب المسموح للكود السوري المحدث
    const v_cd = SYRIAN_CODE_2024.V_CD_COEFF * Math.sqrt(f_cd); 
    
    // حساب قوة القص الفعلية الناتجة عن ضغط العصف المسحوب آلياً
    const critical_area = ((input.b_column + d_eff) * (input.h_column + d_eff)) / 1e6; // m^2
    const V_actual = input.p_design * (input.a_tributary - critical_area); // kN
    const v_actual = (V_actual * 1000) / (b_0 * d_eff); // MPa

    // شرط القبول أو الفشل السلبي وقفل النظام
    if (v_actual > v_cd) {
      return {
        status: 'PUNCHING_FAILURE',
        d_eff,
        b_0,
        eccentricity,
        e_limit,
        svgColor,
        rho_final: SYRIAN_CODE_2024.RHO_MIN,
        v_actual,
        v_cd,
        errorMessage: "ERR-C-01: فشل المقطع في مقاومة القص الثاقب الديناميكي وفق الكود السوري! يرجى زيادة سماكة البلاطة فوراً."
      };
    }

    return {
      status: 'SUCCESS',
      d_eff,
      b_0,
      eccentricity,
      e_limit,
      svgColor,
      rho_final: SYRIAN_CODE_2024.RHO_MIN,
      v_actual,
      v_cd,
    };
  }

  // USD_GLOBAL path - simplified check
  const v_cd = SYRIAN_CODE_2024.PHI_V * 0.33 * Math.sqrt(f_cd);
  const critical_area = ((input.b_column + d_eff) * (input.h_column + d_eff)) / 1e6;
  const V_actual = input.p_design * (input.a_tributary - critical_area);
  const v_actual = (V_actual * 1000) / (b_0 * d_eff);

  if (v_actual > v_cd) {
    return {
      status: 'PUNCHING_FAILURE',
      d_eff,
      b_0,
      eccentricity,
      e_limit,
      svgColor,
      rho_final: SYRIAN_CODE_2024.RHO_MIN,
      v_actual,
      v_cd,
      errorMessage: "ERR-C-02: Punching shear capacity exceeded per USD method."
    };
  }

  return {
    status: 'SUCCESS',
    d_eff,
    b_0,
    eccentricity,
    e_limit,
    svgColor,
    rho_final: SYRIAN_CODE_2024.RHO_MIN,
    v_actual,
    v_cd,
  };
}
