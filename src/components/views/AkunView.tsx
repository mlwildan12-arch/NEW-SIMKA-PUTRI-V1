import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCog,
  User,
  KeyRound,
  Save,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Building,
  Mail
} from 'lucide-react';

export const AkunView: React.FC = () => {
  const { user, updateUserPassword } = useApp();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await updateUserPassword(oldPassword, newPassword, confirmPassword);
      if (res.success) {
        setSuccessMsg(res.message);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat memperbarui kata sandi.');
    }
  };

  return (
    <div className="max-w-[650px] mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-5 sm:p-6 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold tracking-wider mb-2">
            <UserCog className="w-3.5 h-3.5" />
            <span>Profil Pengguna</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Akun & Keamanan
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
            Kelola data akun dan kata sandi keamanan Anda di SIMKA.ID.
          </p>
        </div>
      </div>

      {/* Main Account Card */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs overflow-hidden p-5 sm:p-6 space-y-5">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-400/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-sm">
            <User className="w-7 h-7" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {user.nama}
            </h2>
            <div className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-wider uppercase">
              {user.role}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email || user.username}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Unit {user.unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form: Ubah Kata Sandi */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#182740]">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              UBAH KATA SANDI
            </h3>
          </div>

          {errorMsg && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            {/* Password Lama */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Password Lama</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-[#0B1322] border border-slate-200 dark:border-[#1E2E4A] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showOld ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Password Baru</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-[#0B1322] border border-slate-200 dark:border-[#1E2E4A] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password Baru */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Konfirmasi Password Baru</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-[#0B1322] border border-slate-200 dark:border-[#1E2E4A] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#182740] flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Password Baru</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
