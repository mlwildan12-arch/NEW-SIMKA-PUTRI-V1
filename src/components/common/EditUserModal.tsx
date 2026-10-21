import React, { useState, useEffect } from 'react';
import { X, Edit3, CheckCircle2 } from 'lucide-react';
import { UserRole, UnitPesantren, UserAccount } from '../../types';
import { useApp } from '../../context/AppContext';

interface EditUserModalProps {
  isOpen: boolean;
  userAccount: UserAccount | null;
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  userAccount,
  onClose
}) => {
  const { editUser, showToast } = useApp();

  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MUSYRIF');
  const [unit, setUnit] = useState<UnitPesantren>('SMP');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userAccount) {
      setNama(userAccount.nama || '');
      setUsername(userAccount.username || '');
      setEmail(userAccount.email || '');
      setRole(userAccount.role || 'MUSYRIF');
      setUnit((userAccount.unit === 'ALL' ? 'SMP' : userAccount.unit) as UnitPesantren);
      setIsActive(userAccount.is_active !== undefined ? userAccount.is_active : true);
    }
  }, [userAccount]);

  if (!isOpen || !userAccount) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole !== 'KASIE_KEPESANTRENAN' && unit === ('ALL' as any)) {
      setUnit('SMP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim() || !username.trim()) {
      showToast('Form Tidak Lengkap', 'Nama dan username wajib diisi!', 'error');
      return;
    }

    setIsSubmitting(true);

    const result = await editUser(userAccount.id, {
      nama: nama.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim() || undefined,
      role,
      unit: role === 'KASIE_KEPESANTRENAN' ? 'ALL' : unit,
      is_active: isActive
    });

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      showToast('Gagal Memperbarui', result.message || 'Terjadi kesalahan.', 'error');
    }
  };

  return (
    <div
      id="edit-user-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-user-dialog"
        className="relative w-full max-w-xl bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/50 dark:bg-[#081221]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Pengguna</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah identitas, peranan, atau status penugasan unit
              </p>
            </div>
          </div>
          <button
            id="btn-close-edit-user"
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
            {/* ID (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ID PENGGUNA
              </label>
              <input
                type="text"
                disabled
                value={userAccount.id}
                className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-mono"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                USERNAME <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-user-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              NAMA LENGKAP & GELAR <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-user-nama"
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              EMAIL
            </label>
            <input
              id="edit-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>

          {/* Role & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ROLE PENGGUNA <span className="text-rose-500">*</span>
              </label>
              <select
                id="edit-user-role"
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
                  id="edit-user-unit"
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="btn-cancel-edit-user"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-submit-edit-user"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
