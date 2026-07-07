// ═══════════════════════════════════════════════════════════════════════
// الخطوة 2 — المدخلات والجداول المرجعية (Excel 1)
// منصة المدقق الديناميكي الموحد V3.0
// حساب المنشآت الوقائية ضد الأحمال الانفجارية
// الكود السوري 2024 & UFC 3-340-02
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { WEAPONS, SOILS, getExplosiveK1 } from '@/lib/engine/constants';
import { STEP2_INPUTS, STEP2_LOOKUPS, STEP2_GEOMETRY } from '@/lib/constants/reference-data';
import type { WeaponData, SoilCoefficients, SoilTypeCode, ExplosiveType } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Crosshair,
  MapPin,
  Cuboid,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// واجهة حالة المدخلات
// ═══════════════════════════════════════════════════════════════════════

interface WeaponFields {
  weaponId: string;
  P: number;
  V: number;
  alpha: number;
  dk: number;
  ldRatio: number;
  lhdRatio: number;
  C: number;
  explosive: string;
}

interface SiteFields {
  soilCode: string;
  Z: number;
  ap: number;
  bp: number;
  a_et: number;
  Lk: number;
  Bk: number;
  Pk: number;
}

interface MaterialFields {
  fc: number;
  fy: number;
  RbH: number;
  RsH: number;
  gamma_b: number;
  gamma_g: number;
}

// ═══════════════════════════════════════════════════════════════════════
// القيم الافتراضية (من BMK-02)
// ═══════════════════════════════════════════════════════════════════════

const DEFAULT_WEAPON: WeaponFields = {
  weaponId: 'W_MK83',
  P: STEP2_INPUTS.P,
  V: STEP2_INPUTS.V,
  alpha: STEP2_INPUTS.alpha,
  dk: STEP2_INPUTS.dk,
  ldRatio: STEP2_INPUTS.ld_ratio,
  lhdRatio: STEP2_INPUTS.lhd_ratio,
  C: STEP2_INPUTS.C,
  explosive: 'Tritonal_80_20',
};

const DEFAULT_SITE: SiteFields = {
  soilCode: 'MEDIUM_SOIL',
  Z: STEP2_INPUTS.Z,
  ap: STEP2_GEOMETRY.ap,
  bp: STEP2_GEOMETRY.bp,
  a_et: STEP2_GEOMETRY.a_et,
  Lk: STEP2_GEOMETRY.Lk,
  Bk: STEP2_GEOMETRY.Bk,
  Pk: STEP2_GEOMETRY.Pk,
};

const DEFAULT_MATERIAL: MaterialFields = {
  fc: 25,
  fy: 400,
  RbH: STEP2_LOOKUPS.RbH,
  RsH: STEP2_LOOKUPS.RsH,
  gamma_b: STEP2_LOOKUPS.gamma_b,
  gamma_g: STEP2_LOOKUPS.gamma_g,
};

// ═══════════════════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════════════════

export default function Step2InputsPage() {
  // ─── الحالة ───
  const [weapon, setWeapon] = useState<WeaponFields>(DEFAULT_WEAPON);
  const [site, setSite] = useState<SiteFields>(DEFAULT_SITE);
  const [material, setMaterial] = useState<MaterialFields>(DEFAULT_MATERIAL);

  // ─── اختيار السلاح — تعبئة تلقائية ───
  const handleWeaponSelect = useCallback((weaponId: string) => {
    const selected = WEAPONS.find((w) => w.id === weaponId);
    if (selected) {
      setWeapon((prev) => ({
        ...prev,
        weaponId: selected.id,
        P: selected.weightKg,
        dk: selected.diameterMeters,
        ldRatio: selected.ldRatio,
        lhdRatio: selected.lhdRatio,
        C: selected.chargeKg,
        explosive: selected.explosive,
        // نحتفظ بقيم V و alpha من المستخدم
        V: prev.V,
        alpha: prev.alpha,
      }));
    }
  }, []);

  // ─── اختيار التربة — تعبئة تلقائية ───
  const handleSoilSelect = useCallback((soilCode: string) => {
    const selected = SOILS.find((s) => s.code === soilCode);
    if (selected) {
      setSite((prev) => ({
        ...prev,
        soilCode: selected.code,
      }));
      setMaterial((prev) => ({
        ...prev,
        gamma_g: selected.densityKgM3,
      }));
    }
  }, []);

  // ─── الحسابات المشتقة ───
  const K1 = useMemo(() => getExplosiveK1(weapon.explosive), [weapon.explosive]);

  const currentSoil = useMemo(
    () => SOILS.find((s) => s.code === site.soilCode),
    [site.soilCode]
  );

  const kpr_g = useMemo(() => {
    if (!currentSoil) return 0;
    return currentSoil.kp * 1e6; // تحويل من xx e-6 إلى رقم عادي في الجدول
  }, [currentSoil]);

  const C_ef = useMemo(() => {
    return 0.95 * K1 * weapon.C;
  }, [K1, weapon.C]);

  // ─── حالة الاكتمال ───
  const weaponComplete = weapon.weaponId !== '' && weapon.P > 0 && weapon.V > 0 && weapon.C > 0 && weapon.dk > 0;
  const siteComplete = site.soilCode !== '' && site.Z > 0 && site.ap > 0 && site.bp > 0;
  const materialComplete = material.fc > 0 && material.fy > 0 && material.RbH > 0 && material.RsH > 0 && material.gamma_b > 0 && material.gamma_g > 0;
  const allComplete = weaponComplete && siteComplete && materialComplete;

  // ─── إعادة تعيين ───
  const handleReset = useCallback(() => {
    setWeapon(DEFAULT_WEAPON);
    setSite(DEFAULT_SITE);
    setMaterial(DEFAULT_MATERIAL);
  }, []);

  // ─── مُحدِّث حقول السلاح ───
  const updateWeapon = useCallback(<K extends keyof WeaponFields>(key: K, value: WeaponFields[K]) => {
    setWeapon((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSite = useCallback(<K extends keyof SiteFields>(key: K, value: SiteFields[K]) => {
    setSite((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateMaterial = useCallback(<K extends keyof MaterialFields>(key: K, value: MaterialFields[K]) => {
    setMaterial((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── مقارنة مع BMK-02 ───
  const bmkWeapon: WeaponFields = {
    weaponId: 'W_MK83',
    P: STEP2_INPUTS.P,
    V: STEP2_INPUTS.V,
    alpha: STEP2_INPUTS.alpha,
    dk: STEP2_INPUTS.dk,
    ldRatio: STEP2_INPUTS.ld_ratio,
    lhdRatio: STEP2_INPUTS.lhd_ratio,
    C: STEP2_INPUTS.C,
    explosive: 'Tritonal_80_20',
  };

  const bmkSite: SiteFields = {
    soilCode: 'MEDIUM_SOIL',
    Z: STEP2_INPUTS.Z,
    ap: STEP2_GEOMETRY.ap,
    bp: STEP2_GEOMETRY.bp,
    a_et: STEP2_GEOMETRY.a_et,
    Lk: STEP2_GEOMETRY.Lk,
    Bk: STEP2_GEOMETRY.Bk,
    Pk: STEP2_GEOMETRY.Pk,
  };

  const bmkMaterial: MaterialFields = {
    fc: 25,
    fy: 400,
    RbH: STEP2_LOOKUPS.RbH,
    RsH: STEP2_LOOKUPS.RsH,
    gamma_b: STEP2_LOOKUPS.gamma_b,
    gamma_g: STEP2_LOOKUPS.gamma_g,
  };

  // ═══════════════════════════════════════════════════════════════════════
  // العرض
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" dir="rtl">
      {/* ─── رأس الصفحة ─── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              الخطوة 2 — المدخلات والجداول المرجعية
            </h1>
            <p className="text-sm text-slate-500">
              إكسيل 1 — تعريف بيانات السلاح والموقع والمواد
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-400/15 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/20">
            إكسيل 1
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            الكود السوري 2024
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="h-4 w-4 ml-1" />
            إعادة تعيين
          </Button>
        </div>
      </div>

      {/* ─── القسم أ: بيانات السلاح ─── */}
      <Card className="mb-6 bg-slate-900/50 border-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Crosshair className="h-5 w-5 text-emerald-400" />
            القسم أ — بيانات السلاح
            <Badge
              className={`mr-auto ${
                weaponComplete
                  ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
                  : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
              }`}
            >
              {weaponComplete ? (
                <>
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  مكتمل
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 ml-1" />
                  ناقص
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* اختيار السلاح */}
          <div className="mb-4">
            <Label className="text-slate-400 mb-2 block text-sm">
              اختر السلاح من المكتبة
            </Label>
            <Select value={weapon.weaponId} onValueChange={handleWeaponSelect}>
              <SelectTrigger className="w-full bg-slate-800/60 border-slate-700 text-slate-200">
                <SelectValue placeholder="اختر سلاحاً..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-72">
                {WEAPONS.map((w) => (
                  <SelectItem
                    key={w.id}
                    value={w.id}
                    className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                  >
                    {w.nameAr} ({w.name}) — {w.weightKg} كغ
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* حقول بيانات السلاح */}
          <div className="overflow-x-auto rounded-lg border border-slate-800/60">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الرمز</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوصف</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">القيمة</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوحدة</TableHead>
                  <TableHead className="text-right text-emerald-400/80 bg-slate-900/80">BMK-02</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">المطابقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FieldRow
                  symbol="P"
                  label="وزن القنبلة"
                  value={weapon.P}
                  bmkValue={bmkWeapon.P}
                  unit="كغ"
                  onChange={(v) => updateWeapon('P', v)}
                />
                <FieldRow
                  symbol="V"
                  label="سرعة الاصطدام"
                  value={weapon.V}
                  bmkValue={bmkWeapon.V}
                  unit="م/ث"
                  onChange={(v) => updateWeapon('V', v)}
                />
                <FieldRow
                  symbol="α"
                  label="زاوية الاصطدام"
                  value={weapon.alpha}
                  bmkValue={bmkWeapon.alpha}
                  unit="درجة"
                  onChange={(v) => updateWeapon('alpha', v)}
                />
                <FieldRow
                  symbol="dk"
                  label="قطر القنبلة"
                  value={weapon.dk}
                  bmkValue={bmkWeapon.dk}
                  unit="م"
                  onChange={(v) => updateWeapon('dk', v)}
                />
                <FieldRow
                  symbol="L/D"
                  label="نسبة الطول للقطر"
                  value={weapon.ldRatio}
                  bmkValue={bmkWeapon.ldRatio}
                  unit="—"
                  onChange={(v) => updateWeapon('ldRatio', v)}
                />
                <FieldRow
                  symbol="Lh/D"
                  label="نسبة طول الرأس للقطر"
                  value={weapon.lhdRatio}
                  bmkValue={bmkWeapon.lhdRatio}
                  unit="—"
                  onChange={(v) => updateWeapon('lhdRatio', v)}
                />
                <FieldRow
                  symbol="C"
                  label="وزن الشحنة المتفجرة"
                  value={weapon.C}
                  bmkValue={bmkWeapon.C}
                  unit="كغ"
                  onChange={(v) => updateWeapon('C', v)}
                />
                {/* نوع المتفجرات — قائمة */}
                <TableRow className="border-slate-800/40">
                  <TableCell className="text-emerald-400 font-mono font-semibold">
                    متفجرات
                  </TableCell>
                  <TableCell className="text-slate-300">نوع المتفجرات</TableCell>
                  <TableCell>
                    <Select
                      value={weapon.explosive}
                      onValueChange={(v) => updateWeapon('explosive', v)}
                    >
                      <SelectTrigger className="w-full bg-slate-800/60 border-slate-700 text-slate-200 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Tritonal_80_20" className="text-slate-200">Tritonal 80/20</SelectItem>
                        <SelectItem value="Mixture_V" className="text-slate-200">Mixture V</SelectItem>
                        <SelectItem value="Torpex_H6" className="text-slate-200">Torpex H6</SelectItem>
                        <SelectItem value="Tritonal_90_40" className="text-slate-200">Tritonal 90/40</SelectItem>
                        <SelectItem value="Ednaloud" className="text-slate-200">Ednaloud</SelectItem>
                        <SelectItem value="TNT" className="text-slate-200">TNT</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">—</TableCell>
                  <TableCell className="text-emerald-400/80 font-mono text-xs">
                    Tritonal 80/20
                  </TableCell>
                  <TableCell>
                    <MatchBadge
                      current={weapon.explosive}
                      reference="Tritonal_80_20"
                      isString
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── القسم ب: الموقع والأبعاد ─── */}
      <Card className="mb-6 bg-slate-900/50 border-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <MapPin className="h-5 w-5 text-emerald-400" />
            القسم ب — الموقع والأبعاد
            <Badge
              className={`mr-auto ${
                siteComplete
                  ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
                  : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
              }`}
            >
              {siteComplete ? (
                <>
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  مكتمل
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 ml-1" />
                  ناقص
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* اختيار التربة */}
          <div className="mb-4">
            <Label className="text-slate-400 mb-2 block text-sm">
              نوع التربة
            </Label>
            <Select value={site.soilCode} onValueChange={handleSoilSelect}>
              <SelectTrigger className="w-full bg-slate-800/60 border-slate-700 text-slate-200">
                <SelectValue placeholder="اختر نوع التربة..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {SOILS.map((s) => (
                  <SelectItem
                    key={s.code}
                    value={s.code}
                    className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                  >
                    {s.nameAr} — Kpr = {s.kp.toExponential(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentSoil && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                  Kp = {currentSoil.kp.toExponential(2)}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                  Kv = {currentSoil.kv}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                  ρ = {currentSoil.densityKgM3} كغ/م³
                </Badge>
              </div>
            )}
          </div>

          {/* حقول الموقع والأبعاد */}
          <div className="overflow-x-auto rounded-lg border border-slate-800/60">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الرمز</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوصف</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">القيمة</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوحدة</TableHead>
                  <TableHead className="text-right text-emerald-400/80 bg-slate-900/80">BMK-02</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">المطابقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FieldRow
                  symbol="Z"
                  label="عمق السقف"
                  value={site.Z}
                  bmkValue={bmkSite.Z}
                  unit="م"
                  onChange={(v) => updateSite('Z', v)}
                />
                <FieldRow
                  symbol="ap"
                  label="البحر القصير"
                  value={site.ap}
                  bmkValue={bmkSite.ap}
                  unit="م"
                  onChange={(v) => updateSite('ap', v)}
                />
                <FieldRow
                  symbol="bp"
                  label="البحر الطويل"
                  value={site.bp}
                  bmkValue={bmkSite.bp}
                  unit="م"
                  onChange={(v) => updateSite('bp', v)}
                />
                <FieldRow
                  symbol="a_et"
                  label="عرض الممر"
                  value={site.a_et}
                  bmkValue={bmkSite.a_et}
                  unit="م"
                  onChange={(v) => updateSite('a_et', v)}
                />
                <FieldRow
                  symbol="Lk"
                  label="طول النفق"
                  value={site.Lk}
                  bmkValue={bmkSite.Lk}
                  unit="م"
                  onChange={(v) => updateSite('Lk', v)}
                />
                <FieldRow
                  symbol="Bk"
                  label="عرض النفق"
                  value={site.Bk}
                  bmkValue={bmkSite.Bk}
                  unit="م"
                  onChange={(v) => updateSite('Bk', v)}
                />
                <FieldRow
                  symbol="Pk"
                  label="المحيط"
                  value={site.Pk}
                  bmkValue={bmkSite.Pk}
                  unit="م"
                  onChange={(v) => updateSite('Pk', v)}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── القسم ج: خصائص المواد ─── */}
      <Card className="mb-6 bg-slate-900/50 border-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Cuboid className="h-5 w-5 text-emerald-400" />
            القسم ج — خصائص المواد
            <Badge
              className={`mr-auto ${
                materialComplete
                  ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
                  : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
              }`}
            >
              {materialComplete ? (
                <>
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  مكتمل
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 ml-1" />
                  ناقص
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-800/60">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الرمز</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوصف</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">القيمة</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوحدة</TableHead>
                  <TableHead className="text-right text-emerald-400/80 bg-slate-900/80">BMK-02</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">المطابقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FieldRow
                  symbol="fc"
                  label="مقاومة الضغط للخرسانة"
                  value={material.fc}
                  bmkValue={bmkMaterial.fc}
                  unit="MPa"
                  onChange={(v) => updateMaterial('fc', v)}
                />
                <FieldRow
                  symbol="fy"
                  label="إجهاد الخضوع للحديد"
                  value={material.fy}
                  bmkValue={bmkMaterial.fy}
                  unit="MPa"
                  onChange={(v) => updateMaterial('fy', v)}
                />
                <FieldRow
                  symbol="RbH"
                  label="مقاومة الخرسانة (كغ/سم²)"
                  value={material.RbH}
                  bmkValue={bmkMaterial.RbH}
                  unit="كغ/سم²"
                  onChange={(v) => updateMaterial('RbH', v)}
                />
                <FieldRow
                  symbol="RsH"
                  label="إجهاد خضوع الحديد (كغ/سم²)"
                  value={material.RsH}
                  bmkValue={bmkMaterial.RsH}
                  unit="كغ/سم²"
                  onChange={(v) => updateMaterial('RsH', v)}
                />
                <FieldRow
                  symbol="γb"
                  label="كثافة الخرسانة"
                  value={material.gamma_b}
                  bmkValue={bmkMaterial.gamma_b}
                  unit="كغ/م³"
                  onChange={(v) => updateMaterial('gamma_b', v)}
                />
                <FieldRow
                  symbol="γg"
                  label="كثافة التربة"
                  value={material.gamma_g}
                  bmkValue={bmkMaterial.gamma_g}
                  unit="كغ/م³"
                  onChange={(v) => updateMaterial('gamma_g', v)}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── قسم النتائج: المعاملات المستخرجة ─── */}
      <Card className="mb-6 bg-slate-900/50 border-slate-800/60 border-emerald-400/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Calculator className="h-5 w-5 text-emerald-400" />
            المعاملات المستخرجة من الجداول
            <Badge
              className={`mr-auto ${
                allComplete
                  ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
                  : 'bg-red-400/15 text-red-400 border-red-400/30'
              }`}
            >
              {allComplete ? (
                <>
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  جاهز للحساب
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 ml-1" />
                  حقول ناقصة
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-800/60">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الرمز</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوصف</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">القيمة الحالية</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">الوحدة</TableHead>
                  <TableHead className="text-right text-emerald-400/80 bg-slate-900/80">BMK-02</TableHead>
                  <TableHead className="text-right text-slate-400 bg-slate-900/80">المطابقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-slate-800/40">
                  <TableCell className="text-emerald-400 font-mono font-semibold">K₁</TableCell>
                  <TableCell className="text-slate-300">معامل المتفجرات</TableCell>
                  <TableCell className="text-slate-100 font-mono">{K1.toFixed(3)}</TableCell>
                  <TableCell className="text-slate-500 text-xs">—</TableCell>
                  <TableCell className="text-emerald-400/80 font-mono text-xs">
                    {STEP2_LOOKUPS.K1.toFixed(3)}
                  </TableCell>
                  <TableCell>
                    <MatchBadge
                      current={K1}
                      reference={STEP2_LOOKUPS.K1}
                    />
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-800/40">
                  <TableCell className="text-emerald-400 font-mono font-semibold">kpr_g</TableCell>
                  <TableCell className="text-slate-300">معامل اختراق التربة</TableCell>
                  <TableCell className="text-slate-100 font-mono">
                    {currentSoil ? currentSoil.kp.toExponential(2) : '—'}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">—</TableCell>
                  <TableCell className="text-emerald-400/80 font-mono text-xs">
                    {STEP2_LOOKUPS.kpr_g.toExponential(2)}
                  </TableCell>
                  <TableCell>
                    {currentSoil ? (
                      <MatchBadge
                        current={currentSoil.kp}
                        reference={STEP2_LOOKUPS.kpr_g}
                      />
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-800/40">
                  <TableCell className="text-emerald-400 font-mono font-semibold">RbH</TableCell>
                  <TableCell className="text-slate-300">مقاومة الخرسانة</TableCell>
                  <TableCell className="text-slate-100 font-mono">{material.RbH}</TableCell>
                  <TableCell className="text-slate-500 text-xs">كغ/سم²</TableCell>
                  <TableCell className="text-emerald-400/80 font-mono text-xs">
                    {STEP2_LOOKUPS.RbH}
                  </TableCell>
                  <TableCell>
                    <MatchBadge current={material.RbH} reference={STEP2_LOOKUPS.RbH} />
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-800/40">
                  <TableCell className="text-emerald-400 font-mono font-semibold">RsH</TableCell>
                  <TableCell className="text-slate-300">إجهاد خضوع الحديد</TableCell>
                  <TableCell className="text-slate-100 font-mono">{material.RsH}</TableCell>
                  <TableCell className="text-slate-500 text-xs">كغ/سم²</TableCell>
                  <TableCell className="text-emerald-400/80 font-mono text-xs">
                    {STEP2_LOOKUPS.RsH}
                  </TableCell>
                  <TableCell>
                    <MatchBadge current={material.RsH} reference={STEP2_LOOKUPS.RsH} />
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-800/40">
                  <TableCell className="text-emerald-400 font-mono font-semibold">γb</TableCell>
                  <TableCell className="text-slate-300">كثافة الخرسانة</TableCell>
                  <TableCell className="text-slate-100 font-mono">{material.gamma_b}</TableCell>
                  <TableCell className="text-slate-500 text-xs">كغ/م³</TableCell>
                  <TableCell className="text-emerald-400/80 font-mono text-xs">
                    {STEP2_LOOKUPS.gamma_b}
                  </TableCell>
                  <TableCell>
                    <MatchBadge current={material.gamma_b} reference={STEP2_LOOKUPS.gamma_b} />
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-800/40">
                  <TableCell className="text-emerald-400 font-mono font-semibold">γg</TableCell>
                  <TableCell className="text-slate-300">كثافة التربة</TableCell>
                  <TableCell className="text-slate-100 font-mono">{material.gamma_g}</TableCell>
                  <TableCell className="text-slate-500 text-xs">كغ/م³</TableCell>
                  <TableCell className="text-emerald-400/80 font-mono text-xs">
                    {STEP2_LOOKUPS.gamma_g}
                  </TableCell>
                  <TableCell>
                    <MatchBadge current={material.gamma_g} reference={STEP2_LOOKUPS.gamma_g} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* معاينة حساب C_ef */}
          <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">معاينة الحساب</span>
            </div>
            <div className="font-mono text-sm text-slate-300 space-y-1" dir="ltr">
              <p>
                C_ef = 0.95 × K₁ × C
              </p>
              <p>
                C_ef = 0.95 × {K1.toFixed(3)} × {weapon.C}
              </p>
              <p className="text-emerald-400 font-bold text-base">
                C_ef = {C_ef.toFixed(4)} كغ
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">القيمة المرجعية BMK-02:</span>
              <span className="text-emerald-400/80 font-mono">
                C_ef = {STEP3_PENETRATION_C_EF.toFixed(4)} كغ
              </span>
              <MatchBadge
                current={C_ef}
                reference={STEP3_PENETRATION_C_EF}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── أزرار التنقل ─── */}
      <div className="flex items-center justify-between mt-8 pb-8">
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            لوحة التحكم
          </Button>
        </Link>
        <Link href="/dashboard/step3-penetration">
          <Button
            className={`${
              allComplete
                ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            } font-semibold`}
          >
            التالي ← الاختراق
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكوّنات مساعدة
// ═══════════════════════════════════════════════════════════════════════

/** صف حقل إدخال في الجدول */
function FieldRow({
  symbol,
  label,
  value,
  bmkValue,
  unit,
  onChange,
}: {
  symbol: string;
  label: string;
  value: number;
  bmkValue: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <TableRow className="border-slate-800/40">
      <TableCell className="text-emerald-400 font-mono font-semibold">
        {symbol}
      </TableCell>
      <TableCell className="text-slate-300">{label}</TableCell>
      <TableCell>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="w-28 h-8 text-sm font-mono bg-slate-800/60 border-slate-700 text-slate-200 focus:border-emerald-400/50 focus:ring-emerald-400/20"
          step="any"
        />
      </TableCell>
      <TableCell className="text-slate-500 text-xs">{unit}</TableCell>
      <TableCell className="text-emerald-400/80 font-mono text-xs">
        {bmkValue}
      </TableCell>
      <TableCell>
        <MatchBadge current={value} reference={bmkValue} />
      </TableCell>
    </TableRow>
  );
}

/** شارة المطابقة — تقارن القيمة الحالية بالمرجعية */
function MatchBadge({
  current,
  reference,
  isString = false,
}: {
  current: number | string;
  reference: number | string;
  isString?: boolean;
}) {
  if (isString) {
    const match = current === reference;
    return (
      <Badge
        className={`text-xs ${
          match
            ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
            : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
        }`}
      >
        {match ? 'مطابق' : 'مختلف'}
      </Badge>
    );
  }

  const currentNum = current as number;
  const referenceNum = reference as number;

  if (referenceNum === 0) {
    return <span className="text-slate-600 text-xs">—</span>;
  }

  const deviation = Math.abs((currentNum - referenceNum) / referenceNum) * 100;

  if (deviation < 0.01) {
    return (
      <Badge className="text-xs bg-emerald-400/15 text-emerald-400 border-emerald-400/30">
        ✓ مطابق
      </Badge>
    );
  }
  if (deviation < 5) {
    return (
      <Badge className="text-xs bg-amber-400/15 text-amber-400 border-amber-400/30">
        Δ {deviation.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge className="text-xs bg-red-400/15 text-red-400 border-red-400/30">
      Δ {deviation.toFixed(1)}%
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ثوابت مساعدة
// ═══════════════════════════════════════════════════════════════════════

/** القيمة المقفلة C_ef من الخطوة 3 — BMK-02 */
const STEP3_PENETRATION_C_EF = 334.76575;
