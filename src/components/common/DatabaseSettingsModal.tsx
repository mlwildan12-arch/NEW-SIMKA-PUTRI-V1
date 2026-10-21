import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Key, 
  Link as LinkIcon, 
  ShieldAlert, 
  Terminal, 
  Server, 
  ExternalLink,
  Eye,
  EyeOff,
  Radio,
  HelpCircle,
  X
} from 'lucide-react';
import { 
  getActiveSupabaseConfig, 
  saveCustomSupabaseConfig, 
  clearCustomSupabaseConfig, 
  setOfflineMode, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { COMPLETE_SUPABASE_SQL } from '../../lib/supabaseSchema';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tablesFound: string[];
    missingTables: string[];
    latencyMs?: number;
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      const config = getActiveSupabaseConfig();
      setUrlInput(config.url);
      setKeyInput(config.anonKey);
      setIsOffline(config.offlineMode);
      setIsCustom(config.isCustom);
      setTestResult(null);
      setSaveSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection(urlInput, keyInput);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menguji koneksi.',
        tablesFound: [],
        missingTables: []
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = () => {
    saveCustomSupabaseConfig(urlInput, keyInput);
    setIsCustom(true);
    setSaveSuccessMsg('Konfigurasi database berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleResetDefault = () => {
    clearCustomSupabaseConfig();
    const config = getActiveSupabaseConfig();
    setUrlInput(config.url);
    setKeyInput(config.anonKey);
    setIsCustom(false);
    setSaveSuccessMsg('Kredensial kustom dihapus. Menggunakan pengaturan bawaan.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleToggleOfflineMode = (offline: boolean) => {
    setIsOffline(offline);
    setOfflineMode(offline);
    setSaveSuccessMsg(offline ? 'Mode Offline / Penyimpanan Lokal diaktifkan.' : 'Mode Cloud Supabase diaktifkan.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(COMPLETE_SUPABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="database-settings-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pengaturan & Sinkronisasi Database Supabase</h2>
              <p className="text-xs text-emerald-200/80">Solusi integrasi data santri, pelanggaran, dan akun ke PostgreSQL</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            isOffline 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : urlInput && keyInput 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="mt-0.5">
              {isOffline ? (
                <Radio className="w-5 h-5 text-amber-600" />
              ) : urlInput && keyInput ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold text-sm block">
                {isOffline 
                  ? 'Mode Offline Aktif (Penyimpanan Lokal Browser)' 
                  : urlInput && keyInput 
                  ? 'Kredensial Supabase Terkonfigurasi'
                  : 'Kredensial Supabase Belum Lengkap / Tidak Aktif'}
              </span>
              <p className="mt-0.5 opacity-90 leading-relaxed">
                {isOffline 
                  ? 'Semua data penambahan, impor Excel santri, dan pencatatan pelanggaran disimpan di memori & browser lokal tanpa memanggil server luar.' 
                  : urlInput && keyInput 
                  ? 'Aplikasi terhubung ke URL Supabase PostgreSQL. Jika Anda menemui error saat impor atau tambah santri, gunakan alat uji koneksi di bawah untuk memeriksa izin tabel dan RLS.'
                  : 'Untuk menyimpan data secara permanen ke Supabase Cloud, masukkan URL dan Anon Key di bawah ini, atau salin skrip SQL migrasi ke Supabase SQL Editor.'}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-semibold text-slate-800 text-sm">Pilihan Mode Penyimpanan</span>
              <p className="text-xs text-slate-500">Pilih apakah ingin sinkron langsung ke cloud atau mode lokal mandiri</p>
            </div>
            <div className="flex bg-slate-200/80 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleToggleOfflineMode(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !isOffline 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cloud Supabase
              </button>
              <button
                type="button"
                onClick={() => handleToggleOfflineMode(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isOffline 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Offline / Lokal
              </button>
            </div>
          </div>

          {/* Form Kredensial Supabase */}
          {!isOffline && (
            <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  Kredensial Proyek Supabase
                </h3>
                {isCustom && (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                    Kredensial Kustom Aktif
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://xyzabcdefghijklmnop.supabase.co"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Ditemukan di Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Gunakan kunci bertipe <strong>anon (public)</strong>, bukan service_role secret.</p>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-2.5 bg-emerald-100/90 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {saveSuccessMsg}
                </div>
              )}

              {/* Action Buttons for Credentials */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !urlInput.trim() || !keyInput.trim()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Menguji Koneksi...' : 'Uji Koneksi Database'}
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={handleResetDefault}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Simpan Kredensial
                </button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className={`mt-3 p-3.5 rounded-lg border text-xs ${
                  testResult.success 
                    ? testResult.missingTables.length > 0 
                      ? 'bg-amber-50 border-amber-300 text-amber-900' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1.5">
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.latencyMs !== undefined && (
                        <p className="text-[11px] opacity-80">Waktu Respon (Latency): {testResult.latencyMs} ms</p>
                      )}
                      {testResult.tablesFound.length > 0 && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-emerald-800">Tabel Aktif: </span>
                          <span className="font-mono">{testResult.tablesFound.join(', ')}</span>
                        </div>
                      )}
                      {testResult.missingTables.length > 0 && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-rose-800">Tabel Belum Dibuat: </span>
                          <span className="font-mono font-bold text-rose-700">{testResult.missingTables.join(', ')}</span>
                          <p className="mt-1 text-slate-700">Gunakan tombol <strong>Salin Skrip SQL</strong> di bawah dan jalankan di SQL Editor Supabase untuk membuat tabel-tabel ini.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panduan & Skrip SQL Migrasi */}
          <div className="space-y-3 bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Panduan Sinkronisasi 3 Langkah & Skrip SQL</h3>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Tersalin!' : 'Salin Seluruh Skrip SQL'}
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">Dashboard Supabase <ExternalLink className="w-3 h-3 inline" /></a> dan pilih proyek Anda.
              </li>
              <li>
                Masuk ke menu <strong>SQL Editor</strong> (ikon terminal di sidebar kiri), klik <strong>New Query</strong>, paste skrip SQL lengkap yang telah disalin, lalu klik <strong>Run</strong>.
              </li>
              <li>
                Skrip ini otomatis membuat tabel (<code className="text-emerald-300 font-mono">santri</code>, <code className="text-emerald-300 font-mono">pelanggaran</code>, <code className="text-emerald-300 font-mono">users</code>, <code className="text-emerald-300 font-mono">master_pembinaan</code>), mengisi 8 tingkat pembinaan resmi, serta mengaktifkan izin akses (RLS) untuk anon public key.
              </li>
            </ol>

            {/* Toggle Preview */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSqlPreview(!showSqlPreview)}
                className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
              >
                {showSqlPreview ? 'Sembunyikan Cuplikan SQL' : 'Lihat Cuplikan Skrip SQL'}
              </button>

              {showSqlPreview && (
                <pre className="mt-2 p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-300 max-h-48 overflow-y-auto border border-slate-800 whitespace-pre-wrap">
                  {COMPLETE_SUPABASE_SQL}
                </pre>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>SIMKA.ID &bull; Single Source of Truth Database Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
