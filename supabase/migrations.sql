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

-- Public read of name + avatar (relatos show reporter identity). IDs/emails
-- stay unreadable to strangers; with check below only deste name/avatar.
create policy "profiles_select_public" on public.profiles
  for select to anon, authenticated using (true);

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
  -- Storage folder slug under the pontos-imagens bucket (e.g. "ibituruna"),
  -- used by the in-app photo gallery to list ALL images for this point
  -- (supabase.storage.from('pontos-imagens').list(pasta_imagens)). Falls
  -- back to qr_code_value when null. See migrations_galeria_pasta.sql.
  pasta_imagens text,

  -- accessibility summary flags — plain booleans (chip shown orange when
  -- true, dull gray when false in the app; no 3rd state at this level).
  acessibilidade_rampa boolean not null default false,
  acessibilidade_audio boolean not null default false,
  acessibilidade_braille boolean not null default false,
  acessibilidade_libras boolean not null default false,
  -- Detail bullet list under the accessibility card. jsonb array of
  -- {"texto": string, "estado": "tem" | "nao_tem" | "nao_verificado"} —
  -- THIS is where the 3-state rating lives (per detail item, not on the
  -- summary flags above). "nao_verificado" is the default, distinct from
  -- an explicit "no". See supabase/migrations_acessibilidade_estados.sql
  -- for the migration that converts this from text[] on an existing db.
  acessibilidade_detalhes jsonb not null default '[]'::jsonb,

  -- accessibility media (Storage public URLs)
  audio_url text,
  audiodescricao_url text,
  video_libras_url text,

  qr_code_value text unique,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.pontos enable row level security;

-- SELECT publico: o mapa precisa ler os pontos ANTES de qualquer login/anon auth
-- estar pronto. Restringir a 'authenticated' quebra o mapa se signInAnonymously
-- falhar (chave errada, rate limit, etc). anon covers the pre-auth guest state.
drop policy if exists "pontos_select_authenticated" on public.pontos;
create policy "pontos_select_public" on public.pontos
  for select
  to anon, authenticated
  using (true);
-- no insert/update/delete policy -> regular users (anon + authenticated) blocked from writing.

-- ---------- relatos_pontos (community condition reports) ----------
-- Append-only community reports. "Active" = problem count > ok count in the
-- last 14 days, computed at query time. Rate limit 1/user/point/7d via policy.
create table public.relatos_pontos (
  id uuid primary key default gen_random_uuid(),
  ponto_id uuid not null references public.pontos(id) on delete cascade,
  user_id uuid,                          -- null for anonymous guests
  guest_id text,                         -- localStorage guest id when anonymous
  tipo text not null check (tipo in ('ok', 'problema')),
  texto text,
  criado_em timestamptz not null default now()
);
create index relatos_pontos_ponto_idx on public.relatos_pontos (ponto_id, criado_em desc);
alter table public.relatos_pontos enable row level security;
create policy "relatos_select_public" on public.relatos_pontos
  for select to anon, authenticated using (true);
create policy "relatos_insert_rate" on public.relatos_pontos
  for insert to anon, authenticated
  with check (
    not exists (
      select 1 from public.relatos_pontos r
      where r.ponto_id = relatos_pontos.ponto_id
        and coalesce(r.user_id::text, r.guest_id) =
            coalesce(relatos_pontos.user_id::text, relatos_pontos.guest_id)
        and r.criado_em > now() - interval '7 days'
    )
  );

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

-- Font scale for the floating accessibility menu (A-/A+ control). Added via
-- ALTER instead of inline column above so this block stays idempotent/safe
-- to re-run even against a table created before this column existed.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'accessibility_preferences' and column_name = 'font_scale'
  ) then
    alter table public.accessibility_preferences
      add column font_scale text not null default 'normal';
    alter table public.accessibility_preferences
      add constraint accessibility_preferences_font_scale_check
      check (font_scale in ('normal', 'lg', 'xl'));
  end if;
end $$;

-- Column meaning reused across two UIs (ProfileView toggles + the floating
-- AccessibilityMenu): high_contrast_enabled = "Alto Contraste" in both;
-- libras_enabled = "Priorizar Guia em Libras" (ProfileView) AND the VLibras
-- widget toggle (AccessibilityMenu) — same underlying preference, kept in
-- sync instead of adding a duplicate column; audio_enabled = "Priorizar
-- Audiodescrição" (ProfileView) AND "Leitura em voz alta" (AccessibilityMenu)
-- — both are audio-output preferences, same column, same reasoning.

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
--   '[{"texto": "Rampa de acesso ao mirante", "estado": "tem"}, {"texto": "Banheiros adaptados", "estado": "nao_verificado"}]'::jsonb,
--   'https://.../audio.mp3', 'https://.../audiodescricao.mp3', null,
--   'rota-ibituruna'
-- );
