import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Edit3, Sparkles } from 'lucide-react';
import { Pelanggaran } from '../../types';
import { useApp } from '../../context/AppContext';
import { getKategoriFromPoin, KategoriPelanggaranBadge } from './PointBadge';

interface EditPelanggaranModalProps {
  isOpen: boolean;
  pelanggaran: Pelanggaran | null;
  onClose: () => void;
}

export const EditPelanggaranModal: React.FC<EditPelanggaranModalProps> = ({
  isOpen,
  pelanggaran,
  onClose
}) => {
  const { updatePelanggaran, showToast } = useApp();

  const [kode, setKode] = useState('');
  const [jenis, setJenis] = useState('');
  const [poin, setPoin] = useState<number>(15);
  const [konsekuensi, setKonsekuensi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pelanggaran) {
      setKode(pelanggaran.kode || '');
      setJenis(pelanggaran.jenis || '');
      setPoin(pelanggaran.poin || 15);
      setKonsekuensi(pelanggaran.konsekuensi || '-');
      setIsSubmitting(false);
    }
  }, [pelanggaran, isOpen]);

  if (!isOpen || !pelanggaran) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jenis.trim()) {
      showToast('Form Tidak Lengkap', 'Item Pelanggaran wajib diisi.', 'error');
      return;
    }

    if (isNaN(poin) || poin < 1) {
      showToast('Poin Tidak Valid', 'Poin pelanggaran harus berupa angka positif (minimal 1).', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePelanggaran(pelanggaran.id, {
        kode: kode.trim() || undefined,
        jenis: jenis.trim(),
        poin,
        konsekuensi: konsekuensi.trim() || '-'
      });

      setIsSubmitting(false);

      if (result.success) {
        onClose();
      } else {
        showToast('Gagal Memperbarui', result.message || 'Terjadi kesalahan.', 'error');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showToast('Gagal Memperbarui', err?.message || 'Terjadi kesalahan saat memperbarui database.', 'error');
    }
  };

  return (
    <div
      id="edit-pelanggaran-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-pelanggaran-dialog"
        className="relative w-full max-w-xl bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/50 dark:bg-[#081221]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Master Pelanggaran</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah item, poin bobot, atau sanksi konsekuensi
              </p>
            </div>
          </div>
          <button
            id="btn-close-edit-pelanggaran"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Kode Pelanggaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              KODE PELANGGARAN
            </label>
            <input
              id="edit-input-pelanggaran-kode"
              type="text"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>

          {/* Item Pelanggaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ITEM PELANGGARAN <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="edit-input-pelanggaran-jenis"
              rows={2}
              required
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>

          {/* Poin & Kategori Otomatis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                BOBOT POIN <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-input-pelanggaran-poin"
                type="number"
                min={1}
                max={500}
                required
                value={poin}
                onChange={(e) => setPoin(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm font-semibold bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                KATEGORI PELANGGARAN <span className="text-blue-500 font-medium">(Otomatis)</span>
              </label>
              <div className="flex items-center h-[42px] px-3 bg-slate-100/70 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl">
                <KategoriPelanggaranBadge poin={poin} />
              </div>
            </div>
          </div>

          {/* Point scale explanation hint */}
          <div className="p-3 bg-slate-50 dark:bg-[#0B1628] rounded-xl border border-slate-200/80 dark:border-[#1E3048] text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Skala Kategori Otomatis:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px]">
              <div>• 5–49: <span className="font-bold text-blue-500">Ringan</span></div>
              <div>• 50–79: <span className="font-bold text-amber-500">Sedang</span></div>
              <div>• 80–94: <span className="font-bold text-red-500">Berat</span></div>
              <div>• 95–100: <span className="font-bold text-rose-500">Sangat Berat</span></div>
            </div>
          </div>

          {/* Hukuman / Konsekuensi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              HUKUMAN / KONSEKUENSI <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              id="edit-input-pelanggaran-konsekuensi"
              type="text"
              value={konsekuensi}
              onChange={(e) => setKonsekuensi(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1E3048]">
            <button
              id="btn-cancel-edit-pelanggaran"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-edit-pelanggaran"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
