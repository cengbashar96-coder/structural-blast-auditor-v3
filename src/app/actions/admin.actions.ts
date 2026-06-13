/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🏛️ إجراءات المدير الحوكمي الأعلى — Admin Server Actions
 * ═══════════════════════════════════════════════════════════════════════
 *
 * جميع الإجراءات هنا تتطلب دور ADMIN حصرياً:
 *   ١. إدارة اشتراكات المستخدمين (قبول / رفض / إيقاف / إعادة تفعيل)
 *   ٢. إدارة الأذونات التفصيلية لكل مستخدم
 *   ٣. تغيير أدوار المستخدمين
 *   ④. استعلام قوائم المستخدمين وحالاتهم
 *   ⑤. بذر حساب المدير الافتراضي (أبو سليمان)
 *
 * ⚠️ كل إجراء يمر عبر:
 *    - توليد contextId موحد
 *    - التحقق الخادومي من صلاحيات ADMIN
 *    - تسجيل الحدث في طابور التدقيق الجنائي
 * ═══════════════════════════════════════════════════════════════════════
 */

'use server';

import { prisma } from '@/lib/db/prisma';
import { generateSovereignId } from '@/lib/id-utility';
import { getSession, sessionToRbacUser } from '@/lib/session';
import { enforceAdminPolicy, USER_ROLES, ROLE_LABELS, AuthorizationError } from '@/lib/rbac';
import { dispatchToAuditQueue, AUDIT_EVENTS, AUDIT_SEVERITY } from '@/lib/audit';
import { hashPassword } from '@/lib/password';

// ═══════════════════════════════════════════════════════════════════════
// 📐 أنواع البيانات — Type Definitions
// ═══════════════════════════════════════════════════════════════════════

/** بيانات المستخدم للعرض في لوحة المدير */
export interface AdminUserView {
  id: string;
  email: string;
  displayName: string;
  role: string;
  syndicateId: string | null;
  specialization: string | null;
  subscriptionStatus: string;
  statusReason: string | null;
  permissions: string[];
  approvedBy: string | null;
  statusChangedAt: Date | null;
  createdAt: Date;
}

/** إحصائيات المستخدمين للوحة المدير */
export interface AdminUserStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  admins: number;
  engineers: number;
  viewers: number;
}

/** نتيجة إجراء المدير */
interface AdminActionResult {
  success: boolean;
  contextId: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة — Helper Functions
// ═══════════════════════════════════════════════════════════════════════

/** التحقق من أن المستخدم الحالي هو مدير — يُستدعى في بداية كل إجراء */
async function requireAdmin(): Promise<{ contextId: string; adminId: string; adminName: string }> {
  const contextId = generateSovereignId('CTX');
  const session = await getSession();

  if (!session) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const admin = enforceAdminPolicy(sessionToRbacUser(session));

  return { contextId, adminId: admin.userId, adminName: admin.displayName };
}

/** تحويل مستخدم Prisma إلى عرض المدير */
function toAdminUserView(user: {
  id: string;
  email: string;
  displayName: string;
  role: string;
  syndicateId: string | null;
  specialization: string | null;
  subscriptionStatus: string;
  statusReason: string | null;
  permissions: string[];
  approvedBy: string | null;
  statusChangedAt: Date | null;
  createdAt: Date;
}): AdminUserView {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    syndicateId: user.syndicateId,
    specialization: user.specialization,
    subscriptionStatus: user.subscriptionStatus,
    statusReason: user.statusReason,
    permissions: user.permissions,
    approvedBy: user.approvedBy,
    statusChangedAt: user.statusChangedAt,
    createdAt: user.createdAt,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 🌱 بذر حساب المدير الافتراضي — Seed Default Admin
// ═══════════════════════════════════════════════════════════════════════

/**
 * بذر حساب المدير الافتراضي — المهندس أبو سليمان
 *
 * يُنشئ حساب مدير افتراضي إذا لم يكن هناك أي مدير في النظام.
 * هذا يضمن إمكانية الوصول الإداري الأولي دائماً.
 *
 * ⚠️ يجب تغيير كلمة المرور الافتراضية فور تسجيل الدخول الأول
 */
export async function seedDefaultAdminAction(): Promise<AdminActionResult> {
  const contextId = generateSovereignId('CTX');

  try {
    // التحقق من وجود مدير بالفعل
    const existingAdmin = await prisma.user.findFirst({
      where: { role: USER_ROLES.ADMIN },
    });

    if (existingAdmin) {
      return {
        success: true,
        contextId,
        error: 'يوجد مدير بالفعل — لا حاجة للبذر',
      };
    }

    // بذر حساب المدير الافتراضي
    const defaultPasswordHash = await hashPassword('Admin@2024');
    const admin = await prisma.user.create({
      data: {
        email: 'abu-sulaiman@structural-blast.sy',
        displayName: 'المهندس أبو سليمان',
        passwordHash: defaultPasswordHash,
        role: USER_ROLES.ADMIN,
        syndicateId: 'SYR-ENG-ADMIN-001',
        specialization: 'هندسة إنشائية - تحقق من أحمال الانفجار',
        subscriptionStatus: 'APPROVED',
        permissions: [
          'CAN_RUN_ENGINE',
          'CAN_MODIFY_INPUTS',
          'CAN_VIEW_REPORTS',
          'CAN_EXPORT_DATA',
          'CAN_MODIFY_BASELINE',
          'CAN_MANAGE_PROJECTS',
          'CAN_AUDIT',
        ],
        approvedBy: 'SYSTEM_SEED',
        statusChangedAt: new Date(),
      },
    });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.REGISTER,
      severity: AUDIT_SEVERITY.INFO,
      userId: admin.id,
      userRole: USER_ROLES.ADMIN,
      description: `بذر حساب المدير الافتراضي: ${admin.displayName} (${admin.email})`,
      metadata: {
        email: admin.email,
        role: USER_ROLES.ADMIN,
        seededBy: 'SYSTEM',
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.REGISTER,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: 'SYSTEM',
      userRole: 'SYSTEM',
      description: `فشل بذر حساب المدير الافتراضي: ${message}`,
    });

    return { success: false, contextId, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 📋 استعلامات المدير — Admin Queries
// ═══════════════════════════════════════════════════════════════════════

/**
 * جلب جميع المستخدمين مع حالات اشتراكهم
 */
export async function getAllUsersAction(): Promise<{
  users: AdminUserView[];
  stats: AdminUserStats;
  contextId: string;
}> {
  const { contextId } = await requireAdmin();

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const stats: AdminUserStats = {
      total: users.length,
      pending: users.filter(u => u.subscriptionStatus === 'PENDING').length,
      approved: users.filter(u => u.subscriptionStatus === 'APPROVED').length,
      rejected: users.filter(u => u.subscriptionStatus === 'REJECTED').length,
      suspended: users.filter(u => u.subscriptionStatus === 'SUSPENDED').length,
      admins: users.filter(u => u.role === USER_ROLES.ADMIN).length,
      engineers: users.filter(u => u.role === USER_ROLES.ENGINEER).length,
      viewers: users.filter(u => u.role === USER_ROLES.VIEWER).length,
    };

    return {
      users: users.map(toAdminUserView),
      stats,
      contextId,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    throw new Error(`فشل جلب قائمة المستخدمين: ${message}`);
  }
}

/**
 * جلب المستخدمين المعلّقين (بانتظار الموافقة)
 */
export async function getPendingUsersAction(): Promise<{
  users: AdminUserView[];
  contextId: string;
}> {
  const { contextId } = await requireAdmin();

  try {
    const users = await prisma.user.findMany({
      where: { subscriptionStatus: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    return {
      users: users.map(toAdminUserView),
      contextId,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    throw new Error(`فشل جلب الطلبات المعلقة: ${message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ✅ إدارة الاشتراكات — Subscription Management
// ═══════════════════════════════════════════════════════════════════════

/**
 * قبول اشتراك مستخدم — تحويل الحالة من PENDING إلى APPROVED
 */
export async function approveUserAction(userId: string, reason?: string): Promise<AdminActionResult> {
  const { contextId, adminId, adminName } = await requireAdmin();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, contextId, error: 'المستخدم غير موجود' };
    }

    if (user.subscriptionStatus === 'APPROVED') {
      return { success: false, contextId, error: 'المستخدم موافق عليه بالفعل' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'APPROVED',
        statusReason: reason || 'تمت الموافقة من قبل المدير',
        approvedBy: adminId,
        statusChangedAt: new Date(),
        // منح الأذونات الافتراضية حسب الدور
        permissions: user.role === USER_ROLES.ENGINEER
          ? ['CAN_RUN_ENGINE', 'CAN_MODIFY_INPUTS', 'CAN_VIEW_REPORTS', 'CAN_EXPORT_DATA']
          : user.role === USER_ROLES.VIEWER
          ? ['CAN_VIEW_REPORTS']
          : user.permissions,
      },
    });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ROLE_CHANGE,
      severity: AUDIT_SEVERITY.INFO,
      userId: adminId,
      userRole: USER_ROLES.ADMIN,
      description: `قبول اشتراك المستخدم: ${user.displayName} (${user.email}) بواسطة ${adminName}`,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        targetRole: user.role,
        action: 'APPROVE',
        reason,
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return { success: false, contextId, error: 'صلاحيات غير كافية — هذا الإجراء يتطلب دور المدير' };
    }
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { success: false, contextId, error: message };
  }
}

/**
 * رفض اشتراك مستخدم — تحويل الحالة إلى REJECTED
 */
export async function rejectUserAction(userId: string, reason: string): Promise<AdminActionResult> {
  const { contextId, adminId, adminName } = await requireAdmin();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, contextId, error: 'المستخدم غير موجود' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'REJECTED',
        statusReason: reason,
        approvedBy: adminId,
        statusChangedAt: new Date(),
      },
    });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ROLE_CHANGE,
      severity: AUDIT_SEVERITY.WARN,
      userId: adminId,
      userRole: USER_ROLES.ADMIN,
      description: `رفض اشتراك المستخدم: ${user.displayName} (${user.email}) بواسطة ${adminName}. السبب: ${reason}`,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        action: 'REJECT',
        reason,
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return { success: false, contextId, error: 'صلاحيات غير كافية' };
    }
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { success: false, contextId, error: message };
  }
}

/**
 * إيقاف اشتراك مستخدم — تحويل الحالة إلى SUSPENDED
 */
export async function suspendUserAction(userId: string, reason: string): Promise<AdminActionResult> {
  const { contextId, adminId, adminName } = await requireAdmin();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, contextId, error: 'المستخدم غير موجود' };
    }

    if (user.role === USER_ROLES.ADMIN) {
      return { success: false, contextId, error: 'لا يمكن إيقاف حساب مدير حوكمي' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'SUSPENDED',
        statusReason: reason,
        approvedBy: adminId,
        statusChangedAt: new Date(),
        // سحب جميع الأذونات عند الإيقاف
        permissions: [],
      },
    });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ROLE_CHANGE,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: adminId,
      userRole: USER_ROLES.ADMIN,
      description: `إيقاف اشتراك المستخدم: ${user.displayName} (${user.email}) بواسطة ${adminName}. السبب: ${reason}`,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        action: 'SUSPEND',
        reason,
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return { success: false, contextId, error: 'صلاحيات غير كافية' };
    }
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { success: false, contextId, error: message };
  }
}

/**
 * إعادة تفعيل مستخدم موقوف — تحويل الحالة من SUSPENDED إلى APPROVED
 */
export async function reactivateUserAction(userId: string, reason?: string): Promise<AdminActionResult> {
  const { contextId, adminId, adminName } = await requireAdmin();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, contextId, error: 'المستخدم غير موجود' };
    }

    if (user.subscriptionStatus !== 'SUSPENDED') {
      return { success: false, contextId, error: 'المستخدم ليس موقوفاً' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'APPROVED',
        statusReason: reason || `إعادة تفعيل بواسطة ${adminName}`,
        approvedBy: adminId,
        statusChangedAt: new Date(),
        // إعادة الأذونات الافتراضية حسب الدور
        permissions: user.role === USER_ROLES.ENGINEER
          ? ['CAN_RUN_ENGINE', 'CAN_MODIFY_INPUTS', 'CAN_VIEW_REPORTS', 'CAN_EXPORT_DATA']
          : user.role === USER_ROLES.VIEWER
          ? ['CAN_VIEW_REPORTS']
          : user.permissions,
      },
    });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ROLE_CHANGE,
      severity: AUDIT_SEVERITY.INFO,
      userId: adminId,
      userRole: USER_ROLES.ADMIN,
      description: `إعادة تفعيل المستخدم: ${user.displayName} (${user.email}) بواسطة ${adminName}`,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        action: 'REACTIVATE',
        reason,
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return { success: false, contextId, error: 'صلاحيات غير كافية' };
    }
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { success: false, contextId, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🔑 إدارة الأذونات — Permission Management
// ═══════════════════════════════════════════════════════════════════════

/**
 * تحديث أذونات مستخدم — يتحكم المدير في صلاحيات كل مستخدم تفصيلياً
 */
export async function updateUserPermissionsAction(
  userId: string,
  permissions: string[]
): Promise<AdminActionResult> {
  const { contextId, adminId, adminName } = await requireAdmin();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, contextId, error: 'المستخدم غير موجود' };
    }

    if (user.role === USER_ROLES.ADMIN) {
      return { success: false, contextId, error: 'لا يمكن تعديل أذونات مدير حوكمي — لديه صلاحيات كاملة' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { permissions: permissions as any },
    });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ROLE_CHANGE,
      severity: AUDIT_SEVERITY.INFO,
      userId: adminId,
      userRole: USER_ROLES.ADMIN,
      description: `تحديث أذونات المستخدم: ${user.displayName} (${user.email}) بواسطة ${adminName}`,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        action: 'UPDATE_PERMISSIONS',
        previousPermissions: user.permissions,
        newPermissions: permissions,
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return { success: false, contextId, error: 'صلاحيات غير كافية' };
    }
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { success: false, contextId, error: message };
  }
}

/**
 * تغيير دور مستخدم — يتحكم المدير في أدوار المستخدمين
 */
export async function changeUserRoleAction(
  userId: string,
  newRole: string
): Promise<AdminActionResult> {
  const { contextId, adminId, adminName } = await requireAdmin();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, contextId, error: 'المستخدم غير موجود' };
    }

    if (user.role === USER_ROLES.ADMIN) {
      return { success: false, contextId, error: 'لا يمكن تغيير دور مدير حوكمي' };
    }

    if (!Object.values(USER_ROLES).includes(newRole as USER_ROLES)) {
      return { success: false, contextId, error: 'دور غير صالح' };
    }

    // إذا تم ترقية المستخدم إلى ADMIN، نمنحه جميع الأذونات
    const newPermissions = newRole === USER_ROLES.ADMIN
      ? ['CAN_RUN_ENGINE', 'CAN_MODIFY_INPUTS', 'CAN_VIEW_REPORTS', 'CAN_EXPORT_DATA', 'CAN_MODIFY_BASELINE', 'CAN_MANAGE_PROJECTS', 'CAN_AUDIT']
      : newRole === USER_ROLES.ENGINEER
      ? ['CAN_RUN_ENGINE', 'CAN_MODIFY_INPUTS', 'CAN_VIEW_REPORTS', 'CAN_EXPORT_DATA']
      : ['CAN_VIEW_REPORTS'];

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        permissions: newPermissions as any,
      },
    });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ROLE_CHANGE,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: adminId,
      userRole: USER_ROLES.ADMIN,
      description: `تغيير دور المستخدم: ${user.displayName} من ${ROLE_LABELS[user.role as USER_ROLES] || user.role} إلى ${ROLE_LABELS[newRole as USER_ROLES] || newRole} بواسطة ${adminName}`,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        action: 'CHANGE_ROLE',
        previousRole: user.role,
        newRole,
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return { success: false, contextId, error: 'صلاحيات غير كافية' };
    }
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { success: false, contextId, error: message };
  }
}

/**
 * حذف مستخدم من النظام — إجراء حوكمي نهائي
 */
export async function deleteUserAction(userId: string, reason: string): Promise<AdminActionResult> {
  const { contextId, adminId, adminName } = await requireAdmin();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, contextId, error: 'المستخدم غير موجود' };
    }

    if (user.role === USER_ROLES.ADMIN) {
      return { success: false, contextId, error: 'لا يمكن حذف حساب مدير حوكمي' };
    }

    await prisma.user.delete({ where: { id: userId } });

    dispatchToAuditQueue({
      contextId,
      event: AUDIT_EVENTS.ROLE_CHANGE,
      severity: AUDIT_SEVERITY.CRITICAL,
      userId: adminId,
      userRole: USER_ROLES.ADMIN,
      description: `حذف المستخدم: ${user.displayName} (${user.email}) بواسطة ${adminName}. السبب: ${reason}`,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        targetRole: user.role,
        action: 'DELETE',
        reason,
      },
    });

    return { success: true, contextId };
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return { success: false, contextId, error: 'صلاحيات غير كافية' };
    }
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { success: false, contextId, error: message };
  }
}
