#!/usr/bin/env python3
"""
Step 2: Build Unified Data Model for the Unified Dynamic Auditor Platform V3.0
Extracts, classifies, normalizes, and locks all variables from Excel files and reference analysis.
"""

import json
from typing import Dict, List, Any

# ============================================================================
# UNIFIED VARIABLE MODEL
# ============================================================================

unified_table = [
    # =========================================================================
    # ENGINE 1: PENETRATION ENGINE (محرك الاختراق)
    # Source: Excel 1 (Sheet2 + Sheet3) + Excel 2 (Sheet1 Section 1-3)
    # =========================================================================

    # --- USER INPUTS (مدخلات المستخدم) ---
    {
        "name": "bombId",
        "symbol": "—",
        "description_ar": "معرف القنبلة المختارة من قاعدة البيانات",
        "description_en": "Selected bomb identifier from database",
        "unit": "—",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "fallVelocity",
        "symbol": "V",
        "description_ar": "السرعة الابتدائية لسقوط القنبلة",
        "description_en": "Initial fall velocity of the bomb",
        "unit": "m/s",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "fallAngle",
        "symbol": "α",
        "description_ar": "زاوية سقوط القنبلة عن الشاقول",
        "description_en": "Bomb fall angle from vertical",
        "unit": "degree",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "mountainSlope",
        "symbol": "β",
        "description_ar": "زاوية ميول الجبل",
        "description_en": "Mountain slope angle",
        "unit": "degree",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "tunnelDepth",
        "symbol": "Z",
        "description_ar": "عمق توضع المنشأة (النفق)",
        "description_en": "Depth of structure (tunnel) placement",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "soilTypeCode",
        "symbol": "—",
        "description_ar": "رمز نوع التربة المحيطة",
        "description_en": "Soil type code surrounding the structure",
        "unit": "—",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },

    # --- LOOKUP: WEAPON DATABASE (جدول 1) ---
    {
        "name": "bombWeight",
        "symbol": "P",
        "description_ar": "وزن القنبلة",
        "description_en": "Bomb weight",
        "unit": "kg",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "bombTotalLength",
        "symbol": "lоб",
        "description_ar": "الطول العام للقنبلة",
        "description_en": "Total bomb length",
        "unit": "m",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "bombBodyLength",
        "symbol": "lk",
        "description_ar": "طول جسم القنبلة (الهيكل)",
        "description_en": "Bomb body (casing) length",
        "unit": "m",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "bombBodyDiameter",
        "symbol": "dk",
        "description_ar": "قطر جسم القنبلة (نصف القطر = d)",
        "description_en": "Bomb body diameter (radius = d = dk/2 in some formulas)",
        "unit": "m",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "fillerLengthToDiameterRatio",
        "symbol": "lᴈ/dk",
        "description_ar": "نسبة طول الحشوة إلى قطر الهيكل",
        "description_en": "Filler length to body diameter ratio",
        "unit": "—",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "noseLengthToDiameterRatio",
        "symbol": "lгч/dk",
        "description_ar": "نسبة طول الرأس الحربي إلى القطر",
        "description_en": "Nose (warhead) length to diameter ratio",
        "unit": "—",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "explosiveWeight",
        "symbol": "C",
        "description_ar": "وزن المواد المتفجرة في القنبلة",
        "description_en": "Explosive charge weight",
        "unit": "kg",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "explosiveType",
        "symbol": "—",
        "description_ar": "نوع المادة المتفجرة",
        "description_en": "Explosive material type",
        "unit": "—",
        "source": "Excel1_Table1",
        "type": "lookup",
        "depends_on": ["bombId"],
        "locked": False,
        "engine": "penetration"
    },

    # --- LOOKUP: EXPLOSIVE COEFFICIENTS (جدول 3) ---
    {
        "name": "explosiveCoeffK1",
        "symbol": "K1",
        "description_ar": "معامل قوة المادة المتفجرة نسبة للتراتيل",
        "description_en": "Explosive power coefficient relative to TNT",
        "unit": "—",
        "source": "Excel1_Table3",
        "type": "lookup",
        "depends_on": ["explosiveType"],
        "locked": False,
        "engine": "penetration"
    },

    # --- LOOKUP: SOIL COEFFICIENTS (جدول 4/5) ---
    {
        "name": "soilPenetrationCoeff",
        "symbol": "kпр.г",
        "description_ar": "معامل اختراق التربة",
        "description_en": "Soil penetration coefficient",
        "unit": "—",
        "source": "Excel1_Table4",
        "type": "lookup",
        "depends_on": ["soilTypeCode"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "soilCrackCoeff",
        "symbol": "Kв",
        "description_ar": "معامل تصدع التربة من جهة الانفجار",
        "description_en": "Soil cracking coefficient (explosion side)",
        "unit": "—",
        "source": "Excel1_Table4",
        "type": "lookup",
        "depends_on": ["soilTypeCode"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "soilDestroyCoeff",
        "symbol": "Kp",
        "description_ar": "معامل تدمير التربة",
        "description_en": "Soil destruction coefficient",
        "unit": "—",
        "source": "Excel1_Table4",
        "type": "lookup",
        "depends_on": ["soilTypeCode"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "soilOppositeCrackCoeff",
        "symbol": "Kot",
        "description_ar": "معامل تصدع التربة من الجهة المعاكسة للانفجار",
        "description_en": "Soil opposite-side cracking coefficient",
        "unit": "—",
        "source": "Excel1_Table4",
        "type": "lookup",
        "depends_on": ["soilTypeCode"],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "soilPenetrationCoeffConcrete",
        "symbol": "kпр.б",
        "description_ar": "معامل اختراق بيتون السقف",
        "description_en": "Concrete (slab) penetration coefficient",
        "unit": "—",
        "source": "Excel1_Table5",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "concreteCrackCoeff",
        "symbol": "kвt.бt",
        "description_ar": "معامل تصدع البيتون من جهة الانفجار",
        "description_en": "Concrete cracking coefficient (explosion side)",
        "unit": "—",
        "source": "Excel1_Table5",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "concreteDestroyCoeff",
        "symbol": "kр.бt",
        "description_ar": "معامل تدمير بيتون بلاطة الحماية",
        "description_en": "Concrete protection slab destruction coefficient",
        "unit": "—",
        "source": "Excel1_Table5",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },
    {
        "name": "concreteOppositeCrackCoeff",
        "symbol": "kot.бt",
        "description_ar": "معامل تصدع البيتون من الجهة المعاكسة للانفجار",
        "description_en": "Concrete opposite-side cracking coefficient",
        "unit": "—",
        "source": "Excel1_Table5",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "penetration"
    },

    # --- LOOKUP: R̅̄ LOOKUP TABLE (جدول رسومي) ---
    {
        "name": "scaledCraterRadiusBar",
        "symbol": "R̅",
        "description_ar": "نصف قطر الحفرة المختزل النسبي (من جدول حسب نوع التربة وقيمة h̄з)",
        "description_en": "Scaled relative crater radius (from lookup table based on soil type and h̄з)",
        "unit": "—",
        "source": "Excel1_Sheet3_graph",
        "type": "lookup",
        "depends_on": ["soilTypeCode", "scaledCraterDepthBar"],
        "locked": False,
        "engine": "penetration"
    },

    # --- LOOKUP: n0 SAFETY FACTOR ---
    {
        "name": "safetyFactorN0",
        "symbol": "n0",
        "description_ar": "عامل احتياط لحساب سماكة بلاطة الحماية (1.25 بيتون مسلح، 1.5 بيتون عادي)",
        "description_en": "Safety factor for protection slab thickness (1.25 reinforced concrete, 1.5 plain concrete)",
        "unit": "—",
        "source": "Excel2_Table4",
        "type": "lookup",
        "depends_on": ["slabType"],
        "locked": False,
        "engine": "penetration"
    },

    # --- LOOKUP: m1 PENETRATION NATURE FACTOR ---
    {
        "name": "penetrationNatureFactor",
        "symbol": "m1",
        "description_ar": "عامل طبيعة الاختراق في التربة (1.65 للتربة الهشة، 1.5 للمتماسكة)",
        "description_en": "Penetration nature factor (1.65 for brittle soil, 1.5 for cohesive)",
        "unit": "—",
        "source": "Excel2_Section2",
        "type": "lookup",
        "depends_on": ["soilTypeCode"],
        "locked": False,
        "engine": "penetration"
    },

    # --- COMPUTED: PENETRATION ENGINE ---
    {
        "name": "effectiveCharge",
        "symbol": "Cэф",
        "description_ar": "الشحنة الفعالة = K1 × 0.95 × C",
        "description_en": "Effective charge = K1 × 0.95 × C",
        "unit": "kg",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["explosiveCoeffK1", "explosiveWeight"],
        "locked": False,
        "engine": "penetration",
        "formula": "Cэф = K1 * 0.95 * C"
    },
    {
        "name": "effectiveChargeElongated",
        "symbol": "Cэф1",
        "description_ar": "الشحنة الفعالة للحشوة المتطاولة = Cэф / lᴈ",
        "description_en": "Effective charge for elongated filler = Cэф / lᴈ",
        "unit": "kg/m",
        "source": "Excel2_Sheet1",
        "type": "computed",
        "depends_on": ["effectiveCharge", "fillerLength"],
        "locked": False,
        "engine": "penetration",
        "formula": "Cэф1 = Cэф / lᴈ"
    },
    {
        "name": "fillerLength",
        "symbol": "lᴈ",
        "description_ar": "طول الحشوة = dk × (lᴈ/dk)",
        "description_en": "Filler length = dk × (lᴈ/dk ratio)",
        "unit": "m",
        "source": "Excel2_Sheet1",
        "type": "computed",
        "depends_on": ["bombBodyDiameter", "fillerLengthToDiameterRatio"],
        "locked": False,
        "engine": "penetration",
        "formula": "lᴈ = dk * (lᴈ/dk)"
    },
    {
        "name": "isElongatedFiller",
        "symbol": "—",
        "description_ar": "هل الحشوة متطاولة؟ (lᴈ/dk > 3)",
        "description_en": "Is filler elongated? (lᴈ/dk > 3)",
        "unit": "—",
        "source": "Excel2_Sheet1",
        "type": "computed",
        "depends_on": ["fillerLengthToDiameterRatio"],
        "locked": False,
        "engine": "penetration",
        "formula": "isElongated = (lᴈ/dk) > 3"
    },
    {
        "name": "lambda1",
        "symbol": "λ1",
        "description_ar": "معامل شكل الرأس = 0.5 + 0.4 × (lгч/d)^0.666",
        "description_en": "Nose shape coefficient = 0.5 + 0.4 × (lгч/d)^0.666",
        "unit": "—",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["noseLengthToDiameterRatio"],
        "locked": False,
        "engine": "penetration",
        "formula": "λ1 = 0.5 + 0.4 * (lгч/d)^0.666"
    },
    {
        "name": "lambda2",
        "symbol": "λ2",
        "description_ar": "معامل القطر = 2.8 × (d)^0.333 - 1.3 × (d)^0.5",
        "description_en": "Diameter coefficient = 2.8 × (d)^0.333 - 1.3 × (d)^0.5",
        "unit": "—",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["bombBodyDiameter"],
        "locked": False,
        "engine": "penetration",
        "formula": "λ2 = 2.8 * (d)^0.333 - 1.3 * (d)^0.5"
    },
    {
        "name": "penetrationDepthSoil",
        "symbol": "hпр.г",
        "description_ar": "عمق اختراق القنبلة في التربة = λ1 × λ2 × kпр.г × P / d² × V × cosα",
        "description_en": "Bomb penetration depth in soil",
        "unit": "m",
        "source": "Excel2_Sheet1",
        "type": "computed",
        "depends_on": ["lambda1", "lambda2", "soilPenetrationCoeff", "bombWeight", "bombBodyDiameter", "fallVelocity", "fallAngle"],
        "locked": True,
        "engine": "penetration",
        "formula": "hпр.г = λ1 * λ2 * kпр.г * P / d² * V * cos(α)"
    },
    {
        "name": "bombOffset",
        "symbol": "ц",
        "description_ar": "مقدار انحراف القنبلة = 0.5 × lk × cos((α+nα)/2)",
        "description_en": "Bomb offset = 0.5 × lk × cos((α+nα)/2)",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["bombBodyLength", "fallAngle"],
        "locked": False,
        "engine": "penetration",
        "formula": "ц = 0.5 * lk * cos((α + nα)/2)"
    },
    {
        "name": "craterDepth",
        "symbol": "hз",
        "description_ar": "عمق الحفرة = hпр - ц",
        "description_en": "Crater depth = penetration depth - offset",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["penetrationDepthSoil", "bombOffset"],
        "locked": False,
        "engine": "penetration",
        "formula": "hз = hпр - ц"
    },
    {
        "name": "scaledCraterDepthBar",
        "symbol": "h̄з",
        "description_ar": "عمق الحفرة المختزل = hз / (Cэф)^0.333",
        "description_en": "Scaled crater depth = hз / (Cэф)^0.333",
        "unit": "—",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["craterDepth", "effectiveCharge"],
        "locked": False,
        "engine": "penetration",
        "formula": "h̄з = hз / (Cэф)^0.333"
    },
    {
        "name": "craterRadius",
        "symbol": "R̽",
        "description_ar": "نصف قطر الحفرة = R̅̄ × (Cэф)^0.333",
        "description_en": "Crater radius = R̅̄ × (Cэф)^0.333",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["scaledCraterRadiusBar", "effectiveCharge"],
        "locked": False,
        "engine": "penetration",
        "formula": "R̽ = R̅̄ * (Cэф)^0.333"
    },
    {
        "name": "dynamicLoadHeight",
        "symbol": "H",
        "description_ar": "ارتفاع منطقة الحمل الديناميكي = R̽ + hпр - ц",
        "description_en": "Dynamic load zone height = R̽ + hпр - offset",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["craterRadius", "penetrationDepthSoil", "bombOffset"],
        "locked": True,
        "engine": "penetration",
        "formula": "H = R̽ + hпр - ц"
    },
    {
        "name": "tunnelEntranceLength",
        "symbol": "L",
        "description_ar": "طول المدخل من حد القطع = H / tan(β)",
        "description_en": "Tunnel entrance length from cut line = H / tan(β)",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["dynamicLoadHeight", "mountainSlope"],
        "locked": True,
        "engine": "penetration",
        "formula": "L = H / tan(β)"
    },
    {
        "name": "destructionRadiusSoil",
        "symbol": "Zp.г",
        "description_ar": "نصف قطر التدمير في التربة = 1.5 × kp.г × (Cэф)^0.333",
        "description_en": "Destruction radius in soil = 1.5 × kp.г × (Cэф)^0.333",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["soilDestroyCoeff", "effectiveCharge"],
        "locked": False,
        "engine": "penetration",
        "formula": "Zp = 1.5 * kp.г * (Cэф)^0.333"
    },
    {
        "name": "crackingRadiusSoil",
        "symbol": "Zot.г",
        "description_ar": "نصف قطر التصدع في التربة = 1.5 × kot.г × (Cэф)^0.333",
        "description_en": "Cracking radius in soil = 1.5 × kot.г × (Cэф)^0.333",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["soilOppositeCrackCoeff", "effectiveCharge"],
        "locked": False,
        "engine": "penetration",
        "formula": "Zot = 1.5 * kot.г * (Cэф)^0.333"
    },
    {
        "name": "depthDifference",
        "symbol": "Y",
        "description_ar": "الفرق بين عمق النفق وعمق الاختراق = Z - hпр",
        "description_en": "Depth difference = tunnel depth - penetration depth",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["tunnelDepth", "penetrationDepthSoil"],
        "locked": False,
        "engine": "penetration",
        "formula": "Y = Z - hпр"
    },
    {
        "name": "concreteThicknessDestruction",
        "symbol": "hb(تدمير)",
        "description_ar": "سماكة البيتون للتدمير = (Zp - Y) × (Kp.beton / Kp.rock)",
        "description_en": "Concrete thickness for destruction = (Zp - Y) × (Kp.beton / Kp.rock)",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["destructionRadiusSoil", "depthDifference"],
        "locked": False,
        "engine": "penetration",
        "formula": "hb = (Zp - Y) * (Kp.beton / Kp.rock)"
    },
    {
        "name": "concreteThicknessCracking",
        "symbol": "hb(تصدع)",
        "description_ar": "سماكة البيتون للتصدع = (Zot - Y) × (Kot.beton / Kot.rock)",
        "description_en": "Concrete thickness for cracking = (Zot - Y) × (Kot.beton / Kot.rock)",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["crackingRadiusSoil", "depthDifference"],
        "locked": False,
        "engine": "penetration",
        "formula": "hb = (Zot - Y) * (Kot.beton / Kot.rock)"
    },
    {
        "name": "conditionCheck",
        "symbol": "R̽ > Zp",
        "description_ar": "تحقيق شرط منطقة الحمل الديناميكي: R̽ > Zp",
        "description_en": "Dynamic load zone condition check: R̽ > Zp",
        "unit": "—",
        "source": "Excel1_Sheet2",
        "type": "computed",
        "depends_on": ["craterRadius", "destructionRadiusSoil"],
        "locked": False,
        "engine": "penetration",
        "formula": "condition = R̽ > Zp"
    },

    # --- OUTPUTS: PENETRATION ENGINE ---
    {
        "name": "penetrationDepth",
        "symbol": "hпр",
        "description_ar": "عمق اختراق القنبلة في التربة (النتيجة النهائية)",
        "description_en": "Bomb penetration depth in soil (final result)",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "output",
        "depends_on": ["lambda1", "lambda2", "soilPenetrationCoeff", "bombWeight", "bombBodyDiameter", "fallVelocity", "fallAngle"],
        "locked": True,
        "engine": "penetration"
    },
    {
        "name": "dynamicLoadZoneHeight",
        "symbol": "H",
        "description_ar": "ارتفاع منطقة الحمل الديناميكي (النتيجة النهائية)",
        "description_en": "Dynamic load zone height (final result)",
        "unit": "m",
        "source": "Excel1_Sheet2",
        "type": "output",
        "depends_on": ["craterRadius", "penetrationDepthSoil", "bombOffset"],
        "locked": True,
        "engine": "penetration"
    },

    # =========================================================================
    # ENGINE 2: BLAST LOAD ENGINE (محرك الأحمال الديناميكية)
    # Source: Excel 2 (Sheet1 Sections 1-10)
    # =========================================================================

    # --- USER INPUTS: STRUCTURE GEOMETRY ---
    {
        "name": "internalClearHeight",
        "symbol": "aэt",
        "description_ar": "الارتفاع الداخلي الصافي للمنشأة",
        "description_en": "Internal clear height of structure",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "longSpan",
        "symbol": "bp",
        "description_ar": "المجاز الطويل (البعد الطويل للنفق)",
        "description_en": "Long span of tunnel",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "shortSpan",
        "symbol": "ap",
        "description_ar": "المجاز القصير (البعد القصير للنفق)",
        "description_en": "Short span of tunnel",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "structureLength",
        "symbol": "Lk",
        "description_ar": "طول المنشأة الكلي",
        "description_en": "Total structure length",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "structureWidth",
        "symbol": "Bk",
        "description_ar": "عرض المنشأة الكلي",
        "description_en": "Total structure width",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "camouflageLayerThickness",
        "symbol": "hобс",
        "description_ar": "سماكة طبقة التمويه فوق البلاطة",
        "description_en": "Camouflage layer thickness above slab",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "initialCeilingThickness",
        "symbol": "Hп",
        "description_ar": "السماكة المبدئية للسقف (تُعاد حسابها)",
        "description_en": "Initial ceiling thickness (iteratively recalculated)",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "initialWallThickness",
        "symbol": "Hc",
        "description_ar": "السماكة المبدئية للجدار الخارجي (تُعاد حسابها)",
        "description_en": "Initial external wall thickness (iteratively recalculated)",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "initialFloorThickness",
        "symbol": "Hф",
        "description_ar": "السماكة المبدئية للأرضية",
        "description_en": "Initial floor thickness",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "initialInnerWallThickness",
        "symbol": "Hвc",
        "description_ar": "السماكة المبدئية للجدار الداخلي",
        "description_en": "Initial inner wall thickness",
        "unit": "m",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: STRUCTURE CONNECTION TYPE ---
    {
        "name": "ceilingWallConnection",
        "symbol": "—",
        "description_ar": "نوع وثاقة السقف مع الجدار (1=وثاقة، 2=متمفصل)",
        "description_en": "Ceiling-wall connection type (1=rigid, 2=hinged)",
        "unit": "—",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: PRESSURE DISTRIBUTION SOIL ---
    {
        "name": "pressureDistDestroyCoeff",
        "symbol": "Kp.pc",
        "description_ar": "معامل تدمير طبقة توزيع الضغط",
        "description_en": "Pressure distribution layer destruction coefficient",
        "unit": "—",
        "source": "Excel2_Table5",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "wallDestroyCoeff",
        "symbol": "kр.г",
        "description_ar": "عامل التدمير للتربة حول الجدار",
        "description_en": "Destruction coefficient for soil around wall",
        "unit": "—",
        "source": "Excel2_Table5",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "wallNatureFactor",
        "symbol": "Kkp.ct",
        "description_ar": "عامل يتعلق بطبيعة جدار المنشأة",
        "description_en": "Factor related to structure wall nature",
        "unit": "—",
        "source": "Excel2_Section2",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: WAVE PARAMETERS (جدول 6 + 7) ---
    {
        "name": "waveAmplitudeCeiling",
        "symbol": "A(п)",
        "description_ar": "عامل سعة الموجة للسقف",
        "description_en": "Wave amplitude factor for ceiling",
        "unit": "—",
        "source": "Excel2_Table6",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveExponentCeiling",
        "symbol": "n1(п)",
        "description_ar": "أس انحطاط الموجة للسقف",
        "description_en": "Wave decay exponent for ceiling",
        "unit": "—",
        "source": "Excel2_Table6",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveAmplitudeWall",
        "symbol": "A(c)",
        "description_ar": "عامل سعة الموجة للجدار",
        "description_en": "Wave amplitude factor for wall",
        "unit": "—",
        "source": "Excel2_Table6",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveExponentWall",
        "symbol": "n1(c)",
        "description_ar": "أس انحطاط الموجة للجدار",
        "description_en": "Wave decay exponent for wall",
        "unit": "—",
        "source": "Excel2_Table6",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: WAVE VELOCITY (جدول 7) ---
    {
        "name": "waveVelocityA0Ceiling",
        "symbol": "a0(п)",
        "description_ar": "سرعة الموجات الطولية عند سطح السقف",
        "description_en": "Longitudinal wave velocity at ceiling surface",
        "unit": "m/s",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveVelocityA1Ceiling",
        "symbol": "a1(п)",
        "description_ar": "سرعة الموجات القصية عند سطح السقف",
        "description_en": "Shear wave velocity at ceiling surface",
        "unit": "m/s",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveVelocityA0Wall",
        "symbol": "a0(c)",
        "description_ar": "سرعة الموجات الطولية عند سطح الجدار",
        "description_en": "Longitudinal wave velocity at wall surface",
        "unit": "m/s",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveVelocityA1Wall",
        "symbol": "a1(c)",
        "description_ar": "سرعة الموجات القصية عند سطح الجدار",
        "description_en": "Shear wave velocity at wall surface",
        "unit": "m/s",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "lateralPressureCoeff",
        "symbol": "ξ",
        "description_ar": "معامل الضغط الجانبي لتربة الجدار",
        "description_en": "Lateral pressure coefficient for wall soil",
        "unit": "—",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "pressureDistDensity",
        "symbol": "γp.c",
        "description_ar": "الوزن الحجمي لطبقة توزيع الضغط",
        "description_en": "Unit weight of pressure distribution layer",
        "unit": "kg/m³",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "wallSoilDensity",
        "symbol": "γг",
        "description_ar": "الوزن الحجمي لتربة الجدار",
        "description_en": "Unit weight of wall soil",
        "unit": "kg/m³",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "camouflageLayerDensity",
        "symbol": "γобс",
        "description_ar": "الوزن الحجمي لطبقة التمويه",
        "description_en": "Unit weight of camouflage layer",
        "unit": "kg/m³",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "concreteDensity",
        "symbol": "γб",
        "description_ar": "الوزن الحجمي للبيتون",
        "description_en": "Unit weight of concrete",
        "unit": "kg/m³",
        "source": "Excel2_Table7",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: CONCRETE AND STEEL STRENGTH (جدول 8 + 9) ---
    {
        "name": "concreteCompressiveStrength",
        "symbol": "RbH",
        "description_ar": "مقاومة البيتون على الضغط",
        "description_en": "Concrete compressive strength",
        "unit": "kg/cm²",
        "source": "Excel2_Table8",
        "type": "lookup",
        "depends_on": ["concreteGrade"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "steelYieldStrength",
        "symbol": "RsH",
        "description_ar": "مقاومة الحديد عند حد السيولة",
        "description_en": "Steel yield strength",
        "unit": "kg/cm²",
        "source": "Excel2_Table9",
        "type": "lookup",
        "depends_on": ["steelGrade"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "steelElasticModulus",
        "symbol": "Ea",
        "description_ar": "معامل مرونة الحديد",
        "description_en": "Steel elastic modulus",
        "unit": "kg/cm²",
        "source": "Excel2_Table9",
        "type": "lookup",
        "depends_on": ["steelGrade"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "steelReinforcementRatio",
        "symbol": "μп",
        "description_ar": "نسبة تسليح البيتون مساحياً (مبدئي)",
        "description_en": "Initial reinforcement ratio",
        "unit": "—",
        "source": "user_input",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: μ AND η AND Kt TABLES (Section B-2) ---
    {
        "name": "dampingCoeffMuCeiling",
        "symbol": "μ(п)",
        "description_ar": "معامل التخامد للسقف (حسب نوع التربة و h̄з)",
        "description_en": "Ceiling damping coefficient (from soil type and h̄з lookup)",
        "unit": "—",
        "source": "Excel2_SectionB2",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType", "scaledCraterDepthBar"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "dampingCoeffEtaCeiling",
        "symbol": "η(п)",
        "description_ar": "معامل التخامد η للسقف",
        "description_en": "Ceiling damping coefficient η",
        "unit": "—",
        "source": "Excel2_SectionB2",
        "type": "lookup",
        "depends_on": ["pressureDistSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "dampingCoeffMuWall",
        "symbol": "μ(c)",
        "description_ar": "معامل التخامد للجدار",
        "description_en": "Wall damping coefficient μ",
        "unit": "—",
        "source": "Excel2_SectionB2",
        "type": "lookup",
        "depends_on": ["wallSoilType", "scaledCraterDepthBar"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "dampingCoeffEtaWall",
        "symbol": "η(c)",
        "description_ar": "معامل التخامد η للجدار",
        "description_en": "Wall damping coefficient η",
        "unit": "—",
        "source": "Excel2_SectionB2",
        "type": "lookup",
        "depends_on": ["wallSoilType"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "timeCoeffKtCeiling",
        "symbol": "Kt(п)",
        "description_ar": "معامل الزمن Kt للسقف (حسب h̄з)",
        "description_en": "Ceiling time coefficient Kt (from h̄з lookup)",
        "unit": "—",
        "source": "Excel2_SectionB2",
        "type": "lookup",
        "depends_on": ["scaledCraterDepthBar"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "timeCoeffKtWall",
        "symbol": "Kt(c)",
        "description_ar": "معامل الزمن Kt للجدار",
        "description_en": "Wall time coefficient Kt",
        "unit": "—",
        "source": "Excel2_SectionB2",
        "type": "lookup",
        "depends_on": ["scaledCraterDepthBar"],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: Kpod AMPLIFICATION (Section B-4) ---
    {
        "name": "amplificationConcreteCeiling",
        "symbol": "Kpod.b(п)",
        "description_ar": "عامل تكبير البيتون للسقف (حسب عمق Z)",
        "description_en": "Concrete amplification factor for ceiling (from depth Z)",
        "unit": "—",
        "source": "Excel2_SectionB4",
        "type": "lookup",
        "depends_on": ["steelGrade", "ceilingPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "amplificationSteelCeiling",
        "symbol": "Kpod.s(п)",
        "description_ar": "عامل تكبير الحديد للسقف",
        "description_en": "Steel amplification factor for ceiling",
        "unit": "—",
        "source": "Excel2_SectionB4",
        "type": "lookup",
        "depends_on": ["steelGrade", "ceilingPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "amplificationConcreteWall",
        "symbol": "Kpod.b(c)",
        "description_ar": "عامل تكبير البيتون للجدار",
        "description_en": "Concrete amplification factor for wall",
        "unit": "—",
        "source": "Excel2_SectionB4",
        "type": "lookup",
        "depends_on": ["steelGrade", "wallPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "amplificationSteelWall",
        "symbol": "Kpod.s(c)",
        "description_ar": "عامل تكبير الحديد للجدار",
        "description_en": "Steel amplification factor for wall",
        "unit": "—",
        "source": "Excel2_SectionB4",
        "type": "lookup",
        "depends_on": ["steelGrade", "wallPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: Kп LOAD FACTOR (Section B-5) ---
    {
        "name": "loadFactorKpCeiling",
        "symbol": "Kп(п)",
        "description_ar": "معامل الحمل للسقف (حسب λ)",
        "description_en": "Ceiling load factor (from λ lookup)",
        "unit": "—",
        "source": "Excel2_SectionB5",
        "type": "lookup",
        "depends_on": ["lambdaCeiling"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "loadFactorKpWall",
        "symbol": "Kп(c)",
        "description_ar": "معامل الحمل للجدار",
        "description_en": "Wall load factor (from λ lookup)",
        "unit": "—",
        "source": "Excel2_SectionB5",
        "type": "lookup",
        "depends_on": ["lambdaWall"],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: Kд DYNAMIC FACTOR (Section B-6) ---
    {
        "name": "dynamicFactorKdCeiling",
        "symbol": "Kд(п)",
        "description_ar": "معامل الديناميك للسقف (حسب ωτн)",
        "description_en": "Ceiling dynamic factor (from ωτн lookup)",
        "unit": "—",
        "source": "Excel2_SectionB6",
        "type": "lookup",
        "depends_on": ["omegaTauNCeiling"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "dynamicFactorKdWall",
        "symbol": "Kд(c)",
        "description_ar": "معامل الديناميك للجدار",
        "description_en": "Wall dynamic factor (from ωτн lookup)",
        "unit": "—",
        "source": "Excel2_SectionB6",
        "type": "lookup",
        "depends_on": ["omegaTauNWall"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "shapeFactorKpsiCeiling",
        "symbol": "kψ(п)",
        "description_ar": "معامل شكل الموجة للسقف",
        "description_en": "Ceiling wave shape factor",
        "unit": "—",
        "source": "Excel2_SectionB6",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "shapeFactorKpsiWall",
        "symbol": "kψ(c)",
        "description_ar": "معامل شكل الموجة للجدار",
        "description_en": "Wall wave shape factor",
        "unit": "—",
        "source": "Excel2_SectionB6",
        "type": "lookup",
        "depends_on": [],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: τэф/τ INTERPOLATION TABLE (Sheet2) ---
    {
        "name": "effectiveTimeRatio",
        "symbol": "τэф/τ",
        "description_ar": "نسبة الزمن الفعال إلى الزمن الكلي (استكمال من جدول)",
        "description_en": "Effective-to-total time ratio (interpolation from table)",
        "unit": "—",
        "source": "Excel2_Sheet2_interpolation",
        "type": "lookup",
        "depends_on": ["maxStressCeiling"],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: a0z and a1z FROM GRAPHS (Section B-3) ---
    {
        "name": "waveVelocityA0zCeiling",
        "symbol": "a0z(п)",
        "description_ar": "سرعة الموجات الطولية عند مستوى السقف (من الرسم ص76)",
        "description_en": "Longitudinal wave velocity at ceiling level (from graph p76)",
        "unit": "m/s",
        "source": "Excel2_SectionB3_graph",
        "type": "lookup",
        "depends_on": ["waveVelocityA0Ceiling", "ceilingPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveVelocityA1zCeiling",
        "symbol": "a1z(п)",
        "description_ar": "سرعة الموجات القصية عند مستوى السقف",
        "description_en": "Shear wave velocity at ceiling level",
        "unit": "m/s",
        "source": "Excel2_SectionB3_graph",
        "type": "lookup",
        "depends_on": ["waveVelocityA1Ceiling", "ceilingPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveVelocityA0zWall",
        "symbol": "a0z(c)",
        "description_ar": "سرعة الموجات الطولية عند مستوى الجدار",
        "description_en": "Longitudinal wave velocity at wall mid-height",
        "unit": "m/s",
        "source": "Excel2_SectionB3_graph",
        "type": "lookup",
        "depends_on": ["waveVelocityA0Wall", "wallPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },
    {
        "name": "waveVelocityA1zWall",
        "symbol": "a1z(c)",
        "description_ar": "سرعة الموجات القصية عند مستوى الجدار",
        "description_en": "Shear wave velocity at wall mid-height",
        "unit": "m/s",
        "source": "Excel2_SectionB3_graph",
        "type": "lookup",
        "depends_on": ["waveVelocityA1Wall", "wallPlacementDepth"],
        "locked": False,
        "engine": "blast"
    },

    # --- LOOKUP: IMPACT FACTOR m (Table 10) ---
    {
        "name": "impactFactorM",
        "symbol": "m",
        "description_ar": "عامل الدكة (1.0 أو 1.1 حسب سماكة طبقة التمويه و h/Zp)",
        "description_en": "Impact factor (1.0 or 1.1 based on camouflage layer and h/Zp)",
        "unit": "—",
        "source": "Excel2_Table10",
        "type": "lookup",
        "depends_on": ["camouflageLayerThickness", "tunnelDepth", "destructionRadiusSoil"],
        "locked": False,
        "engine": "blast"
    },

    # =========================================================================
    # COMPUTED: BLAST LOAD ENGINE - CEILING (السقف)
    # =========================================================================

    # Section 1: Protection slab thickness
    {
        "name": "penetrationDepthConcrete",
        "symbol": "hпр.t",
        "description_ar": "عمق اختراق القنبلة في بيتون السقف",
        "description_en": "Bomb penetration depth in ceiling concrete",
        "unit": "m",
        "source": "Excel2_Section1",
        "type": "computed",
        "depends_on": ["lambda1", "lambda2", "soilPenetrationCoeffConcrete", "bombWeight", "bombBodyDiameter", "fallVelocity", "fallAngle"],
        "locked": False,
        "engine": "blast",
        "formula": "hпр.t = λ1 * λ2 * kпр.б * P / d² * V * cos((α+nα)/2)"
    },
    {
        "name": "craterRadiusConcrete",
        "symbol": "rвt",
        "description_ar": "نصف قطر الحفرة في البيتون (مجمعة أو متطاولة)",
        "description_en": "Crater radius in concrete (compact or elongated filler)",
        "unit": "m",
        "source": "Excel2_Section1",
        "type": "computed",
        "depends_on": ["impactFactorM", "concreteCrackCoeff", "effectiveCharge", "isElongatedFiller", "effectiveChargeElongated"],
        "locked": False,
        "engine": "blast",
        "formula": "مجمعة: rвt = m * kвt.бt * (Cэф)^0.333 | متطاولة: rвt = 0.4 * m * kвt.бt * (Cэф1)^0.5"
    },
    {
        "name": "protectionSlabThickness",
        "symbol": "ht",
        "description_ar": "سماكة بلاطة الحماية = hпр.t + n0 × (rвt - ц)",
        "description_en": "Protection slab thickness = hпр.t + n0 × (rвt - offset)",
        "unit": "m",
        "source": "Excel2_Section1",
        "type": "computed",
        "depends_on": ["penetrationDepthConcrete", "safetyFactorN0", "craterRadiusConcrete", "bombOffset"],
        "locked": True,
        "engine": "blast",
        "formula": "ht = hпр.t + n0 * (rвt - ц)"
    },

    # Section 2: Protection slab projection
    {
        "name": "safetyRadiusFromWall",
        "symbol": "R0",
        "description_ar": "البعد الآمن بعد الجدار = Kkp.ct × Zp.гp",
        "description_en": "Safety distance from wall = Kkp.ct × Zp.гp",
        "unit": "m",
        "source": "Excel2_Section2",
        "type": "computed",
        "depends_on": ["wallNatureFactor", "destructionRadiusSoil"],
        "locked": False,
        "engine": "blast",
        "formula": "R0 = Kkp.ct * Zp.гp"
    },
    {
        "name": "bombDeviationFromSlabEdge",
        "symbol": "Zt",
        "description_ar": "مقدار انحراف القنبلة عن حرف البلاطة = hпр.г × tan(α)",
        "description_en": "Bomb deviation from slab edge = hпр.г × tan(α)",
        "unit": "m",
        "source": "Excel2_Section2",
        "type": "computed",
        "depends_on": ["penetrationDepthSoil", "fallAngle"],
        "locked": False,
        "engine": "blast",
        "formula": "Zt = hпр.г * tan(α)"
    },
    {
        "name": "protectionSlabProjection",
        "symbol": "Bt",
        "description_ar": "بروز بلاطة الحماية = R0 + Zt",
        "description_en": "Protection slab projection = R0 + Zt",
        "unit": "m",
        "source": "Excel2_Section2",
        "type": "computed",
        "depends_on": ["safetyRadiusFromWall", "bombDeviationFromSlabEdge"],
        "locked": True,
        "engine": "blast",
        "formula": "Bt = R0 + Zt"
    },

    # Section 3: Pressure distribution layer thickness
    {
        "name": "pressureDistRadius",
        "symbol": "Zp.pc",
        "description_ar": "نصف قطر تدمير طبقة توزيع الضغط (مجمعة أو متطاولة)",
        "description_en": "Pressure distribution layer destruction radius",
        "unit": "m",
        "source": "Excel2_Section3",
        "type": "computed",
        "depends_on": ["impactFactorM", "pressureDistDestroyCoeff", "effectiveCharge", "isElongatedFiller", "effectiveChargeElongated"],
        "locked": False,
        "engine": "blast",
        "formula": "مجمعة: Zp.pc = m * Kp.pc * (Cэф)^0.333 | متطاولة: Zp.pc = 0.44 * m * Kp.pc * (Cэф1)^0.5"
    },
    {
        "name": "pressureDistThickness",
        "symbol": "Hpc",
        "description_ar": "سماكة طبقة توزيع الضغط = R0 - (ht-hпр.t)*(Kp.pc/Kp.бt) - ц",
        "description_en": "Pressure distribution layer thickness",
        "unit": "m",
        "source": "Excel2_Section3",
        "type": "computed",
        "depends_on": ["safetyRadiusFromWall", "protectionSlabThickness", "penetrationDepthConcrete", "pressureDistDestroyCoeff", "concreteDestroyCoeff", "bombOffset"],
        "locked": True,
        "engine": "blast",
        "formula": "Hpc = R0 - (ht - hпр.t) * (Kp.pc / Kp.бt) - ц"
    },

    # Section 5.1: Max stress in pressure wave - CEILING
    {
        "name": "scaledCraterDepthBarCeiling",
        "symbol": "h̄ᴈ(п)",
        "description_ar": "عمق الحفرة المختزل للسقف = hᴈ / (Cэф)^0.333",
        "description_en": "Scaled crater depth for ceiling = hᴈ / (Cэф)^0.333",
        "unit": "—",
        "source": "Excel2_Section5_1",
        "type": "computed",
        "depends_on": ["craterDepthCeiling", "effectiveCharge"],
        "locked": False,
        "engine": "blast",
        "formula": "h̄ᴈ = hᴈ / (Cэф)^0.333"
    },
    {
        "name": "craterDepthCeiling",
        "symbol": "hᴈ(п)",
        "description_ar": "عمق الحفرة للسقف = hобс + hпр.t - ц",
        "description_en": "Crater depth for ceiling = camouflage + penetration - offset",
        "unit": "m",
        "source": "Excel2_Section5_1",
        "type": "computed",
        "depends_on": ["camouflageLayerThickness", "penetrationDepthConcrete", "bombOffset"],
        "locked": False,
        "engine": "blast",
        "formula": "hᴈ = hобс + hпр.t - ц"
    },
    {
        "name": "equivalentRadiusCeiling",
        "symbol": "Rэкв(п)",
        "description_ar": "نصف القطر المكافئ للسقف = ц + (ht+ц-hпр.t)*(kp.pc/kр.бt)+Hp.c",
        "description_en": "Equivalent radius for ceiling",
        "unit": "m",
        "source": "Excel2_Section5_1",
        "type": "computed",
        "depends_on": ["bombOffset", "protectionSlabThickness", "penetrationDepthConcrete", "pressureDistDestroyCoeff", "concreteDestroyCoeff", "pressureDistThickness"],
        "locked": False,
        "engine": "blast",
        "formula": "Rэкв = ц + (ht + ц - hпр.t) * (kp.pc / kр.бt) + Hpc"
    },
    {
        "name": "scaledRadiusCeiling",
        "symbol": "R̄(п)",
        "description_ar": "نصف القطر المختزل للسقف = Rэкв / (Cэф)^0.333",
        "description_en": "Scaled radius for ceiling = Rэкв / (Cэф)^0.333",
        "unit": "—",
        "source": "Excel2_Section5_1",
        "type": "computed",
        "depends_on": ["equivalentRadiusCeiling", "effectiveCharge"],
        "locked": False,
        "engine": "blast",
        "formula": "R̄ = Rэкв / (Cэф)^0.333"
    },
    {
        "name": "criticalScaledRadiusCeiling",
        "symbol": "R٭(п)",
        "description_ar": "نصف القطر الحرج المختزل للسقف = R٭̄ × (Cэф)^0.333",
        "description_en": "Critical scaled radius for ceiling",
        "unit": "m",
        "source": "Excel2_Section5_1",
        "type": "computed",
        "depends_on": ["scaledCraterRadiusBar", "effectiveCharge"],
        "locked": False,
        "engine": "blast",
        "formula": "R٭ = R٭̄ * (Cэф)^0.333"
    },
    {
        "name": "maxStressCeiling",
        "symbol": "maxбв(п)",
        "description_ar": "التوتر الاعظمي في موجة الضغط على السقف",
        "description_en": "Maximum stress in pressure wave on ceiling",
        "unit": "kg/cm²",
        "source": "Excel2_Section5_1",
        "type": "computed",
        "depends_on": ["waveAmplitudeCeiling", "waveExponentCeiling", "scaledRadiusCeiling", "scaledCraterDepthBarCeiling", "impactFactorM"],
        "locked": False,
        "engine": "blast",
        "formula": "if h̄ᴈ >= 0.7: maxбв = A * (R̄)^-n1 | if h̄ᴈ < 0.7: maxбв = 0.6 * m * A * (R̄)^-n1"
    },
    {
        "name": "waveConditionCeiling",
        "symbol": "—",
        "description_ar": "تقييم طبيعة الموجة على السقف: Rэкв > R٭ (تصاعدية) أو < (ضاربة لحظية)",
        "description_en": "Wave type evaluation for ceiling: Rэкв > R٭ (ascending) or < (instantaneous)",
        "unit": "—",
        "source": "Excel2_Section5_2",
        "type": "computed",
        "depends_on": ["equivalentRadiusCeiling", "criticalScaledRadiusCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "condition = Rэкв > R٭"
    },

    # Section 5.3-5.4: Wave duration and effective duration
    {
        "name": "totalWaveDurationCeiling",
        "symbol": "τ(п)",
        "description_ar": "الزمن الكلي لتأثير الموجة على السقف",
        "description_en": "Total wave duration on ceiling",
        "unit": "s",
        "source": "Excel2_Section5_3",
        "type": "computed",
        "depends_on": ["scaledRadiusCeiling", "effectiveCharge", "dampingCoeffMuCeiling", "dampingCoeffEtaCeiling", "equivalentRadiusCeiling", "timeCoeffKtCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "if R̄ > 0.375: τ = μ*(Cэф)^0.333 + η*Rэкв | else: τ = Kt * 0.0035 * (Cэф)^0.333"
    },
    {
        "name": "effectiveWaveDurationCeiling",
        "symbol": "τэф(п)",
        "description_ar": "الزمن الفعال لتأثير الموجة على السقف = τ × (0.0008×maxбв² - 0.0384×maxбв + 1.0013)",
        "description_en": "Effective wave duration on ceiling",
        "unit": "s",
        "source": "Excel2_Section5_4",
        "type": "computed",
        "depends_on": ["totalWaveDurationCeiling", "maxStressCeiling"],
        "locked": True,
        "engine": "blast",
        "formula": "τэф = τ * (0.0008 * maxбв² - 0.0384 * maxбв + 1.0013)"
    },

    # Section 5.5: Pressure rise time
    {
        "name": "ceilingPlacementDepth",
        "symbol": "Zп",
        "description_ar": "عمق توضع السقف = hобс + ht + Hpc",
        "description_en": "Ceiling placement depth = camouflage + slab + distribution layer",
        "unit": "m",
        "source": "Excel2_Section5_5",
        "type": "computed",
        "depends_on": ["camouflageLayerThickness", "protectionSlabThickness", "pressureDistThickness"],
        "locked": False,
        "engine": "blast",
        "formula": "Zп = hобс + ht + Hpc"
    },
    {
        "name": "avgWaveVelocityA0Ceiling",
        "symbol": "a0cp(п)",
        "description_ar": "متوسط سرعة الموجات الطولية للسقف = (a0 + a0z) / 2",
        "description_en": "Average longitudinal wave velocity for ceiling",
        "unit": "m/s",
        "source": "Excel2_Section5_5",
        "type": "computed",
        "depends_on": ["waveVelocityA0Ceiling", "waveVelocityA0zCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "a0cp = (a0 + a0z) / 2"
    },
    {
        "name": "avgWaveVelocityA1Ceiling",
        "symbol": "a1cp(п)",
        "description_ar": "متوسط سرعة الموجات القصية للسقف = (a1 + a1z) / 2",
        "description_en": "Average shear wave velocity for ceiling",
        "unit": "m/s",
        "source": "Excel2_Section5_5",
        "type": "computed",
        "depends_on": ["waveVelocityA1Ceiling", "waveVelocityA1zCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "a1cp = (a1 + a1z) / 2"
    },
    {
        "name": "pressureRiseTimeCeiling",
        "symbol": "τн(п)",
        "description_ar": "زمن تصاعد الضغط في الموجة للسقف = ((a0cp-a1cp)/(a0cp*a1cp)) * (Rэкв-R٭)",
        "description_en": "Pressure rise time for ceiling",
        "unit": "s",
        "source": "Excel2_Section5_5",
        "type": "computed",
        "depends_on": ["avgWaveVelocityA0Ceiling", "avgWaveVelocityA1Ceiling", "equivalentRadiusCeiling", "criticalScaledRadiusCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "τн = ((a0cp - a1cp)/(a0cp * a1cp)) * (Rэкв - R٭)"
    },

    # Section 5.6: Vibration frequency
    {
        "name": "vibrationFrequencyCeiling",
        "symbol": "ω(п)",
        "description_ar": "تواتر الاهتزاز للسقف = (1/ap)² × C × μ × (B/me.д)^0.5",
        "description_en": "Vibration frequency for ceiling",
        "unit": "s⁻¹",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["shortSpan", "stiffnessCoeffC", "reinforcementRatioMuCeiling", "rigidityB", "dynamicMassCeiling"],
        "locked": True,
        "engine": "blast",
        "formula": "ω = (1/ap)² * C * μ * (B / me.д)^0.5"
    },
    {
        "name": "reinforcementRatioMuCeiling",
        "symbol": "μ(п)_calc",
        "description_ar": "نسبة التسليح المحسوبة للسقف = -1.255 × (Hп/ap) + 1.1215",
        "description_en": "Calculated reinforcement ratio for ceiling",
        "unit": "—",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["initialCeilingThickness", "shortSpan"],
        "locked": False,
        "engine": "blast",
        "formula": "μ = -1.255 * (Hп/ap) + 1.1215"
    },
    {
        "name": "etaRatioCeiling",
        "symbol": "η(п)",
        "description_ar": "نسبة الأبعاد للسقف = bp/ap",
        "description_en": "Dimension ratio for ceiling = bp/ap",
        "unit": "—",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["longSpan", "shortSpan"],
        "locked": False,
        "engine": "blast",
        "formula": "η = bp / ap"
    },
    {
        "name": "stiffnessCoeffC",
        "symbol": "C",
        "description_ar": "معامل الصلابة = 22.37 × √(1 + 0.6η² + η⁴) (وثاقة) أو 9.87 × (1 + η²) (تمفصل)",
        "description_en": "Stiffness coefficient (rigid or hinged connection)",
        "unit": "—",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["etaRatioCeiling", "ceilingWallConnection"],
        "locked": False,
        "engine": "blast",
        "formula": "وثاقة: C = 22.37 * √(1 + 0.6*η² + η⁴) | تمفصل: C = 9.87 * (1 + η²)"
    },
    {
        "name": "rigidityBCeiling",
        "symbol": "B(п)",
        "description_ar": "صلابة المقطع للسقف = 0.85 × Ea × Fa.s × (h0-x)(h0-0.5x) × 10000",
        "description_en": "Section rigidity for ceiling",
        "unit": "kg.m²",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["steelElasticModulus", "steelAreaCeiling", "effectiveDepthCeiling", "neutralAxisCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "B = 0.85 * Ea * Fa.s * (h0-x) * (h0-0.5x) * 10000"
    },
    {
        "name": "steelAreaCeiling",
        "symbol": "Fa.s(п)",
        "description_ar": "مساحة حديد التسليح للسقف = h0 × ψ × b(=1m)",
        "description_en": "Steel reinforcement area for ceiling",
        "unit": "m²",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["effectiveDepthCeiling", "steelReinforcementRatio"],
        "locked": False,
        "engine": "blast",
        "formula": "Fa.s = h0 * ψ * b(=1m)"
    },
    {
        "name": "effectiveDepthCeiling",
        "symbol": "h0(п)",
        "description_ar": "العمق الفعال للسقف = Hп - 5cm",
        "description_en": "Effective depth for ceiling = Hп - 5cm",
        "unit": "m",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["initialCeilingThickness"],
        "locked": False,
        "engine": "blast",
        "formula": "h0 = Hп - 0.05"
    },
    {
        "name": "neutralAxisCeiling",
        "symbol": "x(п)",
        "description_ar": "المحور المحايد للسقف = (Rsd × Fas) / Rbd",
        "description_en": "Neutral axis for ceiling",
        "unit": "m",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["designSteelStrength", "steelAreaCeiling", "designConcreteStrength"],
        "locked": False,
        "engine": "blast",
        "formula": "x = (Rsd * Fas) / Rbd"
    },
    {
        "name": "designSteelStrength",
        "symbol": "Rsd",
        "description_ar": "مقاومة الحديد التصميمية = RsH × 1.05 × Kpod",
        "description_en": "Design steel strength = RsH × 1.05 × Kpod",
        "unit": "kg/cm²",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["steelYieldStrength", "amplificationSteelCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "Rsd = RsH * 1.05 * Kpod.s"
    },
    {
        "name": "designConcreteStrength",
        "symbol": "Rbd",
        "description_ar": "مقاومة البيتون التصميمية = RbH × Kpod",
        "description_en": "Design concrete strength = RbH × Kpod",
        "unit": "kg/cm²",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["concreteCompressiveStrength", "amplificationConcreteCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "Rbd = RbH * Kpod.b"
    },
    {
        "name": "dynamicMassCeiling",
        "symbol": "me.д(п)",
        "description_ar": "الكتلة الديناميكية للسقف = (hобс×γобс + ht×γб + Hpc×γp.c + Hп×γб) / 9.81",
        "description_en": "Dynamic mass for ceiling",
        "unit": "kg·s²/m³",
        "source": "Excel2_Section5_6",
        "type": "computed",
        "depends_on": ["camouflageLayerThickness", "camouflageLayerDensity", "protectionSlabThickness", "concreteDensity", "pressureDistThickness", "pressureDistDensity", "initialCeilingThickness"],
        "locked": False,
        "engine": "blast",
        "formula": "me.д = (hобс*γобс + ht*γб + Hpc*γp.c + Hп*γб) / 9.81"
    },

    # Section 5.7: Check condition τэф >= 0.2π/ω
    {
        "name": "dynamicConditionCeiling",
        "symbol": "—",
        "description_ar": "شرط الديناميكية للسقف: τэф >= 0.2π/ω",
        "description_en": "Dynamic condition for ceiling: τэф >= 0.2π/ω",
        "unit": "—",
        "source": "Excel2_Section5_7",
        "type": "computed",
        "depends_on": ["effectiveWaveDurationCeiling", "vibrationFrequencyCeiling"],
        "locked": True,
        "engine": "blast",
        "formula": "condition = τэф >= 0.2π/ω"
    },

    # Section 5.8-5.10: Design loads
    {
        "name": "structureWeight",
        "symbol": "Pk",
        "description_ar": "وزن المنشأة بالطن",
        "description_en": "Structure weight in tons",
        "unit": "ton",
        "source": "Excel2_Section1",
        "type": "computed",
        "depends_on": ["structureLength", "structureWidth", "initialCeilingThickness", "initialWallThickness", "initialFloorThickness", "concreteDensity"],
        "locked": False,
        "engine": "blast",
        "formula": "Pk = (structural volume) * γб / 1000"
    },
    {
        "name": "lambdaCeiling",
        "symbol": "λ(п)",
        "description_ar": "معامل λ للسقف = mc / (2*a1*p.p.c*τн)",
        "description_en": "λ coefficient for ceiling",
        "unit": "—",
        "source": "Excel2_Section5_8",
        "type": "computed",
        "depends_on": ["massPerAreaCeiling", "waveVelocityA1Ceiling", "pressureDistDensity", "pressureRiseTimeCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "λ = mc / (2 * a1 * ρp.c * τн)"
    },
    {
        "name": "massPerAreaCeiling",
        "symbol": "mc(п)",
        "description_ar": "الكتلة لكل وحدة مساحة للسقف = Pk × 1.15 × 1000 / Fпок",
        "description_en": "Mass per unit area for ceiling",
        "unit": "kg/m²",
        "source": "Excel2_Section5_8",
        "type": "computed",
        "depends_on": ["structureWeight"],
        "locked": False,
        "engine": "blast",
        "formula": "mc = Pk * 1.15 * 1000 / Fпок"
    },
    {
        "name": "maxLoadCeiling",
        "symbol": "Pmax(п)",
        "description_ar": "الحمولة العظمى على السقف = 2 × Kп × maxбв",
        "description_en": "Maximum load on ceiling = 2 × Kп × maxбв",
        "unit": "kg/cm²",
        "source": "Excel2_Section5_8",
        "type": "computed",
        "depends_on": ["loadFactorKpCeiling", "maxStressCeiling"],
        "locked": True,
        "engine": "blast",
        "formula": "Pmax = 2 * Kп * maxбв"
    },
    {
        "name": "omegaTauNCeiling",
        "symbol": "ωτн(п)",
        "description_ar": "جداء التواتر وزمن التصاعد للسقف",
        "description_en": "Product of frequency and rise time for ceiling",
        "unit": "—",
        "source": "Excel2_Section5_9",
        "type": "computed",
        "depends_on": ["vibrationFrequencyCeiling", "pressureRiseTimeCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "ωτн = ω * τн"
    },
    {
        "name": "equivalentLoadCeiling",
        "symbol": "Pэкв(п)",
        "description_ar": "الحمولة المكافئة للسقف = kд × kψ × Pmax",
        "description_en": "Equivalent load on ceiling = kд × kψ × Pmax",
        "unit": "kg/cm²",
        "source": "Excel2_Section5_9",
        "type": "computed",
        "depends_on": ["dynamicFactorKdCeiling", "shapeFactorKpsiCeiling", "maxLoadCeiling"],
        "locked": True,
        "engine": "blast",
        "formula": "Pэкв = kд * kψ * Pmax"
    },
    {
        "name": "staticLoadCeiling",
        "symbol": "Pct(п)",
        "description_ar": "الحمل الساكن على السقف = me.д × 9.81 / 10000",
        "description_en": "Static load on ceiling = me.д × 9.81 / 10000",
        "unit": "kg/cm²",
        "source": "Excel2_Section5_10",
        "type": "computed",
        "depends_on": ["dynamicMassCeiling"],
        "locked": False,
        "engine": "blast",
        "formula": "Pct = me.д * 9.81 / 10000"
    },
    {
        "name": "designLoadCeiling",
        "symbol": "Pp(п)",
        "description_ar": "الحمولة الحسابية على السقف = Pэкв + Pct",
        "description_en": "Design load on ceiling = Pэкв + Pct",
        "unit": "kg/cm²",
        "source": "Excel2_Section5_10",
        "type": "output",
        "depends_on": ["equivalentLoadCeiling", "staticLoadCeiling"],
        "locked": True,
        "engine": "blast"
    },

    # =========================================================================
    # COMPUTED: BLAST LOAD ENGINE - WALL (الجدار)
    # =========================================================================
    {
        "name": "wallPlacementDepth",
        "symbol": "Zc",
        "description_ar": "عمق توضع مركز الجدار = hобс + ht + Hpc + (aэt + Hп + Hф)/2",
        "description_en": "Wall mid-height placement depth",
        "unit": "m",
        "source": "Excel2_Section8_1",
        "type": "computed",
        "depends_on": ["camouflageLayerThickness", "protectionSlabThickness", "pressureDistThickness", "internalClearHeight", "initialCeilingThickness", "initialFloorThickness"],
        "locked": False,
        "engine": "blast",
        "formula": "Zc = hобс + ht + Hpc + (aэt + Hп + Hф)/2"
    },
    {
        "name": "bombDepthForWall",
        "symbol": "hб",
        "description_ar": "عمق توضع القنبلة بالنسبة للجدار = hnp + ht + hобс - 0.5*lk*cosα",
        "description_en": "Bomb depth relative to wall",
        "unit": "m",
        "source": "Excel2_Section8_1",
        "type": "computed",
        "depends_on": ["penetrationDepthSoil", "protectionSlabThickness", "camouflageLayerThickness", "bombBodyLength", "fallAngle"],
        "locked": False,
        "engine": "blast",
        "formula": "hб = hnp + ht + hобс - 0.5*lk*cosα"
    },
    {
        "name": "wallAngleDeviation",
        "symbol": "τθ",
        "description_ar": "انحراف مسقط مركز القنبلة عن مركز الجدار = (Z - hб) / R0",
        "description_en": "Bomb center projection deviation from wall center",
        "unit": "—",
        "source": "Excel2_Section8_1",
        "type": "computed",
        "depends_on": ["wallPlacementDepth", "bombDepthForWall", "safetyRadiusFromWall"],
        "locked": False,
        "engine": "blast",
        "formula": "τθ = (Z - hб) / R0"
    },
    {
        "name": "wallAngleRadians",
        "symbol": "θ",
        "description_ar": "زاوية الانحراف بالراديان = arctan(τθ)",
        "description_en": "Deviation angle in radians = arctan(τθ)",
        "unit": "radian",
        "source": "Excel2_Section8_8",
        "type": "computed",
        "depends_on": ["wallAngleDeviation"],
        "locked": False,
        "engine": "blast",
        "formula": "θ = arctan(τθ)"
    },

    # Wall max stress (same pattern as ceiling but with wall parameters)
    {
        "name": "maxStressWall",
        "symbol": "maxбв(c)",
        "description_ar": "التوتر الاعظمي في موجة الضغط على الجدار",
        "description_en": "Maximum stress in pressure wave on wall",
        "unit": "kg/cm²",
        "source": "Excel2_Section8_2",
        "type": "computed",
        "depends_on": ["waveAmplitudeWall", "waveExponentWall", "scaledRadiusWall", "scaledCraterDepthBarWall", "impactFactorM"],
        "locked": False,
        "engine": "blast",
        "formula": "if h̄ᴈ >= 0.7: maxбв = A * (R̄)^-n1 | if h̄ᴈ < 0.7: maxбв = 0.6 * m * A * (R̄)^-n1"
    },
    {
        "name": "totalWaveDurationWall",
        "symbol": "τ(c)",
        "description_ar": "الزمن الكلي لتأثير الموجة على الجدار",
        "description_en": "Total wave duration on wall",
        "unit": "s",
        "source": "Excel2_Section8_3",
        "type": "computed",
        "depends_on": ["scaledRadiusWall", "effectiveCharge", "dampingCoeffMuWall", "dampingCoeffEtaWall", "equivalentRadiusWall", "timeCoeffKtWall"],
        "locked": False,
        "engine": "blast",
        "formula": "if R̄ > 0.375: τ = μ*(Cэф)^0.333 + η*Rэкв | else: τ = Kt * 0.0035 * (Cэф)^0.333"
    },
    {
        "name": "effectiveWaveDurationWall",
        "symbol": "τэф(c)",
        "description_ar": "الزمن الفعال لتأثير الموجة على الجدار",
        "description_en": "Effective wave duration on wall",
        "unit": "s",
        "source": "Excel2_Section8_4",
        "type": "computed",
        "depends_on": ["totalWaveDurationWall", "maxStressWall"],
        "locked": True,
        "engine": "blast",
        "formula": "τэф = τ * (0.0008 * maxбв² - 0.0384 * maxбв + 1.0013)"
    },
    {
        "name": "pressureRiseTimeWall",
        "symbol": "τн(c)",
        "description_ar": "زمن تصاعد الضغط للجدار",
        "description_en": "Pressure rise time for wall",
        "unit": "s",
        "source": "Excel2_Section8_5",
        "type": "computed",
        "depends_on": ["avgWaveVelocityA0Wall", "avgWaveVelocityA1Wall", "equivalentRadiusWall", "criticalScaledRadiusWall"],
        "locked": False,
        "engine": "blast",
        "formula": "τн = ((a0cp-a1cp)/(a0cp*a1cp)) * (Rэкв - R٭)"
    },
    {
        "name": "vibrationFrequencyWall",
        "symbol": "ω(c)",
        "description_ar": "تواتر الاهتزاز للجدار",
        "description_en": "Vibration frequency for wall",
        "unit": "s⁻¹",
        "source": "Excel2_Section8_6",
        "type": "computed",
        "depends_on": ["internalClearHeight", "stiffnessCoeffCWall", "reinforcementRatioMuWall", "rigidityBWall", "dynamicMassWall"],
        "locked": True,
        "engine": "blast",
        "formula": "ω = (1/aэ)² * C * μ * (B / me.д)^0.5"
    },
    {
        "name": "dynamicConditionWall",
        "symbol": "—",
        "description_ar": "شرط الديناميكية للجدار: τэф >= 0.2π/ω",
        "description_en": "Dynamic condition for wall: τэф >= 0.2π/ω",
        "unit": "—",
        "source": "Excel2_Section8_7",
        "type": "computed",
        "depends_on": ["effectiveWaveDurationWall", "vibrationFrequencyWall"],
        "locked": True,
        "engine": "blast",
        "formula": "condition = τэф >= 0.2π/ω"
    },
    {
        "name": "maxLoadWall",
        "symbol": "Pmax(c)",
        "description_ar": "الحمولة العظمى على الجدار = 2 × Kп × maxбв",
        "description_en": "Maximum load on wall = 2 × Kп × maxбв",
        "unit": "kg/cm²",
        "source": "Excel2_Section8_8",
        "type": "computed",
        "depends_on": ["loadFactorKpWall", "maxStressWall"],
        "locked": True,
        "engine": "blast",
        "formula": "Pmax = 2 * Kп * maxбв"
    },
    {
        "name": "maxLoadWallOblique",
        "symbol": "Pθmax",
        "description_ar": "الحمولة العظمى المائلة على الجدار = Pmax × (cos²θ + ξ×sin²θ) × cos^n1(θ)",
        "description_en": "Oblique maximum load on wall",
        "unit": "kg/cm²",
        "source": "Excel2_Section8_8",
        "type": "computed",
        "depends_on": ["maxLoadWall", "wallAngleRadians", "lateralPressureCoeff", "waveExponentWall"],
        "locked": True,
        "engine": "blast",
        "formula": "Pθmax = Pmax * (cos²θ + ξ*sin²θ) * cos^n1(θ)"
    },
    {
        "name": "equivalentLoadWall",
        "symbol": "Pэкв(c)",
        "description_ar": "الحمولة المكافئة للجدار = kд × kψ × Pθmax",
        "description_en": "Equivalent load on wall = kд × kψ × Pθmax",
        "unit": "kg/cm²",
        "source": "Excel2_Section8_9",
        "type": "computed",
        "depends_on": ["dynamicFactorKdWall", "shapeFactorKpsiWall", "maxLoadWallOblique"],
        "locked": True,
        "engine": "blast",
        "formula": "Pэкв = kд * kψ * Pθmax"
    },
    {
        "name": "staticLoadWall",
        "symbol": "Pct(c)",
        "description_ar": "الحمل الساكن على الجدار = me.д × 9.81 / 10000",
        "description_en": "Static load on wall",
        "unit": "kg/cm²",
        "source": "Excel2_Section8_10",
        "type": "computed",
        "depends_on": ["dynamicMassWall"],
        "locked": False,
        "engine": "blast",
        "formula": "Pct = me.д * 9.81 / 10000"
    },
    {
        "name": "designLoadWall",
        "symbol": "Pp(c)",
        "description_ar": "الحمولة الحسابية على الجدار = Pэкв + Pct",
        "description_en": "Design load on wall = Pэкв + Pct",
        "unit": "kg/cm²",
        "source": "Excel2_Section8_10",
        "type": "output",
        "depends_on": ["equivalentLoadWall", "staticLoadWall"],
        "locked": True,
        "engine": "blast"
    },

    # =========================================================================
    # ENGINE 3: STRUCTURAL DESIGN ENGINE (محرك التصميم الإنشائي)
    # Source: Excel 2 (Sections 6-7 ceiling, 9-10 wall)
    # =========================================================================
    {
        "name": "maxMomentCeiling",
        "symbol": "Mp(п)",
        "description_ar": "العزم الأكبر للسقف (مدخل من المهندس أو محسوب من q × bp² / K)",
        "description_en": "Maximum moment for ceiling (engineer input or calculated from q × bp² / K)",
        "unit": "kg.cm",
        "source": "Excel2_Section6",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "structural"
    },
    {
        "name": "maxMomentWall",
        "symbol": "Mp(c)",
        "description_ar": "العزم الأكبر للجدار",
        "description_en": "Maximum moment for wall",
        "unit": "kg.cm",
        "source": "Excel2_Section9",
        "type": "input",
        "depends_on": [],
        "locked": False,
        "engine": "structural"
    },
    {
        "name": "ceilingEffectiveDepth",
        "symbol": "h0(п)_struct",
        "description_ar": "العمق الفعال للسقف = √(Mp / (0.94 × μ × 100 × Rsd))",
        "description_en": "Ceiling effective depth from moment",
        "unit": "cm",
        "source": "Excel2_Section7",
        "type": "computed",
        "depends_on": ["maxMomentCeiling", "reinforcementRatioMuCeiling", "designSteelStrength"],
        "locked": False,
        "engine": "structural",
        "formula": "h0 = √(Mp / (0.94 * μ * 100 * Rsd))"
    },
    {
        "name": "ceilingThickness",
        "symbol": "Hп",
        "description_ar": "سماكة السقف المحسوبة = h0 × 1.05",
        "description_en": "Calculated ceiling thickness = h0 × 1.05",
        "unit": "cm",
        "source": "Excel2_Section7",
        "type": "output",
        "depends_on": ["ceilingEffectiveDepth"],
        "locked": True,
        "engine": "structural",
        "formula": "Hп = h0 * 1.05"
    },
    {
        "name": "wallEffectiveDepth",
        "symbol": "h0(c)_struct",
        "description_ar": "العمق الفعال للجدار = √(Mp / (0.94 × μ × 100 × Rsd))",
        "description_en": "Wall effective depth from moment",
        "unit": "cm",
        "source": "Excel2_Section10",
        "type": "computed",
        "depends_on": ["maxMomentWall", "reinforcementRatioMuWall", "designSteelStrength"],
        "locked": False,
        "engine": "structural",
        "formula": "h0 = √(Mp / (0.94 * μ * 100 * Rsd))"
    },
    {
        "name": "wallThickness",
        "symbol": "Hc",
        "description_ar": "سماكة الجدار المحسوبة = h0 × 1.05",
        "description_en": "Calculated wall thickness = h0 × 1.05",
        "unit": "cm",
        "source": "Excel2_Section10",
        "type": "output",
        "depends_on": ["wallEffectiveDepth"],
        "locked": True,
        "engine": "structural",
        "formula": "Hc = h0 * 1.05"
    },
    {
        "name": "floorThickness",
        "symbol": "Hф",
        "description_ar": "سماكة الأرضية = 0.85 × Hc",
        "description_en": "Floor thickness = 0.85 × Hc",
        "unit": "cm",
        "source": "Excel2_Section10",
        "type": "output",
        "depends_on": ["wallThickness"],
        "locked": True,
        "engine": "structural",
        "formula": "Hф = 0.85 * Hc"
    },
    {
        "name": "innerWallThickness",
        "symbol": "Hвc",
        "description_ar": "سماكة الجدران الداخلية (قيمة ثابتة مبدئية)",
        "description_en": "Inner wall thickness (fixed initial value)",
        "unit": "cm",
        "source": "Excel2_Section10",
        "type": "output",
        "depends_on": [],
        "locked": True,
        "engine": "structural"
    },
]

# ============================================================================
# BUILD DEPENDENCY GRAPH
# ============================================================================

def build_dependency_graph(table):
    """Build top-down dependency graph."""
    graph = {}
    for item in table:
        name = item["name"]
        deps = item.get("depends_on", [])
        graph[name] = {
            "symbol": item["symbol"],
            "type": item["type"],
            "engine": item["engine"],
            "depends_on": deps,
            "depended_by": []
        }
    
    # Reverse dependencies
    for name, info in graph.items():
        for dep in info["depends_on"]:
            if dep in graph:
                graph[dep]["depended_by"].append(name)
    
    return graph

# ============================================================================
# BUILD LOCKED INPUTS LIST
# ============================================================================

def build_locked_inputs(table):
    """Extract all locked variables."""
    locked = []
    for item in table:
        if item.get("locked", False):
            locked.append({
                "name": item["name"],
                "symbol": item["symbol"],
                "description_ar": item["description_ar"],
                "description_en": item["description_en"],
                "unit": item["unit"],
                "engine": item["engine"],
                "type": item["type"],
                "passes_to": []  # Will be filled
            })
    return locked

# ============================================================================
# COMPUTPUTE ENGINE BOUNDARIES (locked values that pass between engines)
# ============================================================================

def compute_engine_boundaries(table):
    """Identify which locked values pass from one engine to another."""
    graph = build_dependency_graph(table)
    boundaries = {
        "penetration_to_blast": [],
        "blast_to_structural": [],
        "within_blast": [],
        "within_structural": []
    }
    
    for item in table:
        if not item.get("locked", False):
            continue
        engine = item["engine"]
        deps = item.get("depends_on", [])
        
        # Check if any dependency is from a different engine
        cross_engine = False
        for dep in deps:
            dep_item = next((x for x in table if x["name"] == dep), None)
            if dep_item and dep_item["engine"] != engine:
                cross_engine = True
                if dep_item["engine"] == "penetration" and engine == "blast":
                    boundaries["penetration_to_blast"].append(item["name"])
                elif dep_item["engine"] == "blast" and engine == "structural":
                    boundaries["blast_to_structural"].append(item["name"])
                break
        
        if not cross_engine:
            if engine == "blast":
                boundaries["within_blast"].append(item["name"])
            elif engine == "structural":
                boundaries["within_structural"].append(item["name"])
    
    return boundaries

# ============================================================================
# GENERATE OUTPUTS
# ============================================================================

# Build all outputs
dependency_graph = build_dependency_graph(unified_table)
locked_inputs = build_locked_inputs(unified_table)
engine_boundaries = compute_engine_boundaries(unified_table)

# Summary statistics
total_vars = len(unified_table)
input_count = len([x for x in unified_table if x["type"] == "input"])
lookup_count = len([x for x in unified_table if x["type"] == "lookup"])
computed_count = len([x for x in unified_table if x["type"] == "computed"])
output_count = len([x for x in unified_table if x["type"] == "output"])
locked_count = len([x for x in unified_table if x.get("locked", False)])

# Engine breakdown
penetration_vars = [x for x in unified_table if x["engine"] == "penetration"]
blast_vars = [x for x in unified_table if x["engine"] == "blast"]
structural_vars = [x for x in unified_table if x["engine"] == "structural"]

# Save unified model
output = {
    "metadata": {
        "title": "Step 2: Unified Data Model — منصة المدقق الديناميكي الموحد V3.0",
        "generated_at": "2026-06-12",
        "sources": [
            {"type": "excel", "name": "سماكة مقطع الجزء الديناميكي_٠٦١٥٥۸.xlsx", "role": "penetration_and_geometry"},
            {"type": "excel", "name": "مقر ق قنبلة خارقة_٠٦١٦۵۲.xlsx", "role": "blast_loads_and_structural"},
            {"type": "pdf", "name": "الأطروحة العلمية للتحصين.pdf", "role": "scientific_reference"},
            {"type": "html", "name": "app-analysis.html", "role": "rules_and_pipeline_source"}
        ],
        "statistics": {
            "total_variables": total_vars,
            "inputs": input_count,
            "lookups": lookup_count,
            "computed": computed_count,
            "outputs": output_count,
            "locked": locked_count,
            "penetration_vars": len(penetration_vars),
            "blast_vars": len(blast_vars),
            "structural_vars": len(structural_vars)
        }
    },
    "unified_table": unified_table,
    "dependency_graph": dependency_graph,
    "locked_inputs": locked_inputs,
    "engine_boundaries": engine_boundaries,
    "execution_summary": {
        "step_1_penetration": {
            "inputs": [x["name"] for x in penetration_vars if x["type"] == "input"],
            "lookups_used": [x["name"] for x in penetration_vars if x["type"] == "lookup"],
            "outputs_locked": [x["name"] for x in penetration_vars if x.get("locked")],
            "key_outputs": ["penetrationDepthSoil", "dynamicLoadZoneHeight", "effectiveCharge", "destructionRadiusSoil"]
        },
        "step_2_blast": {
            "locked_from_penetration": engine_boundaries["penetration_to_blast"],
            "inputs": [x["name"] for x in blast_vars if x["type"] == "input"],
            "lookups_used": [x["name"] for x in blast_vars if x["type"] == "lookup"],
            "outputs_locked": [x["name"] for x in blast_vars if x.get("locked")],
            "key_outputs": ["designLoadCeiling", "designLoadWall", "protectionSlabThickness", "pressureDistThickness"]
        },
        "step_3_structural": {
            "locked_from_blast": engine_boundaries["blast_to_structural"],
            "inputs": [x["name"] for x in structural_vars if x["type"] == "input"],
            "outputs_locked": [x["name"] for x in structural_vars if x.get("locked")],
            "key_outputs": ["ceilingThickness", "wallThickness", "floorThickness"]
        }
    }
}

# Save
with open('/home/z/my-project/download/step2_unified_model.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("=== STEP 2 UNIFIED MODEL GENERATED ===")
print(f"Total variables: {total_vars}")
print(f"  Inputs: {input_count}")
print(f"  Lookups: {lookup_count}")
print(f"  Computed: {computed_count}")
print(f"  Outputs: {output_count}")
print(f"  Locked: {locked_count}")
print()
print(f"By Engine:")
print(f"  Penetration: {len(penetration_vars)} vars")
print(f"  Blast: {len(blast_vars)} vars")
print(f"  Structural: {len(structural_vars)} vars")
print()
print(f"Engine Boundaries:")
print(f"  Penetration → Blast: {len(engine_boundaries['penetration_to_blast'])} locked values")
print(f"  Blast → Structural: {len(engine_boundaries['blast_to_structural'])} locked values")
print(f"  Within Blast: {len(engine_boundaries['within_blast'])} locked values")
print(f"  Within Structural: {len(engine_boundaries['within_structural'])} locked values")
print()
print("Saved to: /home/z/my-project/download/step2_unified_model.json")

