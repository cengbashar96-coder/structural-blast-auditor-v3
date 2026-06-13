// ═══════════════════════════════════════════════════════════════════════
// صفحة حول المنصة — Server Shell
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { AboutController } from '@/components/about/about-controller';

export const metadata = {
  title: 'حول المنصة | المدقق الديناميكي',
};

export default async function AboutPage() {
  return <AboutController />;
}
