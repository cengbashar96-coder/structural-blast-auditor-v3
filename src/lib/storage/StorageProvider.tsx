// ═══════════════════════════════════════════════════════════════════════
// مزود حالة التخزين والمزامنة - StorageProvider.tsx
// منصة المدقق الديناميكي الموحد V3.0
// تهيئة Dexie + SyncProcessor + مراقبة الشبكة عند تحميل التطبيق
// يدعم Serwist (@serwist/next) كإطار عمل PWA
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { db } from '@/lib/storage/db';
import { syncProcessor } from '@/lib/storage/syncProcessor';
import type { SyncApiClient, NetworkMonitor } from '@/lib/storage/syncProcessor';

// ─── واجهة حالة التخزين ────────────────────────────────────────────

interface StorageState {
  isInitialized: boolean;
  isOnline: boolean;
  dbStats: {
    projects: number;
    scenarios: number;
    rtmRecords: number;
    pendingSync: number;
  };
  syncStats: {
    totalProcessed: number;
    totalSucceeded: number;
    totalFailed: number;
    totalConflicts: number;
    lastProcessTime: number | null;
  };
  refreshStats: () => Promise<void>;
}

// ─── السياق ────────────────────────────────────────────────────────

const StorageContext = createContext<StorageState | null>(null);

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error('[STORAGE] useStorage يجب أن يكون داخل StorageProvider');
  }
  return ctx;
}

// ─── المزود الرئيسي ────────────────────────────────────────────────

export function StorageProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dbStats, setDbStats] = useState<StorageState['dbStats']>({
    projects: 0,
    scenarios: 0,
    rtmRecords: 0,
    pendingSync: 0,
  });
  const [syncStats, setSyncStats] = useState<StorageState['syncStats']>({
    totalProcessed: 0,
    totalSucceeded: 0,
    totalFailed: 0,
    totalConflicts: 0,
    lastProcessTime: null,
  });

  // تحديث الإحصائيات
  const refreshStats = useCallback(async () => {
    try {
      const stats = await db.getStats();
      setDbStats(stats);
      setSyncStats(syncProcessor.getStats());
    } catch (error) {
      console.error('[STORAGE] خطأ في تحديث الإحصائيات:', error);
    }
  }, []);

  // تهيئة التخزين ومراقبة الشبكة
  useEffect(() => {
    let unmonitor: (() => void) | undefined;

    async function initialize() {
      try {
        // التحقق من جاهزية IndexedDB
        await db.open();
        console.log('[STORAGE] ✅ Dexie/IndexedDB جاهز');

        // ─── تسجيل Service Worker عبر Serwist ───
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            // Serwist يولّد sw.js تلقائياً عبر @serwist/next plugin
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            });
            console.log('[STORAGE] ✅ Serwist Service Worker مسجل:', registration.scope);

            // مراقبة تحديثات الـ Service Worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[STORAGE] 🔄 تحديث Service Worker جديد متوفر');
                  }
                });
              }
            });
          } catch (error) {
            console.warn('[STORAGE] ⚠️ فشل تسجيل Service Worker:', error);
          }
        }

        // مراقبة حالة الشبكة
        if (typeof window !== 'undefined') {
          setIsOnline(navigator.onLine);

          window.addEventListener('online', () => {
            setIsOnline(true);
            console.log('[STORAGE] 🌐 عودة الاتصال — بدء المزامنة...');
            syncProcessor.processQueue();
          });

          window.addEventListener('offline', () => {
            setIsOnline(false);
            console.log('[STORAGE] 📴 انقطاع الاتصال — وضع أوفلاين');
          });
        }

        // بدء مراقبة المزامنة
        unmonitor = syncProcessor.startOnlineMonitoring();

        // تحديث الإحصائيات الأولية
        await refreshStats();

        setIsInitialized(true);
        console.log('[STORAGE] ✅ نظام التخزين الفرعي مهيأ بالكامل');
      } catch (error) {
        console.error('[STORAGE] ❌ فشل تهيئة نظام التخزين:', error);
      }
    }

    initialize();

    return () => {
      if (unmonitor) unmonitor();
      syncProcessor.stop();
    };
  }, [refreshStats]);

  // تحديث دوري للإحصائيات
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(refreshStats, 30000); // كل 30 ثانية
    return () => clearInterval(interval);
  }, [isInitialized, refreshStats]);

  return (
    <StorageContext.Provider
      value={{
        isInitialized,
        isOnline,
        dbStats,
        syncStats,
        refreshStats,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}
