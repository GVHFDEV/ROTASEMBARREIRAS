-- ============================================================
-- Rota sem Barreiras — Painel admin (admin.rotasembarreiras.com.br)
-- ADDITIVE ONLY. Does NOT drop/reset anything from migrations.sql.
-- Safe to re-run: every statement guards its own existence, and
-- policies are dropped-then-recreated by name.
-- Run in Supabase SQL Editor, once.
--
-- Adds:
--   1. profiles.is_admin (boolean, default false) — real role flag,
--      replacing the "any authenticated user" caveat from
--      migrations_pontos_insert.sql.
--   2. is_admin() helper (SECURITY DEFINER, stable) — avoids RLS
--      recursion issues from querying profiles inside a profiles-
--      referencing policy, and keeps every policy below one-liner.
--   3. pontos: INSERT/UPDATE/DELETE restricted to admins only
--      (replaces the old "any authenticated" insert policy).
--   4. sugestoes_locais: SELECT/UPDATE/DELETE restricted to admins
--      only (INSERT stays RPC-only via suggest_local, unchanged).
-- ============================================================

-- ---------- 1. profiles.is_admin ----------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ---------- 1b. sugestoes_locais.status (approve/reject queue state) ----------
-- migrations_sugestoes.sql never added a status column — every suggestion
-- was implicitly "pending forever", triaged only via Table Editor. The
-- panel needs an explicit state to drive the approve/reject UI and to
-- stop showing already-handled rows in the queue.
alter table public.sugestoes_locais
  add column if not exists status text not null default 'pendente';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sugestoes_locais_status_check'
  ) then
    alter table public.sugestoes_locais
      add constraint sugestoes_locais_status_check
      check (status in ('pendente', 'aprovado', 'rejeitado'));
  end if;
end $$;

-- ---------- 2. is_admin() helper ----------
-- SECURITY DEFINER + stable: reads profiles bypassing RLS so policies
-- that call this function don't recurse into profiles' own RLS. Only
-- ever returns a boolean, never leaks row data.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- ---------- 3. pontos — admin-only writes ----------
-- Drops the old "any authenticated account can write" policy from
-- migrations_pontos_insert.sql — writes now require is_admin = true.
drop policy if exists "pontos_insert_authenticated" on public.pontos;

drop policy if exists "pontos_insert_admin" on public.pontos;
create policy "pontos_insert_admin" on public.pontos
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "pontos_update_admin" on public.pontos;
create policy "pontos_update_admin" on public.pontos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "pontos_delete_admin" on public.pontos;
create policy "pontos_delete_admin" on public.pontos
  for delete
  to authenticated
  using (public.is_admin());

-- pontos_select_public (anon + authenticated read) stays untouched —
-- the public map/search must keep working exactly as today.

-- ---------- 4. sugestoes_locais — admin triage queue ----------
-- INSERT remains RPC-only (suggest_local, SECURITY DEFINER) — regular
-- users still cannot read or write this table directly. Admins get a
-- read/update/delete path so the panel can list + approve/reject.
drop policy if exists "sugestoes_locais_select_admin" on public.sugestoes_locais;
create policy "sugestoes_locais_select_admin" on public.sugestoes_locais
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "sugestoes_locais_update_admin" on public.sugestoes_locais;
create policy "sugestoes_locais_update_admin" on public.sugestoes_locais
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "sugestoes_locais_delete_admin" on public.sugestoes_locais;
create policy "sugestoes_locais_delete_admin" on public.sugestoes_locais
  for delete
  to authenticated
  using (public.is_admin());

-- ---------- Granting yourself admin (run manually, once) ----------
-- Replace the email below and run separately after this migration:
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'seu-email@exemplo.com');
