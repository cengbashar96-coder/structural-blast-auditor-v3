// ═══════════════════════════════════════════════════════════════════════
// مكونات الرسم الهندسي الاحترافي — Cross-Section SVG
// منصة المدقق الديناميكي الموحد V3.1
// مقطع عرضي للنفق/المقر مع وضع النتائج على الرسم
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import type { GeometryType, SectionDesignResult } from '@/lib/engine/types';
import type { UserInputForm } from '@/lib/engine/engine-context';

interface CrossSectionProps {
  geometryType: GeometryType;
  userInput: UserInputForm;
  structural: SectionDesignResult;
  isRecommended?: boolean;
  pDesignMpa?: number;
  penetrationDepth?: number;
}

const C = {
  soil: '#6B4226', soilDark: '#4A2E1A',
  concrete: '#94A3B8', concreteFill: '#475569',
  steel: '#F59E0B', interior: '#0F172A',
  sky: '#1E3A5F', blast: '#EF4444', blastWave: '#F97316',
  dim: '#06B6D4', result: '#10B981', label: '#CBD5E1',
  conceal: '#854D0E',
};

function fmt(v: number, d = 2): string { return isFinite(v) ? v.toFixed(d) : '—'; }

export function CrossSectionSVG({
  geometryType, userInput, structural, isRecommended, pDesignMpa, penetrationDepth,
}: CrossSectionProps) {
  const sc = 60;
  const Hp = structural.requiredThicknessMeters;
  const Hct = userInput.initialWallThickness / 100;
  const Hf = userInput.initialFloorThickness / 100;
  const ap = userInput.shortSpan;
  const a_et = userInput.ceilingHeight;
  const Z = userInput.facilityDepth;
  const h_obs = userInput.concealmentThickness;

  const cx = 250, groundY = 80, topY = groundY + Z * sc * 0.3;
  const wallPx = Math.max(Hct * sc, 8);
  const ceilingPx = Math.max(Hp * sc, 10);
  const floorPx = Math.max(Hf * sc, 6);
  const iW = Math.max(ap * sc, 80);
  const iH = Math.max(a_et * sc, 60);

  const lW = cx - iW / 2, rW = cx + iW / 2;
  const cT = topY, cB = topY + ceilingPx;
  const fT = cB + iH, fB = fT + floorPx;
  const gLabel = geometryType === 'RECTANGULAR' ? 'مستطيل' : geometryType === 'CIRCULAR' ? 'دائري' : 'قوسي';

  return (
    <svg viewBox="0 0 500 460" className="w-full h-auto" style={{ direction: 'ltr' }}>
      <defs>
        <pattern id="soilP" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={C.soilDark} />
          <circle cx="3" cy="3" r="0.8" fill={C.soil} opacity="0.5" />
          <circle cx="9" cy="9" r="0.6" fill={C.soil} opacity="0.4" />
        </pattern>
        <pattern id="concP" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={C.concreteFill} />
          <circle cx="2" cy="2" r="0.4" fill="#64748B" opacity="0.6" />
          <circle cx="6" cy="6" r="0.3" fill="#64748B" opacity="0.5" />
        </pattern>
        <radialGradient id="blastG" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={C.blast} stopOpacity="0.9" />
          <stop offset="40%" stopColor={C.blastWave} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.blastWave} stopOpacity="0" />
        </radialGradient>
        <filter id="ts" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="500" height={groundY} fill={C.sky} opacity="0.3" />
      <line x1="0" y1={groundY} x2="500" y2={groundY} stroke="#92400E" strokeWidth="2" />
      {/* Ground surface label */}
      <text x="470" y={groundY - 5} textAnchor="end" fill="#92400E" fontSize="7" fontWeight="bold">سطح الأرض</text>

      {/* Soil */}
      <rect x="0" y={groundY} width="500" height="460" fill="url(#soilP)" />

      {/* Concealment layer */}
      {h_obs > 0 && (
        <rect x={lW - wallPx - 10} y={groundY} width={iW + wallPx * 2 + 20} height={Math.max(h_obs * sc * 0.3, 4)} fill={C.conceal} opacity="0.6" rx="1" />
      )}

      {/* Blast waves */}
      {pDesignMpa !== undefined && pDesignMpa > 0 && (
        <g>
          <circle cx={cx} cy={cT - 15} r="18" fill="url(#blastG)" />
          <text x={cx} y={cT - 14} textAnchor="middle" fill={C.blast} fontSize="8" fontWeight="bold" filter="url(#ts)">💥</text>
          <ellipse cx={cx} cy={cT - 5} rx="40" ry="6" fill="none" stroke={C.blastWave} strokeWidth="0.8" opacity="0.6" strokeDasharray="3,2" />
          <ellipse cx={cx} cy={cT} rx="55" ry="8" fill="none" stroke={C.blastWave} strokeWidth="0.6" opacity="0.4" strokeDasharray="4,3" />
          <ellipse cx={cx} cy={cT + 3} rx="70" ry="10" fill="none" stroke={C.blastWave} strokeWidth="0.4" opacity="0.25" strokeDasharray="5,4" />
          <line x1={cx - 30} y1={cT - 8} x2={cx - 15} y2={cT + 2} stroke={C.blastWave} strokeWidth="1" opacity="0.7" />
          <line x1={cx} y1={cT - 10} x2={cx} y2={cT + 2} stroke={C.blastWave} strokeWidth="1" opacity="0.7" />
          <line x1={cx + 30} y1={cT - 8} x2={cx + 15} y2={cT + 2} stroke={C.blastWave} strokeWidth="1" opacity="0.7" />
          <rect x={cx + 42} y={cT - 14} width={55} height="12" rx="2" fill="#0F172A" opacity="0.8" />
          <text x={cx + 70} y={cT - 6} textAnchor="middle" fill={C.blast} fontSize="8" fontWeight="bold" filter="url(#ts)">P = {fmt(pDesignMpa, 3)} MPa</text>
        </g>
      )}

      {/* Cross section by type */}
      {geometryType === 'RECTANGULAR' && rectSection(cx, lW, rW, cT, cB, fT, fB, wallPx, ceilingPx, floorPx, iW, iH)}
      {geometryType === 'CIRCULAR' && circSection(cx, cT, cB, fT, fB, wallPx, ceilingPx, floorPx, iW, iH)}
      {geometryType === 'ARCHED' && archSection(cx, lW, rW, cT, cB, fT, fB, wallPx, ceilingPx, floorPx, iW, iH)}

      {/* Rebar */}
      {rebarLines(lW, rW, cB, fT, wallPx, structural.requiredSteelAreaCm2PerMeter)}

      {/* Dimensions */}
      <DimLine x1={rW + wallPx + 8} y1={cT} x2={rW + wallPx + 8} y2={cB} label={`Hp = ${fmt(Hp * 100, 1)} cm`} side="right" color={C.result} highlight />
      <DimLine x1={lW} y1={fB + 14} x2={lW + wallPx} y2={fB + 14} label={`Hct = ${fmt(Hct * 100, 1)} cm`} side="bottom" />
      <DimLine x1={rW + wallPx + 8} y1={fT} x2={rW + wallPx + 8} y2={fB} label={`Hf = ${fmt(Hf * 100, 1)} cm`} side="right" />
      <DimLine x1={lW} y1={cB - 8} x2={rW} y2={cB - 8} label={`aₚ = ${fmt(ap, 1)} m`} side="top" />
      <DimLine x1={30} y1={groundY} x2={30} y2={cT} label={`Z = ${fmt(Z, 1)} m`} side="left" color={C.result} highlight />

      {/* Penetration depth */}
      {penetrationDepth !== undefined && penetrationDepth > 0 && (
        <g>
          <line x1={cx} y1={groundY - 20} x2={cx} y2={groundY + penetrationDepth * sc * 0.3} stroke={C.blast} strokeWidth="1.5" strokeDasharray="6,3" />
          <polygon points={`${cx - 4},${groundY - 20} ${cx + 4},${groundY - 20} ${cx},${groundY - 10}`} fill={C.blast} />
          <rect x={cx + 10} y={groundY + 4} width={75} height="12" rx="2" fill="#0F172A" opacity="0.85" />
          <text x={cx + 47} y={groundY + 12} textAnchor="middle" fill={C.blast} fontSize="8" filter="url(#ts)">hпр = {fmt(penetrationDepth, 2)} m</text>
        </g>
      )}

      {/* Material properties label */}
      <rect x={lW - wallPx - 60} y={cB + iH / 2 - 20} width="55" height="38" rx="3" fill="#0F172A" opacity="0.9" stroke="#334155" strokeWidth="0.5" />
      <text x={lW - wallPx - 33} y={cB + iH / 2 - 8} textAnchor="middle" fill="#94A3B8" fontSize="6" fontWeight="bold">المواد</text>
      <text x={lW - wallPx - 33} y={cB + iH / 2 + 2} textAnchor="middle" fill={C.steel} fontSize="7" fontWeight="bold">f'c = {fmt(userInput.fcMpa, 0)} MPa</text>
      <text x={lW - wallPx - 33} y={cB + iH / 2 + 12} textAnchor="middle" fill="#38BDF8" fontSize="7" fontWeight="bold">fy = {fmt(userInput.fyMpa, 0)} MPa</text>

      {/* Steel area label */}
      <rect x={cx - 45} y={cB + iH / 2 - 8} width="90" height="22" rx="3" fill="#0F172A" opacity="0.85" />
      <text x={cx} y={cB + iH / 2} textAnchor="middle" fill={C.steel} fontSize="8" fontWeight="bold" filter="url(#ts)">As = {fmt(structural.requiredSteelAreaCm2PerMeter, 2)} cm²/m</text>
      <text x={cx} y={cB + iH / 2 + 10} textAnchor="middle" fill={C.label} fontSize="7" filter="url(#ts)">μ = {fmt(structural.ductilityRatio, 3)}</text>

      {/* Recommended badge */}
      {isRecommended && (
        <g><rect x={cx - 35} y={cT - 30} width="70" height="16" rx="4" fill="#059669" /><text x={cx} y={cT - 19} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">✦ موصى به</text></g>
      )}

      {/* Title */}
      <text x={cx} y="20" textAnchor="middle" fill={C.label} fontSize="11" fontWeight="bold">المقطع العرضي — {gLabel}</text>
      <text x={cx} y="33" textAnchor="middle" fill="#64748B" fontSize="8">مقطع {gLabel} بتسليح محسوب</text>

      {/* Legend */}
      <g transform="translate(10, 380)">
        <rect x="0" y="0" width="480" height="65" rx="6" fill="#0F172A" stroke="#334155" strokeWidth="0.5" />
        <text x="240" y="14" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">مفتاح الرسم</text>
        <rect x="15" y="22" width="14" height="10" fill="url(#soilP)" rx="1" /><text x="35" y="30" fill="#94A3B8" fontSize="7">تربة</text>
        <rect x="80" y="22" width="14" height="10" fill="url(#concP)" rx="1" /><text x="100" y="30" fill="#94A3B8" fontSize="7">خرسانة</text>
        <line x1="160" y1="27" x2="174" y2="27" stroke={C.steel} strokeWidth="2" /><text x="180" y="30" fill="#94A3B8" fontSize="7">تسليح</text>
        <circle cx="240" cy="27" r="5" fill="url(#blastG)" /><text x="250" y="30" fill="#94A3B8" fontSize="7">انفجار</text>
        <line x1="310" y1="27" x2="324" y2="27" stroke={C.blast} strokeWidth="1.5" strokeDasharray="4,2" /><text x="330" y="30" fill="#94A3B8" fontSize="7">مسار القنبلة</text>
        <line x1="15" y1="48" x2="35" y2="48" stroke={C.dim} strokeWidth="1" /><text x="40" y="51" fill="#94A3B8" fontSize="7">أبعاد</text>
        <line x1="100" y1="48" x2="120" y2="48" stroke={C.result} strokeWidth="2" /><text x="125" y="51" fill="#94A3B8" fontSize="7">نتائج محسوبة</text>
        <rect x="210" y="42" width="14" height="10" fill={C.conceal} opacity="0.6" rx="1" /><text x="230" y="51" fill="#94A3B8" fontSize="7">طبقة تمويه</text>
        <rect x="310" y="42" width="14" height="10" fill={C.interior} rx="1" /><text x="330" y="51" fill="#94A3B8" fontSize="7">فراغ داخلي</text>
        <line x1="400" y1="48" x2="414" y2="48" stroke={C.blastWave} strokeWidth="0.8" strokeDasharray="3,2" /><text x="420" y="51" fill="#94A3B8" fontSize="7">موجة ضغط</text>
      </g>
    </svg>
  );
}

// ─── مقطع مستطيل ───
function rectSection(cx: number, lW: number, rW: number, cT: number, cB: number, fT: number, fB: number, wP: number, cP: number, fP: number, iW: number, iH: number) {
  return <g>
    <rect x={lW} y={cT} width={iW} height={cP} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <rect x={lW - wP} y={cT} width={wP} height={cP + iH + fP} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <rect x={rW} y={cT} width={wP} height={cP + iH + fP} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <rect x={lW} y={fT} width={iW} height={fP} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <rect x={lW + 1} y={cB} width={iW - 2} height={iH} fill={C.interior} />
  </g>;
}

// ─── مقطع دائري ───
function circSection(cx: number, cT: number, cB: number, fT: number, fB: number, wP: number, cP: number, fP: number, iW: number, iH: number) {
  const rx = iW / 2 + wP, ry = iH / 2 + cP / 2 + wP;
  const cy = cT + ry;
  return <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <ellipse cx={cx} cy={cy} rx={iW / 2} ry={iH / 2} fill={C.interior} />
  </g>;
}

// ─── مقطع قوسي ───
function archSection(cx: number, lW: number, rW: number, cT: number, cB: number, fT: number, fB: number, wP: number, cP: number, fP: number, iW: number, iH: number) {
  const aRx = iW / 2, aRy = iH * 0.4;
  return <g>
    <rect x={lW - wP} y={cT + aRy} width={wP} height={iH - aRy + fP + cP * 0.3} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <rect x={rW} y={cT + aRy} width={wP} height={iH - aRy + fP + cP * 0.3} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <rect x={lW} y={fT} width={iW} height={fP} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <path d={`M ${lW - wP} ${cT + aRy + cP * 0.3} A ${aRx + wP} ${aRy + cP} 0 0 1 ${rW + wP} ${cT + aRy + cP * 0.3} L ${rW} ${cT + aRy} A ${aRx} ${aRy} 0 0 0 ${lW} ${cT + aRy} Z`} fill="url(#concP)" stroke="#64748B" strokeWidth="1" />
    <rect x={lW + 1} y={cT + aRy} width={iW - 2} height={iH - aRy} fill={C.interior} />
    <path d={`M ${lW} ${cT + aRy} A ${aRx} ${aRy} 0 0 1 ${rW} ${cT + aRy} Z`} fill={C.interior} />
  </g>;
}

// ─── خطوط التسليح — تعكس كمية الحديد المحسوبة ───
function rebarLines(lW: number, rW: number, cB: number, fT: number, wP: number, AsCm2?: number) {
  const lines = [];
  // حساب تقريبي لعدد القضبان من مساحة التسليح
  // As = n × π × d² / 4 → n ≈ As / (π × d² / 4)
  // نفترض قطر 16mm كقطر شائع → مساحة القضيب = 2.01 cm²
  const barArea = 2.01; // Φ16
  const barCount = AsCm2 ? Math.max(Math.ceil(AsCm2 / barArea), 3) : 5;
  const spacing = (rW - lW - 4) / barCount;
  const barR = Math.min(Math.max(1.5, 3 - barCount * 0.1), 3);

  // تسليح سقف (أعلى — أسفل الخرسانة مباشرة)
  for (let i = 0; i < barCount; i++) {
    const x = lW + 2 + spacing * (i + 0.5);
    lines.push(<circle key={`cb${i}`} cx={x} cy={cB - 4} r={barR} fill={C.steel} fillOpacity="0.9" stroke="#B45309" strokeWidth="0.5" />);
  }

  // تسليح جدران (جانبي)
  const wallBarCount = Math.max(Math.ceil(barCount * 0.6), 2);
  const wallSpacing = (fT - cB) / (wallBarCount + 1);
  for (let i = 1; i <= wallBarCount; i++) {
    const y = cB + wallSpacing * i;
    lines.push(<circle key={`lw${i}`} cx={lW + 3} cy={y} r={barR * 0.8} fill={C.steel} fillOpacity="0.7" stroke="#B45309" strokeWidth="0.4" />);
    lines.push(<circle key={`rw${i}`} cx={rW - 3} cy={y} r={barR * 0.8} fill={C.steel} fillOpacity="0.7" stroke="#B45309" strokeWidth="0.4" />);
  }

  // تسليح أرضية
  for (let i = 0; i < barCount; i++) {
    const x = lW + 2 + spacing * (i + 0.5);
    lines.push(<circle key={`fb${i}`} cx={x} cy={fT + 4} r={barR} fill={C.steel} fillOpacity="0.9" stroke="#B45309" strokeWidth="0.5" />);
  }

  return <g>{lines}</g>;
}

// ─── خط البُعد ───
interface DimProps { x1: number; y1: number; x2: number; y2: number; label: string; side: 'left' | 'right' | 'top' | 'bottom'; color?: string; highlight?: boolean }
function DimLine({ x1, y1, x2, y2, label, side, color = C.dim, highlight = false }: DimProps) {
  const v = side === 'left' || side === 'right';
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const off = highlight ? 12 : 8;
  const tx = v ? (side === 'right' ? x1 + off : x1 - off) : mx;
  const ty = v ? my : (side === 'top' ? y1 - 4 : y1 + 10);
  return <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={highlight ? 1.5 : 1} strokeDasharray={highlight ? 'none' : '2,1'} />
    {v ? <><line x1={x1 - 3} y1={y1} x2={x1 + 3} y2={y1} stroke={color} strokeWidth="0.8" /><line x1={x1 - 3} y1={y2} x2={x1 + 3} y2={y2} stroke={color} strokeWidth="0.8" /></>
      : <><line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + 3} stroke={color} strokeWidth="0.8" /><line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + 3} stroke={color} strokeWidth="0.8" /></>}
    <rect x={tx - (v ? 30 : label.length * 2.5)} y={ty - (v ? 4 : 7)} width={v ? 60 : label.length * 5} height={v ? 10 : 9} rx="2" fill="#0F172A" opacity="0.85" />
    <text x={tx} y={ty + (v ? 3 : 0)} textAnchor={v ? (side === 'left' ? 'end' : 'start') : 'middle'} fill={color} fontSize={highlight ? 9 : 7} fontWeight={highlight ? 'bold' : 'normal'} fontFamily="monospace">{label}</text>
  </g>;
}
