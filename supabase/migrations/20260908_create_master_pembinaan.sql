-- ==============================================================================
-- SIMKA.ID - MIGRATION: MASTER PEMBINAAN RESMI YAYASAN
-- Description: Menambahkan tabel master_pembinaan untuk menentukan rekomendasi
-- pembinaan berdasarkan POIN TUNGGAL pelanggaran (5-10, 11-20, 21-30, 31-34, 35-49, 50-69, 70-89, 90-99).
-- ==============================================================================

-- 1. Buat Tabel master_pembinaan jika belum ada (Safe & Idempotent)
CREATE TABLE IF NOT EXISTS public.master_pembinaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tingkat INTEGER NOT NULL UNIQUE,
    nama_tingkat VARCHAR(50) NOT NULL,
    min_poin INTEGER NOT NULL,
    max_poin INTEGER NOT NULL,
    jenis_pembinaan JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk pencarian dinamis berbasis rentang poin tunggal
CREATE INDEX IF NOT EXISTS idx_master_pembinaan_rentang 
ON public.master_pembinaan (min_poin, max_poin) 
WHERE is_active = true;

-- 2. Optional: Tambahkan kolom referensi pembinaan pada tabel transaksi pelanggaran jika ada
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'pelanggaran'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'pelanggaran' AND column_name = 'pembinaan_tingkat'
        ) THEN
            ALTER TABLE public.pelanggaran ADD COLUMN pembinaan_tingkat VARCHAR(50);
        END IF;

        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'pelanggaran' AND column_name = 'rekomendasi_pembinaan'
        ) THEN
            ALTER TABLE public.pelanggaran ADD COLUMN rekomendasi_pembinaan JSONB DEFAULT '[]'::jsonb;
        END IF;
    END IF;
END $$;

-- 3. Seed / Upsert Data 8 Level Pembinaan Resmi Sesuai Sheet Fiks Pembinaan
INSERT INTO public.master_pembinaan (tingkat, nama_tingkat, min_poin, max_poin, jenis_pembinaan, is_active)
VALUES
(
    1,
    'Level 1',
    5,
    10,
    '[
        "Membaca istighfar 33 kali",
        "Menyiram tanaman di sekitar sekolah/pesantren",
        "Menghafal mufradat dan menyetorkannya atau mengerjakan tugas tertulis terkait pelanggaran",
        "Tidak mengulangi kesalahan yang sama selama minimal 3 hari",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
),
(
    2,
    'Level 2',
    11,
    20,
    '[
        "Membaca istighfar 33 kali",
        "Menyiram tanaman di sekitar sekolah/pesantren",
        "Menghafal mufradat dan menyetorkannya atau mengerjakan tugas tertulis terkait pelanggaran",
        "Tidak mengulangi kesalahan yang sama selama minimal 3 hari",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
),
(
    3,
    'Level 3',
    21,
    30,
    '[
        "Membaca istighfar sehari 100 kali",
        "Menyapu dan mengepel lantai selama 1 hari",
        "Menghafal ayat/hadits atau mengerjakan tugas tertulis terkait pelanggaran",
        "Tidak mengulangi kesalahan serupa selama minimal 1 pekan",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
),
(
    4,
    'Level 4',
    31,
    34,
    '[
        "Membaca istighfar 300 kali sehari selama 3 hari",
        "Membersihkan kamar mandi selama 1 hari",
        "Menulis ulang dan menghafal ayat/hadits atau mengerjakan tugas praktik/tertulis terkait pelanggaran",
        "Meminta nasihat dan tanda tangan pihak yang ditentukan",
        "Tidak mengulangi kesalahan serupa selama minimal 4 pekan",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
),
(
    5,
    'Level 5',
    35,
    49,
    '[
        "Membaca istighfar 500 kali sehari selama 3 hari",
        "Membersihkan kamar mandi selama 3–7 hari",
        "Skorsing dengan syarat",
        "Qiyamullail tiga malam yang harus terkonfirmasi",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin minimal 3 hari kepada pihak yang ditentukan",
        "Meminta nasihat dan tanda tangan",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
),
(
    6,
    'Level 6',
    50,
    69,
    '[
        "Membaca istighfar 500 kali sehari selama 7 hari",
        "Membersihkan kamar mandi selama 5–9 hari",
        "Skorsing dengan syarat",
        "Qiyamullail satu pekan yang harus terkonfirmasi",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin minimal 5 hari kepada pihak yang ditentukan",
        "Meminta nasihat dan tanda tangan",
        "Larangan keluar area pondok sebanyak 1 kali sesuai ketentuan",
        "Gundul atau memakai pakaian pelanggaran",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
),
(
    7,
    'Level 7',
    70,
    89,
    '[
        "Membaca istighfar 300 kali per hari selama 10 hari",
        "Membersihkan kamar mandi selama 10–14 hari",
        "Skorsing dengan syarat",
        "Qiyamullail satu pekan yang harus terkonfirmasi",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin minimal 10 hari kepada pihak yang ditentukan",
        "Meminta nasihat dan tanda tangan",
        "Larangan keluar area pondok sebanyak 2 kali sesuai ketentuan",
        "Digundul atau memakai pakaian khusus pelanggaran",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
),
(
    8,
    'Level 8',
    90,
    99,
    '[
        "Membaca istighfar 300 kali per hari selama 14 hari",
        "Membersihkan kamar mandi selama 14 hari",
        "Skorsing tanpa syarat",
        "Qiyamullail satu pekan yang harus terkonfirmasi",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin minimal 14 hari kepada pihak yang ditentukan",
        "Meminta nasihat dan tanda tangan",
        "Larangan keluar area pondok sebanyak 3 kali sesuai ketentuan",
        "Digundul dan memakai pakaian khusus pelanggaran",
        "Dan/atau pembinaan lainnya sesuai keputusan pihak terkait"
    ]'::jsonb,
    true
)
ON CONFLICT (tingkat) DO UPDATE SET
    nama_tingkat = EXCLUDED.nama_tingkat,
    min_poin = EXCLUDED.min_poin,
    max_poin = EXCLUDED.max_poin,
    jenis_pembinaan = EXCLUDED.jenis_pembinaan,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Enable Row Level Security (RLS)
ALTER TABLE public.master_pembinaan ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coaching rules
DROP POLICY IF EXISTS "Allow read access to master_pembinaan" ON public.master_pembinaan;
CREATE POLICY "Allow read access to master_pembinaan" 
ON public.master_pembinaan 
FOR SELECT 
USING (true);
