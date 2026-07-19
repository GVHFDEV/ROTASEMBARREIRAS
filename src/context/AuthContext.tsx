"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AccessibilityPreferencesRow, Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  preferences: AccessibilityPreferencesRow | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  updatePreferences: (
    prefs: Partial<
      Pick<AccessibilityPreferencesRow, "audio_enabled" | "libras_enabled" | "high_contrast_enabled" | "font_scale">
    >
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generic message on purpose — never reveal whether email exists (enumeration defense).
const GENERIC_AUTH_ERROR = "Email ou senha incorretos.";

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return GENERIC_AUTH_ERROR;
  if (message.includes("User already registered")) return "Este email já possui cadastro.";
  if (message.includes("Password should be at least")) return "Senha muito curta (mínimo 8 caracteres).";
  if (message.includes("rate limit") || message.includes("Too many")) return "Muitas tentativas. Aguarde um momento e tente novamente.";
  if (message.includes("Email not confirmed")) return "Confirme seu email antes de entrar.";
  return "Não foi possível autenticar. Tente novamente.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<AccessibilityPreferencesRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (currentUser: User) => {
    const [{ data: profileData }, { data: prefsData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
      supabase.from("accessibility_preferences").select("*").eq("user_id", currentUser.id).maybeSingle(),
    ]);
    if (profileData) setProfile(profileData as Profile);

    if (prefsData) {
      setPreferences(prefsData as AccessibilityPreferencesRow);
    } else {
      // Row missing (account predates a table reset, or signup trigger
      // didn't run) — create defaults now instead of leaving preferences
      // null forever, which would stop the accessibility menu from ever
      // reflecting/persisting real state.
      const { data: created } = await supabase
        .from("accessibility_preferences")
        .upsert({ user_id: currentUser.id }, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      if (created) setPreferences(created as AccessibilityPreferencesRow);
    }
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Await prefs/profile fetch before flipping loading=false — otherwise
      // page.tsx renders one frame with defaults (no contrast/font applied)
      // then "flashes" to the saved theme once loadUserData resolves.
      if (s?.user) await loadUserData(s.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadUserData(s.user);
      } else {
        setProfile(null);
        setPreferences(null);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthError(error.message));
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(mapAuthError(error.message));
    // Supabase project w/ "Confirm email" enabled returns no session until user clicks link.
    return { needsEmailConfirmation: !data.session };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updatePreferences = async (
    prefs: Partial<
      Pick<AccessibilityPreferencesRow, "audio_enabled" | "libras_enabled" | "high_contrast_enabled" | "font_scale">
    >
  ) => {
    if (!user) return;
    // upsert instead of update — self-heals if the row is missing (e.g.
    // account created before a table reset/migration, trigger never
    // re-ran for existing auth.users). update+.single() 406s with 0 rows
    // matched; upsert creates the row on first save instead of failing.
    const { data, error } = await supabase
      .from("accessibility_preferences")
      .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    if (data) setPreferences(data as AccessibilityPreferencesRow);
  };

  const refreshProfile = async () => {
    if (user) await loadUserData(user);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, preferences, loading, login, signup, logout, updatePreferences, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
