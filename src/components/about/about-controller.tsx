// ═══════════════════════════════════════════════════════════════════════
// صفحة حول المنصة — جزيرة العميل
// منصة المدقق الديناميكي الموحد V3.0
// معلومات النسخة، الأكواد، الفريق، التراخيص، الاتصال
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { LOCKED_REGISTRY, UNIFIED_VARIABLE_TABLE, ENGINE_BOUNDARIES } from '@/lib/constants/reference-data';

export function AboutController() {
  const [activeTab, setActiveTab] = useState<'platform' | 'codes' | 'engine' | 'licenses'>('platform');

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            حول المنصة
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            منصة المدقق الديناميكي الموحد V3.0 — نظام التحقق الإنشائي المتكامل
          </p>
        </div>
        <div className="bg-emerald-950/30 border border-emerald-900/50 px-3 py-1.5 rounded text-xs font-mono text-emerald-400">
          Version 3.0-Locked
        </div>
      </div>

      {/* تبويبات */}
      <div className="flex gap-1 border-b border-slate-800">
        {([
          { key: 'platform' as const, label: 'المنصة' },
          { key: 'codes' as const, label: 'أكواد التصميم' },
          { key: 'engine' as const, label: 'المحرك' },
          { key: 'licenses' as const, label: 'التراخيص' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'text-emerald-400 border-emerald-500 bg-slate-900/40'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ المنصة ═══ */}
      {activeTab === 'platform' && (
        <div className="space-y-4">
          {/* بطاقة التعريف */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-emerald-950/50 rounded-xl flex items-center justify-center border border-emerald-800/40">
                <span className="text-3xl font-black text-emerald-400">V3</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">منصة المدقق الديناميكي الموحد</h2>
                <p className="text-xs text-slate-400">Unified Dynamic Auditor Platform V3.0</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              منصة هندسية متكاملة للتحقق من تصميم المنشآت الحمائية ضد الأحمال الديناميكية الناتجة عن الانفجارات.
              تعتمد المنصة نهج التحقق المزدوج وفق الكود الإنشائي السوري 2024 ومعايير UFC 3-340-02، مع نظام
              تتبع كامل للقيم المقفلة ومصفوفة مطابقة المتطلبات. تعمل كتطبيق أوفلاين-أول (PWA) مع مزامنة
              اختيارية مع الخادم المركزي.
            </p>
          </div>

          {/* معلومات تقنية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="التقنيات المستخدمة">
              {[
                { label: 'الإطار', value: 'Next.js 16 + React 19' },
                { label: 'اللغة', value: 'TypeScript 5' },
                { label: 'الأنماط', value: 'Tailwind CSS 4 + shadcn/ui' },
                { label: 'قاعدة البيانات المحلية', value: 'Dexie 4 (IndexedDB)' },
                { label: 'قاعدة البيانات البعيدة', value: 'Prisma 6 (PostgreSQL)' },
                { label: 'إدارة الحالة', value: 'Zustand 5' },
                { label: 'PWA', value: 'Serwist (Service Worker)' },
                { label: 'التحقق', value: 'Zod 4' },
              ].map((item, i) => (
                <InfoRow key={i} label={item.label} value={item.value} />
              ))}
            </InfoCard>

            <InfoCard title="الميزات الرئيسية">
              {[
                { label: 'أنبوب المعالجة', value: '8 خطوات حسابية (Step 2-8)' },
                { label: 'مسارات الحمل', value: 'سقف + جدار + مشترك' },
                { label: 'المرجع الذهبي', value: 'BMK-02 (MK83)' },
                { label: 'القيم المقفلة', value: `${LOCKED_REGISTRY.length} قيمة` },
                { label: 'المتغيرات الموحدة', value: `${UNIFIED_VARIABLE_TABLE.length} متغير` },
                { label: 'تصنيف المتغيرات', value: '5 فئات (input/lookup/computed/locked/output)' },
                { label: 'التصدير', value: 'JSON, CSV, Markdown, PDF, RTM' },
                { label: 'أوضاع العمل', value: 'أوفلاين + متصل + مزامنة' },
              ].map((item, i) => (
                <InfoRow key={i} label={item.label} value={item.value} />
              ))}
            </InfoCard>
          </div>
        </div>
      )}

      {/* ═══ أكواد التصميم ═══ */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3">الكود الإنشائي السوري 2024</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              الكود الإنشائي السوري للمنشآت الحمائية يحدد متطلبات تصميم وتنفيذ المنشآت المقاومة للانفجارات.
              يشمل حساب أحمال الانفجار على الأسقف والجدران، تحديد سماكات الحماية، وتصميم التسليح اللازم
              لمقاومة الأحمال الديناميكية. المنصة تطبق المعادلات من الفصل 3 (حمل الانفجار) والفصل 5
              (التصميم الإنشائي) والجداول الملحقة B-1 إلى B-6.
            </p>
            <div className="mt-3 space-y-1">
              {[
                'المعادلات 1-12: حساب أحمال الانفجار (ضغط، زمن، معاملات)',
                'المعادلات 13-19: حساب عمق الاختراق والشحنة الفعالة',
                'الجداول B-1 إلى B-6: معاملات الاستجابة الديناميكية',
                'الفصل 5.1-5.10: أحمال السقف',
                'الفصل 8.1-8.10: أحمال الجدران',
                'الجدول I-1 إلى I-7: معاملات التربة والمواد',
              ].map((item, i) => (
                <div key={i} className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="text-emerald-400">●</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3">UFC 3-340-02</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified Facilities Criteria 3-340-02 — Structures to Resist the Effects of Accidental Explosions.
              هذا المعيار العسكري الأمريكي يوفر منهجية شاملة لتصميم المنشآت المقاومة للانفجارات العرضية.
              يُستخدم كمرجع مكمل للكود السوري، خاصة في حسابات الاستجابة الديناميكية ومعاملات التصميم
              التي لا يغطيها الكود السوري بشكل مفصل.
            </p>
            <div className="mt-3 space-y-1">
              {[
                'الفصل 2: خصائص الانفجار وانتشار الموجة',
                'الفصل 3: أحمال الانفجار على المنشآت',
                'الفصل 4: الاستجابة الديناميكية للعناصر الإنشائية',
                'الفصل 5: تصميم العناصر الخرسانية المسلحة',
                'الفصل 6: تصميم العناصر المعدنية',
                'الملحق B: جداول معاملات الاستجابة',
              ].map((item, i) => (
                <div key={i} className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="text-blue-400">●</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ المحرك ═══ */}
      {activeTab === 'engine' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3">أنبوب المعالجة — 8 خطوات</h3>
            <div className="space-y-2">
              {[
                { step: 2, name: 'المدخلات والاستيفاءات', desc: 'جمع المدخلات وقيم الجداول (I-1 إلى I-7) ومعاملات الأسلحة', path: 'مشترك' },
                { step: 3, name: 'الاختراق', desc: 'حساب عمق الاختراق h_pr والشحنة الفعالة C_ef والبعد المختزل Zp', path: 'مشترك' },
                { step: 4, name: 'القفل الأولي', desc: 'تجميد السماكات Hp, Hc, Hf, Hvct والأبعاد ht, Bt', path: 'مشترك' },
                { step: 5, name: 'حمل الانفجار', desc: 'حساب الضغوط والازمنة لكل مسار (سقف: 5.1-5.10, جدار: 8.1-8.10)', path: 'سقف + جدار' },
                { step: 6, name: 'معاملات الجدول ب', desc: 'استيفاء B-1 إلى B-6: R̄, μ/η/Kt, a0z/a1z, Kпοд, Kп, Kд', path: 'سقف + جدار' },
                { step: 7, name: 'سماكة السقف', desc: 'حساب h0 من العزم البلاستيكي ثم Hp = h0 × 1.05', path: 'سقف' },
                { step: 8, name: 'تصميم الجدار النهائي', desc: 'قفل Hc, Hf, Hvct النهائية والتحقق من مطابقة الكود', path: 'جدار' },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 p-3 bg-slate-950 rounded border border-slate-800">
                  <div className="w-10 h-10 bg-emerald-950/30 rounded-lg flex items-center justify-center border border-emerald-900/40 shrink-0">
                    <span className="text-emerald-400 font-bold text-sm">{s.step}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">{s.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{s.path}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3">حدود المحرك — انتقال القيم المقفلة</h3>
            <div className="space-y-2">
              {[
                { boundary: 'الاختراق → حمل الانفجار', keys: ENGINE_BOUNDARIES.penetrationToBlast },
                { boundary: 'حمل الانفجار (سقف) → التصميم', keys: ENGINE_BOUNDARIES.blastRoofToStructural },
                { boundary: 'حمل الانفجار (جدار) → التصميم', keys: ENGINE_BOUNDARIES.blastWallToStructural },
              ].map((b, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded border border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 mb-1">{b.boundary}</div>
                  <div className="flex flex-wrap gap-1">
                    {b.keys.map((k) => (
                      <span key={k} className="px-1.5 py-0.5 bg-slate-900 text-[10px] font-mono text-slate-400 rounded border border-slate-800">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ التراخيص ═══ */}
      {activeTab === 'licenses' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3">المكتبات مفتوحة المصدر</h3>
            <p className="text-xs text-slate-400 mb-3">
              تعتمد المنصة على مجموعة من المكتبات مفتوحة المصدر. نقدم شكرنا لجميع المساهمين في هذه المشاريع.
            </p>
            <div className="space-y-1.5">
              {[
                { name: 'Next.js', version: '16', license: 'MIT' },
                { name: 'React', version: '19', license: 'MIT' },
                { name: 'TypeScript', version: '5', license: 'Apache-2.0' },
                { name: 'Tailwind CSS', version: '4', license: 'MIT' },
                { name: 'Dexie.js', version: '4', license: 'Apache-2.0' },
                { name: 'Prisma', version: '6', license: 'Apache-2.0' },
                { name: 'Zod', version: '4', license: 'MIT' },
                { name: 'Zustand', version: '5', license: 'MIT' },
                { name: 'Radix UI', version: '-', license: 'MIT' },
                { name: 'Lucide React', version: '-', license: 'ISC' },
                { name: 'Recharts', version: '2', license: 'MIT' },
                { name: 'date-fns', version: '4', license: 'MIT' },
                { name: 'Serwist', version: '9', license: 'MIT' },
              ].map((lib, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">{lib.name}</span>
                    <span className="font-mono text-slate-500 text-[10px]">v{lib.version}</span>
                  </div>
                  <span className="font-mono text-emerald-400 text-[10px]">{lib.license}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3">إخلاء المسؤولية</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              هذه المنصة أداة مساعدة في التحقق الهندسي ولا تغني عن المراجعة المهنية من قبل مهندس إنشائي مرخص.
              نتائج المحرك الحسابية يجب أن يتم التحقق منها بشكل مستقل قبل استخدامها في التصميم الفعلي.
              فريق التطوير غير مسؤول عن أي أخطاء أو أضرار ناتجة عن استخدام هذه المنصة.
              المرجع الذهبي BMK-02 مقفل ولا يمكن تعديله — أي انحراف عن القيم المرجعية يشير إلى خطأ محتمل
              في الخوارزميات يتطلب مراجعة فورية.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── مكونات مساعدة ──────────────────────────────────────────────────

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <h3 className="text-sm font-bold text-slate-200 mb-3">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-300">{value}</span>
    </div>
  );
}
