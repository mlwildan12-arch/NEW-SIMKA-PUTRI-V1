import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Edit,
  Trash2,
  AlertCircle,
  Building2,
  Calendar,
  User,
  Plus
} from 'lucide-react';
import { PembinaanRecord } from '../../types';
import { FormPembinaanA4 } from '../common/FormPembinaanA4';

export const RiwayatPembinaanView: React.FC = () => {
  const {
    pembinaanList,
    allSantriList,
    updatePembinaanStatus,
    deletePembinaan,
    user,
    setCurrentRoute
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  // Print modal state
  const [printRecord, setPrintRecord] = useState<PembinaanRecord | null>(null);

  // Evaluation note edit modal state
  const [editingRecord, setEditingRecord] = useState<PembinaanRecord | null>(null);
  const [evaluationNote, setEvaluationNote] = useState('');

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    return pembinaanList.filter((p) => {
      const matchSearch =
        p.santriNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.jenisPembinaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pembina.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.santriKelas.toLowerCase().includes(searchQuery.toLowerCase());

      const matchUnit =
        selectedUnitFilter === 'ALL' || p.santriUnit === selectedUnitFilter;

      return matchSearch && matchUnit;
    });
  }, [pembinaanList, searchQuery, selectedUnitFilter]);

  const handleOpenEdit = (p: PembinaanRecord) => {
    setEditingRecord(p);
    setEvaluationNote(p.catatan || '');
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    updatePembinaanStatus(editingRecord.id, editingRecord.status, evaluationNote);
    setEditingRecord(null);
  };

  const handleDelete = (id: string) => {
    deletePembinaan(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-6 sm:p-7 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Monitoring Pembinaan Santri</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Riwayat Tindakan Pembinaan Santri
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Pantau progres penyelesaian hukuman edukatif, evaluasi hasil pembinaan musyrif, dan cetak form berita acara resmi.
            </p>
          </div>

          <button
            onClick={() => setCurrentRoute('data-pembinaan')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-md transition-all self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pembinaan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari riwayat pembinaan berdasarkan nama santri, pembina, atau jenis tindakan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Unit Filter */}
            {user?.role === 'KASIE_KEPESANTRENAN' && (
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Unit</option>
                <option value="SMP">Unit SMP</option>
                <option value="MA">Unit MA</option>
                <option value="SMA">Unit SMA</option>
              </select>
            )}

          </div>
        </div>

        {/* History Records Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Santri & Unit</th>
                <th className="py-3 px-4">Tindakan Pembinaan</th>
                <th className="py-3 px-4">Ustadz Pembina</th>
                <th className="py-3 px-4">Waktu / Target</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1C2F4D]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Belum ada rekaman riwayat pembinaan santri.
                  </td>
                </tr>
              ) : (
                filteredList.map((p) => {
                  const targetSantriObj = allSantriList.find((s) => s.id === p.santriId);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#15253F] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {p.santriNama}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Kelas {p.santriKelas} (Unit {p.santriUnit})
                        </p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {p.jenisPembinaan}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {p.catatan || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {p.pembina}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Mulai: {p.tanggal}</span>
                        </div>
                        {p.tanggalSelesai ? (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Tuntas: {p.tanggalSelesai}
                          </div>
                        ) : p.tanggalTargetSelesai ? (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            Target: {p.tanggalTargetSelesai}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1C2F4D] hover:bg-slate-200 dark:hover:bg-[#253D63] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            title="Ubah Catatan Evaluasi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPrintRecord(p)}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                            title="Cetak Form Pembinaan Resmi A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {user?.role === 'KASIE_KEPESANTRENAN' && (
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              title="Hapus Pembinaan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      </div>

      {/* Modal Edit Evaluasi */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[#1E3048] shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-[#1C2F4D]">
              Catatan Evaluasi Pembinaan Santri
            </h3>

            <form onSubmit={handleSaveEvaluation} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1322]">
                <p className="font-bold text-slate-900 dark:text-white">
                  {editingRecord.santriNama}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editingRecord.jenisPembinaan}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Catatan Evaluasi / Hasil Pembinaan
                </label>
                <textarea
                  rows={3}
                  value={evaluationNote}
                  onChange={(e) => setEvaluationNote(e.target.value)}
                  placeholder="Misal: Santri telah menyelesaikan tugas hafalan dan menunjukkan perubahan adab yang baik..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1C2F4D]">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1A2D48] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[#1E3048] shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Data Pembinaan?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data riwayat pembinaan ini akan dihapus permanen dari sistem.
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1A2D48] text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Form Pembinaan A4 Modal */}
      {printRecord && (
        <FormPembinaanA4
          pembinaan={printRecord}
          santri={allSantriList.find((s) => s.id === printRecord.santriId)}
          onClose={() => setPrintRecord(null)}
        />
      )}
    </div>
  );
};
