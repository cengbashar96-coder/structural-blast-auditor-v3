// ═══════════════════════════════════════════════════════════════════════
// وحدة تحكم الإعدادات — جزيرة العميل الحاكمة
// منصة المدقق الديناميكي الموحد V3.0
// المظهر، اللغة، المزامنة، إدارة البيانات، حدود المحرك
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/storage/db';
import { rtmRepository } from '@/lib/storage/repositories/RtmRepository';
import { ConflictPolicy } from '@/lib/storage/conflictPolicy';
import { LOCKED_REGISTRY, FINAL_LOCKED_RESULTS, UNIFIED_VARIABLE_TABLE } from '@/lib/constants/reference-data';

type ThemeMode = 'dark' | 'light' | 'system';
type LanguageCode = 'ar' | 'en';
type SyncInterval = '5' | '10' | '30' | '60' | 'off';

interface AppSettings {
  theme: ThemeMode;
  language: LanguageCode;
  syncInterval: SyncInterval;
  deviationThreshold: number;
  autoRunBenchmarks: boolean;
  showLockedValues: boolean;
  showDeviationWarnings: boolean;
  compactMode: boolean;
  baselineVersion: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'ar',
  syncInterval: '30',
  deviationThreshold: 5,
  autoRunBenchmarks: false,
  showLockedValues: true,
  showDeviationWarnings: true,
  compactMode: false,
  baselineVersion: 'V3.0-Locked',
};

export function SettingsController() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState<'appearance' | 'sync' | 'engine' | 'data' | 'advanced'>('appearance');
  const [dbStats, setDbStats] = useState({ projects: 0, scenarios: 0, rtmRecords: 0, syncQueue: 0, conflicts: 0 });
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // جلب الإعدادات من localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('auditor-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.warn('[SETTINGS] Failed to load settings:', e);
    }
  }, []);

  // جلب إحصائيات قاعدة البيانات
  const loadDbStats = useCallback(async () => {
    try {
      const projects = await db.projects.count();
      const scenarios = await db.scenarios.count();
      const rtmRecords = await db.rtmRecords.count();
      const syncQueue = await db.syncQueue.count();
      const conflicts = ConflictPolicy.getConflictLog().length;

      setDbStats({ projects, scenarios, rtmRecords, syncQueue, conflicts });
    } catch (e) {
      console.warn('[SETTINGS] Failed to load DB stats:', e);
    }
  }, []);

  useEffect(() => {
    loadDbStats();
  }, [loadDbStats]);

  // حفظ الإعدادات
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('auditor-settings', JSON.stringify(newSettings));
      setSaveNotification('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSaveNotification(null), 2000);
    } catch (e) {
      console.error('[SETTINGS] Failed to save:', e);
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    saveSettings({ ...settings, [key]: value });
  };

  // تفريغ البيانات المحلية
  const handleClearLocalData = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع البيانات المحلية؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    try {
      await db.projects.clear();
      await db.scenarios.clear();
      await db.rtmRecords.clear();
      await db.syncQueue.clear();
      await loadDbStats();
      setSaveNotification('تم تفريغ جميع البيانات المحلية');
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (e) {
      console.error('[SETTINGS] Clear failed:', e);
    }
  };

  // تصدير الإعدادات
  const handleExportSettings = () => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditor-settings-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // إعادة تعيين الإعدادات
  const handleResetSettings = () => {
    if (!confirm('هل تريد إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟')) return;
    saveSettings(DEFAULT_SETTINGS);
  };

  const sections = [
    { key: 'appearance' as const, label: 'المظهر واللغة', icon: '🎨' },
    { key: 'sync' as const, label: 'المزامنة', icon: '🔄' },
    { key: 'engine' as const, label: 'المحرك والتحقق', icon: '⚙️' },
    { key: 'data' as const, label: 'إدارة البيانات', icon: '💾' },
    { key: 'advanced' as const, label: 'متقدم', icon: '🔧' },
  ];

  return (
    <div className="space-y-6">
      {/* إشعار الحفظ */}
      {saveNotification && (
        <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs p-3 rounded flex justify-between items-center" role="alert">
          <span>{saveNotification}</span>
          <button onClick={() => setSaveNotification(null)} className="text-slate-500 hover:text-slate-300 font-bold">×</button>
        </div>
      )}

      {/* الرأس */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">⚙️ إعدادات المنصة</h1>
          <p className="text-xs text-slate-400 mt-1">تكوين منصة المدقق الديناميكي الموحد V3.0 — المظهر، المحرك، المزامنة، البيانات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportSettings} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors">
            📥 تصدير الإعدادات
          </button>
          <button onClick={handleResetSettings} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs rounded transition-colors">
            ↺ إعادة تعيين
          </button>
        </div>
      </div>

      {/* تبويبات الأقسام */}
      <div className="flex gap-1 border-b border-slate-800">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeSection === s.key
                ? 'text-emerald-400 border-emerald-500 bg-slate-900/40'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ═══ المظهر واللغة ═══ */}
      {activeSection === 'appearance' && (
        <div className="space-y-4">
          <SettingCard title="المظهر" description="اختر وضع المظهر المناسب لبيئة العمل">
            <div className="grid grid-cols-3 gap-3 mt-3">
              {([
                { value: 'dark', label: 'داكن', desc: 'خلفية داكنة مع نص فاتح' },
                { value: 'light', label: 'فاتح', desc: 'خلفية فاتحة مع نص داكن' },
                { value: 'system', label: 'تلقائي', desc: 'يتبع إعدادات النظام' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('theme', opt.value)}
                  className={`p-3 rounded-lg border text-right transition-all ${
                    settings.theme === opt.value
                      ? 'bg-emerald-950/20 border-emerald-700/50 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`font-bold text-sm ${settings.theme === opt.value ? 'text-emerald-400' : 'text-slate-300'}`}>{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="اللغة" description="لغة واجهة المستخدم والتقارير">
            <div className="grid grid-cols-2 gap-3 mt-3">
              {([
                { value: 'ar', label: 'العربية', desc: 'واجهة من اليمين لليسار' },
                { value: 'en', label: 'English', desc: 'Left-to-right interface' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('language', opt.value)}
                  className={`p-3 rounded-lg border text-right transition-all ${
                    settings.language === opt.value
                      ? 'bg-emerald-950/20 border-emerald-700/50 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`font-bold text-sm ${settings.language === opt.value ? 'text-emerald-400' : 'text-slate-300'}`}>{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="العرض المضغوط" description="تقليل المسافات والحشو لعرض بيانات أكثر">
            <ToggleSwitch
              checked={settings.compactMode}
              onChange={(v) => updateSetting('compactMode', v)}
              label="تفعيل الوضع المضغوط"
            />
          </SettingCard>
        </div>
      )}

      {/* ═══ المزامنة ═══ */}
      {activeSection === 'sync' && (
        <div className="space-y-4">
          <SettingCard title="فاصل المزامنة التلقائية" description="كم مرة يتم التحقق من التغييرات ومزامنتها مع الخادم">
            <div className="grid grid-cols-5 gap-2 mt-3">
              {([
                { value: '5', label: '5 ثوانٍ' },
                { value: '10', label: '10 ثوانٍ' },
                { value: '30', label: '30 ثانية' },
                { value: '60', label: '60 ثانية' },
                { value: 'off', label: 'إيقاف' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('syncInterval', opt.value)}
                  className={`p-2 rounded border text-xs text-center transition-all ${
                    settings.syncInterval === opt.value
                      ? 'bg-emerald-950/20 border-emerald-700/50 text-emerald-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="حالة طابور المزامنة" description="عرض ملخص لحالة عمليات المزامنة الحالية">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <MiniStat label="معلقة" value={dbStats.syncQueue} color={dbStats.syncQueue > 0 ? 'amber' : 'slate'} />
              <MiniStat label="تعارضات" value={dbStats.conflicts} color={dbStats.conflicts > 0 ? 'red' : 'emerald'} />
              <MiniStat label="السجلات" value={dbStats.rtmRecords} color="slate" />
              <MiniStat label="السيناريوهات" value={dbStats.scenarios} color="slate" />
            </div>
          </SettingCard>

          <SettingCard title="إعادة محاولة العناصر الفاشلة" description="إعادة إرسال العناصر التي فشلت مزامنتها">
            <button
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition-colors mt-2"
              onClick={async () => {
                try {
                  const failed = await db.syncQueue.where('status').equals('FAILED').toArray();
                  for (const item of failed) {
                    await db.syncQueue.update(item.id, { status: 'PENDING', retryCount: 0, lastError: undefined });
                  }
                  await loadDbStats();
                  setSaveNotification(`تم إعادة جدولة ${failed.length} عنصر فاشل`);
                  setTimeout(() => setSaveNotification(null), 3000);
                } catch (e) {
                  console.error('[SETTINGS] Retry failed:', e);
                }
              }}
            >
              🔄 إعادة محاولة العناصر الفاشلة
            </button>
          </SettingCard>
        </div>
      )}

      {/* ═══ المحرك والتحقق ═══ */}
      {activeSection === 'engine' && (
        <div className="space-y-4">
          <SettingCard title="حد الانحراف المسموح" description="النسبة المئوية القصوى للانحراف عن القيم المرجعية المقفلة قبل إطلاق تحذير">
            <div className="flex items-center gap-4 mt-3">
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={settings.deviationThreshold}
                onChange={(e) => updateSetting('deviationThreshold', parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="text-emerald-400 font-mono font-bold text-sm w-16 text-center">{settings.deviationThreshold}%</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              القيمة الافتراضية: 5% — أي انحراف أعلى يُعتبر تحذيراً. القيم المقفلة BMK-02 تستخدم تسامح 1%.
            </div>
          </SettingCard>

          <SettingCard title="التشغيل التلقائي للاختبارات المرجعية" description="تشغيل اختبارات BMK تلقائياً عند حفظ سيناريو جديد">
            <ToggleSwitch
              checked={settings.autoRunBenchmarks}
              onChange={(v) => updateSetting('autoRunBenchmarks', v)}
              label="تفعيل التشغيل التلقائي"
            />
          </SettingCard>

          <SettingCard title="عرض القيم المقفلة" description="إظهار القيم المقفلة والمرجعية في نتائج المحرك">
            <ToggleSwitch
              checked={settings.showLockedValues}
              onChange={(v) => updateSetting('showLockedValues', v)}
              label="إظهار القيم المقفلة"
            />
          </SettingCard>

          <SettingCard title="تحذيرات الانحراف" description="عرض تحذيرات عند انحراف القيم المحسوبة عن المرجعية">
            <ToggleSwitch
              checked={settings.showDeviationWarnings}
              onChange={(v) => updateSetting('showDeviationWarnings', v)}
              label="تفعيل التحذيرات"
            />
          </SettingCard>

          <SettingCard title="معلومات خط الأساس" description="بيانات المرجع الذهبي المقفل BMK-02">
            <div className="mt-3 bg-slate-950 rounded p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">إصدار خط الأساس</span>
                <span className="font-mono text-emerald-400">{settings.baselineVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">عدد القيم المقفلة</span>
                <span className="font-mono text-slate-300">{LOCKED_REGISTRY.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">عدد المتغيرات الموحدة</span>
                <span className="font-mono text-slate-300">{UNIFIED_VARIABLE_TABLE.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">عمق الاختراق المرجعي (h_pr)</span>
                <span className="font-mono text-slate-300">{FINAL_LOCKED_RESULTS.h_pr} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الشحنة الفعالة (C_ef)</span>
                <span className="font-mono text-slate-300">{FINAL_LOCKED_RESULTS.C_ef} kg</span>
              </div>
            </div>
          </SettingCard>
        </div>
      )}

      {/* ═══ إدارة البيانات ═══ */}
      {activeSection === 'data' && (
        <div className="space-y-4">
          <SettingCard title="إحصائيات قاعدة البيانات المحلية" description="ملخص البيانات المخزنة محلياً في IndexedDB">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
              <MiniStat label="المشاريع" value={dbStats.projects} color="emerald" />
              <MiniStat label="السيناريوهات" value={dbStats.scenarios} color="slate" />
              <MiniStat label="سجلات RTM" value={dbStats.rtmRecords} color="slate" />
              <MiniStat label="طابور المزامنة" value={dbStats.syncQueue} color={dbStats.syncQueue > 0 ? 'amber' : 'slate'} />
              <MiniStat label="التعارضات" value={dbStats.conflicts} color={dbStats.conflicts > 0 ? 'red' : 'emerald'} />
            </div>
          </SettingCard>

          <SettingCard title="تصدير جميع البيانات" description="تنزيل جميع البيانات المحلية كملف JSON">
            <button
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition-colors mt-2"
              onClick={async () => {
                try {
                  const projects = await db.projects.toArray();
                  const scenarios = await db.scenarios.toArray();
                  const rtm = await db.rtmRecords.toArray();
                  const sync = await db.syncQueue.toArray();
                  const data = { projects, scenarios, rtmRecords: rtm, syncQueue: sync, exportedAt: new Date().toISOString() };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `auditor-data-${Date.now()}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                } catch (e) {
                  console.error('[SETTINGS] Export failed:', e);
                }
              }}
            >
              📥 تصدير البيانات
            </button>
          </SettingCard>

          <SettingCard title="تفريغ البيانات المحلية" description="حذف جميع البيانات المحلية من IndexedDB — لا يمكن التراجع">
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition-colors mt-2"
              onClick={handleClearLocalData}
            >
              🗑️ تفريغ البيانات المحلية
            </button>
            <div className="text-[10px] text-red-400/60 mt-1">تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع المشاريع والسيناريوهات وسجلات RTM.</div>
          </SettingCard>
        </div>
      )}

      {/* ═══ متقدم ═══ */}
      {activeSection === 'advanced' && (
        <div className="space-y-4">
          <SettingCard title="معلومات النظام" description="تفاصيل تقنية عن بيئة التشغيل">
            <div className="mt-3 bg-slate-950 rounded p-3 text-xs space-y-1.5">
              {[
                { label: 'المنصة', value: 'المدقق الديناميكي الموحد V3.0' },
                { label: 'الإطار', value: 'Next.js 16 + React 19' },
                { label: 'قاعدة البيانات المحلية', value: 'Dexie (IndexedDB)' },
                { label: 'قاعدة البيانات البعيدة', value: 'Prisma (PostgreSQL)' },
                { label: 'الإصدار', value: 'V3.0-Locked' },
                { label: 'أكواد التصميم', value: 'Syrian Code 2024 + UFC 3-340-02' },
                { label: 'المرجع الذهبي', value: 'BMK-02 (MK83 + MEDIUM_SOIL)' },
                { label: 'خطوات أنبوب المعالجة', value: '8 خطوات (Step 2 → Step 8)' },
                { label: 'مسارات الحمل', value: 'سقف (ω=561.67) + جدار (ω=1024.05)' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between border-b border-slate-800/50 pb-1">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-mono text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="إعادة تعيين الإعدادات" description="إعادة جميع الإعدادات إلى القيم الافتراضية">
            <button
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded transition-colors mt-2"
              onClick={handleResetSettings}
            >
              ↺ إعادة تعيين جميع الإعدادات
            </button>
          </SettingCard>
        </div>
      )}
    </div>
  );
}

// ─── مكونات مساعدة ──────────────────────────────────────────────────

function SettingCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between mt-3">
      <span className="text-xs text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-slate-700'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'right-0.5' : 'right-[22px]'
          }`}
        />
      </button>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    slate: 'text-slate-300',
  };

  return (
    <div className="bg-slate-950 rounded p-2 text-center border border-slate-800">
      <div className={`text-lg font-bold font-mono ${colorMap[color] || colorMap.slate}`}>{value}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}
