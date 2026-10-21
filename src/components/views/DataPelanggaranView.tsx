import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Pelanggaran, PelanggaranKategori } from '../../types';
import { KategoriPelanggaranBadge, getKategoriFromPoin } from '../common/PointBadge';
import { AddPelanggaranModal } from '../common/AddPelanggaranModal';
import { EditPelanggaranModal } from '../common/EditPelanggaranModal';
import { ImportPelanggaranModal } from '../common/ImportPelanggaranModal';
import { DeletePelanggaranModal } from '../common/DeletePelanggaranModal';
import { DeleteAllPelanggaranModal } from '../common/DeleteAllPelanggaranModal';
import { 
  exportPelanggaranToExcel, 
  generatePelanggaranExcelTemplate 
} from '../../lib/excelHelper';
import { sortMasterPelanggaranList } from '../../lib/sortingHelper';
import {
  BookOpen,
  Search,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  ShieldAlert,
  Sparkles,
  Layers,
  FileDown,
  AlertOctagon,
  AlertTriangle
} from 'lucide-react';

type CategoryFilter = 'All' | PelanggaranKategori;

export const DataPelanggaranView: React.FC = () => {
  const { pelanggaranList, user, showToast } = useApp();

  const isKasie = user?.role === 'KASIE_KEPESANTRENAN';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [editingPelanggaran, setEditingPelanggaran] = useState<Pelanggaran | null>(null);
  const [deletingPelanggaran, setDeletingPelanggaran] = useState<Pelanggaran | null>(null);

  // Quick stats using official category rules
  const stats = useMemo(() => {
    let ringan = 0;
    let sedang = 0;
    let berat = 0;
    let sangatBerat = 0;

    for (const p of pelanggaranList) {
      const kat = getKategoriFromPoin(p.poin).kategori;
      if (kat === 'Sangat Berat') sangatBerat++;
      else if (kat === 'Berat') berat++;
      else if (kat === 'Sedang') sedang++;
      else ringan++;
    }

    return {
      total: pelanggaranList.length,
      ringan,
      sedang,
      berat,
      sangatBerat
    };
  }, [pelanggaranList]);

  // Filter list strictly based on points-derived category
  const filteredPelanggaran = useMemo(() => {
    const filtered = pelanggaranList.filter((item) => {
      const matchSearch =
        item.jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.konsekuensi.toLowerCase().includes(searchQuery.toLowerCase());

      const itemKategori = getKategoriFromPoin(item.poin).kategori;
      const matchCategory =
        selectedCategory === 'All' || itemKategori === selectedCategory;

      return matchSearch && matchCategory;
    });
    return sortMasterPelanggaranList(filtered);
  }, [pelanggaranList, searchQuery, selectedCategory]);

  const handleDownloadTemplate = () => {
    if (!isKasie) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang berwenang mengunduh template.', 'error');
      return;
    }
    try {
      generatePelanggaranExcelTemplate();
      showToast('Template Diunduh', 'Template Excel Master Pelanggaran siap digunakan.', 'info');
    } catch (err: any) {
      showToast('Gagal Mengunduh', err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleExport = () => {
    if (!isKasie) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang berwenang mengekspor data master.', 'error');
      return;
    }
    if (pelanggaranList.length === 0) {
      showToast('Data Kosong', 'Tidak ada data master pelanggaran untuk diekspor.', 'warning');
      return;
    }

    try {
      exportPelanggaranToExcel(pelanggaranList, 'Master_Data_Pelanggaran', user?.role);
      showToast('Ekspor Berhasil', 'Data Master Pelanggaran berhasil diunduh sebagai file Excel.', 'success');
    } catch (err: any) {
      showToast('Gagal Ekspor', err.message || 'Terjadi kesalahan saat mengekspor data.', 'error');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Page Header Banner - Sleek & Compact */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-[10px] font-bold tracking-wider mb-1">
              <BookOpen className="w-3 h-3" />
              <span>Master Kamus Tata Tertib</span>
              {!isKasie && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[9px] font-semibold">
                  Mode Lihat
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Data Master Pelanggaran
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-100/80 mt-0.5 max-w-xl leading-relaxed">
              Daftar rujukan resmi jenis pelanggaran kedisiplinan santri, bobot poin terstandar, dan sanksi edukatif.
            </p>
          </div>

          {/* Action Buttons Toolbar (Only for Kasie / Super Admin) */}
          {isKasie && (
            <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
              <button
                id="btn-open-add-pelanggaran"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-sm shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah</span>
              </button>

              <button
                id="btn-open-import-pelanggaran"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>

              <button
                id="btn-download-pelanggaran-template"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer"
                title="Download Template Format Excel"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>

              <button
                id="btn-export-pelanggaran-excel"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer"
                title="Ekspor Data Master ke Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              {pelanggaranList.length > 0 && (
                <button
                  id="btn-open-delete-all-master"
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-600 text-white font-semibold text-xs border border-rose-400/30 transition-all cursor-pointer"
                  title="Hapus / Reset Seluruh Master Pelanggaran (Hanya Kasie)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Master</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metric Mini Cards - Compact & Fast */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C2F] border border-slate-200/80 dark:border-[#1E3048] shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Jenis</div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30">
          <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Ringan (5–49)</div>
          <div className="text-lg font-black text-blue-800 dark:text-blue-300 mt-0.5">{stats.ringan}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Sedang (50–79)</div>
          <div className="text-lg font-black text-amber-800 dark:text-amber-300 mt-0.5">{stats.sedang}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30">
          <div className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Berat (80–94)</div>
          <div className="text-lg font-black text-red-800 dark:text-red-300 mt-0.5">{stats.berat}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/30">
          <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Sangat Berat (95–100)</div>
          <div className="text-lg font-black text-rose-800 dark:text-rose-300 mt-0.5">{stats.sangatBerat}</div>
        </div>
      </div>

      {/* Filter & Search Bar - Compact */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-input-pelanggaran"
            type="text"
            placeholder="Cari kode, item pelanggaran, atau hukuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {(
            [
              { label: 'Semua', value: 'All' },
              { label: 'Ringan (5–49)', value: 'Ringan' },
              { label: 'Sedang (50–79)', value: 'Sedang' },
              { label: 'Berat (80–94)', value: 'Berat' },
              { label: 'Sangat Berat (95–100)', value: 'Sangat Berat' }
            ] as const
          ).map((filter) => {
            const isActive = selectedCategory === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedCategory(filter.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-100 dark:bg-[#0A1322] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1E3048] hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Violations Catalog Table or Empty State */}
      {pelanggaranList.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Belum ada data master pelanggaran.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Kamus tata tertib dan master pelanggaran saat ini kosong. Anda dapat menambahkan jenis pelanggaran baru secara manual atau mengimpor file Excel.
          </p>

          {isKasie && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                id="btn-empty-add-pelanggaran"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Tambah Pelanggaran</span>
              </button>

              <button
                id="btn-empty-import-pelanggaran"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel</span>
              </button>

              <button
                id="btn-empty-download-template"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Download Template Excel</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#182740]">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">KODE</th>
                  <th className="py-2.5 px-3.5">ITEM PELANGGARAN</th>
                  <th className="py-2.5 px-3 w-32 text-center">KATEGORI</th>
                  <th className="py-2.5 px-3 w-24 text-center">BOBOT POIN</th>
                  <th className="py-2.5 px-3.5">HUKUMAN / KONSEKUENSI</th>
                  {isKasie && <th className="py-2.5 px-3 w-20 text-center">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#182740] text-slate-700 dark:text-slate-200">
                {filteredPelanggaran.length === 0 ? (
                  <tr>
                    <td colSpan={isKasie ? 6 : 5} className="py-10 text-center text-slate-400 italic">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada jenis pelanggaran yang cocok</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian yang lain.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPelanggaran.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#13223A] transition-colors"
                    >
                      <td className="py-2 px-3 whitespace-nowrap text-center font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                        {item.kode}
                      </td>
                      <td className="py-2 px-3.5 max-w-[260px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate text-xs leading-snug" title={item.jenis}>
                          {item.jenis}
                        </div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        <KategoriPelanggaranBadge kategori={item.kategori} poin={item.poin} size="sm" />
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        <span className="font-black text-rose-600 dark:text-rose-400 text-xs font-mono">
                          +{item.poin}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 max-w-[300px]">
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate leading-snug" title={item.konsekuensi || '-'}>
                          {item.konsekuensi || '-'}
                        </div>
                      </td>
                      {isKasie && (
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-edit-pelanggaran-${item.id}`}
                              type="button"
                              onClick={() => setEditingPelanggaran(item)}
                              title="Edit Data Pelanggaran"
                              className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-pelanggaran-${item.id}`}
                              type="button"
                              onClick={() => setDeletingPelanggaran(item)}
                              title="Hapus Data Pelanggaran"
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPelanggaranModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditPelanggaranModal
        isOpen={!!editingPelanggaran}
        pelanggaran={editingPelanggaran}
        onClose={() => setEditingPelanggaran(null)}
      />

      <ImportPelanggaranModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <DeletePelanggaranModal
        isOpen={!!deletingPelanggaran}
        pelanggaran={deletingPelanggaran}
        onClose={() => setDeletingPelanggaran(null)}
      />

      <DeleteAllPelanggaranModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
      />
    </div>
  );
};
