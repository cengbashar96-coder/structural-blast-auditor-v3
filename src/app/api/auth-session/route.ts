/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔍 API Route لفحص الجلسة — Session Check API Route
 * ═══════════════════════════════════════════════════════════════════════
 *
 * GET /api/auth-session
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { refreshSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await refreshSession();

    if (!session) {
      return NextResponse.json({ isAuthenticated: false });
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        userId: session.userId,
        displayName: session.displayName,
        role: session.role,
        syndicateId: session.syndicateId,
        specialization: session.specialization,
      },
    });
  } catch {
    return NextResponse.json({ isAuthenticated: false });
  }
}
