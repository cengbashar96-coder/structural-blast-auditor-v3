#!/usr/bin/env python3
"""
Unified Dynamic Auditor Platform V3.0 — Engine Pipeline Dependency Graph
Professional publication-quality flowchart using matplotlib.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, Arc
import matplotlib.patheffects as pe
from matplotlib.font_manager import FontProperties, fontManager
import numpy as np
import os

# ── Font Setup ──────────────────────────────────────────────────────────────
FONT_DIR = "/home/z/my-project/download/assets"
ARABIC_REGULAR = os.path.join(FONT_DIR, "NotoSansArabic-Regular.ttf")
ARABIC_BOLD = os.path.join(FONT_DIR, "NotoSansArabic-Bold.ttf")

# Register Arabic fonts
for fp_path in [ARABIC_REGULAR, ARABIC_BOLD]:
    if os.path.exists(fp_path):
        fontManager.addfont(fp_path)

fp_ar_bold = FontProperties(fname=ARABIC_BOLD, size=11)
fp_ar_reg  = FontProperties(fname=ARABIC_REGULAR, size=9)
fp_ar_sm   = FontProperties(fname=ARABIC_REGULAR, size=7.5)

fp_en      = FontProperties(family='DejaVu Sans', size=9)
fp_en_b    = FontProperties(family='DejaVu Sans', size=11, weight='bold')
fp_en_title= FontProperties(family='DejaVu Sans', size=14, weight='bold')
fp_en_sm   = FontProperties(family='DejaVu Sans', size=7.5)
fp_en_xs   = FontProperties(family='DejaVu Sans', size=6.5)
fp_en_mono = FontProperties(family='DejaVu Sans Mono', size=6.5)

# ── Color Palette ───────────────────────────────────────────────────────────
class C:
    BG              = '#FAFBFD'
    # Phase backgrounds (low-saturation)
    P1_BG           = '#EFF6FF'   # Blue tint
    P2_BG           = '#F0FDF4'   # Green tint
    P3_BG           = '#FFF7ED'   # Orange tint
    # Sub-section
    CEIL_BG         = '#F0FDF4'
    WALL_BG         = '#FDF2F8'
    # Borders
    P1_BRD          = '#3B82F6'
    P2_BRD          = '#16A34A'
    P3_BRD          = '#EA580C'
    CEIL_BRD        = '#86EFAC'
    WALL_BRD        = '#F9A8D4'
    LOCK_BRD        = '#DC2626'
    # Titles
    P1_TTL          = '#1E3A5F'
    P2_TTL          = '#14532D'
    P3_TTL          = '#7C2D12'
    # Badges
    INP_BG          = '#DBEAFE'; INP_BRD   = '#93C5FD'
    LKP_BG          = '#FEF3C7'; LKP_BRD   = '#FCD34D'
    CMP_BG          = '#E0E7FF'; CMP_BRD   = '#A5B4FC'
    LCK_BG          = '#FFE4E6'; LCK_BRD   = '#F87171'
    # Text
    SUB_TTL         = '#475569'
    LBL             = '#334155'
    LBL_LT         = '#64748B'
    LCK_TXT        = '#991B1B'
    ARROW           = '#94A3B8'
    ARROW_DK        = '#64748B'
    PIPE_BG         = '#FEF2F2'
    PIPE_BRD        = '#FCA5A5'


# ── Helper: Draw lock icon (small padlock shape) ───────────────────────────
def draw_lock_icon(ax, cx, cy, size=0.006, color='#DC2626', zorder=10):
    """Draw a tiny padlock icon at (cx, cy)."""
    s = size
    pad_val = 0.15 * s
    # Body (rounded rectangle)
    body = FancyBboxPatch((cx - s, cy - s*0.8), 2*s, 1.4*s,
                           boxstyle=f"round,pad={pad_val:.6f}",
                           facecolor=color, edgecolor='#7F1D1D',
                           linewidth=0.6, zorder=zorder)
    ax.add_patch(body)
    # Shackle (arc on top)
    shackle = Arc((cx, cy + s*0.6), 1.2*s, 1.2*s,
                  angle=0, theta1=0, theta2=180,
                  color='#7F1D1D', linewidth=1.0, zorder=zorder+1)
    ax.add_patch(shackle)
    # Keyhole dot
    ax.plot(cx, cy - s*0.1, 'o', color='white', markersize=max(1.0, s*80), zorder=zorder+2)


# ── Helper: Draw rounded box ───────────────────────────────────────────────
def rbox(ax, x, y, w, h, fc, ec, lw=1.2, zorder=3, alpha=1.0, ls='-'):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.006",
                          facecolor=fc, edgecolor=ec, linewidth=lw,
                          zorder=zorder, alpha=alpha, linestyle=ls)
    ax.add_patch(box)
    return box


# ── Helper: Draw a badge/variable box ──────────────────────────────────────
def badge(ax, cx, cy, text, fc, ec, fp=None, tc='#334155', w=0.115, h=0.017, zorder=5):
    """Draw a centered badge with text."""
    if fp is None:
        fp = fp_en_sm
    rbox(ax, cx - w/2, cy - h/2, w, h, fc, ec, lw=0.7, zorder=zorder)
    ax.text(cx, cy, text, fontproperties=fp, color=tc,
            ha='center', va='center', zorder=zorder+1)


# ── Helper: Draw arrow ─────────────────────────────────────────────────────
def arrow(ax, x1, y1, x2, y2, color=C.ARROW, lw=1.2, style='-|>', zorder=2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw,
                                connectionstyle='arc3,rad=0',
                                shrinkA=3, shrinkB=3),
                zorder=zorder)


def arrow_curve(ax, x1, y1, x2, y2, color=C.ARROW, lw=1.2, rad=0.2, zorder=2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='-|>', color=color, lw=lw,
                                connectionstyle=f'arc3,rad={rad}',
                                shrinkA=3, shrinkB=3),
                zorder=zorder)


def arrow_dash(ax, x1, y1, x2, y2, color=C.LOCK_BRD, lw=1.0, zorder=2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='-|>', color=color, lw=lw,
                                linestyle='dashed',
                                connectionstyle='arc3,rad=0',
                                shrinkA=3, shrinkB=3),
                zorder=zorder)


# ── Helper: Locked output box (with lock icon + red border) ────────────────
def locked_box(ax, cx, cy, symbol, varname, w=0.14, h=0.025, zorder=5):
    """Draw a locked output box with lock icon, symbol, and variable name."""
    rbox(ax, cx - w/2, cy - h/2, w, h, C.LCK_BG, C.LCK_BRD, lw=1.8, zorder=zorder)
    draw_lock_icon(ax, cx - w/2 + 0.012, cy, size=0.004, zorder=zorder+2)
    ax.text(cx - w/2 + 0.022, cy + 0.004, symbol, fontproperties=fp_en_b,
            color=C.LCK_TXT, ha='left', va='center', fontsize=8, zorder=zorder+1)
    ax.text(cx - w/2 + 0.022, cy - 0.006, varname, fontproperties=fp_en_xs,
            color='#991B1B', ha='left', va='center', zorder=zorder+1)


# ════════════════════════════════════════════════════════════════════════════
# MAIN FIGURE
# ════════════════════════════════════════════════════════════════════════════
fig_w, fig_h = 26, 18   # inches — landscape
dpi = 150
fig, ax = plt.subplots(1, 1, figsize=(fig_w, fig_h), dpi=dpi)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.set_aspect('auto')
ax.axis('off')
fig.patch.set_facecolor(C.BG)
ax.set_facecolor(C.BG)


# ── Title Bar ───────────────────────────────────────────────────────────────
rbox(ax, 0.015, 0.955, 0.97, 0.038, '#F1F5F9', '#CBD5E1', lw=0.8, zorder=2)
ax.text(0.5, 0.982, 'Unified Dynamic Auditor Platform V3.0  —  Engine Pipeline Dependency Graph',
        fontproperties=fp_en_title, color='#1E293B', ha='center', va='center',
        fontsize=15, fontweight='bold', zorder=10)
ax.text(0.5, 0.962, 'Three-Phase Computation Pipeline  |  Penetration  >>  Blast Loads  >>  Structural Design',
        fontproperties=fp_en_sm, color='#64748B', ha='center', va='center',
        fontsize=8, zorder=10)


# ════════════════════════════════════════════════════════════════════════════
# ENGINE 1: PENETRATION
# ════════════════════════════════════════════════════════════════════════════
e1_l, e1_r = 0.015, 0.985
e1_t, e1_b = 0.940, 0.665
rbox(ax, e1_l, e1_b, e1_r - e1_l, e1_t - e1_b, C.P1_BG, C.P1_BRD, lw=2.2, zorder=1)

# Phase header
ax.text(e1_l + 0.012, e1_t - 0.013, 'ENGINE 1 : PENETRATION',
        fontproperties=fp_en_title, color=C.P1_TTL, ha='left', va='top',
        fontsize=13, fontweight='bold', zorder=5)
ax.text(e1_l + 0.012, e1_t - 0.032, '\u0645\u062D\u0631\u0643 \u0627\u0644\u0627\u062E\u062A\u0631\u0627\u0642',
        fontproperties=fp_ar_bold, color=C.P1_TTL, ha='left', va='top', zorder=5)

# Subtle separator
ax.plot([e1_l + 0.01, e1_r - 0.01], [e1_t - 0.042, e1_t - 0.042],
        color='#BFDBFE', lw=0.8, zorder=2)

# ── INPUTS column ──────────────────────────────────────────────────────────
inp_x = 0.075
inp_y0 = e1_t - 0.058
inp_sp = 0.022

ax.text(inp_x, inp_y0 + 0.010, 'INPUTS', fontproperties=fp_en_b,
        color=C.P1_BRD, ha='center', va='center', fontsize=7.5, zorder=5)

inputs = [
    ('bombId',          'Bomb ID'),
    ('fallVelocity',    'V_fall'),
    ('fallAngle',       '\u03B8_fall'),
    ('mountainSlope',   '\u03B1_slope'),
    ('tunnelDepth',     'h_tunnel'),
    ('soilTypeCode',    'soil_type'),
]
for i, (var, sym) in enumerate(inputs):
    y = inp_y0 - i * inp_sp
    badge(ax, inp_x, y, f'{sym}  {var}', C.INP_BG, C.INP_BRD,
          fp=fp_en_xs, tc='#1E40AF', w=0.125, h=0.016)

# ── LOOKUPS column ─────────────────────────────────────────────────────────
lkp_x = 0.235
ax.text(lkp_x, inp_y0 + 0.010, 'LOOKUPS', fontproperties=fp_en_b,
        color='#92400E', ha='center', va='center', fontsize=7.5, zorder=5)

lookups = [
    ('explosiveCoeffK1',       'K\u2081'),
    ('soilPenetrationCoeff',   'K_pen'),
    ('scaledCraterRadiusBar',  'R\u0305'),
    ('safetyFactorN0',         'N\u2080'),
]
for i, (var, sym) in enumerate(lookups):
    y = inp_y0 - i * inp_sp
    badge(ax, lkp_x, y, f'{sym}  {var}', C.LKP_BG, C.LKP_BRD,
          fp=fp_en_xs, tc='#78350F', w=0.125, h=0.016)

# ── Flow arrows: Inputs/Lookups → Computed ─────────────────────────────────
comp_x = 0.435
for i in range(4):
    y = inp_y0 - i * inp_sp
    arrow(ax, inp_x + 0.065, y, comp_x - 0.06, y, color='#93C5FD', lw=0.7)
    arrow(ax, lkp_x + 0.065, y, comp_x - 0.06, y - 0.005, color='#FCD34D', lw=0.7)
for i in range(4, 6):
    y = inp_y0 - i * inp_sp
    arrow(ax, inp_x + 0.065, y, comp_x - 0.06, y + 0.010, color='#93C5FD', lw=0.7)

# ── COMPUTED column ────────────────────────────────────────────────────────
ax.text(comp_x, inp_y0 + 0.010, 'COMPUTED', fontproperties=fp_en_b,
        color='#4338CA', ha='center', va='center', fontsize=7.5, zorder=5)

computed_e1 = [
    ('effectiveCharge',     'C\u0444\u044D'),
    ('lambda1',             '\u03BB\u2081'),
    ('lambda2',             '\u03BB\u2082'),
    ('penetrationDepthSoil','h\u043F\u0440.\u0433'),
    ('craterRadius',        'R_crater'),
    ('dynamicLoadHeight',   'H_dyn'),
]
for i, (var, sym) in enumerate(computed_e1):
    y = inp_y0 - i * inp_sp
    badge(ax, comp_x, y, f'{sym}  {var}', C.CMP_BG, C.CMP_BRD,
          fp=fp_en_xs, tc='#3730A3', w=0.125, h=0.016)

# Internal flow arrows (top to bottom)
for i in range(5):
    y1 = inp_y0 - i * inp_sp - 0.007
    y2 = inp_y0 - (i+1) * inp_sp + 0.007
    arrow(ax, comp_x, y1, comp_x, y2, color='#A5B4FC', lw=0.9)

# ── LOCKED OUTPUTS column ─────────────────────────────────────────────────
lck_x = 0.66
ax.text(lck_x, inp_y0 + 0.010, 'LOCKED OUTPUTS', fontproperties=fp_en_b,
        color=C.LOCK_BRD, ha='center', va='center', fontsize=7.5, zorder=5)

locked_e1 = [
    ('penetrationDepthSoil',    'h\u043F\u0440.\u0433'),
    ('dynamicLoadZoneHeight',   'H'),
    ('effectiveCharge',         'C\u0444\u044D'),
    ('destructionRadiusSoil',   'Zp'),
]
for i, (var, sym) in enumerate(locked_e1):
    y = inp_y0 - 0.012 - i * 0.028
    locked_box(ax, lck_x, y, sym, var, w=0.14, h=0.022)

# Arrows from computed → locked
comp_lck_map = [(0, 0), (3, 0), (5, 1), (0, 2), (3, 3)]  # approximate mapping
arrow_map_e1 = [(3, 0), (5, 1), (0, 2), (3, 3)]
for ci, li in arrow_map_e1:
    y_c = inp_y0 - ci * inp_sp
    y_l = inp_y0 - 0.012 - li * 0.028
    arrow(ax, comp_x + 0.065, y_c, lck_x - 0.07, y_l, color='#F87171', lw=1.0)

# ── Formula box ────────────────────────────────────────────────────────────
form_x = 0.84
form_y0 = e1_t - 0.060
rbox(ax, form_x - 0.005, e1_b + 0.008, 0.145, 0.220, '#F8FAFC', '#CBD5E1', lw=0.7, zorder=2)
ax.text(form_x + 0.067, form_y0, 'Key Equations', fontproperties=fp_en_b,
        color='#475569', ha='center', va='top', fontsize=7, zorder=5)
eqs = [
    'C\u0444\u044D = K\u2081 \u00B7 f(bombId)',
    'h\u043F\u0440.\u0433 = f(C\u0444\u044D, K_pen, \u03B8)',
    '\u03BB\u2081 = f(V, \u03B1, soilType)',
    '\u03BB\u2082 = f(h_tunnel, h\u043F\u0440)',
    'Zp = N\u2080 \u00B7 f(h\u043F\u0440, R\u0305)',
    'H = f(Zp, soilType)',
]
for i, eq in enumerate(eqs):
    ax.text(form_x + 0.067, form_y0 - 0.022 - i * 0.020, eq,
            fontproperties=fp_en_mono, color='#64748B', ha='center', va='top',
            fontsize=6, zorder=5)


# ════════════════════════════════════════════════════════════════════════════
# PIPE 1: Engine 1 → Engine 2
# ════════════════════════════════════════════════════════════════════════════
p1_t, p1_b = e1_b, 0.645
pipe_vars = [
    (0.38, 'h\u043F\u0440.\u0433'),
    (0.50, 'C\u0444\u044D'),
    (0.62, 'Zp'),
]
for px, lbl in pipe_vars:
    rbox(ax, px - 0.035, p1_b, 0.07, p1_t - p1_b,
         C.PIPE_BG, C.PIPE_BRD, lw=0.8, zorder=1, alpha=0.55, ls='--')
    ax.text(px, (p1_t + p1_b) / 2, lbl, fontproperties=fp_en_sm,
            color=C.LCK_TXT, ha='center', va='center', zorder=4, rotation=90, fontsize=7)
    draw_lock_icon(ax, px, (p1_t + p1_b) / 2 + 0.018, size=0.003, zorder=5)
    arrow(ax, px, p1_t, px, p1_b + 0.004, color='#F87171', lw=1.5)

ax.text(0.82, (p1_t + p1_b) / 2, 'LOCKED VALUES FLOW  \u25BC',
        fontproperties=fp_en_b, color=C.LOCK_BRD, ha='center', va='center',
        fontsize=7, fontweight='bold', zorder=5)


# ════════════════════════════════════════════════════════════════════════════
# ENGINE 2: BLAST LOADS
# ════════════════════════════════════════════════════════════════════════════
e2_t, e2_b = 0.630, 0.325
rbox(ax, e1_l, e2_b, e1_r - e1_l, e2_t - e2_b, C.P2_BG, C.P2_BRD, lw=2.2, zorder=1)

ax.text(e1_l + 0.012, e2_t - 0.013, 'ENGINE 2 : BLAST LOADS',
        fontproperties=fp_en_title, color=C.P2_TTL, ha='left', va='top',
        fontsize=13, fontweight='bold', zorder=5)
ax.text(e1_l + 0.012, e2_t - 0.032,
        '\u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u062D\u0645\u0627\u0644 \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629',
        fontproperties=fp_ar_bold, color=C.P2_TTL, ha='left', va='top', zorder=5)

ax.plot([e1_l + 0.01, e1_r - 0.01], [e2_t - 0.042, e2_t - 0.042],
        color='#BBF7D0', lw=0.8, zorder=2)

# Locked-from-penetration labels
ax.text(e1_l + 0.015, e2_t - 0.053, 'Locked from Penetration:',
        fontproperties=fp_en_b, color=C.LOCK_BRD, ha='left', va='top',
        fontsize=7, zorder=5)
locked_from_p = [
    'penetrationDepthSoil (h\u043F\u0440.\u0433)',
    'effectiveCharge (C\u0444\u044D)',
    'destructionRadiusSoil (Zp)',
]
for i, lf in enumerate(locked_from_p):
    ax.text(e1_l + 0.025, e2_t - 0.065 - i * 0.011, f'\u2192 {lf}',
            fontproperties=fp_en_xs, color='#991B1B', ha='left', va='top', zorder=5)

# ── Sub-section: CEILING ──────────────────────────────────────────────────
cl_l, cl_r = 0.17, 0.555
cl_t, cl_b = e2_t - 0.045, e2_b + 0.012
rbox(ax, cl_l, cl_b, cl_r - cl_l, cl_t - cl_b, C.CEIL_BG, C.CEIL_BRD, lw=1.5, zorder=2)

ax.text((cl_l + cl_r) / 2, cl_t - 0.012,
        'CEILING  \u2014  \u0627\u0644\u0633\u0642\u0641',
        fontproperties=fp_en_b, color='#166534', ha='center', va='top',
        fontsize=10, fontweight='bold', zorder=5)

ceil_computed = [
    ('protectionSlabThickness',  'ht',    'Slab thickness'),
    ('pressureDistThickness',    'Hpc',   'Pressure distribution'),
    ('maxStressCeiling',         'max\u0431\u0432', 'Max stress (ceiling)'),
    ('totalWaveDuration',        'T_wave','Wave duration'),
    ('effectiveWaveDuration',    '\u03C4\u0444\u044D', 'Eff. wave duration'),
    ('vibrationFrequency',       '\u03C9', 'Vibration frequency'),
]
cl_y0 = cl_t - 0.035
cl_sp = 0.021
for i, (var, sym, desc) in enumerate(ceil_computed):
    y = cl_y0 - i * cl_sp
    badge(ax, (cl_l + cl_r) / 2, y, f'{sym}  {var}', C.CMP_BG, C.CMP_BRD,
          fp=fp_en_xs, tc='#3730A3', w=0.17, h=0.016)

# Flow arrows within ceiling
for i in range(len(ceil_computed) - 1):
    y1 = cl_y0 - i * cl_sp - 0.007
    y2 = cl_y0 - (i+1) * cl_sp + 0.007
    arrow(ax, (cl_l + cl_r) / 2, y1, (cl_l + cl_r) / 2, y2, color='#86EFAC', lw=0.7)

# Ceiling locked outputs
cl_lock_y0 = cl_y0 - len(ceil_computed) * cl_sp - 0.012
ceil_locked = [
    ('designLoadCeiling',      'Pp\u043F'),
    ('protectionSlabThickness','ht'),
    ('pressureDistThickness',  'Hpc'),
]
for i, (var, sym) in enumerate(ceil_locked):
    y = cl_lock_y0 - i * 0.024
    locked_box(ax, (cl_l + cl_r) / 2, y, sym, var, w=0.18, h=0.020)

# ── Sub-section: WALL ─────────────────────────────────────────────────────
wl_l, wl_r = 0.585, 0.97
rbox(ax, wl_l, cl_b, wl_r - wl_l, cl_t - cl_b, C.WALL_BG, C.WALL_BRD, lw=1.5, zorder=2)

ax.text((wl_l + wl_r) / 2, cl_t - 0.012,
        'WALL  \u2014  \u0627\u0644\u062C\u062F\u0627\u0631',
        fontproperties=fp_en_b, color='#9D174D', ha='center', va='top',
        fontsize=10, fontweight='bold', zorder=5)

wall_computed = [
    ('maxStressWall',         'max\u0431w',  'Max stress (wall)'),
    ('maxLoad',               'Pmax',       'Max load'),
    ('equivalentLoad',        'P\u044D\u043A\u0432', 'Equiv. load'),
    ('effectiveWaveDuration', '\u03C4\u0444\u044D', 'Eff. wave duration'),
    ('vibrationFrequency',    '\u03C9',     'Vibration frequency'),
]
wl_y0 = cl_t - 0.035
for i, (var, sym, desc) in enumerate(wall_computed):
    y = wl_y0 - i * cl_sp
    badge(ax, (wl_l + wl_r) / 2, y, f'{sym}  {var}', C.CMP_BG, C.CMP_BRD,
          fp=fp_en_xs, tc='#3730A3', w=0.17, h=0.016)

# Flow arrows within wall
for i in range(len(wall_computed) - 1):
    y1 = wl_y0 - i * cl_sp - 0.007
    y2 = wl_y0 - (i+1) * cl_sp + 0.007
    arrow(ax, (wl_l + wl_r) / 2, y1, (wl_l + wl_r) / 2, y2, color='#F9A8D4', lw=0.7)

# Wall locked outputs
wl_lock_y0 = wl_y0 - len(wall_computed) * cl_sp - 0.012
wall_locked = [
    ('designLoadWall', 'Ppc'),
]
for i, (var, sym) in enumerate(wall_locked):
    y = wl_lock_y0 - i * 0.024
    locked_box(ax, (wl_l + wl_r) / 2, y, sym, var, w=0.18, h=0.020)

# ── Cross-link: shared variables ───────────────────────────────────────────
mid_y = wl_y0 - 3 * cl_sp
ax.annotate('', xy=(wl_l + 0.008, mid_y), xytext=(cl_r - 0.008, mid_y),
            arrowprops=dict(arrowstyle='<->', color='#818CF8', lw=1.0,
                            linestyle='dashed', shrinkA=3, shrinkB=3),
            zorder=3)
ax.text((cl_r + wl_l) / 2, mid_y + 0.007,
        '\u03C4\u0444\u044D, \u03C9 shared',
        fontproperties=fp_en_sm, color='#6366F1', ha='center', va='bottom',
        fontsize=6, zorder=5)


# ════════════════════════════════════════════════════════════════════════════
# PIPE 2: Engine 2 → Engine 3
# ════════════════════════════════════════════════════════════════════════════
p2_t, p2_b = e2_b, 0.305
pipe2_vars = [
    (0.32, 'Pp\u043F (ceiling)'),
    (0.50, 'Ppc (wall)'),
    (0.68, 'ht, Hpc'),
]
for px, lbl in pipe2_vars:
    rbox(ax, px - 0.04, p2_b, 0.08, p2_t - p2_b,
         C.PIPE_BG, C.PIPE_BRD, lw=0.8, zorder=1, alpha=0.55, ls='--')
    ax.text(px, (p2_t + p2_b) / 2, lbl, fontproperties=fp_en_xs,
            color=C.LCK_TXT, ha='center', va='center', zorder=4, rotation=90, fontsize=6)
    draw_lock_icon(ax, px, (p2_t + p2_b) / 2 + 0.016, size=0.003, zorder=5)
    arrow(ax, px, p2_t, px, p2_b + 0.004, color='#F87171', lw=1.5)

ax.text(0.87, (p2_t + p2_b) / 2, 'LOCKED VALUES FLOW  \u25BC',
        fontproperties=fp_en_b, color=C.LOCK_BRD, ha='center', va='center',
        fontsize=7, fontweight='bold', zorder=5)


# ════════════════════════════════════════════════════════════════════════════
# ENGINE 3: STRUCTURAL DESIGN
# ════════════════════════════════════════════════════════════════════════════
e3_t, e3_b = 0.290, 0.025
rbox(ax, e1_l, e3_b, e1_r - e1_l, e3_t - e3_b, C.P3_BG, C.P3_BRD, lw=2.2, zorder=1)

ax.text(e1_l + 0.012, e3_t - 0.013, 'ENGINE 3 : STRUCTURAL DESIGN',
        fontproperties=fp_en_title, color=C.P3_TTL, ha='left', va='top',
        fontsize=13, fontweight='bold', zorder=5)
ax.text(e1_l + 0.012, e3_t - 0.032,
        '\u0645\u062D\u0631\u0643 \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0626\u064A',
        fontproperties=fp_ar_bold, color=C.P3_TTL, ha='left', va='top', zorder=5)

ax.plot([e1_l + 0.01, e1_r - 0.01], [e3_t - 0.042, e3_t - 0.042],
        color='#FED7AA', lw=0.8, zorder=2)

# ── Inputs ─────────────────────────────────────────────────────────────────
e3_y0 = e3_t - 0.060
e3_sp = 0.030

ax.text(0.08, e3_y0 + 0.015, 'INPUTS', fontproperties=fp_en_b,
        color=C.P3_BRD, ha='center', va='center', fontsize=7.5, zorder=5)
e3_inputs = [
    ('maxMomentCeiling', 'M_max(ceil)'),
    ('maxMomentWall',    'M_max(wall)'),
]
for i, (var, sym) in enumerate(e3_inputs):
    y = e3_y0 - i * e3_sp
    badge(ax, 0.08, y, f'{sym}', C.INP_BG, C.INP_BRD,
          fp=fp_en_sm, tc='#1E40AF', w=0.10, h=0.018)

# ── Computed ───────────────────────────────────────────────────────────────
ax.text(0.27, e3_y0 + 0.015, 'COMPUTED', fontproperties=fp_en_b,
        color='#4338CA', ha='center', va='center', fontsize=7.5, zorder=5)
e3_computed = [
    ('ceilingEffectiveDepth', 'h\u2080(ceil)', 'Effective depth \u2014 ceiling'),
    ('wallEffectiveDepth',    'h\u2080(wall)', 'Effective depth \u2014 wall'),
]
for i, (var, sym, desc) in enumerate(e3_computed):
    y = e3_y0 - i * e3_sp
    badge(ax, 0.27, y, f'{sym}  {var}', C.CMP_BG, C.CMP_BRD,
          fp=fp_en_sm, tc='#3730A3', w=0.14, h=0.018)

# Arrows: input → computed
for i in range(2):
    y = e3_y0 - i * e3_sp
    arrow(ax, 0.13, y, 0.20, y, color='#93C5FD', lw=1.0)

# ── Locked outputs ─────────────────────────────────────────────────────────
ax.text(0.55, e3_y0 + 0.015, 'LOCKED OUTPUTS', fontproperties=fp_en_b,
        color=C.LOCK_BRD, ha='center', va='center', fontsize=7.5, zorder=5)

e3_locked = [
    ('ceilingThickness', 'H\u043F', 'Ceiling thickness'),
    ('wallThickness',    'Hc',  'Wall thickness'),
    ('floorThickness',   'H\u0444', 'Floor thickness'),
]

lck_e3_y0 = e3_y0 - 0.005
for i, (var, sym, desc) in enumerate(e3_locked):
    y = lck_e3_y0 - i * 0.036
    locked_box(ax, 0.55, y, sym, f'{var} \u2014 {desc}', w=0.20, h=0.028)
    # Arrow from computed to locked
    if i < 2:
        arrow(ax, 0.34, e3_y0 - i * e3_sp, 0.45, y, color='#F87171', lw=1.2)

# Arrow from ceiling computed to floor locked (cross-reference)
arrow_curve(ax, 0.34, e3_y0, 0.45, lck_e3_y0 - 2 * 0.036,
            color='#F87171', lw=1.0, rad=-0.3)

# ── Final output summary ──────────────────────────────────────────────────
fin_x = 0.80
fin_y0 = e3_y0 - 0.01
rbox(ax, fin_x - 0.07, fin_y0 - 0.08, 0.155, 0.10,
     '#FEF2F2', '#FCA5A5', lw=1.8, zorder=3)
ax.text(fin_x + 0.007, fin_y0 + 0.012, 'FINAL OUTPUTS', fontproperties=fp_en_b,
        color=C.LOCK_BRD, ha='center', va='center', fontsize=8, fontweight='bold', zorder=5)

final_items = ['H\u043F  Ceiling', 'Hc  Wall', 'H\u0444  Floor']
for i, item in enumerate(final_items):
    y = fin_y0 - 0.005 - i * 0.018
    ax.text(fin_x + 0.007, y, item, fontproperties=fp_en_sm,
            color=C.LCK_TXT, ha='center', va='center', fontsize=8, zorder=5)

# Arrows from locked to final
for i in range(3):
    y_l = lck_e3_y0 - i * 0.036
    arrow(ax, 0.65, y_l, fin_x - 0.065, fin_y0 - 0.005 - i * 0.018,
          color='#F87171', lw=1.0)


# ── LEGEND ─────────────────────────────────────────────────────────────────
leg_x = 0.015
leg_y0 = e3_b + 0.008
leg_sp = 0.015
legend_data = [
    (C.INP_BG, C.INP_BRD, 'Input Variable'),
    (C.LKP_BG, C.LKP_BRD, 'Lookup Table'),
    (C.CMP_BG, C.CMP_BRD, 'Computed Variable'),
    (C.LCK_BG, C.LCK_BRD, 'Locked Output'),
]
for i, (fc, ec, lbl) in enumerate(legend_data):
    y = leg_y0 + i * leg_sp
    rbox(ax, leg_x, y - 0.004, 0.022, 0.010, fc, ec, lw=0.6, zorder=5)
    ax.text(leg_x + 0.027, y + 0.001, lbl, fontproperties=fp_en_xs,
            color=C.LBL, ha='left', va='center', fontsize=6.5, zorder=5)

# Arrow legend
arrow_y = leg_y0 + 4 * leg_sp
arrow(ax, leg_x, arrow_y, leg_x + 0.02, arrow_y, color=C.ARROW_DK, lw=1.2)
ax.text(leg_x + 0.027, arrow_y + 0.001, 'Data flow', fontproperties=fp_en_xs,
        color=C.LBL, ha='left', va='center', fontsize=6.5, zorder=5)

arrow_dash(ax, leg_x + 0.10, arrow_y, leg_x + 0.12, arrow_y, color=C.LOCK_BRD, lw=1.0)
ax.text(leg_x + 0.127, arrow_y + 0.001, 'Locked value flow', fontproperties=fp_en_xs,
        color=C.LBL, ha='left', va='center', fontsize=6.5, zorder=5)

# Lock icon legend
draw_lock_icon(ax, leg_x + 0.265, arrow_y, size=0.003, zorder=10)
ax.text(leg_x + 0.275, arrow_y + 0.001, 'Locked / immutable', fontproperties=fp_en_xs,
        color=C.LBL, ha='left', va='center', fontsize=6.5, zorder=5)


# ── Watermark ──────────────────────────────────────────────────────────────
ax.text(0.985, 0.005, 'UDAP v3.0  |  Dependency Graph  |  Publication Quality',
        fontproperties=fp_en_xs, color='#CBD5E1', ha='right', va='bottom',
        fontsize=5.5, zorder=5)


# ── SAVE ───────────────────────────────────────────────────────────────────
plt.tight_layout(pad=0.4)
output_path = '/home/z/my-project/download/step2_dependency_graph.png'
fig.savefig(output_path, dpi=dpi, bbox_inches='tight', facecolor=C.BG,
            edgecolor='none', pad_inches=0.2)
plt.close(fig)

actual_w = int(fig_w * dpi)
actual_h = int(fig_h * dpi)
print(f"\u2705 Dependency graph saved: {output_path}")
print(f"   Dimensions: {actual_w} x {actual_h} px")
print(f"   File size: {os.path.getsize(output_path) / 1024:.0f} KB")
