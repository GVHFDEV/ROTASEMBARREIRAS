-- ============================================================
-- Rota sem Barreiras — INSERT policy for public.pontos (internal
-- cadastro tool at /admin/pontos)
-- ADDITIVE ONLY. Does NOT drop/reset anything from migrations.sql.
-- Safe to re-run (policy dropped-then-recreated by name).
--
-- SECURITY NOTE (please read before running in production):
-- This project has NO admin/role system (no `is_admin` column, no custom
-- claims). This policy allows ANY authenticated account — not just staff —
-- to insert rows into `pontos`, which is public, unauthenticated-readable
-- data shown to every visitor on the map. Before relying on this in
-- production, consider adding a real role check, e.g.:
--
--   alter table public.profiles add column is_admin boolean not null default false;
--   -- then change the USING/WITH CHECK below to also require:
--   -- exists (select 1 from public.profiles where id = auth.uid() and is_admin)
--
-- Until that exists, treat the /admin/pontos tool as internal-only and
-- keep its URL unlisted/unshared — RLS alone will NOT stop a logged-in
-- end user from calling this insert directly via the API.
-- ============================================================

drop policy if exists "pontos_insert_authenticated" on public.pontos;
create policy "pontos_insert_authenticated" on public.pontos
  for insert
  to authenticated
  with check (auth.uid() is not null);
