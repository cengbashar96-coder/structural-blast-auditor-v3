/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⚡ الإجراءات السيادية المحصنة — Sovereign Server Actions
 * ═══════════════════════════════════════════════════════════════════════
 *
 * طبقة الإجراءات الخادومية المحصنة بمعمارية Zero-Trust:
 *   ١. توليد contextId موحد في بداية كل حركة
 *   ٢. التحقق من الصلاحيات عبر enforceAdminPolicy داخل Server Action
 *   ③. تسجيل الحدث في طابور التدقيق (غير حاجب)
 *   ④. إرجاع payload صغير ورشيق للواجهة (Lightweight Response)
 *
 * ✅ تحقق حقيقي من كلمات المرور عبر bcrypt
 * ✅ حفظ المستخدمين في قاعدة بيانات Supabase عبر REST API
 * ✅ حالة اشتراك PENDING افتراضياً حتى موافقة المدير
 * ═══════════════════════════════════════════════════════════════════════
 */

'use server';

import { prisma } from '@/lib/db/prisma';
import { generateSovereignId } from '@/lib/id-utility';
import { getSession, createUserSession, setSessionCookie, destroySession, refreshSession } from '@/lib/session';
import { enforceAdminPolicy, USER_ROLES, AuthorizationError } from '@/lib/rbac';
import { dispatchToAuditQueue, AUDIT_EVENTS, AUDIT_SEVERITY } from '@/lib/audit';
import { hashPassword, verifyPassword } from '@/lib/password';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
// 📐 مخططات التحقق Zod — صمامات أمان المدخلات
// ═══════════════════════════════════════════════════════════════════════

/** مخطط تسجيل المستخدم — بيانات المهندسين والبيانات النقابية */
export const RegistrationSchema = z.object({
  /** الاسم الكامل — 3 أحرف على الأقل */
  displayName: z.string().min(3, 'الاسم الكامل مطلوب (3 أحرف على الأقل)'),
  /** البريد الإلكتروني المؤسسي */
  email: z.string().email('بريد إلكتروني غير صالح'),
  /** كلمة المرور — 8 أحرف مع حرف كبير وصغير ورقم */
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'),
  /** تأكيد كلمة المرور */
  confirmPassword: z.string(),
  /** رقم النقابة (اختياري — مطلوب للمهندسين) */
  syndicateId: z.string().optional(),
  /** التخصص الهندسي (اختياري — مطلوب للمهندسين) */
  specialization: z.string().optional(),
  /** الدور المطلوب */
  requestedRole: z.enum([USER_ROLES.ENGINEER, USER_ROLES.VIEWER]).default(USER_ROLES.ENGINEER),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمة المرور وتأكيدها غير متطابقتين',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.requestedRole === USER_ROLES.ENGINEER) {
    return !!data.syndicateId && data.syndicateId.length >= 3 && !!data.specialization && data.specialization.length >= 3;
  }
  return true;
}, {
  message: 'رقم النقابة والتخصص الهندسي مطلوبان لدور المهندس',
  path: ['syndicateId'],
});

/** نوع بيانات التسجيل المستخرجة من المخطط */
export type RegistrationInput = z.infer<typeof RegistrationSchema>;

/** مخطط تسجيل الدخول */
const LoginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// ═══════════════════════════════════════════════════════════════════════
// 🏛️ حالة خط الأساس الحسابي — Baseline Lock State
// ═══════════════════════════════════════════════════════════════════════

let baselineLocked = false;

// ═══════════════════════════════════════════════════════════════════════
// ⚡ الإجراءات السيادية — Server Actions
// ═══════════════════════════════════════════════════════════════════════

/**
 * إجراء قفل/فتح خط الأساس الحسابي
 */
export async function toggleBaselineLockAction(): Promise<{
  success: boolean;
  isLocked: boolean;
  contextId: string;
  error?: string;
}> {
  const contextId = generateSovereignId('CTX');

  try {
    const session = await getSession();

    if (!session) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.ACCESS_DENIED,
        severity: AUDIT_SEVERITY.WARN,
        userId: 'ANONYMOUS',
        userRole: 'NONE',
        description: 'محاولة تبديل قفل خط الأساس بدون جلسة صالحة',
      });

      return { success: false, isLocked: baselineLocked, contextId, error: 'يجب تسجيل الدخول أولاً' };
    }

    const verifiedAdmin = enforceAdminPolicy({
      userId: session.userId,
      role: session.role,
      displayName: session.displayName,
      syndicateId: session.syndicateId,
      specialization: session.specialization,
    });

    baselineLocked = !baselineLocked;

    dispatchToAuditQueue({
      contextId,
      event: baselineLocked ? AUDIT_EVENTS.BASELINE_LOCK : AUDIT_EVENTS.BASELINE_UNLOCK,
      severity: AUDIT_SEVERITY.INFO,
      userId: verifiedAdmin.userId,
      userRole: verifiedAdmin.role,
      description: baselineLocked
        ? `قفل خط الأساس الحسابي بواسطة ${verifiedAdmin.displayName}`
        : `فتح خط الأساس الحسابي بواسطة ${verifiedAdmin.displayName}`,
      metadata: { previousState: !baselineLocked, newState: baselineLocked },
    });

    return { success: true, isLocked: baselineLocked, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.ACCESS_DENIED,
        severity: AUDIT_SEVERITY.CRITICAL,
        userId: error.userId,
        userRole: error.actualRole,
        description: error.message,
        metadata: { requiredRole: error.requiredRole, actualRole: error.actualRole },
      });

      return { success: false, isLocked: baselineLocked, contextId, error: 'صلاحيات غير كافية — هذا الإجراء يتطلب دور المدير الحوكمي' };
    }

    const message = error instanceof Error ? error.message : 'خطأ غير معروف';

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ACCESS_DENIED,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: 'SYSTEM',
      userRole: 'SYSTEM',
      description: `خطأ غير متوقع في تبديل قفل خط الأساس: ${message}`,
    });

    return { success: false, isLocked: baselineLocked, contextId, error: 'حدث خطأ أثناء تنفيذ العملية' };
  }
}

/**
 * إجراء قراءة حالة خط الأساس
 */
export async function getBaselineLockStatusAction(): Promise<{
  isLocked: boolean;
  contextId: string;
}> {
  const contextId = generateSovereignId('CTX');
  return { isLocked: baselineLocked, contextId };
}

/**
 * إجراء تسجيل مستخدم جديد — ✅ حفظ حقيقي في قاعدة البيانات عبر Supabase REST API
 *
 * التدفق الكامل:
 *   ١. التحقق من المدخلات عبر Zod
 *   ②. التحقق من عدم تكرار البريد الإلكتروني
 *   ③. تشفير كلمة المرور عبر bcrypt
 *   ④. حفظ المستخدم في قاعدة البيانات بحالة PENDING
 *   ⑤. إنشاء الجلسة المشفرة
 *   ⑥. تسجيل الحدث في طابور التدقيق
 */
export async function registerAction(formData: FormData): Promise<{
  success: boolean;
  contextId: string;
  error?: string;
  errors?: Record<string, string[]>;
}> {
  const contextId = generateSovereignId('CTX');

  try {
    const rawData = {
      displayName: formData.get('displayName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      syndicateId: (formData.get('syndicateId') as string) || undefined,
      specialization: (formData.get('specialization') as string) || undefined,
      requestedRole: (formData.get('requestedRole') as string) || USER_ROLES.ENGINEER,
    };

    const validationResult = RegistrationSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of validationResult.error.issues) {
        const key = issue.path[0]?.toString() || 'general';
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }

      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.REGISTER,
        severity: AUDIT_SEVERITY.WARN,
        userId: 'ANONYMOUS',
        userRole: 'NONE',
        description: `فشل تسجيل مستخدم جديد — بيانات غير صالحة: ${rawData.email}`,
        metadata: { validationErrors: errors },
      });

      return { success: false, contextId, error: 'بيانات التسجيل غير صالحة', errors };
    }

    const validatedData = validationResult.data;

    // ✅ التحقق من عدم تكرار البريد الإلكتروني
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    }) as any;

    if (existingUser) {
      return { success: false, contextId, error: 'البريد الإلكتروني مسجل بالفعل — استخدم بريداً مختلفاً أو سجّل الدخول' };
    }

    // ✅ تشفير كلمة المرور عبر bcrypt
    const passwordHash = await hashPassword(validatedData.password);

    // ✅ حفظ المستخدم في قاعدة البيانات بحالة PENDING
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        displayName: validatedData.displayName,
        passwordHash,
        role: validatedData.requestedRole,
        syndicateId: validatedData.syndicateId || null,
        specialization: validatedData.specialization || null,
        subscriptionStatus: 'PENDING',
        permissions: [],
      },
    }) as any;

    // إنشاء الجلسة المشفرة
    const session = createUserSession({
      userId: newUser.id,
      role: newUser.role as any,
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
      description: `تسجيل مستخدم جديد: ${validatedData.displayName} (${validatedData.email}) بدور ${validatedData.requestedRole} — بانتظار موافقة المدير`,
      metadata: {
        email: validatedData.email,
        role: validatedData.requestedRole,
        hasSyndicateId: !!validatedData.syndicateId,
        subscriptionStatus: 'PENDING',
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[AuthActions] Register error:', message);

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.REGISTER,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: 'SYSTEM',
      userRole: 'SYSTEM',
      description: `خطأ غير متوقع في تسجيل المستخدم: ${message}`,
    });

    return { success: false, contextId, error: 'حدث خطأ أثناء التسجيل' };
  }
}

/**
 * إجراء تسجيل الدخول — ✅ تحقق حقيقي من كلمة المرور عبر Supabase REST API
 *
 * التدفق الكامل:
 *   ١. التحقق من المدخلات عبر Zod
 *   ②. البحث عن المستخدم في قاعدة البيانات
 *   ③. التحقق من كلمة المرور عبر bcrypt
 *   ④. التحقق من حالة الاشتراك
 *   ⑤. إنشاء الجلسة المشفرة
 *   ⑥. زرع كوكي الجلسة
 *   ⑦. إعادة التوجيه إلى لوحة التحكم
 */
export async function loginAction(formData: FormData): Promise<{
  success: boolean;
  contextId: string;
  error?: string;
  subscriptionStatus?: string;
}> {
  const contextId = generateSovereignId('CTX');

  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    console.log(`[AuthActions] Login attempt for: ${rawData.email}`);

    const validationResult = LoginSchema.safeParse(rawData);

    if (!validationResult.success) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.LOGIN,
        severity: AUDIT_SEVERITY.WARN,
        userId: 'ANONYMOUS',
        userRole: 'NONE',
        description: `فشل تسجيل دخول — بيانات غير صالحة: ${rawData.email}`,
      });

      return { success: false, contextId, error: 'بيانات الدخول غير صالحة' };
    }

    // ✅ البحث عن المستخدم في قاعدة البيانات عبر Supabase REST API
    const user = await prisma.user.findUnique({
      where: { email: validationResult.data.email },
    }) as any;

    console.log(`[AuthActions] User found:`, user ? `id=${user.id}, role=${user.role}` : 'NOT FOUND');

    if (!user) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.LOGIN,
        severity: AUDIT_SEVERITY.WARN,
        userId: 'ANONYMOUS',
        userRole: 'NONE',
        description: `فشل تسجيل دخول — مستخدم غير موجود: ${validationResult.data.email}`,
      });

      return { success: false, contextId, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // ✅ التحقق من كلمة المرور عبر bcrypt
    const isPasswordValid = await verifyPassword(validationResult.data.password, user.passwordHash);

    console.log(`[AuthActions] Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.LOGIN,
        severity: AUDIT_SEVERITY.WARN,
        userId: user.id,
        userRole: user.role,
        description: `فشل تسجيل دخول — كلمة مرور خاطئة: ${validationResult.data.email}`,
      });

      return { success: false, contextId, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // ✅ التحقق من حالة الاشتراك — المدير يتجاوز هذا التحديد
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

      return {
        success: false,
        contextId,
        error: statusMessage,
        subscriptionStatus: user.subscriptionStatus,
      };
    }

    // ✅ إنشاء الجلسة المشفرة ببيانات المستخدم الحقيقية من قاعدة البيانات
    const session = createUserSession({
      userId: user.id,
      role: user.role as any,
      displayName: user.displayName,
      syndicateId: user.syndicateId || undefined,
      specialization: user.specialization || undefined,
    });

    await setSessionCookie(session);

    console.log(`[AuthActions] Session created and cookie set for: ${user.email}`);

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.LOGIN,
      severity: AUDIT_SEVERITY.INFO,
      userId: user.id,
      userRole: user.role,
      description: `تسجيل دخول ناجح: ${user.email} بدور ${user.role}`,
    });

    return { success: true, contextId, subscriptionStatus: user.subscriptionStatus };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[AuthActions] Login error:', message);

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.LOGIN,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: 'SYSTEM',
      userRole: 'SYSTEM',
      description: `خطأ غير متوقع في تسجيل الدخول: ${message}`,
    });

    return { success: false, contextId, error: `حدث خطأ أثناء تسجيل الدخول: ${message}` };
  }
}

/**
 * إجراء تسجيل الخروج
 */
export async function logoutAction(): Promise<{
  success: boolean;
  contextId: string;
}> {
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

    return { success: true, contextId };
  } catch {
    await destroySession();
    return { success: true, contextId };
  }
}

/**
 * إجراء التحقق من الجلسة الحالية
 */
export async function checkSessionAction(): Promise<{
  isAuthenticated: boolean;
  user?: {
    userId: string;
    displayName: string;
    role: string;
    syndicateId?: string;
    specialization?: string;
  };
  contextId: string;
}> {
  const contextId = generateSovereignId('CTX');

  try {
    const session = await refreshSession();

    if (!session) {
      return { isAuthenticated: false, contextId };
    }

    return {
      isAuthenticated: true,
      user: {
        userId: session.userId,
        displayName: session.displayName,
        role: session.role,
        syndicateId: session.syndicateId,
        specialization: session.specialization,
      },
      contextId,
    };
  } catch {
    return { isAuthenticated: false, contextId };
  }
}
