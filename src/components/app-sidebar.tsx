// ═══════════════════════════════════════════════════════════════════════
// شريط الملاحة الجانبي - AppSidebar (مُحدّث)
// منصة المدقق الديناميكي الموحد V3.0
// واجهات مستقلة لكل خطوة + واجهة الأطروحة والمقارنة
// ═══════════════════════════════════════════════════════════════════════

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ClipboardList,
  Target,
  ArrowDownFromLine,
  ArrowRightLeft,
  Layers,
  Building2,
  BookOpen,
  FlaskConical,
  Table,
  Shield,
  FileText,
  Settings,
  Info,
  Crown,
  PenTool,
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { NetworkStatus } from '@/components/network-status';

// ─── هيكل الملاحة: وحدات المنصة (مُحدّث) ───

const calcItems = [
  { title: 'لوحة التحكم', href: '/dashboard', icon: Home },
  { title: 'المدخلات والجداول', href: '/dashboard/step2-inputs', icon: ClipboardList, badge: 'خطوة 2' },
  { title: 'الاختراق', href: '/dashboard/step3-penetration', icon: Target, badge: 'خطوة 3' },
  { title: 'انفجار السقف', href: '/dashboard/step5-roof-blast', icon: ArrowDownFromLine, badge: 'خطوة 5' },
  { title: 'انفجار الجدار', href: '/dashboard/step5-wall-blast', icon: ArrowRightLeft, badge: 'خطوة 5' },
  { title: 'تصميم السقف', href: '/dashboard/step7-ceiling', icon: Layers, badge: 'خطوة 7' },
  { title: 'تصميم الجدران', href: '/dashboard/step8-wall', icon: Building2, badge: 'خطوة 8' },
  { title: 'الأطروحة والمقارنة', href: '/dashboard/thesis-comparison', icon: BookOpen, badge: 'مقارنة' },
  { title: 'الرسوم الهندسية', href: '/dashboard/structural-drawings', icon: PenTool, badge: 'رسم' },
];

const toolItems = [
  { title: 'اختبارات المرجعية', href: '/dashboard/benchmark', icon: FlaskConical },
  { title: 'جدول المتغيرات', href: '/dashboard/variables', icon: Table },
  { title: 'مصفوفة المتطلبات RTM', href: '/dashboard/rtm', icon: Shield },
  { title: 'التقارير', href: '/dashboard/reports', icon: FileText },
  { title: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
  { title: 'حول المنصة', href: '/dashboard/about', icon: Info },
];

const adminItem = { title: 'لوحة المدير', href: '/admin', icon: Crown };

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="border-l border-slate-800/60"
    >
      <SidebarHeader className="border-b border-slate-800/60 p-4">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-emerald-400 shrink-0" />
          <div className="flex items-baseline gap-2 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-emerald-400 font-bold text-base tracking-wider whitespace-nowrap">
              المدقق الديناميكي
            </span>
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-400 font-mono text-[10px] px-1.5 py-0 shrink-0"
            >
              V3.1
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {/* ─── وحدات الحساب ─── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-xs mb-1 group-data-[collapsible=icon]:hidden">
            خطوات الحساب
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {calcItems.map((item) => {
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
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.badge && (
                            <span className="text-[9px] bg-slate-700/80 text-slate-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-slate-800/60" />

        {/* ─── أدوات مساعدة ─── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-xs mb-1 group-data-[collapsible=icon]:hidden">
            أدوات مساعدة
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
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

        <SidebarSeparator className="bg-slate-800/60" />

        {/* ─── قسم المدير الحوكمي ─── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-amber-500/70 text-xs mb-1 group-data-[collapsible=icon]:hidden">
            الإدارة الحوكمية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={adminItem.title}
                  className={
                    pathname.startsWith('/admin')
                      ? 'bg-amber-900/30 text-amber-400 border-r-2 border-amber-500 font-semibold hover:bg-amber-900/40 hover:text-amber-300'
                      : 'text-amber-500/70 hover:text-amber-400 hover:bg-amber-900/20'
                  }
                >
                  <Link href={adminItem.href}>
                    <Crown className="size-4" />
                    <span>{adminItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800/60 p-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <NetworkStatus />
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-1">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="متصل" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
