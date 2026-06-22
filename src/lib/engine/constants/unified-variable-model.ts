/**
 * النموذج الموحّد للمتغيرات — الخطوات 2 إلى 8
 * منصة المدقق الديناميكي الموحد V3.0
 *
 * التصنيف الصارم (5 فئات):
 * - input:    قيم يدخلها المستخدم مباشرة
 * - lookup:   قيم من جداول المرجعية (إكسيل / كود / جداول B)
 * - computed: قيم تُحسب داخل المحرك ولا تنتقل لمحرك آخر
 * - locked:   قيم يُنتجها محرك ويستهلكها التالي — للقراءة فقط
 * - output:   المخرجات النهائية لخط الأنابيب
 *
 * فصل المسارات: سقف (roof) | جدار (wall) | مشترك (shared)
 * القيم المقفلة لا تُعاد كتابتها بين المحركات
 */

// ═══════════════════════════════════════════════════════════════════════
// أنواع التصنيف
// ═══════════════════════════════════════════════════════════════════════

export type VariableType = 'input' | 'lookup' | 'computed' | 'locked' | 'output';
export type EngineName = 'penetration' | 'blast' | 'structural';
export type PathType = 'roof' | 'wall' | 'shared';

export interface UnifiedVariable {
  name: string;
  symbol: string;
  descriptionAr: string;
  descriptionEn: string;
  unit: string;
  source: string;
  type: VariableType;
  dependsOn: string[];
  locked: boolean;
  engine: EngineName;
  path: PathType;
  formula?: string;
}

export interface DependencyNode {
  symbol: string;
  type: VariableType;
  engine: EngineName;
  path: PathType;
  dependsOn: string[];
  dependedBy: string[];
}

export interface EngineBoundary {
  penetrationToBlast: string[];
  blastRoofToStructural: string[];
  blastWallToStructural: string[];
  withinBlastRoof: string[];
  withinBlastWall: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// الجدول الموحّد — 130 متغير بدون تكرار
// ═══════════════════════════════════════════════════════════════════════

export const UNIFIED_VARIABLE_TABLE: UnifiedVariable[] = [

  // ──────────────────────────────────────────────────────────────────
  // القسم 1: المدخلات الأساسية (input) — محرك الاختراق
  // ──────────────────────────────────────────────────────────────────
  { name: 'P',           symbol: 'P',       descriptionAr: 'وزن القنبلة',                     descriptionEn: 'Bomb weight',                      unit: 'kg',    source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'lo_b',        symbol: 'loб',     descriptionAr: 'الطول الكلي للقنبلة',              descriptionEn: 'Overall bomb length',               unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'lk',          symbol: 'lk',      descriptionAr: 'طول جسم القنبلة',                  descriptionEn: 'Bomb body length',                  unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'dk',          symbol: 'dk',      descriptionAr: 'قطر هيكل القنبلة',                 descriptionEn: 'Bomb body diameter',                unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'ld_ratio',    symbol: 'lᴈ/dᴈ',  descriptionAr: 'نسبة طول الجسم للقطر',             descriptionEn: 'Body L/D ratio',                    unit: '—',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'lhd_ratio',   symbol: 'lгч/d',   descriptionAr: 'نسبة طول الرأس للقطر',            descriptionEn: 'Nose L/D ratio',                    unit: '—',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'C',           symbol: 'C',       descriptionAr: 'وزن الشحنة المتفجرة',              descriptionEn: 'Explosive charge weight',           unit: 'kg',    source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'V',           symbol: 'V',       descriptionAr: 'سرعة اصطدام القنبلة',              descriptionEn: 'Impact velocity',                   unit: 'm/s',   source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'alpha',       symbol: 'α',       descriptionAr: 'زاوية الاصطدام',                   descriptionEn: 'Impact angle',                      unit: 'deg',   source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'beta',        symbol: 'β',       descriptionAr: 'زاوية ميول الجبل',                 descriptionEn: 'Slope angle',                       unit: 'deg',   source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'Z',           symbol: 'Z',       descriptionAr: 'عمق توضع المنشأة',                 descriptionEn: 'Facility depth',                    unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 2: معاملات التربة والمواد (lookup)
  // ──────────────────────────────────────────────────────────────────
  { name: 'K1',          symbol: 'K1',      descriptionAr: 'معامل المادة المتفجرة',            descriptionEn: 'Explosive coefficient',             unit: '—',     source: 'table_3',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'kpr_g',       symbol: 'kпр.г',   descriptionAr: 'معامل اختراق التربة',             descriptionEn: 'Soil penetration coeff',            unit: '—',     source: 'table_4',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'penetration', path: 'shared' },
  { name: 'kpr_b',       symbol: 'kпр.б',   descriptionAr: 'معامل اختراق البيتون',            descriptionEn: 'Concrete penetration coeff',        unit: '—',     source: 'table_4',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'kpr_bt',      symbol: 'kпр.бt',  descriptionAr: 'معامل اختراق البلاطة',            descriptionEn: 'Slab penetration coeff',            unit: '—',     source: 'table_4',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'K_kp_ct',     symbol: 'Kkp.ct',  descriptionAr: 'معامل تدمير الجدار',              descriptionEn: 'Wall destruction coeff',            unit: '—',     source: 'table_4',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'wall' },
  { name: 'm1',          symbol: 'm1',      descriptionAr: 'معامل الإجهاد',                    descriptionEn: 'Stress parameter',                  unit: '—',     source: 'table_I3',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'shared' },
  { name: 'RbH',         symbol: 'RbH',     descriptionAr: 'مقاومة ضغط الخرسانة',              descriptionEn: 'Concrete compressive strength',     unit: 'kg/cm2',source: 'table_6',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'RsH',         symbol: 'RsH',     descriptionAr: 'إجهاد خضوع الحديد',                descriptionEn: 'Steel yield strength',              unit: 'kg/cm2',source: 'table_7',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'gamma_b',     symbol: 'γб',      descriptionAr: 'الوزن الحجمي للخرسانة',            descriptionEn: 'Concrete density',                  unit: 'kg/m3', source: 'table_4',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'gamma_g',     symbol: 'γг',      descriptionAr: 'الوزن الحجمي للتربة',              descriptionEn: 'Soil density',                      unit: 'kg/m3', source: 'table_4',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'shared' },
  { name: 'Kpod_b',      symbol: 'Kпод.b',  descriptionAr: 'معامل الزيادة الديناميكية بيتون', descriptionEn: 'DIF concrete',                     unit: '—',     source: 'ufc',           type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Kpod_s',      symbol: 'Kпод.s',  descriptionAr: 'معامل الزيادة الديناميكية حديد',  descriptionEn: 'DIF steel',                       unit: '—',     source: 'ufc',           type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'n0',          symbol: 'n0',      descriptionAr: 'معامل الأمان',                     descriptionEn: 'Safety factor',                     unit: '—',     source: 'code',          type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Kbt_bt',      symbol: 'Kвt.бt',  descriptionAr: 'معامل التصدع للبلاطة',            descriptionEn: 'Slab cracking coeff',               unit: '—',     source: 'table_4',       type: 'lookup',  dependsOn: [],        locked: false, engine: 'structural',  path: 'roof' },
  { name: 'R_bar',       symbol: 'R̽¯',     descriptionAr: 'معامل البعد المكافئ (اختراق)',     descriptionEn: 'Scaled radius (penetration)',       unit: '—',     source: 'table_5',       type: 'lookup',  dependsOn: ['h_z_bar'],locked: false,engine: 'penetration', path: 'shared' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 3: أبعاد المنشأة (input)
  // ──────────────────────────────────────────────────────────────────
  { name: 'a_et',        symbol: 'aэt',     descriptionAr: 'ارتفاع السقف',                    descriptionEn: 'Ceiling height',                    unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'blast',       path: 'shared' },
  { name: 'bp',          symbol: 'bp',      descriptionAr: 'المجاز الطويل',                    descriptionEn: 'Long span',                         unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'ap',          symbol: 'ap',      descriptionAr: 'المجاز القصير',                    descriptionEn: 'Short span',                        unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Lk',          symbol: 'Lk',      descriptionAr: 'طول المنشأة',                      descriptionEn: 'Facility length',                   unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Bk',          symbol: 'Bk',      descriptionAr: 'عرض المنشأة',                      descriptionEn: 'Facility width',                    unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Pk',          symbol: 'Pk',      descriptionAr: 'الوزن الكلي',                      descriptionEn: 'Total weight',                      unit: 't',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Hct',         symbol: 'Hct',     descriptionAr: 'سماكة الجدار الخارجي',             descriptionEn: 'Outer wall thickness',              unit: 'cm',    source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'wall' },
  { name: 'Hvct',        symbol: 'Hвct',    descriptionAr: 'سماكة الجدران الداخلية',           descriptionEn: 'Inner wall thickness',              unit: 'cm',    source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'wall' },
  { name: 'Hf',          symbol: 'Hф',      descriptionAr: 'سماكة الأرضية',                    descriptionEn: 'Floor thickness',                   unit: 'cm',    source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Hp',          symbol: 'Hп',      descriptionAr: 'سماكة السقف',                      descriptionEn: 'Ceiling thickness',                 unit: 'cm',    source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'roof' },
  { name: 'h_obs',       symbol: 'hoбc',    descriptionAr: 'سماكة طبقة التمويه',               descriptionEn: 'Concealment thickness',             unit: 'm',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'blast',       path: 'shared' },
  { name: 'psi_p',       symbol: 'ψп',      descriptionAr: 'معامل ديناميكي للسقف',             descriptionEn: 'Dynamic coeff ceiling',             unit: '—',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'Ea',          symbol: 'Ea',      descriptionAr: 'معامل المرونة للحديد',              descriptionEn: 'Steel elastic modulus',             unit: 'kg/cm2',source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'xi',          symbol: 'ξ',       descriptionAr: 'نسبة التسليح',                      descriptionEn: 'Reinforcement ratio',               unit: '—',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'rho_pc',      symbol: 'ρp.c',    descriptionAr: 'معامل طبقة توزيع الضغط',            descriptionEn: 'Distribution layer param',          unit: '—',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'rho_g',       symbol: 'ρг',      descriptionAr: 'معامل التربة حول الجدار',           descriptionEn: 'Soil around wall param',            unit: '—',     source: 'user_input',    type: 'input',   dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 4: محسوبات الاختراق (computed + locked)
  // ──────────────────────────────────────────────────────────────────
  { name: 'C_ef',        symbol: 'Cэф',     descriptionAr: 'الشحنة الفعالة',                   descriptionEn: 'Effective charge',                  unit: 'kg',    source: 'step2',         type: 'locked',  dependsOn: ['K1','C'], locked: true, engine: 'penetration', path: 'shared', formula: 'K1*0.95*C' },
  { name: 'lambda1',     symbol: 'λ1',      descriptionAr: 'معامل شكل الرأس',                  descriptionEn: 'Nose shape coeff',                  unit: '—',     source: 'step2',         type: 'computed',dependsOn: ['lhd_ratio'],locked: false,engine: 'penetration', path: 'shared', formula: '0.5+0.4*(lгч/d)^0.666' },
  { name: 'lambda2',     symbol: 'λ2',      descriptionAr: 'معامل تأثير القطر',                descriptionEn: 'Diameter coeff',                    unit: '—',     source: 'step2',         type: 'computed',dependsOn: ['dk'],      locked: false,engine: 'penetration', path: 'shared', formula: '2.8*(d)^0.333-1.3*(d)^0.5' },
  { name: 'h_pr',        symbol: 'hпр',     descriptionAr: 'عمق اختراق القنبلة',               descriptionEn: 'Penetration depth',                 unit: 'm',     source: 'step2',         type: 'locked',  dependsOn: ['lambda1','lambda2','kpr_g','P','dk','V','alpha'], locked: true, engine: 'penetration', path: 'shared', formula: 'λ1*λ2*kпр.г*P/d²*V*cosα' },
  { name: 'R_actual',    symbol: 'R̽',      descriptionAr: 'البعد الفعلي لمركز الانفجار',      descriptionEn: 'Actual blast radius',               unit: 'm',     source: 'step2',         type: 'locked',  dependsOn: ['R_bar','C_ef'], locked: true, engine: 'penetration', path: 'shared', formula: 'R̽¯*(Cэф)^0.333' },
  { name: 'tsu',         symbol: 'ц',       descriptionAr: 'إزاحة مركز الانفجار',              descriptionEn: 'Blast center offset',               unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['lk','alpha'],locked: false,engine: 'penetration', path: 'shared', formula: '0.5*lk*cosα' },
  { name: 'H_total',     symbol: 'H',       descriptionAr: 'الارتفاع حتى سطح الجبل',           descriptionEn: 'Height to surface',                 unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['R_actual','h_pr','tsu'], locked: false, engine: 'penetration', path: 'shared', formula: 'R̽+hпр-ц' },
  { name: 'h_z',         symbol: 'hз',      descriptionAr: 'عمق ما دون الحفرة',                descriptionEn: 'Depth below crater',                unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['h_pr','tsu'], locked: false, engine: 'penetration', path: 'shared', formula: 'hпр-ц' },
  { name: 'h_z_bar',     symbol: 'hз¯',     descriptionAr: 'العمق المكافئ المختزل',            descriptionEn: 'Normalized depth',                  unit: '—',     source: 'step2',         type: 'computed',dependsOn: ['h_z','C_ef'], locked: false, engine: 'penetration', path: 'shared', formula: 'hз/(Cэф)^0.333' },
  { name: 'Zp',          symbol: 'Zp',      descriptionAr: 'عمق التربة المكافئ',               descriptionEn: 'Equivalent soil depth',             unit: 'm',     source: 'step2',         type: 'locked',  dependsOn: ['kpr_g','C_ef'], locked: true, engine: 'penetration', path: 'shared', formula: '1.5*kпр.г*(Cэф)^0.333' },
  { name: 'L_tunnel',    symbol: 'L',       descriptionAr: 'طول المدخل الديناميكي',            descriptionEn: 'Dynamic entrance length',           unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['H_total','beta'], locked: false, engine: 'penetration', path: 'shared', formula: 'H/tanβ' },
  { name: 'Y_diff',      symbol: 'Y',       descriptionAr: 'فرق التوضع والاختراق',             descriptionEn: 'Depth difference',                  unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['Z','h_pr'], locked: false, engine: 'penetration', path: 'shared', formula: 'Z-hпр' },
  { name: 'hb_destruction',symbol:'hb.dest', descriptionAr: 'سماكة البيتون للتدمير',            descriptionEn: 'Thickness for destruction',         unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['Zp','Y_diff'], locked: false, engine: 'penetration', path: 'shared' },
  { name: 'hb_cracking', symbol: 'hb.crack',descriptionAr: 'سماكة البيتون للتصدع',             descriptionEn: 'Thickness for cracking',            unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['Zot_rock','Y_diff'], locked: false, engine: 'penetration', path: 'shared' },
  { name: 'Zot_rock',    symbol: 'Zot.rock',descriptionAr: 'عمق التصدع الصخري',                descriptionEn: 'Rock cracking depth',               unit: 'm',     source: 'step2',         type: 'computed',dependsOn: ['C_ef'],   locked: false, engine: 'penetration', path: 'shared' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 5: مسار السقف — الانفجار (computed + locked)
  // ──────────────────────────────────────────────────────────────────
  { name: 'ht',          symbol: 'ht',      descriptionAr: 'سماكة بلاطة الحماية',              descriptionEn: 'Protection slab thickness',         unit: 'cm',    source: 'step5_roof',    type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'Bt',          symbol: 'Bt',      descriptionAr: 'بروز بلاطة الحماية',               descriptionEn: 'Slab projection',                   unit: 'm',     source: 'step5_roof',    type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'Hpc',         symbol: 'Hp.c',    descriptionAr: 'سماكة طبقة توزيع الضغط',           descriptionEn: 'Distribution thickness',            unit: 'm',     source: 'step5_roof',    type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'R0_roof',     symbol: 'R0',      descriptionAr: 'بعد الانفجار عن السقف',            descriptionEn: 'Blast distance to ceiling',         unit: 'm',     source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'R_ekv_roof',  symbol: 'Rэкв',    descriptionAr: 'البعد المكافئ — السقف',            descriptionEn: 'Equivalent radius — roof',          unit: 'm',     source: 'step5_roof',    type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'R_star_roof', symbol: 'R*',      descriptionAr: 'البعد الفعال — السقف',             descriptionEn: 'Effective radius — roof',           unit: 'm',     source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'max_bv_roof', symbol: 'maxбв',   descriptionAr: 'الإجهاد الأقصى — السقف',           descriptionEn: 'Max soil stress — roof',            unit: 'kg/cm2',source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'tau_roof',    symbol: 'τ',       descriptionAr: 'زمن تأثير الحمل — السقف',          descriptionEn: 'Load duration — roof',              unit: 's',     source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'tau_ef_roof', symbol: 'τэф',     descriptionAr: 'الزمن الفعال — السقف',             descriptionEn: 'Effective duration — roof',         unit: 's',     source: 'step5_roof',    type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'tau_n_roof',  symbol: 'τн',      descriptionAr: 'زمن تصاعد الضغط — السقف',          descriptionEn: 'Rise time — roof',                  unit: 's',     source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'Zp_roof',     symbol: 'Zп',      descriptionAr: 'البعد المختزل — السقف',            descriptionEn: 'Scaled distance — roof',            unit: 'm',     source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'a0cp_roof',   symbol: 'a0cp',    descriptionAr: 'سرعة الموجة P — السقف',            descriptionEn: 'P-wave velocity — roof',            unit: 'm/s',   source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'a1cp_roof',   symbol: 'a1cp',    descriptionAr: 'سرعة الموجة S — السقف',            descriptionEn: 'S-wave velocity — roof',            unit: 'm/s',   source: 'step5_roof',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 6: مسار الجدار — الانفجار (computed + locked)
  // ──────────────────────────────────────────────────────────────────
  { name: 'Z_wall',      symbol: 'Zc',      descriptionAr: 'البعد حتى الجدار',                 descriptionEn: 'Distance to wall',                  unit: 'm',     source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'h_b',         symbol: 'hб',      descriptionAr: 'سماكة البيتون — الجدار',           descriptionEn: 'Concrete thickness — wall',         unit: 'm',     source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'tau_theta',   symbol: 'τθ',      descriptionAr: 'معامل زاوي — الجدار',              descriptionEn: 'Angle time factor — wall',          unit: '—',     source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'h_exp_wall',  symbol: 'h̄.wall',  descriptionAr: 'ارتفاع التعرض — الجدار',           descriptionEn: 'Exposure height — wall',            unit: '—',     source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'R_ekv_wall',  symbol: 'Rэкв.wall',descriptionAr:'البعد المكافئ — الجدار',           descriptionEn: 'Equivalent radius — wall',          unit: 'm',     source: 'step5_wall',    type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'wall' },
  { name: 'R_star_wall', symbol: 'R*.wall',  descriptionAr: 'البعد الفعال — الجدار',            descriptionEn: 'Effective radius — wall',           unit: 'm',     source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'max_bv_wall', symbol: 'maxбв.wall',descriptionAr:'الإجهاد الأقصى — الجدار',          descriptionEn: 'Max soil stress — wall',            unit: 'kg/cm2',source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'tau_wall',    symbol: 'τ.wall',  descriptionAr: 'زمن تأثير الحمل — الجدار',         descriptionEn: 'Load duration — wall',              unit: 's',     source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'tau_ef_wall', symbol: 'τэф.wall', descriptionAr: 'الزمن الفعال — الجدار',            descriptionEn: 'Effective duration — wall',         unit: 's',     source: 'step5_wall',    type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'wall' },
  { name: 'tau_n_wall',  symbol: 'τн.wall', descriptionAr: 'زمن تصاعد الضغط — الجدار',         descriptionEn: 'Rise time — wall',                  unit: 's',     source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'a0cp_wall',   symbol: 'a0cp.wall',descriptionAr:'سرعة الموجة P — الجدار',           descriptionEn: 'P-wave velocity — wall',            unit: 'm/s',   source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'a1cp_wall',   symbol: 'a1cp.wall',descriptionAr:'سرعة الموجة S — الجدار',           descriptionEn: 'S-wave velocity — wall',            unit: 'm/s',   source: 'step5_wall',    type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 7: القيم الحاكمة — الأحمال (locked)
  // ──────────────────────────────────────────────────────────────────
  { name: 'omega_roof',  symbol: 'ω.roof',  descriptionAr: 'التردد الدائري — السقف',          descriptionEn: 'Circular frequency — roof',         unit: 's-1',   source: 'step5',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'omega_wall',  symbol: 'ω.wall',  descriptionAr: 'التردد الدائري — الجدار',         descriptionEn: 'Circular frequency — wall',         unit: 's-1',   source: 'step8',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'wall' },
  { name: 'C_dyn_roof',  symbol: 'Cд.roof', descriptionAr: 'معامل الديناميكية — السقف',       descriptionEn: 'Dynamic coeff — roof',              unit: '—',     source: 'step5',         type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'C_dyn_wall',  symbol: 'Cд.wall', descriptionAr: 'معامل الديناميكية — الجدار',      descriptionEn: 'Dynamic coeff — wall',              unit: '—',     source: 'step8',         type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'mu_struct_roof',symbol:'μ.roof', descriptionAr: 'معامل المطاوعة الإنشائي — السقف', descriptionEn: 'Structural ductility — roof',      unit: '—',     source: 'step5',         type: 'computed',dependsOn: [],        locked: false, engine: 'structural',  path: 'roof' },
  { name: 'mu_struct_wall',symbol:'μ.wall', descriptionAr: 'معامل المطاوعة الإنشائي — الجدار',descriptionEn: 'Structural ductility — wall',      unit: '—',     source: 'step8',         type: 'computed',dependsOn: [],        locked: false, engine: 'structural',  path: 'wall' },
  { name: 'Pmax_roof',   symbol: 'Pmax.roof',descriptionAr:'الضغط الأقصى — السقف',            descriptionEn: 'Maximum pressure — roof',           unit: 'kg/cm2',source: 'step5',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'P_ekv_roof',  symbol: 'Pэкв.roof',descriptionAr:'الضغط المكافئ — السقف',           descriptionEn: 'Equivalent pressure — roof',        unit: 'kg/cm2',source: 'step5',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'roof' },
  { name: 'Pp_roof',     symbol: 'Pp.roof', descriptionAr: 'الحمولة الحسابية — السقف',        descriptionEn: 'Design load — roof',                unit: 'kg/cm2',source: 'step5',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'structural',  path: 'roof' },
  { name: 'Pct_roof',    symbol: 'Pct.roof',descriptionAr: 'حمولة الجدار على السقف',          descriptionEn: 'Wall load on ceiling',              unit: 'kg/cm2',source: 'step5',         type: 'computed',dependsOn: [],        locked: false, engine: 'structural',  path: 'roof' },
  { name: 'Pmax_wall',   symbol: 'Pmax.wall',descriptionAr:'الضغط الأقصى — الجدار',           descriptionEn: 'Maximum pressure — wall',           unit: 'kg/cm2',source: 'step8',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'wall' },
  { name: 'P_ekv_wall',  symbol: 'Pэкв.wall',descriptionAr:'الضغط المكافئ — الجدار',          descriptionEn: 'Equivalent pressure — wall',        unit: 'kg/cm2',source: 'step8',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'blast',       path: 'wall' },
  { name: 'Pp_wall',     symbol: 'Pp.wall', descriptionAr: 'الحمولة الحسابية — الجدار',       descriptionEn: 'Design load — wall',                unit: 'kg/cm2',source: 'step8',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'structural',  path: 'wall' },
  { name: 'Pct_wall',    symbol: 'Pct.wall',descriptionAr: 'حمولة السقف على الجدار',          descriptionEn: 'Ceiling load on wall',              unit: 'kg/cm2',source: 'step8',         type: 'computed',dependsOn: [],        locked: false, engine: 'structural',  path: 'wall' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 8: معاملات الخطوة 5 — الحمولات (computed)
  // ──────────────────────────────────────────────────────────────────
  { name: 'h_bar_roof',  symbol: 'h̄.roof',  descriptionAr: 'الارتفاع المختزل — السقف',        descriptionEn: 'Normalized height — roof',          unit: '—',     source: 'step5_1',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'R_bar_b1_roof',symbol:'R̄̽.roof', descriptionAr: 'معامل البعد من B-1 — السقف',     descriptionEn: 'B-1 radius coeff — roof',           unit: '—',     source: 'step6',         type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'eta_roof',    symbol: 'η.roof',  descriptionAr: 'معامل η — السقف',                  descriptionEn: 'Eta coeff — roof',                  unit: '—',     source: 'step5_6',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'Rsd',         symbol: 'Rsd',     descriptionAr: 'مقاومة الحديد الديناميكية',        descriptionEn: 'Dynamic steel resistance',          unit: 'kg/cm2',source: 'step5_6',       type: 'computed',dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Rbd',         symbol: 'Rbd',     descriptionAr: 'مقاومة البيتون الديناميكية',       descriptionEn: 'Dynamic concrete resistance',       unit: 'kg/cm2',source: 'step5_6',       type: 'computed',dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'lambda_roof', symbol: 'λ.roof',  descriptionAr: 'معامل λ — السقف',                  descriptionEn: 'Lambda — roof',                     unit: '—',     source: 'step5_7',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'Kp_roof',     symbol: 'Kп.roof', descriptionAr: 'معامل Kп — السقف',                 descriptionEn: 'Kp coeff — roof',                   unit: '—',     source: 'step6',         type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'Kd_roof',     symbol: 'Kд.roof', descriptionAr: 'معامل Kд — السقف',                 descriptionEn: 'Kd coeff — roof',                   unit: '—',     source: 'step6',         type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'kpsi_roof',   symbol: 'kψ.roof', descriptionAr: 'معامل kψ — السقف',                descriptionEn: 'kpsi coeff — roof',                 unit: '—',     source: 'step5_8',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'h_bar_wall',  symbol: 'h̄.wall',  descriptionAr: 'الارتفاع المختزل — الجدار',       descriptionEn: 'Normalized height — wall',          unit: '—',     source: 'step8_2',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'R_bar_b1_wall',symbol:'R̄̽.wall', descriptionAr: 'معامل البعد من B-1 — الجدار',    descriptionEn: 'B-1 radius coeff — wall',           unit: '—',     source: 'step6',         type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'eta_wall',    symbol: 'η.wall',  descriptionAr: 'معامل η — الجدار',                 descriptionEn: 'Eta coeff — wall',                  unit: '—',     source: 'step8_6',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'lambda_wall', symbol: 'λ.wall',  descriptionAr: 'معامل λ — الجدار',                 descriptionEn: 'Lambda — wall',                     unit: '—',     source: 'step8_7',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'Kp_wall',     symbol: 'Kп.wall', descriptionAr: 'معامل Kп — الجدار',                descriptionEn: 'Kp coeff — wall',                   unit: '—',     source: 'step6',         type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'Kd_wall',     symbol: 'Kд.wall', descriptionAr: 'معامل Kд — الجدار',                descriptionEn: 'Kd coeff — wall',                   unit: '—',     source: 'step6',         type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'kpsi_wall',   symbol: 'kψ.wall', descriptionAr: 'معامل kψ — الجدار',               descriptionEn: 'kpsi coeff — wall',                 unit: '—',     source: 'step8_8',       type: 'computed',dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 9: جداول B-1 إلى B-6 — الخطوة 6 (lookup)
  // ──────────────────────────────────────────────────────────────────
  { name: 'mu_table_roof', symbol: 'μ.tbl.roof', descriptionAr: 'معامل μ جدول B-2 — السقف',  descriptionEn: 'B-2 mu — roof',                     unit: '—',     source: 'table_B2',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'eta_table_roof',symbol: 'η.tbl.roof', descriptionAr: 'معامل η جدول B-2 — السقف',  descriptionEn: 'B-2 eta — roof',                    unit: '—',     source: 'table_B2',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'Kt_roof',      symbol: 'Kt.roof',  descriptionAr: 'معامل Kt جدول B-2 — السقف',     descriptionEn: 'B-2 Kt — roof',                     unit: '—',     source: 'table_B2',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'a0z_roof',     symbol: 'a0z.roof', descriptionAr: 'سرعة الموجة من B-3 — السقف',    descriptionEn: 'B-3 a0z — roof',                    unit: 'm/s',   source: 'table_B3',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'a1z_roof',     symbol: 'a1z.roof', descriptionAr: 'سرعة الموجة من B-3 — السقف',    descriptionEn: 'B-3 a1z — roof',                    unit: 'm/s',   source: 'table_B3',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'Kpod_roof',    symbol: 'Kпод.roof',descriptionAr: 'معامل Kпод جدول B-4 — السقف',   descriptionEn: 'B-4 Kpod — roof',                   unit: '—',     source: 'table_B4',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'roof' },
  { name: 'mu_table_wall', symbol: 'μ.tbl.wall', descriptionAr: 'معامل μ جدول B-2 — الجدار', descriptionEn: 'B-2 mu — wall',                     unit: '—',     source: 'table_B2',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'eta_table_wall',symbol: 'η.tbl.wall', descriptionAr: 'معامل η جدول B-2 — الجدار', descriptionEn: 'B-2 eta — wall',                    unit: '—',     source: 'table_B2',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'Kt_wall',      symbol: 'Kt.wall',  descriptionAr: 'معامل Kt جدول B-2 — الجدار',    descriptionEn: 'B-2 Kt — wall',                     unit: '—',     source: 'table_B2',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'a0z_wall',     symbol: 'a0z.wall', descriptionAr: 'سرعة الموجة من B-3 — الجدار',   descriptionEn: 'B-3 a0z — wall',                    unit: 'm/s',   source: 'table_B3',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'a1z_wall',     symbol: 'a1z.wall', descriptionAr: 'سرعة الموجة من B-3 — الجدار',   descriptionEn: 'B-3 a1z — wall',                    unit: 'm/s',   source: 'table_B3',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },
  { name: 'Kpod_wall',    symbol: 'Kпод.wall',descriptionAr: 'معامل Kпод جدول B-4 — الجدار',  descriptionEn: 'B-4 Kpod — wall',                   unit: '—',     source: 'table_B4',      type: 'lookup',  dependsOn: [],        locked: false, engine: 'blast',       path: 'wall' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 10: العزوم (locked) — الخطوتان 7 و 8
  // ──────────────────────────────────────────────────────────────────
  { name: 'Mp_roof',      symbol: 'Mp.roof', descriptionAr: 'العزم الأكبر للسقف',             descriptionEn: 'Max moment — roof',                 unit: 'kg.cm', source: 'step7',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'structural',  path: 'roof' },
  { name: 'Mp_wall',      symbol: 'Mp.wall', descriptionAr: 'العزم الأكبر للجدار',            descriptionEn: 'Max moment — wall',                 unit: 'kg.cm', source: 'step8',         type: 'locked',  dependsOn: [],        locked: true,  engine: 'structural',  path: 'wall' },
  { name: 'h0_ceiling',   symbol: 'h0',      descriptionAr: 'العمق الفعال للسقف',              descriptionEn: 'Effective depth — ceiling',         unit: 'cm',    source: 'step7',         type: 'computed',dependsOn: [],        locked: false, engine: 'structural',  path: 'roof', formula: 'h0 = f(Mp,μ,Rsd)' },

  // ──────────────────────────────────────────────────────────────────
  // القسم 11: المخرجات النهائية — الخطوتان 7 و 8 (output)
  // ──────────────────────────────────────────────────────────────────
  { name: 'Hp_final',     symbol: 'Hп.final',descriptionAr: 'سماكة السقف النهائية',            descriptionEn: 'Final ceiling thickness',           unit: 'cm',    source: 'step7',         type: 'output',  dependsOn: ['h0_ceiling'], locked: false, engine: 'structural', path: 'roof', formula: 'h0*1.05' },
  { name: 'Hc_final',     symbol: 'Hc.final',descriptionAr: 'سماكة الجدار النهائية',           descriptionEn: 'Final wall thickness',              unit: 'cm',    source: 'step8',         type: 'output',  dependsOn: [],        locked: false, engine: 'structural',  path: 'wall' },
  { name: 'Hf_final',     symbol: 'Hф.final',descriptionAr: 'سماكة الأرضية النهائية',          descriptionEn: 'Final floor thickness',             unit: 'cm',    source: 'step8',         type: 'output',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
  { name: 'Hvct_final',   symbol: 'Hвc.final',descriptionAr:'سماكة الجدران الداخلية النهائية', descriptionEn: 'Final inner wall thickness',       unit: 'cm',    source: 'step8',         type: 'output',  dependsOn: [],        locked: false, engine: 'structural',  path: 'wall' },
  { name: 'status_final', symbol: 'status',  descriptionAr: 'حالة التحقق النهائي',             descriptionEn: 'Final verification status',         unit: '—',     source: 'step8',         type: 'output',  dependsOn: [],        locked: false, engine: 'structural',  path: 'shared' },
];

// ═══════════════════════════════════════════════════════════════════════
// سجلّ القيم المقفلة — للقراءة فقط بين المحركات
// ═══════════════════════════════════════════════════════════════════════

export const LOCKED_VARIABLES = UNIFIED_VARIABLE_TABLE.filter(v => v.locked);
export const LOCKED_VARIABLE_NAMES = LOCKED_VARIABLES.map(v => v.name);

export const LOCKED_REGISTRY: Record<string, {
  readonly producedBy: EngineName;
  readonly consumedBy: EngineName[];
  readonly path: PathType;
  readonly symbol: string;
}> = {
  C_ef:          { producedBy: 'penetration', consumedBy: ['blast'],               path: 'shared', symbol: 'Cэф' },
  h_pr:          { producedBy: 'penetration', consumedBy: ['blast'],               path: 'shared', symbol: 'hпр' },
  R_actual:      { producedBy: 'penetration', consumedBy: ['blast'],               path: 'shared', symbol: 'R̽' },
  Zp:            { producedBy: 'penetration', consumedBy: ['blast','structural'],  path: 'shared', symbol: 'Zp' },
  ht:            { producedBy: 'blast',       consumedBy: ['structural'],          path: 'roof',   symbol: 'ht' },
  Bt:            { producedBy: 'blast',       consumedBy: ['structural'],          path: 'roof',   symbol: 'Bt' },
  Hpc:           { producedBy: 'blast',       consumedBy: ['structural'],          path: 'roof',   symbol: 'Hp.c' },
  R_ekv_roof:    { producedBy: 'blast',       consumedBy: ['structural'],          path: 'roof',   symbol: 'Rэкв' },
  tau_ef_roof:   { producedBy: 'blast',       consumedBy: ['blast','structural'],  path: 'roof',   symbol: 'τэф' },
  tau_ef_wall:   { producedBy: 'blast',       consumedBy: ['blast','structural'],  path: 'wall',   symbol: 'τэф.wall' },
  omega_roof:    { producedBy: 'blast',       consumedBy: ['blast','structural'],  path: 'roof',   symbol: 'ω.roof' },
  omega_wall:    { producedBy: 'blast',       consumedBy: ['blast','structural'],  path: 'wall',   symbol: 'ω.wall' },
  Pmax_roof:     { producedBy: 'blast',       consumedBy: ['structural'],          path: 'roof',   symbol: 'Pmax.roof' },
  P_ekv_roof:    { producedBy: 'blast',       consumedBy: ['structural'],          path: 'roof',   symbol: 'Pэкв.roof' },
  Pp_roof:       { producedBy: 'structural',  consumedBy: ['structural'],          path: 'roof',   symbol: 'Pp.roof' },
  Pmax_wall:     { producedBy: 'blast',       consumedBy: ['structural'],          path: 'wall',   symbol: 'Pmax.wall' },
  P_ekv_wall:    { producedBy: 'blast',       consumedBy: ['structural'],          path: 'wall',   symbol: 'Pэкв.wall' },
  Pp_wall:       { producedBy: 'structural',  consumedBy: ['structural'],          path: 'wall',   symbol: 'Pp.wall' },
  Mp_roof:       { producedBy: 'structural',  consumedBy: ['structural'],          path: 'roof',   symbol: 'Mp.roof' },
  Mp_wall:       { producedBy: 'structural',  consumedBy: ['structural'],          path: 'wall',   symbol: 'Mp.wall' },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// حدود المحركات
// ═══════════════════════════════════════════════════════════════════════

export const ENGINE_BOUNDARIES: EngineBoundary = {
  penetrationToBlast: ['C_ef', 'h_pr', 'R_actual', 'Zp'],
  blastRoofToStructural: ['tau_ef_roof', 'omega_roof', 'Pmax_roof', 'P_ekv_roof', 'Pp_roof', 'Bt', 'ht', 'Hpc', 'R_ekv_roof'],
  blastWallToStructural: ['tau_ef_wall', 'omega_wall', 'Pmax_wall', 'P_ekv_wall', 'Pp_wall', 'R_ekv_wall'],
  withinBlastRoof: ['tau_ef_roof', 'omega_roof', 'C_dyn_roof', 'Pmax_roof', 'P_ekv_roof'],
  withinBlastWall: ['tau_ef_wall', 'omega_wall', 'C_dyn_wall', 'Pmax_wall', 'P_ekv_wall'],
} as const;

// ═══════════════════════════════════════════════════════════════════════
// الرسم البياني للاعتماديات
// ═══════════════════════════════════════════════════════════════════════

function buildDependencyGraph(): DependencyNode[] {
  const nameMap = new Map(UNIFIED_VARIABLE_TABLE.map(v => [v.name, v]));
  const dependedBy = new Map<string, string[]>();
  for (const v of UNIFIED_VARIABLE_TABLE) {
    for (const dep of v.dependsOn) {
      const list = dependedBy.get(dep) ?? [];
      list.push(v.name);
      dependedBy.set(dep, list);
    }
  }
  return UNIFIED_VARIABLE_TABLE.map(v => ({
    symbol: v.symbol,
    type: v.type,
    engine: v.engine,
    path: v.path,
    dependsOn: v.dependsOn,
    dependedBy: dependedBy.get(v.name) ?? [],
  }));
}

export const DEPENDENCY_GRAPH: DependencyNode[] = buildDependencyGraph();

// ═══════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

export function getVariableByName(name: string): UnifiedVariable | undefined {
  return UNIFIED_VARIABLE_TABLE.find(v => v.name === name);
}
export function getVariablesByType(type: VariableType): UnifiedVariable[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.type === type);
}
export function getVariablesByEngine(engine: EngineName): UnifiedVariable[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.engine === engine);
}
export function getVariablesByPath(path: PathType): UnifiedVariable[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.path === path);
}
export function getLockedForEngine(engine: EngineName): UnifiedVariable[] {
  return UNIFIED_VARIABLE_TABLE.filter(v => v.locked && v.engine === engine);
}
export function isLocked(name: string): boolean {
  return LOCKED_VARIABLE_NAMES.includes(name);
}
