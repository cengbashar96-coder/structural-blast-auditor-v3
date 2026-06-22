/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🚪 API Route لتسجيل الخروج — Logout API Route
 * ═══════════════════════════════════════════════════════════════════════
 *
 * POST /api/auth-logout
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/session';
import { generateSovereignId } from '@/lib/id-utility';
import { dispatchToAuditQueue, AUDIT_EVENTS, AUDIT_SEVERITY } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST() {
  const contextId = generateSovereignId('CTX');

  try {
    const session = await getSession();

    if (session) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.LOGOUT,
        severity: AUDIT_SEVERITY.INFO,
        userId: session.userId,
        userRole: session.role,
        description: `تسجيل خروج: ${session.displayName}`,
      });
    }

    await destroySession();

    return NextResponse.json({ success: true, contextId });
  } catch {
    await destroySession();
    return NextResponse.json({ success: true, contextId });
  }
}
