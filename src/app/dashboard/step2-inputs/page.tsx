// ═══════════════════════════════════════════════════════════════════════
// الخطوة 2 — واجهة إدخال المعطيات الشاملة
// منصة المدقق الديناميكي الموحد V3.1
// الواجهة الرئيسية التي يدخل منها المستخدم معطيات التصميم
// ثم يُشغّل المحرك للحصول على التصميم الكامل
// RTL Arabic | Dark Theme | Responsive
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
import { useEngine, DEFAULT_USER_INPUT, type UserInputForm } from '@/lib/engine/engine-context';
import { WEAPONS, SOILS } from '@/lib/engine/constants';
import type { SoilTypeCode } from '@/lib/engine/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Crosshair,
  Layers,
  Shield,
  Building2,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Zap,
  ChevronLeft,
  Info,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// مكون حقل إدخال رقمي مع وحدة
// ═══════════════════════════════════════════════════════════════════════

interface NumberFieldProps {
  label: string;
  symbol: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

function NumberField({ label, symbol, unit, value, onChange, min, max, step = 0.01, description }: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300 text-xs flex items-center gap-1.5">
        <span className="text-cyan-400 font-mono">{symbol}</span>
        <span>{label}</span>
        <span className="text-slate-500">({unit})</span>
      </Label>
      {description && (
        <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
      )}
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="bg-slate-900/80 border-slate-700 text-slate-100 font-mono text-sm h-9 focus:border-cyan-500 focus:ring-cyan-500/20"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// درجات الخرسانة والحديد
// ═══════════════════════════════════════════════════════════════════════

const CONCRETE_GRADES = [
  { grade: 'B150', fcMpa: 15, RbH: 150, labelAr: 'بيتون عادي 150 كغ/سم²' },
  { grade: 'B200', fcMpa: 20, RbH: 200, labelAr: 'بيتون عادي 200 كغ/سم²' },
  { grade: 'B225', fcMpa: 22.5, RbH: 225, labelAr: 'بيتون عادي 225 كغ/سم²' },
  { grade: 'B250', fcMpa: 25, RbH: 250, labelAr: 'بيتون مسلح 250 كغ/سم²' },
  { grade: 'B300', fcMpa: 30, RbH: 300, labelAr: 'بيتون مسلح 300 كغ/سم²' },
  { grade: 'B350', fcMpa: 35, RbH: 350, labelAr: 'بيتون مسلح 350 كغ/سم²' },
  { grade: 'B400', fcMpa: 40, RbH: 400, labelAr: 'بيتون عالي المقاومة 400 كغ/سم²' },
];

const STEEL_GRADES = [
  { grade: 'A240', fyMpa: 240, labelAr: 'حديد عادي 2400 كغ/سم²' },
  { grade: 'A300', fyMpa: 300, labelAr: 'حديد متوسط 3000 كغ/سم²' },
  { grade: 'A400', fyMpa: 400, labelAr: 'حديد عالي المقاومة 4000 كغ/سم²' },
  { grade: 'A500', fyMpa: 500, labelAr: 'حديد عالي المقاومة 5000 كغ/سم²' },
  { grade: 'A600', fyMpa: 600, labelAr: 'حديد خاص 6000 كغ/سم²' },
];

// ═══════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════

export default function Step2InputsPage() {
  const { userInput, updateField, updateFields, resetInputs, runComputation, isComputing, engineOutput, hasComputed, error } = useEngine();

  // بيانات السلاح المختار
  const selectedWeapon = useMemo(() => {
    return WEAPONS.find(w => w.id === userInput.weaponId);
  }, [userInput.weaponId]);

  // بيانات التربة المختارة
  const selectedSoil = useMemo(() => {
    return SOILS.find(s => s.code === userInput.soilTypeCode);
  }, [userInput.soilTypeCode]);

  // عند تغيير درجة الخرسانة
  const handleConcreteGradeChange = (grade: string) => {
    const cg = CONCRETE_GRADES.find(g => g.grade === grade);
    if (cg) {
      updateFields({
        concreteGrade: cg.grade,
        fcMpa: cg.fcMpa,
      });
    }
  };

  // عند تغيير درجة الحديد
  const handleSteelGradeChange = (grade: string) => {
    const sg = STEEL_GRADES.find(g => g.grade === grade);
    if (sg) {
      updateFields({
        steelGrade: sg.grade,
        fyMpa: sg.fyMpa,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* ─── الرأس ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">مدخلات التصميم</h1>
            <p className="text-xs text-slate-500">أدخل معطيات المشروع ثم اضغط &quot;احسب&quot; للحصول على التصميم الكامل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetInputs}
            className="text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
            إعادة تعيين
          </Button>
          <Button
            onClick={runComputation}
            disabled={isComputing}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6"
          >
            {isComputing ? (
              <>
                <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />
                جاري الحساب...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 ml-1.5" />
                احسب التصميم
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── رسالة خطأ ─── */}
      {error && (
        <Card className="border-red-500/30 bg-red-950/30">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* ─── رسالة نجاح ─── */}
      {hasComputed && !error && engineOutput && (
        <Card className="border-emerald-500/30 bg-emerald-950/30">
          <CardContent className="flex items-center gap-3 py-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-sm">
              تم الحساب بنجاح — انتقل إلى صفحات النتائج للاطلاع على التفاصيل
            </p>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 mr-auto">
              {engineOutput.status === 'SUCCESS' ? 'نجاح' : engineOutput.status === 'PARTIAL' ? 'جزئي' : 'فشل'}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ─── تبويبات المدخلات ─── */}
      <Tabs defaultValue="weapon" className="space-y-4">
        <TabsList className="bg-slate-900/60 border border-slate-800/60">
          <TabsTrigger value="weapon" className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-300">
            <Crosshair className="w-3.5 h-3.5 ml-1.5" />
            القنبلة والهجوم
          </TabsTrigger>
          <TabsTrigger value="site" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-300">
            <Layers className="w-3.5 h-3.5 ml-1.5" />
            الموقع والتربة
          </TabsTrigger>
          <TabsTrigger value="structure" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-300">
            <Building2 className="w-3.5 h-3.5 ml-1.5" />
            أبعاد المنشأة
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <Shield className="w-3.5 h-3.5 ml-1.5" />
            المواد
          </TabsTrigger>
        </TabsList>

        {/* ═══ تبويب القنبلة ═══ */}
        <TabsContent value="weapon">
          <Card className="border-slate-800/60 bg-slate-950/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                بيانات السلاح والهجوم
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                اختر القنبلة من المكتبة وحدد معطيات الاصطدام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* اختيار القنبلة */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-bold">اختر القنبلة من المكتبة</Label>
                <Select
                  value={userInput.weaponId}
                  onValueChange={(v) => updateField('weaponId', v)}
                >
                  <SelectTrigger className="bg-slate-900/80 border-slate-700 text-slate-100 h-10">
                    <SelectValue placeholder="اختر قنبلة..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 max-h-64">
                    {WEAPONS.map(w => (
                      <SelectItem key={w.id} value={w.id} className="text-slate-200 focus:bg-slate-800 focus:text-slate-100">
                        <span className="font-bold">{w.nameAr}</span>
                        <span className="text-slate-500 mr-2">— {w.weightKg} كغ | شحنة {w.chargeKg} كغ</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* بطاقة القنبلة المختارة */}
              {selectedWeapon && (
                <Card className="border-cyan-500/20 bg-cyan-950/20">
                  <CardContent className="py-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">الوزن الكلي</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.weightKg} kg</p>
                      </div>
                      <div>
                        <span className="text-slate-500">القطر</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.diameterMeters} m</p>
                      </div>
                      <div>
                        <span className="text-slate-500">الشحنة</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.chargeKg} kg</p>
                      </div>
                      <div>
                        <span className="text-slate-500">نسبة L/D</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.ldRatio}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">نسبة Lh/D</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.lhdRatio}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">الطول</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.lengthMeters} m</p>
                      </div>
                      <div>
                        <span className="text-slate-500">نوع المتفجرات</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.explosive}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">الأصل</span>
                        <p className="text-cyan-300 font-mono font-bold">{selectedWeapon.origin === 'US' ? 'أمريكي' : selectedWeapon.origin === 'RU' ? 'روسي' : 'أخرى'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator className="bg-slate-800/60" />

              {/* معطيات الاصطدام */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NumberField
                  label="سرعة الاصطدام"
                  symbol="V"
                  unit="m/s"
                  value={userInput.impactVelocity}
                  onChange={(v) => updateField('impactVelocity', v)}
                  min={50}
                  max={1500}
                  step={10}
                  description="السرعة عند لحظة اصطدام القنبلة بالأرض أو المنشأة"
                />
                <NumberField
                  label="زاوية الاصطدام"
                  symbol="α"
                  unit="درجة"
                  value={userInput.impactAngleDeg}
                  onChange={(v) => updateField('impactAngleDeg', v)}
                  min={0}
                  max={90}
                  step={1}
                  description="الزاوية بين مسار القنبلة والخط العمودي (0 = عمودي)"
                />
                <NumberField
                  label="زاوية ميول الجبل"
                  symbol="β"
                  unit="درجة"
                  value={userInput.slopeAngleDeg}
                  onChange={(v) => updateField('slopeAngleDeg', v)}
                  min={0}
                  max={60}
                  step={1}
                  description="زاوية ميل سطح الأرض فوق المنشأة"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ تبويب الموقع والتربة ═══ */}
        <TabsContent value="site">
          <Card className="border-slate-800/60 bg-slate-950/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                الموقع والتربة
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                حدد نوع التربة وعمق المنشأة تحت سطح الأرض
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* اختيار نوع التربة */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-bold">نوع التربة في موقع الإنشاء</Label>
                <Select
                  value={userInput.soilTypeCode}
                  onValueChange={(v) => updateField('soilTypeCode', v as SoilTypeCode)}
                >
                  <SelectTrigger className="bg-slate-900/80 border-slate-700 text-slate-100 h-10">
                    <SelectValue placeholder="اختر نوع التربة..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {SOILS.map(s => (
                      <SelectItem key={s.code} value={s.code} className="text-slate-200 focus:bg-slate-800 focus:text-slate-100">
                        <span className="font-bold">{s.nameAr}</span>
                        <span className="text-slate-500 mr-2">— كثافة {s.densityKgM3} كغ/م³</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* بطاقة التربة المختارة */}
              {selectedSoil && (
                <Card className="border-emerald-500/20 bg-emerald-950/20">
                  <CardContent className="py-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">معامل الاختراق kₚ</span>
                        <p className="text-emerald-300 font-mono font-bold">{selectedSoil.kp.toExponential(2)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">معامل السرعة kᵥ</span>
                        <p className="text-emerald-300 font-mono font-bold">{selectedSoil.kv}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">الكثافة</span>
                        <p className="text-emerald-300 font-mono font-bold">{selectedSoil.densityKgM3} kg/m³</p>
                      </div>
                      <div>
                        <span className="text-slate-500">معامل التدمير</span>
                        <p className="text-emerald-300 font-mono font-bold">{selectedSoil.destructionCoeff ?? '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator className="bg-slate-800/60" />

              {/* عمق المنشأة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField
                  label="عمق توضع المنشأة"
                  symbol="Z"
                  unit="m"
                  value={userInput.facilityDepth}
                  onChange={(v) => updateField('facilityDepth', v)}
                  min={0.5}
                  max={50}
                  step={0.1}
                  description="المسافة العمودية من سطح الأرض إلى سقف المنشأة"
                />
                <NumberField
                  label="سماكة طبقة التمويه"
                  symbol="h_obs"
                  unit="m"
                  value={userInput.concealmentThickness}
                  onChange={(v) => updateField('concealmentThickness', v)}
                  min={0}
                  max={5}
                  step={0.1}
                  description="سماكة الطبقة العلوية للتمويه والحماية"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ تبويب أبعاد المنشأة ═══ */}
        <TabsContent value="structure">
          <Card className="border-slate-800/60 bg-slate-950/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                أبعاد المنشأة
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                حدد أبعاد النفق أو المقر والسماكات الأولية المقترحة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* أبعاد المسقط */}
              <div>
                <p className="text-slate-400 text-xs font-bold mb-3 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  أبعاد المسقط الأفقي
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NumberField
                    label="المجاز القصير"
                    symbol="aₚ"
                    unit="m"
                    value={userInput.shortSpan}
                    onChange={(v) => updateField('shortSpan', v)}
                    min={1}
                    max={20}
                    step={0.5}
                    description="البحر القصير للنفق"
                  />
                  <NumberField
                    label="المجاز الطويل"
                    symbol="bₚ"
                    unit="m"
                    value={userInput.longSpan}
                    onChange={(v) => updateField('longSpan', v)}
                    min={1}
                    max={30}
                    step={0.5}
                    description="البحر الطويل للنفق"
                  />
                  <NumberField
                    label="طول المنشأة"
                    symbol="Lₖ"
                    unit="m"
                    value={userInput.facilityLength}
                    onChange={(v) => updateField('facilityLength', v)}
                    min={5}
                    max={500}
                    step={5}
                    description="الطول الكلي للمنشأة"
                  />
                  <NumberField
                    label="عرض المنشأة"
                    symbol="Bₖ"
                    unit="m"
                    value={userInput.facilityWidth}
                    onChange={(v) => updateField('facilityWidth', v)}
                    min={3}
                    max={100}
                    step={1}
                    description="العرض الكلي للمنشأة"
                  />
                </div>
              </div>

              <Separator className="bg-slate-800/60" />

              {/* الارتفاع */}
              <div>
                <p className="text-slate-400 text-xs font-bold mb-3">الارتفاع الداخلي</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberField
                    label="ارتفاع السقف الداخلي"
                    symbol="a_et"
                    unit="m"
                    value={userInput.ceilingHeight}
                    onChange={(v) => updateField('ceilingHeight', v)}
                    min={1.5}
                    max={15}
                    step={0.5}
                    description="الارتفاع الصافي داخل النفق"
                  />
                </div>
              </div>

              <Separator className="bg-slate-800/60" />

              {/* السماكات الأولية */}
              <div>
                <p className="text-slate-400 text-xs font-bold mb-3 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  السماكات الأولية المقترحة (سيتم التحقق منها حسابياً)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NumberField
                    label="سماكة السقف المقترحة"
                    symbol="Hₚ"
                    unit="cm"
                    value={userInput.initialCeilingThickness}
                    onChange={(v) => updateField('initialCeilingThickness', v)}
                    min={20}
                    max={300}
                    step={5}
                    description="السماكة الأولية المقترحة لسقف المنشأة"
                  />
                  <NumberField
                    label="سماكة الجدار الخارجي"
                    symbol="Hct"
                    unit="cm"
                    value={userInput.initialWallThickness}
                    onChange={(v) => updateField('initialWallThickness', v)}
                    min={20}
                    max={200}
                    step={5}
                    description="السماكة الأولية للجدران الخارجية"
                  />
                  <NumberField
                    label="سماكة الأرضية"
                    symbol="Hf"
                    unit="cm"
                    value={userInput.initialFloorThickness}
                    onChange={(v) => updateField('initialFloorThickness', v)}
                    min={15}
                    max={150}
                    step={5}
                    description="سماكة بلاطة الأرضية"
                  />
                  <NumberField
                    label="سماكة الجدران الداخلية"
                    symbol="Hvct"
                    unit="cm"
                    value={userInput.innerWallThickness}
                    onChange={(v) => updateField('innerWallThickness', v)}
                    min={15}
                    max={100}
                    step={5}
                    description="سماكة الجدران الداخلية الفاصلة"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ تبويب المواد ═══ */}
        <TabsContent value="materials">
          <Card className="border-slate-800/60 bg-slate-950/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                خصائص المواد الإنشائية
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                اختر درجة الخرسانة والحديد أو أدخل القيم يدوياً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* درجة الخرسانة */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-bold">درجة الخرسانة</Label>
                  <Select
                    value={userInput.concreteGrade}
                    onValueChange={handleConcreteGradeChange}
                  >
                    <SelectTrigger className="bg-slate-900/80 border-slate-700 text-slate-100 h-10">
                      <SelectValue placeholder="اختر درجة الخرسانة..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {CONCRETE_GRADES.map(g => (
                        <SelectItem key={g.grade} value={g.grade} className="text-slate-200 focus:bg-slate-800">
                          <span className="font-bold">{g.grade}</span>
                          <span className="text-slate-500 mr-2">— {g.labelAr}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* درجة الحديد */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-bold">درجة الحديد</Label>
                  <Select
                    value={userInput.steelGrade}
                    onValueChange={handleSteelGradeChange}
                  >
                    <SelectTrigger className="bg-slate-900/80 border-slate-700 text-slate-100 h-10">
                      <SelectValue placeholder="اختر درجة الحديد..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {STEEL_GRADES.map(g => (
                        <SelectItem key={g.grade} value={g.grade} className="text-slate-200 focus:bg-slate-800">
                          <span className="font-bold">{g.grade}</span>
                          <span className="text-slate-500 mr-2">— {g.labelAr}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-slate-800/60" />

              {/* القيم الرقمية */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <NumberField
                  label="مقاومة ضغط الخرسانة"
                  symbol="f'c"
                  unit="MPa"
                  value={userInput.fcMpa}
                  onChange={(v) => updateField('fcMpa', v)}
                  min={10}
                  max={60}
                  step={0.5}
                  description="المقاومة التصميمية للضغط"
                />
                <NumberField
                  label="إجهاد خضوع الحديد"
                  symbol="fy"
                  unit="MPa"
                  value={userInput.fyMpa}
                  onChange={(v) => updateField('fyMpa', v)}
                  min={200}
                  max={700}
                  step={10}
                  description="إجهاد الخضوع التصميمي"
                />
                <NumberField
                  label="كثافة الخرسانة"
                  symbol="γb"
                  unit="kg/m³"
                  value={userInput.concreteDensity}
                  onChange={(v) => updateField('concreteDensity', v)}
                  min={2000}
                  max={3000}
                  step={50}
                  description="الوزن الحجمي للخرسانة المسلحة"
                />
                <NumberField
                  label="معامل مرونة الحديد"
                  symbol="Ea"
                  unit="kg/cm²"
                  value={userInput.steelElasticModulus}
                  onChange={(v) => updateField('steelElasticModulus', v)}
                  min={1000000}
                  max={3000000}
                  step={100000}
                  description="معامل المرونة للتسليح"
                />
              </div>

              <Separator className="bg-slate-800/60" />

              {/* معاملات إضافية */}
              <div>
                <p className="text-slate-400 text-xs font-bold mb-3 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  معاملات ديناميكية إضافية (يمكن ترك القيم الافتراضية)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NumberField
                    label="معامل ديناميكي للسقف"
                    symbol="ψₚ"
                    unit="—"
                    value={userInput.psiP}
                    onChange={(v) => updateField('psiP', v)}
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    description="معامل السلوك الديناميكي للسقف"
                  />
                  <NumberField
                    label="معامل طبقة توزيع الضغط"
                    symbol="ρp.c"
                    unit="—"
                    value={userInput.rhoPc}
                    onChange={(v) => updateField('rhoPc', v)}
                    min={50}
                    max={500}
                    step={10}
                    description="معامل توزيع الضغط عبر طبقة الحماية"
                  />
                  <NumberField
                    label="معامل التربة حول الجدار"
                    symbol="ρг"
                    unit="—"
                    value={userInput.rhoG}
                    onChange={(v) => updateField('rhoG', v)}
                    min={50}
                    max={500}
                    step={10}
                    description="معامل تفاعل التربة مع الجدران"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── ملخص المدخلات ─── */}
      <Card className="border-slate-800/60 bg-slate-950/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            ملخص المدخلات الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <SummaryChip label="القنبلة" value={selectedWeapon?.nameAr ?? '—'} color="cyan" />
            <SummaryChip label="التربة" value={selectedSoil?.nameAr ?? '—'} color="emerald" />
            <SummaryChip label="السرعة" value={`${userInput.impactVelocity} m/s`} color="cyan" />
            <SummaryChip label="العمق" value={`${userInput.facilityDepth} m`} color="emerald" />
            <SummaryChip label="الخرسانة" value={userInput.concreteGrade} color="purple" />
            <SummaryChip label="الحديد" value={userInput.steelGrade} color="purple" />
            <SummaryChip label="المجاز القصير" value={`${userInput.shortSpan} m`} color="amber" />
            <SummaryChip label="المجاز الطويل" value={`${userInput.longSpan} m`} color="amber" />
            <SummaryChip label="سماكة السقف" value={`${userInput.initialCeilingThickness} cm`} color="amber" />
            <SummaryChip label="سماكة الجدار" value={`${userInput.initialWallThickness} cm`} color="amber" />
          </div>
        </CardContent>
      </Card>

      {/* ─── زر الحساب الكبير ─── */}
      <div className="flex justify-center py-4">
        <Button
          onClick={runComputation}
          disabled={isComputing}
          size="lg"
          className="bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-base px-12 h-14 shadow-lg shadow-cyan-900/30"
        >
          {isComputing ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              جاري الحساب...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 ml-2" />
              شغّل المحرك — احصل على التصميم الكامل
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// مكون مساعد — شريحة ملخص
// ═══════════════════════════════════════════════════════════════════════

function SummaryChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300',
    emerald: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-950/30 text-amber-300',
    purple: 'border-purple-500/30 bg-purple-950/30 text-purple-300',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${colorMap[color] ?? colorMap.cyan}`}>
      <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
      <p className="text-xs font-mono font-bold">{value}</p>
    </div>
  );
}
