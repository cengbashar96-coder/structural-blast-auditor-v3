/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🏛️ لوحة تحكم المدير الحوكمي الأعلى — Admin Dashboard V2
 * ═══════════════════════════════════════════════════════════════════════
 *
 * واجهة المدير السيادية الكاملة:
 *   - إدارة اشتراكات المستخدمين (قبول / رفض / إيقاف / إعادة تفعيل)
 *   - إدارة الأذونات التفصيلية لكل مستخدم
 *   - تغيير أدوار المستخدمين
 *   - التحكم بقفل خط الأساس الحسابي
 *   - إحصائيات شاملة عن حالة المنصة
 *   - سجل التدقيق الجنائي
 *
 * المدير الافتراضي: المهندس أبو سليمان
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

// ═══════════════════════════════════════════════════════════════════════
// 📐 الأذونات المتاحة — Permission Definitions
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'معلّق', color: 'border-amber-600 text-amber-400 bg-amber-900/20' },
  APPROVED: { label: 'موافق عليه', color: 'border-emerald-600 text-emerald-400 bg-emerald-900/20' },
  REJECTED: { label: 'مرفوض', color: 'border-red-600 text-red-400 bg-red-900/20' },
  SUSPENDED: { label: 'موقوف', color: 'border-orange-600 text-orange-400 bg-orange-900/20' },
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'border-amber-600 text-amber-400 bg-amber-900/20',
  ENGINEER: 'border-blue-600 text-blue-400 bg-blue-900/20',
  VIEWER: 'border-slate-600 text-slate-400 bg-slate-800/50',
};

// ═══════════════════════════════════════════════════════════════════════
// 🎨 مكونات فرعية — Sub-Components
// ═══════════════════════════════════════════════════════════════════════

/** بطاقة إحصائية */
function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/** بطاقة المستخدم في القائمة */
function UserCard({
  user,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onEditPermissions,
  onChangeRole,
  onDelete,
  isPending,
}: {
  user: AdminUserView;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSuspend: (id: string, reason: string) => void;
  onReactivate: (id: string) => void;
  onEditPermissions: (user: AdminUserView) => void;
  onChangeRole: (user: AdminUserView) => void;
  onDelete: (id: string, name: string) => void;
  isPending: boolean;
}) {
  const statusInfo = STATUS_LABELS[user.subscriptionStatus] || STATUS_LABELS.PENDING;
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.VIEWER;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        {/* معلومات المستخدم */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-200 truncate">{user.displayName}</h3>
            <Badge variant="outline" className={roleColor}>
              {ROLE_LABELS[user.role as USER_ROLES] || user.role}
            </Badge>
            <Badge variant="outline" className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono" dir="ltr">{user.email}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            {user.syndicateId && <span>النقابة: <span className="text-slate-300 font-mono" dir="ltr">{user.syndicateId}</span></span>}
            {user.specialization && <span>التخصص: <span className="text-slate-300">{user.specialization}</span></span>}
          </div>
          {user.statusReason && (
            <p className="text-xs text-amber-400 mt-1">السبب: {user.statusReason}</p>
          )}
          {/* الأذونات */}
          <div className="flex flex-wrap gap-1 mt-2">
            {user.permissions.map((perm) => (
              <span key={perm} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {PERMISSION_LABELS[perm] || perm}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            تاريخ التسجيل: {new Date(user.createdAt).toLocaleDateString('ar-SY')}
            {user.statusChangedAt && ` | آخر تغيير: ${new Date(user.statusChangedAt).toLocaleDateString('ar-SY')}`}
          </p>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex flex-col gap-1 shrink-0">
          {user.subscriptionStatus === 'PENDING' && (
            <>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs h-7 px-3" disabled={isPending} onClick={() => onApprove(user.id)}>
                قبول
              </Button>
              <Button size="sm" variant="outline" className="border-red-800 text-red-400 hover:bg-red-900/30 text-xs h-7 px-3" disabled={isPending} onClick={() => {
                const reason = prompt('سبب الرفض:');
                if (reason) onReject(user.id, reason);
              }}>
                رفض
              </Button>
            </>
          )}
          {user.subscriptionStatus === 'APPROVED' && user.role !== 'ADMIN' && (
            <>
              <Button size="sm" variant="outline" className="border-orange-800 text-orange-400 hover:bg-orange-900/30 text-xs h-7 px-3" disabled={isPending} onClick={() => {
                const reason = prompt('سبب الإيقاف:');
                if (reason) onSuspend(user.id, reason);
              }}>
                إيقاف
              </Button>
            </>
          )}
          {user.subscriptionStatus === 'SUSPENDED' && (
            <Button size="sm" className="bg-blue-700 hover:bg-blue-600 text-white text-xs h-7 px-3" disabled={isPending} onClick={() => onReactivate(user.id)}>
              إعادة تفعيل
            </Button>
          )}
          {user.role !== 'ADMIN' && (
            <>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-7 px-3" disabled={isPending} onClick={() => onEditPermissions(user)}>
                الأذونات
              </Button>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-7 px-3" disabled={isPending} onClick={() => onChangeRole(user)}>
                تغيير الدور
              </Button>
              <Button size="sm" variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-900/20 text-xs h-7 px-3" disabled={isPending} onClick={() => onDelete(user.id, user.displayName)}>
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
// 🏛️ المكون الرئيسي — Admin Dashboard V2
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

  // إشعار
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // حوار الأذونات
  const [permissionsDialogUser, setPermissionsDialogUser] = useState<AdminUserView | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);

  // حوار تغيير الدور
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUserView | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // حوار الحذف
  const [deleteDialogUser, setDeleteDialogUser] = useState<{ id: string; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  /** تحميل البيانات الأولية */
  const loadData = useCallback(() => {
    startTransition(async () => {
      try {
        const [statusResult, sessionResult, usersResult] = await Promise.all([
          getBaselineLockStatusAction(),
          checkSessionAction(),
          getAllUsersAction(),
        ]);

        setIsLocked(statusResult.isLocked);

        if (sessionResult.isAuthenticated && sessionResult.user) {
          setCurrentUser(sessionResult.user);
        }

        setUsers(usersResult.users);
        setStats(usersResult.stats);
      } catch {
        showNotification('error', 'فشل تحميل البيانات الأولية');
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

  /** قبول مستخدم */
  function handleApprove(userId: string) {
    startTransition(async () => {
      const result = await approveUserAction(userId);
      if (result.success) {
        showNotification('success', 'تم قبول الاشتراك بنجاح');
        loadData();
      } else {
        showNotification('error', result.error || 'فشل قبول الاشتراك');
      }
    });
  }

  /** رفض مستخدم */
  function handleReject(userId: string, reason: string) {
    startTransition(async () => {
      const result = await rejectUserAction(userId, reason);
      if (result.success) {
        showNotification('success', 'تم رفض الاشتراك');
        loadData();
      } else {
        showNotification('error', result.error || 'فشل رفض الاشتراك');
      }
    });
  }

  /** إيقاف مستخدم */
  function handleSuspend(userId: string, reason: string) {
    startTransition(async () => {
      const result = await suspendUserAction(userId, reason);
      if (result.success) {
        showNotification('success', 'تم إيقاف الاشتراك');
        loadData();
      } else {
        showNotification('error', result.error || 'فشل إيقاف الاشتراك');
      }
    });
  }

  /** إعادة تفعيل مستخدم */
  function handleReactivate(userId: string) {
    startTransition(async () => {
      const result = await reactivateUserAction(userId);
      if (result.success) {
        showNotification('success', 'تم إعادة التفعيل بنجاح');
        loadData();
      } else {
        showNotification('error', result.error || 'فشل إعادة التفعيل');
      }
    });
  }

  /** فتح حوار الأذونات */
  function handleEditPermissions(user: AdminUserView) {
    setPermissionsDialogUser(user);
    setEditingPermissions([...user.permissions]);
  }

  /** حفظ الأذونات */
  function handleSavePermissions() {
    if (!permissionsDialogUser) return;
    startTransition(async () => {
      const result = await updateUserPermissionsAction(permissionsDialogUser.id, editingPermissions);
      if (result.success) {
        showNotification('success', 'تم تحديث الأذونات بنجاح');
        setPermissionsDialogUser(null);
        loadData();
      } else {
        showNotification('error', result.error || 'فشل تحديث الأذونات');
      }
    });
  }

  /** فتح حوار تغيير الدور */
  function handleChangeRole(user: AdminUserView) {
    setRoleDialogUser(user);
    setSelectedRole(user.role);
  }

  /** حفظ الدور الجديد */
  function handleSaveRole() {
    if (!roleDialogUser) return;
    startTransition(async () => {
      const result = await changeUserRoleAction(roleDialogUser.id, selectedRole);
      if (result.success) {
        showNotification('success', 'تم تغيير الدور بنجاح');
        setRoleDialogUser(null);
        loadData();
      } else {
        showNotification('error', result.error || 'فشل تغيير الدور');
      }
    });
  }

  /** حذف مستخدم */
  function handleDelete() {
    if (!deleteDialogUser || !deleteReason.trim()) return;
    startTransition(async () => {
      const result = await deleteUserAction(deleteDialogUser.id, deleteReason);
      if (result.success) {
        showNotification('success', 'تم حذف المستخدم');
        setDeleteDialogUser(null);
        setDeleteReason('');
        loadData();
      } else {
        showNotification('error', result.error || 'فشل حذف المستخدم');
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
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-red-900/50 bg-slate-900/50">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400">غير مُصادَق</CardTitle>
            <CardDescription className="text-slate-400">يجب تسجيل الدخول للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="bg-blue-700 hover:bg-blue-600">
              <a href="/auth/login">تسجيل الدخول</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ إشعار الإجراء ═══ */}
      {notification && (
        <div className={`rounded-md border p-3 text-sm ${notification.type === 'success' ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-red-900/30 border-red-700 text-red-300'}`} role="alert">
          {notification.message}
        </div>
      )}

      {/* ═══ رأس لوحة التحكم ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            لوحة التحكم الحوكمية العليا
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            المهندس أبو سليمان — منصة المدقق الديناميكي الموحد V3.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-amber-600 text-amber-400 bg-amber-900/20">
            {currentUser.displayName}
          </Badge>
          <Button variant="outline" onClick={handleLogout} disabled={isPending} className="border-slate-600 text-slate-300 hover:bg-slate-800">
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* ═══ تبويبات التنقل ═══ */}
      <div className="flex gap-1 border-b border-slate-800">
        {([
          { key: 'overview' as AdminTab, label: 'نظرة عامة', count: undefined },
          { key: 'pending' as AdminTab, label: 'طلبات معلّقة', count: stats?.pending },
          { key: 'users' as AdminTab, label: 'المستخدمون', count: stats?.total },
          { key: 'baseline' as AdminTab, label: 'خط الأساس', count: undefined },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="mr-2 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10px] font-bold bg-amber-600 text-white">
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
            <StatCard title="مستخدمون فعّالون" value={stats.approved} color="text-emerald-400" icon="✅" />
            <StatCard title="موقوفون" value={stats.suspended} color="text-orange-400" icon="⛔" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard title="مديرون" value={stats.admins} color="text-amber-400" icon="👑" />
            <StatCard title="مهندسون" value={stats.engineers} color="text-blue-400" icon="🔧" />
            <StatCard title="مراقبون" value={stats.viewers} color="text-slate-400" icon="👁️" />
          </div>

          {/* إجراءات سريعة */}
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button className="bg-amber-700 hover:bg-amber-600 text-white" disabled={isPending} onClick={handleSeedAdmin}>
                بذر حساب المدير الافتراضي (أبو سليمان)
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" disabled={isPending} onClick={() => setActiveTab('pending')}>
                مراجعة الطلبات المعلّقة ({stats.pending})
              </Button>
            </CardContent>
          </Card>

          {/* معلومات الأمان */}
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">معلومات الأمان والحماية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-md bg-slate-800/50 p-3 border border-slate-700">
                  <p className="text-xs font-medium text-blue-400 mb-1">تشفير الجلسة</p>
                  <p className="text-xs text-slate-400">AES-256-GCM + httpOnly</p>
                </div>
                <div className="rounded-md bg-slate-800/50 p-3 border border-slate-700">
                  <p className="text-xs font-medium text-emerald-400 mb-1">كلمات المرور</p>
                  <p className="text-xs text-slate-400">bcrypt (12 rounds)</p>
                </div>
                <div className="rounded-md bg-slate-800/50 p-3 border border-slate-700">
                  <p className="text-xs font-medium text-amber-400 mb-1">حماية CSRF</p>
                  <p className="text-xs text-slate-400">SameSite: Strict</p>
                </div>
                <div className="rounded-md bg-slate-800/50 p-3 border border-slate-700">
                  <p className="text-xs font-medium text-purple-400 mb-1">حماية المسارات</p>
                  <p className="text-xs text-slate-400">Middleware + Server RBAC</p>
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
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg mb-2">لا توجد طلبات معلّقة</p>
              <p className="text-slate-600 text-sm">جميع الطلبات تمت مراجعتها</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSuspend={handleSuspend}
                  onReactivate={handleReactivate}
                  onEditPermissions={handleEditPermissions}
                  onChangeRole={handleChangeRole}
                  onDelete={(id, name) => setDeleteDialogUser({ id, name })}
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
            <Input
              placeholder="بحث بالاسم أو البريد أو رقم النقابة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              dir="rtl"
            />
          </div>

          {/* مستخدمون فعّالون */}
          {approvedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                مستخدمون فعّالون ({approvedUsers.length})
              </h3>
              {approvedUsers.map((user) => (
                <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} onSuspend={handleSuspend} onReactivate={handleReactivate} onEditPermissions={handleEditPermissions} onChangeRole={handleChangeRole} onDelete={(id, name) => setDeleteDialogUser({ id, name })} isPending={isPending} />
              ))}
            </div>
          )}

          {/* موقوفون */}
          {suspendedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                موقوفون ({suspendedUsers.length})
              </h3>
              {suspendedUsers.map((user) => (
                <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} onSuspend={handleSuspend} onReactivate={handleReactivate} onEditPermissions={handleEditPermissions} onChangeRole={handleChangeRole} onDelete={(id, name) => setDeleteDialogUser({ id, name })} isPending={isPending} />
              ))}
            </div>
          )}

          {/* مرفوضون */}
          {rejectedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                مرفوضون ({rejectedUsers.length})
              </h3>
              {rejectedUsers.map((user) => (
                <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} onSuspend={handleSuspend} onReactivate={handleReactivate} onEditPermissions={handleEditPermissions} onChangeRole={handleChangeRole} onDelete={(id, name) => setDeleteDialogUser({ id, name })} isPending={isPending} />
              ))}
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">لا توجد نتائج مطابقة</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ تبويب: خط الأساس ═══ */}
      {activeTab === 'baseline' && (
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-slate-200">التحكم بخط الأساس الحسابي</CardTitle>
            <CardDescription className="text-slate-400">
              قفل خط الأساس يمنع تعديل الثوابت المرجعية (الكود السوري 2024 و UFC 3-340-02).
              هذا الإجراء يتطلب دور المدير الحوكمي الأعلى.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/50 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-200">حالة خط الأساس:</span>
                  <Badge variant="outline" className={isLocked ? 'border-red-600 text-red-400 bg-red-900/20' : 'border-emerald-600 text-emerald-400 bg-emerald-900/20'}>
                    {isLocked ? 'مقفل' : 'مفتوح'}
                  </Badge>
                </div>
              </div>
              <Button onClick={handleToggleBaselineLock} disabled={isPending} className={isLocked ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-red-700 hover:bg-red-600 text-white'}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    جارٍ التنفيذ...
                  </span>
                ) : isLocked ? 'فتح خط الأساس' : 'قفل خط الأساس'}
              </Button>
            </div>
            <div className="mt-3 rounded-md bg-amber-900/20 border border-amber-800/50 p-3">
              <p className="text-xs text-amber-400">
                التحقق من الصلاحيات يتم على الخادم حصراً عبر enforceAdminPolicy. جميع المحاولات تُسجَّل في طابور التدقيق الجنائي.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ حوار الأذونات ═══ */}
      <Dialog open={!!permissionsDialogUser} onOpenChange={(open) => { if (!open) setPermissionsDialogUser(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الأذونات — {permissionsDialogUser?.displayName}</DialogTitle>
            <DialogDescription className="text-slate-400">حدد الأذونات التي تريد منحها لهذا المستخدم</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPermissions.includes(perm)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditingPermissions((prev) => [...prev, perm]);
                    } else {
                      setEditingPermissions((prev) => prev.filter((p) => p !== perm));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">{PERMISSION_LABELS[perm]}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-emerald-700 hover:bg-emerald-600 text-white" disabled={isPending} onClick={handleSavePermissions}>
              حفظ الأذونات
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setPermissionsDialogUser(null)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ حوار تغيير الدور ═══ */}
      <Dialog open={!!roleDialogUser} onOpenChange={(open) => { if (!open) setRoleDialogUser(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100" dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير الدور — {roleDialogUser?.displayName}</DialogTitle>
            <DialogDescription className="text-slate-400">
              الدور الحالي: {roleDialogUser ? ROLE_LABELS[roleDialogUser.role as USER_ROLES] : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                <SelectValue placeholder="اختر الدور الجديد" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value={USER_ROLES.ENGINEER}>{ROLE_LABELS[USER_ROLES.ENGINEER]}</SelectItem>
                <SelectItem value={USER_ROLES.VIEWER}>{ROLE_LABELS[USER_ROLES.VIEWER]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-amber-700 hover:bg-amber-600 text-white" disabled={isPending} onClick={handleSaveRole}>
              تغيير الدور
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setRoleDialogUser(null)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ حوار الحذف ═══ */}
      <Dialog open={!!deleteDialogUser} onOpenChange={(open) => { if (!open) { setDeleteDialogUser(null); setDeleteReason(''); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-400">حذف مستخدم — {deleteDialogUser?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع بيانات المستخدم.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-slate-300 mb-2 block">سبب الحذف <span className="text-red-400">*</span></label>
            <Input
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="أدخل سبب الحذف..."
              className="bg-slate-800 border-slate-600 text-slate-100"
              dir="rtl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button className="bg-red-700 hover:bg-red-600 text-white" disabled={isPending || !deleteReason.trim()} onClick={handleDelete}>
              حذف نهائي
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => { setDeleteDialogUser(null); setDeleteReason(''); }}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
