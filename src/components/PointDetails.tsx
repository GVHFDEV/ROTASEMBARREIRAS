"use client";

import React from "react";
import { TouristPoint } from "../data/mockData";
import { ArrowLeft, MapPin, Accessibility, Volume2, Bookmark, Check, ShieldCheck, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface PointDetailsProps {
  point: TouristPoint;
  onBack: () => void;
}

export default function PointDetails({ point, onBack }: PointDetailsProps) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="absolute inset-0 bg-bg-app z-50 overflow-y-auto no-scrollbar flex flex-col pb-24"
    >
      {/* Top Banner Image */}
      <div className="relative w-full h-80 flex-shrink-0 bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={point.image}
          alt={point.name}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Taller Back Button (w-12 h-12) */}
        <button
          onClick={onBack}
          className="absolute top-10 left-6 w-12 h-12 rounded-full bg-white/95 text-brand shadow-lg flex items-center justify-center hover:bg-white transition-all active:scale-90"
          title="Voltar"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.8]" />
        </button>
        
        {/* Title over image - Larger text sizes */}
        <div className="absolute bottom-6 left-6 right-6">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#FFFFFF] bg-brand px-4 py-2 rounded-full">
            {point.category}
          </span>
          <h2 className="text-3xl font-black text-white mt-3.5 drop-shadow-md leading-tight">
            {point.name}
          </h2>
        </div>
      </div>

      {/* Details Container - Increased spacing and text sizes */}
      <div className="px-6 py-8 flex flex-col gap-8 max-w-md mx-auto w-full">
        {/* Address Card - Larger */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex items-start gap-4">
          <MapPin className="w-6 h-6 text-brand mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-text-secondary">Endereço</h4>
            <p className="text-base text-text-main font-semibold mt-1 leading-relaxed">{point.address}</p>
          </div>
        </div>

        {/* Accessibility Features Section - Larger and easier to read */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
          <h3 className="text-xl font-black text-text-main flex items-center gap-2 border-b border-gray-100 pb-4 mb-5">
            <Accessibility className="w-6 h-6 text-brand" />
            Acessibilidade no Local
          </h3>

          {/* Quick Icons - Larger grid elements */}
          <div className="grid grid-cols-4 gap-2.5 mb-6">
            <div className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
              point.accessibility.wheelchair ? "border-brand-light bg-brand-light/40 text-brand font-bold" : "border-gray-100 text-gray-300"
            }`}>
              <Accessibility className="w-7 h-7 mb-1.5" />
              <span className="text-[10px] font-black">Rampas</span>
            </div>
            
            <div className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
              point.accessibility.audio ? "border-brand-light bg-brand-light/40 text-brand font-bold" : "border-gray-100 text-gray-300"
            }`}>
              <Volume2 className="w-7 h-7 mb-1.5" />
              <span className="text-[10px] font-black">Áudio</span>
            </div>

            <div className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
              point.accessibility.braille ? "border-brand-light bg-brand-light/40 text-brand font-bold" : "border-gray-100 text-gray-300"
            }`}>
              <ShieldCheck className="w-7 h-7 mb-1.5" />
              <span className="text-[10px] font-black">Braille</span>
            </div>

            <div className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
              point.accessibility.libras ? "border-brand-light bg-brand-light/40 text-brand font-bold" : "border-gray-100 text-gray-300"
            }`}>
              <Bookmark className="w-7 h-7 mb-1.5" />
              <span className="text-[10px] font-black">Libras</span>
            </div>
          </div>

          {/* Bulleted details - text-base for high readability */}
          <ul className="space-y-4">
            {point.accessibility.details.map((detail, index) => (
              <li key={index} className="flex items-start gap-3.5">
                <span className="w-6 h-6 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
                <span className="text-base text-text-secondary leading-relaxed font-semibold">
                  {detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* History / Culture Section - text-base size */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
          <h3 className="text-xl font-black text-text-main border-b border-gray-100 pb-4 mb-5">
            História & Importância
          </h3>
          <p className="text-base text-text-secondary leading-relaxed font-semibold whitespace-pre-line">
            {point.history}
          </p>
        </div>

        {/* Social / NGO Partner Card - Larger fonts, no decoration circles */}
        <div className="bg-brand text-white rounded-3xl p-7 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-accent-bg fill-accent-bg" />
            <span className="text-xs font-black tracking-widest uppercase text-brand-light">
              Impacto Social
            </span>
          </div>
          
          <h4 className="text-lg font-black leading-tight">
            Projeto Rota sem Barreiras
          </h4>
          
          <p className="text-sm text-brand-light/90 mt-3 leading-relaxed font-semibold">
            Uma iniciativa desenvolvida pela equipe **Carnelian (F1 in Schools / STEM Racing)** em cooperação com a **ONG UAI (União dos Amigos da Inclusão)**.
          </p>
          
          <div className="h-[1px] bg-white/20 my-5" />
          
          <div className="flex justify-between items-center text-xs font-black text-brand-light/95">
            <span>EQUIPE CARNELIAN</span>
            <span>•</span>
            <span>ONG UAI</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
