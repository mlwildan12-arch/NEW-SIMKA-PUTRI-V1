import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UnitPesantren, UserAccount } from '../../types';
import { generateSantriExcelTemplate, parseSantriExcel, SantriImportRow } from '../../lib/excelHelper';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  HelpCircle,
  Loader2,
  RotateCcw
} from 'lucide-react';

interface ImportSantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUnit?: UnitPesantren;
}

export const ImportSantriModal: React.FC<ImportSantriModalProps> = ({
  isOpen,
  onClose,
  defaultUnit = 'SMP'
}) => {
  const { user, usersList = [], allSantriList = [], importSantriBatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';

  // State
  const [selectedImportUnit, setSelectedImportUnit] = useState<UnitPesantren>('SMP');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<SantriImportRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync unit when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isSuperadmin) {
        if (defaultUnit === 'SMP' || defaultUnit === 'MA' || defaultUnit === 'SMA') {
          setSelectedImportUnit(defaultUnit);
        } else {
          setSelectedImportUnit('SMP');
        }
      } else if (user?.unit === 'SMP' || user?.unit === 'MA' || user?.unit === 'SMA') {
        setSelectedImportUnit(user.unit);
      } else {
        setSelectedImportUnit('SMP');
      }
      setErrorMessage(null);
    }
  }, [isOpen, defaultUnit, isSuperadmin, user?.unit]);

  // Derived row subsets
  const validRows = useMemo(() => (parsedRows || []).filter((r) => r.status === 'valid'), [parsedRows]);
  const duplicateRows = useMemo(() => (parsedRows || []).filter((r) => r.status === 'duplicate'), [parsedRows]);
  const errorRows = useMemo(() => (parsedRows || []).filter((r) => r.status === 'error'), [parsedRows]);

  const displayedRows = useMemo(() => {
    if (activeTabFilter === 'valid') return validRows;
    if (activeTabFilter === 'duplicate') return duplicateRows;
    if (activeTabFilter === 'error') return errorRows;
    return parsedRows || [];
  }, [parsedRows, validRows, duplicateRows, errorRows, activeTabFilter]);

  if (!isOpen) return null;

  const handleResetModal = () => {
    setFileName('');
    setParsedRows([]);
    setErrorMessage(null);
    setActiveTabFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleResetModal();
    onClose();
  };

  const processFile = (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setErrorMessage(null);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error('Gagal membaca data file.');
        }

        const { rows, validCount, duplicateCount, errorCount } = parseSantriExcel(
          buffer,
          allSantriList || [],
          selectedImportUnit,
          (usersList || []) as UserAccount[],
          isSuperadmin,
          user?.unit
        );

        if (!rows || rows.length === 0) {
          setErrorMessage('File Excel kosong atau tidak memiliki baris data santri yang dapat diproses.');
          setParsedRows([]);
        } else {
          setParsedRows(rows);
          if (validCount === 0) {
            setErrorMessage(
              `Tidak ada data valid yang siap diimport. Ditemukan ${duplicateCount} duplikat dan ${errorCount} data tidak lengkap.`
            );
          }
        }
      } catch (err: any) {
        console.error('[EXCEL PARSE ERROR]', err);
        setErrorMessage(
          err?.message || 'Gagal memproses file Excel. Pastikan format file adalah .xlsx atau .xls yang valid.'
        );
        setParsedRows([]);
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => {
      console.error('[FILEREADER ERROR]', reader.error);
      setErrorMessage('Terjadi kendala saat membaca file dari komputer Anda.');
      setIsProcessingFile(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
        processFile(file);
      } else {
        setErrorMessage('Mohon unggah file dengan format .xlsx atau .xls');
      }
    }
  };

  const handleExecuteImport = async () => {
    if (validRows.length === 0) {
      setErrorMessage('Tidak ada data valid yang dapat dimasukkan ke database.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // NOTE: Explicitly omitting 'kamar' and 'musyrif_id' from database payload as instructed
      const payload = validRows.map((r) => ({
        nis: r.nis.trim(),
        nama: r.nama.trim().toUpperCase(),
        kelas: r.kelas.trim(),
        unit: (r.unit as UnitPesantren) || selectedImportUnit,
        musyrifNama: r.resolvedMusyrifNama || r.musyrif,
        asrama: r.asrama || `Asrama ${r.unit || selectedImportUnit}`
      }));

      const res = await importSantriBatch(payload);

      if (res.success && res.insertedCount > 0) {
        handleResetModal();
        onClose();
      } else {
        setErrorMessage(
          res.message || 'Import tidak menambahkan data: periksa apakah NIS sudah terdaftar atau format tidak sesuai.'
        );
      }
    } catch (err: any) {
      console.error('[EXECUTE IMPORT ERROR]', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menyimpan ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-import-santri-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-import-santri-card"
        className="bg-white dark:bg-[#101C2F] border border-slate-200 dark:border-[#1E3048] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1E3048] flex items-center justify-between bg-slate-50 dark:bg-[#081221] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Import Santri dari Excel
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-normal">
                  Unit {selectedImportUnit}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unggah data santri massal ke database Supabase tanpa mengubah data santri yang sudah ada.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15253F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Unit Target Selector & Template Download Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048]">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Unit Santri:
              </label>
              <div className="flex items-center gap-2">
                {(['SMP', 'MA', 'SMA'] as UnitPesantren[]).map((u) => {
                  const isDisabled = !isSuperadmin && user?.unit !== u;
                  const isSelected = selectedImportUnit === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedImportUnit(u);
                        if (parsedRows.length > 0) {
                          handleResetModal();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-[#15233C] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#1E3050]'
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      Unit {u}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex sm:justify-end items-center">
              <button
                type="button"
                onClick={generateSantriExcelTemplate}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-600/25 text-xs font-medium transition-colors cursor-pointer w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Unduh Format Template Excel</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          {parsedRows.length === 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/60 dark:bg-[#0B1628]/60 hover:bg-slate-100 dark:hover:bg-[#0B1628] group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                {isProcessingFile ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {isProcessingFile ? 'Sedang Membaca File Excel...' : 'Pilih File Excel atau Drag & Drop ke Sini'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Mendukung format file <strong>.xlsx</strong> atau <strong>.xls</strong>. Format kolom: Kode/NIS, Nama Santri, Unit, Kelas, Musyrif, Asrama/Kamar.
              </p>
            </div>
          )}

          {/* Error / Alert Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Summary Preview after file parsed */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* File Info & Status Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                    {fileName}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({parsedRows.length} total baris)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetModal}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline font-medium self-start sm:self-auto cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ganti File Excel</span>
                </button>
              </div>

              {/* Status Statistic Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('all')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTabFilter === 'all'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-1 ring-slate-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Baris</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{parsedRows.length}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('valid')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTabFilter === 'valid'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Data Valid</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{validRows.length}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('duplicate')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTabFilter === 'duplicate'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500/60 ring-1 ring-amber-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                  }`}
                >
                  <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Duplikat (Lewati)</span>
                  </div>
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{duplicateRows.length}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('error')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTabFilter === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500/60 ring-1 ring-rose-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                  }`}
                >
                  <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Data Error</span>
                  </div>
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">{errorRows.length}</div>
                </button>
              </div>

              {/* Table Data Preview */}
              <div className="border border-slate-200 dark:border-[#1E3048] rounded-xl overflow-hidden bg-white dark:bg-[#0B1628]">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#081221] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-[#1E3048] sticky top-0 font-semibold z-10">
                      <tr>
                        <th className="py-2.5 px-3">Baris</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">NIS</th>
                        <th className="py-2.5 px-3">Nama Santri</th>
                        <th className="py-2.5 px-3">Unit / Kelas</th>
                        <th className="py-2.5 px-3">Musyrif</th>
                        <th className="py-2.5 px-3">Keterangan / Diagnosa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400 dark:text-slate-500">
                            Tidak ada data untuk kategori status ini.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map((r, i) => (
                          <tr
                            key={i}
                            className={`hover:bg-slate-50 dark:hover:bg-[#121E36]/40 transition-colors ${
                              r.status === 'valid'
                                ? 'bg-emerald-500/5'
                                : r.status === 'duplicate'
                                ? 'bg-amber-500/5'
                                : 'bg-rose-500/5'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-slate-400">#{r.rowNumber}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {r.status === 'valid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              )}
                              {r.status === 'duplicate' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                  <AlertTriangle className="w-3 h-3" /> Duplikat
                                </span>
                              )}
                              {r.status === 'error' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-semibold">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-200">{r.nis || '-'}</td>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{r.nama || '-'}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{r.unit}</span> - {r.kelas}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                              {r.resolvedMusyrifNama || r.musyrif || '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                              {r.errorMessage ? (
                                <span className={r.status === 'duplicate' ? 'text-amber-600 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300'}>
                                  {r.errorMessage}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">Siap diimport (Insert Baru)</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Advice Note */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Aturan Import SIMKA.ID:</strong> Hanya baris dengan status{' '}
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Valid ({validRows.length} data)</span>{' '}
                  yang akan dimasukkan ke dalam database. Data duplikat dan baris error akan otomatis dilewati tanpa mengganggu proses insert.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#1E3048] bg-slate-50 dark:bg-[#081221] flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedRows.length > 0 && (
              <span>
                Akan menambahkan <strong className="text-emerald-600 dark:text-emerald-400">{validRows.length} santri</strong> ke Unit {selectedImportUnit}.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15253F] transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={validRows.length === 0 || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan {validRows.length} Data Santri</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
