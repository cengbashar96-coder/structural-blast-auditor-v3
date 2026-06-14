// ═══════════════════════════════════════════════════════════════════════
// صفحة التقارير — Server Shell
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { ReportsController } from '@/components/reports/reports-controller';

export const metadata = {
  title: 'مركز التقارير | المدقق الديناميكي',
};

export default async function ReportsPage() {
  return (
    <ReportsController />
  );
}
