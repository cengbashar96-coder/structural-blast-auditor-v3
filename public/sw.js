// ═══════════════════════════════════════════════════════════════════════
// Service Worker - منصة المدقق الديناميكي الموحد V3.0
// استراتيجية: NetworkFirst للصفحات + CacheFirst للموارد الثابتة
// Offline-First Architecture — يعمل بدون إنترنت
// ═══════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'structural-blast-v3.0';
const STATIC_CACHE = 'static-assets-v3.0';
const FONT_CACHE = 'fonts-v3.0';

// الموارد التي يتم تخزينها مؤقتاً عند التثبيت (App Shell)
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── حدث التثبيت: تخزين App Shell ───────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] تثبيت Service Worker V3.0');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] تخزين App Shell...');
      return cache.addAll(APP_SHELL);
    })
  );
  // تفعيل فوري دون انتظار إغلاق التبويبات القديمة
  self.skipWaiting();
});

// ─── حدث التفعيل: تنظيف الكاش القديم ───────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] تفعيل Service Worker V3.0');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== FONT_CACHE)
          .map((name) => {
            console.log('[SW] حذف كاش قديم:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // السيطرة الفورية على جميع التبويبات
  self.clients.claim();
});

// ─── حدث الطلب: استراتيجية التخزين المؤقت الحوكمية ───────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات API — لا نخزن بيانات حساسة مؤقتاً
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // استراتيجية: CacheFirst للموارد الثابتة
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // استراتيجية: CacheFirst للخطوط
  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // استراتيجية: NetworkFirst لكل شيء آخر (الصفحات)
  event.respondWith(networkFirst(request));
});

// ─── NetworkFirst: الشبكة أولاً، الكاش احتياطي ──────────────────────
async function networkFirst(request, timeoutMs = 10000) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // محاولة جلب من الشبكة مع مهلة زمنية
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
      ),
    ]);

    // نجاح: حفظ في الكاش وإرجاع
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // فشل: الرجوع للكاش المحلي
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] NetworkFirst fallback — الكاش:', request.url);
      return cached;
    }

    // لا كاش — إرجاع صفحة أوفلاين
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/');
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ─── CacheFirst: الكاش أولاً، الشبكة احتياطي ────────────────────────
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cache = await caches.open(cacheName);

  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // لا كاش ولا شبكة
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ─── دوال مساعدة ────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?)$/.test(pathname);
}

function isFontRequest(url) {
  return url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com';
}
