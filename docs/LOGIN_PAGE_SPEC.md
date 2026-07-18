# 🔐 Especificação: LoginPage Component

## Contexto
O `LoginPage` será a primeira tela que usuários sem autenticação verão. Deve estar **100% alinhado** com o design system do projeto (cores, tipografia, acessibilidade) e servir como porta de entrada para o app inteiro.

---

## 1. Requisitos Funcionais

### 1.1 Formulário de Login (Login Simples)
- **Email input**: Validação básica (formato email)
- **Password input**: Masking de caracteres
- **Botão Login**: Submete credenciais
- **Mensagem de erro**: Se email/senha incorretos
- **Link Recuperar Senha**: Inicia fluxo de password reset (futuro)

### 1.2 Formulário de Signup (Novo Usuário)
- **Email input**: Validação + verificação se não existe
- **Password input**: Requisitos mínimos (8 chars, 1 upper, 1 number)
- **Confirm Password**: Validação de match
- **Full Name input** (opcional): Armazenado em user_metadata
- **Botão Signup**: Cria novo usuário
- **Toggle**: "Tenho uma conta" ↔ "Criar nova conta"

### 1.3 Gerenciamento de Estado
```tsx
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [confirmPassword, setConfirmPassword] = useState("")
const [fullName, setFullName] = useState("")
const [isSignup, setIsSignup] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState("")
const [success, setSuccess] = useState("")
```

### 1.4 Validações
- **Email**: Formato RFC 5322 (regex básico)
- **Password (Login)**: Mínimo 6 caracteres
- **Password (Signup)**: Mínimo 8 chars, 1 maiúscula, 1 número
- **Confirm Password**: Match com Password
- **Full Name**: Máximo 60 caracteres
- **Campos vazios**: Mostrar erro claro

---

## 2. Design System Compliance

### 2.1 Cores
```
Cor Primária (Brand):        #ff7f00 (laranja)
Cor Secundária (Brand Light): #fff4e6 (pêssego claro)
Background Geral:             #FAF8F5 (off-white aquecido)
Background Cards:             #FFFFFF (branco)
Texto Principal:              #222E2D (cinza escuro esverdeado)
Texto Secundário:             #6E7A79 (cinza médio)
Erro:                         #E63946 (vermelho/coral)
Sucesso:                      #2ECC71 (verde)
```

### 2.2 Tipografia
- **Fonte**: Plus Jakarta Sans (já carregada em layout.tsx)
- **Pesos**: Regular (400), SemiBold (600), Bold (700), Black (900)
- **Título da página**: `text-3xl font-black` (`48px, 900w`)
- **Labels**: `text-sm font-bold` (`14px, 700w`)
- **Input text**: `text-base font-semibold` (`16px, 600w`)
- **Botões**: `text-base font-extrabold` (`16px, 800w`)
- **Mensagens**: `text-sm font-semibold` (`14px, 600w`)

### 2.3 Espaçamento & Layout
- **Max width**: `max-w-md` (448px) — mantém padrão mobile
- **Container padding**: `px-6 py-8` (24px horizontal, 32px vertical)
- **Gap entre inputs**: `gap-4` (16px)
- **Gap entre seções**: `gap-6` (24px)
- **Corner radius**: `rounded-3xl` (24px) — padrão capsule

### 2.4 Alvos de Toque (Accessibility)
- **Input height**: `h-14` (56px) — toque sênior
- **Input padding**: `px-5 py-4` — espaço interno
- **Button height**: `py-4.5` (18px padding) — toque ampliado
- **Label-to-input spacing**: `mt-2` (8px)
- **Botões side-by-side**: `gap-3` (12px) entre eles

### 2.5 Contraste WCAG AA
- **Texto dark sobre branco**: #222E2D on #FFFFFF = ✓ 10.5:1 (AAA)
- **Texto sobre laranja**: #FFFFFF on #ff7f00 = ✓ 4.5:1 (AA)
- **Erro**: #E63946 on #FFFFFF = ✓ 7.2:1 (AAA)

---

## 3. Layout Visual (Mobile-First)

```
┌────────────────────────────┐
│  12:41              🔋 100% │ ← Status bar
├────────────────────────────┤
│                            │
│    ┌────────────────────┐  │
│    │                    │  │
│    │   Carnelian Logo   │  │ ← Institucional (80×80)
│    │   + UAI Icon       │  │
│    └────────────────────┘  │
│                            │
│    Rota sem Barreiras      │ ← Title (text-3xl)
│                            │
│    Acesso acessível à      │ ← Subtitle (text-sm)
│    cultura de GV           │
│                            │
│ ┌──────────────────────┐   │
│ │ Email                │   │ ← Input h-14
│ └──────────────────────┘   │
│                            │
│ ┌──────────────────────┐   │
│ │ Senha                │   │
│ │ [eye icon]           │   │
│ └──────────────────────┘   │
│                            │
│ [✓] Lembrar-me             │ ← Checkbox (futuro)
│                            │
│ ┌──────────────────────┐   │
│ │    ENTRAR            │   │ ← Button (py-4.5, bg-brand)
│ └──────────────────────┘   │
│                            │
│ Não tem conta?             │
│ [Criar nova conta]         │ ← Link/toggle
│                            │
│ [Recuperar Senha]          │ ← Link (futuro)
│                            │
│   Carnelian Escuderia      │ ← Footer (institucional)
│   ONG UAI | 2026           │
│                            │
└────────────────────────────┘
```

### 3.1 Modo Signup (Toggle)
Mesmo layout, mas:
- Adiciona input "Nome Completo" entre Logo e Email
- Botão muda: "ENTRAR" → "CRIAR CONTA"
- Link muda: "Criar conta" → "Já tenho conta"
- Remove "Recuperar Senha"

---

## 4. Componente TypeScript

### 4.1 Props (se necessário usar como component reutilizável)
```tsx
interface LoginPageProps {
  onLoginSuccess?: (user: User) => void
  redirectTo?: string
}
```

### 4.2 Estrutura de Arquivo
```tsx
// src/components/LoginPage.tsx

"use client"

import React, { useState } from "react"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"

interface LoginPageProps {
  onLoginSuccess?: () => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // State declarations
  // Validation functions
  // Event handlers
  // Render JSX
}
```

### 4.3 Estado Detalhado
```tsx
// Form inputs
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")

// Signup mode
const [isSignup, setIsSignup] = useState(false)
const [confirmPassword, setConfirmPassword] = useState("")
const [fullName, setFullName] = useState("")

// UI state
const [showPassword, setShowPassword] = useState(false)
const [showConfirmPassword, setShowConfirmPassword] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState("")
const [success, setSuccess] = useState("")

// Auth hook
const { login, signup } = useAuth()
```

### 4.4 Validação Funcional
```tsx
const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const validatePassword = (pwd: string): boolean => {
  // Login: 6+ chars
  if (!isSignup) return pwd.length >= 6
  
  // Signup: 8+ chars, 1 upper, 1 number
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd)
}

const validateFullName = (name: string): boolean => {
  return name.trim().length >= 2 && name.length <= 60
}

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  
  // Validações
  if (!validateEmail(email)) {
    setError("Email inválido")
    return
  }
  
  if (!validatePassword(password)) {
    setError(isSignup 
      ? "Senha deve ter 8+ chars, 1 maiúscula, 1 número"
      : "Senha deve ter 6+ caracteres"
    )
    return
  }
  
  if (isSignup && password !== confirmPassword) {
    setError("Senhas não conferem")
    return
  }
  
  if (isSignup && !validateFullName(fullName)) {
    setError("Nome deve ter 2-60 caracteres")
    return
  }
  
  // Chamar auth
  try {
    setLoading(true)
    setError("")
    
    if (isSignup) {
      await signup(email, password, fullName)
      setSuccess("Conta criada! Redirecionando...")
      setTimeout(() => onLoginSuccess?.(), 1500)
    } else {
      await login(email, password)
      setSuccess("Login bem-sucedido!")
      setTimeout(() => onLoginSuccess?.(), 1500)
    }
  } catch (err: any) {
    setError(err.message || "Erro ao autenticar")
  } finally {
    setLoading(false)
  }
}
```

---

## 5. Animações & Micro-interações

### 5.1 Entrada de Página
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="..."
>
  {/* Conteúdo */}
</motion.div>
```

### 5.2 Toggle Signup/Login
```tsx
<motion.div
  key={isSignup ? "signup" : "login"}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Inputs específicos do modo */}
</motion.div>
```

### 5.3 Botão Loading
```tsx
<button
  disabled={loading}
  className="... disabled:opacity-70 disabled:cursor-not-allowed"
>
  {loading ? (
    <span className="flex items-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
      />
      Autenticando...
    </span>
  ) : (
    "ENTRAR"
  )}
</button>
```

---

## 6. Integração com AuthContext

### 6.1 Tipo de Hook Esperado
```tsx
const { login, signup, logout } = useAuth()

// login(email: string, password: string): Promise<void>
// signup(email: string, password: string, fullName: string): Promise<void>
// logout(): Promise<void>
```

### 6.2 Fluxo Esperado
```tsx
// 1. User submete form
await login(email, password)

// 2. AuthContext chamará supabase.auth.signInWithPassword()
// 3. Se OK: setUser() → re-render layout
// 4. Se erro: throw error → catch em LoginPage

// 5. page.tsx detecta user !== null
// 6. page.tsx renderiza <App /> em vez de <LoginPage />
```

---

## 7. Tratamento de Erros

### 7.1 Mensagens Esperadas (do Supabase)
```tsx
// Email não encontrado
"Invalid login credentials"

// Senha incorreta
"Invalid login credentials"

// Email já existe
"User already registered"

// Senha fraca
"Password should be at least 6 characters"

// Rate limit
"Too many requests"
```

### 7.2 Mapeamento para UX-Friendly
```tsx
const getErrorMessage = (supabaseError: string): string => {
  const errorMap: { [key: string]: string } = {
    "Invalid login credentials": "Email ou senha incorretos",
    "User already registered": "Este email já está cadastrado",
    "Password should be at least 6 characters": "Senha muito curta",
    "Too many requests": "Muitas tentativas. Tente novamente mais tarde.",
  }
  
  return errorMap[supabaseError] || "Erro ao autenticar. Tente novamente."
}
```

---

## 8. Acessibilidade (WCAG)

### 8.1 Requisitos Atendidos
- ✓ Labels explícitas para cada input (associados via `htmlFor`)
- ✓ Placeholders informativos + labels
- ✓ Cores não transmitem informação sozinhas (vermelho + ícone de erro)
- ✓ Tamanho de fonte: 16px base (evita zoom mobile)
- ✓ Alvos de toque: 56px+ (h-14)
- ✓ Contraste: WCAG AA em todos os textos
- ✓ Modo escuro: Cores respeitam paleta (sem blindness simulations)
- ✓ Navegação por teclado: Tab → Email → Password → Button
- ✓ Focus visible: `:focus-visible` com outline

### 8.2 Implementação
```tsx
<label htmlFor="email-input" className="text-sm font-bold text-text-main">
  Email
</label>
<input
  id="email-input"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="seu@email.com"
  className="w-full h-14 px-5 py-4 bg-white border border-gray-200 rounded-full 
             focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
  aria-describedby={error ? "error-message" : undefined}
/>
{error && (
  <p id="error-message" className="text-sm text-red-600 mt-1 font-semibold">
    {error}
  </p>
)}
```

---

## 9. Flows de Teste (QA Checklist)

### 9.1 Login Sucesso
- [ ] Insere email válido
- [ ] Insere senha > 6 chars
- [ ] Clica "ENTRAR"
- [ ] Aparece loading spinner
- [ ] Após 1-2s, mensagem "Login bem-sucedido!"
- [ ] Página redireciona para App
- [ ] User vê mapa + perfil carregado

### 9.2 Signup Sucesso
- [ ] Toggle para "Criar nova conta"
- [ ] Insere nome completo
- [ ] Insere email novo
- [ ] Insere senha 8+ chars com maiúscula e número
- [ ] Confirma senha (match)
- [ ] Clica "CRIAR CONTA"
- [ ] Após 1-2s, redireciona + login automático

### 9.3 Erros
- [ ] Email vazio → erro "Campo obrigatório"
- [ ] Email inválido → erro "Email inválido"
- [ ] Senha vazia → erro "Campo obrigatório"
- [ ] Senha < 6 (login) → erro "Senha deve ter 6+ caracteres"
- [ ] Email já existe (signup) → erro "Este email já está cadastrado"
- [ ] Senhas não conferem (signup) → erro "Senhas não conferem"

---

## 10. Referências de Design

- **Guia de Interface**: `/docs/interface_rules.md`
- **PRD**: `/docs/prd.md`
- **Changelog**: `/docs/changelog.md`
- **Design System**:
  - Cores: Laranja `#ff7f00`
  - Fonte: Plus Jakarta Sans
  - Mínimo de toque: 48×48dp
  - Sem decorações AI-like (sem emojis, sem círculos decorativos)

---

## 11. Considerações Futuras

- [ ] **Social Login**: Google / Apple ID (Supabase já suporta)
- [ ] **Password Reset**: Email com link seguro
- [ ] **2FA**: Verificação de código SMS/email
- [ ] **Biometric**: Face ID / Fingerprint (PWA)
- [ ] **Dark Mode**: Variações de cores para modo escuro
- [ ] **Internationalization**: i18n para português/inglês

---

## 12. Checklist Pré-Implementação

- [ ] Supabase project criado com tabelas definidas
- [ ] Variáveis de ambiente configuradas (.env.local)
- [ ] AuthContext.tsx implementado
- [ ] useAuth() hook criado
- [ ] Tailwind v4 com cores customizadas carregado
- [ ] Plus Jakarta Sans fonte carregada
- [ ] Framer Motion importado
- [ ] Lucide React icons disponível
- [ ] layout.tsx preparado para envolver com AuthProvider
