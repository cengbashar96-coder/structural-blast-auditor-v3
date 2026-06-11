// ═══════════════════════════════════════════════════════════════════════
// طبقة اختبارات القبول العكسية وثنائية الاتجاه - structural.test.ts
// منصة المدقق الديناميكي الموحد V3.0
// باستخدام أداة Vitest
// ═══════════════════════════════════════════════════════════════════════

import { describe, test, expect } from 'vitest';
import { calculateStructuralVerification } from '../src/lib/structural/structuralEngine';
import type { StructuralInput } from '../src/lib/structural/structuralSchema';
import { calculateBlastLoad } from '../src/lib/structural/blastEngine';
import { BOMB_DATABASE, EXPLOSIVE_TABLE, SOIL_TABLE, CONCRETE_RESISTANCE } from '../src/lib/structural/baselineConstants';

describe('Structural Design Engine & RTM Verification Tests', () => {

  test('TC-STRUCT-001: Verification of Syrian Code Path and Core Eccentricity (Success Mode)', () => {
    // سماكة كبيرة مناسبة لتحمل ضغط العصف + أعمدة كبيرة
    const mockInput: StructuralInput = {
      designMethod: "SYRIAN_WSD_2024",
      f_c: 40,        // خرسانة عالية المقاومة
      f_y: 400,
      h_slab: 2000,    // سماكة كافية للقص الثاقب الديناميكي
      b_column: 800,   // أعمدة كبيرة تقلل إجهاد القص
      h_column: 800,
      a_tributary: 15, // مساحة روافدية معقولة
      p_design: 200,   // ضغط انفجار منخفض نسبياً
      m_dynamic: 200,
      n_dynamic: 5000, // قوة محورية عالية = لامركزية منخفضة
    };

    const result = calculateStructuralVerification(mockInput);
    
    expect(result.status).toBe('SUCCESS');
    expect(result.eccentricity).toBeLessThanOrEqual(result.e_limit);
    expect(result.svgColor).toBe('GREEN');
    expect(result.rho_final).toBe(0.0025);
    expect(result.d_eff).toBe(1950);
    expect(result.b_0).toBeGreaterThan(0);
    expect(result.v_actual).toBeLessThanOrEqual(result.v_cd!);
  });

  test('TC-STRUCT-002: Dynamic Punching Shear Failure Mode (Negative Rejection Mode)', () => {
    const mockInput: StructuralInput = {
      designMethod: "SYRIAN_WSD_2024",
      f_c: 25,
      f_y: 400,
      h_slab: 400,
      b_column: 400,
      h_column: 400,
      a_tributary: 30,
      p_design: 2350.22,
      m_dynamic: 100,
      n_dynamic: 500,
    };

    const result = calculateStructuralVerification(mockInput);
    
    expect(result.status).toBe('PUNCHING_FAILURE');
    expect(result.errorMessage).toContain('ERR-C-01');
  });

  test('TC-STRUCT-003: Core Eccentricity Outside Nucleus', () => {
    const mockInput: StructuralInput = {
      designMethod: "SYRIAN_WSD_2024",
      f_c: 35,
      f_y: 400,
      h_slab: 400,
      b_column: 300,
      h_column: 300,
      a_tributary: 20,
      p_design: 500,
      m_dynamic: 200,
      n_dynamic: 100,
    };

    const result = calculateStructuralVerification(mockInput);
    
    expect(result.eccentricity).toBeGreaterThan(result.e_limit);
    expect(result.svgColor).toBe('RED_FLASHING');
  });

  test('TC-BLAST-001: Blast Engine Reference Case - Tunnel Ceiling', () => {
    const result = calculateBlastLoad({
      bombId: 5,
      explosiveName: 'Tritonal_80_20',
      soilName: 'clay_stones',
      fallVelocity: 600,
      fallAngle: 30,
      ceilingDepth: 9.5,
      tunnelSpanShort: 1.0,
      tunnelSpanLong: 3.0,
      ceilingHeight: 2.45,
    });

    expect(result.h_penetration).toBeGreaterThan(0);
    expect(result.C_effective).toBeCloseTo(420.4, -1);
    expect(result.P_design).toBeGreaterThan(0);
    expect(result.H_roof).toBeGreaterThan(0);
  });

  test('TC-BLAST-002: Bomb Database Integrity', () => {
    expect(BOMB_DATABASE.length).toBe(14);
    expect(BOMB_DATABASE[0].type).toBe('AN-M30A1');
    expect(BOMB_DATABASE[4].type).toBe('AN-M65A1');
    expect(BOMB_DATABASE[4].charge_kg).toBe(270);
  });

  test('TC-BLAST-003: Explosive Coefficients Integrity', () => {
    expect(EXPLOSIVE_TABLE.length).toBe(5);
    expect(EXPLOSIVE_TABLE[0].K1).toBeCloseTo(1.639);
  });

  test('TC-BLAST-004: Soil Table Integrity', () => {
    expect(SOIL_TABLE.length).toBe(13);
    expect(SOIL_TABLE[2].Kpr).toBeCloseTo(6e-6);
    expect(SOIL_TABLE[12].Kp).toBeCloseTo(0.30);
  });

  test('TC-BLAST-005: Concrete Resistance Integrity', () => {
    expect(CONCRETE_RESISTANCE.M350).toBe(200);
    expect(CONCRETE_RESISTANCE.M500).toBe(280);
  });
});
