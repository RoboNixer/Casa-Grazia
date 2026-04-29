import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

export default async function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 lg:px-6 lg:py-3.5 flex items-center justify-between gap-4">
      {/* Left: static admin title */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/admin" className="text-ink-faint hover:text-ink transition-colors text-[13px] font-medium hidden lg:block">
          Admin
        </Link>
        <div className="flex items-center gap-1.5 min-w-0">
          <LayoutDashboard className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
          <span className="text-[13px] font-semibold text-ink truncate">Admin</span>
        </div>
      </div>

      {/* Right: status dot */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-700">Online</span>
        </div>
      </div>
    </header>
  );
}
