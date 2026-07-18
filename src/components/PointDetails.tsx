"use client";

import React, { useEffect, useState } from "react";
import { TouristPoint } from "@/types/point";
import { ArrowLeft, MapPin, Accessibility, Volume2, Bookmark, Check, ShieldCheck, Headphones, Video, Images } from "lucide-react";
import { motion } from "framer-motion";

interface PointDetailsProps {
  point: TouristPoint;
  onBack: () => void;
}

/** Skeleton block — pulses gray, same shape as real content underneath. */
function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded-2xl animate-pulse ${className}`} />;
}

function PointDetailsSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 bg-bg-app z-50 overflow-hidden flex flex-col pb-24">
      <div className="relative w-full h-80 flex-shrink-0 bg-gray-200 animate-pulse">
        <button
          onClick={onBack}
          className="absolute top-[calc(env(safe-area-inset-top)+16px)] left-6 w-12 h-12 rounded-full bg-white/95 text-brand shadow-lg flex items-center justify-center hover:bg-white transition-all active:scale-90"
          title="Voltar"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.8]" />
        </button>
      </div>
      <div className="px-6 py-8 flex flex-col gap-8 max-w-md mx-auto w-full">
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-48 w-full" />
        <SkeletonBlock className="h-64 w-full" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    </div>
  );
}

export default function PointDetails({ point, onBack }: PointDetailsProps) {
  // Skeleton clears once cover image finishes loading (or errors — never
  // hang forever on broken URL). Rest of point data already arrives in
  // the `point` prop synchronously, so image load is the real async gate.
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    if (!point.image) {
      setImageLoaded(true); // no cover image set — skip skeleton wait
      return;
    }
    const img = new window.Image();
    img.src = point.image;
    if (img.complete) {
      setImageLoaded(true);
    } else {
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
    }
  }, [point.image]);

  if (!imageLoaded) {
    return <PointDetailsSkeleton onBack={onBack} />;
  }

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
          className="absolute top-[calc(env(safe-area-inset-top)+16px)] left-6 w-12 h-12 rounded-full bg-white/95 text-brand shadow-lg flex items-center justify-center hover:bg-white transition-all active:scale-90"
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

        {/* Image Gallery - only rendered when cadastro has extra photos */}
        {point.gallery.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
            <h3 className="text-xl font-black text-text-main flex items-center gap-2 border-b border-gray-100 pb-4 mb-5">
              <Images className="w-6 h-6 text-brand" />
              Galeria de Fotos
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {point.gallery.map((url, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={index}
                  src={url}
                  alt={`${point.name} - foto ${index + 1}`}
                  className="w-32 h-32 rounded-2xl object-cover flex-shrink-0 border border-gray-100"
                />
              ))}
            </div>
          </div>
        )}

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

          {/* Accessibility media links — rendered only when cadastro provides the URL */}
          {(point.audioUrl || point.audioDescriptionUrl || point.librasVideoUrl) && (
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-3">
              {point.audioUrl && (
                <a
                  href={point.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-brand-light/40 hover:bg-brand-light text-brand font-bold text-sm rounded-2xl px-5 py-4 transition-colors"
                >
                  <Headphones className="w-5 h-5" />
                  Ouvir Áudio do Local
                </a>
              )}
              {point.audioDescriptionUrl && (
                <a
                  href={point.audioDescriptionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-brand-light/40 hover:bg-brand-light text-brand font-bold text-sm rounded-2xl px-5 py-4 transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                  Ouvir Audiodescrição
                </a>
              )}
              {point.librasVideoUrl && (
                <a
                  href={point.librasVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-brand-light/40 hover:bg-brand-light text-brand font-bold text-sm rounded-2xl px-5 py-4 transition-colors"
                >
                  <Video className="w-5 h-5" />
                  Assistir Vídeo em Libras
                </a>
              )}
            </div>
          )}
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
      </div>
    </motion.div>
  );
}
