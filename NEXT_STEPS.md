# 🚀 Próximos Passos — Começar a Implementação

## Você Está Aqui

```
┌─────────────────────────────────────┐
│  ✅ Interface Pronta & Analisada    │
│     (com dados mock)                │
└──────────┬──────────────────────────┘
           │
           ↓ (você está aqui)
           
┌─────────────────────────────────────┐
│  🔄 Integração com Supabase Backend │
│     (autenticação + data sync)      │
└──────────┬──────────────────────────┘
           │
           ↓
           
┌─────────────────────────────────────┐
│  🎉 App Completo & Deployado        │
│     (produção)                      │
└─────────────────────────────────────┘
```

---

## 📋 Checklist de Preparação

### ✅ Você JÁ TEM
```
✓ Interface mobile-first completa (7 componentes)
✓ Design system implementado (cores, tipografia, acessibilidade)
✓ Dados mockados (5 pontos turísticos reais de GV)
✓ Animações e transições (Framer Motion)
✓ Mapa interativo (Leaflet com OpenStreetMap)
✓ Responsividade testada
✓ Documentação completa
```

### 📦 Você PRECISA
```
1. Conta Supabase (5 min)
   → Ir para https://supabase.com
   → Sign up com email
   
2. Criar projeto (5 min)
   → Project name: "rota-sem-barreiras"
   → Region: "São Paulo" (ou outro na América do Sul)
   
3. Gerar API keys (2 min)
   → Project Settings → API
   → Copy SUPABASE_URL e ANON_KEY
   
4. Preencher .env.local (1 min)
   → Criar arquivo: d:\ROTASEMBARREIRAS\.env.local
   → Adicionar keys
   
5. Executar SQL (10 min)
   → Copiar migrations das docs
   → Colar em Supabase SQL editor
   → Executar
```

**Total: ~25 minutos de setup**

---

## 🎬 Fase 1: Setup Supabase (30-45 min)

### Passo 1: Criar Projeto Supabase

1. Abra https://supabase.com
2. Clique "Sign Up"
3. Use seu email
4. Crie projeto:
   - Name: `rota-sem-barreiras`
   - Database Password: (seguro, anote!)
   - Region: São Paulo (sp-east-1)

### Passo 2: Ativar Autenticação

1. No Supabase Dashboard
2. Authentication → Providers
3. Verificar que "Email" está ativado
4. Settings → Rate Limits: (padrão OK)

### Passo 3: Criar Tabelas

Em **SQL Editor**, execute:

```sql
-- Create tourist_points table
CREATE TABLE public.tourist_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  coords GEOGRAPHY(POINT) NOT NULL,
  image_url TEXT,
  description TEXT,
  address TEXT,
  accessibility JSONB,
  history TEXT,
  qr_code_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tourist_points ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can read tourist points" ON public.tourist_points
  FOR SELECT USING (true);
```

Execute cada tabela do `CLAUDE.md` seção 4 (user_searches, user_favorites, accessibility_preferences)

### Passo 4: Seed com Dados

```sql
-- Insert 5 pontos
INSERT INTO tourist_points (id, name, category, coords, image_url, description, address, accessibility, history, qr_code_value)
VALUES 
(
  'ibituruna',
  'Pico da Ibituruna',
  'Natureza & Aventura',
  ST_GeogFromText('POINT(-41.9161 -18.8872)'),
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop',
  'Com 1.123 metros de altitude...',
  'Estrada de Acesso ao Pico, Governador Valadares - MG',
  '{"wheelchair": true, "audio": true, "braille": true, "libras": false}',
  'A palavra Ibituruna vem do tupi-guarani...',
  'rota-ibituruna'
);

-- (repetir para outros 4 pontos)
```

### Passo 5: Copiar API Keys

No Supabase:
1. Settings → API
2. Project URL → Copiar (será NEXT_PUBLIC_SUPABASE_URL)
3. anon public → Copiar (será NEXT_PUBLIC_SUPABASE_ANON_KEY)

---

## 🔧 Fase 2: Instalar Dependências (5 min)

```bash
cd d:\ROTASEMBARREIRAS

# Instalar Supabase
npm install @supabase/supabase-js

# Verificar instalação
npm list @supabase/supabase-js
```

---

## 📄 Fase 3: Criar Arquivos Backend (15 min)

### Arquivo 1: `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...xxxxx
```

### Arquivo 2: `src/services/supabaseClient.ts`

```tsx
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Arquivo 3: `src/hooks/useAuth.ts`

(Copie do IMPLEMENTATION_EXAMPLES.md, seção 2)

### Arquivo 4: `src/context/AuthContext.tsx`

(Copie do IMPLEMENTATION_EXAMPLES.md, seção 1)

### Arquivo 5: `src/components/LoginPage.tsx`

(Copie do IMPLEMENTATION_EXAMPLES.md, seção 6)

---

## 🔌 Fase 4: Integrar no Layout (10 min)

### Modificar `layout.tsx`

Siga o template em IMPLEMENTATION_EXAMPLES.md seção 4

**Resumo**:
1. Importar AuthProvider
2. Envolver children com `<AuthProvider>`
3. Salvar

### Modificar `page.tsx`

Siga o template em IMPLEMENTATION_EXAMPLES.md seção 5

**Resumo**:
1. Importar useAuth
2. Adicionar `if (loading) return <LoadingScreen />`
3. Adicionar `if (!user) return <LoginPage />`
4. Manter resto do código igual
5. Salvar

---

## ✅ Fase 5: Testar Fluxo de Autenticação (15 min)

```bash
# Terminal 1: Iniciar dev server
npm run dev

# Abrir http://localhost:3000
```

### Teste 1: Signup (Novo Usuário)
```
1. LoginPage renderiza
2. Toggle: "Criar nova conta"
3. Preencher:
   - Email: test@example.com
   - Senha: Teste123456
4. Clica "CRIAR CONTA"
5. Se OK → Redireciona para App (mapa visível)
6. Verificar em Supabase: Authentication → Users (apareceu test@example.com)
```

### Teste 2: Login
```
1. Logout (botão no perfil)
2. LoginPage renderiza
3. Toggle: "Já tenho uma conta" (se mudou)
4. Preencher:
   - Email: test@example.com
   - Senha: Teste123456
5. Clica "ENTRAR"
6. Se OK → Redireciona para App
```

### Teste 3: Persistência
```
1. Logado, fechar aba
2. Reabrir http://localhost:3000
3. NÃO deve mostrar LoginPage (sessão persiste)
```

---

## 🔄 Fase 6: Sincronizar Dados (1-2h)

### Passo 1: Modificar SearchBar (5 min)

```tsx
// Em handleSelectSuggestion:
const handleSelectSuggestion = async (point) => {
  // ... código existente ...
  
  const { user } = useAuth()
  if (user) {
    await supabase.from("user_searches").insert({
      user_id: user.id,
      point_id: point.id,
    })
  }
}
```

### Passo 2: Modificar ProfileView (15 min)

```tsx
// useEffect ao montar: carregar histórico
useEffect(() => {
  if (!user) return
  
  const loadHistory = async () => {
    const { data } = await supabase
      .from("user_searches")
      .select("*")
      .eq("user_id", user.id)
    
    if (data) setSearchedPoints(data)
  }
  
  loadHistory()
}, [user])

// Adicionar button logout
```

### Passo 3: Testar Sincronização (10 min)

```
1. Logado, pesquisar ponto
2. Ir para Perfil
3. Deve mostrar ponto no histórico
4. Recarregar página
5. Histórico deve persistir
6. Verificar em Supabase: user_searches (registros criados)
```

---

## 🎯 Definir Prioridade

### MÍNIMO VIÁVEL (MVE) — 3-4 horas
```
✅ Setup Supabase
✅ AuthContext + LoginPage
✅ Auth flow (signup/login/logout)
✅ Sincronização básica (histórico)
→ Resultado: App funcional com login
```

### COMPLETO — 5-8 horas
```
✅ Tudo acima
✅ Favoritos
✅ Preferências sincronizadas
✅ Error handling robusto
✅ Loading states
✅ Otimizações
→ Resultado: App production-ready
```

---

## 📞 Quando Você Estiver Pronto

Envie uma mensagem como:

```
"Vou começar a implementação. 
- Criei projeto Supabase
- URL: https://xxxxx.supabase.co
- Keys copiadas e em .env.local
- Pronto para Fase 2"
```

Eu vou:
1. ✅ Confirmar setup
2. 📝 Gerar arquivos prontos
3. 🧪 Ajudar em testes
4. 🐛 Debugar problemas
5. 🚀 Guiar até production

---

## 🆘 Se Algo Não Funcionar

### Erro: "Missing Supabase environment variables"
```
→ Verificar .env.local
→ Certificar que tem NEXT_PUBLIC_SUPABASE_URL
→ Certificar que tem NEXT_PUBLIC_SUPABASE_ANON_KEY
→ npm run dev novamente
```

### Erro: "Auth not working"
```
→ Verificar autenticação ativada em Supabase
→ Verificar RLS policies
→ Check browser console for errors
→ Supabase Dashboard → Logs
```

### Erro: "Historical not loading"
```
→ Verificar user está logado
→ Check table name: user_searches
→ Verificar RLS policy permite SELECT
→ Check Network tab em DevTools
```

---

## 📚 Referências Completas

Em sua workspace:

```
CLAUDE.md .................... Análise técnica completa
BACKEND_READINESS.md ......... Guia de readiness
IMPLEMENTATION_EXAMPLES.md ... Código pronto
docs/ARCHITECTURE_FLOW.md .... Diagramas
docs/LOGIN_PAGE_SPEC.md ...... Spec completa
RESUMO_ANALISE.md ............ Este resumo
NEXT_STEPS.md ................ Guia de execução (este arquivo)
```

---

## 🎊 Você Está Pronto!

Qualquer coisa, é só chamar. Vou estar aqui para:

- ✅ Tirar dúvidas
- ✅ Revisar código
- ✅ Debugar problemas
- ✅ Otimizar performance
- ✅ Adicionar features
- ✅ Preparar para produção

**Boa sorte! 🚀**
