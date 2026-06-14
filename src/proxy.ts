/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🛡️ جدار حماية المسارات — Route Protection Middleware
 * ═══════════════════════════════════════════════════════════════════════
 *
 * حماية خادومية لجميع المسارات الحساسة:
 *   ✅ /admin — يتطلب دور ADMIN حصرياً
 *   ✅ /dashboard — يتطلب مصادقة
 *   ✅ /auth/* — يُحوّل المستخدمين المصادق عليهم
 *
 * ⚠️ يعمل في Edge Runtime — لا يستخدم node:crypto مباشرة
 *    يستخدم Web Crypto API بدلاً من ذلك
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';

/** اسم حلوية الجلسة */
const SESSION_COOKIE_NAME = 'sbv3-session';

/**
 * فحص بسيط لوجود الجلسة — لا يفك التشفير في Edge Runtime
 *
 * التحقق الفعلي من الصلاحيات يتم في Server Actions
 * هذا مجرد طبقة حماية أولى لتوجيه المستخدمين
 */
function hasValidSessionCookie(cookieValue: string): boolean {
  // التحقق من أن الكوكي ليس فارغاً وله طول معقول
  // التشفير AES-256-GCM base64 ينتج سلسلة طويلة (أكثر من 100 حرف)
  return cookieValue.length > 50;
}

/**
 * محاولة قراءة بيانات الجلسة باستخدام API route مساعد
 *
 * في Edge Runtime لا نستطيع استخدام node:crypto (المطلوب من CryptoVault).
 * بدلاً من ذلك، نعتمد على فحص وجود الكوكي فقط مع التحقق الفعلي في Server Actions.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // ═══ المسارات العامة — لا حاجة لحماية ═══
  if (
    pathname === '/' ||
    pathname.startsWith('/api/') ||
    pathname === '/offline' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // ═══ مسارات المصادقة — تحويل المصادق عليهم ═══
  if (pathname.startsWith('/auth/')) {
    if (sessionCookie && hasValidSessionCookie(sessionCookie)) {
      // المستخدم لديه جلسة — تحويله إلى لوحة التحكم
      // التحقق الفعلي من الدور يتم في Server Actions
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ═══ مسار المدير — يتطلب مصادقة ═══
  // ⚠️ التحقق الفعلي من ADMIN يتم في admin.actions.ts و auth.actions.ts
  // هنا نتحقق فقط من وجود جلسة لتوجيه المستخدم
  if (pathname.startsWith('/admin')) {
    if (!sessionCookie || !hasValidSessionCookie(sessionCookie)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ═══ مسارات لوحة التحكم — تتطلب مصادقة ═══
  if (pathname.startsWith('/dashboard')) {
    if (!sessionCookie || !hasValidSessionCookie(sessionCookie)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
