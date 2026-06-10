"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  BOMB_DATABASE,
  EXPLOSIVE_TABLE,
  SOIL_TABLE,
  SOIL_WAVE_TABLE,
  type BombData,
  type SoilCoefficients,
} from "@/lib/structural/baselineConstants";
import {
  calculateBlastLoad,
  type BlastOutput,
} from "@/lib/structural/blastEngine";
import {
  calculateStructuralVerification,
  type StructuralOutput,
} from "@/lib/structural/structuralEngine";
import type { StructuralInput } from "@/lib/structural/structuralSchema";
import {
  db,
  createProject,
  getAllProjects,
  saveBlastResult,
  saveStructuralResult,
  type AuditProject,
} from "@/lib/db/database";

// ─── SVG Status Component ───
function StatusSVG({ color, size = 60 }: { color: "GREEN" | "RED_FLASHING"; size?: number }) {
  const [flash, setFlash] = useState(true);
  useEffect(() => {
    if (color === "RED_FLASHING") {
      const t = setInterval(() => setFlash((v) => !v), 500);
      return () => clearInterval(t);
    }
  }, [color]);

  const fill = color === "GREEN" ? "#22c55e" : flash ? "#ef4444" : "#7f1d1d";
  const stroke = color === "GREEN" ? "#16a34a" : "#dc2626";

  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="26" fill={fill} stroke={stroke} strokeWidth="3" />
      {color === "GREEN" ? (
        <path d="M18 30 L26 38 L42 22" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M22 22 L38 38 M38 22 L22 38" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ─── Section Core SVG ───
function CoreSVG({ e, eLimit, h }: { e: number; eLimit: number; h: number }) {
  const inCore = e <= eLimit;
  const scale = 200 / h;
  const coreWidth = h / 3;
  const loadOffset = Math.min(e, h / 2) * scale;

  return (
    <svg width="240" height="160" viewBox="0 0 240 160">
      {/* Section rectangle */}
      <rect x="20" y="20" width={h * scale} height="120" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
      {/* Core zone (middle third) */}
      <rect x={20 + coreWidth * scale / 2} y="20" width={coreWidth * scale} height="120" fill={inCore ? "#bbf7d0" : "#fecaca"} stroke={inCore ? "#22c55e" : "#ef4444"} strokeWidth="1.5" strokeDasharray="5,3" />
      {/* Load resultant */}
      <line x1={20 + h * scale / 2 + loadOffset} y1="5" x2={20 + h * scale / 2 + loadOffset} y2="155" stroke={inCore ? "#16a34a" : "#dc2626"} strokeWidth="2.5" />
      <circle cx={20 + h * scale / 2 + loadOffset} cy="80" r="5" fill={inCore ? "#16a34a" : "#dc2626"} />
      {/* Labels */}
      <text x="125" y="155" textAnchor="middle" fontSize="10" fill="#475569">h = {h} mm</text>
      <text x="125" y="12" textAnchor="middle" fontSize="9" fill={inCore ? "#16a34a" : "#dc2626"}>
        {inCore ? "داخل النواة ✓" : "خارج النواة ✗"}
      </text>
    </svg>
  );
}

export default function Home() {
  // ─── State ───
  const [activeTab, setActiveTab] = useState<"blast" | "structural" | "projects">("blast");
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  // Blast engine inputs
  const [bombId, setBombId] = useState(5);
  const [explosiveName, setExplosiveName] = useState("Tritonal_80_20");
  const [soilName, setSoilName] = useState("clay_stones");
  const [fallVelocity, setFallVelocity] = useState(600);
  const [fallAngle, setFallAngle] = useState(30);
  const [ceilingDepth, setCeilingDepth] = useState(9.5);
  const [tunnelSpanShort, setTunnelSpanShort] = useState(1.0);
  const [tunnelSpanLong, setTunnelSpanLong] = useState(3.0);
  const [ceilingHeight, setCeilingHeight] = useState(2.45);

  // Structural engine inputs
  const [designMethod, setDesignMethod] = useState<"SYRIAN_WSD_2024" | "USD_GLOBAL">("SYRIAN_WSD_2024");
  const [f_c, setFc] = useState(30);
  const [f_y, setFy] = useState(400);
  const [h_slab, setHSlab] = useState(1200);
  const [b_column, setBColumn] = useState(500);
  const [h_column, setHColumn] = useState(500);
  const [a_tributary, setATributary] = useState(25);

  // Results
  const [blastResult, setBlastResult] = useState<BlastOutput | null>(null);
  const [structuralResult, setStructuralResult] = useState<StructuralOutput | null>(null);

  // Online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load projects
  useEffect(() => {
    getAllProjects().then(setProjects);
  }, []);

  // ─── Calculate Blast ───
  const handleBlastCalc = useCallback(() => {
    setIsCalculating(true);
    try {
      const result = calculateBlastLoad({
        bombId,
        explosiveName,
        soilName,
        fallVelocity,
        fallAngle,
        ceilingDepth,
        tunnelSpanShort,
        tunnelSpanLong,
        ceilingHeight,
      });
      setBlastResult(result);
    } finally {
      setIsCalculating(false);
    }
  }, [bombId, explosiveName, soilName, fallVelocity, fallAngle, ceilingDepth, tunnelSpanShort, tunnelSpanLong, ceilingHeight]);

  // ─── Calculate Structural ───
  const handleStructuralCalc = useCallback(() => {
    if (!blastResult) return;
    setIsCalculating(true);
    try {
      const input: StructuralInput = {
        designMethod,
        f_c,
        f_y,
        h_slab,
        b_column,
        h_column,
        a_tributary,
        p_design: blastResult.P_design_kPa,
        m_dynamic: blastResult.P_design * tunnelSpanShort * 100 * tunnelSpanLong * 100 / 8 / 1000,
        n_dynamic: blastResult.P_design * tunnelSpanLong * 100 * tunnelSpanShort * 100 / 1000,
      };
      const result = calculateStructuralVerification(input);
      setStructuralResult(result);
    } finally {
      setIsCalculating(false);
    }
  }, [blastResult, designMethod, f_c, f_y, h_slab, b_column, h_column, a_tributary, tunnelSpanShort, tunnelSpanLong]);

  // ─── Save Project ───
  const handleSave = useCallback(async () => {
    if (!blastResult || !structuralResult) return;
    const projectId = await createProject({
      name: `مشروع تدقيق - ${new Date().toLocaleDateString("ar-SY")}`,
      description: `قنبلة ${BOMB_DATABASE.find(b => b.id === bombId)?.type || ""} - عمق ${ceilingDepth}م`,
      bombId, explosiveName, soilName, fallVelocity, fallAngle,
      ceilingDepth, tunnelSpanShort, tunnelSpanLong, ceilingHeight,
      designMethod, f_c, f_y, h_slab, b_column, h_column, a_tributary,
    });
    await saveBlastResult({ projectId, ...blastResult });
    await saveStructuralResult({ projectId, ...structuralResult });
    const updated = await getAllProjects();
    setProjects(updated);
    alert("تم حفظ المشروع بنجاح ✓");
  }, [blastResult, structuralResult, bombId, explosiveName, soilName, fallVelocity, fallAngle, ceilingDepth, tunnelSpanShort, tunnelSpanLong, ceilingHeight, designMethod, f_c, f_y, h_slab, b_column, h_column, a_tributary]);

  const selectedBomb = BOMB_DATABASE.find(b => b.id === bombId);
  const selectedSoil = SOIL_TABLE.find(s => s.name === soilName);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-lg font-bold">V3</div>
          <div>
            <h1 className="text-lg font-bold">المدقق الديناميكي الموحد V3.0</h1>
            <p className="text-xs text-slate-400">محرك التصميم الإنشائي والتحقق المزدوج</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full ${isOnline ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300"}`}>
            {isOnline ? "متصل" : "غير متصل - محلي"}
          </span>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Baseline 0.00%</span>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b px-4 flex gap-1">
        {[
          { key: "blast" as const, label: "محرك الانفجار", icon: "💥" },
          { key: "structural" as const, label: "التحقق الإنشائي", icon: "🏗️" },
          { key: "projects" as const, label: "المشاريع المحفوظة", icon: "📁" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* BLAST ENGINE TAB */}
        {activeTab === "blast" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">مدخلات القنبلة والمتفجرات</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">نوع القنبلة</label>
                    <select value={bombId} onChange={e => setBombId(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                      {BOMB_DATABASE.map(b => (
                        <option key={b.id} value={b.id}>{b.type} ({b.caliber}lb)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">المادة المتفجرة</label>
                    <select value={explosiveName} onChange={e => setExplosiveName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                      {EXPLOSIVE_TABLE.map(ex => (
                        <option key={ex.name} value={ex.name}>{ex.nameAr} (K₁={ex.K1})</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedBomb && (
                  <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 grid grid-cols-3 gap-2">
                    <div>الوزن: {selectedBomb.weight_kg} كجم</div>
                    <div>القطر: {selectedBomb.diameter_m} م</div>
                    <div>الشحنة: {selectedBomb.charge_kg} كجم</div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">مدخلات التربة والسقوط</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">نوع التربة</label>
                    <select value={soilName} onChange={e => setSoilName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                      {SOIL_TABLE.map(s => (
                        <option key={s.name} value={s.name}>{s.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">سرعة السقوط (م/ث)</label>
                      <input type="number" value={fallVelocity} onChange={e => setFallVelocity(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min={100} max={1000} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">زاوية السقوط (°)</label>
                      <input type="number" value={fallAngle} onChange={e => setFallAngle(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min={0} max={90} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">عمق السقف (م)</label>
                      <input type="number" value={ceilingDepth} onChange={e => setCeilingDepth(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" step="0.1" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">البعد القصير (م)</label>
                      <input type="number" value={tunnelSpanShort} onChange={e => setTunnelSpanShort(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" step="0.1" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">البعد الطويل (م)</label>
                      <input type="number" value={tunnelSpanLong} onChange={e => setTunnelSpanLong(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" step="0.1" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBlastCalc}
                disabled={isCalculating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                {isCalculating ? "جاري الحساب..." : "حساب ضغوط العصف الديناميكي"}
              </button>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {blastResult ? (
                <>
                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-slate-800">نتائج محرك الانفجار</h2>
                      <StatusSVG color={blastResult.dynamicConditionMet && blastResult.coreConditionMet ? "GREEN" : "RED_FLASHING"} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <ResultItem label="عمق الاختراق" value={`${blastResult.h_penetration.toFixed(3)} م`} />
                      <ResultItem label="الشحنة الفعالة" value={`${blastResult.C_effective.toFixed(1)} كجم`} />
                      <ResultItem label="الإجهاد الأقصى" value={`${blastResult.sigma_max.toFixed(3)} كجم/سم²`} />
                      <ResultItem label="البعد المختزل R̄" value={blastResult.R_bar.toFixed(3)} />
                      <ResultItem label="الزمن الفعال" value={`${blastResult.tau_effective.toFixed(4)} ث`} />
                      <ResultItem label="تردد الاهتزاز" value={`${blastResult.omega.toFixed(0)} ث⁻¹`} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <h2 className="text-base font-bold text-slate-800 mb-4">الأحمال التصميمية</h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <ResultItem label="الحمل الأقصى" value={`${blastResult.P_max.toFixed(3)} كجم/سم²`} highlight />
                      <ResultItem label="الحمل المكافئ" value={`${blastResult.P_equivalent.toFixed(3)} كجم/سم²`} />
                      <ResultItem label="الحمل الساكن" value={`${blastResult.P_static.toFixed(3)} كجم/سم²`} />
                      <ResultItem label="الحمل التصميمي" value={`${blastResult.P_design.toFixed(3)} كجم/سم²`} highlight />
                      <ResultItem label="الحمل التصميمي" value={`${blastResult.P_design_kPa.toFixed(1)} كيلوباسكال`} highlight />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <h2 className="text-base font-bold text-slate-800 mb-4">السماكات المحسوبة</h2>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <ResultItem label="السقف" value={`${blastResult.H_roof.toFixed(1)} سم`} />
                      <ResultItem label="الجدار" value={`${blastResult.H_wall.toFixed(1)} سم`} />
                      <ResultItem label="الأرضية" value={`${blastResult.H_floor.toFixed(1)} سم`} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className={`px-3 py-2 rounded-lg ${blastResult.dynamicConditionMet ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        شرط الديناميكية: {blastResult.dynamicConditionMet ? "محقق ✓" : "غير محقق ✗"}
                      </div>
                      <div className={`px-3 py-2 rounded-lg ${blastResult.coreConditionMet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        نواة المقطع: {blastResult.coreConditionMet ? "داخل النواة ✓" : "خارج النواة (تسليح مزدوج)"}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-slate-400">
                  <div className="text-5xl mb-4">💥</div>
                  <p>أدخل البيانات واضغط &quot;حساب&quot; لعرض نتائج ضغوط العصف الديناميكي</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STRUCTURAL VERIFICATION TAB */}
        {activeTab === "structural" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">مدخلات التحقق الإنشائي</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">طريقة التصميم</label>
                    <select value={designMethod} onChange={e => setDesignMethod(e.target.value as "SYRIAN_WSD_2024" | "USD_GLOBAL")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="SYRIAN_WSD_2024">الكود العربي السوري 2024 (WSD)</option>
                      <option value="USD_GLOBAL">USD Global</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">f&apos;c (MPa)</label>
                      <input type="number" value={f_c} onChange={e => setFc(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min={25} max={60} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">f_y (MPa)</label>
                      <input type="number" value={f_y} onChange={e => setFy(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min={240} max={420} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">سماكة البلاطة (mm)</label>
                      <input type="number" value={h_slab} onChange={e => setHSlab(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min={300} max={2500} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">المساحة الروافدية (م²)</label>
                      <input type="number" value={a_tributary} onChange={e => setATributary(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">عرض العمود (mm)</label>
                      <input type="number" value={b_column} onChange={e => setBColumn(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min={200} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">ارتفاع العمود (mm)</label>
                      <input type="number" value={h_column} onChange={e => setHColumn(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min={200} />
                    </div>
                  </div>
                  {blastResult && (
                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                      <div className="font-medium mb-1">مخرجات محرك الانفجار (مسحوبة تلقائياً):</div>
                      <div>P_design = {blastResult.P_design_kPa.toFixed(1)} kPa | M = {(blastResult.P_design * tunnelSpanShort * 100 * tunnelSpanLong * 100 / 8 / 1000).toFixed(1)} kN·m | N = {(blastResult.P_design * tunnelSpanLong * 100 * tunnelSpanShort * 100 / 1000).toFixed(1)} kN</div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleStructuralCalc}
                disabled={!blastResult || isCalculating}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                {!blastResult ? "احسب الانفجار أولاً" : "التحقق الإنشائي المزدوج"}
              </button>

              {structuralResult && blastResult && (
                <button
                  onClick={handleSave}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  حفظ المشروع محلياً
                </button>
              )}
            </div>

            {/* Structural Results */}
            <div className="space-y-4">
              {structuralResult ? (
                <>
                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-slate-800">نتائج التحقق الإنشائي</h2>
                      <StatusSVG color={structuralResult.svgColor} size={70} />
                    </div>
                    <div className={`text-center py-2 px-4 rounded-lg mb-4 text-sm font-bold ${
                      structuralResult.status === 'SUCCESS' ? "bg-emerald-100 text-emerald-800" :
                      structuralResult.status === 'PUNCHING_FAILURE' ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {structuralResult.status === 'SUCCESS' && "✓ التصميم مقبول - آمن مقابل القص الثاقب"}
                      {structuralResult.status === 'PUNCHING_FAILURE' && "✗ فشل القص الثاقب - يجب زيادة السماكة"}
                      {structuralResult.status === 'CRITICAL_ERROR' && "⚠ خطأ حرج في التصميم"}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <ResultItem label="العمق الفعال" value={`${structuralResult.d_eff.toFixed(0)} mm`} />
                      <ResultItem label="المحيط الحرج" value={`${structuralResult.b_0.toFixed(0)} mm`} />
                      <ResultItem label="اللامركزية" value={`${structuralResult.eccentricity.toFixed(1)} mm`} />
                      <ResultItem label="حد النواة" value={`${structuralResult.e_limit.toFixed(1)} mm`} />
                      {structuralResult.v_actual !== undefined && (
                        <ResultItem label="إجهاد القص الفعلي" value={`${structuralResult.v_actual.toFixed(3)} MPa`} highlight />
                      )}
                      {structuralResult.v_cd !== undefined && (
                        <ResultItem label="إجهاد القص المسموح" value={`${structuralResult.v_cd.toFixed(3)} MPa`} />
                      )}
                      <ResultItem label="نسبة التسليح الدنيا" value={`${(structuralResult.rho_final * 100).toFixed(2)}%`} />
                    </div>
                    {structuralResult.errorMessage && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
                        {structuralResult.errorMessage}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <h2 className="text-base font-bold text-slate-800 mb-3">رسم نواة المقطع</h2>
                    <div className="flex justify-center">
                      <CoreSVG
                        e={structuralResult.eccentricity}
                        eLimit={structuralResult.e_limit}
                        h={h_slab}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      {structuralResult.eccentricity <= structuralResult.e_limit
                        ? "محصلة الأحمال داخل النواة - لا إجهاد شد"
                        : "محصلة الأحمال خارج النواة - يتطلب تسليح مزدوج (شد+ضغط)"}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <h2 className="text-base font-bold text-slate-800 mb-3">جدول ملخص الحوكمة</h2>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-right">البند</th>
                          <th className="p-2 text-center">القيمة</th>
                          <th className="p-2 text-center">الحد</th>
                          <th className="p-2 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">اللامركزية</td>
                          <td className="p-2 text-center">{structuralResult.eccentricity.toFixed(1)}</td>
                          <td className="p-2 text-center">≤ {structuralResult.e_limit.toFixed(1)}</td>
                          <td className="p-2 text-center">{structuralResult.eccentricity <= structuralResult.e_limit ? "✓" : "✗"}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">القص الثاقب</td>
                          <td className="p-2 text-center">{structuralResult.v_actual?.toFixed(3) || "—"}</td>
                          <td className="p-2 text-center">≤ {structuralResult.v_cd?.toFixed(3) || "—"}</td>
                          <td className="p-2 text-center">{structuralResult.status === 'SUCCESS' ? "✓" : "✗"}</td>
                        </tr>
                        <tr>
                          <td className="p-2">نسبة التسليح</td>
                          <td className="p-2 text-center">{(structuralResult.rho_final * 100).toFixed(2)}%</td>
                          <td className="p-2 text-center">≥ 0.25%</td>
                          <td className="p-2 text-center">✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-slate-400">
                  <div className="text-5xl mb-4">🏗️</div>
                  <p>احسب ضغوط الانفجار أولاً، ثم اضغط &quot;التحقق الإنشائي المزدوج&quot;</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-base font-bold text-slate-800 mb-4">المشاريع المحفوظة محلياً (Offline)</h2>
              {projects.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  <div className="text-4xl mb-3">📁</div>
                  <p>لا توجد مشاريع محفوظة بعد</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                      <div>
                        <div className="font-medium text-sm text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.description}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(p.updatedAt).toLocaleString("ar-SY")}</div>
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                        {p.designMethod === "SYRIAN_WSD_2024" ? "WSD سوري" : "USD"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-base font-bold text-slate-800 mb-3">حالة التخزين المحلي (IndexedDB)</h2>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{projects.length}</div>
                  <div className="text-xs text-emerald-600">مشاريع</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{BOMB_DATABASE.length}</div>
                  <div className="text-xs text-blue-600">قنابل (Baseline)</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">{SOIL_TABLE.length}</div>
                  <div className="text-xs text-amber-600">ترب (Baseline)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-3 px-4 text-center mt-auto">
        منصة المدقق الديناميكي الموحد V3.0 | الكود العربي السوري 2024 (WSD) + UFC 3-340-02 | Baseline Constants 0.00% | Offline-First PWA
      </footer>
    </div>
  );
}

// ─── Helper Component ───
function ResultItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 ${highlight ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50"}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-bold text-sm ${highlight ? "text-emerald-700" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}
