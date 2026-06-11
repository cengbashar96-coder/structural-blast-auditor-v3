// ═══════════════════════════════════════════════════════════════════════
// محاكي النواة والتحقق اللامركزي مع Accessibility معزز
// منصة المدقق الديناميكي الموحد V3.0
// مكوّن SVG تفاعلي يدعم قارئات الشاشة بالكامل عبر سمات الـ aria-label
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';

interface EccentricitySvgProps {
  eccentricity: number;
  e_limit: number;
  svgColor: 'GREEN' | 'RED_FLASHING';
}

export function EccentricitySvg({
  eccentricity,
  e_limit,
  svgColor,
}: EccentricitySvgProps) {
  const isSafe = svgColor === 'GREEN';
  const strokeColor = isSafe ? '#10b981' : '#ef4444';
  const fillColor = isSafe
    ? 'rgba(16, 185, 129, 0.12)'
    : 'rgba(239, 68, 68, 0.20)';

  // وصف نصي حركي مخصص لقارئات الشاشة (Screen Readers Accessibility)
  const accessibilityDescription = isSafe
    ? `محاكاة هندسية تظهر محصلة القوى تقع بداخل النواة المركزية بأمان. اللامركزية الفعلية هي ${eccentricity.toFixed(1)} ملم والحد الأقصى هو ${e_limit.toFixed(1)} ملم.`
    : `تحذير هندسي واقِع. محصلة القوى خرجت من حدود النواة المركزية للمقطع. اللامركزية الفعلية ${eccentricity.toFixed(1)} ملم متجاوزة الحد الكودي ${e_limit.toFixed(1)} ملم.`;

  return (
    <div
      className="bg-slate-900 p-6 rounded-lg border border-slate-800 flex flex-col items-center justify-center space-y-4"
      role="figure"
      aria-label="مخطط بياني لنواة اللامركزية للمقطع"
    >
      <p className="sr-only">{accessibilityDescription}</p>

      <h4
        className="text-sm font-bold text-slate-300 text-right w-full mb-1"
        id="svg-title"
      >
        محاكاة النواة المركبة والحدود اللامركزية الحاكمة
      </h4>

      <div
        className="relative flex items-center justify-center bg-slate-950 rounded-lg p-4 border border-slate-800 w-full max-w-[280px] h-[280px]"
        aria-hidden="true"
      >
        <svg
          width="220"
          height="220"
          viewBox="0 0 240 240"
          className={!isSafe ? 'animate-pulse' : ''}
        >
          {/* حدود العنصر الإنشائي الكلي */}
          <rect
            x="20"
            y="20"
            width="200"
            height="200"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4"
          />

          {/* رسم المضلع المعيني للنواة الحاكمة المسموحة (e_limit = h/6) */}
          <polygon
            points="120,65 175,120 120,175 65,120"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />

          {/* مركز ثقل العمود الحرج */}
          <circle cx="120" cy="120" r="3" fill="#64748b" />

          {/* حركة نقطة محصلة الأحمال الديناميكية الفعلية */}
          {/* معامل الإزاحة يعكس الواقع الحسابي داخل المحور الأفقي */}
          <circle
            cx={
              isSafe
                ? 120 + Math.min(eccentricity * 0.25, 50)
                : 120 + Math.min(eccentricity * 0.45, 90)
            }
            cy="120"
            r="6"
            fill={strokeColor}
          />

          {/* خط الربط بين المركز ونقطة المحصلة */}
          <line
            x1="120"
            y1="120"
            x2={
              isSafe
                ? 120 + Math.min(eccentricity * 0.25, 50)
                : 120 + Math.min(eccentricity * 0.45, 90)
            }
            y2="120"
            stroke={strokeColor}
            strokeWidth="1"
            strokeDasharray="3"
          />
        </svg>
      </div>

      <div
        className="w-full grid grid-cols-2 gap-4 text-xs border-t border-slate-800 pt-3"
        aria-labelledby="svg-title"
      >
        <div>
          <span className="text-slate-400 block mb-0.5">
            اللامركزية المحسوبة e:
          </span>
          <span
            className={`font-mono text-sm font-bold ${
              isSafe ? 'text-slate-200' : 'text-red-400'
            }`}
          >
            {eccentricity.toFixed(1)} mm
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">
            حد النواة الكودي e_limit:
          </span>
          <span className="font-mono text-slate-200 text-sm font-bold">
            {e_limit.toFixed(1)} mm
          </span>
        </div>
      </div>
    </div>
  );
}
