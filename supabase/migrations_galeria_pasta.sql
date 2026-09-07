-- ============================================================
-- Rota sem Barreiras — Coluna de pasta de imagens (galeria completa)
-- ADDITIVE ONLY. Does NOT drop/reset anything from migrations.sql.
-- Safe to re-run (guarded by information_schema check).
-- Run in Supabase SQL Editor, once.
--
-- Why: Storage folder names under `pontos-imagens/` are manually chosen
-- short slugs (see docs/SUPABASE_PONTOS_SETUP.md), NOT the point's uuid
-- `id`. To list "all images in that point's folder" in-app (feature:
-- galeria de fotos), the app needs to know which folder belongs to which
-- point. This column stores that mapping explicitly instead of guessing.
-- Falls back to `qr_code_value` when null, since most existing points
-- already use a matching short slug there (e.g. "rota-ibituruna").
-- ============================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pontos' and column_name = 'pasta_imagens'
  ) then
    alter table public.pontos add column pasta_imagens text;
  end if;
end $$;
