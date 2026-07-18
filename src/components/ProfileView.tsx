"use client";

import React, { useState } from "react";
import { TouristPoint } from "../data/mockData";
import { Mail, ChevronRight, History, Accessibility } from "lucide-react";

interface ProfileViewProps {
  searchedPoints: TouristPoint[];
  onSelectPoint: (point: TouristPoint) => void;
}

export default function ProfileView({ searchedPoints, onSelectPoint }: ProfileViewProps) {
  // Settings toggle states (matching the screenshot's toggle look)
  const [prefAudio, setPrefAudio] = useState(true);
  const [prefLibras, setPrefLibras] = useState(false);
  const [prefContrast, setPrefContrast] = useState(false);

  return (
    <div className="w-full min-h-screen bg-bg-app pb-28 pt-8 px-6 max-w-md mx-auto flex flex-col gap-8">
      {/* Header Title - Larger */}
      <h2 className="text-center font-black text-xl text-text-main">
        Perfil do Usuário
      </h2>

      {/* User Card - Larger elements */}
      <div className="flex flex-col items-center text-center mt-2">
        <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-brand-light flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
            alt="Foto do usuário"
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-2xl font-black text-text-main mt-5">Anna Martinez</h3>
        <p className="text-sm font-bold text-text-secondary mt-1.5 flex items-center gap-2 justify-center">
          <Mail className="w-4 h-4 text-brand" />
          anna.martinez@email.com
        </p>
      </div>

      {/* Social impact Banner - Carnelian / UAI (Larger text, without decorative background) */}
      <div className="bg-brand text-white rounded-3xl p-6 border border-brand-dark/20 shadow-md flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full">
            Iniciativa Social
          </span>
        </div>
        <div>
          <h4 className="text-base font-black">Carnelian & ONG UAI</h4>
          <p className="text-sm text-brand-light/95 leading-relaxed mt-2 font-semibold">
            Você faz parte do projeto **Rota sem Barreiras**, uma parceria voltada a mapear a acessibilidade cultural e turística de Governador Valadares.
          </p>
        </div>
      </div>

      {/* Visited/Searched Locations Section - Taller cards and larger texts */}
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
                    <img
                      src={point.image}
                      alt={point.name}
                      className="w-full h-full object-cover"
                    />
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

      {/* Accessibility Preferences Section - Taller switch toggles and larger text labels */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col gap-5">
        <h3 className="text-lg font-black text-text-main flex items-center gap-2.5 border-b border-gray-100 pb-4">
          <Accessibility className="w-5 h-5 text-brand" />
          Configurações de Acessibilidade
        </h3>
        
        <div className="flex flex-col gap-5">
          {/* Audio Preference */}
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-black text-text-main">Priorizar Audiodescrição</h4>
              <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">Tocar áudio de descrição automaticamente</p>
            </div>
            <button
              onClick={() => setPrefAudio(!prefAudio)}
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

          {/* Libras Preference */}
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-black text-text-main">Priorizar Guia em Libras</h4>
              <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">Carregar vídeos em Libras ao escanear</p>
            </div>
            <button
              onClick={() => setPrefLibras(!prefLibras)}
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

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-black text-text-main">Modo de Alto Contraste</h4>
              <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">Ajustar cores para maior legibilidade</p>
            </div>
            <button
              onClick={() => setPrefContrast(!prefContrast)}
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

      {/* Footer Info */}
      <div className="flex flex-col items-center gap-1.5 text-center mt-3 opacity-50">
        <span className="text-[11px] font-black text-text-secondary uppercase tracking-widest">
          Rota sem Barreiras v1.0.0
        </span>
        <span className="text-[10px] text-text-secondary font-bold">
          Governador Valadares - MG
        </span>
      </div>
    </div>
  );
}
