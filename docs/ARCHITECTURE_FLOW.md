# 🏗️ Arquitetura Técnica — Fluxo com Supabase

## Estrutura Atual vs. Com Supabase

### ANTES (Mockado)
```
┌─────────────────────────────────────┐
│     page.tsx                        │
│ (Estado local apenas)               │
└─────────────────────────────────────┘
         │
         ├─→ SearchBar
         │   └─→ Local filter (touristPoints)
         ├─→ CustomMap
         │   └─→ Render static points
         ├─→ PointDetails
         │   └─→ Mock data
         └─→ ProfileView
             └─→ searchedPoints[] (localStorage)
```

### DEPOIS (Com Supabase + Auth)
```
┌──────────────────────────────────────────────┐
│     layout.tsx                               │
│     <AuthProvider>                           │
│       <RootLayout>                           │
└──────────────────────────────────────────────┘
         │
         ├─→ AuthContext
         │   ├─→ user: User | null
         │   ├─→ session: Session | null
         │   └─→ supabaseClient (initialized)
         │
         ├─→ page.tsx
         │   ├─→ if (!user) → <LoginPage />
         │   └─→ if (user) → <AppContainer />
         │
         └─→ AppContainer (componentes atuais)
             ├─→ SearchBar
             │   ├─→ Local filter
             │   └─→ recordUserSearch() → API
             ├─→ CustomMap
             │   ├─→ Fetch points from API
             │   └─→ Render com favoritos do user
             ├─→ PointDetails
             │   ├─→ Mostrar dados da API
             │   ├─→ toggleFavorite() → API
             │   └─→ recordUserSearch() → API
             └─→ ProfileView
                 ├─→ fetchUserProfile() → API
                 ├─→ fetchSearchHistory() → API
                 ├─→ updatePreferences() → API
                 └─→ logout()
```

---

## Fluxo de Autenticação (User Journey)

### 1️⃣ First Access (Não Autenticado)
```
User abre app em localhost:3000
  │
  ├─→ layout.tsx carrega
  │   └─→ <AuthProvider>
  │       └─→ useEffect: supabase.auth.getSession()
  │           └─→ session = null
  │
  ├─→ page.tsx renderiza
  │   ├─→ loading = true (checking session)
  │   └─→ Skeleton loader
  │
  └─→ AuthContext: session check completa
      ├─→ loading = false
      ├─→ user = null
      └─→ page.tsx re-render
          └─→ <LoginPage /> (renderiza)
```

### 2️⃣ Login Flow
```
User vê: LoginPage
  │ (email + password inputs)
  │
  ├─→ User digita: anna@example.com / senha123
  │
  ├─→ User clica: "Entrar"
  │   └─→ onSubmit() chamado
  │
  ├─→ LoginPage.tsx chama: auth.login(email, pwd)
  │   └─→ supabase.auth.signInWithPassword()
  │
  ├─→ Supabase verifica:
  │   ├─→ Email existe? ✓
  │   ├─→ Senha correcta? ✓
  │   └─→ Retorna: { session, user }
  │
  ├─→ AuthContext.setUser(user)
  │   └─→ setSession(session)
  │
  ├─→ localStorage.setItem('auth_session', session)
  │   (persistence)
  │
  └─→ page.tsx detecta user !== null
      └─→ <AppContainer /> renderiza
          └─→ User vê: Mapa + SearchBar + ProfileView
```

### 3️⃣ Search & History Recording
```
User em home tab, vê mapa
  │
  ├─→ User digita: "Pico da Ibituruna"
  │   └─→ SearchBar.onChange()
  │
  ├─→ SearchBar filtra localmente
  │   └─→ mostra suggestions
  │
  ├─→ User clica suggestion
  │   └─→ handleSelectSuggestion()
  │
  ├─→ Chama: recordUserSearch(user.id, point.id)
  │   └─→ API POST /api/user_searches
  │
  ├─→ Backend Supabase:
  │   ├─→ INSERT into user_searches
  │   │   (user_id, point_id, searched_at)
  │   └─→ Retorna: { id, created_at }
  │
  └─→ SearchBar.onSelectPoint()
      └─→ CustomMap centra ponto
          └─→ BottomSheet abre com preview
```

### 4️⃣ Profile Loading on Tab Change
```
User clica: "Perfil" (BottomNav)
  │
  ├─→ activeTab = "profile"
  │   └─→ page.tsx renderiza: <ProfileView />
  │
  ├─→ ProfileView.useEffect([user]) chamado
  │   ├─→ setLoading(true)
  │   └─→ fetchUserSearchHistory(user.id)
  │
  ├─→ Backend retorna últimos 10 pontos pesquisados
  │   └─→ [{ id, name, category, image }, ...]
  │
  ├─→ setSearchedPoints(response)
  │   └─→ setLoading(false)
  │
  └─→ ProfileView renderiza lista
      ├─→ Avatar + email (do user.user_metadata)
      ├─→ Histórico de locais
      └─→ Toggles de preferências
```

### 5️⃣ Preference Change & Sync
```
User em ProfileView, vê toggle: "Priorizar Audiodescrição"
  │
  ├─→ User clica toggle
  │   └─→ setPrefAudio(!prefAudio)
  │
  ├─→ Chama: updateUserPreferences({ audio: true })
  │   └─→ API PATCH /api/user_preferences
  │
  ├─→ Backend Supabase:
  │   ├─→ UPDATE accessibility_preferences
  │   │   WHERE user_id = current_user.id
  │   └─→ Retorna: { id, audio_enabled, libras_enabled, ... }
  │
  ├─→ AuthContext.updateUserMetadata()
  │   └─→ setUser({ ...user, user_metadata: prefs })
  │
  └─→ ProfileView renderiza com estado atualizado
      └─→ Toggle aparece "on" visualmente
```

### 6️⃣ Logout Flow
```
User em ProfileView, clica: "Sair da Conta"
  │
  ├─→ Chama: auth.logout()
  │   └─→ supabase.auth.signOut()
  │
  ├─→ Backend Supabase:
  │   └─→ Invalida session token
  │
  ├─→ localStorage.removeItem('auth_session')
  │   (clear persistence)
  │
  ├─→ AuthContext.setUser(null)
  │   └─→ setSession(null)
  │
  └─→ page.tsx detecta user === null
      └─→ Re-render: <LoginPage />
          └─→ User voltou ao login
```

---

## Estado Global vs. Backend State

### Estado que FICA LOCAL (não sincronizado)
```tsx
// page.tsx
const [activeTab, setActiveTab] = useState("home")
const [selectedPoint, setSelectedPoint] = useState(null)
const [activeDetailsPoint, setActiveDetailsPoint] = useState(null)
const [isScannerOpen, setIsScannerOpen] = useState(false)

// ProfileView.tsx
const [prefAudio, setPrefAudio] = useState(true)
const [prefLibras, setPrefLibras] = useState(false)
```

**Por quê?** UI state efêmero, não precisa persistência cross-device.

### Estado que SINCRONIZA com Backend
```tsx
// AuthContext.tsx
const [user, setUser] = useState(null) // → supabase.auth
const [session, setSession] = useState(null) // → localStorage

// page.tsx
const [searchedPoints, setSearchedPoints] = useState([]) 
// → API: fetchUserSearchHistory()

// ProfileView.tsx (NOVO)
const [favorites, setFavorites] = useState([])
// → API: fetchUserFavorites()
```

**Por quê?** Dados que precisam persistir, sincronizar cross-device, ou criar auditoria.

---

## API Endpoints (a criar no Supabase)

### Authentication (via Supabase Auth, não precisa endpoints)
```
POST /auth/v1/signup
POST /auth/v1/token?grant_type=password
POST /auth/v1/logout
```

### RLS Protected Endpoints (via Supabase Postgre)

#### 1. Record a Search
```
POST /rest/v1/user_searches
Headers: Authorization: Bearer {session_token}
Body: { point_id: "ibituruna" }
Response: { id, user_id, point_id, searched_at }
RLS: user can only insert own searches
```

#### 2. Get User Search History
```
GET /rest/v1/user_searches?select=*&limit=50
Headers: Authorization: Bearer {session_token}
Response: [{ id, point_id, searched_at }, ...]
RLS: user can only see own searches
```

#### 3. Toggle Favorite
```
POST /rest/v1/user_favorites
Headers: Authorization: Bearer {session_token}
Body: { point_id: "ibituruna" }
Response: { id, user_id, point_id } OR { message: "deleted" }
RLS: user can only manage own favorites
```

#### 4. Get Tourist Points
```
GET /rest/v1/tourist_points?select=*
Response: [{ id, name, category, coords, image, ... }, ...]
RLS: public read
```

#### 5. Update User Preferences
```
PATCH /rest/v1/accessibility_preferences
Headers: Authorization: Bearer {session_token}
Body: { audio_enabled: true, libras_enabled: false, high_contrast_enabled: false }
Response: { id, user_id, audio_enabled, ... }
RLS: user can only update own prefs
```

---

## Component Dependency Tree (com dados)

```
layout.tsx
├── AuthProvider (Context)
│   └── data: { user, session, login, logout, ... }
│
└── page.tsx
    ├── useAuth() → { user, loading }
    ├── useState(activeTab)
    ├── useState(selectedPoint)
    └── CONDICIONAL:
        ├── IF !user: <LoginPage />
        │   ├── useState(email, password)
        │   ├── useAuth() → { login, signup }
        │   └── ✓ Renderiza standalone
        │
        └── IF user: <App />
            ├── SearchBar
            │   ├── useState(query, suggestions)
            │   ├── useAuth() → user.id
            │   ├── useQuery() → fetchPoints()
            │   └── API: recordUserSearch()
            │
            ├── CustomMap
            │   ├── useQuery() → fetchPoints()
            │   └── Props: points, selectedPoint
            │
            ├── BottomSheet
            │   ├── Props: point, onViewDetails
            │   └── (UI apenas)
            │
            ├── PointDetails
            │   ├── Props: point
            │   ├── API: recordUserSearch()
            │   └── API: toggleFavorite()
            │
            ├── ProfileView
            │   ├── useAuth() → { user, logout }
            │   ├── useQuery() → fetchUserHistory()
            │   ├── API: updatePreferences()
            │   └── Props: searchedPoints, onSelectPoint
            │
            ├── QRCodeScanner
            │   ├── API: recordUserSearch()
            │   └── (simulador)
            │
            └── BottomNav
                └── (navegação pura, sem API)
```

---

## Diagrama de Fluxo de Dados

```
┌──────────────┐
│  Supabase    │
│  (Backend)   │
└──────────────┘
     ▲ │
     │ ├─ GET /tourist_points
     │ ├─ POST /user_searches
     │ ├─ GET /user_searches
     │ ├─ POST /user_favorites
     │ ├─ PATCH /accessibility_preferences
     │ └─ GET auth session
     │
┌────┴──────────────────────────────────┐
│  AuthContext                          │
│  ├─ user: User                        │
│  ├─ session: Session                  │
│  ├─ login(email, pwd)                 │
│  ├─ logout()                          │
│  └─ updateUserMetadata(prefs)         │
└────┬──────────────────────────────────┘
     │
┌────┴──────────────────────────────────────────┐
│  page.tsx                                     │
│  ├─ if (!user) → <LoginPage />               │
│  ├─ if (user) → <App />                      │
│  ├─ searchedPoints: TouristPoint[]           │
│  └─ Orquestração de componentes              │
└────┬──────────────────────────────────────────┘
     │
     ├─→ SearchBar ────→ API recordUserSearch()
     ├─→ CustomMap ────→ API fetchPoints()
     ├─→ PointDetails ─→ API recordUserSearch() + toggleFavorite()
     ├─→ ProfileView ──→ API fetchUserHistory() + updatePreferences()
     └─→ BottomNav (sem API)
```

---

## Timeline de Carregamento (First Load)

```
t=0ms:    User abre app
t=50ms:   HTML carregado
t=100ms:  React renderiza layout.tsx
t=150ms:  AuthContext inicializa
t=200ms:  supabase.auth.getSession() chamado
t=300ms:  Session verificada (+ check localStorage)
          │
          ├─ Se encontrou session: setUser()
          │  └─ page.tsx re-render com App
          │
          └─ Se sem session: setUser(null)
             └─ page.tsx renderiza LoginPage

CENÁRIO A (com session):
t=350ms:  App renderiza
t=400ms:  SearchBar renderiza
t=450ms:  CustomMap carrega
t=500ms:  Leaflet inicializa + fetchPoints() chamado
t=600ms:  Profile carrega lazy
t=650ms:  ProfileView.useEffect() chama fetchUserHistory()
t=750ms:  Histórico renderiza
t=800ms:  Tudo pronto ✓

CENÁRIO B (sem session):
t=350ms:  LoginPage renderiza
t=380ms:  Form pronta para input ✓
```

---

## Checklist de Pontos de Sincronização

| Componente | Evento | API Call | Sincronização |
|-----------|--------|----------|----------------|
| **SearchBar** | User busca ponto | `recordUserSearch()` | ✓ Histórico |
| **PointDetails** | Clica "Ver Detalhes" | `recordUserSearch()` | ✓ Histórico |
| **PointDetails** | Clica coração (favorite) | `toggleFavorite()` | ✓ Favoritos |
| **ProfileView** | Abre tab Perfil | `fetchUserHistory()` | ✓ Histórico |
| **ProfileView** | Clica toggle (audio) | `updatePreferences()` | ✓ Prefs |
| **ProfileView** | Clica "Sair" | `logout()` | ✓ Session |
| **QRCodeScanner** | Escaneia QR | `recordUserSearch()` | ✓ Histórico |
| **CustomMap** | Abre home | `fetchPoints()` | ✗ (sem user data) |
