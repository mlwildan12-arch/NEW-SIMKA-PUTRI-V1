import React, { useState } from 'react';
import { MasterPembinaan, Santri, Pelanggaran, UserAccount } from '../../types';
import {
  categorizePembinaan,
  getLevelDuration,
  getSeverityCategory,
  calculatePembinaanDates,
  generatePembinaanFormData
} from '../../lib/pembinaanHelper';
import { FormPembinaanModal } from '../common/FormPembinaanModal';
import {
  ShieldCheck,
  Timer,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Activity,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Info,
  Download,
  Printer,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RekomendasiPembinaanSectionProps {
  selectedPelanggaran: Pelanggaran;
  selectedSantri: Santri | null;
  pembinaan: MasterPembinaan | null;
  currentUser: UserAccount | null;
  usersList?: UserAccount[];
}

export const RekomendasiPembinaanSection: React.FC<RekomendasiPembinaanSectionProps> = ({
  selectedPelanggaran,
  selectedSantri,
  pembinaan,
  currentUser,
  usersList = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const singlePoin = selectedPelanggaran.poin;
  const severity = getSeverityCategory(singlePoin);

  // Jika poin = 100 (Sangat Berat / Dikeluarkan)
  if (singlePoin >= 100) {
    return (
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#182740] animate-in fade-in duration-300">
        <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-50/70 to-white dark:from-[#180C14] dark:to-[#12080E] border border-rose-200 dark:border-rose-500/50 shadow-xs dark:shadow-2xl relative overflow-hidden space-y-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-rose-600" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-100 dark:border-rose-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wide uppercase">
                  REKOMENDASI PEMBINAAN RESMI YAYASAN
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Ketentuan khusus pelanggaran tingkat tertinggi berdasarkan <strong className="text-rose-600 dark:text-rose-400">Poin Tunggal Pelanggaran</strong> ({singlePoin} Poin).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-rose-100/70 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 font-bold text-xs">
                {singlePoin} Poin Tunggal
              </span>
              <span className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-black text-xs tracking-wider uppercase shadow-md shadow-rose-600/30">
                SANGAT BERAT
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 text-slate-700 dark:text-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Sanksi Mutlak: Dikembalikan ke Orang Tua / Dikeluarkan</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
              Pelanggaran berbobot 100 poin merupakan pelanggaran kategori <strong>Sangat Berat</strong> (contoh: asusila berat, narkoba, petasan/senjata mematikan). Konsekuensi final diputuskan melalui Sidang Dewan Asatiz dan Pimpinan Pesantren untuk pengembalian hak asuh santri kepada orang tua/wali.
            </p>
          </div>

          {/* Severity bar */}
          <PointCategoryBar currentPoin={singlePoin} />
        </div>
      </div>
    );
  }

  // Jika tidak masuk ke rentang pembinaan resmi (< 5 poin)
  if (!pembinaan) {
    return (
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#182740] animate-in fade-in duration-300">
        <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-gradient-to-b dark:from-[#0C182B] dark:to-[#081120] border border-slate-200 dark:border-[#1E304F] shadow-xs dark:shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wide uppercase">
                REKOMENDASI PEMBINAAN RESMI YAYASAN
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Poin Tunggal Pelanggaran: <strong className="text-amber-600 dark:text-amber-400">{singlePoin} Poin</strong>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center gap-3 text-amber-900 dark:text-amber-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Belum ada ketentuan pembinaan untuk poin ini.
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                Poin {singlePoin} berada di luar rentang pembinaan resmi yayasan (5–99 poin).
              </p>
            </div>
          </div>

          <PointCategoryBar currentPoin={singlePoin} />
        </div>
      </div>
    );
  }

  // DATA RESMI TERSEDIA (TINGKAT 1 S.D 8)
  const duration = getLevelDuration(pembinaan.tingkat);
  const dates = calculatePembinaanDates(duration.targetHari, duration.toleransiHari);
  const categorized = categorizePembinaan(pembinaan.jenis_pembinaan);

  // Form Data Generator for Download
  const formData = selectedSantri
    ? generatePembinaanFormData({
        santri: selectedSantri,
        pelanggaran: selectedPelanggaran,
        pembinaan,
        user: currentUser,
        usersList,
        isNewRecord: true
      })
    : null;

  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#182740] animate-in fade-in duration-300 space-y-5">
      {/* Outer Card Container */}
      <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-emerald-50/40 via-teal-50/20 to-white dark:from-[#0C182B] dark:to-[#081120] border border-emerald-200/80 dark:border-emerald-500/35 shadow-xs dark:shadow-2xl relative overflow-hidden space-y-6">
        {/* Top Gradient Glowing Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* ================================================================ */}
        {/* 4. HEADER REKOMENDASI PEMBINAAN RESMI YAYASAN */}
        {/* ================================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#172B48]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2 flex-wrap">
                <span>REKOMENDASI PEMBINAAN RESMI YAYASAN</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Ketentuan pembinaan otomatis berdasarkan <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Poin Tunggal Pelanggaran</strong> ({singlePoin} Poin).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-100/70 dark:bg-[#0E2038] border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs tracking-wide">
              {singlePoin} Poin Tunggal
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-md shadow-emerald-500/30">
              LEVEL {pembinaan.tingkat} — {pembinaan.min_poin}–{pembinaan.max_poin} POIN
            </span>
          </div>
        </div>

        {/* Sub-header Rentang Poin Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-100/80 dark:bg-[#070F1C]/70 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#172B48]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Rentang Poin LEVEL {pembinaan.tingkat}:
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 font-extrabold text-xs">
              {pembinaan.min_poin}–{pembinaan.max_poin} Poin
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Poin tunggal menentukan level pembinaan santri</span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. KETENTUAN TARGET WAKTU PEMBINAAN */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-teal-50/70 via-emerald-50/50 to-teal-50/30 dark:from-[#0E2038] dark:to-[#0B1A2E] border border-teal-200/80 dark:border-teal-500/30 shadow-xs dark:shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-500/40 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
                <Timer className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>KETENTUAN TARGET WAKTU PEMBINAAN</span>
                </h4>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Target penyelesaian: <span className="text-emerald-700 dark:text-emerald-400 font-black">{duration.targetHari} hari</span></span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/80 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                    (+ toleransi / grace period {duration.toleransiHari} hari)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Total masa pembinaan maksimal hingga <strong>{duration.totalHari} hari kalender</strong> sejak tanggal penetapan.
                </p>
              </div>
            </div>

            {/* Dynamic Date Range Display */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white/90 dark:bg-[#070E1A]/80 p-2.5 rounded-lg border border-teal-100 dark:border-[#1A3152] shrink-0 shadow-2xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Tanggal Mulai</span>
                <span className="text-slate-800 dark:text-white font-semibold">{dates.formattedStartDate}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Target Selesai</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{dates.formattedTargetEndDate}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Batas Toleransi</span>
                <span className="text-teal-700 dark:text-teal-300 font-semibold">{dates.formattedGraceEndDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 1. UBAH TEMPLATE REKOMENDASI MENJADI 4 BAGIAN / CARD UTAMA */}
        {/* ================================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Rincian Butir Tindakan Pembinaan Resmi (4 Kategori)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Total {pembinaan.jenis_pembinaan.length} butir
            </span>
          </div>

          {/* Desktop 2 Kolom, Mobile 1 Kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: TINDAKAN ADMINISTRASI & ALUR */}
            <CategoryCard
              number="1"
              title="TINDAKAN ADMINISTRASI & ALUR"
              icon={<FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              items={categorized.administrasi}
              badgeColor="emerald"
            />

            {/* CARD 2: PEMBINAAN SPIRITUAL */}
            <CategoryCard
              number="2"
              title="PEMBINAAN SPIRITUAL"
              icon={<Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
              items={categorized.spiritual}
              badgeColor="teal"
            />

            {/* CARD 3: TINDAKAN FISIK / SOSIAL MENDIDIK */}
            <CategoryCard
              number="3"
              title="TINDAKAN FISIK / SOSIAL MENDIDIK"
              icon={<Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              items={categorized.fisik}
              badgeColor="amber"
            />

            {/* CARD 4: PENUGASAN AKADEMIK / NASIHAT */}
            <CategoryCard
              number="4"
              title="PENUGASAN AKADEMIK / NASIHAT"
              icon={<GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              items={categorized.akademik}
              badgeColor="blue"
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* 8. FITUR DOWNLOAD FORM PEMBINAAN BUTTON */}
        {/* ================================================================ */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100/90 dark:bg-[#070F1C]/90 p-4 rounded-xl border border-slate-200 dark:border-[#172B48]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Form Mutaba'ah Pembinaan Santri ({pembinaan.nama_tingkat})
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dokumen resmi yayasan siap cetak & tanda tangan (A4 Portrait).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedSantri) {
                alert('Silakan pilih nama santri di atas terlebih dahulu untuk mencetak form pembinaan.');
                return;
              }
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Form Pembinaan</span>
          </button>
        </div>

        {/* ================================================================ */}
        {/* 5. KATEGORI POIN / TINGKAT PELANGGARAN VISUAL BAR */}
        {/* ================================================================ */}
        <PointCategoryBar currentPoin={singlePoin} />
      </div>

      {/* Modal Preview & Print Form Pembinaan */}
      {formData && (
        <FormPembinaanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={formData}
        />
      )}
    </div>
  );
};

// Sub-component for each of the 4 Category Cards
interface CategoryCardProps {
  number: string;
  title: string;
  icon: React.ReactNode;
  items: string[];
  badgeColor: 'emerald' | 'teal' | 'amber' | 'blue';
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  number,
  title,
  icon,
  items,
  badgeColor
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    teal: 'bg-teal-50 dark:bg-teal-500/15 border-teal-200 dark:border-teal-500/30 text-teal-700 dark:text-teal-400',
    amber: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
  }[badgeColor];

  const dotClasses = {
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500'
  }[badgeColor];

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#081222] border border-slate-200 dark:border-[#192C4B] hover:border-emerald-400/60 dark:hover:border-emerald-500/35 transition-all shadow-xs flex flex-col justify-between space-y-3 group">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-[#14233D]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-[#0F2038] border border-slate-200 dark:border-[#1E365E] text-slate-700 dark:text-white font-bold text-[11px] flex items-center justify-center shrink-0">
            {number}
          </div>
          <h5 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase truncate">
            {title}
          </h5>
        </div>
        <div className="p-1 rounded-md bg-slate-50 dark:bg-[#0E1F36] shrink-0">
          {icon}
        </div>
      </div>

      <div className="space-y-2 text-xs flex-1">
        {items.length === 0 ? (
          <p className="text-[11px] italic text-slate-400 dark:text-slate-500 py-1">
            - Tidak ada butir khusus pada level ini -
          </p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed text-[11.5px]">
              <span className={`w-1.5 h-1.5 rounded-full ${dotClasses} shrink-0 mt-1.5`} />
              <span>{item}</span>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-[#121E33] flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span>{items.length} butir tindakan</span>
        <span className={`px-2 py-0.5 rounded border font-semibold ${badgeClasses}`}>
          Aktif
        </span>
      </div>
    </div>
  );
};

// Sub-component for Point Category Severity Bar
const PointCategoryBar: React.FC<{ currentPoin: number }> = ({ currentPoin }) => {
  const categories = [
    {
      key: 'ringan',
      label: 'Ringan',
      levelText: 'Level 1–5',
      range: '5–49 Poin',
      color: 'border-blue-200 dark:border-blue-500/40 text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10',
      activeColor: 'bg-blue-500 text-white font-black border-blue-400 ring-2 ring-blue-500/40',
      isMatch: currentPoin >= 5 && currentPoin <= 49
    },
    {
      key: 'sedang',
      label: 'Sedang',
      levelText: 'Level 6–7',
      range: '50–79 Poin',
      color: 'border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10',
      activeColor: 'bg-amber-500 text-slate-950 font-black border-amber-400 ring-2 ring-amber-500/40',
      isMatch: currentPoin >= 50 && currentPoin <= 79
    },
    {
      key: 'berat',
      label: 'Berat',
      levelText: 'Level 8',
      range: '80–94 Poin',
      color: 'border-red-200 dark:border-red-500/40 text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-500/10',
      activeColor: 'bg-red-600 text-white font-black border-red-500 ring-2 ring-red-600/40',
      isMatch: currentPoin >= 80 && currentPoin <= 94
    },
    {
      key: 'sangat_berat',
      label: 'Sangat Berat',
      levelText: 'Level 8 / Khusus',
      range: '95–100 Poin',
      color: 'border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10',
      activeColor: 'bg-rose-700 text-white font-black border-rose-500 ring-2 ring-rose-500/50 shadow-xs',
      isMatch: currentPoin >= 95
    }
  ];

  return (
    <div className="pt-2 border-t border-slate-200 dark:border-[#172B48] space-y-2">
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Tingkat Kategori Poin &amp; Level Pembinaan:
        </span>
        <span>Indikator Resmi Level 1–8</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {categories.map((cat) => (
          <div
            key={cat.key}
            className={`p-2 rounded-lg border text-center transition-all ${
              cat.isMatch
                ? `${cat.activeColor} shadow-md`
                : `${cat.color} opacity-80 hover:opacity-100`
            }`}
          >
            <p className="text-xs font-bold leading-tight">{cat.label}</p>
            <p className="text-[10.5px] font-extrabold mt-0.5 tracking-tight">{cat.levelText}</p>
            <p className="text-[9.5px] opacity-85">{cat.range}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
