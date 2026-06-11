/**
 * صفحة لوحة تحكم المدير — Route Page
 * غلاف خادومي (Server Component) يُحمّل AdminDashboard كـ Client Island
 */
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة التحكم الحوكمية — المدقق الديناميكي V3.0',
  description: 'واجهة الإدارة السيادية لمنصة التحقق الهيكلي',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <AdminDashboard />
    </div>
  );
}
