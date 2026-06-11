/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🏛️ لوحة تحكم المدير الحوكمي الأعلى — Admin Dashboard
 * ═══════════════════════════════════════════════════════════════════════
 *
 * واجهة المدير السيادية تحتوي على:
 *   - مفتاح تحكم برمجياً لتفعيل/إلغاء قفل خط الأساس الحسابي
 *   - عرض حالة خط الأساس الحالية
 *   - معلومات الجلسة الحالية
 *   - إحصائيات طابور التدقيق
 *
 * يدار عبر useTransition للحفاظ على انسيابية الشاشة
 * واستقبال الـ Lightweight Payload المرتجع من Server Action.
 *
 * ⚠️ RBAC يتم التحقق منه في Server Action نفسه (على الخادم)
 *    الواجهة تعرض فقط الحالة ولا تنفذ أي تحقق أمني
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
import { ROLE_LABELS, USER_ROLES } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** معلومات المستخدم الحالي */
interface CurrentUser {
  userId: string;
  displayName: string;
  role: string;
  syndicateId?: string;
  specialization?: string;
}

export function AdminDashboard() {
  const [isPending, startTransition] = useTransition();

  // حالة خط الأساس
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lastContextId, setLastContextId] = useState<string>('');

  // حالة المستخدم
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // إشعار
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  /** تحميل البيانات الأولية */
  const loadInitialData = useCallback(() => {
    startTransition(async () => {
      try {
        // قراءة حالة خط الأساس
        const statusResult = await getBaselineLockStatusAction();
        setIsLocked(statusResult.isLocked);

        // قراءة معلومات الجلسة
        const sessionResult = await checkSessionAction();
        if (sessionResult.isAuthenticated && sessionResult.user) {
          setCurrentUser(sessionResult.user);
        }
      } catch {
        setNotification({
          type: 'error',
          message: 'فشل تحميل البيانات الأولية',
        });
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /** تبديل قفل خط الأساس عبر Server Action */
  function handleToggleBaselineLock() {
    setNotification(null);

    startTransition(async () => {
      const result = await toggleBaselineLockAction();

      if (result.success) {
        setIsLocked(result.isLocked);
        setLastContextId(result.contextId);
        setNotification({
          type: 'success',
          message: result.isLocked
            ? 'تم قفل خط الأساس الحسابي — لا يمكن تعديل الثوابت المرجعية'
            : 'تم فتح خط الأساس الحسابي — يمكن تعديل الثوابت المرجعية',
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'فشل تنفيذ العملية',
        });
      }

      // مسح الإشعار بعد 5 ثوانٍ
      setTimeout(() => setNotification(null), 5000);
    });
  }

  /** تسجيل الخروج */
  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      window.location.href = '/auth/login';
    });
  }

  // ─── شاشة التحميل ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
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
            <CardDescription className="text-slate-400">
              يجب تسجيل الدخول للوصول إلى لوحة التحكم
            </CardDescription>
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
        <div
          className={`rounded-md border p-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
              : 'bg-red-900/30 border-red-700 text-red-300'
          }`}
          role="alert"
          aria-live="polite"
        >
          {notification.message}
        </div>
      )}

      {/* ═══ رأس لوحة التحكم ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            لوحة التحكم الحوكمية
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            منصة المدقق الديناميكي الموحد V3.0 — الإدارة السيادية
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={isPending}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          تسجيل الخروج
        </Button>
      </div>

      {/* ═══ بطاقة معلومات المستخدم ═══ */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">المستخدم الحالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500">الاسم</p>
              <p className="text-sm font-medium text-slate-200">{currentUser.displayName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">الدور</p>
              <Badge
                variant="outline"
                className={
                  currentUser.role === USER_ROLES.ADMIN
                    ? 'border-amber-600 text-amber-400 bg-amber-900/20'
                    : currentUser.role === USER_ROLES.ENGINEER
                    ? 'border-blue-600 text-blue-400 bg-blue-900/20'
                    : 'border-slate-600 text-slate-400 bg-slate-800/50'
                }
              >
                {ROLE_LABELS[currentUser.role as USER_ROLES] || currentUser.role}
              </Badge>
            </div>
            {currentUser.syndicateId && (
              <div>
                <p className="text-xs text-slate-500">رقم النقابة</p>
                <p className="text-sm font-mono text-slate-300" dir="ltr">
                  {currentUser.syndicateId}
                </p>
              </div>
            )}
            {currentUser.specialization && (
              <div>
                <p className="text-xs text-slate-500">التخصص</p>
                <p className="text-sm text-slate-300">{currentUser.specialization}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ بطاقة التحكم بخط الأساس ═══ */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">
            التحكم بخط الأساس الحسابي
          </CardTitle>
          <CardDescription className="text-slate-400">
            قفل خط الأساس يمنع تعديل الثوابت المرجعية (الكود السوري 2024 و UFC 3-340-02).
            هذا الإجراء يتطلب دور المدير الحوكمي الأعلى.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/50 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-200">
                  حالة خط الأساس:
                </span>
                <Badge
                  variant="outline"
                  className={
                    isLocked
                      ? 'border-red-600 text-red-400 bg-red-900/20'
                      : 'border-emerald-600 text-emerald-400 bg-emerald-900/20'
                  }
                >
                  {isLocked ? 'مقفل' : 'مفتوح'}
                </Badge>
              </div>
              {lastContextId && (
                <p className="text-xs text-slate-500 font-mono" dir="ltr">
                  آخر سياق: {lastContextId}
                </p>
              )}
            </div>

            {/* مفتاح التحكم البرمجي */}
            <Button
              onClick={handleToggleBaselineLock}
              disabled={isPending}
              className={
                isLocked
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-red-700 hover:bg-red-600 text-white'
              }
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  جارٍ التنفيذ...
                </span>
              ) : isLocked ? (
                'فتح خط الأساس'
              ) : (
                'قفل خط الأساس'
              )}
            </Button>
          </div>

          {/* تحذير أمني */}
          <div className="mt-3 rounded-md bg-amber-900/20 border border-amber-800/50 p-3">
            <p className="text-xs text-amber-400">
              ⚠️ تحذير أمني: التحقق من الصلاحيات يتم على الخادم حصراً عبر enforceAdminPolicy.
              لا يمكن الالتفاف على هذا التحكم من الواجهة الأمامية.
              جميع المحاولات تُسجَّل في طابور التدقيق الجنائي.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══ بطاقة معلومات الأمان ═══ */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">معلومات الأمان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* تشفير الجلسة */}
            <div className="rounded-md bg-slate-800/50 p-3 border border-slate-700">
              <p className="text-xs font-medium text-blue-400 mb-1">تشفير الجلسة</p>
              <p className="text-xs text-slate-400">AES-256-GCM مع httpOnly Cookie</p>
              <p className="text-xs text-slate-500 mt-1">عمر الجلسة: 30 دقيقة</p>
            </div>

            {/* حماية CSRF */}
            <div className="rounded-md bg-slate-800/50 p-3 border border-slate-700">
              <p className="text-xs font-medium text-emerald-400 mb-1">حماية CSRF</p>
              <p className="text-xs text-slate-400">SameSite: Strict</p>
              <p className="text-xs text-slate-500 mt-1">Secure: Production Only</p>
            </div>

            {/* سجل التدقيق */}
            <div className="rounded-md bg-slate-800/50 p-3 border border-slate-700">
              <p className="text-xs font-medium text-amber-400 mb-1">سجل التدقيق</p>
              <p className="text-xs text-slate-400">طابور غير حاجب للأداء</p>
              <p className="text-xs text-slate-500 mt-1">Zero-Lag في الواجهات</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
