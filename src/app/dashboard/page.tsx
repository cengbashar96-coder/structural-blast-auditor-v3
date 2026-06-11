// ═══════════════════════════════════════════════════════════════════════
// صفحة لوحة التحكم الرئيسية - Dashboard Page
// منصة المدقق الديناميكي الموحد V3.0
// تجميع الجزر التفاعلية: EngineeringForm + ResultsPanel + EccentricitySVG
// خط بيانات: Form → Zod → Engine → SVG + Benchmarks
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  BOMB_DATABASE,
  EXPLOSIVE_TABLE,
  SOIL_TABLE,
  type BombData,
} from '@/lib/structural/baselineConstants';
import {
  calculateBlastLoad,
  type BlastOutput,
} from '@/lib/structural/blastEngine';
import {
  calculateStructuralVerification,
  type StructuralOutput,
} from '@/lib/structural/structuralEngine';
import type { StructuralInput } from '@/lib/structural/structuralSchema';
import {
  projectRepository,
  scenarioRepository,
} from '@/lib/storage';
import type { ProjectRecord } from '@/lib/storage';
import { EngineeringForm } from '@/components/engineering-form';
import { ResultsPanel } from '@/components/results-panel';
import { EccentricitySvg } from '@/components/eccentricity-svg';

export default function DashboardPage() {
  // ─── حالة وسيطة بين المحرك (أ) والمحرك (ج) ───
  const [blastResult, setBlastResult] = useState<BlastOutput | null>(null);
  const [structuralResult, setStructuralResult] =
    useState<StructuralOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);

  // مدخلات محرك الانفجار
  const [bombId, setBombId] = useState(5);
  const [explosiveName, setExplosiveName] = useState('Tritonal_80_20');
  const [soilName, setSoilName] = useState('clay_stones');
  const [fallVelocity, setFallVelocity] = useState(600);
  const [fallAngle, setFallAngle] = useState(30);
  const [ceilingDepth, setCeilingDepth] = useState(9.5);
  const [tunnelSpanShort, setTunnelSpanShort] = useState(1.0);
  const [tunnelSpanLong, setTunnelSpanLong] = useState(3.0);

  // تحميل المشاريع المحفوظة
  useEffect(() => {
    projectRepository.getAllProjects().then(setProjects);
  }, []);

  // ─── القيم المسحوبة آلياً من محرك الانفجار (Read-Only) ───
  const engineOutputs = blastResult
    ? {
        p_design: blastResult.P_design_kPa,
        m_dynamic:
          (blastResult.P_design *
            tunnelSpanShort *
            100 *
            tunnelSpanLong *
            100) /
          8 /
          1000,
        n_dynamic:
          (blastResult.P_design *
            tunnelSpanLong *
            100 *
            tunnelSpanShort *
            100) /
          1000,
      }
    : { p_design: 0, m_dynamic: 0, n_dynamic: 0 };

  // ─── حساب ضغوط العصف (المحرك أ) ───
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
      });
      setBlastResult(result);
      // إعادة ضبط مخرجات المحرك الإنشائي عند تغيير مدخلات الانفجار
      setStructuralResult(null);
    } finally {
      setIsCalculating(false);
    }
  }, [
    bombId,
    explosiveName,
    soilName,
    fallVelocity,
    fallAngle,
    ceilingDepth,
    tunnelSpanShort,
    tunnelSpanLong,
  ]);

  // ─── التحقق الإنشائي (المحرك ج) ───
  const handleStructuralCalc = useCallback(
    (data: StructuralInput) => {
      setIsCalculating(true);
      try {
        const result = calculateStructuralVerification(data);
        setStructuralResult(result);
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  // ─── حفظ المشروع محلياً عبر Repository Layer ───
  const handleSaveProject = useCallback(async () => {
    if (!blastResult || !structuralResult) return;
    try {
      const project = await projectRepository.createProject(
        `مشروع تدقيق - ${new Date().toLocaleDateString('ar-SY')}`,
        `قنبلة ${BOMB_DATABASE.find((b) => b.id === bombId)?.type || ''} - عمق ${ceilingDepth}م`
      );

      const scenario = await scenarioRepository.createScenario(
        project.id,
        `سيناريو - SYRIAN_WSD_2024`,
        {
          designMethod: 'SYRIAN_WSD_2024',
          f_c: 30,
          f_y: 400,
          h_slab: 1200,
          b_column: 500,
          h_column: 500,
          a_tributary: 25,
          p_design: blastResult.P_design_kPa,
          m_dynamic:
            (blastResult.P_design *
              tunnelSpanShort *
              100 *
              tunnelSpanLong *
              100) /
            8 /
            1000,
          n_dynamic:
            (blastResult.P_design *
              tunnelSpanLong *
              100 *
              tunnelSpanShort *
              100) /
            1000,
        }
      );

      await scenarioRepository.saveStructuralOutput(scenario.id, structuralResult);

      const updated = await projectRepository.getAllProjects();
      setProjects(updated);
    } catch (error) {
      console.error('[DASHBOARD] خطأ في الحفظ:', error);
    }
  }, [blastResult, structuralResult, bombId, ceilingDepth, tunnelSpanShort, tunnelSpanLong]);

  const selectedBomb = BOMB_DATABASE.find((b) => b.id === bombId);

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            محركات التدقيق والتحقق المزدوج
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            محرك الانفجار (أ) → محرك الإجهادات (ب) → محرك التحقق الإنشائي
            (ج)
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-900 px-3 py-1 rounded border border-slate-800 text-slate-400">
          Baseline: 0.00%
        </div>
      </div>

      {/* ─── القسم الأول: مدخلات محرك الانفجار ─── */}
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">
          محرك الانفجار والأحمال الديناميكية (أ)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              نوع القنبلة
            </label>
            <select
              value={bombId}
              onChange={(e) => setBombId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs"
            >
              {BOMB_DATABASE.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.type} ({b.caliber}lb)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              المادة المتفجرة
            </label>
            <select
              value={explosiveName}
              onChange={(e) => setExplosiveName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs"
            >
              {EXPLOSIVE_TABLE.map((ex) => (
                <option key={ex.name} value={ex.name}>
                  {ex.nameAr} (K₁={ex.K1})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              نوع التربة
            </label>
            <select
              value={soilName}
              onChange={(e) => setSoilName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs"
            >
              {SOIL_TABLE.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              عمق السقف (م)
            </label>
            <input
              type="number"
              value={ceilingDepth}
              onChange={(e) => setCeilingDepth(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              سرعة السقوط (م/ث)
            </label>
            <input
              type="number"
              value={fallVelocity}
              onChange={(e) => setFallVelocity(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs"
              min={100}
              max={1000}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              زاوية السقوط (°)
            </label>
            <input
              type="number"
              value={fallAngle}
              onChange={(e) => setFallAngle(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs"
              min={0}
              max={90}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              البعد القصير (م)
            </label>
            <input
              type="number"
              value={tunnelSpanShort}
              onChange={(e) => setTunnelSpanShort(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-xs">
              البعد الطويل (م)
            </label>
            <input
              type="number"
              value={tunnelSpanLong}
              onChange={(e) => setTunnelSpanLong(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs"
              step="0.1"
            />
          </div>
        </div>

        {selectedBomb && (
          <div className="bg-slate-950 rounded p-3 text-xs text-slate-500 grid grid-cols-3 gap-2">
            <div>الوزن: {selectedBomb.weight_kg} كجم</div>
            <div>القطر: {selectedBomb.diameter_m} م</div>
            <div>الشحنة: {selectedBomb.charge_kg} كجم</div>
          </div>
        )}

        <button
          onClick={handleBlastCalc}
          disabled={isCalculating}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-slate-950 font-bold rounded transition-colors text-sm"
        >
          {isCalculating ? 'جاري الحساب...' : 'حساب ضغوط العصف الديناميكي (محرك أ)'}
        </button>
      </div>

      {/* ─── عرض مخرجات محرك الانفجار ─── */}
      {blastResult && (
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">
            مخرجات محرك الانفجار (أ)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block mb-0.5">عمق الاختراق</span>
              <span className="font-mono font-bold text-slate-200">
                {blastResult.h_penetration.toFixed(3)} م
              </span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block mb-0.5">الحمل التصميمي</span>
              <span className="font-mono font-bold text-emerald-400">
                {blastResult.P_design_kPa.toFixed(1)} kPa
              </span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block mb-0.5">الإجهاد الأقصى</span>
              <span className="font-mono font-bold text-slate-200">
                {blastResult.sigma_max.toFixed(3)} كجم/سم²
              </span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block mb-0.5">شرط الديناميكية</span>
              <span
                className={`font-bold ${
                  blastResult.dynamicConditionMet
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {blastResult.dynamicConditionMet ? 'محقق ✓' : 'غير محقق ✗'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── القسم الثاني: استمارة التحقق الإنشائي ─── */}
      <EngineeringForm
        mockEngineOutputs={engineOutputs}
        onCalculationTrigger={handleStructuralCalc}
        isCalculating={isCalculating}
      />

      {/* ─── القسم الثالث: مخرجات التحقق والمحاكاة الرسومية ─── */}
      {structuralResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResultsPanel
            outputs={structuralResult}
            baselineVersion="0.00%"
          />
          <EccentricitySvg
            eccentricity={structuralResult.eccentricity}
            e_limit={structuralResult.e_limit}
            svgColor={structuralResult.svgColor}
          />
        </div>
      )}

      {/* ─── زر الحفظ المحلي ─── */}
      {blastResult && structuralResult && (
        <button
          onClick={handleSaveProject}
          className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold rounded transition-colors text-sm"
        >
          حفظ المشروع محلياً عبر Repository Layer
        </button>
      )}

      {/* ─── المشاريع المحفوظة ─── */}
      {projects.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">
            المشاريع المحفوظة محلياً ({projects.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-slate-950 rounded p-3 text-xs"
              >
                <div>
                  <div className="font-medium text-slate-200">{p.name}</div>
                  <div className="text-slate-500">{p.description}</div>
                </div>
                <div className="text-slate-500 font-mono">
                  {p.baselineVersion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
