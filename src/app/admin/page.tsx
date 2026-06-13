/**
 * صفحة لوحة تحكم المدير الحوكمي الأعلى — Admin Page V2
 *
 * تستخدم التخطيط المشترك لـ Dashboard مع الشريط الجانبي
 */
import { AdminDashboardV2 } from '@/components/admin/admin-dashboard-v2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة التحكم الحوكمية العليا — المدقق الديناميكي V3.0',
  description: 'واجهة الإدارة السيادية لمنصة التحقق الهيكلي — المهندس أبو سليمان',
};

export default function AdminPage() {
  return <AdminDashboardV2 />;
}
