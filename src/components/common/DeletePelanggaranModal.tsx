import React, { useState, useMemo } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Pelanggaran } from '../../types';
import { useApp } from '../../context/AppContext';
import { KategoriPelanggaranBadge } from './PointBadge';

interface DeletePelanggaranModalProps {
  isOpen: boolean;
  pelanggaran: Pelanggaran | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeletePelanggaranModal: React.FC<DeletePelanggaranModalProps> = ({
  isOpen,
  pelanggaran,
  onClose,
  onDeleted
}) => {
  const { deletePelanggaran, checkMasterPelanggaranUsage, showToast, user } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if this item is currently referenced in any student violation transactions
  const usageInfo = useMemo(() => {
    if (!pelanggaran) return { isUsed: false, count: 0 };
    return checkMasterPelanggaranUsage(pelanggaran.id);
  }, [pelanggaran, checkMasterPelanggaranUsage]);

  if (!isOpen || !pelanggaran) return null;

  const isKasie = user?.role === 'KASIE_KEPESANTRENAN';

  const handleConfirmDelete = async () => {
    if (!isKasie) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang dapat menghapus data master.', 'error');
      return;
    }

    if (usageInfo.isUsed) {
      showToast(
        'Penghapusan Ditolak',
        `Master pelanggaran ini sedang digunakan oleh ${usageInfo.count} catatan pelanggaran santri.`,
        'error'
      );
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePelanggaran(pelanggaran.id);
      if (result.success) {
        if (onDeleted) onDeleted();
        onClose();
      } else {
        showToast('Gagal Menghapus', result.message || 'Terjadi kesalahan.', 'error');
      }
    } catch (err: any) {
      showToast('Gagal Menghapus', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-pelanggaran-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-pelanggaran-dialog"
        className="relative w-full max-w-lg bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Data Pelanggaran?
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Konfirmasi penghapusan item dari Master Pelanggaran
              </p>
            </div>
          </div>
          <button
            id="btn-close-delete-pelanggaran-modal"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Item details card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Item Pelanggaran:
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {pelanggaran.jenis}
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                {pelanggaran.kode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                  Poin:
                </span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                  +{pelanggaran.poin} Poin
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                  Kategori:
                </span>
                <div className="mt-0.5">
                  <KategoriPelanggaranBadge kategori={pelanggaran.kategori} poin={pelanggaran.poin} size="sm" />
                </div>
              </div>
            </div>

            {pelanggaran.konsekuensi && pelanggaran.konsekuensi !== '-' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                  Konsekuensi / Hukuman:
                </span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-xs italic">
                  {pelanggaran.konsekuensi}
                </p>
              </div>
            )}
          </div>

          {/* Usage warning or notice message */}
          {usageInfo.isUsed ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Data Master Sedang Digunakan</p>
                <p className="text-amber-700 dark:text-amber-400/90 leading-relaxed">
                  Data ini tidak dapat dihapus karena tercatat dalam <strong className="font-bold">{usageInfo.count} riwayat pelanggaran santri</strong>. Histori transaksi pelanggaran dilindungi agar tidak hilang atau korup.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                Data ini akan dihapus dari Master Pelanggaran.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            id="btn-cancel-delete-pelanggaran"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          
          <button
            id="btn-confirm-delete-pelanggaran"
            type="button"
            disabled={isDeleting || usageInfo.isUsed}
            onClick={handleConfirmDelete}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              usageInfo.isUsed
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-95 cursor-pointer'
            }`}
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
