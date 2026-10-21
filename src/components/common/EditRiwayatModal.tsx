import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, Pencil, Calendar, Clock, AlertTriangle, FileText, Scale, GraduationCap } from 'lucide-react';
import { RiwayatPelanggaran, Pelanggaran } from '../../types';
import { useApp } from '../../context/AppContext';
import { PointBadge, getKategoriFromPoin, KategoriPelanggaranBadge } from './PointBadge';
import { getOfficialKategori } from '../../lib/exportPelanggaranPdf';
import { formatWIBDateTime } from '../../lib/pembinaanHelper';

interface EditRiwayatModalProps {
  isOpen: boolean;
  riwayat: RiwayatPelanggaran | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function toDatetimeLocal(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return new Date().toISOString().slice(0, 16);
  const d = new Date(isoOrDateStr);
  if (isNaN(d.getTime())) {
    // If it's formatted like "25 Agu 2026, 16.38 WIB", fallback to now or parse
    return new Date().toISOString().slice(0, 16);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const EditRiwayatModal: React.FC<EditRiwayatModalProps> = ({
  isOpen,
  riwayat,
  onClose,
  onSuccess
}) => {
  const { user, pelanggaranList, updateRiwayatPelanggaran, showToast } = useApp();

  const [selectedPelanggaranId, setSelectedPelanggaranId] = useState('');
  const [poin, setPoin] = useState<number>(0);
  const [datetimeLocal, setDatetimeLocal] = useState('');
  const [hukuman, setHukuman] = useState('');
  const [catatan, setCatatan] = useState('');
  const [status, setStatus] = useState<'Selesai' | 'Belum Selesai'>('Belum Selesai');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (riwayat) {
      setSelectedPelanggaranId(riwayat.jenisPelanggaranId || '');
      setPoin(riwayat.poin || 0);
      setDatetimeLocal(toDatetimeLocal(riwayat.timestamp));
      setHukuman(riwayat.hukuman && riwayat.hukuman !== '-' ? riwayat.hukuman : '');
      setCatatan(riwayat.catatan || '');
      setStatus(riwayat.status || 'Belum Selesai');
      setFormError(null);
      setIsSubmitting(false);
    }
  }, [riwayat, isOpen]);

  // Handle change of violation type from dropdown
  const handlePelanggaranChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedPelanggaranId(newId);
    const found = pelanggaranList.find((p) => p.id === newId);
    if (found) {
      setPoin(found.poin);
      if (found.konsekuensi && found.konsekuensi !== '-') {
        setHukuman(found.konsekuensi);
      }
    }
  };

  const selectedMaster = useMemo(() => {
    return pelanggaranList.find((p) => p.id === selectedPelanggaranId);
  }, [pelanggaranList, selectedPelanggaranId]);

  const kategoriInfo = useMemo(() => {
    return getOfficialKategori(poin);
  }, [poin]);

  if (!isOpen || !riwayat) return null;

  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';
  const isKoordinator = user?.role === 'KOORDINATOR';
  const canEdit = isSuperadmin || (isKoordinator && riwayat.santriUnit === user?.unit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canEdit) {
      setFormError('Akses Ditolak: Anda tidak memiliki izin untuk merevisi kasus ini.');
      return;
    }

    if (!selectedPelanggaranId) {
      setFormError('Silakan pilih jenis pelanggaran.');
      return;
    }

    if (isNaN(poin) || poin < 1) {
      setFormError('Bobot poin pelanggaran harus minimal 1.');
      return;
    }

    if (!datetimeLocal) {
      setFormError('Tanggal dan waktu pelanggaran wajib diisi.');
      return;
    }

    const d = new Date(datetimeLocal);
    if (isNaN(d.getTime())) {
      setFormError('Format tanggal/waktu tidak valid.');
      return;
    }

    const formattedTanggal = formatWIBDateTime(d);
    const timestampISO = d.toISOString();

    setIsSubmitting(true);
    try {
      const res = await updateRiwayatPelanggaran(riwayat.id, {
        jenisPelanggaranId: selectedPelanggaranId,
        jenisPelanggaranNama: selectedMaster?.jenis || riwayat.jenisPelanggaranNama,
        poin,
        hukuman: hukuman.trim() || '-',
        catatan: catatan.trim() || undefined,
        tanggal: formattedTanggal,
        timestamp: timestampISO,
        status
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setFormError(res.message || 'Gagal menyimpan perubahan ke database.');
      }
    } catch (err: any) {
      console.error('[EDIT KASUS ERROR]', err);
      setFormError(err?.message || 'Terjadi kesalahan sistem saat memperbarui data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-riwayat-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="edit-riwayat-dialog"
        className="relative w-full max-w-xl bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/80 dark:bg-[#091322]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Revisi Kasus Pelanggaran
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbaiki jenis pelanggaran, poin, tanggal/waktu, sanksi, atau catatan kasus
              </p>
            </div>
          </div>
          <button
            id="btn-close-edit-riwayat"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Identity Card */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-200/80 dark:border-[#192A45] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Santri Terkait</span>
                <strong className="text-slate-900 dark:text-white font-extrabold truncate block">
                  {riwayat.santriNama}
                </strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {riwayat.santriKelas} • Unit {riwayat.santriUnit}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Pelapor</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                {riwayat.pencatat || 'Petugas'}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Jenis Pelanggaran Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              JENIS PELANGGARAN <span className="text-rose-500">*</span>
            </label>
            <select
              id="edit-input-jenis-pelanggaran"
              value={selectedPelanggaranId}
              onChange={handlePelanggaranChange}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-medium cursor-pointer"
            >
              <option value="" disabled>-- Pilih Jenis Pelanggaran --</option>
              {pelanggaranList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.kode ? `[${item.kode}] ` : ''}{item.jenis} — ({item.poin} Poin)
                </option>
              ))}
            </select>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
              Mengubah jenis pelanggaran akan otomatis menyesuaikan poin dan konsekuensi rekomendasi.
            </p>
          </div>

          {/* Poin & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                BOBOT POIN KASUS <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-input-poin-kasus"
                type="number"
                min={1}
                max={100}
                required
                value={poin}
                onChange={(e) => setPoin(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                KATEGORI RESMI <span className="text-slate-400 font-normal">(Otomatis)</span>
              </label>
              <div className="flex items-center h-[38px] px-3 bg-slate-100/70 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    color: `rgb(${kategoriInfo.textColor.join(',')})`,
                    backgroundColor: `rgb(${kategoriInfo.bgColor.join(',')})`
                  }}
                >
                  {kategoriInfo.label} ({poin} Poin)
                </span>
              </div>
            </div>
          </div>

          {/* Tanggal & Waktu Pelanggaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>TANGGAL & WAKTU KEJADIAN</span> <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-input-tanggal-waktu"
              type="datetime-local"
              required
              value={datetimeLocal}
              onChange={(e) => setDatetimeLocal(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>

          {/* Sanksi / Konsekuensi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              SANKSI / KONSEKUENSI <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              id="edit-input-sanksi"
              type="text"
              value={hukuman}
              onChange={(e) => setHukuman(e.target.value)}
              placeholder="Contoh: Membersihkan masjid / Nasihat dan surat pernyataan"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              CATATAN KRONOLOGIS <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              id="edit-input-catatan"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Keterangan tambahan atau kronologi kejadian..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>

          {/* Status Penyelesaian Kasus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              STATUS PENYELESAIAN
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="edit-status"
                  value="Belum Selesai"
                  checked={status === 'Belum Selesai'}
                  onChange={() => setStatus('Belum Selesai')}
                  className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-semibold text-amber-700 dark:text-amber-400">Belum Selesai</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="edit-status"
                  value="Selesai"
                  checked={status === 'Selesai'}
                  onChange={() => setStatus('Selesai')}
                  className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Selesai</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1E3048]">
            <button
              id="btn-cancel-edit-riwayat"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15253F] rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-edit-riwayat"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-[0.98] rounded-xl shadow-md shadow-amber-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Revisi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
