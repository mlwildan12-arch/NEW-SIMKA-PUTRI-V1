import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const { resolvedTheme, toggleTheme, setThemeMode } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Gagal masuk ke sistem. Silakan periksa username dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await login(username.trim(), password, rememberMe);
      if (!res.success) {
        setErrorMsg('Gagal masuk ke sistem. Silakan periksa username dan kata sandi.');
      }
    } catch {
      setErrorMsg('Gagal masuk ke sistem. Silakan periksa username dan kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#07111E] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 select-none font-sans overflow-x-hidden transition-colors duration-200">
      {/* Top Floating Theme Switcher Button */}
      <div className="w-full max-w-md flex justify-end pt-2 sm:pt-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Beralih ke Tema Terang' : 'Beralih ke Tema Gelap'}
          title={resolvedTheme === 'dark' ? 'Beralih ke Tema Terang' : 'Beralih ke Tema Gelap'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[#1E3048] shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
        >
          {resolvedTheme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px]">Tema Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto py-6 max-w-md mx-auto">
        {/* ============================================================ */}
        {/* BRANDING HEADER */}
        {/* ============================================================ */}
        <header className="w-full text-center mb-6 flex flex-col items-center">
          {/* LOGO RESMI SIMKA.ID (EMERALD MOSQUE LOGO) */}
          <div className="mb-4 flex items-center justify-center">
            <img
              src="/logo-simka.png"
              alt="Logo Resmi SIMKA.ID"
              className="w-24 h-24 sm:w-[120px] sm:h-[120px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-200 select-none pointer-events-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-simka.svg';
              }}
            />
          </div>

          {/* SIMKA.ID Pro V1 TITLE */}
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              SIMKA<span className="text-emerald-600 dark:text-emerald-400">.ID</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50 tracking-wider">
              Pro V1
            </span>
          </div>

          {/* SUBTITLE */}
          <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1 max-w-xs sm:max-w-md leading-relaxed tracking-wide">
            Sistem Monitoring Karakter &amp; Akhlak Santri
          </p>

          {/* NAMA PESANTREN */}
          <p className="text-[10.5px] sm:text-xs font-bold text-amber-600 dark:text-[#F4B942] tracking-wider uppercase mt-1">
            PESANTREN NURUL ISLAM TENGARAN
          </p>
        </header>

        {/* ============================================================ */}
        {/* LOGIN CARD */}
        {/* ============================================================ */}
        <main className="w-full bg-white dark:bg-[#0E1A2E] border border-slate-200/90 dark:border-[#1E3048] rounded-2xl p-5 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-2xl dark:shadow-black/80 transition-colors">
          {/* Card Header */}
          <div className="mb-5 text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Masuk ke Sistem
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Gunakan username dan kata sandi Anda untuk mengakses sistem.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-snug text-[12px] font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: USERNAME PENGGUNA */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                USERNAME PENGGUNA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  className="w-full bg-slate-50 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] rounded-xl pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#081221] focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Field 2: KATA SANDI */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                KATA SANDI
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#081221] focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* INGAT SAYA (Persistent Session) */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="remember-me" className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-[#16352C] bg-white dark:bg-[#071310] focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-600"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
                    Ingat Saya
                  </span>
                  <span className="text-[10.5px] text-slate-400">
                    Tetap masuk di perangkat ini
                  </span>
                </div>
              </label>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Terlindungi</span>
              </span>
            </div>

            {/* BUTTON LOGIN */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 h-11 sm:h-12 flex items-center justify-center gap-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke SIMKA.ID</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Theme Quick Toggle below the login form */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1C2F4D] flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Pilihan Tema:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-[#081221] border border-slate-200 dark:border-[#1E3048]">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  resolvedTheme === 'light'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Terang</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  resolvedTheme === 'dark'
                    ? 'bg-[#15253F] text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Moon className="w-3 h-3 text-emerald-400" />
                <span>Gelap</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================ */}
      {/* FOOTER LOGIN */}
      {/* ============================================================ */}
      <footer className="w-full text-center text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs py-4 space-y-0.5">
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          SIMKA.ID Pro V1 &bull; Dikelola Oleh Bidang Akhlak dan Karakter
        </p>
        <p className="text-slate-400 dark:text-slate-500">
          Pesantren Nurul Islam Tengaran
        </p>
      </footer>
    </div>
  );
};
