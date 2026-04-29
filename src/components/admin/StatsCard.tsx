import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: 'blue' | 'emerald' | 'amber' | 'violet';
  hint?: string;
}

const accentMap = {
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    iconRing: 'ring-blue-100',
    glow: 'from-blue-500/15',
    rail: 'bg-gradient-to-b from-blue-400 to-blue-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    iconRing: 'ring-emerald-100',
    glow: 'from-emerald-500/15',
    rail: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    iconRing: 'ring-amber-100',
    glow: 'from-amber-500/15',
    rail: 'bg-gradient-to-b from-amber-400 to-amber-600',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    iconRing: 'ring-violet-100',
    glow: 'from-violet-500/15',
    rail: 'bg-gradient-to-b from-violet-400 to-violet-600',
  },
};

export default function StatsCard({
  icon: Icon,
  label,
  value,
  accent = 'blue',
  hint,
}: StatsCardProps) {
  const c = accentMap[accent];
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_30px_-12px_rgba(15,23,42,0.16)]">
      {/* Accent rail */}
      <span className={cn('absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full opacity-80', c.rail)} />
      {/* Decorative gradient blob */}
      <div
        className={cn(
          'absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br to-transparent blur-2xl pointer-events-none opacity-70 transition-opacity duration-500 group-hover:opacity-100',
          c.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.14em] leading-tight max-w-[10rem]">
          {label}
        </p>
        <div
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105',
            c.iconBg,
            c.iconRing,
          )}
        >
          <Icon className={cn('w-[17px] h-[17px]', c.iconText)} strokeWidth={2.2} />
        </div>
      </div>

      <p className="relative text-[28px] font-bold text-slate-900 leading-none tabular-nums tracking-tight">
        {value}
      </p>

      {hint && (
        <p className="relative text-[11.5px] font-medium text-slate-400 mt-2.5">{hint}</p>
      )}
    </div>
  );
}
