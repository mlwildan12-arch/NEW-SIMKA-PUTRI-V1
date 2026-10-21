import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  colorScheme: 'red' | 'blue' | 'orange' | 'green';
  suffix?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  colorScheme,
  suffix,
  onClick
}) => {
  const schemeStyles = {
    red: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      badgeBg: 'text-rose-400',
      glow: 'group-hover:shadow-rose-500/5'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      badgeBg: 'text-blue-400',
      glow: 'group-hover:shadow-blue-500/5'
    },
    orange: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      badgeBg: 'text-amber-400',
      glow: 'group-hover:shadow-amber-500/5'
    },
    green: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      badgeBg: 'text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/5'
    }
  }[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111D32] to-[#0E1729] p-5 sm:p-6 border transition-all duration-200 shadow-lg ${schemeStyles.border} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {value}
            </span>
            {suffix && (
              <span className="text-xs font-semibold text-slate-400">
                {suffix}
              </span>
            )}
          </div>
        </div>

        <div className={`p-3.5 rounded-xl ${schemeStyles.iconBg} shrink-0 transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
