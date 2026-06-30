/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔍 API Route لفحص الجلسة — Session Check API Route V2
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يفك تشفير الجلسة من الكوكي ويعيد بيانات المستخدم
 *
 * GET /api/auth-session
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCryptoVault } from '@/lib/crypto-vault';
import { type UserSession, SESSION_MAX_AGE } from '@/lib/session';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE_NAME = 'sbv3-session';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ isAuthenticated: false });
    }

    // فك تشفير الجلسة
    const vault = getCryptoVault();
    const decryptedJson = vault.decrypt(sessionCookie);
    const session: UserSession = JSON.parse(decryptedJson);

    // التحقق من انتهاء الصلاحية
    const now = Date.now();
    const elapsedSeconds = (now - session.lastRefreshedAt) / 1000;

    if (elapsedSeconds > SESSION_MAX_AGE) {
      const response = NextResponse.json({ isAuthenticated: false });
      response.cookies.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    // تجديد الجلسة
    session.lastRefreshedAt = Date.now();
    const refreshedPayload = vault.encrypt(JSON.stringify(session));

    const response = NextResponse.json({
      isAuthenticated: true,
      user: {
        userId: session.userId,
        displayName: session.displayName,
        role: session.role,
        syndicateId: session.syndicateId,
        specialization: session.specialization,
      },
    });

    // تحديث الكوكي مع الجلسة المجددة
    response.cookies.set(SESSION_COOKIE_NAME, refreshedPayload, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[AuthSession] Error reading session:', error instanceof Error ? error.message : 'unknown');
    const response = NextResponse.json({ isAuthenticated: false });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }
}
