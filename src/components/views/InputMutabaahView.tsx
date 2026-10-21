import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardCheck,
  Sparkles,
  Clock,
  ShieldCheck,
  HeartHandshake,
  CalendarCheck
} from 'lucide-react';

export const InputMutabaahView: React.FC = () => {
  const { user } = useApp();

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider mb-2.5">
            <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>COMING SOON</span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            Input Mutaba'ah
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
            Pusat monitoring dan rekapitulasi buku mutabaah yaumiyah santri terpadu.
          </p>
        </div>
      </div>

      {/* Main Coming Soon State Card */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200 dark:border-[#1E3048] p-5 sm:p-8 md:p-12 text-center shadow-xs">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Visual Icon Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/10">
            <ClipboardCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              SIMKA.ID Pro V1 • Roadmap Pengembangan
            </div>
            
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Input Mutaba'ah Santri
            </h2>

            {/* Exact requested description with optimal mobile & desktop typography */}
            <p className="text-[15px] sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl mx-auto font-normal text-center">
              Modul ini akan memudahkan musyrif/ah dalam merekap Buku Mutabaah Yaumiyah santri, sehingga memudahkan untuk sistem perapotan di akhir semester / tahun ajaran
            </p>
          </div>

          {/* Feature Highlights Grid Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1424] border border-slate-200/80 dark:border-[#1A2C46] space-y-1.5 flex flex-col justify-start">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>Mutaba'ah Harian</span>
              </div>
              <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Pencatatan Ibadah harian sesuai buku mutabaah yaumiyah santri
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1424] border border-slate-200/80 dark:border-[#1A2C46] space-y-1.5 flex flex-col justify-start">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Tindak Lanjut</span>
              </div>
              <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Koneksi langsung antara poin pelanggaran dan tahapan evaluasi pembinaan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1424] border border-slate-200/80 dark:border-[#1A2C46] space-y-1.5 flex flex-col justify-start">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span>Laporan Wali</span>
              </div>
              <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sinkronisasi berkala perkembangan karakter santri untuk orang tua/wali santri.
              </p>
            </div>
          </div>

          {/* Info Notice Box */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1A2D48] text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Sedang dalam tahap finalisasi dan pengujian fitur oleh tim pengembang.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
