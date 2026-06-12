// ═══════════════════════════════════════════════════════════════════════
// شريط الملاحة الجانبي - AppSidebar
// منصة المدقق الديناميكي الموحد V3.0
// RTL Arabic Sidebar using shadcn/ui Sidebar primitives
// Dark theme: slate-950 bg, emerald accents
// ═══════════════════════════════════════════════════════════════════════

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Target,
  Waves,
  Building2,
  Wrench,
  BarChart3,
  FlaskConical,
  Table,
  Shield,
  Scan,
  FileText,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { NetworkStatus } from '@/components/network-status';

// ─── هيكل الملاحة: وحدات المنصة ───
const navItems = [
  { title: 'لوحة التحكم', href: '/dashboard', icon: Home },
  { title: 'الاختراق', href: '/dashboard/penetration', icon: Target },
  { title: 'أحمال الانفجار', href: '/dashboard/blast-loads', icon: Waves },
  { title: 'التصميم الإنشائي', href: '/dashboard/structural-design', icon: Building2 },
  { title: 'تصميم التسليح', href: '/dashboard/rebar-design', icon: Wrench },
  { title: 'المفاضلة الهندسية', href: '/dashboard/comparison', icon: BarChart3 },
  { title: 'اختبارات المرجعية', href: '/dashboard/benchmark', icon: FlaskConical },
  { title: 'جدول المتغيرات', href: '/dashboard/variables', icon: Table },
  { title: 'مصفوفة المتطلبات RTM', href: '/dashboard/rtm', icon: Shield },
  { title: 'التقارير', href: '/dashboard/reports', icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="border-l border-slate-800/60"
    >
      {/* ─── الشعار والإصدار ─── */}
      <SidebarHeader className="border-b border-slate-800/60 p-4">
        <div className="flex items-center gap-2">
          <Scan className="size-5 text-emerald-400 shrink-0" />
          <div className="flex items-baseline gap-2 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-emerald-400 font-bold text-base tracking-wider whitespace-nowrap">
              المدقق الديناميكي
            </span>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-400 font-mono text-[10px] px-1.5 py-0 shrink-0"
            >
              V3.0
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      {/* ─── قائمة وحدات المنصة ─── */}
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-xs mb-1 group-data-[collapsible=icon]:hidden">
            وحدات المنصة
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={
                        isActive
                          ? 'bg-slate-800 text-emerald-400 border-r-2 border-emerald-500 font-semibold hover:bg-slate-700 hover:text-emerald-300'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ─── حالة الشبكة والمزامنة ─── */}
      <SidebarFooter className="border-t border-slate-800/60 p-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <NetworkStatus />
        </div>
        {/* مؤشر اتصال مصغر في الوضع المطوي */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-1">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="متصل" />
        </div>
      </SidebarFooter>

      {/* ─── مقبض تغيير حجم الشريط الجانبي ─── */}
      <SidebarRail />
    </Sidebar>
  );
}
