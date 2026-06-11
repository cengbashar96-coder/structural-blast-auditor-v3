// ═══════════════════════════════════════════════════════════════════════
// Serwist Service Worker - منصة المدقق الديناميكي الموحد V3.0
// ثلاث استراتيجيات كاش معزولة تماماً لمنع انفلات الموارد:
// 1. Cache-First: App Shell (خطوط، JS، CSS، أيقونات)
// 2. Stale-While-Revalidate: البيانات المرجعية (JSON)
// 3. Network-First: طلبات API والمزامنة
// ═══════════════════════════════════════════════════════════════════════

import { defaultCache } from '@serwist/next/Cache';
import { registerRoute, NavigationRoute } from '@serwist/routing';
import {
  CacheFirst,
  StaleWhileRevalidate,
  NetworkFirst,
} from '@serwist/strategies';
import { CacheableResponsePlugin } from '@serwist/cacheable-response';
import { ExpirationPlugin } from '@serwist/expiration';
import { precacheAndRoute, createHandlerBoundToURL } from '@serwist/precaching';

// تسجيل الموارد المعالجة مسبقاً من Next.js
precacheAndRoute(self.__SW_MANIFEST);

// السماح بتخطي الانتظار عند التحديث
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ───────────────────────────────────────────────────────────────────────
// استراتيجية 1: Cache-First — الـ App Shell الثابت
// الموارد: خطوط، ملفات JS/CSS، أيقونات الهوية
// السلوك: تحميل فوري من التخزين الداخلي دون الاقتراب من الشبكة
// ───────────────────────────────────────────────────────────────────────
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.url.includes('/icons/'),
  new CacheFirst({
    cacheName: 'app-shell-v3.0',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 365, // سنة واحدة
      }),
    ],
  })
);

// ───────────────────────────────────────────────────────────────────────
// استراتيجية 2: Stale-While-Revalidate — البيانات والمراجع المعيارية
// الموارد: جداول الكود السوري 2024، قيم UFC 3-340-02 المرجعية (JSON)
// السلوك: عرض النسخة المحلية فوراً، تحديث صامت في الخلفية
// ───────────────────────────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.pathname.endsWith('.json') && !url.pathname.includes('manifest'),
  new StaleWhileRevalidate({
    cacheName: 'reference-data-v3.0',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 يوماً
      }),
    ],
  })
);

// ───────────────────────────────────────────────────────────────────────
// استراتيجية 3: Network-First — طبقة الطلبات البرمجية والمزامنة
// الموارد: طلبات API الصادرة من الـ SyncQueueProcessor
// السلوك: محاولة الاتصال بالخادم أولاً، الرجوع للكاش عند الفشل
// ───────────────────────────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/v3/'),
  new NetworkFirst({
    cacheName: 'api-requests-v3.0',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 ساعة
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// ───────────────────────────────────────────────────────────────────────
// Navigation Fallback: صفحة أوفلاين احتياطية
// عند فشل طلب صفحة HTML ولا يوجد كاش، يتم عرض صفحة /offline
// ───────────────────────────────────────────────────────────────────────
registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL('/offline'),
    {
      denylist: [/^\/api\/.*/],
    }
  )
);
