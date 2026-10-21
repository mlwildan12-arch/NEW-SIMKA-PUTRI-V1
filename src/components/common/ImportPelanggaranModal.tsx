import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  parsePelanggaranExcel, 
  generatePelanggaranExcelTemplate, 
  PelanggaranImportRow 
} from '../../lib/excelHelper';
import { KategoriPelanggaranBadge } from './PointBadge';

interface ImportPelanggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportPelanggaranModal: React.FC<ImportPelanggaranModalProps> = ({
  isOpen,
  onClose
}) => {
  const { pelanggaranList, importPelanggaranBatch, showToast } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importRows, setImportRows] = useState<PelanggaranImportRow[]>([]);
  const [stats, setStats] = useState<{
    validCount: number;
    duplicateCount: number;
    errorCount: number;
  }>({ validCount: 0, duplicateCount: 0, errorCount: 0 });
  const [filterPreview, setFilterPreview] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = async (targetFile: File) => {
    setFile(targetFile);
    setIsParsing(true);

    try {
      const result = await parsePelanggaranExcel(targetFile, pelanggaranList);
      setImportRows(result.rows);
      setStats({
        validCount: result.validCount,
        duplicateCount: result.duplicateCount,
        errorCount: result.errorCount
      });
      showToast(
        'File Diproses',
        `Ditemukan ${result.validCount} data valid, ${result.duplicateCount} duplikat, dan ${result.errorCount} bermasalah.`,
        'info'
      );
    } catch (err: any) {
      showToast('Gagal Membaca File', err.message || 'Format file Excel tidak sesuai.', 'error');
      setImportRows([]);
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = importRows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) {
      showToast('Tidak Ada Data', 'Tidak ada data valid yang dapat diimport.', 'warning');
      return;
    }

    setIsImporting(true);

    try {
      const payload = validRows.map((r) => ({
        kode: r.kode,
        jenis: r.jenis,
        poin: r.poin,
        konsekuensi: r.konsekuensi
      }));

      const result = await importPelanggaranBatch(payload);
      setIsImporting(false);

      if (result.success) {
        onClose();
        // Reset state
        setFile(null);
        setImportRows([]);
      } else {
        showToast('Gagal Import', result.message, 'error');
      }
    } catch (err: any) {
      setIsImporting(false);
      showToast('Gagal Import', err?.message || 'Terjadi kesalahan saat mengimpor data.', 'error');
    }
  };

  const filteredRows = importRows.filter((row) => {
    if (filterPreview === 'valid') return row.status === 'valid';
    if (filterPreview === 'duplicate') return row.status === 'duplicate';
    if (filterPreview === 'error') return row.status === 'error';
    return true;
  });

  return (
    <div
      id="import-pelanggaran-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="import-pelanggaran-dialog"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/50 dark:bg-[#081221] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Import Data Pelanggaran dari Excel</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format tabel: No | Item Pelanggaran | Poin | Kategori Pelanggaran | Hukuman / Konsekuensi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-download-pelanggaran-template"
              type="button"
              onClick={generatePelanggaranExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/50 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Excel
            </button>
            <button
              id="btn-close-import-pelanggaran"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* File Upload Zone */}
          {!file && (
            <div
              id="pelanggaran-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500/70 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/30 hover:bg-emerald-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih atau Tarik File Excel ke Sini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mendukung format .xlsx, .xls, atau .csv (Sesuai format master pelanggaran)
              </p>
            </div>
          )}

          {/* Active File Info & Stats */}
          {file && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • Total {importRows.length} baris diproses
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setImportRows([]);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  Ganti File
                </button>
              </div>

              {/* Status Pills Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterPreview('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    filterPreview === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Semua Data ({importRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreview('valid')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                    filterPreview === 'valid'
                      ? 'bg-emerald-600 text-white border-transparent shadow-sm'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100/50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Siap Diimport ({stats.validCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreview('duplicate')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                    filterPreview === 'duplicate'
                      ? 'bg-amber-600 text-white border-transparent shadow-sm'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100/50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Duplikat ({stats.duplicateCount})
                </button>
                {stats.errorCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterPreview('error')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                      filterPreview === 'error'
                        ? 'bg-rose-600 text-white border-transparent shadow-sm'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40 hover:bg-rose-100/50'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Error ({stats.errorCount})
                  </button>
                )}
              </div>

              {/* Notice regarding category auto-adjustment & non-destructive import */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Keamanan Data & Perhitungan Otomatis:</span> Import ini hanya akan MENAMBAHKAN data baru dan tidak akan menghapus data pelanggaran yang sudah ada. Kategori pelanggaran akan dihitung ulang secara otomatis sesuai standar poin resmi SIMKA.
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Baris</th>
                        <th className="py-2.5 px-3">Item Pelanggaran</th>
                        <th className="py-2.5 px-3 w-16 text-center">Poin</th>
                        <th className="py-2.5 px-3 w-32">Kategori (Otomatis)</th>
                        <th className="py-2.5 px-3">Hukuman / Konsekuensi</th>
                        <th className="py-2.5 px-3 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E3048]/60 bg-white dark:bg-[#101C2F]">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            row.status === 'duplicate'
                              ? 'bg-amber-50/40 dark:bg-amber-950/15'
                              : row.status === 'error'
                              ? 'bg-rose-50/40 dark:bg-rose-950/15'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                            <div>{row.jenis}</div>
                            {row.kategoriWarning && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {row.kategoriWarning}
                              </div>
                            )}
                            {row.errorMessage && (
                              <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                                {row.errorMessage}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                            {row.poin}
                          </td>
                          <td className="py-2 px-3">
                            <KategoriPelanggaranBadge poin={row.poin} size="sm" />
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {row.konsekuensi || '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                <AlertTriangle className="w-3 h-3" /> Duplikat
                              </span>
                            )}
                            {row.status === 'error' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {stats.validCount > 0 ? (
              <span>
                <strong className="text-emerald-600 dark:text-emerald-400">{stats.validCount} data baru</strong> akan ditambahkan ke katalog.
              </span>
            ) : (
              <span>Unggah file Excel untuk memproses data.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-import-pelanggaran"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-confirm-import-pelanggaran"
              type="button"
              disabled={isImporting || stats.validCount === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isImporting ? 'Menyimpan...' : `Import ${stats.validCount} Data Pelanggaran`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
