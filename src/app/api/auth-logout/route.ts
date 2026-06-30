/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🚪 API Route لتسجيل الخروج — Logout API Route V2
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يحذف كوكي الجلسة المشفرة بشكل صريح
 *
 * POST /api/auth-logout
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSovereignId } from '@/lib/id-utility';
import { dispatchToAuditQueue, AUDIT_EVENTS, AUDIT_SEVERITY } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE_NAME = 'sbv3-session';

export async function POST(request: NextRequest) {
  const contextId = generateSovereignId('CTX');

  try {
    // محاولة قراءة الجلسة الحالية للتدقيق
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionCookie) {
      // تسجيل الحدث في طابور التدقيق
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.LOGOUT,
        severity: AUDIT_SEVERITY.INFO,
        userId: 'CURRENT_USER',
        userRole: 'UNKNOWN',
        description: 'تسجيل خروج',
      });
    }

    // إنشاء استجابة مع حذف الكوكي
    const response = NextResponse.json({ success: true, contextId });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,  // حذف فوري
      path: '/',
    });

    return response;
  } catch {
    const response = NextResponse.json({ success: true, contextId });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }
}
