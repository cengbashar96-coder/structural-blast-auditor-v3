// ═══════════════════════════════════════════════════════════════════════
// غلاف عميل لمزود التخزين — Client Wrapper for StorageProvider
// منصة المدقق الديناميكي الموحد V3.0
//
// ⚠️ هذا الملف ضروري لأن StorageProvider يستورد Dexie (IndexedDB)
//    الذي لا يعمل أثناء SSR (Server-Side Rendering).
//    بوضع "use client" + استيراد ديناميكي مع ssr:false
//    نضمن أن Dexie يُحمّل فقط في المتصفح.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import dynamic from 'next/dynamic';

const StorageProvider = dynamic(
  () => import('@/lib/storage/StorageProvider').then((mod) => mod.StorageProvider),
  { ssr: false }
);

export function ClientStorageProvider({ children }: { children: React.ReactNode }) {
  return <StorageProvider>{children}</StorageProvider>;
}
