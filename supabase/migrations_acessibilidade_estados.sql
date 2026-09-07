-- ============================================================
-- Rota sem Barreiras — Avaliação de acessibilidade em três estados
-- ADDITIVE / TRANSFORMATIVE migration on public.pontos.
--
-- CORRECTED SCOPE: the three-state rating (tem / nao_tem / nao_verificado)
-- applies to the DETAIL ITEMS inside acessibilidade_detalhes (the bullet
-- list shown under the accessibility icons — e.g. "Rampa de acesso ao
-- mirante"), NOT to the four top-level summary flags (acessibilidade_rampa,
-- acessibilidade_audio, acessibilidade_braille, acessibilidade_libras).
-- Those four stay simple booleans (tem / não tem, shown as orange vs dull
-- gray chips) — a first version of this migration mistakenly converted
-- them to 3-state text; the block below reverts that if it was applied.
--
-- acessibilidade_detalhes changes from text[] (plain strings) to jsonb
-- (array of {"texto": "...", "estado": "tem" | "nao_tem" | "nao_verificado"}),
-- so each individual detail item can carry its own confirmation state.
--
-- Safe to re-run: every step guards its own existence/shape and is a
-- no-op the second time.
-- Run in Supabase SQL Editor, once, after migrations.sql has been applied.
-- ============================================================

-- ---------- Step 1: revert the 4 summary flags to boolean, if needed ----------
do $$
declare
  col text;
begin
  foreach col in array array[
    'acessibilidade_rampa',
    'acessibilidade_audio',
    'acessibilidade_braille',
    'acessibilidade_libras'
  ]
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'pontos'
        and column_name = col and data_type = 'text'
    ) then
      -- Drop the check constraint added by the earlier (incorrect) version
      -- of this migration, if present.
      execute format('alter table public.pontos drop constraint if exists %I', col || '_check');
      -- Must drop the old text default BEFORE changing the column type —
      -- otherwise Postgres tries to cast the default ('nao_verificado')
      -- to boolean along with the column and fails with 42804.
      execute format('alter table public.pontos alter column %I drop default', col);
      execute format(
        'alter table public.pontos alter column %I type boolean using (%I = ''tem'')',
        col, col
      );
      execute format('alter table public.pontos alter column %I set default false', col);
    end if;
  end loop;
end $$;

-- ---------- Step 2: acessibilidade_detalhes text[] -> jsonb ----------
-- Postgres rejects a correlated subquery (jsonb_agg(...) from unnest(...))
-- inside an ALTER COLUMN ... USING expression (error 0A000). Work around
-- it with the standard add-column / backfill / swap technique instead.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pontos'
      and column_name = 'acessibilidade_detalhes' and data_type = 'ARRAY'
  ) then
    alter table public.pontos add column acessibilidade_detalhes_new jsonb;

    update public.pontos
    set acessibilidade_detalhes_new = coalesce(
      (
        select jsonb_agg(jsonb_build_object('texto', item, 'estado', 'nao_verificado'))
        from unnest(acessibilidade_detalhes) as item
      ),
      '[]'::jsonb
    );

    alter table public.pontos alter column acessibilidade_detalhes_new set default '[]'::jsonb;
    alter table public.pontos alter column acessibilidade_detalhes_new set not null;

    alter table public.pontos drop column acessibilidade_detalhes;
    alter table public.pontos rename column acessibilidade_detalhes_new to acessibilidade_detalhes;
  end if;
end $$;
