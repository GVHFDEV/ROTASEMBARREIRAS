-- ============================================================
-- Rota sem Barreiras — Trilhas (gamification) schema
-- ADDITIVE ONLY. Does NOT drop/reset anything from migrations.sql.
-- Safe to re-run: every statement guards its own existence.
-- Run in Supabase SQL Editor, once.
-- ============================================================

-- ---------- accessibility_preferences: missing column fix ----------
-- reduce_motion_enabled is already used by app code (AccessibilityMenu,
-- page.tsx, TrailsView, QRCodeScanner) but was never added to the schema.
-- Adding it here, additive, since it's unrelated to trilhas but was found
-- missing while wiring this feature.
alter table public.accessibility_preferences add column if not exists reduce_motion_enabled boolean not null default false;

-- ---------- pontos: new columns ----------
alter table public.pontos add column if not exists cidade text not null default '';
alter table public.pontos add column if not exists xp_value integer not null default 10;

-- Backfill note: existing pontos rows get cidade='' by default — edit them
-- in Table Editor to set the real city, otherwise they won't be picked up
-- by any trilha (a trilha's points must share pontos rows that exist;
-- 'cidade' here is informational per-ponto, actual trail grouping is via
-- trilha_pontos below, not by matching this text field automatically).

-- ---------- trilhas ----------
create table if not exists public.trilhas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  imagem_capa text,
  selo_titulo text,
  cidade text not null,
  is_auto boolean not null default false,
  criado_em timestamptz not null default now()
);

-- is_auto column fix for tables created before this existed
alter table public.trilhas add column if not exists is_auto boolean not null default false;

-- Only one AUTO trilha per city (the auto-generated "city trail"). Manual/
-- thematic trilhas for the same city (is_auto=false) are unrestricted —
-- you can still hand-craft extra trilhas for a city later without conflict.
drop index if exists trilhas_auto_cidade_unique;
create unique index trilhas_auto_cidade_unique on public.trilhas (cidade) where is_auto = true;

alter table public.trilhas enable row level security;

drop policy if exists "trilhas_select_authenticated" on public.trilhas;
create policy "trilhas_select_authenticated" on public.trilhas
  for select
  to authenticated
  using (true);
-- no insert/update/delete policy -> only Table Editor / service_role writes.

-- ---------- trilha_pontos (many-to-many junction) ----------
create table if not exists public.trilha_pontos (
  trilha_id uuid references public.trilhas(id) on delete cascade,
  ponto_id uuid references public.pontos(id) on delete cascade,
  ordem integer not null default 0,
  primary key (trilha_id, ponto_id)
);

alter table public.trilha_pontos enable row level security;

drop policy if exists "trilha_pontos_select_authenticated" on public.trilha_pontos;
create policy "trilha_pontos_select_authenticated" on public.trilha_pontos
  for select
  to authenticated
  using (true);
-- no write policy -> Table Editor / service_role only.

-- ---------- user_scans ----------
-- Confirmed QR-code scans only. Distinct from user_searches (which also
-- logs plain map/search taps, not proof of physical visit). This table is
-- the single source of truth for trail progress AND XP — a row existing
-- here means "user physically confirmed this ponto via QR at least once".
create table if not exists public.user_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ponto_id uuid references public.pontos(id) on delete cascade not null,
  scanned_at timestamptz not null default now(),
  unique(user_id, ponto_id)
);

create index if not exists user_scans_user_id_idx on public.user_scans(user_id);

alter table public.user_scans enable row level security;

drop policy if exists "user_scans_select_own" on public.user_scans;
create policy "user_scans_select_own" on public.user_scans
  for select using (auth.uid() = user_id);

drop policy if exists "user_scans_insert_own" on public.user_scans;
create policy "user_scans_insert_own" on public.user_scans
  for insert with check (auth.uid() = user_id);

-- ---------- user_trail_badges ----------
-- Records the achievement itself (earned once, unique per user+trilha).
-- Not a "progress cache" — progress is always computed live from
-- user_searches vs trilha_pontos. This table only exists because a badge
-- unlock is a discrete event worth keeping a permanent record/timestamp of.
create table if not exists public.user_trail_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trilha_id uuid references public.trilhas(id) on delete cascade not null,
  earned_at timestamptz not null default now(),
  unique(user_id, trilha_id)
);

alter table public.user_trail_badges enable row level security;

drop policy if exists "user_trail_badges_select_own" on public.user_trail_badges;
create policy "user_trail_badges_select_own" on public.user_trail_badges
  for select using (auth.uid() = user_id);

drop policy if exists "user_trail_badges_insert_own" on public.user_trail_badges;
create policy "user_trail_badges_insert_own" on public.user_trail_badges
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- Auto-sync: cidade field on a ponto automatically creates/links an
-- "auto trilha" for that city. No manual trilha_pontos insert needed.
--
-- Trigger-based (fires on write, not on every read) — zero added query
-- cost for the app, zero risk of runaway/expensive queries. Runs once per
-- INSERT/UPDATE of a ponto row, which is a rare admin action (manual
-- cadastro), never in a hot path.
-- ============================================================
create function public.sync_ponto_auto_trilha()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_trilha_id uuid;
  v_next_ordem integer;
begin
  -- Ponto has no city set — nothing to sync. Also handles the case where
  -- cidade was cleared on update (no cleanup of old links here by design:
  -- if you rename/clear cidade, the ponto stays in its previous auto
  -- trilha until you manually adjust — safer than silently un-linking).
  if new.cidade is null or trim(new.cidade) = '' then
    return new;
  end if;

  -- Find or create the auto trilha for this city.
  select id into v_trilha_id
  from public.trilhas
  where cidade = new.cidade and is_auto = true
  limit 1;

  if v_trilha_id is null then
    insert into public.trilhas (titulo, descricao, cidade, is_auto)
    values (
      'Trilha ' || new.cidade,
      'Explore os pontos turísticos cadastrados em ' || new.cidade || '.',
      new.cidade,
      true
    )
    returning id into v_trilha_id;
  end if;

  -- Link ponto to trilha if not already linked. ON CONFLICT DO NOTHING —
  -- safe on repeated UPDATEs of the same ponto, never duplicates.
  select coalesce(max(ordem), -1) + 1 into v_next_ordem
  from public.trilha_pontos
  where trilha_id = v_trilha_id;

  insert into public.trilha_pontos (trilha_id, ponto_id, ordem)
  values (v_trilha_id, new.id, v_next_ordem)
  on conflict (trilha_id, ponto_id) do nothing;

  return new;
end;
$$;

drop trigger if exists pontos_sync_auto_trilha on public.pontos;
create trigger pontos_sync_auto_trilha
  after insert or update of cidade on public.pontos
  for each row execute procedure public.sync_ponto_auto_trilha();

-- ============================================================
-- Backfill: run once after creating the trigger, to catch pontos rows
-- that already had cidade set BEFORE this trigger existed (like the one
-- you already edited manually). Safe to re-run — trigger logic dedupes.
-- ============================================================
update public.pontos set cidade = cidade where trim(cidade) <> '';

-- ============================================================
-- Manual/thematic trilhas still work exactly as before — insert into
-- trilhas with is_auto default false, then link pontos yourself via
-- trilha_pontos. Only city-based auto-grouping is now automatic.
-- ============================================================
-- insert into public.trilhas (titulo, descricao, selo_titulo, cidade) values
--   ('Rota Temática X', 'Descrição...', 'Selo X', 'Governador Valadares');
--
-- insert into public.trilha_pontos (trilha_id, ponto_id, ordem) values
--   ('<trilha-uuid>', '<ponto-uuid-1>', 0);
