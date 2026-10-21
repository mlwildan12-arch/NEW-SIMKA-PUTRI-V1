-- ==============================================================================
-- SIMKA.ID PRO V1 - MIGRATION: TABEL NOTIFIKASI HIDDEN (ARSIP PEMBERITAHUAN)
-- File: /supabase/migrations/20261020_create_notifikasi_hidden.sql
-- Tanggal: 20 Oktober 2026
-- Idempotent & Aman: Menyimpan status pemberitahuan yang disembunyikan oleh Koordinator/Kasie
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifikasi_hidden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL,
  user_id TEXT,
  user_role TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifikasi_hidden_activity_id ON public.notifikasi_hidden(activity_id);
CREATE INDEX IF NOT EXISTS idx_notifikasi_hidden_unit ON public.notifikasi_hidden(unit);

-- RLS Policy: Mengizinkan SELECT & INSERT untuk anon
ALTER TABLE public.notifikasi_hidden ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Anon All notifikasi_hidden" ON public.notifikasi_hidden;
CREATE POLICY "Public Anon All notifikasi_hidden" ON public.notifikasi_hidden FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
