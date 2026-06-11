/**
 * ═══════════════════════════════════════════════════════════════════════
 * ⚡ الإجراءات السيادية المحصنة — Sovereign Server Actions
 * ═══════════════════════════════════════════════════════════════════════
 *
 * طبقة الإجراءات الخادومية المحصنة بمعمارية Zero-Trust:
 *   ١. توليد contextId موحد في بداية كل حركة
 *   ٢. التحقق من الصلاحيات عبر enforceAdminPolicy داخل Server Action
 *   ٣. تسجيل الحدث في طابور التدقيق (غير حاجب)
 *   ٤. إرجاع payload صغير ورشيق للواجهة (Lightweight Response)
 *
 * ⚠️ لا يُستخدم localStorage للجلسة أو الأدوار — التحقق خادومي بالكامل
 * ⚠️ RBAC يتم داخل Server Action نفسها وليس فقط في الواجهة
 * ═══════════════════════════════════════════════════════════════════════
 */

'use server';

import { generateSovereignId } from '@/lib/id-utility';
import { getSession, createUserSession, setSessionCookie, destroySession, refreshSession } from '@/lib/session';
import { enforceAdminPolicy, USER_ROLES, AuthorizationError } from '@/lib/rbac';
import { dispatchToAuditQueue, AUDIT_EVENTS, AUDIT_SEVERITY } from '@/lib/audit';
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
  // إذا طلب دور المهندس، يجب تقديم رقم النقابة والتخصص
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

/**
 * حالة قفل خط الأساس — تُخزَّن في الذاكرة مؤقتاً
 *
 * ⚠️ في الإنتاج، يجب نقل هذه الحالة إلى قاعدة بيانات أو Redis
 *    لضمان الاتساق بين خوادم متعددة.
 */
let baselineLocked = false;

// ═══════════════════════════════════════════════════════════════════════
// ⚡ الإجراءات السيادية — Server Actions
// ═══════════════════════════════════════════════════════════════════════

/**
 * إجراء قفل/فتح خط الأساس الحسابي
 *
 * التدفق السيادي:
 *   ١. توليد contextId موحد
 *   ٢. قراءة الجلسة المشفرة
 *   ٣. فرض سياسة المدير (enforceAdminPolicy) داخل Server Action
 *   ٤. تنفيذ العملية (قفل/فتح)
 *   ٥. تسجيل الحدث في طابور التدقيق (غير حاجب)
 *   ٦. إرجاع payload صغير ورشيق للواجهة
 *
 * ⚠️ التحقق من RBAC يتم هنا (على الخادم) وليس فقط في الواجهة
 */
export async function toggleBaselineLockAction(): Promise<{
  success: boolean;
  isLocked: boolean;
  contextId: string;
  error?: string;
}> {
  // ١. توليد معرف السياق التنفيذي الموحد
  const contextId = generateSovereignId('CTX');

  try {
    // ٢. قراءة الجلسة المشفرة من الحلوية
    const session = await getSession();

    if (!session) {
      // تسجيل محاولة الوصول بدون جلسة
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.ACCESS_DENIED,
        severity: AUDIT_SEVERITY.WARN,
        userId: 'ANONYMOUS',
        userRole: 'NONE',
        description: 'محاولة تبديل قفل خط الأساس بدون جلسة صالحة',
      });

      return {
        success: false,
        isLocked: baselineLocked,
        contextId,
        error: 'يجب تسجيل الدخول أولاً',
      };
    }

    // ٣. فرض سياسة المدير — التحقق الخادومي الحصري من RBAC
    // ⚠️ هذا هو الجدار الحقيقي — لا يمكن الالتفاف عليه من المتصفح
    const verifiedAdmin = enforceAdminPolicy({
      userId: session.userId,
      role: session.role,
      displayName: session.displayName,
      syndicateId: session.syndicateId,
      specialization: session.specialization,
    });

    // ٤. تنفيذ العملية — تبديل حالة القفل
    baselineLocked = !baselineLocked;

    // ٥. تسجيل الحدث في طابور التدقيق — غير حاجب للأداء
    dispatchToAuditQueue({
      contextId,
      event: baselineLocked ? AUDIT_EVENTS.BASELINE_LOCK : AUDIT_EVENTS.BASELINE_UNLOCK,
      severity: AUDIT_SEVERITY.INFO,
      userId: verifiedAdmin.userId,
      userRole: verifiedAdmin.role,
      description: baselineLocked
        ? `قفل خط الأساس الحسابي بواسطة ${verifiedAdmin.displayName}`
        : `فتح خط الأساس الحسابي بواسطة ${verifiedAdmin.displayName}`,
      metadata: {
        previousState: !baselineLocked,
        newState: baselineLocked,
        adminRole: verifiedAdmin.role,
      },
    });

    // ٦. إرجاع payload صغير ورشيق — يمنع الـ Re-renders العشوائية
    return {
      success: true,
      isLocked: baselineLocked,
      contextId,
    };
  } catch (error: unknown) {
    // التعامل مع خطأ التفويض — محاولة وصول مرفوضة
    if (error instanceof AuthorizationError) {
      dispatchToAuditQueue({
        contextId,
        event: AUDIT_EVENTS.ACCESS_DENIED,
        severity: AUDIT_SEVERITY.CRITICAL,
        userId: error.userId,
        userRole: error.actualRole,
        description: error.message,
        metadata: {
          requiredRole: error.requiredRole,
          actualRole: error.actualRole,
        },
      });

      return {
        success: false,
        isLocked: baselineLocked,
        contextId,
        error: 'صلاحيات غير كافية — هذا الإجراء يتطلب دور المدير الحوكمي',
      };
    }

    // أخطاء غير متوقعة
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ACCESS_DENIED,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: 'SYSTEM',
      userRole: 'SYSTEM',
      description: `خطأ غير متوقع في تبديل قفل خط الأساس: ${message}`,
    });

    return {
      success: false,
      isLocked: baselineLocked,
      contextId,
      error: 'حدث خطأ أثناء تنفيذ العملية',
    };
  }
}

/**
 * إجراء قراءة حالة خط الأساس
 *
 * متاح لجميع المستخدمين المصادق عليهم (لا يتطلب دور ADMIN)
 */
export async function getBaselineLockStatusAction(): Promise<{
  isLocked: boolean;
  contextId: string;
}> {
  const contextId = generateSovereignId('CTX');
  return {
    isLocked: baselineLocked,
    contextId,
  };
}

/**
 * إجراء تسجيل مستخدم جديد
 *
 * يقوم ب:
 *   ١. التحقق من المدخلات عبر Zod (صمام أمان)
 *   ٢. إنشاء الجلسة المشفرة
 *   ٣. زرع حلوية الجلسة الآمنة
 *   ٤. تسجيل الحدث في طابور التدقيق
 */
export async function registerAction(formData: FormData): Promise<{
  success: boolean;
  contextId: string;
  error?: string;
  errors?: Record<string, string[]>;
}> {
  const contextId = generateSovereignId('CTX');

  try {
    // ١. استخراج البيانات من النموذج
    const rawData = {
      displayName: formData.get('displayName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      syndicateId: (formData.get('syndicateId') as string) || undefined,
      specialization: (formData.get('specialization') as string) || undefined,
      requestedRole: (formData.get('requestedRole') as string) || USER_ROLES.ENGINEER,
    };

    // ٢. التحقق عبر Zod — صمام أمان المدخلات
    const validationResult = RegistrationSchema.safeParse(rawData);

    if (!validationResult.success) {
      // تحويل أخطاء Zod إلى تنسيق سهل للعرض
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

      return {
        success: false,
        contextId,
        error: 'بيانات التسجيل غير صالحة',
        errors,
      };
    }

    const validatedData = validationResult.data;

    // ٣. إنشاء الجلسة المشفرة — بدون تخزين كلمة المرور
    // ⚠️ في الإنتاج: يجب تخزين hash لكلمة المرور في قاعدة بيانات
    const session = createUserSession({
      userId: generateSovereignId('SSN'), // ← معرف المستخدم السيادي
      role: validatedData.requestedRole,
      displayName: validatedData.displayName,
      syndicateId: validatedData.syndicateId,
      specialization: validatedData.specialization,
    });

    // ٤. زرع حلوية الجلسة الآمنة
    await setSessionCookie(session);

    // ٥. تسجيل الحدث في طابور التدقيق — غير حاجب
    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.REGISTER,
      severity: AUDIT_SEVERITY.INFO,
      userId: session.userId,
      userRole: session.role,
      description: `تسجيل مستخدم جديد: ${validatedData.displayName} (${validatedData.email}) بدور ${validatedData.requestedRole}`,
      metadata: {
        email: validatedData.email,
        role: validatedData.requestedRole,
        hasSyndicateId: !!validatedData.syndicateId,
      },
    });

    return {
      success: true,
      contextId,
    };
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

    return {
      success: false,
      contextId,
      error: 'حدث خطأ أثناء التسجيل',
    };
  }
}

/**
 * إجراء تسجيل الدخول
 */
export async function loginAction(formData: FormData): Promise<{
  success: boolean;
  contextId: string;
  error?: string;
}> {
  const contextId = generateSovereignId('CTX');

  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

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

      return {
        success: false,
        contextId,
        error: 'بيانات الدخول غير صالحة',
      };
    }

    // ⚠️ في الإنتاج: التحقق من كلمة المرور مقابل الـ hash المخزن
    // للآن: إنشاء جلسة افتراضية (Transition Implementation)
    const session = createUserSession({
      userId: generateSovereignId('SSN'),
      role: USER_ROLES.ENGINEER, // ← دور افتراضي — يُحدَّث من قاعدة البيانات
      displayName: validationResult.data.email.split('@')[0],
    });

    await setSessionCookie(session);

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.LOGIN,
      severity: AUDIT_SEVERITY.INFO,
      userId: session.userId,
      userRole: session.role,
      description: `تسجيل دخول ناجح: ${validationResult.data.email}`,
    });

    return {
      success: true,
      contextId,
    };
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

    return {
      success: false,
      contextId,
      error: 'حدث خطأ أثناء تسجيل الدخول',
    };
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

    return {
      success: true,
      contextId,
    };
  } catch {
    await destroySession();

    return {
      success: true,
      contextId,
    };
  }
}

/**
 * إجراء التحقق من الجلسة الحالية
 *
 * يُستخدم لمعرفة حالة المستخدم في الواجهة
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
      return {
        isAuthenticated: false,
        contextId,
      };
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
    return {
      isAuthenticated: false,
      contextId,
    };
  }
}
