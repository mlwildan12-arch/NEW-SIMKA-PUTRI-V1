import React, { useState, useMemo } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, GraduationCap, Building, AlertCircle } from 'lucide-react';
import { Santri } from '../../types';
import { useApp } from '../../context/AppContext';
import { PointBadge } from './PointBadge';

interface DeleteSantriModalProps {
  isOpen: boolean;
  santri: Santri | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteSantriModal: React.FC<DeleteSantriModalProps> = ({
  isOpen,
  santri,
  onClose,
  onDeleted
}) => {
  const { deleteSantri, riwayatList, user, showToast } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Count active violations for this specific santri
  const violationCount = useMemo(() => {
    if (!santri) return 0;
    return riwayatList.filter(
      (r) =>
        r.santriId === santri.id ||
        (r.santriNama && r.santriNama.toLowerCase() === santri.nama.toLowerCase() && r.santriUnit === santri.unit)
    ).length;
  }, [santri, riwayatList]);

  if (!isOpen || !santri) return null;

  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';
  const hasUnitAccess = isSuperadmin || (user && user.unit === santri.unit);

  const handleConfirmDelete = async () => {
    if (!hasUnitAccess) {
      setErrorMsg(`Akses Ditolak: Anda (${user?.unit}) tidak memiliki hak akses menghapus santri Unit ${santri.unit}.`);
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      // Execute safe deletion: Step 1 (public.pelanggaran) -> Step 2 (public.santri)
      const res = await deleteSantri(santri.id, { deleteViolations: true });
      if (res.success) {
        if (onDeleted) onDeleted();
        onClose();
      } else {
        setErrorMsg(res.message || 'Santri tidak dapat dihapus.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menghapus data santri.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-santri-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-santri-dialog"
        className="relative w-full max-w-lg bg-white dark:bg-[#101D32] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/70 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Konfirmasi Hapus Santri</span>
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Pembersihan Data Santri & Riwayat Contoh
              </p>
            </div>
          </div>
          <button
            id="btn-close-delete-santri-modal"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Gagal Menghapus:</span>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Santri Profile Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#091220] border border-slate-200/90 dark:border-[#192A45] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Nama Santri
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {santri.nama}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-mono font-semibold">NIS: {santri.nis}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Kelas {santri.kelas} ({santri.unit})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Akumulasi Poin
                </span>
                <PointBadge points={santri.totalPoin} size="sm" />
              </div>
            </div>

            {santri.musyrifNama && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-[#15233A] flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Musyrif: {santri.musyrifNama}</span>
                {santri.asrama && <span>• {santri.asrama}</span>}
              </div>
            )}
          </div>

          {/* Violation Status Warning Box */}
          {violationCount > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span>Santri ini memiliki {violationCount} data pelanggaran.</span>
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                  Jika dilanjutkan, <strong>{violationCount} transaksi pelanggaran</strong> yang terkait dengan santri ini akan dihapus dari sistem (aman untuk membersihkan data testing/contoh).
                </p>
                <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 border border-amber-200/80 dark:border-amber-500/20 text-[10.5px] text-slate-700 dark:text-slate-300">
                  ℹ️ <strong>Catatan Integritas:</strong> Kamus Master Pelanggaran (<code className="font-mono text-[10px]">public.master_pelanggaran</code>) dan data santri lainnya <strong>tetap aman dan tidak terhapus</strong>.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1526] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              Santri ini tidak memiliki riwayat pelanggaran. Data santri dapat langsung dihapus dari sistem.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#0B1424] border-t border-slate-200 dark:border-slate-800">
          <button
            id="btn-cancel-delete-santri"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            id="btn-confirm-delete-santri"
            type="button"
            disabled={isDeleting || !hasUnitAccess}
            onClick={handleConfirmDelete}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{violationCount > 0 ? 'Hapus Santri + Data Pelanggaran' : 'Ya, Hapus Santri'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
