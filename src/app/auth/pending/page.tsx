/**
 * صفحة انتظار موافقة المدير — Pending Approval Page
 *
 * تُعرض للمستخدمين الذين سجّلوا حساباً جديداً
 * وحالتهم PENDING حتى يوافق المدير الحوكمي
 */
import { CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = {
  title: 'بانتظار الموافقة — المدقق الديناميكي V3.0',
};

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md border-amber-900/50 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-900/30 p-4">
              <Clock className="size-8 text-amber-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-100">
            بانتظار موافقة المدير
          </CardTitle>
          <CardDescription className="text-slate-400">
            منصة المدقق الديناميكي الموحد V3.0
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md bg-emerald-900/20 border border-emerald-800/50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-300">تم التسجيل بنجاح</p>
                <p className="text-xs text-emerald-400/70 mt-1">
                  تم إنشاء حسابك بنجاح وهو الآن بانتظار مراجعة المدير الحوكمي الأعلى.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-slate-800/50 border border-slate-700 p-4 space-y-2">
            <p className="text-sm text-slate-300">ماذا يحدث الآن؟</p>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">1.</span>
                سيقوم المدير الحوكمي بمراجعة بياناتك وبيانات نقابتك
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">2.</span>
                سيتم قبول أو رفض طلب اشتراكك
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">3.</span>
                بعد القبول، يمكنك تسجيل الدخول واستخدام المنصة
              </li>
            </ul>
          </div>

          <div className="text-center pt-2">
            <Button asChild className="bg-blue-700 hover:bg-blue-600 text-white">
              <a href="/auth/login">العودة لتسجيل الدخول</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
