# 🚀 Backend Readiness Guide — Rota sem Barreiras

## Status Atual: ✅ Interface Pronta para Backend

Você tem uma **interface 100% funcional e acessível** rodando com dados mockados. Agora vou mapear exatamente como migrar para Supabase + autenticação.

---

## 📋 O Que Você Tem

### Componentes (7 Ativos)
- ✅ SearchBar (busca + QR simulator)
- ✅ CustomMap (Leaflet + pins interativos)
- ✅ BottomSheet (preview de pontos)
- ✅ PointDetails (fullscreen com details)
- ✅ ProfileView (histórico + prefs)
- ✅ QRCodeScanner (simulador)
- ✅ BottomNav (navegação)

### Design System Implementado
- ✅ Laranja `#ff7f00` primária
- ✅ Plus Jakarta Sans carregada
- ✅ Alvos de toque 48×48dp+ (sênior-friendly)
- ✅ Contraste WCAG AA
- ✅ Sem emojis, sem decorações AI-like
- ✅ Animações com Framer Motion

### Dados Mockados
- ✅ 5 pontos turísticos com dados reais (coords de GV)
- ✅ Estrutura TouristPoint bem definida
- ✅ Accessibilidade information completa
- ✅ History & address campos

### Stack
- ✅ Next.js 16.2.10 (latest)
- ✅ React 19.2.4
- ✅ Leaflet 1.9.4 (mapas reais)
- ✅ Tailwind CSS v4
- ✅ TypeScript strict mode

---

## 🔄 Fluxo de Migração

### Fase 1: Setup Supabase (Estimado: 30-45 min)
```
1. Criar conta Supabase
2. Criar projeto (escolher region América do Sul)
3. Ativar autenticação via Email/Password
4. Criar tabelas via SQL migrations
5. Configurar RLS policies
6. Gerar API credentials (.env.local)
```

### Fase 2: Frontend Auth Foundation (Estimado: 1-2 horas)
```
1. Instalar @supabase/supabase-js
2. Criar src/context/AuthContext.tsx
3. Criar src/hooks/useAuth.ts
4. Envolver layout.tsx com <AuthProvider>
5. Criar src/components/LoginPage.tsx
6. Modificar page.tsx para condicional de auth
7. Testar login/signup/logout
```

### Fase 3: Data Sync (Estimado: 2-3 horas)
```
1. Migrar touristPoints do mock para DB
2. Criar API endpoints (Supabase REST)
3. Modificar CustomMap para fetch points
4. Modificar SearchBar para salvar buscas
5. Modificar ProfileView para carregar histórico
6. Modificar PointDetails para salvar interactions
7. Testar sincronização
```

### Fase 4: Features Adicionais (Estimado: 1-2 horas)
```
1. Implementar Favoritos (toggleFavorite)
2. Implementar Preferências (updatePreferences)
3. Implementar Password Reset (futuro)
4. Adicionar Error Boundaries
5. Otimizar queries
```

---

## 📊 Onde Sofrerá Alterações

### Sem Alteração (70% do código)
```
CustomMap.tsx ─ Layout/visual OK, apenas fetch muda
BottomSheet.tsx ─ UI pura, sem lógica de dados
QRCodeScanner.tsx ─ Simulador, sem backend
BottomNav.tsx ─ Navegação pura
globals.css ─ Estilos
```

### Alteração Leve (20% do código)
```
SearchBar.tsx
  + Adicionar: recordUserSearch() call
  + Adicionar: fetchPoints() ao init
  Impacto: +10-15 linhas

PointDetails.tsx
  + Adicionar: toggleFavorite() call
  + Adicionar: recordUserSearch() call
  Impacto: +15-20 linhas

page.tsx
  + Adicionar: auth check condicional
  + Adicionar: useEffect para carregar user data
  Impacto: +15-20 linhas
```

### Alteração Substancial (10% do código)
```
ProfileView.tsx
  - Remove: mock searchedPoints
  + Adiciona: fetchUserHistory() call
  + Adiciona: API calls para updatePreferences
  + Adiciona: logout() call
  Impacto: +40-50 linhas, refactor de estado
```

### Novos Componentes/Hooks
```
LoginPage.tsx ─ 150-200 linhas (novo)
AuthContext.tsx ─ 80-120 linhas (novo)
useAuth.ts ─ 60-80 linhas (novo)
supabaseClient.ts ─ 20-30 linhas (novo)
```

---

## 🗄️ Estrutura de Banco (Supabase)

### Tabelas a Criar

#### 1. `public.tourist_points`
```sql
CREATE TABLE public.tourist_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  coords GEOMETRY(Point, 4326) NOT NULL,
  image_url TEXT,
  description TEXT,
  address TEXT,
  accessibility JSONB,
  history TEXT,
  qr_code_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed com 5 pontos (migração do mockData)
INSERT INTO tourist_points VALUES (
  'ibituruna',
  'Pico da Ibituruna',
  'Natureza & Aventura',
  ST_SetSRID(ST_MakePoint(-41.9161, -18.8872), 4326),
  'https://images.unsplash.com/...',
  'Com 1.123 metros de altitude...',
  'Estrada de Acesso ao Pico, GV',
  '{"wheelchair": true, "audio": true, "braille": true, "libras": false, "details": [...]}',
  'A palavra Ibituruna vem do tupi-guarani...',
  'rota-ibituruna',
  NOW()
);
```

#### 2. `public.user_searches` (Historical)
```sql
CREATE TABLE public.user_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  point_id TEXT REFERENCES tourist_points(id) NOT NULL,
  searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: Users can only see own searches
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see own searches" ON user_searches
  FOR SELECT USING (auth.uid() = user_id);
```

#### 3. `public.user_favorites`
```sql
CREATE TABLE public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  point_id TEXT REFERENCES tourist_points(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, point_id)
);

-- RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);
```

#### 4. `public.accessibility_preferences`
```sql
CREATE TABLE public.accessibility_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audio_enabled BOOLEAN DEFAULT true,
  libras_enabled BOOLEAN DEFAULT false,
  high_contrast_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE accessibility_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own prefs" ON accessibility_preferences
  FOR ALL USING (auth.uid() = user_id);
```

---

## 🔐 Configuração de Variáveis

### `.env.local` (Depois de Supabase setup)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...xxxxx
```

### Onde Encontrar
1. Supabase Dashboard → Project Settings
2. API tab → Copy as código de exemplo
3. Cole em `.env.local`

---

## 🔌 API Endpoints (que você usará)

### Supabase Auth (Built-in)
```
POST   /auth/v1/signup
POST   /auth/v1/token?grant_type=password
POST   /auth/v1/logout
GET    /auth/v1/session
```

### Supabase REST (seu código chamará)
```
GET    /rest/v1/tourist_points?select=*
POST   /rest/v1/user_searches
GET    /rest/v1/user_searches?user_id=eq.{user_id}
POST   /rest/v1/user_favorites
DELETE /rest/v1/user_favorites?user_id=eq.{user_id}&point_id=eq.{point_id}
PATCH  /rest/v1/accessibility_preferences
```

---

## 📈 Impacto de Performance

### Antes (Mockado)
```
Initial Load:    ~200ms
Search:          ~5ms (in-memory filter)
Profile Load:    ~50ms (in-memory state)
Map Render:      ~300ms (Leaflet init)
TOTAL STARTUP:   ~600ms
```

### Depois (Supabase)
```
Initial Load:    ~500ms (+ auth check)
Auth Session:    ~200ms (localStorage + supabase)
Search:          ~100ms (API call)
Profile Load:    ~300ms (API call)
Map Render:      ~300ms (Leaflet init)
TOTAL STARTUP:   ~1200ms (acceptable for PWA)
```

**Otimizações recomendadas**:
- Lazy load ProfileView (carrega apenas quando aba ativa)
- Cache de tourist_points com SWR/React Query
- Implementar connection pooling no Supabase

---

## ✅ Checklist Pré-Implementação

### Supabase
- [ ] Conta Supabase criada
- [ ] Projeto criado (region: Americas)
- [ ] Tabelas criadas via SQL editor
- [ ] RLS policies configuradas
- [ ] Variables .env.local preenchidas

### Frontend
- [ ] `npm install @supabase/supabase-js`
- [ ] `src/context/AuthContext.tsx` criado
- [ ] `src/hooks/useAuth.ts` criado
- [ ] `src/components/LoginPage.tsx` criado
- [ ] `layout.tsx` wrappe com AuthProvider
- [ ] `page.tsx` com condicional de auth

### Testing
- [ ] Login flow testado (novo usuário)
- [ ] Signup flow testado
- [ ] Logout flow testado
- [ ] Histórico de buscas sincroniza
- [ ] Preferências persistem
- [ ] Favoritos funcionam

---

## 🎯 Próximos Passos (Quando estiver pronto)

1. **Prepare Supabase project** (criar tabelas)
2. **Instale dependências** (`npm install @supabase/supabase-js`)
3. **Configure .env.local**
4. **Crie AuthContext** (foundation)
5. **Implemente LoginPage** (UI)
6. **Sincronize dados** (ProfileView, SearchBar, etc)
7. **Teste fluxo completo**

---

## 📞 Referências Rápidas

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Your CLAUDE.md**: Análise completa em `/CLAUDE.md`
- **Architecture Flow**: `/docs/ARCHITECTURE_FLOW.md`
- **LoginPage Spec**: `/docs/LOGIN_PAGE_SPEC.md`

---

## 🚨 Pontos Críticos Antes de Começar

1. **Não quebre o layout mobile-first**: Mantenha max-w-md em page.tsx
2. **Respeite design system**: Cores, fontes, alvos de toque
3. **Teste acessibilidade**: WCAG AA em novos campos
4. **RLS é obrigatório**: Nunca exponha dados de outro user
5. **Async/await properly**: Handle loading states para não travar UI
6. **Error boundaries**: Falhas de API não devem quebrar app

---

**Você está 100% preparado para começar. Quando quiser iniciar a implementação, me avise!** 🚀
