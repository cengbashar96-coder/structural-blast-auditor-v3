// ═══════════════════════════════════════════════════════════════════════
// استمارة إدخال المتغيرات الهندسية وربط الـ Zod Validation
// منصة المدقق الديناميكي الموحد V3.0
// تطبق حظر التحرير اليدوي على المخرجات الحرجة القادمة من المحرك (أ) و(ب)
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StructuralInputSchema,
  type StructuralInput,
} from '@/lib/structural/structuralSchema';

interface EngineeringFormProps {
  mockEngineOutputs: {
    p_design: number;
    m_dynamic: number;
    n_dynamic: number;
  };
  onCalculationTrigger: (data: StructuralInput) => void;
  isCalculating?: boolean;
}

export function EngineeringForm({
  mockEngineOutputs,
  onCalculationTrigger,
  isCalculating = false,
}: EngineeringFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StructuralInput>({
    resolver: zodResolver(StructuralInputSchema),
    defaultValues: {
      designMethod: 'SYRIAN_WSD_2024',
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      // سحب آلي قسري مغلق من المحركات السابقة (قراءة فقط)
      p_design: mockEngineOutputs.p_design,
      m_dynamic: mockEngineOutputs.m_dynamic,
      n_dynamic: mockEngineOutputs.n_dynamic,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onCalculationTrigger)}
      className="space-y-6 bg-slate-900 p-6 rounded-lg border border-slate-800"
    >
      <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">
        مدخلات المحرك الإنشائي والتحقق المزدوج
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* اختيار مسار الكود الحاكم */}
        <div>
          <label className="block text-slate-400 mb-1">
            المسار التصميمي الحاكم
          </label>
          <select
            {...register('designMethod')}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
          >
            <option value="SYRIAN_WSD_2024">
              الكود العربي السوري 2024 (WSD)
            </option>
            <option value="USD_GLOBAL">طريقة المقاومة القصوى (USD)</option>
          </select>
        </div>

        {/* سماكة بلاطة التحصين */}
        <div>
          <label className="block text-slate-400 mb-1">
            السماكة الكلية للبلاطة h (mm)
          </label>
          <input
            type="number"
            {...register('h_slab', { valueAsNumber: true })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
          />
          {errors.h_slab && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.h_slab.message}
            </span>
          )}
        </div>

        {/* مقاومة الخرسانة */}
        <div>
          <label className="block text-slate-400 mb-1">
            المقاومة الإنشائية للخرسانة f&apos;c (MPa)
          </label>
          <input
            type="number"
            {...register('f_c', { valueAsNumber: true })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
          />
          {errors.f_c && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.f_c.message}
            </span>
          )}
        </div>

        {/* إجهاد خضوع الحديد */}
        <div>
          <label className="block text-slate-400 mb-1">
            إجهاد خضوع الحديد f_y (MPa)
          </label>
          <input
            type="number"
            {...register('f_y', { valueAsNumber: true })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
          />
          {errors.f_y && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.f_y.message}
            </span>
          )}
        </div>

        {/* أبعاد العمود */}
        <div>
          <label className="block text-slate-400 mb-1">
            عرض العمود b_column (mm)
          </label>
          <input
            type="number"
            {...register('b_column', { valueAsNumber: true })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
          />
          {errors.b_column && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.b_column.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-slate-400 mb-1">
            ارتفاع العمود h_column (mm)
          </label>
          <input
            type="number"
            {...register('h_column', { valueAsNumber: true })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
          />
          {errors.h_column && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.h_column.message}
            </span>
          )}
        </div>

        {/* المساحة الروافدية */}
        <div>
          <label className="block text-slate-400 mb-1">
            المساحة الروافدية a_tributary (m²)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('a_tributary', { valueAsNumber: true })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
          />
          {errors.a_tributary && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.a_tributary.message}
            </span>
          )}
        </div>

        {/* حقول القراءة فقط المسحوبة آلياً لمنع التداخل والعبث */}
        <div>
          <label className="block text-slate-500 mb-1">
            ضغط العصف النهائي الحاكم P_design (kPa) [آلي - للقراءة فقط]
          </label>
          <input
            type="number"
            readOnly
            value={mockEngineOutputs.p_design}
            className="w-full bg-slate-950/60 border border-slate-900 rounded p-2 text-slate-500 font-mono cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            العزم الديناميكي M (kN·m) [آلي - للقراءة فقط]
          </label>
          <input
            type="number"
            readOnly
            value={mockEngineOutputs.m_dynamic}
            className="w-full bg-slate-950/60 border border-slate-900 rounded p-2 text-slate-500 font-mono cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            القوة المحورية الديناميكية N (kN) [آلي - للقراءة فقط]
          </label>
          <input
            type="number"
            readOnly
            value={mockEngineOutputs.n_dynamic}
            className="w-full bg-slate-950/60 border border-slate-900 rounded p-2 text-slate-500 font-mono cursor-not-allowed"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isCalculating}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-slate-950 font-bold rounded transition-colors text-sm"
      >
        {isCalculating
          ? 'جاري الحساب...'
          : 'تشغيل الخوارزمية الإنشائية والمطابقة العددية'}
      </button>
    </form>
  );
}
