import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, User, Building2, AlertCircle } from 'lucide-react';
import { UserAccount } from '../../types';
import { useApp } from '../../context/AppContext';
import { getRoleDisplayName, getUnitDisplayName } from '../../lib/auth';

interface DeleteUserModalProps {
  isOpen: boolean;
  userAccount: UserAccount | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  userAccount,
  onClose,
  onDeleted
}) => {
  const { deleteUser, user: currentUser, usersList } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !userAccount) return null;

  const isSuperadmin = currentUser?.role === 'KASIE_KEPESANTRENAN';
  const isCurrentSelf = currentUser?.id === userAccount.id || currentUser?.username.toLowerCase() === userAccount.username.toLowerCase();
  
  // Count active superadmins
  const activeKasieCount = usersList.filter((u) => u.role === 'KASIE_KEPESANTRENAN' && u.is_active).length;
  const isLastSuperadmin = userAccount.role === 'KASIE_KEPESANTRENAN' && activeKasieCount <= 1;

  const handleConfirmDelete = async () => {
    if (!isSuperadmin) {
      setErrorMsg('Akses Ditolak: Hanya Kasie Kepesantrenan / Superadmin yang berwenang menghapus akun.');
      return;
    }

    if (isCurrentSelf) {
      setErrorMsg('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (isLastSuperadmin) {
      setErrorMsg('Akun ini adalah satu-satunya akun Superadmin yang aktif. Sistem tidak mengizinkan penghapusan akun administrator terakhir.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await deleteUser(userAccount.id);
      if (res.success) {
        if (onDeleted) onDeleted();
        onClose();
      } else {
        setErrorMsg(res.message || 'Gagal menghapus pengguna dari database.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat menghapus pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-user-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-user-dialog"
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
                <span>Konfirmasi Hapus Pengguna</span>
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Penghapusan Akun Otorisasi Sistem
              </p>
            </div>
          </div>
          <button
            id="btn-close-delete-user-modal"
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

          {/* User Account Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#091220] border border-slate-200/90 dark:border-[#192A45] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 text-sm font-bold shrink-0">
                  {userAccount.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {userAccount.nama}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                    @{userAccount.username}
                  </div>
                  {userAccount.email && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {userAccount.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-[#15233A] flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Peran:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {getRoleDisplayName(userAccount.role)}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {getUnitDisplayName(userAccount.unit)}
                </span>
              </div>
            </div>
          </div>

          {/* Self-delete or last admin warning */}
          {isCurrentSelf ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Perhatian:</strong> Ini adalah akun yang sedang Anda gunakan saat ini. Anda tidak dapat menghapus akun sendiri.
              </p>
            </div>
          ) : isLastSuperadmin ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Peringatan Keamanan:</strong> Ini adalah satu-satunya akun Superadmin aktif. Akun ini tidak boleh dihapus agar sistem tidak kehilangan akses administratif.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-bold">Apakah Anda yakin ingin menghapus akun ini secara permanen?</p>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
                Pengguna ini tidak akan dapat login lagi ke sistem SIMKA.ID. Tindakan ini akan menghapus data akun dari database Supabase dan tidak dapat dibatalkan.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#0B1424] border-t border-slate-200 dark:border-slate-800">
          <button
            id="btn-cancel-delete-user"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            id="btn-confirm-delete-user"
            type="button"
            disabled={isDeleting || isCurrentSelf || isLastSuperadmin || !isSuperadmin}
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
                <span>Hapus Pengguna</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
