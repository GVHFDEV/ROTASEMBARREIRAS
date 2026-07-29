-- ============================================================
-- Rota sem Barreiras — Relatos de condição em tempo real
-- ADDITIVE ONLY. Does NOT drop/reset anything from migrations.sql.
-- Safe to re-run: every statement guards its own existence.
-- Run in Supabase SQL Editor, once.
-- ============================================================

-- ---------- relatos_pontos ----------
-- Community-driven, real-time "condition" signal per point. A point is
-- considered "active" (has a recent unresolved problem) when, in the last
-- 14 days, problem reports outnumber ok reports. Computed at query time
-- (no scheduled job). Rate limit: 1 relato per user per point per 7 days,
-- enforced by the INSERT policy below (works for both anon and authenticated).
create table if not exists public.relatos_pontos (
  id uuid primary key default gen_random_uuid(),
  ponto_id uuid not null references public.pontos(id) on delete cascade,
  -- No FK to auth.users: anonymous guests use a localStorage guest id
  -- ("guest_xxx") that does not exist in auth.users. RLS is what limits abuse.
  user_id uuid,
  guest_id text,                         -- fallback when user is anonymous
  tipo text not null check (tipo in ('ok', 'problema')),
  texto text,
  criado_em timestamptz not null default now()
);

create index if not exists relatos_pontos_ponto_idx
  on public.relatos_pontos (ponto_id, criado_em desc);

alter table public.relatos_pontos enable row level security;

-- Public read: the indicator must be visible to everyone (even guests).
drop policy if exists "relatos_select_public" on public.relatos_pontos;
create policy "relatos_select_public" on public.relatos_pontos
  for select
  to anon, authenticated
  using (true);

-- Insert: APENAS usuários autenticados (sem anônimos). user_id é preenchido
-- automaticamente com auth.uid() (o cliente não precisa enviar) e o rate
-- limit de 7 dias é enforced aqui.
drop policy if exists "relatos_insert_rate" on public.relatos_pontos;
create policy "relatos_insert_rate" on public.relatos_pontos
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and not exists (
      select 1
      from public.relatos_pontos r
      where r.ponto_id = relatos_pontos.ponto_id
        and r.user_id = auth.uid()
        and r.criado_em > now() - interval '7 days'
    )
  );

-- Garante que user_id seja sempre o auth.uid() e que exista um profile
-- (para que o nome/foto do relator resolvam mesmo para quem não passou
-- pelo signup normal — ex.: upgrade de conta anônima).
create or replace function public.ensure_relato_identity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.user_id := auth.uid();
  insert into public.profiles (id, full_name)
  values (new.user_id, coalesce(
    (select raw_user_meta_data->>'full_name' from auth.users where id = new.user_id),
    split_part((select email from auth.users where id = new.user_id), '@', 1)
  ))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_relato_insert on public.relatos_pontos;
create trigger on_relato_insert
  before insert on public.relatos_pontos
  for each row execute procedure public.ensure_relato_identity();

-- Backfill: cria profile para qualquer user_id de relato que ainda não tenha.
insert into public.profiles (id, full_name)
select distinct r.user_id, split_part(u.email, '@', 1)
from public.relatos_pontos r
join auth.users u on u.id = r.user_id
where r.user_id is not null
on conflict (id) do nothing;

-- No update/delete policy -> relatos are immutable (append-only).

-- ---------- public read of profiles (name + avatar only) ----------
-- Relatos show the reporter's name + photo. The default profiles policy only
-- lets each user read their own row. This ADDS a read-only policy exposing
-- full_name + avatar_url publicly. It does NOT weaken write rules (update/
-- insert still restricted to the owner) and only adds SELECT.
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select
  to anon, authenticated
  using (true);
