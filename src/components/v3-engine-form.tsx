// ═══════════════════════════════════════════════════════════════════════
// استمارة محرك V3.0 — V3EngineForm
// منصة المدقق الديناميكي الموحد V3.0
// تجمع مدخلات الاختراق والانفجار والتصميم في استمارة واحدة
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useCallback } from 'react';
import { WEAPONS, SOILS } from '@/lib/engine';
import type { EngineInput, WeaponData, SoilTypeCode } from '@/lib/engine';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bomb,
  Mountain,
  Ruler,
  Crosshair,
  Triangle,
  ArrowDownFromLine,
  Square,
  RectangleHorizontal,
  FlaskConical,
  Construction,
  Loader2,
  Zap,
} from 'lucide-react';

// ─── الخصائص ────────────────────────────────────────────────────────

export interface V3EngineFormProps {
  onCalculate: (input: EngineInput) => void;
  isCalculating: boolean;
  defaultValues?: Partial<EngineInput>;
}

// ─── المكون الرئيسي ────────────────────────────────────────────────

export function V3EngineForm({
  onCalculate,
  isCalculating,
  defaultValues,
}: V3EngineFormProps) {
  // ─── حالة النموذج ───
  const [weaponId, setWeaponId] = useState<string>(
    defaultValues?.penetration?.weaponId ?? WEAPONS[4]?.id ?? ''
  );
  const [soilTypeCode, setSoilTypeCode] = useState<SoilTypeCode>(
    defaultValues?.penetration?.soilTypeCode ?? 'MEDIUM_SOIL'
  );
  const [impactVelocity, setImpactVelocity] = useState<number>(
    defaultValues?.penetration?.impactVelocity ?? 350
  );
  const [impactAngleDeg, setImpactAngleDeg] = useState<number>(
    defaultValues?.penetration?.impactAngleDeg ?? 20
  );
  const [ceilingDepth, setCeilingDepth] = useState<number>(
    defaultValues?.blast?.ceilingDepth ?? 3.7
  );
  const [tunnelSpanShort, setTunnelSpanShort] = useState<number>(
    defaultValues?.design?.tunnelSpanShort ?? 4
  );
  const [tunnelSpanLong, setTunnelSpanLong] = useState<number>(
    defaultValues?.design?.tunnelSpanLong ?? 5
  );
  const [fcMpa, setFcMpa] = useState<number>(
    defaultValues?.design?.fcMpa ?? 30
  );
  const [fyMpa, setFyMpa] = useState<number>(
    defaultValues?.design?.fyMpa ?? 400
  );

  // ─── السلاح المختار ───
  const selectedWeapon: WeaponData | undefined = WEAPONS.find(
    (w) => w.id === weaponId
  );

  // ─── معالجة الحساب ───
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const input: EngineInput = {
        penetration: {
          weaponId,
          impactVelocity,
          soilTypeCode,
          impactAngleDeg,
        },
        blast: {
          radialDistance: ceilingDepth,
          ceilingDepth,
        },
        design: {
          tunnelSpanShort,
          tunnelSpanLong,
          fcMpa,
          fyMpa,
        },
      };

      onCalculate(input);
    },
    [
      weaponId,
      impactVelocity,
      soilTypeCode,
      impactAngleDeg,
      ceilingDepth,
      tunnelSpanShort,
      tunnelSpanLong,
      fcMpa,
      fyMpa,
      onCalculate,
    ]
  );

  // ─── مساعد حقول الأرقام ───
  const handleNumberChange = (
    setter: (v: number) => void
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setter(val === '' ? 0 : parseFloat(val));
  };

  return (
    <Card className="bg-slate-900 border-slate-800 text-slate-100" dir="rtl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-amber-400 flex items-center gap-2">
          <Zap className="size-5" />
          منصة المدقق الديناميكي الموحد V3.0
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          استمارة إدخال المحرك الموحد — اختراق · انفجار · تصميم إنشائي
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ═══ القسم الأول: مدخلات الاختراق ═══ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Crosshair className="size-4 text-amber-500" />
              <h3 className="text-sm font-bold text-amber-500">
                مدخلات الاختراق
              </h3>
              <Separator className="flex-1 bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* اختيار السلاح */}
              <div className="sm:col-span-2 lg:col-span-3">
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Bomb className="size-3.5" />
                  نوع الذخيرة
                </Label>
                <Select value={weaponId} onValueChange={setWeaponId}>
                  <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200 h-10">
                    <SelectValue placeholder="اختر الذخيرة..." />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-slate-950 border-slate-700 max-h-80"
                    position="popper"
                  >
                    {WEAPONS.map((w) => (
                      <SelectItem
                        key={w.id}
                        value={w.id}
                        className="text-slate-200 focus:bg-slate-800 focus:text-amber-300"
                      >
                        <span className="font-medium">{w.nameAr}</span>
                        <span className="text-slate-500 text-xs mr-2">
                          ({w.weightKg} كجم · {w.chargeKg} كجم شحنة)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* بطاقة معلومات السلاح */}
              {selectedWeapon && (
                <div className="sm:col-span-2 lg:col-span-3 mb-1">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-wrap gap-3 items-center">
                    <Badge
                      variant="outline"
                      className="border-amber-700/50 text-amber-400 bg-amber-950/30 text-xs"
                    >
                      {selectedWeapon.origin === 'RU' ? '🇷🇺 روسي' : '🇺🇸 أمريكي'}
                    </Badge>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                      <span>
                        الوزن:{' '}
                        <span className="text-slate-200 font-mono">
                          {selectedWeapon.weightKg}
                        </span>{' '}
                        كجم
                      </span>
                      <span>
                        القطر:{' '}
                        <span className="text-slate-200 font-mono">
                          {selectedWeapon.diameterMeters}
                        </span>{' '}
                        م
                      </span>
                      <span>
                        الشحنة:{' '}
                        <span className="text-slate-200 font-mono">
                          {selectedWeapon.chargeKg}
                        </span>{' '}
                        كجم
                      </span>
                      <span>
                        المتفجرات:{' '}
                        <span className="text-amber-300 font-mono">
                          {selectedWeapon.explosive}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* نوع التربة */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Mountain className="size-3.5" />
                  نوع التربة
                </Label>
                <Select
                  value={soilTypeCode}
                  onValueChange={(v) => setSoilTypeCode(v as SoilTypeCode)}
                >
                  <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200 h-10">
                    <SelectValue placeholder="اختر التربة..." />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-slate-950 border-slate-700"
                    position="popper"
                  >
                    {SOILS.map((s) => (
                      <SelectItem
                        key={s.code}
                        value={s.code}
                        className="text-slate-200 focus:bg-slate-800 focus:text-amber-300"
                      >
                        {s.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* سرعة الاصطدام */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <ArrowDownFromLine className="size-3.5" />
                  سرعة الاصطدام (م/ث)
                </Label>
                <Input
                  type="number"
                  value={impactVelocity}
                  onChange={handleNumberChange(setImpactVelocity)}
                  step={10}
                  min={0}
                  className="bg-slate-950 border-slate-700 text-slate-200 font-mono h-10"
                />
              </div>

              {/* زاوية الاصطدام */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Triangle className="size-3.5" />
                  زاوية الاصطدام (درجة)
                </Label>
                <Input
                  type="number"
                  value={impactAngleDeg}
                  onChange={handleNumberChange(setImpactAngleDeg)}
                  step={1}
                  min={0}
                  max={90}
                  className="bg-slate-950 border-slate-700 text-slate-200 font-mono h-10"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-slate-800" />

          {/* ═══ القسم الثاني: مدخلات الانفجار ═══ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bomb className="size-4 text-red-500" />
              <h3 className="text-sm font-bold text-red-500">
                مدخلات الانفجار
              </h3>
              <Separator className="flex-1 bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* عمق السقف (Z) */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Ruler className="size-3.5" />
                  عمق السقف Z (م)
                </Label>
                <Input
                  type="number"
                  value={ceilingDepth}
                  onChange={handleNumberChange(setCeilingDepth)}
                  step={0.1}
                  min={0}
                  className="bg-slate-950 border-slate-700 text-slate-200 font-mono h-10"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  البعد الشعاعي + عمق السقف فوق مركز الانفجار
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-slate-800" />

          {/* ═══ القسم الثالث: مدخلات التصميم ═══ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Construction className="size-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-500">
                مدخلات التصميم
              </h3>
              <Separator className="flex-1 bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* بحر النفق القصير */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Square className="size-3.5" />
                  بحر النفق القصير ap (م)
                </Label>
                <Input
                  type="number"
                  value={tunnelSpanShort}
                  onChange={handleNumberChange(setTunnelSpanShort)}
                  step={0.5}
                  min={0}
                  className="bg-slate-950 border-slate-700 text-slate-200 font-mono h-10"
                />
              </div>

              {/* بحر النفق الطويل */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <RectangleHorizontal className="size-3.5" />
                  بحر النفق الطويل bp (م)
                </Label>
                <Input
                  type="number"
                  value={tunnelSpanLong}
                  onChange={handleNumberChange(setTunnelSpanLong)}
                  step={0.5}
                  min={0}
                  className="bg-slate-950 border-slate-700 text-slate-200 font-mono h-10"
                />
              </div>

              {/* مقاومة الخرسانة */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <FlaskConical className="size-3.5" />
                  مقاومة الخرسانة f&apos;c (MPa)
                </Label>
                <Input
                  type="number"
                  value={fcMpa}
                  onChange={handleNumberChange(setFcMpa)}
                  step={1}
                  min={0}
                  className="bg-slate-950 border-slate-700 text-slate-200 font-mono h-10"
                />
              </div>

              {/* إجهاد خضوع الحديد */}
              <div>
                <Label className="text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Construction className="size-3.5" />
                  إجهاد خضوع الحديد fy (MPa)
                </Label>
                <Input
                  type="number"
                  value={fyMpa}
                  onChange={handleNumberChange(setFyMpa)}
                  step={10}
                  min={0}
                  className="bg-slate-950 border-slate-700 text-slate-200 font-mono h-10"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-slate-800" />

          {/* ═══ زر الحساب ═══ */}
          <Button
            type="submit"
            disabled={isCalculating || !weaponId}
            className="w-full h-11 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            {isCalculating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الحساب...
              </>
            ) : (
              <>
                <Zap className="size-4" />
                تشغيل المحرك الموحد V3.0
              </>
            )}
          </Button>

          {/* ملخص المدخلات */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              {selectedWeapon?.nameAr ?? '—'}
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              {SOILS.find((s) => s.code === soilTypeCode)?.nameAr ?? '—'}
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              V={impactVelocity} م/ث
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              θ={impactAngleDeg}°
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              Z={ceilingDepth} م
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              {tunnelSpanShort}×{tunnelSpanLong} م
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              f&apos;c={fcMpa} MPa
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-500 text-[10px]"
            >
              fy={fyMpa} MPa
            </Badge>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
