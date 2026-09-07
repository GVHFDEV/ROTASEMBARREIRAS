-- ============================================================
-- Rota sem Barreiras — Storage RLS for the `pontos-imagens` bucket
-- ADDITIVE ONLY. Does NOT drop/reset anything from migrations.sql.
-- Safe to re-run: every policy is dropped-then-recreated by name.
-- Run in Supabase SQL Editor, once, AFTER the `pontos-imagens` bucket has
-- been created (Storage → New bucket → "pontos-imagens", public: on).
--
-- Why this is needed even though the bucket is "public": the public flag
-- only lets anyone fetch an object's bytes via the direct
-- /storage/v1/object/public/... URL, bypassing RLS for that single GET.
-- It does NOT cover storage.objects.list()/select() calls made through
-- the JS client (supabase.storage.from(...).list(...)), which is what the
-- in-app photo gallery uses to enumerate a point's folder. Those calls are
-- still subject to normal RLS on storage.objects, hence the explicit
-- SELECT policy below.
--
-- Uploads are intentionally NOT exposed to the app — the gallery is
-- view-only for every user (admin included). New photos are added by
-- uploading directly to the bucket via the Supabase Dashboard (which
-- bypasses RLS entirely), the same workflow already used for
-- imagem_capa/galeria_imagens. No INSERT policy is created here on purpose.
-- ============================================================

drop policy if exists "pontos_imagens_select_public" on storage.objects;
create policy "pontos_imagens_select_public" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'pontos-imagens');

-- If a previous run created an insert policy, remove it — uploads are
-- dashboard-only now.
drop policy if exists "pontos_imagens_insert_authenticated" on storage.objects;
