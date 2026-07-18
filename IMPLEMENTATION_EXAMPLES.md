# 💻 Exemplos Práticos de Implementação

## 1. AuthContext.tsx Template

```tsx
"use client"

import React, { createContext, ReactNode, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/services/supabaseClient"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  updateUserPreferences: (prefs: any) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        
        if (existingSession) {
          setUser(existingSession.user)
          setSession(existingSession)
        }
      } catch (err) {
        console.error("Auth init error:", err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      if (data.session) {
        setUser(data.session.user)
        setSession(data.session)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      setError(null)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            accessibility_prefs: {
              audio: true,
              libras: false,
              contrast: false,
            },
          },
        },
      })

      if (signUpError) throw signUpError
      if (data.session) {
        setUser(data.session.user)
        setSession(data.session)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logout = async () => {
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      
      setUser(null)
      setSession(null)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateUserPreferences = async (prefs: any) => {
    try {
      if (!user) throw new Error("Not authenticated")
      
      const { error } = await supabase
        .from("accessibility_preferences")
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date(),
        })

      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        login,
        signup,
        logout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
```


---

## 2. useAuth.ts Hook

```tsx
"use client"

import { useContext } from "react"
import { AuthContext } from "@/context/AuthContext"

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
```

---

## 3. supabaseClient.ts

```tsx
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 4. Modified layout.tsx

```tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rota sem Barreiras | Turismo Acessível GV",
  description: "...",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ff7f00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} h-full select-none antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-app text-text-main">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 5. Modified page.tsx (com Auth Check)

```tsx
"use client"

import React, { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import LoginPage from "@/components/LoginPage"
import { TouristPoint, touristPoints } from "../data/mockData"
import BottomNav from "../components/BottomNav"
import SearchBar from "../components/SearchBar"
import dynamic from "next/dynamic"
const CustomMap = dynamic(() => import("../components/CustomMap"), { ssr: false })
import BottomSheet from "../components/BottomSheet"
import PointDetails from "../components/PointDetails"
import ProfileView from "../components/ProfileView"
import QRCodeScanner from "../components/QRCodeScanner"
import { AnimatePresence, motion } from "framer-motion"

// Loading skeleton
function LoadingScreen() {
  return (
    <div className="w-full max-w-md h-screen md:max-h-[850px] bg-bg-app flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary font-semibold">Carregando...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<"home" | "profile">("home")
  const [selectedPoint, setSelectedPoint] = useState<TouristPoint | null>(null)
  const [activeDetailsPoint, setActiveDetailsPoint] = useState<TouristPoint | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [searchedPoints, setSearchedPoints] = useState<TouristPoint[]>([
    touristPoints[1],
    touristPoints[4],
  ])

  if (loading) return <LoadingScreen />
  if (!user) return <LoginPage />

  // Rest of existing App code...
  return (
    <main className="w-full min-h-screen bg-zinc-100 flex items-center justify-center font-sans antialiased">
      {/* ... existing container and componentes... */}
    </main>
  )
}
```

---

## 6. LoginPage.tsx (Simplificado)

```tsx
"use client"

import React, { useState } from "react"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      setLoading(true)
      if (isSignup) {
        await signup(email, password, email.split("@")[0])
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md h-screen md:max-h-[850px] bg-bg-app flex flex-col items-center justify-center px-6 py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-text-main">Rota sem Barreiras</h1>
        <p className="text-text-secondary mt-2">Turismo acessível em Governador Valadares</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-sm font-bold text-text-main">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full h-14 mt-2 px-5 py-4 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-text-main">Senha</label>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-14 px-5 py-4 pr-12 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-4 text-text-secondary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 mt-6 bg-brand hover:bg-brand-dark text-white font-extrabold rounded-full transition disabled:opacity-70"
        >
          {loading ? "Autenticando..." : isSignup ? "CRIAR CONTA" : "ENTRAR"}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-brand font-semibold"
          >
            {isSignup ? "Já tenho uma conta" : "Criar nova conta"}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
```

---

## 7. Modified SearchBar.tsx (com API)

```tsx
// Adicione estas linhas no final do handleSelectSuggestion:

const handleSelectSuggestion = async (point: TouristPoint) => {
  onSelectPoint(point)
  setQuery(point.name)
  setSuggestions([])
  setIsFocused(false)
  
  // NOVO: Registrar busca no backend
  try {
    const { user } = useAuth() // Precisa ter acesso ao user
    if (user) {
      await supabase
        .from("user_searches")
        .insert({
          user_id: user.id,
          point_id: point.id,
          searched_at: new Date(),
        })
    }
  } catch (err) {
    console.error("Error recording search:", err)
  }
}
```

---

## 8. Modified ProfileView.tsx (com API)

```tsx
// Adicione no topo do ProfileView:

import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/services/supabaseClient"

export default function ProfileView({ searchedPoints, onSelectPoint }: ProfileViewProps) {
  const { user, logout } = useAuth()
  const [prefAudio, setPrefAudio] = useState(true)
  const [prefLibras, setPrefLibras] = useState(false)
  const [prefContrast, setPrefContrast] = useState(false)

  // Carregar prefs ao montar
  useEffect(() => {
    if (!user) return

    const loadPrefs = async () => {
      const { data, error } = await supabase
        .from("accessibility_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setPrefAudio(data.audio_enabled)
        setPrefLibras(data.libras_enabled)
        setPrefContrast(data.high_contrast_enabled)
      }
    }

    loadPrefs()
  }, [user])

  // Salvar prefs ao mudar
  const handleToggleAudio = async (value: boolean) => {
    setPrefAudio(value)
    try {
      await supabase
        .from("accessibility_preferences")
        .upsert({
          user_id: user?.id,
          audio_enabled: value,
          libras_enabled: prefLibras,
          high_contrast_enabled: prefContrast,
          updated_at: new Date(),
        })
    } catch (err) {
      console.error("Error updating prefs:", err)
    }
  }

  // Botão logout
  return (
    <div className="...">
      {/* ... existing content ... */}
      <button
        onClick={async () => {
          await logout()
        }}
        className="w-full bg-brand text-white font-bold py-4.5 rounded-full mt-8"
      >
        Sair da Conta
      </button>
    </div>
  )
}
```

---

## 9. TypeScript Types (types/index.ts)

```tsx
export interface TouristPoint {
  id: string
  name: string
  category: string
  coords: { lat: number; lng: number }
  image: string
  description: string
  accessibility: {
    wheelchair: boolean
    audio: boolean
    braille: boolean
    libras: boolean
    details: string[]
  }
  history: string
  address: string
  qrCodeValue: string
}

export interface UserPreferences {
  audio_enabled: boolean
  libras_enabled: boolean
  high_contrast_enabled: boolean
}

export interface UserSearch {
  id: string
  user_id: string
  point_id: string
  searched_at: string
}
```
