// ═══════════════════════════════════════════════════════════════════════
// جزيرة مراقب الشبكة والمزامنة - NetworkStatus.tsx
// منصة المدقق الديناميكي الموحد V3.0
// مكون عميل معزول يراقب المستودع المحلي وحالة الاتصال الميداني
// دون التسبب في إعادة رندر للـ layout بالكامل
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/storage/db';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // مراقبة حركية صامتة لطابور المزامنة في الـ IndexedDB
    const interval = setInterval(async () => {
      try {
        const count = await db.syncQueue
          .where('status')
          .equals('PENDING')
          .count();
        setPendingCount(count);
      } catch (err) {
        console.error('[NetworkStatus] Storage lookup failure:', err);
      }
    }, 2500);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="flex flex-col gap-2 text-xs text-slate-400"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <span>اتصال الموقع الميداني:</span>
        <span
          className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-amber-500'}`}
        >
          {isOnline ? '● متصل بالخادم' : '▲ وضع معزول (Offline)'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span>طابور المزامنة المحلي:</span>
        <span
          className={`font-mono font-bold ${pendingCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}
        >
          {pendingCount} سجل معلق
        </span>
      </div>
    </div>
  );
}
