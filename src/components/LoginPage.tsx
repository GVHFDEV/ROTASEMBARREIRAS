"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft, Eye, EyeOff, User as UserIcon, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

type AuthScreen = "signin" | "signup" | "verify";

function validatePassword(pwd: string, isSignup: boolean): string | null {
  if (!isSignup) return pwd.length >= 6 ? null : "Senha deve ter no mínimo 6 caracteres.";
  if (pwd.length < 8) return "Senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Z]/.test(pwd)) return "Senha deve conter pelo menos 1 letra maiúscula.";
  if (!/\d/.test(pwd)) return "Senha deve conter pelo menos 1 número.";
  return null;
}

interface LoginPageProps {
  onClose?: () => void;
  initialScreen?: AuthScreen;
}

export default function LoginPage({ onClose, initialScreen = "signin" }: LoginPageProps) {
  const { login, signup, isAnonymous } = useAuth();

  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [direction, setDirection] = useState(1); // 1 = forward (slide left), -1 = backward (slide right)
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth processing states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  // Navigate between screens
  const navigateTo = (nextScreen: AuthScreen, isForward = true) => {
    setError("");
    setSuccess("");
    setDirection(isForward ? 1 : -1);
    setScreen(nextScreen);
  };

  // Submit Sign In (Screen 2)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isLocked) {
      const secs = Math.ceil(((lockedUntil as number) - Date.now()) / 1000);
      setError(`Muitas tentativas. Aguarde ${secs}s.`);
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError("Email inválido.");
      return;
    }

    const pwdError = validatePassword(password, false);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      setAttempts(0);
      if (onClose) onClose();
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setError(`Muitas tentativas. Aguarde 60s antes de tentar novamente.`);
      } else {
        setError(err instanceof Error ? err.message : "Erro ao autenticar.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Sign Up (Screen 3)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (fullName.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError("Email inválido.");
      return;
    }

    const pwdError = validatePassword(password, true);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);
      const { needsEmailConfirmation } = await signup(email, password, fullName.trim());
      
      if (needsEmailConfirmation) {
        // Redireciona para a Tela 4 de Confirmação de E-mail
        navigateTo("verify", true);
      } else {
        setSuccess("Conta criada e vinculada com sucesso!");
        if (onClose) {
          onClose();
        } else {
          navigateTo("signin", true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  // Confirm Simulated Email Validation (Screen 4)
  const handleVerifyConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    setSuccess("E-mail confirmado com sucesso!");
    setLoading(true);
    
    // Simulate redirecting to sign in or app load
    setTimeout(async () => {
      try {
        await login(email, password);
      } catch (err) {
        setError("Por favor, clique no link de confirmação enviado para seu e-mail.");
        navigateTo("signin", false);
        setLoading(false);
      }
    }, 1500);
  };

  // Motion variants for slide transition
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0
    })
  };

  return (
    <div className="w-full h-full min-h-full bg-bg-app flex flex-col justify-between font-sans antialiased relative overflow-hidden">
      {/* Core Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto no-scrollbar relative w-full">
          <AnimatePresence initial={false} custom={direction} mode="wait">

              {/* SCREEN 2: SIGN IN - ALL TRANSLATED TO PORTUGUESE */}
              {screen === "signin" && (
                <motion.div
                  key="signin"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 px-6 pt-[calc(env(safe-area-inset-top)+36px)] lg:pt-14 pb-28 lg:pb-8 flex flex-col justify-between overflow-y-auto no-scrollbar"
                >
                  <div>
                    {/* Header */}
                    <h3 className="text-center font-black text-xl lg:text-2xl text-text-main mt-4 lg:mt-6">
                      Bem-vindo de volta
                    </h3>

                    {/* Social Logins */}
                    <div className="flex gap-2.5 mt-4 max-w-sm mx-auto">
                      <button
                        onClick={handleVerifyConfirm}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white font-extrabold text-[10px] py-3 px-3 rounded-full uppercase tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="white">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.16.67-2.88 1.51-.62.71-1.16 1.85-1.01 2.96 1.1.09 2.21-.57 2.9-1.41z"/>
                        </svg>
                        Apple
                      </button>
                      <button
                        onClick={handleVerifyConfirm}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-zinc-700 font-extrabold text-[10px] py-3 px-3 rounded-full uppercase tracking-wider active:scale-95 transition-all shadow-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        Google
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center my-3.5 max-w-sm mx-auto">
                      <div className="flex-1 h-[1.5px] bg-gray-200" />
                      <span className="px-3.5 text-xs font-black text-text-secondary uppercase">ou</span>
                      <div className="flex-1 h-[1.5px] bg-gray-200" />
                    </div>

                    {/* Form - Translated */}
                    <form onSubmit={handleSignIn} className="flex flex-col gap-3 max-w-sm mx-auto">
                      <div>
                        <label htmlFor="signin-email" className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1 pl-1">
                          Endereço de E-mail
                        </label>
                        <input
                          id="signin-email"
                          type="email"
                          required
                          placeholder="exemplo@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-text-main font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 h-12"
                        />
                      </div>

                      <div>
                        <label htmlFor="signin-pwd" className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1 pl-1">
                          Senha
                        </label>
                        <div className="relative">
                          <input
                            id="signin-pwd"
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-full pl-5 pr-13 py-2.5 text-sm text-text-main font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 h-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary p-2 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <p role="alert" className="text-xs font-bold text-red-600 px-3 flex items-start gap-1.5 leading-relaxed mt-1">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>{error}</span>
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={loading || isLocked}
                        className="w-full bg-brand hover:bg-brand-dark text-white font-extrabold text-xs py-3.5 px-6 rounded-full uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-brand/10 mt-2 h-12 flex items-center justify-center cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "ENTRAR"
                        )}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => alert("Simulação: E-mail de redefinição enviado.")}
                      className="block mx-auto mt-3 text-[11px] font-black text-brand hover:text-brand-dark uppercase tracking-widest cursor-pointer"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>

                  {/* Create One */}
                  <div className="mt-4 text-center max-w-sm mx-auto w-full flex flex-col gap-2 flex-shrink-0">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Não tem uma conta?</span>
                    <button
                      onClick={() => navigateTo("signup", true)}
                      className="w-full bg-white border border-gray-300 text-text-main font-extrabold text-xs py-3.5 px-6 rounded-full uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-sm h-12 cursor-pointer"
                    >
                      CRIAR UMA CONTA
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN 3: SIGN UP - ALL TRANSLATED */}
              {screen === "signup" && (
                <motion.div
                  key="signup"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 px-6 pt-[calc(env(safe-area-inset-top)+32px)] lg:pt-12 pb-28 lg:pb-8 flex flex-col justify-between overflow-y-auto no-scrollbar"
                >
                  <div>
                    {/* Back Button */}
                    <button
                      onClick={() => navigateTo("signin", false)}
                      className="mb-2 p-2 bg-gray-50 hover:bg-gray-100 text-text-secondary rounded-full active:scale-90 transition-all self-start cursor-pointer"
                      title="Voltar ao Login"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Header */}
                    <h3 className="text-center font-black text-xl lg:text-2xl text-text-main">
                      Nova Conta
                    </h3>
                    <p className="text-center text-xs font-bold text-text-secondary mt-0.5">
                      Faça parte da nossa rota acessível
                    </p>

                    {/* Form - Translated */}
                    <form onSubmit={handleSignUp} className="flex flex-col gap-3 mt-4 max-w-sm mx-auto">
                      <div>
                        <label htmlFor="signup-name" className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1 pl-1">
                          Nome Completo
                        </label>
                        <div className="relative flex items-center">
                          <UserIcon className="w-4 h-4 text-text-secondary absolute left-4" />
                          <input
                            id="signup-name"
                            type="text"
                            required
                            placeholder="Seu nome"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-5 py-2.5 text-sm text-text-main font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 h-11"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-email" className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1 pl-1">
                          Endereço de E-mail
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 text-text-secondary absolute left-4" />
                          <input
                            id="signup-email"
                            type="email"
                            required
                            placeholder="exemplo@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-5 py-2.5 text-sm text-text-main font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 h-11"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-pwd" className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1 pl-1">
                          Senha
                        </label>
                        <div className="relative">
                          <input
                            id="signup-pwd"
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-full pl-5 pr-11 py-2.5 text-sm text-text-main font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 h-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-conf-pwd" className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1 pl-1">
                          Confirmar Senha
                        </label>
                        <input
                          id="signup-conf-pwd"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-text-main font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 h-11"
                        />
                      </div>

                      {error && (
                        <p role="alert" className="text-xs font-bold text-red-600 px-3 flex items-start gap-1.5 leading-relaxed">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>{error}</span>
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand hover:bg-brand-dark text-white font-extrabold text-xs py-3.5 px-6 rounded-full uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-brand/10 mt-2 h-11 flex items-center justify-center cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "CADASTRAR"
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Footer Back to Sign In */}
                  <div className="mt-4 text-center max-w-sm mx-auto w-full flex flex-col gap-2 flex-shrink-0">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Já tem uma conta?</span>
                    <button
                      onClick={() => navigateTo("signin", false)}
                      className="w-full bg-white border border-gray-300 text-text-main font-extrabold text-xs py-3 px-6 rounded-full uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-sm h-11 cursor-pointer"
                    >
                      ENTRAR
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN 4: EMAIL VERIFICATION (NO 6-DIGIT CODE, LINK ONLY) */}
              {screen === "verify" && (
                <motion.div
                  key="verify"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 px-6 pt-10 pb-8 flex flex-col justify-between overflow-y-auto no-scrollbar"
                >
                  <div className="flex flex-col items-center justify-center flex-1">
                    {/* Back Button */}
                    <button
                      onClick={() => navigateTo("signup", false)}
                      className="mb-8 p-2.5 bg-gray-50 hover:bg-gray-100 text-text-secondary rounded-full active:scale-90 transition-all self-start"
                      title="Voltar"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Message Container */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/10 mb-8">
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          <path d="m16 19 2 2 4-4" />
                        </svg>
                      </div>
                      
                      <h3 className="text-center font-black text-2xl text-text-main">
                        Confirme seu e-mail
                      </h3>
                      <p className="text-center text-sm font-semibold text-text-secondary mt-4 max-w-[280px] leading-relaxed">
                        Enviamos uma mensagem de ativação para:
                        <span className="block font-black text-text-main mt-2 text-base">{email}</span>
                      </p>
                      <p className="text-center text-xs font-bold text-text-secondary mt-6 max-w-[280px] leading-relaxed bg-brand-light/40 border border-brand-light p-4.5 rounded-2xl">
                        Por favor, abra sua caixa de entrada e clique no link recebido para confirmar seu cadastro.
                      </p>
                    </div>

                    {error && (
                      <p role="alert" className="text-xs font-bold text-red-600 px-3 flex items-start gap-1.5 leading-relaxed mt-4">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </p>
                    )}
                    {success && (
                      <p role="status" className="text-xs font-bold text-brand px-3 leading-relaxed mt-4">
                        {success}
                      </p>
                    )}

                    {/* Main action button to proceed after link verification */}
                    <button
                      onClick={handleVerifyConfirm}
                      disabled={loading}
                      className="w-full bg-brand hover:bg-brand-dark text-white font-extrabold text-sm py-4.5 px-6 rounded-full uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-brand/10 mt-8 h-14 flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "JÁ CONFIRMEI E QUERO ENTRAR"
                      )}
                    </button>
                  </div>

                  {/* Re-send links */}
                  <div className="mt-8 text-center max-w-sm mx-auto w-full flex flex-col gap-2.5 flex-shrink-0">
                    <span className="text-[11px] font-black text-text-secondary uppercase tracking-wider">Não recebeu a mensagem?</span>
                    <button
                      type="button"
                      onClick={() => alert("Simulação: E-mail de confirmação reenviado.")}
                      className="text-[11px] font-black text-brand hover:text-brand-dark uppercase tracking-widest"
                    >
                      Reenviar E-mail
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    );
}
