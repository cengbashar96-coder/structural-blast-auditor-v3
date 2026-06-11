/**
 * صفحة تسجيل الدخول — Route Page
 * غلاف خادومي (Server Component) يُحمّل LoginForm كـ Client Island
 */
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تسجيل الدخول — المدقق الديناميكي V3.0',
  description: 'الدخول إلى منصة التحقق الهيكلي السيادية',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <LoginForm />
    </div>
  );
}
