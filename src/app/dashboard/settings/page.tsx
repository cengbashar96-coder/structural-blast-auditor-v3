// ═══════════════════════════════════════════════════════════════════════
// صفحة الإعدادات — Server Shell
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { SettingsController } from '@/components/settings/settings-controller';

export const metadata = {
  title: 'الإعدادات | المدقق الديناميكي',
};

export default async function SettingsPage() {
  return <SettingsController />;
}
