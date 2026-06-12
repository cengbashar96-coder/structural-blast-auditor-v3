// ═══════════════════════════════════════════════════════════════════════
// الهيكل الحاكم الثابت من جهة السيرفر - Dashboard Layout
// منصة المدقق الديناميكي الموحد V3.0
// shadcn/ui SidebarProvider + AppSidebar + RTL Arabic + Dark Theme
// ═══════════════════════════════════════════════════════════════════════

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/app-sidebar';
import { PWARegister } from '@/components/pwa-register';

export const metadata = {
  title: 'لوحة التحكم | المدقق الديناميكي الموحد',
  description:
    'إطار الحوكمة والمطابقة العددية للمنشآت والتحصينات الإنشائية',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-950">
        {/* شريط أدوات علوي مع زر فتح/إغلاق الشريط الجانبي */}
        <header className="flex h-14 items-center gap-2 border-b border-slate-800/60 px-4">
          <SidebarTrigger className="text-slate-400 hover:text-slate-200" />
          <Separator orientation="vertical" className="h-4 bg-slate-800/60" />
          <span className="text-sm text-slate-500 font-medium">
            المدقق الديناميكي الموحد
          </span>
        </header>
        {/* منطقة عرض محتوى الصفحات الديناميكية */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
      {/* مدقق ومعالج التحديثات الحوكمي الآمن */}
      <PWARegister />
    </SidebarProvider>
  );
}
