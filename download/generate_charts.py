#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
منصة المدقق الديناميكي الموحد V3.0
رسومات التقرير الشامل
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

# ─── إعداد الخطوط العربية ───
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/LiberationSans-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')

# Try to find an Arabic-supporting font
ARABIC_FONT = None
for fp in fm.findSystemFonts():
    try:
        f = fm.FontProperties(fname=fp)
        name = f.get_name()
        if 'Noto' in name and 'Arabic' in name:
            ARABIC_FONT = name
            break
    except:
        pass

if not ARABIC_FONT:
    ARABIC_FONT = 'DejaVu Sans'

plt.rcParams['font.sans-serif'] = ['Noto Sans SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUTDIR = '/home/z/my-project/download/charts'
os.makedirs(OUTDIR, exist_ok=True)

# Color palette
C_PRIMARY = '#243447'
C_BG = '#F8FAFC'
C_FILL = '#E9EEF3'
C_ACCENT = '#4C6EF5'
C_ACCENT2 = '#3AAFA9'
C_WARN = '#EE7733'
C_DANGER = '#CC3311'
C_MUTED = '#94A3B8'

# ═══════════════════════════════════════════════════════════════════════
# Chart 1: Pipeline Flow — Engine Stages
# ═══════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(14, 8))
fig.patch.set_facecolor(C_BG)
ax.set_facecolor(C_BG)

stages = [
    ('Step 1-2', 'Inputs &\nLookups', C_ACCENT, 0.12),
    ('Step 3', 'Penetration\nEngine', '#5B8DEF', 0.30),
    ('Step 4', 'Thickness\nAdoption', '#7BA4F7', 0.48),
    ('Step 5', 'Blast Load\nCalculation', '#3AAFA9', 0.66),
    ('Step 6', 'B-Tables\nCoefficients', '#2D9CDB', 0.84),
]

for i, (step, label, color, ypos) in enumerate(stages):
    box = mpatches.FancyBboxPatch(
        (0.02, ypos), 0.18, 0.10,
        boxstyle="round,pad=0.01",
        facecolor=color, edgecolor='white', alpha=0.9,
        transform=ax.transAxes
    )
    ax.add_patch(box)
    ax.text(0.11, ypos + 0.05, f'{step}\n{label}',
            transform=ax.transAxes, ha='center', va='center',
            fontsize=11, fontweight='bold', color='white', family=ARABIC_FONT)
    
    if i < len(stages) - 1:
        ax.annotate('', xy=(0.11, ypos + 0.001), xytext=(0.11, stages[i+1][3] + 0.099),
                    transform=ax.transAxes,
                    arrowprops=dict(arrowstyle='->', color=C_MUTED, lw=2))

# Right side: key outputs per stage
outputs = [
    (0.35, 0.16, 'P=441kg, V=350m/s\nK1=1.639, Z=3.7m'),
    (0.35, 0.34, 'C_ef=334.77 kg\nh_pr=2.77 m, R_actual=7.62 m'),
    (0.35, 0.52, 'Hp=70.46 cm\nHc=49.82 cm, Hf=42.35 cm'),
    (0.35, 0.70, 'Pp_roof=4.92 kg/cm2\nPp_wall=3.78 kg/cm2\nomega_roof=561.7 rad/s'),
    (0.35, 0.88, 'Kpod=1.25/1.18\nKp=0.8/1.0, Kd=0.92/1.0'),
]

for x, y, text in outputs:
    ax.text(x, y, text, transform=ax.transAxes, ha='left', va='center',
            fontsize=9, color=C_PRIMARY, family='monospace',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=C_MUTED, alpha=0.8))

# Steps 7-8
for i, (step, label, color, ypos) in enumerate([
    ('Step 7', 'Ceiling Moment\n& Final h0', C_WARN, 0.66),
    ('Step 8', 'Wall Final\nLock', C_DANGER, 0.84),
]):
    box = mpatches.FancyBboxPatch(
        (0.65, ypos), 0.15, 0.10,
        boxstyle="round,pad=0.01",
        facecolor=color, edgecolor='white', alpha=0.9,
        transform=ax.transAxes
    )
    ax.add_patch(box)
    ax.text(0.725, ypos + 0.05, f'{step}\n{label}',
            transform=ax.transAxes, ha='center', va='center',
            fontsize=10, fontweight='bold', color='white', family=ARABIC_FONT)

# Final outputs
ax.text(0.88, 0.75, 'Hp=70.46 cm\nh0=67.10 cm\nMp=20M kg.cm',
        transform=ax.transAxes, ha='left', va='center',
        fontsize=9, color=C_PRIMARY, family='monospace',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=C_WARN, alpha=0.8))

ax.text(0.88, 0.93, 'Hc=49.82 cm\nHf=42.35 cm\nHvct=30 cm',
        transform=ax.transAxes, ha='left', va='center',
        fontsize=9, color=C_PRIMARY, family='monospace',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=C_DANGER, alpha=0.8))

ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
ax.set_title('Calculation Pipeline — BMK-02 (MK83 + MEDIUM_SOIL)',
             fontsize=16, fontweight='bold', color=C_PRIMARY, pad=20)

plt.tight_layout()
plt.savefig(f'{OUTDIR}/pipeline_flow.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 1: Pipeline Flow saved")

# ═══════════════════════════════════════════════════════════════════════
# Chart 2: Thickness Comparison (Bar Chart)
# ═══════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(10, 6))
fig.patch.set_facecolor(C_BG)
ax.set_facecolor('white')

components = ['Ceiling\n(Hp)', 'Wall\n(Hc)', 'Floor\n(Hf)', 'Inner Wall\n(Hvct)']
thicknesses = [70.46, 49.82, 42.35, 30.0]
colors = [C_ACCENT, C_ACCENT2, '#2D9CDB', C_MUTED]

bars = ax.bar(components, thicknesses, color=colors, width=0.6, edgecolor='white', linewidth=1.5)
for bar, val in zip(bars, thicknesses):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 1.5,
            f'{val:.2f} cm', ha='center', va='bottom', fontweight='bold',
            color=C_PRIMARY, fontsize=12)

ax.set_ylabel('Thickness (cm)', fontsize=12, color=C_PRIMARY)
ax.set_title('Final Structural Thicknesses — BMK-02', fontsize=14, fontweight='bold', color=C_PRIMARY)
ax.set_ylim(0, max(thicknesses) * 1.18)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='y', alpha=0.15, linestyle='--')

plt.tight_layout()
plt.savefig(f'{OUTDIR}/thickness_comparison.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 2: Thickness Comparison saved")

# ═══════════════════════════════════════════════════════════════════════
# Chart 3: Roof vs Wall Load Comparison (Grouped Bar)
# ═══════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(10, 6))
fig.patch.set_facecolor(C_BG)
ax.set_facecolor('white')

load_types = ['Pmax\n(Max Pressure)', 'P_ekv\n(Equiv. Pressure)', 'Pp\n(Design Load)', 'Pct\n(Static Comp.)']
roof_vals = [4.608, 3.816, 4.921, 1.105]
wall_vals = [6.286, 3.083, 3.785, 0.702]

x = np.arange(len(load_types))
width = 0.35

bars1 = ax.bar(x - width/2, roof_vals, width, label='Roof Path', color=C_ACCENT, edgecolor='white')
bars2 = ax.bar(x + width/2, wall_vals, width, label='Wall Path', color=C_ACCENT2, edgecolor='white')

for bar in bars1:
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.08,
            f'{bar.get_height():.3f}', ha='center', va='bottom', fontsize=9, color=C_ACCENT)
for bar in bars2:
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.08,
            f'{bar.get_height():.3f}', ha='center', va='bottom', fontsize=9, color=C_ACCENT2)

ax.set_ylabel('Pressure (kg/cm2)', fontsize=12, color=C_PRIMARY)
ax.set_title('Roof vs Wall — Blast Load Comparison', fontsize=14, fontweight='bold', color=C_PRIMARY)
ax.set_xticks(x)
ax.set_xticklabels(load_types)
ax.legend(loc='best', frameon=False)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='y', alpha=0.15, linestyle='--')
ax.set_ylim(0, max(max(roof_vals), max(wall_vals)) * 1.18)

plt.tight_layout()
plt.savefig(f'{OUTDIR}/load_comparison.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 3: Load Comparison saved")

# ═══════════════════════════════════════════════════════════════════════
# Chart 4: Dynamic Parameters (omega, tau_ef) — Roof vs Wall
# ═══════════════════════════════════════════════════════════════════════

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
fig.patch.set_facecolor(C_BG)

# Omega
ax1.set_facecolor('white')
params = ['omega\n(rad/s)', 'C_dyn']
roof_p = [561.67, 46.81]
wall_p = [1024.05, 72.08]

x = np.arange(len(params))
bars1 = ax1.bar(x - 0.2, roof_p, 0.35, label='Roof', color=C_ACCENT, edgecolor='white')
bars2 = ax1.bar(x + 0.2, wall_p, 0.35, label='Wall', color=C_ACCENT2, edgecolor='white')
for bar in bars1:
    ax1.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 10,
             f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=9, color=C_ACCENT)
for bar in bars2:
    ax1.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 10,
             f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=9, color=C_ACCENT2)

ax1.set_title('Dynamic Frequency & Speed', fontsize=12, fontweight='bold', color=C_PRIMARY)
ax1.set_xticks(x)
ax1.set_xticklabels(params)
ax1.legend(loc='best', frameon=False)
ax1.spines['top'].set_visible(False)
ax1.spines['right'].set_visible(False)
ax1.grid(axis='y', alpha=0.15, linestyle='--')

# tau_ef
ax2.set_facecolor('white')
times = ['tau\n(s)', 'tau_ef\n(s)', 'tau_n\n(s)']
roof_t = [0.265, 0.238, 0.036]
wall_t = [0.068, 0.061, 0.011]

x2 = np.arange(len(times))
bars3 = ax2.bar(x2 - 0.2, roof_t, 0.35, label='Roof', color=C_ACCENT, edgecolor='white')
bars4 = ax2.bar(x2 + 0.2, wall_t, 0.35, label='Wall', color=C_ACCENT2, edgecolor='white')
for bar in bars3:
    ax2.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.003,
             f'{bar.get_height():.4f}', ha='center', va='bottom', fontsize=8, color=C_ACCENT)
for bar in bars4:
    ax2.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.003,
             f'{bar.get_height():.4f}', ha='center', va='bottom', fontsize=8, color=C_ACCENT2)

ax2.set_title('Time Parameters', fontsize=12, fontweight='bold', color=C_PRIMARY)
ax2.set_xticks(x2)
ax2.set_xticklabels(times)
ax2.legend(loc='best', frameon=False)
ax2.spines['top'].set_visible(False)
ax2.spines['right'].set_visible(False)
ax2.grid(axis='y', alpha=0.15, linestyle='--')

plt.tight_layout()
plt.savefig(f'{OUTDIR}/dynamic_params.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 4: Dynamic Parameters saved")

# ═══════════════════════════════════════════════════════════════════════
# Chart 5: B-Table Coefficients Comparison
# ═══════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(10, 6))
fig.patch.set_facecolor(C_BG)
ax.set_facecolor('white')

tables = ['B-1\nR_bar_b1', 'B-2\nmu', 'B-2\neta', 'B-2\nKt', 'B-3\na0z', 'B-3\na1z', 'B-4\nKpod', 'B-5\nKp', 'B-6\nKd']
roof_b = [0.35, 0.025, 0.015, 1.0, 180, 80, 1.25, 0.8, 0.92]
wall_b = [0.90, 0.009, 0.001, 1.1, 580, 290, 1.18, 1.0, 1.0]

# Normalize for display (some values are vastly different scales)
# Use log scale for a0z, a1z
roof_display = roof_b.copy()
wall_display = wall_b.copy()

x = np.arange(len(tables))
width = 0.35

bars1 = ax.bar(x - width/2, roof_display, width, label='Roof', color=C_ACCENT, edgecolor='white', alpha=0.85)
bars2 = ax.bar(x + width/2, wall_display, width, label='Wall', color=C_ACCENT2, edgecolor='white', alpha=0.85)

# Add value labels
for i, (r, w) in enumerate(zip(roof_display, wall_display)):
    ax.text(i - width/2, max(r, w) + max(r, w)*0.03, f'{r}', ha='center', va='bottom', fontsize=7, color=C_ACCENT, rotation=45)
    ax.text(i + width/2, max(r, w) + max(r, w)*0.03 + max(r, w)*0.05, f'{w}', ha='center', va='bottom', fontsize=7, color=C_ACCENT2, rotation=45)

ax.set_title('B-Table Coefficients — Roof vs Wall', fontsize=14, fontweight='bold', color=C_PRIMARY)
ax.set_xticks(x)
ax.set_xticklabels(tables, fontsize=8)
ax.legend(loc='best', frameon=False)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='y', alpha=0.15, linestyle='--')
ax.set_yscale('log')
ax.set_ylabel('Value (log scale)', fontsize=10, color=C_PRIMARY)

plt.tight_layout()
plt.savefig(f'{OUTDIR}/b_table_coefficients.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 5: B-Table Coefficients saved")

# ═══════════════════════════════════════════════════════════════════════
# Chart 6: Cross-Section Visualization
# ═══════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor(C_BG)
ax.set_facecolor('white')

# Tunnel cross section (simplified rectangular)
# Scale: 1 unit = 10 cm for thickness, meters for spans
scale = 100  # cm per m

# Outer dimensions
outer_w = 5.0 * scale  # bp = 5m in cm
outer_h = 4.0 * scale  # ap = 4m

# Thicknesses
Hp = 70.46
Hc = 49.82
Hf = 42.35
Hvct = 30.0

# Draw outer rectangle (soil boundary)
outer = mpatches.Rectangle((-Hc, -Hf), outer_w + 2*Hc, outer_h + Hp + Hf,
                            facecolor='#E8D5B7', edgecolor='#8B7355', linewidth=2, alpha=0.5)
ax.add_patch(outer)

# Ceiling slab
ceiling = mpatches.Rectangle((0, outer_h), outer_w, Hp,
                              facecolor='#B8D4E3', edgecolor=C_ACCENT, linewidth=2)
ax.add_patch(ceiling)

# Floor slab
floor = mpatches.Rectangle((0, -Hf), outer_w, Hf,
                            facecolor='#B8D4E3', edgecolor=C_ACCENT, linewidth=2)
ax.add_patch(floor)

# Left wall
lwall = mpatches.Rectangle((-Hc, 0), Hc, outer_h,
                            facecolor='#C3E6CB', edgecolor=C_ACCENT2, linewidth=2)
ax.add_patch(lwall)

# Right wall
rwall = mpatches.Rectangle((outer_w, 0), Hc, outer_h,
                            facecolor='#C3E6CB', edgecolor=C_ACCENT2, linewidth=2)
ax.add_patch(rwall)

# Inner wall (if present)
inner_wall_x = outer_w / 2 - 1.5 * scale / 2  # approximate position
iwall = mpatches.Rectangle((outer_w/2 - 15, 0), Hvct, outer_h,
                            facecolor='#FFE0B2', edgecolor=C_WARN, linewidth=1.5)
ax.add_patch(iwall)

# Tunnel space
tunnel = mpatches.Rectangle((0, 0), outer_w, outer_h,
                              facecolor='white', edgecolor='#333', linewidth=1.5)
ax.add_patch(tunnel)

# Dimension annotations
def dim_line(ax, x1, y1, x2, y2, text, offset=15, color=C_PRIMARY):
    ax.annotate('', xy=(x2, y2+offset), xytext=(x1, y1+offset),
                arrowprops=dict(arrowstyle='<->', color=color, lw=1.5))
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2 + offset + 8
    ax.text(mid_x, mid_y, text, ha='center', va='bottom', fontsize=9,
            fontweight='bold', color=color)

# Ceiling thickness
dim_line(ax, outer_w/2, outer_h, outer_w/2, outer_h + Hp, f'Hp={Hp:.1f}cm', offset=10)

# Floor thickness
dim_line(ax, outer_w/2, 0, outer_w/2, -Hf, f'Hf={Hf:.1f}cm', offset=10)

# Wall thickness
dim_line(ax, -Hc, outer_h/2, 0, outer_h/2, f'Hc={Hc:.1f}cm', offset=10)

# Tunnel span
ax.annotate('', xy=(0, -Hf-25), xytext=(outer_w, -Hf-25),
            arrowprops=dict(arrowstyle='<->', color=C_PRIMARY, lw=1.5))
ax.text(outer_w/2, -Hf-20, f'bp={500:.0f}cm (5.0m)', ha='center', fontsize=9,
        fontweight='bold', color=C_PRIMARY)

# Labels
ax.text(outer_w/2, outer_h/2, 'TUNNEL\nSPACE\n4.0m x 5.0m',
        ha='center', va='center', fontsize=14, fontweight='bold',
        color=C_MUTED, alpha=0.6)

ax.text(outer_w/2, outer_h + Hp/2, 'CEILING SLAB',
        ha='center', va='center', fontsize=10, fontweight='bold', color=C_ACCENT)

ax.text(-Hc/2, outer_h/2, 'WALL', ha='center', va='center',
        fontsize=9, fontweight='bold', color=C_ACCENT2, rotation=90)

# Explosion point
ax.plot(-Hc/2, outer_h + Hp + 30, '*', markersize=20, color=C_DANGER)
ax.text(-Hc/2, outer_h + Hp + 45, 'Explosion\nPoint', ha='center', fontsize=9,
        color=C_DANGER, fontweight='bold')

ax.set_xlim(-120, outer_w + 120)
ax.set_ylim(-100, outer_h + Hp + 70)
ax.set_aspect('equal')
ax.axis('off')
ax.set_title('Tunnel Cross-Section — Final Design (BMK-02)',
             fontsize=14, fontweight='bold', color=C_PRIMARY, pad=20)

plt.tight_layout()
plt.savefig(f'{OUTDIR}/cross_section.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 6: Cross Section saved")

# ═══════════════════════════════════════════════════════════════════════
# Chart 7: Verification Status (Gauge-like)
# ═══════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(10, 5))
fig.patch.set_facecolor(C_BG)
ax.set_facecolor('white')

params_v = ['C_ef', 'lambda1', 'lambda2', 'h_pr', 'R_actual', 'Zp',
            'Hp', 'Hc', 'Hf', 'Pp_roof', 'Pp_wall', 'omega_roof', 'omega_wall']
deviations = [0.0, 0.0, 0.0, 0.01, 15.11, 83.99, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
statuses = ['PASS' if d < 5 else 'WARN' if d < 10 else 'FAIL' for d in deviations]
status_colors = ['#10B981' if s == 'PASS' else '#F59E0B' if s == 'WARN' else '#EF4444' for s in statuses]

x = np.arange(len(params_v))
bars = ax.bar(x, deviations, color=status_colors, width=0.6, edgecolor='white', linewidth=1.5)

# Add threshold lines
ax.axhline(y=5, color='#F59E0B', linestyle='--', linewidth=1.5, alpha=0.7, label='5% Warning')
ax.axhline(y=10, color='#EF4444', linestyle='--', linewidth=1.5, alpha=0.7, label='10% Fail')

for i, (bar, dev, status) in enumerate(zip(bars, deviations, statuses)):
    label = f'{dev:.1f}%' if dev < 100 else f'{dev:.0f}%'
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 1,
            label, ha='center', va='bottom', fontsize=8, fontweight='bold',
            color=status_colors[i])

ax.set_xticks(x)
ax.set_xticklabels(params_v, fontsize=8, rotation=45, ha='right')
ax.set_ylabel('Deviation from Reference (%)', fontsize=11, color=C_PRIMARY)
ax.set_title('Verification Status — Calculated vs Reference (BMK-02)',
             fontsize=13, fontweight='bold', color=C_PRIMARY)
ax.legend(loc='best', frameon=False)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='y', alpha=0.15, linestyle='--')
ax.set_ylim(0, min(max(deviations) * 1.2, 100))

plt.tight_layout()
plt.savefig(f'{OUTDIR}/verification_status.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 7: Verification Status saved")

# ═══════════════════════════════════════════════════════════════════════
# Chart 8: Penetration Depth Profile
# ═══════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(10, 7))
fig.patch.set_facecolor(C_BG)
ax.set_facecolor('white')

# Soil layers
soil_top = 0
ground_surface = 0
ceiling_top = -3.7  # Z = 3.7m below surface
ceiling_bot = ceiling_top - 0.7046  # Hp = 70.46 cm
tunnel_floor = ceiling_bot - 4.0  # ap = 4m

# Draw soil
ax.axhspan(ground_surface, ceiling_top, facecolor='#E8D5B7', alpha=0.6, label='Soil (MEDIUM_SOIL)')
ax.axhspan(ceiling_top, ceiling_bot, facecolor='#B8D4E3', alpha=0.8, label=f'Ceiling Slab (Hp={70.46:.1f}cm)')
ax.axhspan(ceiling_bot, tunnel_floor, facecolor='white', alpha=0.5, label='Tunnel Space')

# Penetration depth
h_pr_ref = 2.7717  # corrected reference
penetration_line = ground_surface - h_pr_ref

ax.plot([0, 0], [ground_surface, penetration_line], color=C_DANGER, linewidth=3, zorder=5)
ax.plot(0, penetration_line, 'v', markersize=15, color=C_DANGER, zorder=6)
ax.text(0.15, penetration_line - 0.1, f'h_pr = {h_pr_ref:.3f} m\n(Penetration Depth)',
        fontsize=10, color=C_DANGER, fontweight='bold')

# Explosion point (at penetration depth)
ax.plot(0, penetration_line, '*', markersize=20, color=C_DANGER, zorder=7)
ax.text(-0.8, penetration_line + 0.3, 'Explosion\nPoint', fontsize=9, color=C_DANGER, fontweight='bold', ha='center')

# Radial distance
ax.annotate('', xy=(1.5, ceiling_top), xytext=(0, penetration_line),
            arrowprops=dict(arrowstyle='->', color=C_WARN, lw=2, connectionstyle='arc3,rad=0.2'))
ax.text(1.8, (ceiling_top + penetration_line)/2, f'R_actual = 7.623 m',
        fontsize=10, color=C_WARN, fontweight='bold')

# Surface line
ax.axhline(y=ground_surface, color='#333', linewidth=2)
ax.text(-2, ground_surface + 0.1, 'Ground Surface', fontsize=10, fontweight='bold', color='#333')

ax.set_xlim(-2.5, 4)
ax.set_ylim(tunnel_floor - 0.5, 0.8)
ax.set_ylabel('Depth (m)', fontsize=12, color=C_PRIMARY)
ax.set_title('Penetration Profile — MK83 in MEDIUM_SOIL',
             fontsize=14, fontweight='bold', color=C_PRIMARY)
ax.legend(loc='lower right', frameon=False)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='y', alpha=0.15, linestyle='--')

plt.tight_layout()
plt.savefig(f'{OUTDIR}/penetration_profile.png', dpi=200, bbox_inches='tight', facecolor=C_BG)
plt.close()
print("Chart 8: Penetration Profile saved")

print("\n=== All charts generated successfully ===")
