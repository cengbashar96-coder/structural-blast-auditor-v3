/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔐 API Route لتسجيل الدخول — Login API Route
 * ═══════════════════════════════════════════════════════════════════════
 *
 * بديل موثوق لـ Server Action — يعمل بشكل مضمون على Netlify
 * Server Actions في Next.js 16 على Netlify تعيد HTTP 500
 * بينما API Routes تعمل بشكل مثالي (مُتحقق من /api/setup-db)
 *
 * POST /api/auth-login
 * Body: { email: string, password: string }
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/password';
import { createUserSession, setSessionCookie } from '@/lib/session';
import { USER_ROLES } from '@/lib/rbac';
import { generateSovereignId } from '@/lib/id-utility';
import { dispatchToAuditQueue, AUDIT_EVENTS, AUDIT_SEVERITY } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const contextId = generateSovereignId('CTX');

  try {
    const body = await request.json();
    const { email, password } = body;

    // ─── التحقق من المدخلات ───
    if (!email || !password) {
      return NextResponse.json(
        { success: false, contextId, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
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

    // ─── البحث عن المستخدم ───
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.LOGIN,
        severity: AUDIT_SEVERITY.WARN,
        userId: 'ANONYMOUS',
        userRole: 'NONE',
        description: `فشل تسجيل دخول — مستخدم غير موجود: ${email}`,
      });

      return NextResponse.json(
        { success: false, contextId, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // ─── التحقق من كلمة المرور ───
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.LOGIN,
        severity: AUDIT_SEVERITY.WARN,
        userId: user.id,
        userRole: user.role,
        description: `فشل تسجيل دخول — كلمة مرور خاطئة: ${email}`,
      });

      return NextResponse.json(
        { success: false, contextId, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // ─── التحقق من حالة الاشتراك ───
    if (user.role !== USER_ROLES.ADMIN && user.subscriptionStatus !== 'APPROVED') {
      const statusMessage =
        user.subscriptionStatus === 'PENDING'
          ? 'حسابك بانتظار موافقة المدير — يرجى الانتظار حتى يتم قبول اشتراكك'
          : user.subscriptionStatus === 'REJECTED'
          ? 'تم رفض طلب اشتراكك — تواصل مع المدير الحوكمي للمزيد من المعلومات'
          : user.subscriptionStatus === 'SUSPENDED'
          ? 'حسابك موقوف — تواصل مع المدير الحوكمي لإعادة التفعيل'
          : 'حالة الاشتراك غير معروفة — تواصل مع المدير';

      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.ACCESS_DENIED,
        severity: AUDIT_SEVERITY.WARN,
        userId: user.id,
        userRole: user.role,
        description: `محاولة دخول مستخدم غير موافق عليه: ${user.email} (حالة: ${user.subscriptionStatus})`,
      });

      return NextResponse.json(
        { success: false, contextId, error: statusMessage, subscriptionStatus: user.subscriptionStatus },
        { status: 403 }
      );
    }

    // ─── إنشاء الجلسة المشفرة ───
    const session = createUserSession({
      userId: user.id,
      role: user.role as USER_ROLES,
      displayName: user.displayName,
      syndicateId: user.syndicateId || undefined,
      specialization: user.specialization || undefined,
    });

    await setSessionCookie(session);

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.LOGIN,
      severity: AUDIT_SEVERITY.INFO,
      userId: user.id,
      userRole: user.role,
      description: `تسجيل دخول ناجح: ${user.email} بدور ${user.role}`,
    });

    return NextResponse.json({
      success: true,
      contextId,
      subscriptionStatus: user.subscriptionStatus,
      user: {
        userId: user.id,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.LOGIN,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: 'SYSTEM',
      userRole: 'SYSTEM',
      description: `خطأ غير متوقع في تسجيل الدخول: ${message}`,
    });

    return NextResponse.json(
      { success: false, contextId, error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
