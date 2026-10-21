import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { UserAccount } from '../../types';
import { useApp } from '../../context/AppContext';

interface ChangeUserPasswordModalProps {
  isOpen: boolean;
  userAccount: UserAccount | null;
  onClose: () => void;
}

export const ChangeUserPasswordModal: React.FC<ChangeUserPasswordModalProps> = ({
  isOpen,
  userAccount,
  onClose
}) => {
  const { resetUserPassword, showToast } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !userAccount) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showToast('Password Kurang Panjang', 'Kata sandi baru minimal 6 karakter.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi Tidak Cocok', 'Konfirmasi kata sandi tidak sama dengan kata sandi baru.', 'error');
      return;
    }

    setIsSubmitting(true);

    const result = await resetUserPassword(userAccount.id, newPassword);

    setIsSubmitting(false);

    if (result.success) {
      onClose();
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast('Gagal Reset Password', result.message || 'Terjadi kesalahan.', 'error');
    }
  };

  return (
    <div
      id="change-password-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="change-password-dialog"
        className="relative w-full max-w-md bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/50 dark:bg-[#081221]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Reset Password Pengguna</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akun: <span className="font-semibold text-slate-700 dark:text-slate-300">@{userAccount.username}</span> ({userAccount.nama})
              </p>
            </div>
          </div>
          <button
            id="btn-close-change-password"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              PASSWORD BARU <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-new-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimal 6 karakter..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ULANGI PASSWORD BARU <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Ketik ulang password baru..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Password akan langsung di-hash aman dan menggantikan password lama akun ini.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="btn-cancel-change-password"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-submit-change-password"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-[0.98] rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
