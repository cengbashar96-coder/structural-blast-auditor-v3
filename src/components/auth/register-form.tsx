/**
 * واجهة تسجيل المستخدمين الاحترافية — Professional Registration Form V3
 *
 * نموذج تسجيل المهندسين مع:
 *   - الاسم الكامل
 *   - البريد الإلكتروني
 *   - كلمة المرور + تأكيد (مع إظهار/إخفاء)
 *   - رقم النقابة (مطلوب للمهندسين)
 *   - التخصص الهندسي (مطلوب للمهندسين)
 *   - الدور المطلوب (مهندس / مراقب)
 *   - تصميم احترافي متوافق مع صفحة الدخول
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerAction } from '@/app/actions/auth.actions';
import { USER_ROLES, ROLE_LABELS } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /** هل الدور المطلوب هو مهندس؟ */
  const isEngineerRole = formState.requestedRole === USER_ROLES.ENGINEER;

  /** تحديث حقل في النموذج */
  function updateField(field: keyof FormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
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
        setSuccessMessage('تم التسجيل بنجاح! حسابك بانتظار موافقة المدير الحوكمي.');
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
    <div className="w-full max-w-lg mx-auto">
      {/* الشعار والعنوان */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/30">
          <svg
            className="w-9 h-9 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          إنشاء حساب جديد
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          انضم إلى منصة المدقق الديناميكي الموحد V3.0
        </p>
      </div>

      <Card className="border-slate-700/50 bg-slate-800/40 backdrop-blur-xl shadow-2xl shadow-black/20">
        <CardContent className="pt-6 pb-4">
          {/* إشعار النجاح */}
          {successMessage && (
            <div
              className="mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400 flex items-center gap-2"
              role="alert"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* إشعار خطأ الخادم */}
          {serverError && (
            <div
              className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 flex items-center gap-2"
              role="alert"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            {/* الاسم الكامل */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-slate-300 text-sm font-medium">
                الاسم الكامل <span className="text-red-400">*</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                value={formState.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                placeholder="المهندس أحمد محمد"
                className="bg-slate-900/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 h-11 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                disabled={isPending}
                required
              />
              {fieldErrors.displayName && (
                <p className="text-xs text-red-400">{fieldErrors.displayName.join(' | ')}</p>
              )}
            </div>

            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                البريد الإلكتروني <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="ahmed@engineering-sy.org"
                className="bg-slate-900/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 h-11 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                dir="ltr"
                disabled={isPending}
                required
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400">{fieldErrors.email.join(' | ')}</p>
              )}
            </div>

            {/* كلمة المرور + تأكيد */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                  كلمة المرور <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formState.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    className="bg-slate-900/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 h-11 pl-9 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                    dir="ltr"
                    disabled={isPending}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-400">{fieldErrors.password.join(' | ')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">
                  تأكيد كلمة المرور <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formState.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className="bg-slate-900/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 h-11 pl-9 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                    dir="ltr"
                    disabled={isPending}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-400">{fieldErrors.confirmPassword.join(' | ')}</p>
                )}
              </div>
            </div>

            {/* الدور المطلوب */}
            <div className="space-y-2">
              <Label htmlFor="requestedRole" className="text-slate-300 text-sm font-medium">
                الدور المطلوب <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formState.requestedRole}
                onValueChange={(value) => updateField('requestedRole', value)}
                disabled={isPending}
              >
                <SelectTrigger className="bg-slate-900/60 border-slate-600/50 text-slate-100 h-11 rounded-lg">
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
              <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
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
                      className="bg-slate-900/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 h-10 text-sm rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
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
                      className="bg-slate-900/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 h-10 text-sm rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
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
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-900/20 transition-all duration-200"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  جارٍ إنشاء الحساب...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  إنشاء الحساب
                </span>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="border-t border-slate-700/50 pt-4 pb-5">
          <p className="text-center text-sm text-slate-500 w-full">
            لديك حساب بالفعل؟{' '}
            <a
              href="/auth/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors"
            >
              تسجيل الدخول
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
