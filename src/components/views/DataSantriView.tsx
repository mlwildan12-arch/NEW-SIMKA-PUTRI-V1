import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PointBadge } from '../common/PointBadge';
import { UnitPesantren, UnitFilter, Santri } from '../../types';
import { ImportSantriModal } from '../common/ImportSantriModal';
import { EditSantriModal } from '../common/EditSantriModal';
import { DeleteSantriModal } from '../common/DeleteSantriModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { exportSantriToExcel, generateSantriExcelTemplate } from '../../lib/excelHelper';
import { compareKelas } from '../../lib/sortingHelper';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building2,
  GraduationCap,
  UserPlus,
  AlertCircle,
  Home,
  FileSpreadsheet,
  Download,
  Upload,
  Edit,
  Eye,
  Users,
  Trash2,
  UserX,
  Link2
} from 'lucide-react';

export const DataSantriView: React.FC = () => {
  const {
    santriList,
    allSantriList,
    allRiwayatList,
    riwayatList,
    setSelectedSantriForDetail,
    user,
    addSantri,
    usersList,
    selectedKasieUnitFilter,
    setSelectedKasieUnitFilter,
    showToast
  } = useApp();

  const [searchName, setSearchName] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [selectedMusyrifFilter, setSelectedMusyrifFilter] = useState('Semua Musyrif');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [santriToDelete, setSantriToDelete] = useState<Santri | null>(null);

  // New Santri Form State
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: '',
    unit: (user?.unit === 'ALL' ? 'SMP' : user?.unit || 'SMP') as UnitPesantren,
    musyrifId: '',
    asrama: '',
    kamar: '',
    keterangan: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';
  const effectiveUnit: UnitPesantren = isSuperadmin
    ? selectedKasieUnitFilter === 'ALL'
      ? 'SMP'
      : selectedKasieUnitFilter
    : (user?.unit as UnitPesantren) || 'SMP';

  // Dynamic class options from active santri list
  const classOptions = useMemo(() => {
    const classes = Array.from(new Set(santriList.map((s) => s.kelas)))
      .filter(Boolean)
      .sort(compareKelas);
    return ['Semua Kelas', ...classes];
  }, [santriList]);

  // Dynamic Musyrif options for filter
  const musyrifFilterOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        santriList
          .map((s) => s.musyrifNama)
          .filter((name): name is string => Boolean(name && name.trim()))
      )
    ).sort();
    return ['Semua Musyrif', ...names];
  }, [santriList]);

  // Available Musyrifs for the selected unit in Add modal
  const availableMusyrifs = useMemo(() => {
    return usersList.filter(
      (u) => u.role === 'MUSYRIF' && (u.unit === formData.unit || u.unit === 'ALL') && u.is_active
    );
  }, [usersList, formData.unit]);

  const filteredSantri = useMemo(() => {
    return santriList.filter((santri) => {
      const matchName =
        santri.nama.toLowerCase().includes(searchName.toLowerCase()) ||
        santri.nis.includes(searchName);
      const matchClass =
        selectedClass === 'Semua Kelas' || santri.kelas === selectedClass;
      const matchMusyrif =
        selectedMusyrifFilter === 'Semua Musyrif' || santri.musyrifNama === selectedMusyrifFilter;
      return matchName && matchClass && matchMusyrif;
    });
  }, [santriList, searchName, selectedClass, selectedMusyrifFilter]);

  const totalPages = Math.ceil(filteredSantri.length / itemsPerPage) || 1;
  const paginatedSantri = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSantri.slice(start, start + itemsPerPage);
  }, [filteredSantri, currentPage, itemsPerPage]);

  const handleResetFilter = () => {
    setSearchName('');
    setSelectedClass('Semua Kelas');
    setSelectedMusyrifFilter('Semua Musyrif');
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    const defaultUnit: UnitPesantren =
      user?.unit === 'ALL'
        ? selectedKasieUnitFilter === 'ALL'
          ? 'SMP'
          : selectedKasieUnitFilter
        : (user?.unit as UnitPesantren) || 'SMP';

    setFormData({
      nis: `2026${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      kelas: defaultUnit === 'SMP' ? '7A' : defaultUnit === 'SMA' ? 'X-A' : '10.1',
      unit: defaultUnit,
      musyrifId: '',
      asrama: `Asrama ${defaultUnit}`,
      kamar: '01',
      keterangan: ''
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const [isAddingSantri, setIsAddingSantri] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.nama.trim() || !formData.kelas.trim()) {
      setFormError('NIS, Nama Santri, dan Kelas wajib diisi.');
      return;
    }

    setIsAddingSantri(true);
    setFormError(null);
    try {
      const res = await addSantri(formData);
      if (res.success) {
        setShowAddModal(false);
      } else {
        setFormError(res.message || 'Gagal menambahkan santri baru.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsAddingSantri(false);
    }
  };

  const handleExportExcel = () => {
    if (!isSuperadmin) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang dapat mengekspor data santri.', 'error');
      return;
    }
    const unitLabel = isSuperadmin 
      ? (selectedKasieUnitFilter === 'ALL' ? 'Semua Unit' : `Unit ${selectedKasieUnitFilter}`)
      : `Unit ${user?.unit || 'ALL'}`;
    exportSantriToExcel(filteredSantri, unitLabel, user?.role, allRiwayatList || riwayatList);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                Pusat Data Santri •{' '}
                {user
                  ? isSuperadmin
                    ? selectedKasieUnitFilter === 'ALL'
                      ? 'Semua Unit'
                      : `Unit ${selectedKasieUnitFilter}`
                    : `Unit ${user.unit}`
                  : ''}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Data Santri
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Kelola data santri, input manual per santri, atau import massal dari file Excel.
            </p>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {isSuperadmin && (
              <>
                <button
                  onClick={generateSantriExcelTemplate}
                  title="Download Template Format Excel"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline">Format Excel</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  disabled={filteredSantri.length === 0}
                  title="Export Data ke Excel"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Excel</span>
                </button>

                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                  <span>Tambah Santri</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Superadmin Unit Filter Selector Bar */}
      {isSuperadmin && (
        <div className="bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Filter Unit Santri:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'SMP', 'MA', 'SMA'] as UnitFilter[]).map((unitOpt) => {
              const isSelected = selectedKasieUnitFilter === unitOpt;
              const countByUnit =
                unitOpt === 'ALL'
                  ? allSantriList.length
                  : allSantriList.filter((s) => s.unit === unitOpt).length;

              return (
                <button
                  key={unitOpt}
                  onClick={() => {
                    setSelectedKasieUnitFilter(unitOpt);
                    setSelectedClass('Semua Kelas');
                    setSelectedMusyrifFilter('Semua Musyrif');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#0A1322] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#1E3048]'
                  }`}
                >
                  <span>{unitOpt === 'ALL' ? 'Semua Unit' : `Unit ${unitOpt}`}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-[#192A45] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {countByUnit}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State Banner for Empty Units */}
      {santriList.length === 0 && (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#101C2F] border border-dashed border-slate-300 dark:border-[#1E3048] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Belum Ada Data Santri untuk Unit Ini
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Unit ini masih kosong. Anda dapat menambahkan santri satu per satu atau melakukan import massal menggunakan format Excel.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {isSuperadmin && (
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Santri dari Excel</span>
              </button>
            )}
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1322] hover:bg-slate-200 dark:hover:bg-[#1A2D48] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-[#1E3048] cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Manual</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Card */}
      {santriList.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Search Name Input */}
            <div className="space-y-1 lg:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Cari Nama / NIS Santri
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ketik Nama atau NIS Santri..."
                  value={searchName}
                  onChange={(e) => {
                    setSearchName(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Filter Class Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Filter Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {classOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-white dark:bg-[#0A1322] text-slate-900 dark:text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Musyrif Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Filter Musyrif
              </label>
              <select
                value={selectedMusyrifFilter}
                onChange={(e) => {
                  setSelectedMusyrifFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {musyrifFilterOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-white dark:bg-[#0A1322] text-slate-900 dark:text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Counter & Reset Action */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#182740]">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Menampilkan <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredSantri.length}</span> dari {santriList.length} santri
            </div>

            {(searchName !== '' ||
              selectedClass !== 'Semua Kelas' ||
              selectedMusyrifFilter !== 'Semua Musyrif') && (
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#16253E] hover:bg-slate-200 dark:hover:bg-[#1E3254] text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#23385B] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Santri List Table (COMPACT SAAS DESIGN) */}
      {santriList.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#182740]">
                <tr>
                  <th className="py-2.5 px-3.5">NAMA SANTRI</th>
                  <th className="py-2.5 px-3.5">KELAS & UNIT</th>
                  <th className="py-2.5 px-3.5">MUSYRIF / ASRAMA</th>
                  <th className="py-2.5 px-3.5 text-center">TOTAL POIN</th>
                  <th className="py-2.5 px-3.5 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#182740] text-slate-800 dark:text-slate-200">
                {paginatedSantri.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                      Tidak ada data santri yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedSantri.map((santri) => (
                    <tr
                      key={santri.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#13223A] transition-colors group cursor-pointer"
                      onClick={() => setSelectedSantriForDetail(santri)}
                    >
                      <td className="py-2.5 px-3.5 max-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={santri.nama}>
                          {santri.nama}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          NIS: {santri.nis}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#132138] border border-slate-200 dark:border-[#1E2E4A] font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {santri.kelas} ({santri.unit})
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 max-w-[200px]">
                        {santri.musyrifNama ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                santri.musyrifId ? 'bg-emerald-500' : 'bg-amber-400'
                              }`}
                              title={santri.musyrifId ? 'Musyrif terhubung dengan akun pengguna' : 'Nama musyrif belum terhubung akun'}
                            />
                            <span
                              className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate"
                              title={santri.musyrifNama}
                            >
                              {santri.musyrifNama}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                              <UserX className="w-2.5 h-2.5" />
                              <span>Belum Terhubung</span>
                            </span>
                            {isSuperadmin && (
                              <button
                                type="button"
                                title="Hubungkan ke Akun Musyrif"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSantri(santri);
                                }}
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                              >
                                <Link2 className="w-2.5 h-2.5" />
                                <span>Hubungkan</span>
                              </button>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                          <Home className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{santri.asrama || 'Asrama'} {santri.kamar ? `• ${santri.kamar}` : ''}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <PointBadge points={santri.totalPoin} size="sm" />
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {isSuperadmin && (
                            <>
                              <button
                                title="Edit Data Santri"
                                onClick={() => setEditingSantri(santri)}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Hapus Santri"
                                onClick={() => setSantriToDelete(santri)}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:border-rose-900/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            title="Lihat Detail Rekam Jejak"
                            onClick={() => setSelectedSantriForDetail(santri)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-[11px] transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detail</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-[#182740] bg-slate-50 dark:bg-[#0B1322] text-xs text-slate-500 dark:text-slate-400">
            <div>
              Halaman <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> dari{' '}
              <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white dark:bg-[#111C31] hover:bg-slate-100 dark:hover:bg-[#192A48] text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 dark:border-[#1E2E4A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white dark:bg-[#111C31] hover:bg-slate-100 dark:hover:bg-[#192A48] text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 dark:border-[#1E2E4A] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Santri Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#101D32] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0B1526]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Santri Baru</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Masukkan biodata santri untuk unit {formData.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIS Santri *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Contoh: 20261050"
                    className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Pesantren *
                  </label>
                  <select
                    disabled={!isSuperadmin}
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: e.target.value as UnitPesantren,
                        musyrifId: ''
                      })
                    }
                    className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="SMP">Unit SMP</option>
                    <option value="MA">Unit MA</option>
                    <option value="SMA">Unit SMA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Santri *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: MUHAMMAD FAIZ AL-FARABI"
                  className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas Santri *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    placeholder="Contoh: 7A, 10.1, X-A"
                    className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Musyrif Pembina ({formData.unit})
                  </label>
                  <select
                    value={formData.musyrifId}
                    onChange={(e) => setFormData({ ...formData, musyrifId: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Pilih Musyrif ({formData.unit})</option>
                    {availableMusyrifs.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} ({m.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gedung Asrama (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.asrama}
                    onChange={(e) => setFormData({ ...formData, asrama: e.target.value })}
                    placeholder="Contoh: Asrama Abu Bakar"
                    className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Kamar (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.kamar}
                    onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                    placeholder="Contoh: Kamar 02"
                    className="w-full bg-slate-100 dark:bg-[#070D1A] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-md cursor-pointer"
                >
                  Simpan Data Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Delete Modal (Superadmin / Kasie Only) */}
      {isSuperadmin && (
        <>
          <EditSantriModal
            isOpen={Boolean(editingSantri)}
            santri={editingSantri}
            onClose={() => setEditingSantri(null)}
          />

          <DeleteSantriModal
            isOpen={Boolean(santriToDelete)}
            santri={santriToDelete}
            onClose={() => setSantriToDelete(null)}
          />
        </>
      )}

      {/* Excel Import Modal */}
      <ErrorBoundary
        fallbackTitle="Gagal Membuka Dialog Import Santri"
        onReset={() => setShowImportModal(false)}
      >
        <ImportSantriModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          defaultUnit={effectiveUnit}
        />
      </ErrorBoundary>
    </div>
  );
};
