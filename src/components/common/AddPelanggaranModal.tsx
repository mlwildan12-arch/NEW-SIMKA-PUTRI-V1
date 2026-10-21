import React, { useState } from 'react';
import { X, AlertCircle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getKategoriFromPoin, KategoriPelanggaranBadge } from './PointBadge';

interface AddPelanggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPelanggaranModal: React.FC<AddPelanggaranModalProps> = ({ isOpen, onClose }) => {
  const { addPelanggaran, showToast } = useApp();

  const [kode, setKode] = useState('');
  const [jenis, setJenis] = useState('');
  const [poin, setPoin] = useState<number>(15);
  const [konsekuensi, setKonsekuensi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentKategori = getKategoriFromPoin(poin);

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
      const result = await addPelanggaran({
        kode: kode.trim() || undefined,
        jenis: jenis.trim(),
        poin,
        konsekuensi: konsekuensi.trim() || '-'
      });

      setIsSubmitting(false);

      if (result.success) {
        onClose();
        // Reset
        setKode('');
        setJenis('');
        setPoin(15);
        setKonsekuensi('');
      } else {
        showToast('Gagal Menambahkan', result.message || 'Terjadi kesalahan sistem.', 'error');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showToast('Gagal Menambahkan', err?.message || 'Terjadi kesalahan sistem saat menyimpan ke database.', 'error');
    }
  };

  return (
    <div
      id="add-pelanggaran-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-pelanggaran-dialog"
        className="relative w-full max-w-xl bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/50 dark:bg-[#081221]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Data Pelanggaran</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kategori dihitung otomatis berdasarkan akumulasi bobot poin
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-pelanggaran"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Kode (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              KODE PELANGGARAN <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              id="input-pelanggaran-kode"
              type="text"
              placeholder="Contoh: P057 (Otomatis jika dikosongkan)"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Item Pelanggaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ITEM PELANGGARAN <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="input-pelanggaran-jenis"
              rows={2}
              required
              placeholder="Tuliskan nama pelanggaran secara rinci (contoh: Vandalisme / coret-coret fasilitas)..."
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Poin & Kategori Otomatis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                BOBOT POIN <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-pelanggaran-poin"
                type="number"
                min={1}
                max={500}
                required
                value={poin}
                onChange={(e) => setPoin(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm font-semibold bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                KATEGORI PELANGGARAN <span className="text-emerald-500 font-medium">(Otomatis)</span>
              </label>
              <div className="flex items-center h-[42px] px-3 bg-slate-100/70 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl">
                <KategoriPelanggaranBadge poin={poin} />
              </div>
            </div>
          </div>

          {/* Point scale explanation hint */}
          <div className="p-3 bg-slate-50 dark:bg-[#0B1628] rounded-xl border border-slate-200/80 dark:border-[#1E3048] text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Skala Kategori Otomatis SIMKA.ID Pro:
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
              HUKUMAN / KONSEKUENSI <span className="text-slate-400 font-normal">(Opsional, default "-")</span>
            </label>
            <input
              id="input-pelanggaran-konsekuensi"
              type="text"
              placeholder="Contoh: Teguran lisan + tilawah 30 menit (atau - jika belum ada)"
              value={konsekuensi}
              onChange={(e) => setKonsekuensi(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1E3048]">
            <button
              id="btn-cancel-add-pelanggaran"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-add-pelanggaran"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Pelanggaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
