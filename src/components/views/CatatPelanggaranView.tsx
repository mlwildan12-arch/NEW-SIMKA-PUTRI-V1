import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Santri, Pelanggaran } from '../../types';
import { PointBadge } from '../common/PointBadge';
import { RekomendasiPembinaanSection } from './RekomendasiPembinaanSection';
import {
  ClipboardEdit,
  User,
  GraduationCap,
  BookOpen,
  Scale,
  ShieldAlert,
  FileText,
  Save,
  CheckCircle,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const CatatPelanggaranView: React.FC = () => {
  const { 
    santriList, 
    pelanggaranList, 
    catatPelanggaranBaru, 
    setCurrentRoute,
    getPembinaanBySinglePoin,
    user,
    usersList,
    showToast
  } = useApp();

  // Form State
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [santriSearch, setSantriSearch] = useState('');
  const [isSantriDropdownOpen, setIsSantriDropdownOpen] = useState(false);

  const [selectedPelanggaran, setSelectedPelanggaran] = useState<Pelanggaran | null>(null);
  const [pelanggaranSearch, setPelanggaranSearch] = useState('');
  const [isPelanggaranDropdownOpen, setIsPelanggaranDropdownOpen] = useState(false);

  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastRecordedInfo, setLastRecordedInfo] = useState<{
    nama: string;
    kelas: string;
    unit: string;
    jenis: string;
    poin: number;
  } | null>(null);

  const santriDropdownRef = useRef<HTMLDivElement>(null);
  const pelanggaranDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (santriDropdownRef.current && !santriDropdownRef.current.contains(e.target as Node)) {
        setIsSantriDropdownOpen(false);
      }
      if (pelanggaranDropdownRef.current && !pelanggaranDropdownRef.current.contains(e.target as Node)) {
        setIsPelanggaranDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSantriList = santriList.filter(
    (s) =>
      s.nama.toLowerCase().includes(santriSearch.toLowerCase()) ||
      s.nis.includes(santriSearch) ||
      s.kelas.toLowerCase().includes(santriSearch.toLowerCase())
  );

  const filteredPelanggaranList = pelanggaranList.filter(
    (p) =>
      p.jenis.toLowerCase().includes(pelanggaranSearch.toLowerCase()) ||
      p.kode.toLowerCase().includes(pelanggaranSearch.toLowerCase()) ||
      p.konsekuensi.toLowerCase().includes(pelanggaranSearch.toLowerCase())
  );

  const handleResetForm = () => {
    setSelectedSantri(null);
    setSantriSearch('');
    setSelectedPelanggaran(null);
    setPelanggaranSearch('');
    setCatatan('');
    setSavedSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedSantri) {
      showToast('Form Belum Lengkap', 'Silakan pilih nama santri terlebih dahulu.', 'warning');
      return;
    }

    if (!selectedPelanggaran) {
      showToast('Form Belum Lengkap', 'Silakan pilih kategori jenis pelanggaran.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const recordedSnapshot = {
      nama: selectedSantri.nama,
      kelas: selectedSantri.kelas,
      unit: selectedSantri.unit,
      jenis: selectedPelanggaran.jenis,
      poin: selectedPelanggaran.poin
    };

    const success = await catatPelanggaranBaru({
      santriId: selectedSantri.id,
      pelanggaranId: selectedPelanggaran.id,
      catatan
    });

    setIsSubmitting(false);

    if (success) {
      setLastRecordedInfo(recordedSnapshot);
      setSavedSuccess(true);
      // Reset form fields but stay on page so user can record next violation or view rekap
      setSelectedSantri(null);
      setSantriSearch('');
      setSelectedPelanggaran(null);
      setPelanggaranSearch('');
      setCatatan('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-5 sm:p-6 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <ClipboardEdit className="w-3.5 h-3.5" />
            <span>Form Pencatatan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Catat Pelanggaran Santri
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
            Pencatatan pelanggaran tata tertib dan pembinaan akhlak santri terstandar.
          </p>
        </div>
      </div>

      {savedSuccess && lastRecordedInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Pelanggaran Berhasil Dicatat!
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Santri <strong className="text-slate-900 dark:text-white font-bold">{lastRecordedInfo.nama}</strong> ({lastRecordedInfo.kelas} {lastRecordedInfo.unit}) tercatat melakukan <em>&ldquo;{lastRecordedInfo.jenis}&rdquo;</em> (<strong className="text-rose-600 dark:text-rose-400 font-bold">+{lastRecordedInfo.poin} Poin</strong>).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#15253F] hover:bg-slate-100 dark:hover:bg-[#1A2E4E] border border-slate-300 dark:border-[#1E304F] text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Catat Santri Lainnya
            </button>
            <button
              type="button"
              onClick={() => setCurrentRoute('rekap-pelanggaran')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <span>Buka Rekap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSavedSuccess(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs overflow-hidden p-5 sm:p-7 space-y-6"
      >
        {/* SECTION 1: IDENTITAS SANTRI */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">
                IDENTITAS SANTRI
              </h2>
            </div>
            {user && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#132138] border border-slate-200 dark:border-[#1E2E4A] text-[11px] text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 font-normal">Pelapor:</span>
                <span className="font-bold text-slate-800 dark:text-white">{user.nama}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">({user.title || user.role})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Searchable Santri Select */}
            <div className="space-y-1 relative" ref={santriDropdownRef}>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Nama Santri</span>
                <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ketik nama santri..."
                  value={santriSearch}
                  onFocus={() => setIsSantriDropdownOpen(true)}
                  onChange={(e) => {
                    setSantriSearch(e.target.value);
                    setIsSantriDropdownOpen(true);
                    if (selectedSantri && selectedSantri.nama !== e.target.value) {
                      setSelectedSantri(null);
                    }
                  }}
                  className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E2E4A] text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {santriSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSantriSearch('');
                      setSelectedSantri(null);
                      setIsSantriDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Santri Autocomplete Dropdown List */}
              {isSantriDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-[#0F1B2E] border border-slate-200 dark:border-[#1E304F] shadow-xl divide-y divide-slate-100 dark:divide-[#182740]">
                  {filteredSantriList.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Santri tidak ditemukan
                    </div>
                  ) : (
                    filteredSantriList.slice(0, 15).map((santri) => (
                      <div
                        key={santri.id}
                        onClick={() => {
                          setSelectedSantri(santri);
                          setSantriSearch(santri.nama);
                          setIsSantriDropdownOpen(false);
                        }}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#152642] cursor-pointer flex items-center justify-between gap-3 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                            {santri.nama}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            NIS: {santri.nis} • Kelas {santri.kelas} ({santri.unit})
                          </p>
                        </div>
                        <PointBadge points={santri.totalPoin} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Readonly Kelas & Unit */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Kelas & Unit
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090F1B] border border-slate-200 dark:border-[#182740] text-xs font-bold text-slate-700 dark:text-slate-300">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {selectedSantri
                    ? `${selectedSantri.kelas} - ${selectedSantri.unit}`
                    : 'Pilih santri terlebih dahulu'}
                </span>
                {selectedSantri && (
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-normal">
                    Poin saat ini: <strong className="text-rose-600 dark:text-rose-400">{selectedSantri.totalPoin}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: RINCIAN KASUS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">
              RINCIAN KASUS
            </h2>
          </div>

          {/* Searchable Violation Select */}
          <div className="space-y-1 relative" ref={pelanggaranDropdownRef}>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Kategori / Jenis Pelanggaran</span>
              <span className="text-rose-500">*</span>
            </label>

            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ketik jenis pelanggaran..."
                value={pelanggaranSearch}
                onFocus={() => setIsPelanggaranDropdownOpen(true)}
                onChange={(e) => {
                  setPelanggaranSearch(e.target.value);
                  setIsPelanggaranDropdownOpen(true);
                  if (selectedPelanggaran && selectedPelanggaran.jenis !== e.target.value) {
                    setSelectedPelanggaran(null);
                  }
                }}
                className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E2E4A] text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {pelanggaranSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPelanggaranSearch('');
                    setSelectedPelanggaran(null);
                    setIsPelanggaranDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Violation Autocomplete Dropdown */}
            {isPelanggaranDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-[#0F1B2E] border border-slate-200 dark:border-[#1E304F] shadow-xl divide-y divide-slate-100 dark:divide-[#182740]">
                {filteredPelanggaranList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Jenis pelanggaran tidak ditemukan
                  </div>
                ) : (
                  filteredPelanggaranList.map((pel) => (
                    <div
                      key={pel.id}
                      onClick={() => {
                        setSelectedPelanggaran(pel);
                        setPelanggaranSearch(pel.jenis);
                        setIsPelanggaranDropdownOpen(false);
                      }}
                      className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#152642] cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {pel.kode}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {pel.jenis}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {pel.konsekuensi}
                        </p>
                      </div>
                      <PointBadge points={pel.poin} size="sm" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Auto-filled Bobot Poin & Konsekuensi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Bobot Poin
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090F1B] border border-slate-200 dark:border-[#182740] font-black text-sm">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className={selectedPelanggaran ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                  {selectedPelanggaran ? `+${selectedPelanggaran.poin} Poin` : '-'}
                </span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Konsekuensi / Hukuman Standar
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090F1B] border border-slate-200 dark:border-[#182740] text-xs font-medium text-slate-700 dark:text-slate-300">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">
                  {selectedPelanggaran ? selectedPelanggaran.konsekuensi : 'Pilih jenis pelanggaran'}
                </span>
              </div>
            </div>
          </div>

          {/* PANEL REKOMENDASI PEMBINAAN RESMI YAYASAN (BERDASARKAN POIN TUNGGAL) */}
          {selectedPelanggaran && (
            <RekomendasiPembinaanSection
              selectedPelanggaran={selectedPelanggaran}
              selectedSantri={selectedSantri}
              pembinaan={getPembinaanBySinglePoin(selectedPelanggaran.poin)}
              currentUser={user}
              usersList={usersList}
            />
          )}
        </div>

        {/* SECTION 3: CATATAN TAMBAHAN */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">
              Catatan Tambahan <span className="text-[11px] text-slate-400 font-normal">(Opsional)</span>
            </h2>
          </div>

          <textarea
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Jelaskan detail kejadian, saksi, barang bukti, atau kesepakatan pembinaan..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B1322] border border-slate-200 dark:border-[#1E2E4A] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Divider & Submit Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#182740] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Data akan langsung tersinkronisasi ke Dashboard & Rekap</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSantri || !selectedPelanggaran}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pelanggaran'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
