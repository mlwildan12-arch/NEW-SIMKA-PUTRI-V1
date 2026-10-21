-- ====================================================================
-- SIMKA.ID - SKEMA DATABASE RESMI: AUTH, ROLES, UNITS & ISOLASI DATA
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABEL USERS (Custom simple login, NO Supabase Auth / NO Email OTP)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT 'usr-' || substr(md5(random()::text), 1, 8),
  nama TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MUSYRIF', 'KOORDINATOR', 'KASIE_KEPESANTRENAN')),
  unit TEXT NOT NULL CHECK (unit IN ('SMP', 'MA', 'SMA', 'ALL')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_unit_role ON public.users(unit, role);

-- 3. TABEL SANTRI
CREATE TABLE IF NOT EXISTS public.santri (
  id TEXT PRIMARY KEY DEFAULT 's-' || substr(md5(random()::text), 1, 8),
  kode_santri TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('SMP', 'MA', 'SMA')),
  musyrif_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  asrama TEXT,
  kamar TEXT,
  total_poin INTEGER NOT NULL DEFAULT 0,
  status_pembinaan TEXT DEFAULT 'Baik',
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_santri_unit ON public.santri(unit);
CREATE INDEX IF NOT EXISTS idx_santri_musyrif ON public.santri(musyrif_id);

-- 4. TABEL MASTER PELANGGARAN
CREATE TABLE IF NOT EXISTS public.master_pelanggaran (
  id TEXT PRIMARY KEY DEFAULT 'p-' || substr(md5(random()::text), 1, 8),
  kode TEXT NOT NULL UNIQUE,
  jenis TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('Ringan', 'Sedang', 'Berat')),
  poin INTEGER NOT NULL CHECK (poin > 0),
  konsekuensi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL PELANGGARAN / RIWAYAT
CREATE TABLE IF NOT EXISTS public.pelanggaran (
  id TEXT PRIMARY KEY DEFAULT 'log-' || substr(md5(random()::text), 1, 8),
  santri_id TEXT NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  santri_unit TEXT NOT NULL CHECK (santri_unit IN ('SMP', 'MA', 'SMA')),
  jenis_pelanggaran_id TEXT REFERENCES public.master_pelanggaran(id),
  jenis_pelanggaran_nama TEXT NOT NULL,
  poin INTEGER NOT NULL CHECK (poin > 0),
  hukuman TEXT,
  status TEXT NOT NULL DEFAULT 'Belum Selesai' CHECK (status IN ('Belum Selesai', 'Selesai')),
  catatan TEXT,
  pencatat_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  pencatat_nama TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri ON public.pelanggaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_unit ON public.pelanggaran(santri_unit);

-- ====================================================================
-- FUNGSI DATABASE & KEAMANAN (RPC)
-- ====================================================================

-- Salt secret for password hash
-- SHA-256 with salt: encode(digest(p_password || 'simka_secure_salt_v2_2026', 'sha256'), 'hex')

-- 1. RPC: login_user
-- Memverifikasi kredensial dan mengembalikan payload user TANPA password_hash
CREATE OR REPLACE FUNCTION public.login_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_calculated_hash TEXT;
BEGIN
  -- Compute hash
  v_calculated_hash := encode(digest(p_password || 'simka_secure_salt_v2_2026', 'sha256'), 'hex');

  -- Cari user aktif
  SELECT id, nama, username, role, unit, is_active, email, title, password_hash
  INTO v_user
  FROM public.users
  WHERE LOWER(username) = LOWER(p_username);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Username atau password salah.');
  END IF;

  IF NOT v_user.is_active THEN
    RETURN json_build_object('success', false, 'message', 'Akun ini telah dinonaktifkan. Hubungi Kasie Kepesantrenan.');
  END IF;

  -- Cek kecocokan password hash (atau fallback development hash)
  IF v_user.password_hash != v_calculated_hash AND v_user.password_hash != ('sh256_' || abs(hashtext(p_password || 'simka_secure_salt_v2_2026')) || '_simka') THEN
    RETURN json_build_object('success', false, 'message', 'Username atau password salah.');
  END IF;

  -- Sukses: Kembalikan data user aman
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'nama', v_user.nama,
      'username', v_user.username,
      'role', v_user.role,
      'unit', v_user.unit,
      'is_active', v_user.is_active,
      'email', v_user.email,
      'title', v_user.title
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC: record_pelanggaran_secure
-- Memvalidasi hak akses unit sebelum menyimpan pelanggaran
CREATE OR REPLACE FUNCTION public.record_pelanggaran_secure(
  p_user_id TEXT,
  p_santri_id TEXT,
  p_jenis_pelanggaran_id TEXT,
  p_jenis_nama TEXT,
  p_poin INTEGER,
  p_hukuman TEXT,
  p_catatan TEXT
)
RETURNS JSON AS $$
DECLARE
  v_actor RECORD;
  v_santri RECORD;
  v_new_log_id TEXT;
  v_new_total INTEGER;
BEGIN
  -- Ambil data aktor pencatat
  SELECT * INTO v_actor FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User pencatat tidak valid atau tidak ditemukan.';
  END IF;

  -- Ambil data santri
  SELECT * INTO v_santri FROM public.santri WHERE id = p_santri_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data santri tidak ditemukan.';
  END IF;

  -- VALIDASI ISOLASI UNIT DI TINGKAT DATABASE
  -- Jika bukan Superadmin (KASIE_KEPESANTRENAN), unit santri WAJIB SAMA dengan unit user!
  IF v_actor.role != 'KASIE_KEPESANTRENAN' AND v_actor.unit != v_santri.unit THEN
    RAISE EXCEPTION 'Akses Ditolak: Anda (Unit %) tidak diizinkan mencatat pelanggaran santri Unit %!', v_actor.unit, v_santri.unit;
  END IF;

  -- Simpan log pelanggaran
  v_new_log_id := 'log-' || substr(md5(random()::text), 1, 8);
  INSERT INTO public.pelanggaran (
    id,
    santri_id,
    santri_unit,
    jenis_pelanggaran_id,
    jenis_pelanggaran_nama,
    poin,
    hukuman,
    status,
    catatan,
    pencatat_id,
    pencatat_nama
  ) VALUES (
    v_new_log_id,
    v_santri.id,
    v_santri.unit,
    p_jenis_pelanggaran_id,
    p_jenis_nama,
    p_poin,
    p_hukuman,
    'Belum Selesai',
    p_catatan,
    v_actor.id,
    v_actor.nama
  );

  -- Update akumulasi total poin santri
  v_new_total := v_santri.total_poin + p_poin;
  UPDATE public.santri
  SET total_poin = v_new_total,
      updated_at = NOW()
  WHERE id = v_santri.id;

  RETURN json_build_object(
    'success', true,
    'log_id', v_new_log_id,
    'santri_total_poin', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- SEED DATA AWAL (USERS, SANTRI & HAK AKSES)
-- ====================================================================

-- 1. Seed Default Users
INSERT INTO public.users (id, nama, username, password_hash, role, unit, is_active, email, title)
VALUES
  -- Kasie / Superadmin (Password: admin123)
  ('usr-kasie-01', 'KH. Abdullah Syukri, M.Ag', 'kasie', encode(digest('admin123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'KASIE_KEPESANTRENAN', 'ALL', true, 'kasie@simka.id', 'Kepala Seksi Kepesantrenan & Kedisiplinan Yayasan'),
  -- Unit SMP (Password: smp123)
  ('usr-koor-smp', 'Ust. Hamzah As-Suyuthi, S.Pd.I', 'koor.smp', encode(digest('smp123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'KOORDINATOR', 'SMP', true, 'koor.smp@simka.id', 'Koordinator Kedisiplinan Unit SMP'),
  ('usr-musy-smp1', 'Ust. Salman Al-Farisi', 'musyrif.smp1', encode(digest('smp123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'MUSYRIF', 'SMP', true, 'salman.smp@simka.id', 'Musyrif Asrama SMP (Kelas 7 & 8)'),
  ('usr-musy-smp2', 'Ust. Bilal bin Rabah', 'musyrif.smp2', encode(digest('smp123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'MUSYRIF', 'SMP', true, 'bilal.smp@simka.id', 'Musyrif Asrama SMP (Kelas 9)'),
  -- Unit MA (Password: ma123)
  ('usr-koor-ma', 'Ust. Wildan Fanani, Lc', 'koor.ma', encode(digest('ma123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'KOORDINATOR', 'MA', true, 'wildan.fanani@simka.id', 'Koordinator Pembinaan Karakter & Akhlak Santri MA'),
  ('usr-musy-ma1', 'Ust. Ahmad Fauzan, S.Pd', 'musyrif.ma1', encode(digest('ma123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'MUSYRIF', 'MA', true, 'ahmad.fauzan@simka.id', 'Musyrif Asrama MA (Kelas 10)'),
  ('usr-musy-ma2', 'Ust. Ridwan Kamil, Lc', 'musyrif.ma2', encode(digest('ma123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'MUSYRIF', 'MA', true, 'ridwan.kamil@simka.id', 'Musyrif Asrama MA (Kelas 11 & 12)'),
  -- Unit SMA (Password: sma123)
  ('usr-koor-sma', 'Ust. Dr. Fathurrahman, M.Pd', 'koor.sma', encode(digest('sma123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'KOORDINATOR', 'SMA', true, 'koor.sma@simka.id', 'Koordinator Kedisiplinan Unit SMA'),
  ('usr-musy-sma1', 'Ust. Tariq bin Ziyad', 'musyrif.sma1', encode(digest('sma123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'MUSYRIF', 'SMA', true, 'tariq.sma@simka.id', 'Musyrif Asrama SMA (Kelas X)'),
  ('usr-musy-sma2', 'Ust. Khalid bin Walid', 'musyrif.sma2', encode(digest('sma123simka_secure_salt_v2_2026', 'sha256'), 'hex'), 'MUSYRIF', 'SMA', true, 'khalid.sma@simka.id', 'Musyrif Asrama SMA (Kelas XI & XII)')
ON CONFLICT (username) DO NOTHING;
