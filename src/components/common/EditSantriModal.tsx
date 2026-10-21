import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Santri, UnitPesantren } from '../../types';
import {
  UserCheck,
  Edit,
  Trash2,
  AlertCircle,
  Building,
  Home,
  GraduationCap,
  X,
  ShieldAlert
} from 'lucide-react';

interface EditSantriModalProps {
  isOpen: boolean;
  santri: Santri | null;
  onClose: () => void;
}

export const EditSantriModal: React.FC<EditSantriModalProps> = ({ isOpen, santri, onClose }) => {
  const { user, usersList, updateSantri, deleteSantri, riwayatList } = useApp();

  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: '',
    unit: 'SMP' as UnitPesantren,
    musyrifId: '',
    asrama: '',
    kamar: '',
    keterangan: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (santri) {
      // Find musyrif by id or exact name match from usersList
      let initialMusyrifId = santri.musyrifId || '';
      if (!initialMusyrifId && santri.musyrifNama) {
        const found = usersList.find(
          (u) => u.role === 'MUSYRIF' && u.nama.toLowerCase().trim() === santri.musyrifNama?.toLowerCase().trim()
        );
        if (found) initialMusyrifId = found.id;
      }

      setFormData({
        nis: santri.nis || '',
        nama: santri.nama || '',
        kelas: santri.kelas || '',
        unit: santri.unit || 'SMP',
        musyrifId: initialMusyrifId,
        asrama: santri.asrama || '',
        kamar: santri.kamar || '',
        keterangan: santri.keterangan || ''
      });
      setFormError(null);
      setShowConfirmDelete(false);
      setIsDeleting(false);
      setIsSaving(false);
    }
  }, [santri, isOpen, usersList]);

  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';

  // Available Musyrifs filtered by current unit
  const availableMusyrifs = useMemo(() => {
    return usersList.filter(
      (u) => u.role === 'MUSYRIF' && (u.unit === formData.unit || u.unit === 'ALL') && u.is_active
    );
  }, [usersList, formData.unit]);

  const santriViolationCount = useMemo(() => {
    if (!santri) return 0;
    return riwayatList.filter((r) => r.santriId === santri.id || (r.santriNama && r.santriNama.toLowerCase() === santri.nama.toLowerCase())).length;
  }, [santri, riwayatList]);

  if (!isOpen || !santri) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.nama.trim() || !formData.kelas.trim()) {
      setFormError('NIS, Nama Santri, dan Kelas wajib diisi.');
      return;
    }

    if (!santri.id) {
      setFormError('ID Santri tidak valid.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const res = await updateSantri(santri.id, {
        nis: formData.nis,
        nama: formData.nama,
        kelas: formData.kelas,
        unit: formData.unit,
        musyrifId: formData.musyrifId || undefined,
        asrama: formData.asrama,
        kamar: formData.kamar,
        keterangan: formData.keterangan
      });

      if (res.success) {
        onClose();
      } else {
        setFormError(res.message || 'Gagal memperbarui data santri.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan saat memperbarui data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setFormError(null);
    try {
      const res = await deleteSantri(santri.id, { deleteViolations: true });
      if (res.success) {
        onClose();
      } else {
        setFormError(res.message || 'Gagal menghapus data santri.');
        setShowConfirmDelete(false);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan sistem saat menghapus.');
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#101C2F] border border-slate-200 dark:border-[#1E3048] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1E3048] flex items-center justify-between bg-slate-50 dark:bg-[#081221]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Data Santri</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {santri.nama} • Unit {santri.unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15253F] transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation View */}
        {showConfirmDelete ? (
          <div className="p-6 space-y-4 bg-white dark:bg-[#101C2F]">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-200 space-y-2">
                <p className="font-bold text-sm text-rose-600 dark:text-rose-300">⚠️ HAPUS SANTRI</p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{santri.nama}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">NIS: {santri.nis} • Kelas {santri.kelas} ({santri.unit})</p>
                </div>
                
                {santriViolationCount > 0 ? (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px] space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-300">
                      Santri ini memiliki {santriViolationCount} data pelanggaran.
                    </p>
                    <p>
                      Jika dilanjutkan, data pelanggaran yang terkait juga akan dihapus (khusus data contoh / testing).
                    </p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300">
                      Master Pelanggaran tetap aman dan tidak akan terhapus.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Apakah Anda yakin ingin menghapus data santri ini dari sistem?
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15253F] transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{santriViolationCount > 0 ? 'Hapus Santri + Data Pelanggaran' : 'Ya, Hapus Data Santri'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIS Santri *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  placeholder="Contoh: 20261050"
                  className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <option value="SMP">Unit SMP</option>
                  <option value="MA">Unit MA</option>
                  <option value="SMA">Unit SMA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Santri *
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: MUHAMMAD FAIZ AL-FARABI"
                className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 uppercase font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas Santri *
                </label>
                <input
                  type="text"
                  required
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  placeholder="Contoh: 7A, 10.1, X-A"
                  className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Musyrif Pembina ({formData.unit})
                </label>
                <select
                  value={formData.musyrifId}
                  onChange={(e) => setFormData({ ...formData, musyrifId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gedung Asrama
                </label>
                <input
                  type="text"
                  value={formData.asrama}
                  onChange={(e) => setFormData({ ...formData, asrama: e.target.value })}
                  placeholder="Contoh: Asrama Abu Bakar"
                  className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Kamar
                </label>
                <input
                  type="text"
                  value={formData.kamar}
                  onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                  placeholder="Contoh: Kamar 02"
                  className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan / Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Catatan khusus santri..."
                className="w-full bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#1E3048] flex items-center justify-between">
              {isSuperadmin ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Santri</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15253F] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
