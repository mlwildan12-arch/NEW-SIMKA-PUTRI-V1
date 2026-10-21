import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  parseUsersExcel, 
  generateUserExcelTemplate, 
  UserImportRow 
} from '../../lib/excelHelper';

interface ImportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportUserModal: React.FC<ImportUserModalProps> = ({
  isOpen,
  onClose
}) => {
  const { usersList, importUsersBatch, showToast } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importRows, setImportRows] = useState<UserImportRow[]>([]);
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
      const result = await parseUsersExcel(targetFile, usersList);
      setImportRows(result.rows);
      setStats({
        validCount: result.validCount,
        duplicateCount: result.duplicateCount,
        errorCount: result.errorCount
      });
      showToast(
        'File Pengguna Diproses',
        `Ditemukan ${result.validCount} akun valid, ${result.duplicateCount} duplikat, dan ${result.errorCount} data bermasalah.`,
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
      showToast('Tidak Ada Data', 'Tidak ada akun pengguna valid yang dapat diimport.', 'warning');
      return;
    }

    setIsImporting(true);

    const payload = validRows.map((r) => ({
      id: r.id,
      nama: r.nama,
      username: r.username,
      password: r.passwordRaw || r.password,
      passwordRaw: r.passwordRaw,
      jabatan: r.jabatan,
      role: r.role,
      unit: r.unit,
      is_active: r.isActive
    }));

    const result = await importUsersBatch(payload);
    setIsImporting(false);

    if (result.success) {
      onClose();
      // Reset state
      setFile(null);
      setImportRows([]);
    } else {
      showToast('Gagal Import Pengguna', result.message, 'error');
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
      id="import-user-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="import-user-dialog"
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-[#101C2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3048] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3048] bg-slate-50/50 dark:bg-[#081221] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Import Data Pengguna dari Excel</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format tabel: No | ID | Nama | Username | Password | Email | Role | Unit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-download-user-template"
              type="button"
              onClick={generateUserExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800/50 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Excel
            </button>
            <button
              id="btn-close-import-user"
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
              id="user-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/70 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/30 hover:bg-blue-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih atau Tarik File Excel Akun Pengguna
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mendukung .xlsx, .xls, atau .csv (Setiap akun akan otomatis di-hash password-nya)
              </p>
            </div>
          )}

          {/* Active File Info & Stats */}
          {file && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
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
                  Semua Akun ({importRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreview('valid')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                    filterPreview === 'valid'
                      ? 'bg-blue-600 text-white border-transparent shadow-sm'
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40 hover:bg-blue-100/50'
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

              {/* Security Hint */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Keamanan Password:</span> Password pada file Excel akan otomatis di-hash aman sebelum disimpan ke database. Password tidak akan pernah disimpan atau ditampilkan dalam format teks biasa (plaintext).
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Baris</th>
                        <th className="py-2.5 px-3">Nama Lengkap</th>
                        <th className="py-2.5 px-3">Username</th>
                        <th className="py-2.5 px-3 w-28 text-center">Password</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3 w-20 text-center">Unit</th>
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
                            <div>{row.nama}</div>
                            {row.errorMessage && (
                              <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                                {row.errorMessage}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                            @{row.username}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            ••••••
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {row.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {row.unit}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
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
                <strong className="text-blue-600 dark:text-blue-400">{stats.validCount} akun pengguna</strong> baru akan didaftarkan.
              </span>
            ) : (
              <span>Unggah file Excel akun pengguna untuk memproses data.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-import-user"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-confirm-import-user"
              type="button"
              disabled={isImporting || stats.validCount === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {isImporting ? 'Menyimpan Akun...' : `Import ${stats.validCount} Pengguna`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
