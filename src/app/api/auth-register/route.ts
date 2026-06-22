/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📝 API Route لتسجيل مستخدم جديد — Register API Route
 * ═══════════════════════════════════════════════════════════════════════
 *
 * بديل موثوق لـ Server Action — يعمل على Netlify
 *
 * POST /api/auth-register
 * Body: { displayName, email, password, syndicateId?, specialization?, requestedRole? }
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/password';
import { createUserSession, setSessionCookie } from '@/lib/session';
import { USER_ROLES } from '@/lib/rbac';
import { generateSovereignId } from '@/lib/id-utility';
import { dispatchToAuditQueue, AUDIT_EVENTS, AUDIT_SEVERITY } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const contextId = generateSovereignId('CTX');

  try {
    const body = await request.json();
    const { displayName, email, password, syndicateId, specialization, requestedRole } = body;

    // ─── التحقق من المدخلات ───
    if (!displayName || displayName.length < 3) {
      return NextResponse.json(
        { success: false, contextId, error: 'الاسم الكامل مطلوب (3 أحرف على الأقل)' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, contextId, error: 'بريد إلكتروني غير صالح' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, contextId, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, contextId, error: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم' },
        { status: 400 }
      );
    }

    // ─── التحقق من عدم تكرار البريد ───
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, contextId, error: 'البريد الإلكتروني مسجل بالفعل — استخدم بريداً مختلفاً أو سجّل الدخول' },
        { status: 409 }
      );
    }

    // ─── تشفير كلمة المرور ───
    const passwordHash = await hashPassword(password);

    // ─── حفظ المستخدم ───
    const role = requestedRole === 'VIEWER' ? USER_ROLES.VIEWER : USER_ROLES.ENGINEER;
    const newUser = await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash,
        role,
        syndicateId: syndicateId || null,
        specialization: specialization || null,
        subscriptionStatus: 'PENDING',
        permissions: [],
      },
    });

    // ─── إنشاء الجلسة ───
    const session = createUserSession({
      userId: newUser.id,
      role: newUser.role as USER_ROLES,
      displayName: newUser.displayName,
      syndicateId: newUser.syndicateId || undefined,
      specialization: newUser.specialization || undefined,
    });

    await setSessionCookie(session);

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.REGISTER,
      severity: AUDIT_SEVERITY.INFO,
      userId: newUser.id,
      userRole: newUser.role,
      description: `تسجيل مستخدم جديد: ${displayName} (${email}) بدور ${role} — بانتظار موافقة المدير`,
    });

    return NextResponse.json({
      success: true,
      contextId,
      subscriptionStatus: newUser.subscriptionStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.REGISTER,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: 'SYSTEM',
      userRole: 'SYSTEM',
      description: `خطأ غير متوقع في تسجيل المستخدم: ${message}`,
    });

    return NextResponse.json(
      { success: false, contextId, error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
