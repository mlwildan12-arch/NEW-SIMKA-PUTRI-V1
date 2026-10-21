import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { MosqueLogoIcon } from './IslamicPattern';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  // Indonesian Date Formatter
  const getFormattedDate = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 bg-[#070D1A]/95 backdrop-blur-md border-b border-[#152238]">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#0E1A2E] border border-[#1B2A45] focus:outline-none"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <MosqueLogoIcon className="w-7 h-7" />
          <span className="font-extrabold text-white text-base tracking-wider">
            SIMKA<span className="text-emerald-400">.ID</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1C32] border border-[#1B2C48] text-xs font-semibold text-emerald-400">
        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">{getFormattedDate()}</span>
        <span className="sm:hidden">8 Sep 2026</span>
      </div>
    </header>
  );
};
