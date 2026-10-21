import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../../types';

export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { resolvedTheme, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: React.ElementType }[] = [
    { mode: 'light', label: 'Terang', icon: Sun },
    { mode: 'dark', label: 'Gelap', icon: Moon },
  ];

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] shadow-xs ${className}`}
      role="radiogroup"
      aria-label="Pilih Tema Tampilan"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = resolvedTheme === opt.mode;

        return (
          <button
            key={opt.mode}
            onClick={() => setThemeMode(opt.mode)}
            title={`Mode ${opt.label}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-[#10243E] text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-[#101C2F]'
            }`}
            role="radio"
            aria-checked={isSelected}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

