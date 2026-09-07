-- ============================================================
-- Rota sem Barreiras — Sugestões de locais (feature "Sugerir um local")
-- ADDITIVE ONLY. Does NOT drop/reset anything from migrations.sql.
-- Safe to re-run: every statement guards its own existence.
-- Run in Supabase SQL Editor, once.
--
-- Design: this table is intentionally NOT readable by anon/authenticated
-- roles — no SELECT/INSERT/UPDATE/DELETE policy is created for those
-- roles at all, so RLS denies everything by default. It's an internal,
-- admin-curated backlog, not a public/social feature. All writes happen
-- through the `suggest_local` RPC below (SECURITY DEFINER, owned by the
-- table owner, so it bypasses RLS on purpose). Reading/managing entries
-- for triage happens via the Supabase Table Editor (dashboard bypasses
-- RLS) or a service_role key — never from the app's anon/authenticated
-- client.
-- ============================================================

create table if not exists public.sugestoes_locais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  latitude double precision not null,
  longitude double precision not null,
  -- Support/priority counter. Starts at 1 (the creator's own implicit
  -- support). Bumped instead of inserting a duplicate row when someone
  -- suggests a place that already exists nearby with a similar name.
  apoios integer not null default 1,
  -- Who suggested it. Kept for admin context; not exposed to other users
  -- (no read policy exists for this table at all).
  user_id uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists sugestoes_locais_geo_idx
  on public.sugestoes_locais (latitude, longitude);

alter table public.sugestoes_locais enable row level security;

-- No policies created on purpose: default-deny for anon + authenticated.
-- If a stale/looser policy exists from a previous run, drop it explicitly
-- so this table never accidentally becomes public/select-able.
drop policy if exists "sugestoes_locais_select_public" on public.sugestoes_locais;
drop policy if exists "sugestoes_locais_select_own" on public.sugestoes_locais;
drop policy if exists "sugestoes_locais_insert_own" on public.sugestoes_locais;

-- ------------------------------------------------------------
-- suggest_local(nome, endereco, latitude, longitude)
-- SECURITY DEFINER RPC — the only way the app writes to this table.
-- Requires a real authenticated account (auth.uid() must resolve), same
-- restriction PointDetails already applies to community reports (relatos)
-- — anonymous/guest sessions are blocked client-side (isAnonymous check)
-- and here server-side as a second line of defense.
--
-- Dedupe/prioritization: if an existing suggestion has a matching name
-- (case-insensitive, trimmed) within ~80m, its `apoios` counter is
-- incremented instead of inserting a duplicate row. Otherwise a new row
-- is inserted with apoios = 1.
-- ------------------------------------------------------------
create or replace function public.suggest_local(
  p_nome text,
  p_endereco text,
  p_latitude double precision,
  p_longitude double precision
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing_id uuid;
  v_apoios integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_nome is null or length(trim(p_nome)) = 0 then
    raise exception 'invalid_nome';
  end if;

  if p_latitude is null or p_longitude is null
     or p_latitude < -90 or p_latitude > 90
     or p_longitude < -180 or p_longitude > 180 then
    raise exception 'invalid_coords';
  end if;

  -- ~0.0008 degrees ≈ 80-90m at this latitude — tight enough to avoid
  -- merging genuinely different nearby places, loose enough to absorb
  -- GPS/geocoding jitter for the "same place" suggested twice.
  select id into v_existing_id
  from public.sugestoes_locais
  where lower(trim(nome)) = lower(trim(p_nome))
    and latitude between p_latitude - 0.0008 and p_latitude + 0.0008
    and longitude between p_longitude - 0.0008 and p_longitude + 0.0008
  order by criado_em asc
  limit 1;

  if v_existing_id is not null then
    update public.sugestoes_locais
      set apoios = apoios + 1
      where id = v_existing_id
      returning apoios into v_apoios;
    return jsonb_build_object('action', 'apoiado', 'apoios', v_apoios);
  end if;

  insert into public.sugestoes_locais (nome, endereco, latitude, longitude, apoios, user_id)
  values (trim(p_nome), p_endereco, p_latitude, p_longitude, 1, v_uid)
  returning apoios into v_apoios;

  return jsonb_build_object('action', 'criado', 'apoios', v_apoios);
end;
$$;

-- Only authenticated (real, non-guest) sessions may call this. Not granted
-- to anon or public.
revoke all on function public.suggest_local(text, text, double precision, double precision) from public;
grant execute on function public.suggest_local(text, text, double precision, double precision) to authenticated;
