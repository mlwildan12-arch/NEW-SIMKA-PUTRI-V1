import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, UnitPesantren, UserAccount } from '../../types';
import { getRoleDisplayName, getUnitDisplayName } from '../../lib/auth';
import { AddUserModal } from '../common/AddUserModal';
import { EditUserModal } from '../common/EditUserModal';
import { ImportUserModal } from '../common/ImportUserModal';
import { ChangeUserPasswordModal } from '../common/ChangeUserPasswordModal';
import { DeleteUserModal } from '../common/DeleteUserModal';
import { exportUsersToExcel, generateUserExcelTemplate } from '../../lib/excelHelper';
import {
  Users,
  UserPlus,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  ShieldAlert,
  Download,
  Upload,
  KeyRound,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Lock
} from 'lucide-react';

export const ManajemenUserView: React.FC = () => {
  const { 
    usersList, 
    toggleUserActive, 
    user: currentUser, 
    showToast 
  } = useApp();

  const isKasie = currentUser?.role === 'KASIE_KEPESANTRENAN';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
  const [filterUnit, setFilterUnit] = useState<'ALL' | UnitPesantren>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // User distribution metrics
  const stats = useMemo(() => {
    let musyrifCount = 0;
    let koorCount = 0;
    let kasieCount = 0;

    for (const u of usersList) {
      if (u.role === 'MUSYRIF') musyrifCount++;
      else if (u.role === 'KOORDINATOR') koorCount++;
      else if (u.role === 'KASIE_KEPESANTRENAN') kasieCount++;
    }

    return {
      total: usersList.length,
      musyrifCount,
      koorCount,
      kasieCount
    };
  }, [usersList]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      const matchesUnit = filterUnit === 'ALL' || u.unit === filterUnit;

      return matchesSearch && matchesRole && matchesUnit;
    });
  }, [usersList, searchTerm, filterRole, filterUnit]);

  const handleDeleteUser = (u: UserAccount) => {
    if (!isKasie) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang dapat menghapus user.', 'error');
      return;
    }
    if (u.id === currentUser?.id) {
      showToast('Peringatan', 'Anda tidak dapat menghapus akun sendiri.', 'warning');
      return;
    }
    setDeletingUser(u);
  };

  const handleExport = () => {
    try {
      exportUsersToExcel(usersList);
      showToast('Ekspor Berhasil', 'Data Pengguna berhasil diekspor (Password dienkripsi & aman).', 'success');
    } catch (err: any) {
      showToast('Gagal Ekspor', err.message || 'Terjadi kesalahan saat ekspor data.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-200 text-xs font-semibold tracking-wider mb-2.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Otorisasi & Akun Sistem SIMKA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manajemen Data Pengguna
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
              Kelola hak akses Musyrif Kamar, Koordinator Unit, dan Kasie Kepesantrenan dengan penegakan unit isolasi data dan enkripsi password.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {isKasie && (
              <>
                <button
                  id="btn-open-add-user"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tambah Pengguna</span>
                </button>

                <button
                  id="btn-open-import-user"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Excel</span>
                </button>
              </>
            )}

            <button
              id="btn-export-users-excel"
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Access & Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101C2F] border border-slate-200/80 dark:border-[#1E3048] shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Akun</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30">
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Musyrif</div>
          <div className="text-xl font-black text-blue-800 dark:text-blue-300 mt-0.5">{stats.musyrifCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Koordinator</div>
          <div className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{stats.koorCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Kasie Superadmin</div>
          <div className="text-xl font-black text-amber-800 dark:text-amber-300 mt-0.5">{stats.kasieCount}</div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-input-user"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, username, email..."
              className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Role */}
          <div>
            <select
              id="filter-select-role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Peran (Role)</option>
              <option value="MUSYRIF">Musyrif (Asrama)</option>
              <option value="KOORDINATOR">Koordinator Unit</option>
              <option value="KASIE_KEPESANTRENAN">Kasie Kepesantrenan (Superadmin)</option>
            </select>
          </div>

          {/* Filter Unit */}
          <div>
            <select
              id="filter-select-unit"
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value as any)}
              className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Unit</option>
              <option value="SMP">Unit SMP</option>
              <option value="MA">Unit MA</option>
              <option value="SMA">Unit SMA</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-[#0B1526] text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5 w-16">ID</th>
                <th className="py-3 px-3.5">Nama & Jabatan</th>
                <th className="py-3 px-3.5">Username</th>
                {isKasie && <th className="py-3 px-3.5">Password</th>}
                <th className="py-3 px-3.5">Role</th>
                <th className="py-3 px-3.5">Unit Penugasan</th>
                {isKasie && <th className="py-3 px-3.5 text-right">Aksi Manajemen</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isKasie ? 7 : 5} className="py-8 text-center text-slate-400 text-xs italic">
                    Tidak ada data pengguna yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400">
                        {u.id.startsWith('usr-') ? u.id.substring(0, 10) : u.id}
                      </td>
                      <td className="py-3 px-3.5 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 text-xs font-bold shrink-0">
                            {u.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {u.nama}
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.title || u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-blue-600 dark:text-blue-400 text-xs font-bold">
                        @{u.username}
                      </td>
                      {isKasie && (
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 select-none">
                            <Lock className="w-3 h-3 text-slate-400" />
                            ••••••••
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.role === 'KASIE_KEPESANTRENAN'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              : u.role === 'KOORDINATOR'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {getRoleDisplayName(u.role)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {getUnitDisplayName(u.unit)}
                        </span>
                      </td>
                      {isKasie && (
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              title="Edit Data Akun"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setResettingPasswordUser(u)}
                              title="Reset Password"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleUserActive(u.id)}
                              disabled={isCurrent}
                              title={isCurrent ? 'Tidak dapat menonaktifkan akun sendiri' : u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.is_active
                                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              } disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                              {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              disabled={isCurrent}
                              title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Akun Pengguna'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditUserModal
        isOpen={!!editingUser}
        userAccount={editingUser}
        onClose={() => setEditingUser(null)}
      />

      <ChangeUserPasswordModal
        isOpen={!!resettingPasswordUser}
        userAccount={resettingPasswordUser}
        onClose={() => setResettingPasswordUser(null)}
      />

      <ImportUserModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <DeleteUserModal
        isOpen={!!deletingUser}
        userAccount={deletingUser}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
};
