"use client";
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import {
  Contrast,
  Volume2,
  Type,
  ArrowLeft,
  Check,
  ZapOff,
} from "lucide-react";
// FaUniversalAccess = the current international "Accessible Icon"/UN
// accessibility symbol (person with outstretched arms inside a circle),
// from react-icons' bundled Font Awesome set — a real, maintained icon
// library instead of a hand-drawn SVG.
import { FaUniversalAccess } from "react-icons/fa6";

interface AccessibilityMenuProps {
  isHighContrast: boolean;
  setIsHighContrast: (v: boolean) => void;
  fontScale: "normal" | "lg" | "xl";
  setFontScale: (scale: "normal" | "lg" | "xl") => void;
  vLibrasActive?: boolean;
  setVLibrasActive?: (v: boolean) => void;
  voiceActive: boolean;
  setVoiceActive: (v: boolean) => void;
  reduceMotionActive: boolean;
  setReduceMotionActive: (v: boolean) => void;
}

// Persisted position storage key for the draggable accessibility button.
const DRAG_POSITION_STORAGE_KEY = "accessibility-btn-position";
// Approximate button footprint (w-13/h-13 = 52px) used to keep it clamped on screen.
const BUTTON_SIZE = 52;

export default function AccessibilityMenu({
  isHighContrast,
  setIsHighContrast,
  fontScale,
  setFontScale,
  voiceActive,
  setVoiceActive,
  reduceMotionActive,
  setReduceMotionActive,
}: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const FONT_STEPS: Array<"normal" | "lg" | "xl"> = ["normal", "lg", "xl"];
  const safeScale = FONT_STEPS.includes(fontScale) ? fontScale : "normal";

  // Draggable floating button: offsets are applied on top of the default
  // CSS position (left-4/top-[38%] on mobile, xl:top-4/xl:right-4 on desktop).
  const dragBoundsRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const wasDraggedRef = useRef(false);

  // Restore a previously saved position (clamped to the current viewport
  // in case the window was resized since it was last saved).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(DRAG_POSITION_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { x: number; y: number };
      if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return;
      const maxX = window.innerWidth - BUTTON_SIZE;
      const maxY = window.innerHeight - BUTTON_SIZE;
      dragX.set(Math.min(Math.max(parsed.x, -maxX), maxX));
      dragY.set(Math.min(Math.max(parsed.y, -maxY), maxY));
    } catch {
      // Ignore malformed/unavailable storage; falls back to default position.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Small movements are treated as a click/tap rather than a drag.
    if (Math.abs(info.offset.x) > 4 || Math.abs(info.offset.y) > 4) {
      wasDraggedRef.current = true;
    }
    try {
      window.localStorage.setItem(
        DRAG_POSITION_STORAGE_KEY,
        JSON.stringify({ x: dragX.get(), y: dragY.get() })
      );
    } catch {
      // Ignore storage failures (e.g. private browsing mode).
    }
  };

  const handleButtonClick = () => {
    if (wasDraggedRef.current) {
      wasDraggedRef.current = false;
      return;
    }
    setIsOpen(true);
  };

  // High contrast styling overrides
  const pageBg = isHighContrast ? "bg-black text-white" : "bg-bg-app text-text-main";
  const cardBg = isHighContrast
    ? "bg-zinc-950 border-2 border-white text-white"
    : "bg-white border border-gray-100/80 shadow-md text-text-main";
  const iconBoxBg = isHighContrast
    ? "bg-black text-yellow-400 border border-white"
    : "bg-brand-light text-brand";
  const buttonActiveBg = isHighContrast
    ? "bg-yellow-400 text-black border-2 border-white"
    : "bg-brand text-white";
  const buttonInactiveBg = isHighContrast
    ? "bg-zinc-900 text-white border border-zinc-700"
    : "bg-gray-150 text-text-secondary hover:bg-gray-200";

  return (
    <>
      {/* Drag constraints container spans the whole viewport so the button
          can be moved to and dropped at any position on screen. */}
      <div ref={dragBoundsRef} className="absolute inset-0 pointer-events-none z-[60]">
        {/* Floating Accessibility Circle Button - draggable, defaults to Left Side */}
        <motion.button
          drag
          dragConstraints={dragBoundsRef}
          dragMomentum={false}
          dragElastic={reduceMotionActive ? 0 : 0.08}
          onDragEnd={handleDragEnd}
          style={{ x: dragX, y: dragY, transition: reduceMotionActive ? "none" : undefined }}
          onClick={handleButtonClick}
          className={`pointer-events-auto absolute left-4 top-[38%] -translate-y-1/2 w-13 h-13 rounded-full shadow-2xl flex items-center justify-center ${
            reduceMotionActive ? "" : "transition-colors active:scale-90 hover:scale-105"
          } cursor-grab active:cursor-grabbing touch-none border xl:top-4 xl:left-auto xl:right-4 xl:translate-y-0 ${
            isHighContrast
              ? "bg-yellow-400 border-white text-black font-black"
              : "bg-brand border-brand/10 text-white"
          }`}
          aria-label="Abrir Tela de Acessibilidade. Arraste para reposicionar o botão."
          title="Abrir Central de Acessibilidade (arraste para mover)"
        >
          <FaUniversalAccess className="w-7 h-7" />
        </motion.button>
      </div>

      {/* Dedicated Accessibility Screen with Slide Transition (From the side) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotionActive ? { x: 0 } : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduceMotionActive ? { x: 0 } : { x: "100%" }}
            transition={reduceMotionActive ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 300 }}
            className={`absolute inset-0 z-[70] flex flex-col overflow-hidden ${pageBg} xl:left-auto xl:right-0 xl:top-0 xl:bottom-0 xl:w-[380px] xl:border-l xl:border-gray-200 xl:shadow-2xl`}
          >
            {/* Header */}
            <div className={`px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-4 flex items-center gap-4 border-b flex-shrink-0 ${
              isHighContrast ? "border-zinc-800 bg-black" : "border-gray-100 bg-white/80 backdrop-blur-md"
            }`}>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                  isHighContrast
                    ? "bg-zinc-900 text-yellow-400 border border-zinc-700 hover:bg-zinc-800"
                    : "bg-gray-100 text-text-main hover:bg-gray-200"
                }`}
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div>
                <h1 className="font-black text-lg leading-tight flex items-center gap-2">
                  <FaUniversalAccess className="w-5 h-5 text-brand" />
                  Central de Acessibilidade
                </h1>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-5">
              
              {/* Card 1: Alto Contraste */}
              <div className={`rounded-3xl p-5 flex flex-col gap-4 ${cardBg}`}>
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBoxBg}`}>
                    <Contrast className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-snug">Modo de Alto Contraste</h3>
                    <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">
                      Aplica paleta de alto contraste em preto e amarelo, otimizada para pessoas com baixa visão ou fotofobia.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
                  <span className="text-xs font-bold text-text-secondary">
                    Status: <strong className={isHighContrast ? "text-yellow-400" : ""}>{isHighContrast ? "Ativado" : "Desativado"}</strong>
                  </span>

                  {/* Switch Toggle */}
                  <button
                    data-active={isHighContrast}
                    onClick={() => setIsHighContrast(!isHighContrast)}
                    className={`accessibility-toggle-track w-14 h-8 rounded-full relative transition-colors duration-200 cursor-pointer flex-shrink-0 p-1 ${
                      isHighContrast ? buttonActiveBg : buttonInactiveBg
                    }`}
                    aria-label="Alternar Alto Contraste"
                  >
                    <motion.div
                      layout
                      className="accessibility-toggle-thumb w-6 h-6 rounded-full shadow-md bg-white"
                      animate={{ x: isHighContrast ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* Card 2: Tamanho de Fonte */}
              <div className={`rounded-3xl p-5 flex flex-col gap-4 ${cardBg}`}>
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBoxBg}`}>
                    <Type className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-snug">Tamanho do Texto</h3>
                    <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">
                      Redimensione proporcionalmente as fontes de menus, descrições e títulos para maior conforto visual.
                    </p>
                  </div>
                </div>

                {/* Scale buttons selector */}
                <div className="flex flex-col gap-3 pt-2 border-t border-gray-100/80">
                  {/* Visual scale options pill list */}
                  <div className="grid grid-cols-3 gap-2">
                    {FONT_STEPS.map((step) => {
                      const isSelected = safeScale === step;
                      return (
                        <button
                          key={step}
                          onClick={() => setFontScale(step)}
                          className={`py-2 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                            isSelected
                              ? isHighContrast
                                ? "bg-yellow-400 border-white text-black"
                                : "bg-brand border-brand text-white shadow-md"
                              : isHighContrast
                                ? "bg-zinc-900 border-zinc-700 text-white"
                                : "bg-gray-100 border-gray-200 text-text-secondary hover:bg-gray-150"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          {step === "normal" ? "Padrão" : step === "lg" ? "Grande" : "Extra G."}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 3: Leitura em Voz Alta */}
              <div className={`rounded-3xl p-5 flex flex-col gap-4 ${cardBg}`}>
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBoxBg}`}>
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-snug">Leitura em Voz Alta</h3>
                    <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">
                      Ativa assistência sonora e audiodescrição em guias turísticos e detalhes de monumentos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
                  <span className="text-xs font-bold text-text-secondary">
                    Status: <strong className={voiceActive ? "text-brand" : ""}>{voiceActive ? "Ativado" : "Desativado"}</strong>
                  </span>

                  {/* Switch Toggle */}
                  <button
                    data-active={voiceActive}
                    onClick={() => setVoiceActive(!voiceActive)}
                    className={`accessibility-toggle-track w-14 h-8 rounded-full relative transition-colors duration-200 cursor-pointer flex-shrink-0 p-1 ${
                      voiceActive ? buttonActiveBg : buttonInactiveBg
                    }`}
                    aria-label="Alternar Leitura em Voz Alta"
                  >
                    <motion.div
                      layout
                      className="accessibility-toggle-thumb w-6 h-6 rounded-full shadow-md bg-white"
                      animate={{ x: voiceActive ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* Card 4: Reduzir Movimento */}
              <div className={`rounded-3xl p-5 flex flex-col gap-4 ${cardBg}`}>
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBoxBg}`}>
                    <ZapOff className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-snug">Reduzir Movimento</h3>
                    <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">
                      Desativa todas as animações, transições e efeitos de movimento de toda a plataforma.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
                  <span className="text-xs font-bold text-text-secondary">
                    Status: <strong className={reduceMotionActive ? "text-brand" : ""}>{reduceMotionActive ? "Ativado" : "Desativado"}</strong>
                  </span>

                  {/* Switch Toggle */}
                  <button
                    data-active={reduceMotionActive}
                    onClick={() => setReduceMotionActive(!reduceMotionActive)}
                    className={`accessibility-toggle-track w-14 h-8 rounded-full relative transition-colors duration-200 cursor-pointer flex-shrink-0 p-1 ${
                      reduceMotionActive ? buttonActiveBg : buttonInactiveBg
                    }`}
                    aria-label="Alternar Reduzir Movimento"
                  >
                    <motion.div
                      layout
                      className="accessibility-toggle-thumb w-6 h-6 rounded-full shadow-md bg-white"
                      animate={{ x: reduceMotionActive ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
