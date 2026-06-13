/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📝 واجهة تسجيل المستخدمين — Registration Form
 * ═══════════════════════════════════════════════════════════════════════
 *
 * نموذج تسجيل المهندسين مع البيانات النقابية:
 *   - الاسم الكامل
 *   - البريد الإلكتروني
 *   - كلمة المرور + تأكيد
 *   - رقم النقابة (مطلوب للمهندسين)
 *   - التخصص الهندسي (مطلوب للمهندسين)
 *   - الدور المطلوب (مهندس / مراقب)
 *
 * جميع المدخلات تمر عبر صمام أمان Zod (RegistrationSchema)
 * ثم تُرسل إلى registerAction كـ Server Action.
 *
 * ⚠️ لا يُستخدم localStorage للبيانات الحساسة
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerAction, type RegistrationInput } from '@/app/actions/auth.actions';
import { USER_ROLES, ROLE_LABELS } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** حالة النموذج المحلية */
interface FormState {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  syndicateId: string;
  specialization: string;
  requestedRole: string;
}

/** الحالة الابتدائية للنموذج */
const INITIAL_FORM_STATE: FormState = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  syndicateId: '',
  specialization: '',
  requestedRole: USER_ROLES.ENGINEER,
};

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /** هل الدور المطلوب هو مهندس؟ (يستوجب رقم النقابة والتخصص) */
  const isEngineerRole = formState.requestedRole === USER_ROLES.ENGINEER;

  /** تحديث حقل في النموذج */
  function updateField(field: keyof FormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // مسح خطأ الحقل عند التعديل
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  /** إرسال النموذج عبر Server Action */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('displayName', formState.displayName);
      formData.append('email', formState.email);
      formData.append('password', formState.password);
      formData.append('confirmPassword', formState.confirmPassword);
      formData.append('requestedRole', formState.requestedRole);

      if (formState.syndicateId) {
        formData.append('syndicateId', formState.syndicateId);
      }
      if (formState.specialization) {
        formData.append('specialization', formState.specialization);
      }

      const result = await registerAction(formData);

      if (result.success) {
        setSuccessMessage('تم التسجيل بنجاح! حسابك بانتظار موافقة المدير الحوكمي. سيتم إشعارك عند قبول اشتراكك.');
        // تحويل إلى صفحة الانتظار بعد تسجيل ناجح
        setTimeout(() => router.push('/auth/pending'), 3000);
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        if (result.error) {
          setServerError(result.error);
        }
      }
    });
  }

  return (
    <Card className="w-full max-w-lg mx-auto border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-slate-100">
          تسجيل مهندس جديد
        </CardTitle>
        <CardDescription className="text-slate-400">
          إنشاء حساب في منصة المدقق الديناميكي الموحد V3.0
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* إشعار النجاح */}
        {successMessage && (
          <div
            className="mb-4 rounded-md bg-emerald-900/30 border border-emerald-700 p-3 text-sm text-emerald-300"
            role="alert"
          >
            {successMessage}
          </div>
        )}

        {/* إشعار خطأ الخادم */}
        {serverError && (
          <div
            className="mb-4 rounded-md bg-red-900/30 border border-red-700 p-3 text-sm text-red-300"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          {/* الاسم الكامل */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-slate-300">
              الاسم الكامل <span className="text-red-400">*</span>
            </Label>
            <Input
              id="displayName"
              type="text"
              value={formState.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              placeholder="المهندس أحمد محمد"
              className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              disabled={isPending}
              required
            />
            {fieldErrors.displayName && (
              <p className="text-xs text-red-400">{fieldErrors.displayName.join(' | ')}</p>
            )}
          </div>

          {/* البريد الإلكتروني */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              البريد الإلكتروني <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="ahmed@engineering-sy.org"
              className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              dir="ltr"
              disabled={isPending}
              required
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-400">{fieldErrors.email.join(' | ')}</p>
            )}
          </div>

          {/* كلمة المرور */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                كلمة المرور <span className="text-red-400">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formState.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="8 أحرف على الأقل"
                className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
                dir="ltr"
                disabled={isPending}
                required
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-400">{fieldErrors.password.join(' | ')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                تأكيد كلمة المرور <span className="text-red-400">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formState.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
                dir="ltr"
                disabled={isPending}
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-400">{fieldErrors.confirmPassword.join(' | ')}</p>
              )}
            </div>
          </div>

          {/* الدور المطلوب */}
          <div className="space-y-2">
            <Label htmlFor="requestedRole" className="text-slate-300">
              الدور المطلوب <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formState.requestedRole}
              onValueChange={(value) => updateField('requestedRole', value)}
              disabled={isPending}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value={USER_ROLES.ENGINEER}>
                  {ROLE_LABELS[USER_ROLES.ENGINEER]}
                </SelectItem>
                <SelectItem value={USER_ROLES.VIEWER}>
                  {ROLE_LABELS[USER_ROLES.VIEWER]}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* بيانات النقابة — ظاهرة فقط للمهندسين */}
          {isEngineerRole && (
            <div className="space-y-3 rounded-md border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-sm font-medium text-slate-300">
                بيانات النقابة الهندسية (مطلوبة للمهندسين)
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="syndicateId" className="text-slate-400 text-xs">
                    رقم النقابة <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="syndicateId"
                    type="text"
                    value={formState.syndicateId}
                    onChange={(e) => updateField('syndicateId', e.target.value)}
                    placeholder="SYR-ENG-XXXXX"
                    className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 text-sm"
                    dir="ltr"
                    disabled={isPending}
                  />
                  {fieldErrors.syndicateId && (
                    <p className="text-xs text-red-400">{fieldErrors.syndicateId.join(' | ')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-slate-400 text-xs">
                    التخصص الهندسي <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="specialization"
                    type="text"
                    value={formState.specialization}
                    onChange={(e) => updateField('specialization', e.target.value)}
                    placeholder="هندسة إنشائية"
                    className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 text-sm"
                    disabled={isPending}
                  />
                  {fieldErrors.specialization && (
                    <p className="text-xs text-red-400">{fieldErrors.specialization.join(' | ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* زر التسجيل */}
          <Button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-medium"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جارٍ التسجيل...
              </span>
            ) : (
              'تسجيل الحساب'
            )}
          </Button>

          {/* رابط تسجيل الدخول */}
          <p className="text-center text-sm text-slate-400">
            لديك حساب بالفعل؟{' '}
            <a
              href="/auth/login"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              تسجيل الدخول
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
