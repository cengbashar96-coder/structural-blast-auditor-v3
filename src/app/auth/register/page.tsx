/**
 * صفحة تسجيل المستخدمين — Route Page
 * غلاف خادومي (Server Component) يُحمّل RegisterForm كـ Client Island
 */
import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تسجيل مهندس جديد — المدقق الديناميكي V3.0',
  description: 'إنشاء حساب في منصة التحقق الهيكلي السيادية',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <RegisterForm />
    </div>
  );
}
