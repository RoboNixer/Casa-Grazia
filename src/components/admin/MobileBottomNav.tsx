'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin',            label: 'Ploča',      icon: LayoutDashboard },
  { href: '/admin/calendar',   label: 'Kalendar',   icon: CalendarDays },
  { href: '/admin/properties', label: 'Nekretnine', icon: Building2 },
  { href: '/admin/guests',     label: 'Gosti',      icon: Users },
  { href: '/admin/pricing',    label: 'Cijene',     icon: DollarSign },
] as const;

function isActive(path: string, href: string) {
  if (href === '/admin') return path === '/admin';
  return path === href || path.startsWith(href + '/');
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      data-hide-on-modal
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
    >
      <div className="pointer-events-auto mx-auto max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(21,26,39,0.82),rgba(10,13,22,0.7))] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl">
        <div className="flex items-stretch h-[62px]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              className={cn(
                'relative flex-1 mx-1 my-1.5 rounded-2xl flex flex-col items-center justify-center gap-[3px] transition-all duration-200 select-none active:scale-[0.98]',
                active
                  ? 'text-sky-300 bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-12px_rgba(56,189,248,0.7)]'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon
                className={cn(
                  'w-[20px] h-[20px] flex-shrink-0',
                  active && 'drop-shadow-[0_0_10px_rgba(56,189,248,0.55)]'
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn(
                'text-[8.5px] font-semibold tracking-wide leading-none',
                active ? 'text-sky-300' : 'text-slate-500'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
