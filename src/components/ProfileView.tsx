"use client";

import React, { useEffect, useState } from "react";
import { TouristPoint } from "../data/mockData";
import { Mail, ChevronRight, History, Accessibility, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProfileViewProps {
  searchedPoints: TouristPoint[];
  onSelectPoint: (point: TouristPoint) => void;
}

export default function ProfileView({ searchedPoints, onSelectPoint }: ProfileViewProps) {
  const { user, profile, preferences, logout, updatePreferences } = useAuth();

  const [prefAudio, setPrefAudio] = useState(true);
  const [prefLibras, setPrefLibras] = useState(false);
  const [prefContrast, setPrefContrast] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Sync local toggle state once prefs load from Supabase
  useEffect(() => {
    if (!preferences) return;
    setPrefAudio(preferences.audio_enabled);
    setPrefLibras(preferences.libras_enabled);
    setPrefContrast(preferences.high_contrast_enabled);
  }, [preferences]);

  const handleToggle = async (
    key: "audio_enabled" | "libras_enabled" | "high_contrast_enabled",
    value: boolean
  ) => {
    if (key === "audio_enabled") setPrefAudio(value);
    if (key === "libras_enabled") setPrefLibras(value);
    if (key === "high_contrast_enabled") setPrefContrast(value);
    try {
      await updatePreferences({ [key]: value });
    } catch {
      // revert on failure
      if (key === "audio_enabled") setPrefAudio(!value);
      if (key === "libras_enabled") setPrefLibras(!value);
      if (key === "high_contrast_enabled") setPrefContrast(!value);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="w-full min-h-screen bg-bg-app pb-28 pt-8 px-6 max-w-md mx-auto flex flex-col gap-8">
      <h2 className="text-center font-black text-xl text-text-main">Perfil do Usuário</h2>

      {/* User Card */}
      <div className="flex flex-col items-center text-center mt-2">
        <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-brand-light flex items-center justify-center">
          <span className="text-3xl font-black text-brand">{initials}</span>
        </div>
        <h3 className="text-2xl font-black text-text-main mt-5">{displayName}</h3>
        <p className="text-sm font-bold text-text-secondary mt-1.5 flex items-center gap-2 justify-center">
          <Mail className="w-4 h-4 text-brand" />
          {user?.email}
        </p>
      </div>

      {/* Social impact banner */}
      <div className="bg-brand text-white rounded-3xl p-6 border border-brand-dark/20 shadow-md flex flex-col gap-4">
        <span className="text-[10px] font-extrabold tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full w-fit">
          Iniciativa Social
        </span>
        <div>
          <h4 className="text-base font-black">Carnelian & ONG UAI</h4>
          <p className="text-sm text-brand-light/95 leading-relaxed mt-2 font-semibold">
            Você faz parte do projeto Rota sem Barreiras, uma parceria voltada a mapear a acessibilidade cultural e turística de Governador Valadares.
          </p>
        </div>
      </div>

      {/* Search history — from account */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-lg font-black text-text-main flex items-center gap-2.5">
            <History className="w-5 h-5 text-brand" />
            Locais Pesquisados
          </h3>
        </div>

        {searchedPoints.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-base text-text-secondary font-bold">Nenhum local pesquisado ainda.</p>
            <p className="text-sm text-text-secondary/70 mt-2 max-w-[260px] mx-auto leading-relaxed font-semibold">
              Explore o mapa ou escaneie um QR Code para registrar suas visitas!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 max-h-80 overflow-y-auto no-scrollbar pr-1">
            {searchedPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => onSelectPoint(point)}
                className="w-full flex items-center justify-between p-4.5 bg-bg-app/40 hover:bg-brand-light/30 rounded-2xl border border-gray-50/60 transition-all text-left tap-highlight-none active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={point.image} alt={point.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-text-main leading-tight">{point.name}</h4>
                    <p className="text-xs text-text-secondary mt-1 font-bold">{point.category}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accessibility preferences — synced to account */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col gap-5">
        <h3 className="text-lg font-black text-text-main flex items-center gap-2.5 border-b border-gray-100 pb-4">
          <Accessibility className="w-5 h-5 text-brand" />
          Configurações de Acessibilidade
        </h3>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-black text-text-main">Priorizar Audiodescrição</h4>
              <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">Tocar áudio de descrição automaticamente</p>
            </div>
            <button
              onClick={() => handleToggle("audio_enabled", !prefAudio)}
              className={`w-15 h-8.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                prefAudio ? "bg-brand" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-6.5 h-6.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  prefAudio ? "translate-x-6.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-black text-text-main">Priorizar Guia em Libras</h4>
              <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">Carregar vídeos em Libras ao escanear</p>
            </div>
            <button
              onClick={() => handleToggle("libras_enabled", !prefLibras)}
              className={`w-15 h-8.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                prefLibras ? "bg-brand" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-6.5 h-6.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  prefLibras ? "translate-x-6.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-black text-text-main">Modo de Alto Contraste</h4>
              <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">Ajustar cores para maior legibilidade</p>
            </div>
            <button
              onClick={() => handleToggle("high_contrast_enabled", !prefContrast)}
              className={`w-15 h-8.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                prefContrast ? "bg-brand" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-6.5 h-6.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  prefContrast ? "translate-x-6.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-100 hover:bg-red-50 text-red-600 font-extrabold text-base py-4.5 rounded-full transition-all active:scale-95 shadow-sm disabled:opacity-60"
      >
        <LogOut className="w-5 h-5" />
        {loggingOut ? "Saindo..." : "Sair da Conta"}
      </button>

    </div>
  );
}
