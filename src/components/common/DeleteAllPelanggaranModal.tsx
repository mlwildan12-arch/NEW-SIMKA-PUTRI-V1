import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Layers,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DeleteAllPelanggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const DeleteAllPelanggaranModal: React.FC<DeleteAllPelanggaranModalProps> = ({
  isOpen,
  onClose,
  onCompleted
}) => {
  const { 
    pelanggaranList, 
    checkMasterPelanggaranUsage, 
    deleteAllMasterPelanggaran, 
    showToast, 
    user 
  } = useApp();

  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Analyze usage across all master items
  const usageStats = useMemo(() => {
    return checkMasterPelanggaranUsage();
  }, [pelanggaranList, checkMasterPelanggaranUsage]);

  if (!isOpen) return null;

  const isKasie = user?.role === 'KASIE_KEPESANTRENAN';
  const isConfirmInputValid = confirmInput.trim() === 'HAPUS';
  const totalCount = pelanggaranList.length;

  const hasUsedItems = usageStats.usedCount > 0;
  const allItemsUsed = usageStats.unusedCount === 0 && totalCount > 0;
  const canDeleteAll = !hasUsedItems && totalCount > 0;
  const canDeleteUnusedOnly = hasUsedItems && usageStats.unusedCount > 0;

  const handleExecuteDelete = async (onlyUnused = false) => {
    if (!isKasie) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang berwenang mereset Master Pelanggaran.', 'error');
      return;
    }

    if (!isConfirmInputValid) {
      showToast('Konfirmasi Diperlukan', 'Harap ketik kata "HAPUS" dengan huruf kapital untuk mengonfirmasi.', 'warning');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAllMasterPelanggaran(onlyUnused);
      if (result.success) {
        setConfirmInput('');
        if (onCompleted) onCompleted();
        onClose();
      } else {
        showToast('Gagal Menghapus', result.message || 'Terjadi kesalahan saat menghapus data.', 'error');
      }
    } catch (err: any) {
      showToast('Gagal Menghapus', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-all-pelanggaran-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-all-pelanggaran-dialog"
        className="relative w-full max-w-lg bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-900 dark:text-rose-100 uppercase tracking-wide">
                HAPUS SEMUA MASTER PELANGGARAN
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Pembersihan / reset kamus master pelanggaran
              </p>
            </div>
          </div>
          <button
            id="btn-close-delete-all-modal"
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
          {/* Danger Warning Alert */}
          <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Semua data pada Master Pelanggaran akan dihapus.</span>
            </div>
            <p className="text-rose-800/90 dark:text-rose-300/90 pl-6 leading-relaxed">
              Data ini tidak dapat dikembalikan. Pastikan Anda memiliki cadangan atau template Excel yang benar sebelum melanjutkan.
            </p>
          </div>

          {/* Master Count Stats Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Total Master Pelanggaran
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {totalCount} <span className="text-xs font-semibold text-slate-500">data</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Status Penggunaan Transaksi
              </span>
              <span className={`text-xs font-bold mt-1.5 inline-flex items-center gap-1.5 ${
                usageStats.usedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {usageStats.usedCount > 0 ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{usageStats.usedCount} Terpakai / {usageStats.unusedCount} Bebas</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aman (0 Transaksi Terkait)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Scenario 1: All used by transactions -> BLOCK COMPLETELY */}
          {allItemsUsed && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Penghapusan Diblokir: Histori Transaksi Aktif</span>
              </p>
              <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Tidak dapat menghapus semua master karena seluruh data pelanggaran masih digunakan oleh data transaksi santri (total <strong>{usageStats.affectedTransactionsCount} catatan pelanggaran</strong>). Histori transaksi santri dilindungi agar tidak hilang.
              </p>
            </div>
          )}

          {/* Scenario 2: Partially used -> INFORM AND OFFER UNUSED DELETION */}
          {canDeleteUnusedOnly && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Sebagian Data Sedang Digunakan Transaksi:</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 dark:text-amber-300/90 pl-1">
                <li>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{usageStats.unusedCount} master</strong> dapat dihapus karena belum pernah digunakan dalam transaksi.
                </li>
                <li>
                  <strong className="text-rose-700 dark:text-rose-400 font-bold">{usageStats.usedCount} master</strong> sedang digunakan oleh data transaksi dan tidak dapat dihapus demi menjaga integritas data santri.
                </li>
              </ul>
            </div>
          )}

          {/* Multi-layer confirmation input (only if there are items to delete) */}
          {(canDeleteAll || canDeleteUnusedOnly) && (
            <div className="space-y-2 pt-1">
              <label 
                htmlFor="input-confirm-hapus-all"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Ketik kata <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">HAPUS</span> untuk konfirmasi:
              </label>
              <input
                id="input-confirm-hapus-all"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS persis dengan huruf besar"
                disabled={isDeleting}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm tracking-wider focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 transition-colors"
                autoComplete="off"
              />
              {!isConfirmInputValid && confirmInput.length > 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  ⚠️ Harus diketik persis: <strong>HAPUS</strong> (huruf kapital)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            id="btn-cancel-delete-all-pelanggaran"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            {allItemsUsed ? 'Tutup' : 'Batal'}
          </button>

          {/* If completely clear of transactions */}
          {canDeleteAll && (
            <button
              id="btn-confirm-delete-all-master"
              type="button"
              disabled={!isConfirmInputValid || isDeleting}
              onClick={() => handleExecuteDelete(false)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                !isConfirmInputValid || isDeleting
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 active:scale-95 cursor-pointer'
              }`}
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus Semua...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Master ({totalCount})</span>
                </>
              )}
            </button>
          )}

          {/* If partially used: button to delete unused only */}
          {canDeleteUnusedOnly && (
            <button
              id="btn-confirm-delete-unused-master"
              type="button"
              disabled={!isConfirmInputValid || isDeleting}
              onClick={() => handleExecuteDelete(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                !isConfirmInputValid || isDeleting
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 active:scale-95 cursor-pointer'
              }`}
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus {usageStats.unusedCount} Master...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Master yang Tidak Digunakan ({usageStats.unusedCount})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
