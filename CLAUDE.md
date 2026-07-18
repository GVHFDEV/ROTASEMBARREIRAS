# Análise de Arquitetura — Rota sem Barreiras

## 📐 Estrutura Atual (Mapa Completo)

### Camadas da Aplicação

```
┌─────────────────────────────────────────────────────┐
│  page.tsx (Main App Container)                      │
│  - Estado Global (useState)                         │
│  - Orquestração de Componentes                      │
│  - Animações com AnimatePresence (Framer Motion)   │
└─────────────────────────────────────────────────────┘
         │
         ├─→ SearchBar (busca + QR simulator)
         ├─→ CustomMap (Leaflet + pins)
         ├─→ BottomSheet (preview do ponto)
         ├─→ PointDetails (fullscreen detalhes)
         ├─→ ProfileView (histórico + prefs)
         ├─→ QRCodeScanner (simulador)
         └─→ BottomNav (navegação)
```

### Estado Global em `page.tsx`

| Estado | Tipo | Propósito | Mutação |
|--------|------|----------|----------|
| `activeTab` | "home" \| "profile" | Abas ativas | `setActiveTab()` |
| `selectedPoint` | TouristPoint \| null | Ponto selecionado no mapa | `setSelectedPoint()` |
| `activeDetailsPoint` | TouristPoint \| null | Ponto em fullscreen | `setActiveDetailsPoint()` |
| `isScannerOpen` | boolean | Scanner modal ativo | `setIsScannerOpen()` |
| `searchedPoints` | TouristPoint[] | Histórico de pesquisas | `setSearchedPoints()` |

---

## 🔑 Sistema de Login — Impacto Arquitetural

### 1. **Novas Camadas Necessárias**

#### 1.1 Autenticação (Supabase Auth)
```
┌────────────────────────────────────┐
│  AuthContext (React Context)       │
│  - user: User | null               │
│  - session: Session | null         │
│  - loading: boolean                │
│  - error: string | null            │
│  - login(email, pwd) → Promise     │
│  - signup(email, pwd) → Promise    │
│  - logout() → Promise              │
└────────────────────────────────────┘
```

#### 1.2 Persistência de Sessão
```
useEffect(() => {
  // Verificar sessão ao montar
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) setUser(session.user)
    else setUser(null)
  })
}, [])
```

#### 1.3 Layout Protegido
```
page.tsx → if (!user) → <LoginPage /> 
          → else → <AppContainer />
```

---

### 2. **Componentes a Criar**

#### 2.1 `LoginPage.tsx`
**Local**: `src/components/LoginPage.tsx`
```tsx
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  
  // Handlers para form
  // Respeitar design system (cores laranja, alvos 48×48dp+)
  // Alto contraste WCAG AA
}
```

**Responsabilidades**:
- Email + Password inputs (com validação)
- Toggle Login ↔ Signup
- Botão Submit (toque ampliado)
- Mensagens de erro/sucesso
- Link "Recuperar Senha"

**Design Constraints**:
- Usar Plus Jakarta Sans
- Input height: `h-14` (56px)
- Button height: `py-4.5` (toque sênior)
- Paleta: Brand Orange `#ff7f00`, Brand Light `#fff4e6`, BG Off-white `#FAF8F5`
- Sem gradientes artificiais, sem emojis, sem decorações AI-like
- Logo Carnelian/UAI no topo (institucional)

#### 2.2 `AuthContext.tsx` / `useAuth` Hook
**Local**: `src/context/AuthContext.tsx`
```tsx
interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    accessibility_prefs?: {
      audio: boolean
      libras: boolean
      contrast: boolean
    }
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUserPreferences: (prefs: object) => Promise<void>
}
```

**Responsabilidades**:
- Wrapper Supabase Auth
- Gerenciar sessão (onAuthStateChange)
- Fornecer user context para toda app
- Persistir em localStorage (backup)

---

### 3. **Alterações em Componentes Existentes**

#### 3.1 `page.tsx` (Principal)
**Alterações**:
```tsx
// NOVO: Verificar autenticação
const { user, loading } = useAuth()

if (loading) return <LoadingScreen />
if (!user) return <LoginPage />

// Resto do app permanece igual
// MAS: Adicionar handlers para sincronizar user prefs
useEffect(() => {
  // Se tem user, carregar prefs de acessibilidade dele
  loadUserPreferencesFromSupabase()
}, [user])
```

**Impacto**: +10 linhas, nenhuma lógica business quebrada

#### 3.2 `ProfileView.tsx`
**Alterações**:
```tsx
// NOVO: Mostrar dados do usuário de supabase
<h3>{user?.user_metadata?.full_name || "Usuário"}</h3>
<p>{user?.email}</p>

// NOVO: Sincronizar toggles com backend
const handleToggleAudio = async (value: boolean) => {
  setPrefAudio(value)
  await updateUserPreferences({ audio: value })
}

// NOVO: Carregar histórico de API em vez de mock
useEffect(() => {
  fetchSearchedPointsFromSupabase()
}, [user])

// NOVO: Botão de logout
<button onClick={logout}>Sair da Conta</button>
```

**Impacto**: +30-50 linhas, estrutura existente preservada

#### 3.3 `SearchBar.tsx`
**Alterações**:
```tsx
// NOVO: Salvar busca no histórico do usuário
const handleSelectSuggestion = async (point) => {
  onSelectPoint(point)
  // Adicionar ao histórico via API
  await recordUserSearch(user.id, point.id)
}
```

**Impacto**: +5 linhas (minimal)

#### 3.4 `PointDetails.tsx`
**Alterações**:
```tsx
// NOVO: Botão Favoritar
<button onClick={() => toggleFavorite(point.id)}>
  <Heart fill={isFavorited ? "currentColor" : "none"} />
</button>
```

**Impacto**: +10-15 linhas

---

### 4. **Novas Estruturas de Dados (Supabase)**

#### 4.1 Tabelas Necessárias

**`users` (gerenciado por Supabase Auth)**
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE
created_at TIMESTAMP
user_metadata JSONB
  ├── full_name: string
  ├── avatar_url: string
  └── accessibility_prefs: {
      audio: boolean
      libras: boolean
      contrast: boolean
    }
```

**`tourist_points` (dados públicos)**
```sql
id UUID PRIMARY KEY
name TEXT
category TEXT
coords GEOMETRY(Point, 4326)
image_url TEXT
description TEXT
address TEXT
accessibility JSONB
history TEXT
qr_code_value TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**`user_searches` (histórico)**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
point_id UUID REFERENCES tourist_points(id)
searched_at TIMESTAMP
```

**`user_favorites` (marcados)**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
point_id UUID REFERENCES tourist_points(id)
created_at TIMESTAMP
UNIQUE(user_id, point_id)
```

**`accessibility_preferences` (sync perfil)**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
audio_enabled BOOLEAN DEFAULT true
libras_enabled BOOLEAN DEFAULT false
high_contrast_enabled BOOLEAN DEFAULT false
updated_at TIMESTAMP
```

---

### 5. **Fluxo de Autenticação Completo**

```
START
  │
  ├─→ App carrega
  │   └─→ AuthContext.useEffect(): verificar localStorage + supabase.auth.getSession()
  │
  ├─→ Se sessão ativa
  │   └─→ setUser(session.user) → renderiza App
  │       └─→ ProfileView carrega histórico via API
  │       └─→ Preferências carregadas do user_metadata
  │
  └─→ Se sem sessão
      └─→ renderiza LoginPage
          ├─→ Input email
          ├─→ Input password
          └─→ Button "Entrar"
              └─→ supabase.auth.signInWithPassword(email, pwd)
                  ├─→ Se erro → mostrar mensagem
                  └─→ Se OK → setUser() → redireciona App
```

---

### 6. **Pontos de Sincronização com Backend**

| Evento | Componente | API Call | Tabela |
|--------|-----------|----------|--------|
| Login | LoginPage | `signInWithPassword()` | auth |
| Signup | LoginPage | `signUp()` | auth |
| Logout | ProfileView | `signOut()` | auth |
| Pesquisar ponto | SearchBar | `recordUserSearch()` | user_searches |
| Ver detalhes | PointDetails | (implícito em recordUserSearch) | user_searches |
| Favoritar | PointDetails | `toggleFavorite()` | user_favorites |
| Mudar preferências | ProfileView | `updateUserPreferences()` | accessibility_preferences |
| Carregar histórico | ProfileView.useEffect | `fetchUserSearchHistory()` | user_searches |
| Carregar favoritos | ProfileView | `fetchUserFavorites()` | user_favorites |

---

### 7. **Estrutura de Pastas (Depois de Supabase)**

```
src/
├── app/
│   ├── layout.tsx ← Wrappe AuthContext aqui
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── LoginPage.tsx ← NOVO
│   ├── SearchBar.tsx (modificado)
│   ├── CustomMap.tsx
│   ├── BottomSheet.tsx
│   ├── PointDetails.tsx (modificado)
│   ├── ProfileView.tsx (modificado)
│   ├── QRCodeScanner.tsx
│   └── BottomNav.tsx
├── context/
│   └── AuthContext.tsx ← NOVO
├── hooks/
│   └── useAuth.ts ← NOVO
├── services/ ← NOVO
│   ├── supabaseClient.ts
│   ├── authService.ts
│   └── pointsService.ts
├── data/
│   └── mockData.ts (será substituído por API)
└── types/
    └── index.ts ← NOVO (User, Point, etc)
```

---

### 8. **Alterações em Dependências (package.json)**

```json
"dependencies": {
  "...existentes...": "...",
  "@supabase/supabase-js": "^2.40.0",
  "@supabase/auth-helpers-nextjs": "^0.8.7",
  "zustand": "^4.4.1"  // (opcional, state management alternativa)
}
```

---

## 🚨 Riscos & Mitigações

### Risco 1: Perda de Sessão Entre Abas
**Problema**: User autenticado em uma aba, abre outra aba → perda de contexto  
**Mitigação**: localStorage + Supabase session storage automático + useEffect em layout

### Risco 2: Carregamento de Histórico Bloqueante
**Problema**: ProfileView aguarda API → tela trava  
**Mitigação**: Usar `useEffect` + estado separado de `loading` + skeleton loaders

### Risco 3: Preferências Não Sincronizadas
**Problema**: Usuário muda toggle, mas não salva no banco  
**Mitigação**: Auto-save debounced (300ms) ou button "Salvar" explícito

### Risco 4: QR Code sem User ID
**Problema**: Usuário não autenticado tenta usar QR → erro  
**Mitigação**: Redirecionar para login OU permitir uso anônimo (rastrear via device ID)

---

## ✅ Checklist de Implementação

- [ ] Criar AuthContext.tsx
- [ ] Criar supabaseClient.ts
- [ ] Criar LoginPage.tsx
- [ ] Instalar @supabase/supabase-js
- [ ] Configurar variáveis de ambiente (.env.local)
- [ ] Modificar layout.tsx para wrapper AuthContext
- [ ] Modificar page.tsx para condicional user
- [ ] Modificar ProfileView.tsx para síncrono com Supabase
- [ ] Modificar SearchBar.tsx para salvar histórico
- [ ] Criar RLS policies no Supabase
- [ ] Criar migrations no Supabase
- [ ] Testar login/signup/logout
- [ ] Testar sincronização de preferências
- [ ] Testar carregamento de histórico

---

## 📊 Impacto Estimado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Componentes | 7 | 9 (+2) |
| Linhas de código (aprox) | 800 | 1,200 (+400) |
| Tempo de carregamento | ~200ms | ~500ms (incl. auth check) |
| Requisições API | 0 | 4-6 por sessão |
| Sessões persistidas | Não | Sim (24h+ tokens) |

---

## 🎯 Próximas Etapas

1. **Setup Supabase** (criar projeto, tabelas)
2. **Implementar AuthContext** (foundation)
3. **Criar LoginPage** (UI acessível)
4. **Integrar ProfileView** (user data + prefs)
5. **Sincronizar histórico** (SearchBar → user_searches)
6. **Testar fluxo completo** (login → explore → logout)
7. **Otimizar performance** (lazy load, caching)
