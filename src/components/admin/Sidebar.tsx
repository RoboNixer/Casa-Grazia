'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  DollarSign,
  LogOut,
} from 'lucide-react';
import { logoutAction } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin',              label: 'Nadzorna ploča', icon: LayoutDashboard },
  { href: '/admin/calendar',     label: 'Kalendar',       icon: CalendarDays },
  { href: '/admin/properties',   label: 'Nekretnine',     icon: Building2 },
  { href: '/admin/guests',       label: 'Gosti',          icon: Users },
  { href: '/admin/pricing',      label: 'Cijene',         icon: DollarSign },
];

function isActive(currentPath: string, href: string) {
  if (href === '/admin') return currentPath === '/admin';
  return currentPath === href || currentPath.startsWith(href + '/');
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: typeof navItems[0];
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      prefetch={true}
      className={cn(
        'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
        active
          ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)]'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      )}
    >
      {active && (
        <span className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
      )}
      <Icon
        className={cn(
          'w-[17px] h-[17px] flex-shrink-0 transition-all duration-150',
          active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
        )}
      />
      <span className="truncate">{item.label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
      )}
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative px-5 pt-6 pb-5">
        <p className="text-[13.5px] font-bold text-white tracking-tight leading-none">Admin</p>
        <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className="px-3.5 mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Navigacija</p>
        {navItems.slice(0, 4).map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}

        <div className="my-3 mx-3.5 h-px bg-slate-800/60" />
        <p className="px-3.5 mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Konfiguracija</p>
        {navItems.slice(4).map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5">
        <div className="relative h-px mb-4 mx-0.5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
          >
            <LogOut className="w-[17px] h-[17px] flex-shrink-0 transition-colors" />
            <span>Odjava</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    /* Desktop sidebar only — mobile uses MobileBottomNav */
    <aside className="hidden lg:block w-[220px] flex-shrink-0 h-screen sticky top-0 bg-[#0b1120] border-r border-slate-800/60">
      <SidebarContent />
    </aside>
  );
}
