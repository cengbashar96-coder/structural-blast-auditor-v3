// ═══════════════════════════════════════════════════════════════════════
// الرسم الطولي — Longitudinal Section SVG
// منصة المدقق الديناميكي الموحد V3.1
// مقطع طولي يوضح موضع الانفجار وعمق المنشأة والتربة
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import type { UserInputForm } from '@/lib/engine/engine-context';

interface LongitudinalSectionProps {
  userInput: UserInputForm;
  penetrationDepth: number;
  blastRadius: number;
  pDesignMpa: number;
}

const C = {
  soil: '#6B4226', soilDark: '#4A2E1A',
  concrete: '#475569', steel: '#F59E0B', interior: '#0F172A',
  sky: '#1E3A5F', blast: '#EF4444', wave: '#F97316',
  dim: '#06B6D4', result: '#10B981', label: '#CBD5E1',
  conceal: '#854D0E', grass: '#166534',
};

function fmt(v: number, d = 2): string { return isFinite(v) ? v.toFixed(d) : '—'; }

export function LongitudinalSectionSVG({ userInput, penetrationDepth, blastRadius, pDesignMpa }: LongitudinalSectionProps) {
  const Z = userInput.facilityDepth;
  const Lk = userInput.facilityLength;
  const Bk = userInput.facilityWidth;
  const a_et = userInput.ceilingHeight;
  const Hp = userInput.initialCeilingThickness / 100;
  const Hf = userInput.initialFloorThickness / 100;
  const h_obs = userInput.concealmentThickness;

  // إحداثيات الرسم
  const margin = 40;
  const groundY = 70;
  const sc = 3; // مقياس الرسم (بكسل/متر)
  const tunnelLen = Math.min(Lk * sc, 380);
  const tunnelH = Math.max(a_et * 15, 50);
  const ceilH = Math.max(Hp * 15, 6);
  const floorH = Math.max(Hf * 15, 4);
  const depthPx = Math.max(Z * 8, 20);

  const startX = margin + 20;
  const endX = startX + tunnelLen;
  const cx = (startX + endX) / 2;
  const structureTop = groundY + depthPx;
  const ceilBot = structureTop + ceilH;
  const floorTop = ceilBot + tunnelH;
  const floorBot = floorTop + floorH;

  // موضع الانفجار — أعلى منتصف المنشأة
  const blastX = cx;
  const blastY = groundY - 10;

  return (
    <svg viewBox="0 0 500 340" className="w-full h-auto" style={{ direction: 'ltr' }}>
      <defs>
        <pattern id="LSsoil" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={C.soilDark} />
          <circle cx="3" cy="3" r="0.8" fill={C.soil} opacity="0.5" />
          <circle cx="9" cy="9" r="0.6" fill={C.soil} opacity="0.4" />
        </pattern>
        <pattern id="LSconc" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={C.concrete} />
          <circle cx="2" cy="2" r="0.4" fill="#64748B" opacity="0.6" />
        </pattern>
        <radialGradient id="LSblast" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={C.blast} stopOpacity="0.9" />
          <stop offset="50%" stopColor={C.wave} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.wave} stopOpacity="0" />
        </radialGradient>
        <filter id="LSts"><feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.8" /></filter>
      </defs>

      {/* السماء */}
      <rect x="0" y="0" width="500" height={groundY} fill={C.sky} opacity="0.2" />

      {/* أعشاب سطحية */}
      <path d={`M0,${groundY} Q20,${groundY - 3} 40,${groundY} Q60,${groundY - 2} 80,${groundY} Q100,${groundY - 4} 120,${groundY} Q140,${groundY - 1} 160,${groundY} Q180,${groundY - 3} 200,${groundY} Q220,${groundY - 2} 240,${groundY} Q260,${groundY - 4} 280,${groundY} Q300,${groundY - 1} 320,${groundY} Q340,${groundY - 3} 360,${groundY} Q380,${groundY - 2} 400,${groundY} Q420,${groundY - 4} 440,${groundY} Q460,${groundY - 1} 480,${groundY} L500,${groundY}`} fill="none" stroke={C.grass} strokeWidth="2" opacity="0.6" />

      {/* خط سطح الأرض */}
      <line x1="0" y1={groundY} x2="500" y2={groundY} stroke="#92400E" strokeWidth="2" />
      <text x="470" y={groundY - 6} textAnchor="end" fill="#92400E" fontSize="7" fontWeight="bold">سطح الأرض</text>

      {/* التربة */}
      <rect x="0" y={groundY} width="500" height="340" fill="url(#LSsoil)" />

      {/* طبقة التمويه */}
      {h_obs > 0 && (
        <rect x={startX - 5} y={groundY} width={tunnelLen + 10} height={Math.max(h_obs * 8, 3)} fill={C.conceal} opacity="0.5" />
      )}

      {/* ═══ الانفجار ═══ */}
      <circle cx={blastX} cy={blastY} r="14" fill="url(#LSblast)" />
      <text x={blastX} y={blastY + 3} textAnchor="middle" fill={C.blast} fontSize="7" fontWeight="bold">💥</text>

      {/* مسار القنبلة */}
      <line x1={blastX} y1={blastY} x2={blastX} y2={structureTop} stroke={C.blast} strokeWidth="1.5" strokeDasharray="5,3" />
      <text x={blastX + 15} y={(blastY + structureTop) / 2} fill={C.blast} fontSize="7" filter="url(#LSts)">مسار القنبلة</text>

      {/* موجة الضغط */}
      <ellipse cx={blastX} cy={structureTop - 10} rx="50" ry="8" fill="none" stroke={C.wave} strokeWidth="0.7" opacity="0.5" strokeDasharray="3,2" />
      <ellipse cx={blastX} cy={structureTop - 5} rx="70" ry="12" fill="none" stroke={C.wave} strokeWidth="0.5" opacity="0.3" strokeDasharray="4,3" />

      {/* ═══ المنشأة ═══ */}
      {/* السقف */}
      <rect x={startX} y={structureTop} width={tunnelLen} height={ceilH} fill="url(#LSconc)" stroke="#64748B" strokeWidth="1" />
      {/* الفراغ الداخلي */}
      <rect x={startX + 1} y={ceilBot} width={tunnelLen - 2} height={tunnelH} fill={C.interior} />
      {/* الأرضية */}
      <rect x={startX} y={floorTop} width={tunnelLen} height={floorH} fill="url(#LSconc)" stroke="#64748B" strokeWidth="1" />

      {/* تسليح السقف */}
      {Array.from({ length: 2 }, (_, i) => (
        <line key={`cs${i}`} x1={startX + 2} y1={ceilBot - 2 - i * 4} x2={endX - 2} y2={ceilBot - 2 - i * 4} stroke={C.steel} strokeWidth="0.7" />
      ))}
      {/* تسليح الأرضية */}
      {Array.from({ length: 2 }, (_, i) => (
        <line key={`fs${i}`} x1={startX + 2} y1={floorTop + 2 + i * 4} x2={endX - 2} y2={floorTop + 2 + i * 4} stroke={C.steel} strokeWidth="0.7" />
      ))}

      {/* ═══ الأبعاد ═══ */}
      {/* طول المنشأة */}
      <g>
        <line x1={startX} y1={floorBot + 14} x2={endX} y2={floorBot + 14} stroke={C.dim} strokeWidth="0.8" />
        <line x1={startX} y1={floorBot + 10} x2={startX} y2={floorBot + 18} stroke={C.dim} strokeWidth="0.6" />
        <line x1={endX} y1={floorBot + 10} x2={endX} y2={floorBot + 18} stroke={C.dim} strokeWidth="0.6" />
        <rect x={cx - 25} y={floorBot + 8} width="50" height="10" rx="2" fill="#0F172A" opacity="0.85" />
        <text x={cx} y={floorBot + 16} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily="monospace">Lₖ = {fmt(Lk, 0)} m</text>
      </g>

      {/* عمق المنشأة */}
      <g>
        <line x1={20} y1={groundY} x2={20} y2={structureTop} stroke={C.result} strokeWidth="1.2" />
        <line x1={16} y1={groundY} x2={24} y2={groundY} stroke={C.result} strokeWidth="0.6" />
        <line x1={16} y1={structureTop} x2={24} y2={structureTop} stroke={C.result} strokeWidth="0.6" />
        <rect x={6} y={(groundY + structureTop) / 2 - 5} width="28" height="10" rx="2" fill="#0F172A" opacity="0.85" />
        <text x={20} y={(groundY + structureTop) / 2 + 3} textAnchor="middle" fill={C.result} fontSize="7" fontWeight="bold" fontFamily="monospace">Z={fmt(Z, 1)}</text>
      </g>

      {/* سماكة السقف */}
      <g>
        <line x1={endX + 6} y1={structureTop} x2={endX + 6} y2={ceilBot} stroke={C.result} strokeWidth="1" />
        <rect x={endX + 10} y={(structureTop + ceilBot) / 2 - 5} width="42" height="10" rx="2" fill="#0F172A" opacity="0.85" />
        <text x={endX + 31} y={(structureTop + ceilBot) / 2 + 3} textAnchor="middle" fill={C.result} fontSize="7" fontWeight="bold" fontFamily="monospace">Hp={fmt(Hp * 100, 1)}</text>
      </g>

      {/* ارتفاع داخلي */}
      <g>
        <line x1={endX + 6} y1={ceilBot} x2={endX + 6} y2={floorTop} stroke={C.dim} strokeWidth="0.8" strokeDasharray="2,1" />
        <text x={endX + 12} y={(ceilBot + floorTop) / 2 + 3} fill={C.dim} fontSize="7" fontFamily="monospace">H={fmt(a_et, 1)}m</text>
      </g>

      {/* عمق الاختراق */}
      {penetrationDepth > 0 && (
        <g>
          <line x1={blastX - 40} y1={groundY} x2={blastX - 40} y2={groundY + penetrationDepth * 8} stroke={C.blast} strokeWidth="1.2" strokeDasharray="4,2" />
          <rect x={blastX - 72} y={groundY + penetrationDepth * 8 / 2 - 5} width="30" height="10" rx="2" fill="#0F172A" opacity="0.85" />
          <text x={blastX - 57} y={groundY + penetrationDepth * 8 / 2 + 3} textAnchor="middle" fill={C.blast} fontSize="7" fontWeight="bold" fontFamily="monospace">hпр={fmt(penetrationDepth, 2)}</text>
        </g>
      )}

      {/* ═══ العنوان ═══ */}
      <text x={cx} y="18" textAnchor="middle" fill={C.label} fontSize="10" fontWeight="bold">المقطع الطولي — مسقط جانبي</text>
      <text x={cx} y="30" textAnchor="middle" fill="#64748B" fontSize="7">موضع الانفجار وعمق المنشأة وأحمال الضغط</text>

      {/* ═══ جدول النتائج المختصرة ═══ */}
      <g transform="translate(startX, floorBot + 26)">
        <rect x="0" y="0" width={tunnelLen} height="40" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="0.5" />
        <text x={tunnelLen / 2} y="12" textAnchor="middle" fill="#94A3B8" fontSize="7" fontWeight="bold">ملخص النتائج</text>
        <line x1="5" y1="16" x2={tunnelLen - 5} y2="16" stroke="#334155" strokeWidth="0.3" />
        <text x="8" y="26" fill={C.result} fontSize="6.5">P = {fmt(pDesignMpa, 3)} MPa</text>
        <text x="80" y="26" fill={C.result} fontSize="6.5">hпр = {fmt(penetrationDepth, 2)} m</text>
        <text x="160" y="26" fill={C.result} fontSize="6.5">Z = {fmt(Z, 1)} m</text>
        <text x="240" y="26" fill={C.result} fontSize="6.5">Hp = {fmt(Hp * 100, 1)} cm</text>
        <text x="8" y="36" fill={C.dim} fontSize="6.5">Lₖ = {fmt(Lk, 0)} m</text>
        <text x="80" y="36" fill={C.dim} fontSize="6.5">Bₖ = {fmt(Bk, 0)} m</text>
        <text x="160" y="36" fill={C.dim} fontSize="6.5">aₚ = {fmt(userInput.shortSpan, 1)} m</text>
        <text x="240" y="36" fill={C.dim} fontSize="6.5">bₚ = {fmt(userInput.longSpan, 1)} m</text>
      </g>
    </svg>
  );
}
