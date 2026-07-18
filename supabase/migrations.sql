-- ============================================================
-- Rota sem Barreiras — Supabase schema + RLS
-- Run in Supabase SQL Editor, in order, once.
-- Password hashing: handled internally by Supabase Auth (GoTrue,
-- bcrypt). App code never touches raw or hashed passwords — do NOT
-- build custom password columns/logic.
-- ============================================================

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

-- ---------- tourist_points (public read, no user data) ----------
create table public.tourist_points (
  id text primary key,
  name text not null,
  category text not null,
  lat double precision not null,
  lng double precision not null,
  image text,
  description text,
  accessibility jsonb not null default '{}',
  history text,
  address text,
  qr_code_value text unique,
  created_at timestamptz default now()
);

alter table public.tourist_points enable row level security;

create policy "tourist_points_public_read" on public.tourist_points
  for select using (true);
-- no insert/update/delete policy -> only service_role (server-only, e.g. admin script) can write.

-- ---------- user_searches (history) ----------
create table public.user_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  point_id text references public.tourist_points(id) on delete cascade not null,
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
  point_id text references public.tourist_points(id) on delete cascade not null,
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
-- Seed: run AFTER above. Uses existing mockData content.
-- ============================================================
insert into public.tourist_points (id, name, category, lat, lng, image, description, accessibility, history, address, qr_code_value) values
('ibituruna', 'Pico da Ibituruna', 'Natureza & Aventura', -18.8872, -41.9161,
 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop',
 'Com 1.123 metros de altitude, a Ibituruna é uma das principais plataformas de voo livre do mundo, oferecendo uma vista deslumbrante do Rio Doce e de Governador Valadares.',
 '{"wheelchair": true, "audio": true, "braille": true, "libras": false, "details": ["Rampa de acesso ao mirante principal com inclinação regulamentar", "Banheiros totalmente adaptados e acessíveis", "Piso tátil de alerta nas bordas de segurança", "Audiodescrição das paisagens disponível via app/QR Code"]}',
 'A palavra ''Ibituruna'' vem do tupi-guarani e significa ''serra negra''. O local serviu como marco geográfico para os antigos bandeirantes e hoje é considerado o patrimônio ambiental mais precioso da região.',
 'Estrada de Acesso ao Pico, Governador Valadares - MG', 'rota-ibituruna'),

('estacao', 'Praça da Estação Ferroviária', 'Patrimônio Histórico', -18.8582, -41.9485,
 'https://images.unsplash.com/photo-1541336032412-2048a678540d?q=80&w=800&auto=format&fit=crop',
 'Ponto de passagem da famosa Estrada de Ferro Vitória a Minas, a praça abriga a antiga locomotiva Maria Fumaça, símbolo da era de ouro do transporte ferroviário.',
 '{"wheelchair": true, "audio": true, "braille": true, "libras": true, "details": ["Entrada plana e sem degraus para toda a área da praça", "Placas informativas em Braille instaladas ao lado da locomotiva", "Vídeo-guia em Libras acessível via QR Code", "Calçadão amplo e liso, facilitando o trânsito de cadeiras de rodas"]}',
 'Inaugurada em 1910, a Estação de Governador Valadares impulsionou o desenvolvimento econômico da cidade.',
 'Rua Leonardo Cristino, Centro, Governador Valadares - MG', 'rota-estacao'),

('mercado', 'Mercado Municipal', 'Cultura & Gastronomia', -18.8596, -41.9547,
 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop',
 'O coração comercial e gastronômico da cidade, onde se encontram queijos artesanais, doces típicos mineiros, artesanatos regionais e o famoso pastel de feira.',
 '{"wheelchair": true, "audio": false, "braille": false, "libras": true, "details": ["Elevador moderno de acesso ao segundo pavimento", "Sanitários adaptados unissex na área central", "Corredores largos e livres de obstáculos", "Balcões de atendimento com altura rebaixada em lojas selecionadas"]}',
 'Fundado em 1948, o Mercado Municipal é um ponto de encontro tradicional dos valadarenses.',
 'Rua Israel Pinheiro, 2000, Centro, Governador Valadares - MG', 'rota-mercado'),

('catedral', 'Catedral de Santo Antônio', 'Religião & Arquitetura', -18.8561, -41.9489,
 'https://images.unsplash.com/photo-1548625361-155deee223cb?q=80&w=800&auto=format&fit=crop',
 'Principal templo católico de Governador Valadares, com uma arquitetura imponente e vitrais artísticos que retratam passagens bíblicas e a história da paróquia.',
 '{"wheelchair": true, "audio": true, "braille": false, "libras": true, "details": ["Rampa lateral suave com corrimão duplo", "Espaço reservado nas primeiras fileiras para cadeirantes", "Guias de áudio detalhando a arquitetura dos vitrais", "Intérprete de Libras disponível nas missas solenes de domingo"]}',
 'A capela original de Santo Antônio foi erguida na década de 1910, tornando-se Catedral Diocesana em 1956.',
 'Praça Dom Manoel, Centro, Governador Valadares - MG', 'rota-catedral'),

('deck', 'Deck do Rio Doce (Ilha dos Araújos)', 'Lazer & Paisagem', -18.8683, -41.9680,
 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop',
 'Um espaço de convivência e lazer às margens do Rio Doce na charmosa Ilha dos Araújos. Ideal para caminhadas, pôr do sol e contemplação da natureza urbana.',
 '{"wheelchair": true, "audio": true, "braille": true, "libras": false, "details": ["Pistas de caminhada asfaltadas e totalmente lisas", "Rampas metálicas antiderrapantes de acesso ao deck de madeira", "Mapas táteis em Braille na entrada do calçadão", "Bancos de repouso ergonomicamente adaptados e espaçados"]}',
 'O Rio Doce é a alma geográfica de Governador Valadares. O calçadão da Ilha dos Araújos foi revitalizado para integrar os moradores à bacia hidrográfica.',
 'Calçadão da Ilha dos Araújos, Governador Valadares - MG', 'rota-deck');
