-- ==============================================================================
-- SIMKA.ID PRO V1 - MIGRATION: REVISI KATEGORI POIN PELANGGARAN
-- Description: 
-- 1. Memperbarui kategori pada master_pelanggaran berdasarkan poin aktual:
--    - Ringan: 5–49 poin
--    - Sedang: 50–79 poin
--    - Berat: 80–94 poin
--    - Sangat Berat: 95–100+ poin
-- 2. Memperbarui check constraint jika ada
-- 3. Mempertahankan seluruh data relasi, ID, poin asli, dan integritas RLS
-- ==============================================================================

-- 1. Perbarui Kategori pada public.master_pelanggaran Berdasarkan Poin Aktual
UPDATE public.master_pelanggaran
SET kategori = CASE
  WHEN poin >= 95 THEN 'Sangat Berat'
  WHEN poin >= 80 THEN 'Berat'
  WHEN poin >= 50 THEN 'Sedang'
  ELSE 'Ringan'
END
WHERE poin IS NOT NULL;

-- 2. Pastikan CHECK constraint pada tabel master_pelanggaran mengizinkan kategori resmi
DO $$
BEGIN
  -- Drop constraint kategori lama jika ada agar aman dan idempotent
  ALTER TABLE public.master_pelanggaran DROP CONSTRAINT IF EXISTS master_pelanggaran_kategori_check;
  
  -- Tambahkan constraint kategori baru yang mencakup 4 kategori resmi dan kompatibilitas
  ALTER TABLE public.master_pelanggaran 
    ADD CONSTRAINT master_pelanggaran_kategori_check 
    CHECK (kategori IN ('Ringan', 'Sedang', 'Berat', 'Sangat Berat', 'Sangat Ringan'));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Lanjutkan jika constraint sudah ada atau struktur berbeda
END $$;

-- 3. Jika kolom kategori ada di tabel public.pelanggaran (transaksi historis), selaraskan berdasarkan poin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'pelanggaran' 
      AND column_name = 'kategori'
  ) THEN
    UPDATE public.pelanggaran
    SET kategori = CASE
      WHEN poin >= 95 THEN 'Sangat Berat'
      WHEN poin >= 80 THEN 'Berat'
      WHEN poin >= 50 THEN 'Sedang'
      ELSE 'Ringan'
    END
    WHERE poin IS NOT NULL;
  END IF;
END $$;

-- 4. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
