/**
 * واجهة تسجيل الدخول — Login Form
 *
 * نموذج مصادقة المستخدمين مع:
 *   - البريد الإلكتروني
 *   - كلمة المرور
 *   - إرسال عبر Server Action (loginAction)
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth.actions';
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

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const result = await loginAction(formData);

      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'فشل تسجيل الدخول');
      }
    });
  }

  return (
    <Card className="w-full max-w-md mx-auto border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-slate-100">
          تسجيل الدخول
        </CardTitle>
        <CardDescription className="text-slate-400">
          منصة المدقق الديناميكي الموحد V3.0
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div
            className="mb-4 rounded-md bg-red-900/30 border border-red-700 p-3 text-sm text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-slate-300">
              البريد الإلكتروني
            </Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ahmed@engineering-sy.org"
              className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              dir="ltr"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-slate-300">
              كلمة المرور
            </Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              dir="ltr"
              disabled={isPending}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-medium"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جارٍ الدخول...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>

          <p className="text-center text-sm text-slate-400">
            ليس لديك حساب؟{' '}
            <a
              href="/auth/register"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              تسجيل حساب جديد
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
