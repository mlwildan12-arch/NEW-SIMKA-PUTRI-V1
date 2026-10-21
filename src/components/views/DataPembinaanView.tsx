import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HeartHandshake,
  Search,
  Filter,
  Plus,
  ShieldAlert,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Santri } from '../../types';

export const DataPembinaanView: React.FC = () => {
  const {
    santriList,
    masterPembinaanList,
    addPembinaan,
    setSelectedSantriForDetail,
    setCurrentRoute,
    user
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  // Modal Add Pembinaan state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetSantri, setTargetSantri] = useState<Santri | null>(null);
  const [jenisPembinaan, setJenisPembinaan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [pembina, setPembina] = useState(user?.nama || '');
  const [targetSelesai, setTargetSelesai] = useState('');

  // Santri needing coaching: candidates sorted by total points
  const candidatesList = useMemo(() => {
    return santriList.filter((s) => {
      // Filter search
      const matchSearch =
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.kelas.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter unit
      const matchUnit = selectedUnit === 'ALL' || s.unit === selectedUnit;

      return matchSearch && matchUnit;
    }).sort((a, b) => b.totalPoin - a.totalPoin);
  }, [santriList, searchQuery, selectedUnit]);

  const handleOpenAddModal = (s: Santri) => {
    setTargetSantri(s);
    // Suggest default pembinaan based on points
    const rule = masterPembinaanList.find((p) => {
      const min = p.minPoin ?? 0;
      const max = p.maxPoin ?? 999;
      return s.totalPoin >= min && s.totalPoin <= max;
    });
    setJenisPembinaan(rule ? rule.konsekuensi : 'Pembinaan & Nasihat Lisan oleh Musyrif');
    setCatatan('');
    setPembina(user?.nama || '');
    setIsAddModalOpen(true);
  };

  const handleSavePembinaan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSantri) return;

    const res = addPembinaan({
      santriId: targetSantri.id,
      jenisPembinaan,
      catatan,
      pembina,
      tanggalTargetSelesai: targetSelesai
    });

    if (res.success) {
      setIsAddModalOpen(false);
      setTargetSantri(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-800 p-6 sm:p-7 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-2">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Modul Pembinaan Akhlak & Karakter</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Data & Rekomendasi Tindakan Pembinaan
            </h2>
            <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-2xl leading-relaxed">
              Daftar santri yang memerlukan pendampingan karakter berdasarkan eskalasi poin pelanggaran dan surat peringatan (SP).
            </p>
          </div>

          <button
            onClick={() => setCurrentRoute('riwayat-pembinaan')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold shadow-md transition-all self-start sm:self-center cursor-pointer"
          >
            <span>Buka Riwayat Pembinaan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Levels Reference Accordion / Cards */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Standar 8 Level Pembinaan Resmi Pesantren
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Panduan Musyrif & Kasie
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {masterPembinaanList.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200/80 dark:border-[#18283E] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    LEVEL {item.tingkat}
                  </span>
                  <span className="text-[10px] font-bold text-rose-500">
                    {item.rentangPoin || `${item.min_poin}–${item.max_poin} Poin`}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {item.nama_tingkat || item.kategori}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.konsekuensi || (item.jenis_pembinaan && item.jenis_pembinaan[0])}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-[#18283E] text-[10px] text-slate-400 font-medium">
                Pihak: {item.pembina || 'Musyrif & Kasie'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama, NIS, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Unit Filter */}
            {user?.role === 'KASIE_KEPESANTRENAN' && (
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
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

        {/* Candidate List Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Santri</th>
                <th className="py-3 px-4">Kelas & Unit</th>
                <th className="py-3 px-4">Musyrif Pembina</th>
                <th className="py-3 px-4 text-center">Akumulasi Poin</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Aksi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1C2F4D]">
              {candidatesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Tidak ditemukan data santri yang sesuai filter.
                  </td>
                </tr>
              ) : (
                candidatesList.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#15253F] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p
                        onClick={() => setSelectedSantriForDetail(s)}
                        className="font-bold text-slate-900 dark:text-white hover:text-emerald-500 cursor-pointer"
                      >
                        {s.nama}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        NIS: {s.nis}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                      Kelas {s.kelas} ({s.unit})
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {s.musyrif || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-black">
                      <span className={s.totalPoin > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}>
                        {s.totalPoin} Poin
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSantriForDetail(s)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1C2F4D] hover:bg-slate-200 dark:hover:bg-[#253D63] text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenAddModal(s)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Buat Pembinaan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Tindakan Pembinaan Baru */}
      {isAddModalOpen && targetSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[#1E3048] shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1C2F4D]">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Formulir Tindakan Pembinaan Santri
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePembinaan} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200/80 dark:border-[#18283E]">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {targetSantri.nama}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  NIS: {targetSantri.nis} • Kelas {targetSantri.kelas} (Unit {targetSantri.unit}) • Total Poin: <span className="font-bold text-rose-500">{targetSantri.totalPoin}</span>
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Bentuk / Jenis Tindakan Pembinaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={jenisPembinaan}
                  onChange={(e) => setJenisPembinaan(e.target.value)}
                  placeholder="Misal: Membaca Al-Qur'an 1 Juz di Masjid & Peringatan Lisan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Ustadz Pembina / Musyrif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pembina}
                    onChange={(e) => setPembina(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Target Penyelesaian
                  </label>
                  <input
                    type="text"
                    value={targetSelesai}
                    onChange={(e) => setTargetSelesai(e.target.value)}
                    placeholder="Misal: 3 Hari / 15 Sep 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Catatan Pembinaan / Komitmen Khusus
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan hasil konseling awal, instruksi hafalan/tugas, atau komitmen santri..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1C2F4D]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1A2D48] hover:bg-slate-200 dark:hover:bg-[#233B5C] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  Simpan Tindakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
