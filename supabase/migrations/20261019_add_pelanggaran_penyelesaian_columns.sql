-- ==============================================================================
-- SIMKA.ID PRO V1 - MIGRATION: STATUS PENYELESAIAN & AUDIT TRAIL PELANGGARAN
-- File: /supabase/migrations/20261019_add_pelanggaran_penyelesaian_columns.sql
-- Tanggal: 19 Oktober 2026
-- Aman dijalankan berulang kali (Idempotent), tidak menghapus data historis
-- ==============================================================================

-- 1. PASTIKAN KOLOM STATUS PENYELESAIAN TERSEDIA DENGAN NILAI DEFAULT 'Belum Selesai'
ALTER TABLE public.pelanggaran 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Belum Selesai';

-- Tambahkan constraint check jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pelanggaran_status_check'
  ) THEN
    ALTER TABLE public.pelanggaran 
      ADD CONSTRAINT pelanggaran_status_check 
      CHECK (status IN ('Belum Selesai', 'Selesai'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TAMBAHKAN KOLOM AUDIT PENYELESAIAN (DISERLESAIKAN OLEH & WAKTU PENYELESAIAN)
ALTER TABLE public.pelanggaran 
  ADD COLUMN IF NOT EXISTS diselesaikan_oleh TEXT REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.pelanggaran 
  ADD COLUMN IF NOT EXISTS diselesaikan_pada TIMESTAMPTZ;

-- 3. INDEX UNTUK PERFORMA QUERY STATUS & FILTER REKAP/DASHBOARD
CREATE INDEX IF NOT EXISTS idx_pelanggaran_status ON public.pelanggaran(status);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_diselesaikan_oleh ON public.pelanggaran(diselesaikan_oleh);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_diselesaikan_pada ON public.pelanggaran(diselesaikan_pada DESC);

-- 4. REFRESH SCHEMA CACHE SUPABASE POSTGREST
NOTIFY pgrst, 'reload schema';
