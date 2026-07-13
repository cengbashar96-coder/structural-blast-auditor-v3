/**
 * ═══════════════════════════════════════════════════════════════════════
 * لوحة تحكم المدير الاحترافية — Professional Admin Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════
 *
 * واجهة المدير السيادية الكاملة والمحسّنة:
 *   - إدارة اشتراكات المستخدمين (قبول / رفض / إيقاف / إعادة تفعيل)
 *   - إدارة الأذونات التفصيلية لكل مستخدم
 *   - تغيير أدوار المستخدمين
 *   - التحكم بقفل خط الأساس الحسابي
 *   - إحصائيات شاملة عن حالة المنصة
 *   - نوافذ حوار احترافية بدلاً من prompt()
 *   - تصميم متوافق مع صفحة تسجيل الدخول الجديدة
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import {
  toggleBaselineLockAction,
  getBaselineLockStatusAction,
  checkSessionAction,
  logoutAction,
} from '@/app/actions/auth.actions';
import {
  getAllUsersAction,
  approveUserAction,
  rejectUserAction,
  suspendUserAction,
  reactivateUserAction,
  updateUserPermissionsAction,
  changeUserRoleAction,
  deleteUserAction,
  seedDefaultAdminAction,
  type AdminUserView,
  type AdminUserStats,
} from '@/app/actions/admin.actions';
import { ROLE_LABELS, USER_ROLES } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// ═══════════════════════════════════════════════════════════════════════
// الأذونات المتاحة — Permission Definitions
// ═══════════════════════════════════════════════════════════════════════

const PERMISSION_LABELS: Record<string, string> = {
  CAN_RUN_ENGINE: 'تشغيل محرك الحسابات',
  CAN_MODIFY_INPUTS: 'تعديل المدخلات الهندسية',
  CAN_VIEW_REPORTS: 'عرض التقارير',
  CAN_EXPORT_DATA: 'تصدير البيانات',
  CAN_MODIFY_BASELINE: 'تعديل خط الأساس',
  CAN_MANAGE_PROJECTS: 'إدارة المشاريع',
  CAN_AUDIT: 'الوصول لسجل التدقيق',
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'معلّق', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10', icon: '⏳' },
  APPROVED: { label: 'موافق عليه', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', icon: '✓' },
  REJECTED: { label: 'مرفوض', color: 'border-red-500/30 text-red-400 bg-red-500/10', icon: '✗' },
  SUSPENDED: { label: 'موقوف', color: 'border-orange-500/30 text-orange-400 bg-orange-500/10', icon: '⊘' },
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  ENGINEER: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  VIEWER: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
};

// ═══════════════════════════════════════════════════════════════════════
// أنواع الحوارات — Dialog Types
// ═══════════════════════════════════════════════════════════════════════

type DialogMode = 'closed' | 'reject' | 'suspend' | 'delete' | 'permissions' | 'role';

interface DialogState {
  mode: DialogMode;
  userId: string;
  userName: string;
  reason: string;
  selectedRole: string;
  editingPermissions: string[];
}

const INITIAL_DIALOG: DialogState = {
  mode: 'closed',
  userId: '',
  userName: '',
  reason: '',
  selectedRole: '',
  editingPermissions: [],
};

// ═══════════════════════════════════════════════════════════════════════
// مكونات فرعية — Sub-Components
// ═══════════════════════════════════════════════════════════════════════

/** بطاقة إحصائية */
function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/** بطاقة المستخدم في القائمة */
function UserCard({
  user,
  onAction,
  isPending,
}: {
  user: AdminUserView;
  onAction: (action: string, userId: string, userName: string, extra?: string) => void;
  isPending: boolean;
}) {
  const statusInfo = STATUS_LABELS[user.subscriptionStatus] || STATUS_LABELS.PENDING;
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.VIEWER;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 hover:border-slate-600/60 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        {/* معلومات المستخدم */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {/* صورة رمزية */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-300">
                {user.displayName.charAt(0)}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 truncate">{user.displayName}</h3>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleColor}`}>
              {ROLE_LABELS[user.role as USER_ROLES] || user.role}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono mb-1.5" dir="ltr">{user.email}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
            {user.syndicateId && <span>النقابة: <span className="text-slate-300 font-mono" dir="ltr">{user.syndicateId}</span></span>}
            {user.specialization && <span>التخصص: <span className="text-slate-300">{user.specialization}</span></span>}
          </div>
          {user.statusReason && (
            <p className="text-xs text-amber-400/80 mb-2">السبب: {user.statusReason}</p>
          )}
          {/* الأذونات */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {user.permissions.map((perm) => (
              <span key={perm} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30">
                {PERMISSION_LABELS[perm] || perm}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-600">
            تاريخ التسجيل: {new Date(user.createdAt).toLocaleDateString('ar-SY')}
            {user.statusChangedAt && ` — آخر تغيير: ${new Date(user.statusChangedAt).toLocaleDateString('ar-SY')}`}
          </p>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {user.subscriptionStatus === 'PENDING' && (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-lg shadow-sm"
                disabled={isPending}
                onClick={() => onAction('approve', user.id, user.displayName)}
              >
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                قبول
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-800/50 text-red-400 hover:bg-red-900/20 text-xs h-8 px-3 rounded-lg"
                disabled={isPending}
                onClick={() => onAction('reject', user.id, user.displayName)}
              >
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                رفض
              </Button>
            </>
          )}
          {user.subscriptionStatus === 'APPROVED' && user.role !== 'ADMIN' && (
            <Button
              size="sm"
              variant="outline"
              className="border-orange-800/50 text-orange-400 hover:bg-orange-900/20 text-xs h-8 px-3 rounded-lg"
              disabled={isPending}
              onClick={() => onAction('suspend', user.id, user.displayName)}
            >
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              إيقاف
            </Button>
          )}
          {user.subscriptionStatus === 'SUSPENDED' && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-3 rounded-lg shadow-sm"
              disabled={isPending}
              onClick={() => onAction('reactivate', user.id, user.displayName)}
            >
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة تفعيل
            </Button>
          )}
          {user.role !== 'ADMIN' && (
            <>
              <Separator className="my-0.5 bg-slate-700/50" />
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 text-xs h-8 px-3 rounded-lg"
                disabled={isPending}
                onClick={() => onAction('permissions', user.id, user.displayName, user.permissions.join(','))}
              >
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                الأذونات
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 text-xs h-8 px-3 rounded-lg"
                disabled={isPending}
                onClick={() => onAction('role', user.id, user.displayName, user.role)}
              >
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                الدور
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-900/30 text-red-500/70 hover:bg-red-900/15 hover:text-red-400 text-xs h-8 px-3 rounded-lg"
                disabled={isPending}
                onClick={() => onAction('delete', user.id, user.displayName)}
              >
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// المكون الرئيسي — Admin Dashboard V3
// ═══════════════════════════════════════════════════════════════════════

type AdminTab = 'overview' | 'pending' | 'users' | 'baseline';

export function AdminDashboardV2() {
  const [isPending, startTransition] = useTransition();

  // حالة التبويب النشط
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // بيانات المستخدمين
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // حالة خط الأساس
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // المستخدم الحالي
  const [currentUser, setCurrentUser] = useState<{ userId: string; displayName: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // خطأ قاعدة البيانات — للعرض في الواجهة مع خيارات الإصلاح
  const [dbError, setDbError] = useState<string | null>(null);

  // إشعار
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // حالة الحوار الموحدة
  const [dialog, setDialog] = useState<DialogState>(INITIAL_DIALOG);

  /** تحميل البيانات الأولية */
  const loadData = useCallback(() => {
    startTransition(async () => {
      setDbError(null);
      try {
        // ─── الخطوة ١: التحقق من الجلسة أولاً ───
        const sessionResult = await checkSessionAction();

        if (!sessionResult.isAuthenticated || !sessionResult.user) {
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }

        setCurrentUser(sessionResult.user);

        // ─── الخطوة ٢: تحميل البيانات (قد تفشل إذا كانت قاعدة البيانات غير متاحة) ───
        try {
          const [statusResult, usersResult] = await Promise.all([
            getBaselineLockStatusAction(),
            getAllUsersAction(),
          ]);

          setIsLocked(statusResult.isLocked);

          // التحقق من خطأ إرجاعي من getAllUsersAction
          if (usersResult.error) {
            setDbError(usersResult.error);
            showNotification('error', usersResult.error);
          } else {
            setUsers(usersResult.users);
            setStats(usersResult.stats);
          }
        } catch (dataError: unknown) {
          const errMsg = dataError instanceof Error ? dataError.message : 'خطأ غير معروف';
          console.error('[AdminDashboard] Data loading failed:', errMsg);
          setDbError(errMsg);
          showNotification('error', `فشل تحميل البيانات: ${errMsg}`);
        }
      } catch (sessionError: unknown) {
        const errMsg = sessionError instanceof Error ? sessionError.message : 'خطأ غير معروف';
        console.error('[AdminDashboard] Session check failed:', errMsg);
        // إذا فشل التحقق من الجلسة (ربما ENCRYPTION_KEY مفقود)، اعرض خطأ واضح
        setDbError(`فشل التحقق من الجلسة: ${errMsg}`);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** عرض إشعار مؤقت */
  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }

  /** معالجة الإجراءات — موحدة لكل الأزرار */
  function handleAction(action: string, userId: string, userName: string, extra?: string) {
    switch (action) {
      case 'approve':
        startTransition(async () => {
          const result = await approveUserAction(userId);
          if (result.success) {
            showNotification('success', `تم قبول اشتراك ${userName} بنجاح`);
            loadData();
          } else {
            showNotification('error', result.error || 'فشل قبول الاشتراك');
          }
        });
        break;

      case 'reactivate':
        startTransition(async () => {
          const result = await reactivateUserAction(userId);
          if (result.success) {
            showNotification('success', `تم إعادة تفعيل ${userName}`);
            loadData();
          } else {
            showNotification('error', result.error || 'فشل إعادة التفعيل');
          }
        });
        break;

      case 'reject':
        setDialog({ mode: 'reject', userId, userName, reason: '', selectedRole: '', editingPermissions: [] });
        break;

      case 'suspend':
        setDialog({ mode: 'suspend', userId, userName, reason: '', selectedRole: '', editingPermissions: [] });
        break;

      case 'delete':
        setDialog({ mode: 'delete', userId, userName, reason: '', selectedRole: '', editingPermissions: [] });
        break;

      case 'permissions':
        setDialog({
          mode: 'permissions',
          userId,
          userName,
          reason: '',
          selectedRole: '',
          editingPermissions: extra ? extra.split(',') : [],
        });
        break;

      case 'role':
        setDialog({
          mode: 'role',
          userId,
          userName,
          reason: '',
          selectedRole: extra || '',
          editingPermissions: [],
        });
        break;
    }
  }

  /** تنفيذ إجراء الحوار */
  function executeDialogAction() {
    switch (dialog.mode) {
      case 'reject':
        if (!dialog.reason.trim()) {
          showNotification('error', 'يرجى إدخال سبب الرفض');
          return;
        }
        startTransition(async () => {
          const result = await rejectUserAction(dialog.userId, dialog.reason);
          if (result.success) {
            showNotification('success', `تم رفض اشتراك ${dialog.userName}`);
            closeDialog();
            loadData();
          } else {
            showNotification('error', result.error || 'فشل رفض الاشتراك');
          }
        });
        break;

      case 'suspend':
        if (!dialog.reason.trim()) {
          showNotification('error', 'يرجى إدخال سبب الإيقاف');
          return;
        }
        startTransition(async () => {
          const result = await suspendUserAction(dialog.userId, dialog.reason);
          if (result.success) {
            showNotification('success', `تم إيقاف ${dialog.userName}`);
            closeDialog();
            loadData();
          } else {
            showNotification('error', result.error || 'فشل إيقاف الاشتراك');
          }
        });
        break;

      case 'delete':
        if (!dialog.reason.trim()) {
          showNotification('error', 'يرجى إدخال سبب الحذف');
          return;
        }
        startTransition(async () => {
          const result = await deleteUserAction(dialog.userId, dialog.reason);
          if (result.success) {
            showNotification('success', `تم حذف ${dialog.userName} نهائياً`);
            closeDialog();
            loadData();
          } else {
            showNotification('error', result.error || 'فشل حذف المستخدم');
          }
        });
        break;

      case 'permissions':
        startTransition(async () => {
          const result = await updateUserPermissionsAction(dialog.userId, dialog.editingPermissions);
          if (result.success) {
            showNotification('success', `تم تحديث أذونات ${dialog.userName}`);
            closeDialog();
            loadData();
          } else {
            showNotification('error', result.error || 'فشل تحديث الأذونات');
          }
        });
        break;

      case 'role':
        startTransition(async () => {
          const result = await changeUserRoleAction(dialog.userId, dialog.selectedRole);
          if (result.success) {
            showNotification('success', `تم تغيير دور ${dialog.userName}`);
            closeDialog();
            loadData();
          } else {
            showNotification('error', result.error || 'فشل تغيير الدور');
          }
        });
        break;
    }
  }

  /** إغلاق الحوار */
  function closeDialog() {
    setDialog(INITIAL_DIALOG);
  }

  /** تبديل قفل خط الأساس */
  function handleToggleBaselineLock() {
    startTransition(async () => {
      const result = await toggleBaselineLockAction();
      if (result.success) {
        setIsLocked(result.isLocked);
        showNotification('success', result.isLocked ? 'تم قفل خط الأساس الحسابي' : 'تم فتح خط الأساس الحسابي');
      } else {
        showNotification('error', result.error || 'فشل تنفيذ العملية');
      }
    });
  }

  /** بذر المدير الافتراضي */
  function handleSeedAdmin() {
    startTransition(async () => {
      const result = await seedDefaultAdminAction();
      if (result.success) {
        showNotification('success', 'تم إنشاء حساب المدير الافتراضي');
        loadData();
      } else {
        showNotification('error', result.error || 'فشل إنشاء حساب المدير');
      }
    });
  }

  /** تسجيل الخروج */
  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      window.location.href = '/auth/login';
    });
  }

  // ─── تصفية المستخدمين حسب البحث ───
  const filteredUsers = users.filter(u =>
    u.displayName.includes(searchQuery) ||
    u.email.includes(searchQuery) ||
    (u.syndicateId && u.syndicateId.includes(searchQuery))
  );

  const pendingUsers = filteredUsers.filter(u => u.subscriptionStatus === 'PENDING');
  const approvedUsers = filteredUsers.filter(u => u.subscriptionStatus === 'APPROVED');
  const suspendedUsers = filteredUsers.filter(u => u.subscriptionStatus === 'SUSPENDED');
  const rejectedUsers = filteredUsers.filter(u => u.subscriptionStatus === 'REJECTED');

  // ─── شاشة التحميل ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-500" />
          <p className="text-sm text-slate-400">جارٍ تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // ─── لا توجد جلسة صالحة ───
  if (!currentUser && !dbError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-red-900/30 bg-slate-800/40 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400">غير مُصادَق</CardTitle>
            <CardDescription className="text-slate-400">يجب تسجيل الدخول للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
              <a href="/auth/login">تسجيل الدخول</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── خطأ قاعدة البيانات — عرض خيارات الإصلاح ───
  if (dbError) {
    const isSessionError = dbError.includes('ENCRYPTION_KEY') || dbError.includes('الجلسة') || dbError.includes('session');
    const isDbUnavailable = dbError.includes('قاعدة البيانات') || dbError.includes('fetch') || dbError.includes('ECONNREFUSED') || dbError.includes('Supabase') || dbError.includes('فشل جلب');

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-lg border-amber-900/30 bg-slate-800/40 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-amber-400 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              خطأ في تحميل البيانات
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {isSessionError
                ? 'فشل التحقق من الجلسة — قد يكون مفتاح التشفير (ENCRYPTION_KEY) مفقود أو غير صالح'
                : isDbUnavailable
                ? 'قاعدة البيانات غير متاحة حالياً — تحقق من الاتصال أو استخدم الوضع الأوفلاين'
                : 'حدث خطأ أثناء تحميل بيانات لوحة التحكم'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* تفاصيل الخطأ */}
            <div className="rounded-lg bg-red-900/10 border border-red-900/20 p-3">
              <p className="text-xs text-red-400 font-mono break-words" dir="ltr">{dbError}</p>
            </div>

            {/* خيارات الإصلاح */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">خيارات الإصلاح:</p>

              <div className="flex flex-col gap-2">
                {isSessionError && (
                  <div className="rounded-lg bg-slate-700/30 p-3 border border-slate-600/20">
                    <p className="text-xs font-medium text-amber-400 mb-1">مفتاح التشفير مفقود</p>
                    <p className="text-xs text-slate-400 mb-2">
                      أضف ENCRYPTION_KEY إلى متغيرات البيئة (64 حرف hex):
                    </p>
                    <code className="text-[10px] text-emerald-400 bg-slate-900/50 px-2 py-1 rounded block" dir="ltr">
                      node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
                    </code>
                  </div>
                )}

                {isDbUnavailable && (
                  <div className="rounded-lg bg-slate-700/30 p-3 border border-slate-600/20">
                    <p className="text-xs font-medium text-blue-400 mb-1">الوضع الأوفلاين</p>
                    <p className="text-xs text-slate-400 mb-2">
                      يمكنك تفعيل الوضع الأوفلاين بإضافة FORCE_OFFLINE=true إلى متغيرات البيئة
                    </p>
                    <code className="text-[10px] text-emerald-400 bg-slate-900/50 px-2 py-1 rounded block" dir="ltr">
                      FORCE_OFFLINE=true
                    </code>
                  </div>
                )}

                <Button
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                  disabled={isPending}
                  onClick={handleSeedAdmin}
                >
                  بذر حساب المدير الافتراضي (cengbashar96@gmail.com)
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50 rounded-lg"
                  disabled={isPending}
                  onClick={() => { setDbError(null); loadData(); }}
                >
                  إعادة المحاولة
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50 rounded-lg"
                  disabled={isPending}
                  onClick={handleLogout}
                >
                  تسجيل الخروج وإعادة الدخول
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ إشعار الإجراء ═══ */}
      {notification && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`} role="alert">
          {notification.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {notification.message}
        </div>
      )}

      {/* ═══ رأس لوحة التحكم ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            لوحة التحكم الحوكمية العليا
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {currentUser.displayName} — منصة المدقق الديناميكي الموحد V3.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
            {currentUser.displayName}
          </Badge>
          <Button variant="outline" onClick={handleLogout} disabled={isPending} className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 rounded-lg">
            <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* ═══ تبويبات التنقل ═══ */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {([
          { key: 'overview' as AdminTab, label: 'نظرة عامة', count: undefined },
          { key: 'pending' as AdminTab, label: 'طلبات معلّقة', count: stats?.pending },
          { key: 'users' as AdminTab, label: 'المستخدمون', count: stats?.total },
          { key: 'baseline' as AdminTab, label: 'خط الأساس', count: undefined },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === tab.key
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="mr-2 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ تبويب: نظرة عامة ═══ */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* إحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="إجمالي المستخدمين" value={stats.total} color="text-slate-200" icon="👥" />
            <StatCard title="طلبات معلّقة" value={stats.pending} color="text-amber-400" icon="⏳" />
            <StatCard title="مستخدمون فعّالون" value={stats.approved} color="text-emerald-400" icon="✓" />
            <StatCard title="موقوفون" value={stats.suspended} color="text-orange-400" icon="⊘" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard title="مديرون" value={stats.admins} color="text-amber-400" icon="👑" />
            <StatCard title="مهندسون" value={stats.engineers} color="text-blue-400" icon="🔧" />
            <StatCard title="مراقبون" value={stats.viewers} color="text-slate-400" icon="👁" />
          </div>

          {/* إجراءات سريعة */}
          <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg" disabled={isPending} onClick={handleSeedAdmin}>
                بذر حساب المدير الافتراضي
              </Button>
              <Button variant="outline" className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 rounded-lg" disabled={isPending} onClick={() => setActiveTab('pending')}>
                مراجعة الطلبات المعلّقة ({stats.pending})
              </Button>
            </CardContent>
          </Card>

          {/* معلومات الأمان */}
          <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">معلومات الأمان والحماية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-slate-700/30 p-3 border border-slate-600/20">
                  <p className="text-xs font-medium text-blue-400 mb-1">تشفير الجلسة</p>
                  <p className="text-xs text-slate-400">AES-256-GCM + httpOnly</p>
                </div>
                <div className="rounded-lg bg-slate-700/30 p-3 border border-slate-600/20">
                  <p className="text-xs font-medium text-emerald-400 mb-1">كلمات المرور</p>
                  <p className="text-xs text-slate-400">bcrypt (12 rounds)</p>
                </div>
                <div className="rounded-lg bg-slate-700/30 p-3 border border-slate-600/20">
                  <p className="text-xs font-medium text-amber-400 mb-1">حماية CSRF</p>
                  <p className="text-xs text-slate-400">SameSite: Lax</p>
                </div>
                <div className="rounded-lg bg-slate-700/30 p-3 border border-slate-600/20">
                  <p className="text-xs font-medium text-purple-400 mb-1">حماية المسارات</p>
                  <p className="text-xs text-slate-400">Server RBAC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ تبويب: طلبات معلّقة ═══ */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">
              الطلبات المعلّقة ({pendingUsers.length})
            </h2>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-lg mb-1">لا توجد طلبات معلّقة</p>
              <p className="text-slate-600 text-sm">جميع الطلبات تمت مراجعتها</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onAction={handleAction}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ تبويب: المستخدمون ═══ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder="بحث بالاسم أو البريد أو رقم النقابة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800/40 border-slate-600/50 text-slate-100 placeholder:text-slate-500 pr-10 rounded-lg"
                dir="rtl"
              />
            </div>
          </div>

          {/* مستخدمون فعّالون */}
          {approvedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                مستخدمون فعّالون ({approvedUsers.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {approvedUsers.map((user) => (
                  <UserCard key={user.id} user={user} onAction={handleAction} isPending={isPending} />
                ))}
              </div>
            </div>
          )}

          {/* موقوفون */}
          {suspendedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                موقوفون ({suspendedUsers.length})
              </h3>
              <div className="space-y-2">
                {suspendedUsers.map((user) => (
                  <UserCard key={user.id} user={user} onAction={handleAction} isPending={isPending} />
                ))}
              </div>
            </div>
          )}

          {/* مرفوضون */}
          {rejectedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                مرفوضون ({rejectedUsers.length})
              </h3>
              <div className="space-y-2">
                {rejectedUsers.map((user) => (
                  <UserCard key={user.id} user={user} onAction={handleAction} isPending={isPending} />
                ))}
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500">لا توجد نتائج مطابقة</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ تبويب: خط الأساس ═══ */}
      {activeTab === 'baseline' && (
        <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-200">التحكم بخط الأساس الحسابي</CardTitle>
            <CardDescription className="text-slate-400">
              قفل خط الأساس يمنع تعديل الثوابت المرجعية (الكود السوري 2024 و UFC 3-340-02).
              هذا الإجراء يتطلب دور المدير الحوكمي الأعلى.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-700/20 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-200">حالة خط الأساس:</span>
                  <Badge variant="outline" className={isLocked ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'}>
                    {isLocked ? 'مقفل' : 'مفتوح'}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={handleToggleBaselineLock}
                disabled={isPending}
                className={`rounded-lg shadow-sm ${
                  isLocked
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    جارٍ التنفيذ...
                  </span>
                ) : isLocked ? 'فتح خط الأساس' : 'قفل خط الأساس'}
              </Button>
            </div>
            <div className="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-400">
                التحقق من الصلاحيات يتم على الخادم حصراً عبر enforceAdminPolicy. جميع المحاولات تُسجَّل في طابور التدقيق الجنائي.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ حوار: رفض الاشتراك ═══ */}
      <Dialog open={dialog.mode === 'reject'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="bg-slate-800 border-slate-700/50 text-slate-100 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              رفض اشتراك — {dialog.userName}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              سيتم رفض اشتراك هذا المستخدم وإعلامه بالسبب. يمكنك قبوله لاحقاً إذا لزم الأمر.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm text-slate-300 mb-2 block">سبب الرفض <span className="text-red-400">*</span></Label>
            <Textarea
              value={dialog.reason}
              onChange={(e) => setDialog(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="أدخل سبب رفض الاشتراك..."
              className="bg-slate-900/60 border-slate-600/50 text-slate-100 min-h-[80px] rounded-lg resize-none"
              dir="rtl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-red-600 hover:bg-red-500 text-white rounded-lg" disabled={isPending || !dialog.reason.trim()} onClick={executeDialogAction}>
              رفض الاشتراك
            </Button>
            <Button variant="outline" className="border-slate-600/50 text-slate-300 rounded-lg" onClick={closeDialog}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ حوار: إيقاف المستخدم ═══ */}
      <Dialog open={dialog.mode === 'suspend'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="bg-slate-800 border-slate-700/50 text-slate-100 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              إيقاف مستخدم — {dialog.userName}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              سيتم إيقاف حساب هذا المستخدم وسحب جميع أذوناته. يمكن إعادة تفعيله لاحقاً.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm text-slate-300 mb-2 block">سبب الإيقاف <span className="text-red-400">*</span></Label>
            <Textarea
              value={dialog.reason}
              onChange={(e) => setDialog(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="أدخل سبب إيقاف الحساب..."
              className="bg-slate-900/60 border-slate-600/50 text-slate-100 min-h-[80px] rounded-lg resize-none"
              dir="rtl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-orange-600 hover:bg-orange-500 text-white rounded-lg" disabled={isPending || !dialog.reason.trim()} onClick={executeDialogAction}>
              إيقاف الحساب
            </Button>
            <Button variant="outline" className="border-slate-600/50 text-slate-300 rounded-lg" onClick={closeDialog}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ حوار: حذف المستخدم ═══ */}
      <Dialog open={dialog.mode === 'delete'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="bg-slate-800 border-slate-700/50 text-slate-100 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              حذف مستخدم نهائياً — {dialog.userName}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع بيانات المستخدم بشكل دائم.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm text-slate-300 mb-2 block">سبب الحذف <span className="text-red-400">*</span></Label>
            <Textarea
              value={dialog.reason}
              onChange={(e) => setDialog(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="أدخل سبب الحذف النهائي..."
              className="bg-slate-900/60 border-slate-600/50 text-slate-100 min-h-[80px] rounded-lg resize-none"
              dir="rtl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-red-600 hover:bg-red-500 text-white rounded-lg" disabled={isPending || !dialog.reason.trim()} onClick={executeDialogAction}>
              حذف نهائي
            </Button>
            <Button variant="outline" className="border-slate-600/50 text-slate-300 rounded-lg" onClick={closeDialog}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ حوار: إدارة الأذونات ═══ */}
      <Dialog open={dialog.mode === 'permissions'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="bg-slate-800 border-slate-700/50 text-slate-100 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-200">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              إدارة الأذونات — {dialog.userName}
            </DialogTitle>
            <DialogDescription className="text-slate-400">حدد الأذونات التي تريد منحها لهذا المستخدم</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                <input
                  type="checkbox"
                  checked={dialog.editingPermissions.includes(perm)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDialog(prev => ({ ...prev, editingPermissions: [...prev.editingPermissions, perm] }));
                    } else {
                      setDialog(prev => ({ ...prev, editingPermissions: prev.editingPermissions.filter(p => p !== perm) }));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">{PERMISSION_LABELS[perm]}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg" disabled={isPending} onClick={executeDialogAction}>
              حفظ الأذونات
            </Button>
            <Button variant="outline" className="border-slate-600/50 text-slate-300 rounded-lg" onClick={closeDialog}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ حوار: تغيير الدور ═══ */}
      <Dialog open={dialog.mode === 'role'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="bg-slate-800 border-slate-700/50 text-slate-100 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-200">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              تغيير الدور — {dialog.userName}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              الدور الحالي: {dialog.selectedRole ? ROLE_LABELS[dialog.selectedRole as USER_ROLES] : '—'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={dialog.selectedRole} onValueChange={(value) => setDialog(prev => ({ ...prev, selectedRole: value }))}>
              <SelectTrigger className="bg-slate-900/60 border-slate-600/50 text-slate-100 rounded-lg">
                <SelectValue placeholder="اختر الدور الجديد" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value={USER_ROLES.ENGINEER}>{ROLE_LABELS[USER_ROLES.ENGINEER]}</SelectItem>
                <SelectItem value={USER_ROLES.VIEWER}>{ROLE_LABELS[USER_ROLES.VIEWER]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg" disabled={isPending} onClick={executeDialogAction}>
              تغيير الدور
            </Button>
            <Button variant="outline" className="border-slate-600/50 text-slate-300 rounded-lg" onClick={closeDialog}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
