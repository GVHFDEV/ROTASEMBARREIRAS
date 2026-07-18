-- ============================================================
-- Rota sem Barreiras — Supabase schema + RLS
-- Run in Supabase SQL Editor, in order, once, on a fresh project.
-- Safe to re-run: RESET block below drops everything this script
-- creates first, so partial/previous runs don't cause "already
-- exists" errors. Fine for dev setup — do NOT run this reset block
-- against a project with real user data, it deletes it.
-- Password hashing: handled internally by Supabase Auth (GoTrue,
-- bcrypt). App code never touches raw or hashed passwords — do NOT
-- build custom password columns/logic.
-- ============================================================

-- ---------- RESET (drop if exists, children before parents) ----------
-- Note: trigger on public.pontos is NOT dropped explicitly here —
-- "drop trigger ... on public.pontos" errors if pontos doesn't exist
-- yet (IF EXISTS only covers the trigger name, not the table). The
-- "drop table public.pontos cascade" below removes its trigger too.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.set_atualizado_em();
drop table if exists public.user_favorites cascade;
drop table if exists public.user_searches cascade;
drop table if exists public.pontos cascade;
drop table if exists public.accessibility_preferences cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tourist_points cascade; -- old table name from earlier schema version, if present

-- ---------- profiles (1:1 w/ auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- auto-create profile row on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  insert into public.accessibility_preferences (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- pontos — tourist points table
-- Manually populated by admin via Supabase Table Editor.
-- RLS: authenticated users can READ. No insert/update/delete
-- policy exists for regular roles -> anon/authenticated cannot
-- write. Dashboard Table Editor writes bypass RLS (runs as
-- superuser), so manual cadastro still works fine.
-- ============================================================
create table public.pontos (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  categoria text not null,

  -- map coordinates
  latitude double precision not null,
  longitude double precision not null,

  endereco text,

  -- short = card/preview text, long = full detail-screen text
  descricao_curta text,
  descricao_longa text,

  -- cover image + gallery (Storage public URLs)
  imagem_capa text,
  galeria_imagens text[] not null default '{}',

  -- accessibility flags
  acessibilidade_rampa boolean not null default false,
  acessibilidade_audio boolean not null default false,
  acessibilidade_braille boolean not null default false,
  acessibilidade_libras boolean not null default false,
  acessibilidade_detalhes text[] not null default '{}',

  -- accessibility media (Storage public URLs)
  audio_url text,
  audiodescricao_url text,
  video_libras_url text,

  qr_code_value text unique,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.pontos enable row level security;

create policy "pontos_select_authenticated" on public.pontos
  for select
  to authenticated
  using (true);
-- no insert/update/delete policy -> regular users (anon + authenticated) blocked from writing.

-- keep atualizado_em fresh on manual edits
create function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger pontos_set_atualizado_em
  before update on public.pontos
  for each row execute procedure public.set_atualizado_em();

-- Explicit named UNIQUE constraint on qr_code_value. Column already
-- declares "unique" inline above, but this block is here in case
-- you're applying this against an existing pontos table that was
-- created without it (e.g. edited manually in dashboard) — safe to
-- run repeatedly, skips if constraint with this name already exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pontos_qr_code_value_key'
  ) then
    alter table public.pontos
      add constraint pontos_qr_code_value_key unique (qr_code_value);
  end if;
end $$;

-- ---------- user_searches (history) ----------
create table public.user_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  point_id uuid references public.pontos(id) on delete cascade not null,
  searched_at timestamptz default now()
);

create index user_searches_user_id_idx on public.user_searches(user_id, searched_at desc);

alter table public.user_searches enable row level security;

create policy "user_searches_select_own" on public.user_searches
  for select using (auth.uid() = user_id);

create policy "user_searches_insert_own" on public.user_searches
  for insert with check (auth.uid() = user_id);

create policy "user_searches_delete_own" on public.user_searches
  for delete using (auth.uid() = user_id);

-- ---------- user_favorites ----------
create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  point_id uuid references public.pontos(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, point_id)
);

alter table public.user_favorites enable row level security;

create policy "user_favorites_all_own" on public.user_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- accessibility_preferences ----------
create table public.accessibility_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  audio_enabled boolean default true,
  libras_enabled boolean default false,
  high_contrast_enabled boolean default false,
  updated_at timestamptz default now()
);

alter table public.accessibility_preferences enable row level security;

create policy "accessibility_prefs_all_own" on public.accessibility_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Rate limiting: Supabase Auth has built-in rate limits per IP/email
-- for signup, login, password-reset, OTP (fixed server-side, not
-- configurable via SQL). For extra protection on custom endpoints
-- (none needed here — using client SDK direct to Auth/PostgREST),
-- add Cloudflare/Vercel edge rate limiting if abuse observed.
-- ============================================================

-- ============================================================
-- Reference only — do NOT run. Shows expected column shape for
-- one manually-inserted row. Real cadastro happens via Table Editor.
-- ============================================================
-- insert into public.pontos (
--   nome, categoria, latitude, longitude, endereco,
--   descricao_curta, descricao_longa, imagem_capa, galeria_imagens,
--   acessibilidade_rampa, acessibilidade_audio, acessibilidade_braille, acessibilidade_libras,
--   acessibilidade_detalhes, audio_url, audiodescricao_url, video_libras_url, qr_code_value
-- ) values (
--   'Pico da Ibituruna', 'Natureza & Aventura', -18.8872, -41.9161,
--   'Estrada de Acesso ao Pico, Governador Valadares - MG',
--   'Vista deslumbrante do Rio Doce a 1.123m de altitude.',
--   'A palavra Ibituruna vem do tupi-guarani e significa serra negra...',
--   'https://<project>.supabase.co/storage/v1/object/public/pontos-imagens/ibituruna/capa.jpg',
--   array['https://.../galeria1.jpg', 'https://.../galeria2.jpg'],
--   true, true, true, false,
--   array['Rampa de acesso ao mirante', 'Banheiros adaptados'],
--   'https://.../audio.mp3', 'https://.../audiodescricao.mp3', null,
--   'rota-ibituruna'
-- );
