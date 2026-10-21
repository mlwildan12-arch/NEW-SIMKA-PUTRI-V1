import React from 'react';
import { useApp } from '../../context/AppContext';
import { PointBadge, KategoriPelanggaranBadge } from './PointBadge';
import { X, User, GraduationCap, Building, ShieldAlert, Award, FileText } from 'lucide-react';

export const DetailSantriModal: React.FC = () => {
  const { selectedSantriForDetail, setSelectedSantriForDetail, riwayatList, setCurrentRoute } = useApp();

  if (!selectedSantriForDetail) return null;

  const santri = selectedSantriForDetail;
  const santriLogs = riwayatList.filter((r) => r.santriId === santri.id || r.santriNama.toLowerCase() === santri.nama.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-xl sm:rounded-2xl bg-white dark:bg-[#0F1A2E] border border-slate-200 dark:border-[#1E2E4A] shadow-2xl overflow-hidden my-3 sm:my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 dark:border-[#1E2E4A] bg-slate-50 dark:bg-[#121F37]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Rekam Jejak &amp; Detail Santri
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Data kedisiplinan akhlak &amp; karakter
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedSantriForDetail(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1E2E4A] transition-colors cursor-pointer shrink-0"
            aria-label="Tutup detail modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1322] border border-slate-200/80 dark:border-[#1A2840]">
            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Santri</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={santri.nama}>{santri.nama}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Kelas {santri.kelas} ({santri.unit})</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Musyrif &amp; Asrama</span>
              <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{santri.musyrifNama || 'Belum Ditugaskan'}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{santri.asrama || `Asrama ${santri.unit}`} {santri.kamar ? `• ${santri.kamar}` : ''}</span>
              </div>
            </div>

            <div className="space-y-0.5 sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Total Poin</span>
              <div className="flex items-center gap-1.5">
                <PointBadge points={santri.totalPoin} size="sm" />
              </div>
            </div>
          </div>

          {/* Violation History List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Riwayat Pelanggaran ({santriLogs.length})
                </h4>
              </div>
              <button
                onClick={() => {
                  setSelectedSantriForDetail(null);
                  setCurrentRoute('catat-pelanggaran');
                }}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 cursor-pointer"
              >
                + Catat Pelanggaran
              </button>
            </div>

            {santriLogs.length === 0 ? (
              <div className="text-center py-6 px-3 rounded-xl bg-slate-50 dark:bg-[#0B1322] border border-slate-200 dark:border-[#1A2840]">
                <Award className="w-6 h-6 text-emerald-500/70 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-white">Alhamdulillah, Belum Ada Catatan Pelanggaran</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Santri ini memiliki rekam jejak akhlak &amp; kedisiplinan yang sangat baik.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1A2840]">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#121E33] text-slate-500 dark:text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-[#1A2840]">
                    <tr>
                      <th className="py-2 px-2.5 sm:px-3 whitespace-nowrap">TGL / WAKTU</th>
                      <th className="py-2 px-2.5 sm:px-3">JENIS PELANGGARAN</th>
                      <th className="py-2 px-2 sm:px-3 text-center">POIN</th>
                      <th className="py-2 px-2 sm:px-3 text-center">KATEGORI</th>
                      <th className="py-2 px-2 sm:px-3">PELAPOR</th>
                      <th className="py-2 px-2.5 sm:px-3">SANKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1A2840] text-slate-800 dark:text-slate-200">
                    {santriLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-[#13223A] transition-colors">
                        <td className="py-2 px-2.5 sm:px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                          {log.tanggal}
                        </td>
                        <td className="py-2 px-2.5 sm:px-3 font-semibold text-slate-900 dark:text-white max-w-[160px] sm:max-w-xs">
                          <div className="truncate leading-tight">{log.jenisPelanggaranNama}</div>
                          {log.catatan && (
                            <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 flex items-center gap-1 truncate">
                              <FileText className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{log.catatan}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-center whitespace-nowrap">
                          <PointBadge points={log.poin} size="sm" />
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-center whitespace-nowrap">
                          <KategoriPelanggaranBadge poin={log.poin} size="sm" />
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-slate-700 dark:text-slate-300 text-[10px] max-w-[100px] truncate" title={log.pencatat || 'Petugas'}>
                          <span className="truncate">{log.pencatat || 'Petugas'}</span>
                        </td>
                        <td className="py-2 px-2.5 sm:px-3 text-slate-600 dark:text-slate-300 text-[10px] max-w-[120px] truncate" title={log.hukuman || '-'}>
                          {log.hukuman || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

