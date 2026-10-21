import React, { useState } from 'react';
import { X, UserPlus, Shield, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole, UnitPesantren } from '../../types';
import { useApp } from '../../context/AppContext';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose }) => {
  const { addUser, showToast } = useApp();

  const [id, setId] = useState('');
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MUSYRIF');
  const [unit, setUnit] = useState<UnitPesantren>('SMP');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'KASIE_KEPESANTRENAN') {
      // Unit is automatically ALL
    } else {
      if (unit === ('ALL' as any)) {
        setUnit('SMP');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim() || !username.trim() || !password) {
      showToast('Form Tidak Lengkap', 'Nama, username, dan password wajib diisi!', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password Terlalu Pendek', 'Password harus terdiri dari minimal 6 karakter.', 'error');
      return;
    }

    setIsSubmitting(true);

    const result = await addUser({
      id: id.trim() || undefined,
      nama: nama.trim(),
      username: username.trim().toLowerCase(),
      password,
      email: email.trim() || undefined,
      role,
      unit: role === 'KASIE_KEPESANTRENAN' ? 'ALL' : unit
    });

    setIsSubmitting(false);

    if (result.success) {
      onClose();
      // Reset
      setId('');
      setNama('');
      setUsername('');
      setPassword('');
      setEmail('');
      setRole('MUSYRIF');
      setUnit('SMP');
    } else {
      showToast('Gagal Menambah Pengguna', result.message || 'Terjadi kesalahan.', 'error');
    }
  };

  return (
    <div
      id="add-user-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-user-dialog"
        className="relative w-full max-w-xl bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/50 dark:bg-[#081221]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Pengguna Baru</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pendaftaran akun Musyrif, Koordinator, atau Kasie Kepesantrenan
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-user"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID Pengguna */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ID PENGGUNA <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="input-user-id"
                type="text"
                placeholder="Contoh: U005 (Otomatis jika kosong)"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                USERNAME <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-user-username"
                type="text"
                required
                placeholder="Contoh: ahmad.musy"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              NAMA LENGKAP & GELAR <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-user-nama"
              type="text"
              required
              placeholder="Contoh: Ust. Ahmad Al-Haddad, S.Pd"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>

          {/* Password & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                PASSWORD AWAL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-user-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                EMAIL <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="input-user-email"
                type="email"
                placeholder="email@simka.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ROLE PENGGUNA <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-user-role"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3.5 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              >
                <option value="MUSYRIF">Musyrif (Pembina Kamar)</option>
                <option value="KOORDINATOR">Koordinator Unit</option>
                <option value="KASIE_KEPESANTRENAN">Kasie Kepesantrenan (Superadmin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                UNIT PESANTREN <span className="text-rose-500">*</span>
              </label>
              {role === 'KASIE_KEPESANTRENAN' ? (
                <input
                  type="text"
                  disabled
                  value="ALL (Seluruh Unit SMP, MA, SMA)"
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                />
              ) : (
                <select
                  id="select-user-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitPesantren)}
                  className="w-full px-3.5 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                >
                  <option value="SMP">SMP</option>
                  <option value="MA">MA</option>
                  <option value="SMA">SMA</option>
                </select>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Password langsung dienkripsi (SHA-256) saat disimpan dan akun siap langsung login.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="btn-cancel-add-user"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-submit-add-user"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
