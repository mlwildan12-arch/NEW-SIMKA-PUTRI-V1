-- ==============================================================================
-- SIMKA.ID PRO V1 - MIGRATION: FIX PELANGGARAN RELATIONS & SUPERADMIN DELETE USER
-- File: /supabase/migrations/20261011_fix_pelanggaran_relations_and_delete_user.sql
-- Tanggal: 11 Oktober 2026
-- Aman dijalankan berulang kali (Idempotent), tidak menghapus data historis
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABEL USERS & KEBIJAKAN RLS UNTUK PENGHAPUSAN USER OLEH SUPERADMIN
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

-- Pastikan RLS aktif dan mengizinkan operasi SELECT, INSERT, UPDATE, DELETE penuh untuk anon
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Anon All users" ON public.users;
CREATE POLICY "Public Anon All users" ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. TABEL MASTER PELANGGARAN: DUKUNGAN NAMA/JENIS DAN HUKUMAN/KONSEKUENSI
CREATE TABLE IF NOT EXISTS public.master_pelanggaran (
  id TEXT PRIMARY KEY DEFAULT 'p-' || substr(md5(random()::text), 1, 8),
  kode TEXT NOT NULL UNIQUE,
  jenis TEXT,
  nama TEXT,
  kategori TEXT NOT NULL DEFAULT 'Ringan' CHECK (kategori IN ('Ringan', 'Sedang', 'Berat', 'Sangat Ringan', 'Sangat Berat')),
  poin INTEGER NOT NULL DEFAULT 5 CHECK (poin > 0),
  konsekuensi TEXT,
  hukuman TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom alias jika belum ada
ALTER TABLE public.master_pelanggaran ADD COLUMN IF NOT EXISTS nama TEXT;
ALTER TABLE public.master_pelanggaran ADD COLUMN IF NOT EXISTS jenis TEXT;
ALTER TABLE public.master_pelanggaran ADD COLUMN IF NOT EXISTS hukuman TEXT;
ALTER TABLE public.master_pelanggaran ADD COLUMN IF NOT EXISTS konsekuensi TEXT;

-- Sinkronkan alias data master
UPDATE public.master_pelanggaran SET nama = jenis WHERE nama IS NULL AND jenis IS NOT NULL;
UPDATE public.master_pelanggaran SET jenis = nama WHERE jenis IS NULL AND nama IS NOT NULL;
UPDATE public.master_pelanggaran SET hukuman = konsekuensi WHERE hukuman IS NULL AND konsekuensi IS NOT NULL;
UPDATE public.master_pelanggaran SET konsekuensi = hukuman WHERE konsekuensi IS NULL AND hukuman IS NOT NULL;

ALTER TABLE public.master_pelanggaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Anon All master_pelanggaran" ON public.master_pelanggaran;
CREATE POLICY "Public Anon All master_pelanggaran" ON public.master_pelanggaran FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. TABEL PELANGGARAN: RELASI LENGKAP KE SANTRI, MASTER PELANGGARAN, & USERS
CREATE TABLE IF NOT EXISTS public.pelanggaran (
  id TEXT PRIMARY KEY DEFAULT 'log-' || substr(md5(random()::text), 1, 8),
  santri_id TEXT NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  santri_unit TEXT NOT NULL CHECK (santri_unit IN ('SMP', 'MA', 'SMA')),
  pelanggaran_id TEXT REFERENCES public.master_pelanggaran(id) ON DELETE SET NULL,
  jenis_pelanggaran_id TEXT REFERENCES public.master_pelanggaran(id) ON DELETE SET NULL,
  jenis_pelanggaran_nama TEXT,
  tanggal_waktu TIMESTAMPTZ DEFAULT NOW(),
  poin INTEGER NOT NULL DEFAULT 5 CHECK (poin > 0),
  hukuman TEXT,
  status TEXT NOT NULL DEFAULT 'Belum Selesai' CHECK (status IN ('Belum Selesai', 'Selesai')),
  catatan TEXT,
  dicatat_oleh TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  pencatat_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  pencatat_nama TEXT,
  santri_nama TEXT,
  santri_kelas TEXT,
  pembinaan_tingkat VARCHAR(50),
  rekomendasi_pembinaan JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom relasi dan snapshot tersedia di tabel pelanggaran
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS pelanggaran_id TEXT REFERENCES public.master_pelanggaran(id) ON DELETE SET NULL;
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS jenis_pelanggaran_id TEXT REFERENCES public.master_pelanggaran(id) ON DELETE SET NULL;
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS jenis_pelanggaran_nama TEXT;
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS tanggal_waktu TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS dicatat_oleh TEXT REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS pencatat_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS pencatat_nama TEXT;
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS santri_nama TEXT;
ALTER TABLE public.pelanggaran ADD COLUMN IF NOT EXISTS santri_kelas TEXT;

-- 5. SINKRONISASI RELASI DAN PERBAIKAN DATA HISTORIS YANG HILANG / DUMMY
-- A. Hubungkan pelanggaran_id dan jenis_pelanggaran_id
UPDATE public.pelanggaran
SET pelanggaran_id = jenis_pelanggaran_id
WHERE pelanggaran_id IS NULL AND jenis_pelanggaran_id IS NOT NULL;

UPDATE public.pelanggaran
SET jenis_pelanggaran_id = pelanggaran_id
WHERE jenis_pelanggaran_id IS NULL AND pelanggaran_id IS NOT NULL;

-- B. Hubungkan pencatat_id dan dicatat_oleh
UPDATE public.pelanggaran
SET dicatat_oleh = pencatat_id
WHERE dicatat_oleh IS NULL AND pencatat_id IS NOT NULL;

UPDATE public.pelanggaran
SET pencatat_id = dicatat_oleh
WHERE pencatat_id IS NULL AND dicatat_oleh IS NOT NULL;

-- C. Hubungkan tanggal_waktu dengan created_at
UPDATE public.pelanggaran
SET tanggal_waktu = created_at
WHERE tanggal_waktu IS NULL;

-- D. Perbaiki nama santri & kelas asli dari tabel public.santri
UPDATE public.pelanggaran p
SET 
  santri_nama = s.nama,
  santri_kelas = s.kelas,
  santri_unit = s.unit
FROM public.santri s
WHERE p.santri_id = s.id
  AND (p.santri_nama IS NULL OR p.santri_nama = 'Santri' OR p.santri_nama = '-' OR p.santri_nama = '');

-- E. Perbaiki jenis pelanggaran & poin asli dari tabel public.master_pelanggaran
UPDATE public.pelanggaran p
SET 
  jenis_pelanggaran_nama = COALESCE(m.nama, m.jenis),
  hukuman = COALESCE(p.hukuman, m.hukuman, m.konsekuensi, '-')
FROM public.master_pelanggaran m
WHERE (p.pelanggaran_id = m.id OR p.jenis_pelanggaran_id = m.id)
  AND (p.jenis_pelanggaran_nama IS NULL OR p.jenis_pelanggaran_nama LIKE '%Tata Tertib%' OR p.jenis_pelanggaran_nama = 'Pelanggaran' OR p.jenis_pelanggaran_nama = '-');

-- F. Perbaiki nama pelapor dari public.users
UPDATE public.pelanggaran p
SET pencatat_nama = u.nama
FROM public.users u
WHERE (p.dicatat_oleh = u.id OR p.pencatat_id = u.id)
  AND (p.pencatat_nama IS NULL OR p.pencatat_nama = 'Petugas' OR p.pencatat_nama = '-');

-- 6. INDEX OPTIMASI UNTUK PERFORMA QUERY CEPAT
CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri_id ON public.pelanggaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_pelanggaran_id ON public.pelanggaran(pelanggaran_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_jenis_pelanggaran_id ON public.pelanggaran(jenis_pelanggaran_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_dicatat_oleh ON public.pelanggaran(dicatat_oleh);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_tanggal_waktu ON public.pelanggaran(tanggal_waktu DESC);

-- 7. KEBIJAKAN RLS PELANGGARAN
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Anon All pelanggaran" ON public.pelanggaran;
CREATE POLICY "Public Anon All pelanggaran" ON public.pelanggaran FOR ALL TO anon USING (true) WITH CHECK (true);

-- 8. REFRESH SCHEMA CACHE SUPABASE POSTGREST
NOTIFY pgrst, 'reload schema';

-- Selesai! Skema relasi dan izin delete user telah terpasang dengan sempurna.
