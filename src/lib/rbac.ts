/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🛡️ جدار حماية الصلاحيات — Role-Based Access Control (RBAC)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * طبقة التحقق السيادية من الصلاحيات:
 *   - تعمل حصرياً على الخادم (Server-Side Enforcement)
 *   - لا يمكن الالتفاف عليها من الواجهة الأمامية
 *   - التحقق يتم داخل Server Action نفسه وليس فقط في الواجهة
 *
 * الأدوار المعرفة:
 *   ADMIN    — المدير الحوكمي الأعلى (تحكم كامل)
 *   ENGINEER — مهندس التحقق الهيكلي (قراءة + تنفيذ + تسجيل)
 *   VIEWER   — مراقب (قراءة فقط)
 *
 * ⚠️ مبدأ الحد الأدنى من الصلاحيات (Principle of Least Privilege):
 *    كل إجراء يتطلب تحققًا صريحًا من الدور المطلوب
 * ═══════════════════════════════════════════════════════════════════════
 */

/** أدوار المستخدمين في النظام السيادي */
export enum USER_ROLES {
  /** المدير الحوكمي الأعلى — تحكم كامل بالمنصة وخط الأساس */
  ADMIN = 'ADMIN',
  /** مهندس التحقق الهيكلي — تنفيذ العمليات وتسجيل النتائج */
  ENGINEER = 'ENGINEER',
  /** مراقب — قراءة فقط بدون صلاحية تعديل */
  VIEWER = 'VIEWER',
}

/** وصف الأدوار بالعربية للعرض في الواجهات */
export const ROLE_LABELS: Record<USER_ROLES, string> = {
  [USER_ROLES.ADMIN]: 'مدير حوكمي أعلى',
  [USER_ROLES.ENGINEER]: 'مهندس تحقق هيكلي',
  [USER_ROLES.VIEWER]: 'مراقب',
};

/** هرم الصلاحيات — كل دور يرث صلاحيات الأدوار الأدنى منه */
const ROLE_HIERARCHY: Record<USER_ROLES, number> = {
  [USER_ROLES.VIEWER]: 1,
  [USER_ROLES.ENGINEER]: 2,
  [USER_ROLES.ADMIN]: 3,
};

/** واجهة بيانات المستخدم في الجلسة */
export interface RbacUser {
  /** معرف المستخدم السيادي */
  userId: string;
  /** دور المستخدم */
  role: USER_ROLES;
  /** اسم المستخدم الكامل */
  displayName: string;
  /** رقم النقابة (للمهندسين) */
  syndicateId?: string;
  /** التخصص الهندسي */
  specialization?: string;
}

/** خطأ التفويض — يُقذف عند محاولة الوصول بدون صلاحية كافية */
export class AuthorizationError extends Error {
  public readonly requiredRole: USER_ROLES;
  public readonly actualRole: USER_ROLES;
  public readonly userId: string;

  constructor(requiredRole: USER_ROLES, user: RbacUser) {
    super(
      `[RBAC] رفض التفويض: المستخدم "${user.displayName}" (${user.userId}) ` +
      `بدور "${ROLE_LABELS[user.role]}" يحاول تنفيذ إجراء يتطلب دور "${ROLE_LABELS[requiredRole]}". ` +
      `مبدأ الحد الأدنى من الصلاحيات يمنع هذا الوصول.`
    );
    this.name = 'AuthorizationError';
    this.requiredRole = requiredRole;
    this.actualRole = user.role;
    this.userId = user.userId;
  }
}

/**
 * فرض سياسة المدير — التحقق الحصري من دور ADMIN
 *
 * هذا التابع يُستدعى داخل Server Actions لضمان أن المستخدم
 * يمتلك دور ADMIN حصرياً قبل تنفيذ أي إجراء حوكمي.
 *
 * ⚠️ التحقق يتم على الخادم فقط — لا يمكن الالتفاف عليه من المتصفح
 *
 * @param user - بيانات المستخدم من الجلسة المشفرة
 * @returns بيانات المستخدم مؤكدة الصلاحية
 * @throws AuthorizationError إذا لم يكن المستخدم مديراً
 *
 * @example
 * // داخل Server Action
 * const session = await getSession();
 * const verifiedAdmin = enforceAdminPolicy(session.user); // يقذف خطأ إذا لم يكن ADMIN
 * // ← المتابعة بأمان تام
 */
export function enforceAdminPolicy(user: RbacUser): RbacUser {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(USER_ROLES.ADMIN, user);
  }
  return user;
}

/**
 * فرض سياسة الحد الأدنى من الصلاحيات
 *
 * يتحقق أن دور المستخدم يلبي أو يتجاوز الحد الأدنى المطلوب
 * وفق هرم الصلاحيات: VIEWER < ENGINEER < ADMIN
 *
 * @param user - بيانات المستخدم من الجلسة
 * @param minimumRole - الحد الأدنى المطلوب من الصلاحيات
 * @returns بيانات المستخدم مؤكدة الصلاحية
 * @throws AuthorizationError إذا كانت صلاحيات المستخدم غير كافية
 */
export function enforceRolePolicy(user: RbacUser, minimumRole: USER_ROLES): RbacUser {
  if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minimumRole]) {
    throw new AuthorizationError(minimumRole, user);
  }
  return user;
}

/**
 * التحقق من صلاحية بدون قذف خطأ (للاستخدام الشرطي في الواجهات)
 *
 * @param user - بيانات المستخدم (قد تكون null إذا لم يكن مسجلاً)
 * @param minimumRole - الحد الأدنى المطلوب
 * @returns true إذا كانت الصلاحيات كافية، false خلاف ذلك
 */
export function hasPermission(user: RbacUser | null, minimumRole: USER_ROLES): boolean {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole];
}
