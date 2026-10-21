import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PointBadge } from '../common/PointBadge';
import { UnitPesantren, PelanggaranKategori, RiwayatPelanggaran, Pelanggaran } from '../../types';
import { exportRiwayatPelanggaranPDF, getOfficialKategori } from '../../lib/exportPelanggaranPdf';
import { exportMutabaahPembinaanPDF } from '../../lib/exportPembinaanPdf';
import { generatePembinaanFormData } from '../../lib/pembinaanHelper';
import { EditRiwayatModal } from '../common/EditRiwayatModal';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  GraduationCap,
  Download,
  Filter,
  Calendar,
  Building2,
  Layers,
  RotateCcw,
  Trash2,
  AlertTriangle,
  X,
  Check,
  CheckCircle2,
  Clock,
  RotateCw,
  Pencil
} from 'lucide-react';

export const RekapPelanggaranView: React.FC = () => {
  const {
    user,
    riwayatList,
    allRiwayatList,
    toggleStatusPelanggaran,
    deleteRiwayatPelanggaran,
    updateRiwayatPelanggaran,
    markPembinaanSelesai,
    santriList,
    allSantriList,
    pelanggaranList,
    usersList,
    getPembinaanBySinglePoin,
    setSelectedSantriForDetail,
    showToast
  } = useApp();
  
  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';
  const isKoordinator = user?.role === 'KOORDINATOR';
  const isMusyrif = user?.role === 'MUSYRIF';
  const canExport = isSuperadmin || isKoordinator;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    isSuperadmin ? 'ALL' : user?.unit || 'ALL'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [deletingLog, setDeletingLog] = useState<RiwayatPelanggaran | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingLog, setEditingLog] = useState<RiwayatPelanggaran | null>(null);

  const [completingLog, setCompletingLog] = useState<RiwayatPelanggaran | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const [downloadingMutabaahId, setDownloadingMutabaahId] = useState<string | null>(null);

  // Helper check: Apakah santri ini binaan musyrif saat ini?
  const isSantriBinaanMusyrif = (log: RiwayatPelanggaran): boolean => {
    if (!user || user.role !== 'MUSYRIF') return false;
    if (log.santriUnit !== user.unit) return false;

    const cleanUserName = user.nama.toLowerCase().trim();
    const santri = allSantriList.find(
      (s) => s.id === log.santriId || (s.nama && log.santriNama && s.nama.toLowerCase().trim() === log.santriNama.toLowerCase().trim())
    );
    if (!santri) return false;
    if (santri.musyrifId && santri.musyrifId === user.id) return true;
    if (santri.musyrifNama && santri.musyrifNama.toLowerCase().trim() === cleanUserName) return true;
    if (santri.musyrif && santri.musyrif.toLowerCase().trim() === cleanUserName) return true;
    return false;
  };

  // Helper check: Apakah user boleh download Mutabaah untuk baris kasus ini?
  const canDownloadMutabaah = (log: RiwayatPelanggaran): boolean => {
    if (!user) return false;
    if (isSuperadmin) return true;
    if (isKoordinator) return user.unit === 'ALL' || user.unit === log.santriUnit;
    if (isMusyrif) return isSantriBinaanMusyrif(log);
    return false;
  };

  // Helper check: Apakah user boleh edit kasus baris ini? (Koordinator unit & Kasie superadmin)
  const canEditKasus = (log: RiwayatPelanggaran): boolean => {
    if (!user) return false;
    if (isSuperadmin) return true;
    if (isKoordinator) return user.unit === 'ALL' || user.unit === log.santriUnit;
    // Musyrif explicitly cannot edit
    return false;
  };

  // Helper check: Apakah user boleh hapus kasus baris ini? (Koordinator unit & Kasie superadmin)
  const canDeleteKasus = (log: RiwayatPelanggaran): boolean => {
    if (!user) return false;
    if (isSuperadmin) return true;
    if (isKoordinator) return user.unit === 'ALL' || user.unit === log.santriUnit;
    // Musyrif explicitly cannot delete
    return false;
  };

  const handleDownloadMutabaah = (log: RiwayatPelanggaran, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!canDownloadMutabaah(log)) {
      showToast(
        'Akses Ditolak',
        isMusyrif
          ? 'Musyrif hanya dapat mengunduh Mutabaah Pembinaan untuk santri dalam tanggung jawab binaannya.'
          : 'Anda tidak memiliki hak akses untuk mengunduh dokumen kasus ini.',
        'error'
      );
      return;
    }

    // 1. Ambil data santri aktual dari database secara presisi berdasarkan id dan unit
    const santri = allSantriList.find((s) => s.id === log.santriId) ||
      allSantriList.find((s) => s.nama && log.santriNama && s.nama.toLowerCase().trim() === log.santriNama.toLowerCase().trim() && s.unit === log.santriUnit);

    if (!santri) {
      showToast('Data Tidak Lengkap', 'Data santri terkait tidak ditemukan dalam database.', 'error');
      return;
    }

    // 2. Ambil master pelanggaran aktual untuk kode referensi
    const masterItem = pelanggaranList.find(
      (p) => (log.jenisPelanggaranId && p.id === log.jenisPelanggaranId) || (log.jenisPelanggaranNama && p.jenis.toLowerCase().trim() === log.jenisPelanggaranNama.toLowerCase().trim())
    );

    // Tetap gunakan POIN KASUS ASLI dan IDENTITAS PELANGGARAN dari catatan riwayat yang dipilih
    const targetPelanggaran: Pelanggaran = {
      id: log.jenisPelanggaranId || masterItem?.id || `pel-${log.id}`,
      kode: masterItem?.kode || '',
      jenis: log.jenisPelanggaranNama || masterItem?.jenis || 'Pelanggaran',
      kategori: getOfficialKategori(log.poin).label as PelanggaranKategori,
      poin: log.poin, // POIN ASLI KASUS INI (TIDAK BOLEH BERUBAH)
      konsekuensi: log.hukuman || masterItem?.konsekuensi || '-'
    };

    // 3. Validasi ketersediaan ketentuan pembinaan (5-99 poin)
    const pembinaan = getPembinaanBySinglePoin(log.poin);
    if (!pembinaan) {
      showToast(
        'Data Pembinaan Belum Tersedia',
        `Pelanggaran dengan ${log.poin} poin belum memiliki ketentuan pembinaan resmi yayasan (rentang 5–99 poin). Dokumen mutaba'ah tidak dapat digenerate sebelum ketentuan pembinaan ditetapkan.`,
        'warning'
      );
      return;
    }

    // 4. Generate data pembinaan murni READ-ONLY (Tanpa insert, upsert, update, atau penambahan poin berulang)
    try {
      setDownloadingMutabaahId(log.id);
      const formData = generatePembinaanFormData({
        santri,
        pelanggaran: targetPelanggaran,
        pembinaan,
        user,
        usersList,
        startDate: log.timestamp || log.tanggal,
        tanggalPelanggaran: log.tanggal,
        kasusId: log.id,
        isNewRecord: false // Kasus sudah tersimpan, totalPoin adalah akumulasi riil
      });

      // Pure client-side PDF vector rendering & download
      exportMutabaahPembinaanPDF(formData);

      showToast(
        'Mutaba\'ah Berhasil Diunduh',
        `Dokumen resmi Mutaba'ah Pembinaan Santri (${santri.nama} - Tingkat ${pembinaan.tingkat}) berhasil diunduh.`,
        'success'
      );
    } catch (err: any) {
      console.error('[DOWNLOAD MUTABAAH ERROR]', err);
      showToast('Gagal Mengunduh', err?.message || 'Terjadi kesalahan saat memproses file PDF.', 'error');
    } finally {
      setDownloadingMutabaahId(null);
    }
  };

  const canManageSelesai = (itemUnit?: string) => {
    if (!user) return false;
    if (isSuperadmin) return true;
    if (isKoordinator && itemUnit && user.unit === itemUnit) return true;
    return false;
  };

  const handleConfirmComplete = async () => {
    if (!completingLog) return;
    setIsCompleting(true);
    try {
      await markPembinaanSelesai(completingLog.id);
      setCompletingLog(null);
    } finally {
      setIsCompleting(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return riwayatList.filter((log) => {
      // 1. Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.santriNama.toLowerCase().includes(q) ||
        log.jenisPelanggaranNama.toLowerCase().includes(q) ||
        log.santriKelas.toLowerCase().includes(q) ||
        (log.hukuman && log.hukuman.toLowerCase().includes(q)) ||
        (log.catatan && log.catatan.toLowerCase().includes(q));

      // 2. Unit match
      const matchUnit =
        selectedUnit === 'ALL' ||
        log.santriUnit === selectedUnit;

      // 3. Category match
      const calculatedKategori = getOfficialKategori(log.poin).label;
      const matchCategory =
        selectedCategory === 'All' ||
        calculatedKategori === selectedCategory ||
        (log as any).kategori === selectedCategory;

      // 4. Date Range match
      let matchDate = true;
      if (startDate || endDate) {
        const logDateStr = log.tanggal ? log.tanggal.slice(0, 10) : '';
        if (startDate && logDateStr && logDateStr < startDate) {
          matchDate = false;
        }
        if (endDate && logDateStr && logDateStr > endDate) {
          matchDate = false;
        }
      }

      return matchSearch && matchUnit && matchCategory && matchDate;
    });
  }, [riwayatList, searchQuery, selectedUnit, selectedCategory, startDate, endDate]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleExportPDF = () => {
    if (!canExport) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan dan Koordinator yang dapat mengekspor laporan PDF.', 'error');
      return;
    }

    if (filteredLogs.length === 0) {
      showToast('Data Kosong', 'Tidak ada data riwayat pelanggaran untuk diekspor ke PDF.', 'warning');
      return;
    }

    try {
      exportRiwayatPelanggaranPDF(filteredLogs, {
        unitFilter: selectedUnit,
        searchQuery: searchQuery,
        userRole: user?.role,
        userName: user?.nama
      });

      showToast(
        'PDF Berhasil Dibuat',
        `Laporan PDF Riwayat Pelanggaran (${filteredLogs.length} data) berhasil diunduh.`,
        'success'
      );
    } catch (err: any) {
      console.error('[EXPORT PDF ERROR]', err);
      showToast('Gagal Membuat PDF', err?.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLog) return;
    setIsDeleting(true);
    try {
      const success = await deleteRiwayatPelanggaran(deletingLog.id);
      if (success) {
        setDeletingLog(null);
      }
    } catch (err: any) {
      showToast('Gagal Menghapus', err?.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    if (isSuperadmin) setSelectedUnit('ALL');
    setSelectedCategory('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Page Header - Compact & Responsive */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 p-4 sm:p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-[10px] font-bold tracking-wider mb-1">
              <History className="w-3 h-3" />
              <span>Rekam Jejak Kedisiplinan • {user ? (isSuperadmin ? (selectedUnit === 'ALL' ? 'Semua Unit' : `Unit ${selectedUnit}`) : `Unit ${user.unit}`) : ''}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Rekap Riwayat Pelanggaran
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5">
              Riwayat kronologis pencatatan pelanggaran santri dan akumulasi poin kedisiplinan.
            </p>
          </div>

          {/* Export PDF Button - Only for Kasie & Koordinator */}
          {canExport && (
            <button
              id="btn-export-pdf-rekap"
              onClick={handleExportPDF}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-emerald-900 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto active:scale-95"
              title="Export Rekap Pelanggaran ke Dokumen PDF A4 Standar"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export PDF</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                {filteredLogs.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Filters Card - Compact */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama santri, kelas, pelanggaran, atau sanksi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Unit Filter (Kasie / Koordinator) */}
          {(isSuperadmin || isKoordinator) && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] self-start lg:self-auto shrink-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              {(['ALL', 'SMP', 'MA', 'SMA'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => {
                    setSelectedUnit(unit);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    selectedUnit === unit
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {unit === 'ALL' ? 'Semua Unit' : unit}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Filters: Category, Date Range & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#182740] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Kategori:</span>
              <select
                id="select-filter-kategori-rekap"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="All">Semua Kategori</option>
                <option value="Ringan">Ringan (5–49)</option>
                <option value="Sedang">Sedang (50–79)</option>
                <option value="Berat">Berat (80–94)</option>
                <option value="Sangat Berat">Sangat Berat (95–100)</option>
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Dari"
                className="bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-300 text-[11px] focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-[11px]">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Sampai"
                className="bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-300 text-[11px] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reset Filters */}
          {(searchQuery || (isSuperadmin && selectedUnit !== 'ALL') || selectedCategory !== 'All' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#182740]">
              <tr>
                <th className="py-2.5 px-3">TGL / WAKTU</th>
                <th className="py-2.5 px-3">NAMA SANTRI</th>
                <th className="py-2.5 px-3">KELAS & UNIT</th>
                <th className="py-2.5 px-3">JENIS PELANGGARAN</th>
                <th className="py-2.5 px-3 text-center">POIN</th>
                <th className="py-2.5 px-3 text-center">KATEGORI</th>
                <th className="py-2.5 px-3">PELAPOR</th>
                <th className="py-2.5 px-3">SANKSI / KONSEKUENSI</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">STATUS</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[105px]">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#182740] text-slate-800 dark:text-slate-200">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 italic">
                    <p className="font-bold text-slate-600 dark:text-slate-300">Tidak ada catatan pelanggaran ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter yang aktif.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const santri = santriList.find((s) => s.id === log.santriId || (s.nama && log.santriNama && s.nama.toLowerCase().trim() === log.santriNama.toLowerCase().trim()));
                  const masterItem = pelanggaranList.find((p) => p.id === log.jenisPelanggaranId || (log.jenisPelanggaranNama && p.jenis.toLowerCase().trim() === log.jenisPelanggaranNama.toLowerCase().trim()));
                  
                  // Genuine student identity resolution
                  const isSantriGeneric = !log.santriNama || log.santriNama.toLowerCase() === 'santri' || log.santriNama === '-';
                  const displaySantriNama = santri?.nama || (!isSantriGeneric ? log.santriNama : (log.santriId ? `[Santri: ${log.santriId}]` : '[Santri Tidak Terdaftar]'));
                  const displaySantriKelas = santri?.kelas || (log.santriKelas && log.santriKelas !== '-' ? log.santriKelas : '');
                  const displaySantriUnit = santri?.unit || log.santriUnit || 'SMP';

                  // Genuine violation identity resolution
                  const isJenisGeneric = !log.jenisPelanggaranNama || log.jenisPelanggaranNama.toLowerCase().includes('tata tertib') || log.jenisPelanggaranNama === '-';
                  const displayJenis = masterItem?.jenis || (!isJenisGeneric ? log.jenisPelanggaranNama : (log.jenisPelanggaranId ? `[Pelanggaran: ${log.jenisPelanggaranId}]` : '[Pelanggaran Tidak Terdaftar]'));
                  const displayPoin = log.poin > 0 ? log.poin : (masterItem?.poin || 0);
                  const displayHukuman = (log.hukuman && log.hukuman !== '-') ? log.hukuman : (masterItem?.konsekuensi || '-');

                  const kategoriInfo = getOfficialKategori(displayPoin);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#13223A] transition-colors group"
                    >
                      <td className="py-2 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {log.tanggal}
                      </td>

                      <td
                        onClick={() => santri && setSelectedSantriForDetail(santri)}
                        className={`py-2 px-3 max-w-[170px] ${santri ? 'cursor-pointer' : ''}`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={displaySantriNama}>
                          {displaySantriNama}
                        </div>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#132138] border border-slate-200 dark:border-[#1E2E4A] font-bold text-[10px] text-slate-700 dark:text-slate-300">
                          <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {displaySantriKelas ? `${displaySantriKelas} (${displaySantriUnit})` : `Unit ${displaySantriUnit}`}
                        </span>
                      </td>

                      <td className="py-2 px-3 max-w-[200px]">
                        <div className="font-semibold text-slate-900 dark:text-white truncate text-xs leading-snug" title={displayJenis}>
                          {displayJenis}
                        </div>
                        {log.catatan && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate" title={log.catatan}>
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{log.catatan}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <PointBadge points={displayPoin} size="sm" />
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            color: `rgb(${kategoriInfo.textColor.join(',')})`,
                            backgroundColor: `rgb(${kategoriInfo.bgColor.join(',')})`
                          }}
                        >
                          {kategoriInfo.label}
                        </span>
                      </td>

                      <td className="py-2 px-3 max-w-[130px]">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate" title={log.pencatat || 'Petugas'}>
                          {log.pencatat || 'Petugas'}
                        </div>
                      </td>

                      <td className="py-2 px-3 max-w-[160px] text-slate-600 dark:text-slate-300 text-[11px] truncate" title={displayHukuman}>
                        {displayHukuman}
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {log.status === 'Selesai' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Selesai</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/60 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                <Clock className="w-3 h-3" />
                                <span>Belum Selesai</span>
                              </span>
                              {canManageSelesai(displaySantriUnit) && (
                                <button
                                  type="button"
                                  onClick={() => setCompletingLog(log)}
                                  title="Tandai Pembinaan Selesai"
                                  className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/60 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. Download Mutabaah Pembinaan (PDF A4 Standar) */}
                          {canDownloadMutabaah(log) && (
                            <button
                              id={`btn-download-mutabaah-${log.id}`}
                              type="button"
                              onClick={(e) => handleDownloadMutabaah(log, e)}
                              disabled={downloadingMutabaahId === log.id}
                              title="Download Mutaba'ah Pembinaan (PDF A4 Standar)"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700/60 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              {downloadingMutabaahId === log.id ? (
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* 2. Edit / Revisi Kasus (Koordinator & Kasie/Kabid) */}
                          {canEditKasus(log) && (
                            <button
                              id={`btn-edit-kasus-${log.id}`}
                              type="button"
                              onClick={() => setEditingLog(log)}
                              title="Edit / Revisi Kasus Pelanggaran"
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-700/60 transition-all cursor-pointer active:scale-95"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3. Hapus Kasus (Koordinator & Kasie/Kabid) */}
                          {canDeleteKasus(log) && (
                            <button
                              id={`btn-delete-riwayat-${log.id}`}
                              type="button"
                              onClick={() => setDeletingLog(log)}
                              title="Hapus Kasus Pelanggaran"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-700 border border-rose-200/80 dark:border-rose-900/40 transition-all cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Jika role tidak memiliki hak aksi untuk baris ini */}
                          {!canDownloadMutabaah(log) && !canEditKasus(log) && !canDeleteKasus(log) && (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-[#182740] bg-slate-50 dark:bg-[#0B1322] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> sampai{' '}
            <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari{' '}
            <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span> log pelanggaran
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15233C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-bold text-slate-800 dark:text-slate-200 px-2 text-[11px]">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15233C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111C31] border border-slate-200 dark:border-[#1E2E4A] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hapus Catatan Pelanggaran
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Konfirmasi pembatalan / penghapusan riwayat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeletingLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <p>Apakah Anda yakin ingin menghapus catatan pelanggaran ini?</p>
              <div className="bg-white dark:bg-[#0A1322] p-2.5 rounded-lg border border-rose-200/50 dark:border-rose-900/30 font-medium space-y-1">
                <div><span className="text-slate-400">Santri:</span> <strong className="text-slate-900 dark:text-white">{deletingLog.santriNama}</strong> ({deletingLog.santriKelas})</div>
                <div><span className="text-slate-400">Pelanggaran:</span> <span className="text-rose-600 dark:text-rose-400 font-bold">{deletingLog.jenisPelanggaranNama} (+{deletingLog.poin} poin)</span></div>
                <div><span className="text-slate-400">Tanggal:</span> {deletingLog.tanggal}</div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                * Poin santri akan otomatis dikurangi kembali ({deletingLog.poin} poin).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingLog(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E2E4A] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162540] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Catatan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Tandai Pembinaan Selesai */}
      {completingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200 dark:border-[#1E3048] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Tandai Pembinaan Selesai?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konfirmasi penyelesaian tindak lanjut kasus santri
                </p>
              </div>
            </div>

            <div className="my-3.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200/70 dark:border-[#1A2D48] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Santri:</span>
                <strong className="text-slate-900 dark:text-white">{completingLog.santriNama}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kelas & Unit:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{completingLog.santriKelas} (Unit {completingLog.santriUnit})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kasus / Pelanggaran:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[220px]">{completingLog.jenisPelanggaranNama} (+{completingLog.poin} poin)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Tercatat:</span>
                <span className="text-slate-500 font-mono text-[10.5px]">{completingLog.tanggal}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Setelah dikonfirmasi, status kasus akan disimpan permanen sebagai <strong>Selesai</strong> di database Supabase dan kartu <em>Belum Selesai</em> di Dashboard akan berkurang.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingLog(null)}
                disabled={isCompleting}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E3048] hover:bg-slate-100 dark:hover:bg-[#15233C] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={isCompleting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCompleting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isCompleting ? 'Menyimpan...' : 'Tandai Selesai'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit / Revisi Kasus Pelanggaran */}
      <EditRiwayatModal
        isOpen={!!editingLog}
        riwayat={editingLog}
        onClose={() => setEditingLog(null)}
      />
    </div>
  );
};
