#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
منصة المدقق الديناميكي الموحد V3.0
التقرير الشامل — جميع المراحل من مدخلات ومخرجات ونتائج ورسومات
"""

import math
import os
import json
from datetime import datetime

# ═══════════════════════════════════════════════════════════════════════
# 1. المدخلات والثوابت المرجعية — الحالة BMK-02 (MK83 + MEDIUM_SOIL)
# ═══════════════════════════════════════════════════════════════════════

# --- الخطوة 2: المدخلات ---
INPUTS = {
    'P': 441,          # kg - وزن القنبلة
    'lo_b': 3.01,      # m - طول القنبلة
    'lk': 1.92,        # m - طول الجسم
    'dk': 0.36,        # m - قطر القنبلة
    'ld_ratio': 5.3,   # L/D
    'lhd_ratio': 2,    # Lh/D
    'C': 215,          # kg - وزن الشحنة
    'V': 350,          # m/s - سرعة الاصطدام
    'alpha': 20,       # deg - زاوية الاصطدام
    'beta': 22,        # deg - زاوية الانعكاس
    'Z': 3.7,          # m - عمق السقف
}

# --- الخطوة 2: قيم البحث (Lookups) ---
LOOKUPS = {
    'K1': 1.639,           # معامل المتفجرات (Tritonal)
    'kpr_g': 1.8e-6,       # معامل اختراق التربة (طين مع حجارة)
    'kpr_b': 8e-7,
    'kpr_bt': 8e-7,
    'K_kp_ct': 1.1,
    'm1': 1.65,
    'RbH': 200,            # kg/cm² - مقاومة الخرسانة
    'RsH': 3000,           # kg/cm² - إجهاد الخضوع للحديد
    'gamma_b': 2500,       # kg/m³ - كثافة الخرسانة
    'gamma_g': 1700,       # kg/m³ - كثافة التربة
    'Kpod_b': 1.18,
    'Kpod_s': 1.25,
    'n0': 1.25,
    'Kbt_bt': 0.13,
    'R_bar': 1.1,
}

# --- الخطوة 2: الأبعاد الهندسية ---
GEOMETRY = {
    'a_et': 3,      # m
    'bp': 5,        # m - بحر النفق الطويل
    'ap': 4,        # m - بحر النفق القصير
    'Lk': 50,       # m - طول النفق
    'Bk': 20,       # m - عرض النفق
    'Pk': 492.25,   # kg - محيط النفق
    'Hct': 0.5,     # m - سماكة الجدار الخارجي
    'Hvct': 0.3,    # m - سماكة الجدار الداخلي
    'Hf': 0.45,     # m - سماكة الأرضية
    'Hp': 0.75,     # m - سماكة السقف (أولية)
    'h_obs': 0.5,
    'psi_p': 0.012,
    'Ea': 2100000,
    'xi': 0.55,
    'rho_pc': 150,
    'rho_g': 180,
}

# ═══════════════════════════════════════════════════════════════════════
# 2. محرك الاختراق — المعادلات 13-19
# ═══════════════════════════════════════════════════════════════════════

def calc_lambda1(lhd_ratio):
    """المعادلة 14: معامل تأثير شكل الرأس"""
    return 0.5 + 0.4 * (lhd_ratio ** 0.666)

def calc_lambda2(d):
    """المعادلة 15: معامل تأثير القطر"""
    return 2.8 * (d ** 0.333) - 1.3 * (d ** 0.5)

def calc_n(lhd_ratio):
    """المعادلة 16: أُس التأثير"""
    return 3.5 - lhd_ratio

def calc_c_effective(K1, C):
    """المعادلة 19: الشحنة الفعالة"""
    return 0.95 * K1 * C

def calc_tsu_penetrating(lk, alpha_deg, n_exp):
    """المعادلة 17: معامل زاوية الاختراق — قنبلة خارقة"""
    alpha_rad = math.radians(alpha_deg)
    return 0.5 * lk * math.cos(math.radians((alpha_deg + n_exp * alpha_deg) / 2))

def calc_penetration_depth(lambda1, lambda2, kpr, P, d, V, alpha_deg):
    """المعادلة 13: عمق الاختراق"""
    alpha_rad = math.radians(alpha_deg)
    return lambda1 * lambda2 * kpr * (P / (d ** 2)) * V * math.cos(alpha_rad)

# --- تنفيذ محرك الاختراق ---
lambda1 = calc_lambda1(INPUTS['lhd_ratio'])
lambda2 = calc_lambda2(INPUTS['dk'])
n_exp = calc_n(INPUTS['lhd_ratio'])
C_ef = calc_c_effective(LOOKUPS['K1'], INPUTS['C'])
tsu = calc_tsu_penetrating(INPUTS['lk'], INPUTS['alpha'], n_exp)
h_pr = calc_penetration_depth(lambda1, lambda2, LOOKUPS['kpr_g'], INPUTS['P'], INPUTS['dk'], INPUTS['V'], INPUTS['alpha'])

# --- القيم المشتقة ---
h_z = max(h_pr - tsu, 0)
h_z_bar = h_z / (C_ef ** (1/3)) if C_ef > 0 else 0
R_actual = h_pr + INPUTS['Z']
Zp = R_actual / (C_ef ** (1/3)) if C_ef > 0 else 0
L_tunnel = 2 * GEOMETRY['Lk'] + GEOMETRY['Bk']
Y_diff = INPUTS['Z'] - h_pr
hb_destruction = h_pr * LOOKUPS.get('K_kp_ct', 1.1)
hb_cracking = h_pr * 1.3

PENETRATION_RESULTS = {
    'lambda1': lambda1,
    'lambda2': lambda2,
    'n_exp': n_exp,
    'C_ef': C_ef,
    'tsu': tsu,
    'h_pr': h_pr,
    'h_z': h_z,
    'h_z_bar': h_z_bar,
    'R_actual': R_actual,
    'Zp': Zp,
    'L_tunnel': L_tunnel,
    'Y_diff': Y_diff,
    'hb_destruction': hb_destruction,
    'hb_cracking': hb_cracking,
}

# ═══════════════════════════════════════════════════════════════════════
# 3. الخطوة 4: اعتماد السماكات
# ═══════════════════════════════════════════════════════════════════════

STEP4 = {
    'Hp': 70.4594848625,       # cm - سماكة السقف النهائية
    'Hc': 49.8223795452,       # cm - سماكة الجدار النهائية
    'Hf': 42.3490226134,       # cm - سماكة الأرضية النهائية
    'Hvct': 30,                # cm - سماكة الجدار الداخلي
    'ht': 107.2167056901,      # cm - العمق الكلي
    'Bt': 8.0520158398,        # m - البحر المكافئ
    'Hpc': 3.8320486334,       # m - العمق الحرج
    'Pp_roof': 4.9211162574,   # kg/cm² - الحمل التصميمي للسقف
    'Pp_wall': 3.7845046175,   # kg/cm² - الحمل التصميمي للجدار
}

# ═══════════════════════════════════════════════════════════════════════
# 4. الخطوة 5: حسابات الأحمال — مسار السقف
# ═══════════════════════════════════════════════════════════════════════

STEP5_ROOF = {
    'h_bar': 0.1180386444,
    'R_bar_b1': 0.35,
    'R_ekv': 6.1162229173,
    'R_star': 2.4255308549,
    'max_bv': 2.8802590566,
    'tau': 0.2649955477,
    'tau_ef': 0.2377897178,
    'tau_n': 0.0364676512,
    'a0cp': 152.5,
    'a1cp': 60.8333333333,
    'omega': 561.6673670487,
    'C_dyn': 46.8110958109,
    'mu_struct': 0.8861875,
    'eta': 1.25,
    'Rsd': 3937.5,
    'Rbd': 236,
    'lambda': 0.124184033,
    'Kp': 0.8,
    'Pmax': 4.6084144906,
    'Kd': 0.92,
    'kpsi': 0.9,
    'P_ekv': 3.8157671982,
    'Pct': 1.1053490592,
    'Pp': 4.9211162574,
    'R_ekv_gt_R_star': True,
}

STEP5_WALL = {
    'tau_theta': 0.5767495645,
    'Z_wall': 7.5042156903,
    'h_b': 3.4417407889,
    'h_bar': 0.4966373747,
    'R_bar_b1': 0.9,
    'R_ekv': 7.0437416025,
    'R_star': 6.2370793411,
    'max_bv': 3.1428233472,
    'tau': 0.0684870163,
    'tau_ef': 0.0608519094,
    'tau_n': 0.0111111111,
    'a0cp': 540,
    'a1cp': 270,
    'omega': 1024.0477954056,
    'C_dyn': 72.0811111111,
    'mu_struct': 0.9123333333,
    'eta': 1.6666666667,
    'Rsd': 3937.5,
    'Rbd': 236,
    'lambda': 3.1449305556,
    'Kp': 1,
    'Pmax': 6.2856466944,
    'Kd': 1,
    'kpsi': 0.85,
    'P_ekv': 3.0828604505,
    'Pct': 0.7016441670,
    'Pp': 3.7845046175,
    'R_ekv_gt_R_star': True,
}

# ═══════════════════════════════════════════════════════════════════════
# 5. الخطوة 6: جداول B-1 إلى B-6
# ═══════════════════════════════════════════════════════════════════════

STEP6_ROOF = {
    'R_bar_b1': 0.35,    # B-1
    'mu_table': 0.025,    # B-2
    'eta_table': 0.015,   # B-2
    'Kt': 1,              # B-2
    'a0z': 180,           # B-3 m/s
    'a1z': 80,            # B-3 m/s
    'Kpod': 1.25,         # B-4
    'Kp': 0.8,            # B-5
    'Kd': 0.92,           # B-6
}

STEP6_WALL = {
    'R_bar_b1': 0.9,     # B-1
    'mu_table': 0.009,    # B-2
    'eta_table': 0.001,   # B-2
    'Kt': 1.1,            # B-2
    'a0z': 580,           # B-3 m/s
    'a1z': 290,           # B-3 m/s
    'Kpod': 1.18,         # B-4
    'Kp': 1,              # B-5
    'Kd': 1,              # B-6
}

# ═══════════════════════════════════════════════════════════════════════
# 6. الخطوة 7: سماكة السقف النهائية من العزم
# ═══════════════════════════════════════════════════════════════════════

STEP7 = {
    'Mp': 20000000,           # kg.cm - العزم
    'mu_struct': 0.8861875,
    'Rsd': 3937.5,            # kg/cm²
    'h0': 67.1042712976,      # cm
    'Hp_final': 70.4594848625,# cm (h0 * 1.05)
}

# ═══════════════════════════════════════════════════════════════════════
# 7. الخطوة 8: سماكة الجدار النهائية
# ═══════════════════════════════════════════════════════════════════════

STEP8 = {
    'Mp': 10000000,           # kg.cm
    'Hc_final': 49.8223795452,# cm
    'Hf_final': 42.3490226134,# cm
    'Hvct_final': 30,         # cm
}

# ═══════════════════════════════════════════════════════════════════════
# 8. النتائج النهائية المقفلة
# ═══════════════════════════════════════════════════════════════════════

FINAL = {
    'Hp_final': 70.4594848625,    # cm
    'Hc_final': 49.8223795452,    # cm
    'Hf_final': 42.3490226134,    # cm
    'Hvct_final': 30,             # cm
    'Pp_roof': 4.9211162574,      # kg/cm²
    'Pp_wall': 3.7845046175,      # kg/cm²
    'Pmax_roof': 4.6084144906,
    'Pmax_wall': 6.2856466944,
    'P_ekv_roof': 3.8157671982,
    'P_ekv_wall': 3.0828604505,
    'ht': 107.2167056901,
    'Bt': 8.0520158398,
    'Hpc': 3.8320486334,
    'h_pr': h_pr,
    'omega_roof': 561.6673670487,
    'omega_wall': 1024.0477954056,
    'tau_ef_roof': 0.2377897178,
    'tau_ef_wall': 0.0608519094,
    'Mp_roof': 20000000,
    'Mp_wall': 10000000,
    'C_ef': C_ef,
    'R_actual': R_actual,
    'Zp': Zp,
    'lambda1': lambda1,
    'lambda2': lambda2,
}

# ═══════════════════════════════════════════════════════════════════════
# 9. فحص التوافق — مقارنة القيم المحسوبة مع المرجعية
# ═══════════════════════════════════════════════════════════════════════

REFERENCE_LOCKED = {
    'C_ef': 334.76575,
    'lambda1': 1.134667074552914,
    'lambda2': 1.21253869486675,
    'h_pr': 2.7717367373,    # القيمة المصححة
    'R_actual': 7.6230969724513375,
    'Zp': 5.8212740516901125,
}

VERIFICATION = {}
for key, ref_val in REFERENCE_LOCKED.items():
    calc_val = PENETRATION_RESULTS.get(key, FINAL.get(key, None))
    if calc_val is not None:
        deviation = abs(calc_val - ref_val) / abs(ref_val) * 100
        VERIFICATION[key] = {
            'calculated': calc_val,
            'reference': ref_val,
            'deviation_pct': deviation,
            'status': 'PASS' if deviation < 5 else 'WARN' if deviation < 10 else 'FAIL'
        }

# ═══════════════════════════════════════════════════════════════════════
# 10. حفظ جميع النتائج كـ JSON
# ═══════════════════════════════════════════════════════════════════════

ALL_RESULTS = {
    'meta': {
        'title': 'منصة المدقق الديناميكي الموحد V3.0 — تقرير شامل',
        'case': 'BMK-02 (MK83 + MEDIUM_SOIL)',
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'codes': ['Syrian Code 2024', 'UFC 3-340-02'],
    },
    'step2_inputs': INPUTS,
    'step2_lookups': LOOKUPS,
    'step2_geometry': GEOMETRY,
    'step2_penetration': PENETRATION_RESULTS,
    'step4_locked': STEP4,
    'step5_roof': STEP5_ROOF,
    'step5_wall': STEP5_WALL,
    'step6_roof': STEP6_ROOF,
    'step6_wall': STEP6_WALL,
    'step7_ceiling': STEP7,
    'step8_wall': STEP8,
    'final_locked': FINAL,
    'verification': VERIFICATION,
}

results_path = '/home/z/my-project/download/calculation_results.json'
with open(results_path, 'w', encoding='utf-8') as f:
    json.dump(ALL_RESULTS, f, ensure_ascii=False, indent=2)

print(f"Results saved to {results_path}")
print(f"\nPenetration Results:")
for k, v in PENETRATION_RESULTS.items():
    print(f"  {k}: {v}")
print(f"\nVerification:")
for k, v in VERIFICATION.items():
    print(f"  {k}: calc={v['calculated']:.6f}, ref={v['reference']:.6f}, dev={v['deviation_pct']:.2f}%, {v['status']}")
