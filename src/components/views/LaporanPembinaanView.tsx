import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileBarChart2,
  Printer,
  Download,
  Filter,
  Calendar,
  Building2,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users
} from 'lucide-react';
import { MosqueLogoIcon } from '../layout/IslamicPattern';

export const LaporanPembinaanView: React.FC = () => {
  const {
    pembinaanList,
    riwayatList,
    santriList,
    user
  } = useApp();

  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-GANJIL');

  // Filtered pembinaan data
  const filteredPembinaan = useMemo(() => {
    return pembinaanList.filter((p) => {
      const matchUnit = selectedUnit === 'ALL' || p.santriUnit === selectedUnit;
      return matchUnit;
    });
  }, [pembinaanList, selectedUnit]);

  // Statistics Calculation
  const totalKasus = filteredPembinaan.length;
  const smpCount = filteredPembinaan.filter((p) => p.santriUnit === 'SMP').length;
  const maCount = filteredPembinaan.filter((p) => p.santriUnit === 'MA').length;
  const smaCount = filteredPembinaan.filter((p) => p.santriUnit === 'SMA').length;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Nama Santri', 'Kelas', 'Unit', 'Jenis Pembinaan', 'Ustadz Pembina', 'Tanggal', 'Target Selesai', 'Catatan Evaluasi'];
    const rows = filteredPembinaan.map((p, idx) => [
      idx + 1,
      `"${p.santriNama}"`,
      `"${p.santriKelas}"`,
      `"${p.santriUnit}"`,
      `"${p.jenisPembinaan.replace(/"/g, '""')}"`,
      `"${p.pembina}"`,
      `"${p.tanggal}"`,
      `"${p.tanggalTargetSelesai || '-'}"`,
      `"${(p.catatan || '-').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pembinaan_SIMKA_${selectedUnit}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 p-6 sm:p-7 text-white shadow-lg print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-2">
              <FileBarChart2 className="w-3.5 h-3.5" />
              <span>Rekapitulasi & Pelaporan Resmi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Laporan Hasil & Rekam Pembinaan Santri
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Cetak dan unduh laporan berkala penanganan kedisiplinan dan pembinaan santri untuk arsip kasie, koordinator, dan mudir pesantren.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Resmi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Filter Bar (Hidden in Print) */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-4 sm:p-5 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Unit Filter */}
            {user?.role === 'KASIE_KEPESANTRENAN' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Unit Pesantren
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Semua Unit (Pusat)</option>
                  <option value="SMP">Unit SMP</option>
                  <option value="MA">Unit MA</option>
                  <option value="SMA">Unit SMA</option>
                </select>
              </div>
            )}

            {/* Period Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Tahun Ajaran & Semester
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="2026-GANJIL">T.A 2026/2027 - Semester Ganjil</option>
                <option value="2026-GENAP">T.A 2025/2026 - Semester Genap</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Total Terbina</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {totalKasus} Santri
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-6 sm:p-10 shadow-xs print:p-0 print:border-none print:shadow-none">
        {/* Printable Official Header */}
        <div className="border-b-4 border-double border-slate-800 pb-4 mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center">
              <MosqueLogoIcon className="w-8 h-8 text-slate-800" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider text-slate-900">
                PONDOK PESANTREN ISLAM TERPADU
              </h1>
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                LAPORAN REKAPITULASI PEMBINAAN & KEDISIPLINAN SANTRI (SIMKA.ID)
              </h2>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Periode: {selectedPeriod === '2026-GANJIL' ? 'Semester Ganjil T.A 2026/2027' : 'Semester Genap T.A 2025/2026'} • Unit: {selectedUnit === 'ALL' ? 'Seluruh Unit (SMP/MA/SMA)' : `Unit ${selectedUnit}`}
              </p>
            </div>
          </div>
        </div>

        {/* Statistical Summary Mini-Table */}
        <div className="grid grid-cols-4 gap-3 my-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200 dark:border-[#18283E] text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Total Kasus</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{totalKasus}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200 dark:border-[#18283E] text-center">
            <p className="text-[10px] text-blue-600 font-bold uppercase">Unit SMP</p>
            <p className="text-lg font-black text-blue-600 mt-1">{smpCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200 dark:border-[#18283E] text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Unit MA</p>
            <p className="text-lg font-black text-emerald-600 mt-1">{maCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200 dark:border-[#18283E] text-center">
            <p className="text-[10px] text-purple-600 font-bold uppercase">Unit SMA</p>
            <p className="text-lg font-black text-purple-600 mt-1">{smaCount}</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-[#1E3048]">
            <thead className="bg-slate-100 dark:bg-[#0A1322] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#1E3048]">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048] w-10 text-center">No</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048]">Nama Santri</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048]">Kelas / Unit</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048]">Tindakan Pembinaan</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048]">Ustadz Pembina</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048]">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1C2F4D]">
              {filteredPembinaan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    Tidak ada data rekapitulasi pembinaan untuk kriteria filter ini.
                  </td>
                </tr>
              ) : (
                filteredPembinaan.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#15253F]">
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048] text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048] font-bold text-slate-900 dark:text-white">
                      {p.santriNama}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048] text-slate-700 dark:text-slate-300">
                      Kelas {p.santriKelas} ({p.santriUnit})
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048] text-slate-800 dark:text-slate-200 max-w-xs">
                      <p className="font-semibold">{p.jenisPembinaan}</p>
                      {p.catatan && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                          Evaluasi: {p.catatan}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048] text-slate-700 dark:text-slate-300">
                      {p.pembina}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#1E3048] text-slate-500 dark:text-slate-400 text-[11px]">
                      {p.tanggal}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Resmi Pengesahan */}
        <div className="mt-10 pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <div>
            <p className="text-[11px] text-slate-500">Dicetak melalui SIMKA.ID pada:</p>
            <p className="font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="text-center w-56">
            <p>Kepala Bagian Kepesantrenan,</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900 dark:text-white">
              Ust. H. Abdullah Mansur, Lc.
            </p>
            <p className="text-[10px] text-slate-500">NIP. 19840512-201001-1-003</p>
          </div>
        </div>
      </div>
    </div>
  );
};
