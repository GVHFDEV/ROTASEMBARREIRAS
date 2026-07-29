"use client";

import React, { useEffect, useState } from "react";
import { TouristPoint } from "@/types/point";
import { ArrowLeft, MapPin, Accessibility, Volume2, Bookmark, Check, ShieldCheck, Headphones, Video, Images, Play, Pause, Square, Gauge } from "lucide-react";
import { motion } from "framer-motion";
import { useSpeechReader, SpeechSegment } from "@/hooks/useSpeechReader";
import { useAuth } from "@/context/AuthContext";

interface PointDetailsProps {
  point: TouristPoint;
  onBack: () => void;
  voiceActive: boolean;
}

/** Skeleton block — pulses gray, same shape as real content underneath. */
function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded-2xl animate-pulse ${className}`} />;
}

function PointDetailsSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 bg-bg-app z-50 overflow-hidden flex flex-col pb-24 lg:top-0 lg:left-0 lg:bottom-0 lg:right-auto lg:w-[390px] lg:h-full lg:rounded-none lg:shadow-2xl lg:border-r lg:border-gray-200 lg:pb-6">
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

export default function PointDetails({ point, onBack, voiceActive }: PointDetailsProps) {
  // Skeleton clears once cover image finishes loading (or errors — never
  // hang forever on broken URL). Rest of point data already arrives in
  // the `point` prop synchronously, so image load is the real async gate.
  const [imageLoaded, setImageLoaded] = useState(false);

  const reader = useSpeechReader();

  // Full screen content, in reading order: name, description, address,
  // accessibility items, history. Each segment gets an id so the
  // currently-playing chunk can be highlighted in the UI below.
  const segments: SpeechSegment[] = [
    { id: "name", text: point.name },
    { id: "description", text: point.description },
    { id: "address", text: point.address ? `Endereço: ${point.address}` : "" },
    {
      id: "accessibility",
      text: point.accessibility.details.length > 0 ? point.accessibility.details.join(". ") : "",
    },
    { id: "history", text: point.history },
  ].filter((s) => s.text.trim());

  const handlePlay = () => reader.play(segments);

  const handleTogglePlayPause = () => {
    if (reader.status === "idle") handlePlay();
    else if (reader.status === "playing") reader.pause();
    else reader.resume();
  };

  // Stop speech automatically when voz alta is turned off from the menu,
  // or when leaving this screen.
  useEffect(() => {
    if (!voiceActive) reader.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceActive]);

  useEffect(() => {
    return () => reader.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const { preferences } = useAuth();
  const reduceMotion = preferences?.reduce_motion_enabled ?? false;
  // Detect desktop viewport to change slide direction (mobile: from right, desktop: from left)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!imageLoaded) {
    return <PointDetailsSkeleton onBack={onBack} />;
  }

  const slideFrom = reduceMotion ? 0 : isDesktop ? "-100%" : "100%";

  return (
    <motion.div
      initial={reduceMotion ? { x: 0 } : { x: slideFrom }}
      animate={{ x: 0 }}
      exit={reduceMotion ? { x: 0 } : { x: slideFrom }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 220 }}
      className="absolute inset-0 bg-bg-app z-[65] overflow-y-auto no-scrollbar flex flex-col pb-24 lg:top-0 lg:left-0 lg:bottom-0 lg:right-auto lg:w-[390px] lg:h-full lg:rounded-none lg:shadow-2xl lg:border-r lg:border-gray-200 lg:pb-6"
    >
      {/* Top Banner Image */}
      <div className="relative w-full h-80 flex-shrink-0 bg-zinc-800">
        {point.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={point.image}
            alt={point.name}
            className="w-full h-full object-cover opacity-90"
          />
        ) : null}
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
          <h2
            className={`text-3xl font-black text-white mt-3.5 drop-shadow-md leading-tight rounded-md transition-colors ${
              reader.currentSegmentId === "name" ? "bg-brand/60" : ""
            }`}
          >
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
            <p
              className={`text-base text-text-main font-semibold mt-1 leading-relaxed rounded-md transition-colors ${
                reader.currentSegmentId === "address" ? "bg-brand-light" : ""
              }`}
            >
              {point.address}
            </p>
          </div>
        </div>

        {/* Image Gallery - only rendered when cadastro has extra photos */}
        {point.gallery.filter(Boolean).length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
            <h3 className="text-xl font-black text-text-main flex items-center gap-2 border-b border-gray-100 pb-4 mb-5">
              <Images className="w-6 h-6 text-brand" />
              Galeria de Fotos
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {point.gallery.filter(Boolean).map((url, index) => (
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
          <ul
            className={`space-y-4 rounded-xl transition-colors ${
              reader.currentSegmentId === "accessibility" ? "bg-brand-light/50 -m-2 p-2" : ""
            }`}
          >
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
          <p
            className={`text-base text-text-secondary leading-relaxed font-semibold whitespace-pre-line rounded-md transition-colors ${
              reader.currentSegmentId === "history" ? "bg-brand-light" : ""
            }`}
          >
            {point.history}
          </p>
        </div>
      </div>

      {/* Read-aloud controls — only rendered when Voz Alta is enabled in the
          accessibility menu. Manual play/pause/stop + speed, never
          auto-starts; user must tap play. Fixed above the bottom safe area
          so it stays reachable while scrolling long detail content. */}
      {voiceActive && (
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-gray-150 shadow-xl rounded-full px-4 py-3 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleTogglePlayPause}
            className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            title={reader.status === "playing" ? "Pausar leitura" : "Ouvir descrição"}
          >
            {reader.status === "playing" ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={reader.stop}
            disabled={reader.status === "idle"}
            className="w-11 h-11 rounded-full bg-gray-100 text-text-secondary flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
            title="Parar leitura"
          >
            <Square className="w-4.5 h-4.5" />
          </button>

          <div className="h-7 w-[1.5px] bg-gray-200 flex-shrink-0" />

          <button
            onClick={() => reader.cycleRate("down")}
            disabled={reader.rate === reader.rateSteps[0]}
            className="w-9 h-9 rounded-full bg-gray-100 text-text-main flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40 text-xs font-black"
            title="Mais lento"
          >
            −
          </button>
          <div className="flex items-center gap-1 min-w-[46px] justify-center flex-shrink-0">
            <Gauge className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-xs font-bold text-text-secondary">{reader.rate}x</span>
          </div>
          <button
            onClick={() => reader.cycleRate("up")}
            disabled={reader.rate === reader.rateSteps[reader.rateSteps.length - 1]}
            className="w-9 h-9 rounded-full bg-gray-100 text-text-main flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40 text-xs font-black"
            title="Mais rápido"
          >
            +
          </button>

          <span className="text-xs font-bold text-text-secondary truncate ml-1">
            {reader.status === "idle" && "Ouvir descrição"}
            {reader.status === "playing" && "Lendo..."}
            {reader.status === "paused" && "Pausado"}
          </span>
        </div>
      </div>
      )}
    </motion.div>
  );
}
