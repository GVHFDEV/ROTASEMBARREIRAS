"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, Contrast, Languages, Volume2, Type, X } from "lucide-react";

interface AccessibilityMenuProps {
  isHighContrast: boolean;
  setIsHighContrast: (v: boolean) => void;
  fontScale: "normal" | "lg" | "xl";
  setFontScale: (scale: "normal" | "lg" | "xl") => void;
  vLibrasActive: boolean;
  setVLibrasActive: (v: boolean) => void;
  voiceActive: boolean;
  setVoiceActive: (v: boolean) => void;
}

export default function AccessibilityMenu({
  isHighContrast,
  setIsHighContrast,
  fontScale,
  setFontScale,
  vLibrasActive,
  setVLibrasActive,
  voiceActive,
  setVoiceActive,
}: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Guard against fontScale arriving as undefined/invalid (e.g. font_scale
  // column missing from an older accessibility_preferences row before the
  // migration ran) — treat anything unrecognized as "normal" instead of
  // silently no-oping both buttons.
  const FONT_STEPS: Array<"normal" | "lg" | "xl"> = ["normal", "lg", "xl"];
  const safeScale = FONT_STEPS.includes(fontScale) ? fontScale : "normal";

  const getFontScaleLabel = () => {
    switch (safeScale) {
      case "lg":
        return "Grande";
      case "xl":
        return "Extra G.";
      default:
        return "Normal";
    }
  };

  const handleIncreaseFont = () => {
    const nextIndex = Math.min(FONT_STEPS.indexOf(safeScale) + 1, FONT_STEPS.length - 1);
    setFontScale(FONT_STEPS[nextIndex]);
  };

  const handleDecreaseFont = () => {
    const nextIndex = Math.max(FONT_STEPS.indexOf(safeScale) - 1, 0);
    setFontScale(FONT_STEPS[nextIndex]);
  };

  // High contrast adaptive styling helpers
  const panelBg = isHighContrast ? "bg-black border-2 border-white text-white" : "bg-white border border-gray-150 text-text-main";
  const buttonActiveBg = isHighContrast ? "bg-yellow-400 text-black border-2 border-white" : "bg-brand text-white";
  const buttonInactiveBg = isHighContrast ? "bg-zinc-900 text-white border border-zinc-700" : "bg-gray-100 text-text-secondary hover:bg-gray-200/70";
  const dividerColor = isHighContrast ? "border-zinc-800" : "border-gray-100";

  return (
    <>
      {/* Floating Accessibility Bubble - Vertically Centered on Right Side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute right-4 top-[45%] -translate-y-1/2 z-[60] w-12.5 h-12.5 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 hover:scale-105 cursor-pointer border ${
          isHighContrast
            ? "bg-yellow-400 border-white text-black font-black"
            : "bg-brand border-brand/10 text-white"
        }`}
        aria-label="Menu de Acessibilidade"
      >
        <Accessibility className="w-6.5 h-6.5 stroke-[2.3]" />
      </button>

      {/* Slide-over Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-away backdrop overlay inside device frame */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black z-[55] pointer-events-auto"
            />

            {/* Menu Card - w-[325px] width prevents wrapping issues under text scaling */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 24, stiffness: 240 }}
              className={`absolute right-16 top-[45%] -translate-y-1/2 w-[325px] rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-5 z-[60] flex flex-col gap-4.5 overflow-hidden accessibility-menu-panel ${panelBg}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Accessibility className="w-5.5 h-5.5 text-brand" />
                  <span className="font-extrabold text-sm tracking-wide uppercase">Acessibilidade</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    isHighContrast ? "hover:bg-zinc-800 text-white" : "hover:bg-gray-100 text-text-secondary"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`border-t ${dividerColor}`} />

              {/* Option 1: VLibras */}
              <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHighContrast ? "bg-zinc-950 text-yellow-400" : "bg-brand-light text-brand"}`}>
                    <Languages className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-xs tracking-wide truncate">VLibras</span>
                    <span className="text-[10px] text-text-secondary font-medium truncate">Tradutor em Libras</span>
                  </div>
                </div>
                {/* Switch Toggle */}
                <button
                  onClick={() => setVLibrasActive(!vLibrasActive)}
                  className={`w-13 h-7.5 rounded-full relative transition-all duration-200 cursor-pointer flex-shrink-0 ${
                    vLibrasActive ? buttonActiveBg : buttonInactiveBg
                  }`}
                  style={{ minWidth: "52px", minHeight: "30px" }}
                >
                  <motion.div
                    layout
                    className={`w-5.5 h-5.5 rounded-full absolute top-[3px] shadow-sm ${
                      isHighContrast ? (vLibrasActive ? "bg-black" : "bg-white") : "bg-white"
                    }`}
                    animate={{ x: vLibrasActive ? 23 : 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Option 2: Alto Contraste */}
              <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHighContrast ? "bg-zinc-950 text-yellow-400" : "bg-brand-light text-brand"}`}>
                    <Contrast className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-xs tracking-wide truncate">Alto Contraste</span>
                    <span className="text-[10px] text-text-secondary font-medium truncate">Cores de alta visibilidade</span>
                  </div>
                </div>
                {/* Switch Toggle */}
                <button
                  onClick={() => setIsHighContrast(!isHighContrast)}
                  className={`w-13 h-7.5 rounded-full relative transition-all duration-200 cursor-pointer flex-shrink-0 ${
                    isHighContrast ? buttonActiveBg : buttonInactiveBg
                  }`}
                  style={{ minWidth: "52px", minHeight: "30px" }}
                >
                  <motion.div
                    layout
                    className={`w-5.5 h-5.5 rounded-full absolute top-[3px] shadow-sm ${
                      isHighContrast ? "bg-black" : "bg-white"
                    }`}
                    animate={{ x: isHighContrast ? 23 : 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Option 3: Tamanho de Fonte (A- / A+) */}
              <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHighContrast ? "bg-zinc-950 text-yellow-400" : "bg-brand-light text-brand"}`}>
                    <Type className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-xs tracking-wide truncate">Fonte: {getFontScaleLabel()}</span>
                    <span className="text-[10px] text-text-secondary font-medium truncate">Aumentar/reduzir texto</span>
                  </div>
                </div>
                <div className="flex items-center bg-gray-100 rounded-full p-0.5 border border-gray-200/55 flex-shrink-0" style={{ minHeight: "36px" }}>
                  <button
                    onClick={handleDecreaseFont}
                    disabled={safeScale === "normal"}
                    className={`w-9 h-8 rounded-full font-black text-xs transition-all flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                      isHighContrast ? "text-black hover:bg-yellow-350" : "text-text-main hover:bg-white"
                    }`}
                  >
                    A-
                  </button>
                  <button
                    onClick={handleIncreaseFont}
                    disabled={safeScale === "xl"}
                    className={`w-9 h-8 rounded-full font-black text-xs transition-all flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                      isHighContrast ? "text-black hover:bg-yellow-350" : "text-text-main hover:bg-white"
                    }`}
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Option 4: Leitura em voz alta */}
              <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHighContrast ? "bg-zinc-950 text-yellow-400" : "bg-brand-light text-brand"}`}>
                    <Volume2 className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-xs tracking-wide truncate">Voz Alta</span>
                    <span className="text-[10px] text-text-secondary font-medium truncate">Ler elementos selecionados</span>
                  </div>
                </div>
                {/* Switch Toggle */}
                <button
                  onClick={() => setVoiceActive(!voiceActive)}
                  className={`w-13 h-7.5 rounded-full relative transition-all duration-200 cursor-pointer flex-shrink-0 ${
                    voiceActive ? buttonActiveBg : buttonInactiveBg
                  }`}
                  style={{ minWidth: "52px", minHeight: "30px" }}
                >
                  <motion.div
                    layout
                    className={`w-5.5 h-5.5 rounded-full absolute top-[3px] shadow-sm ${
                      isHighContrast ? (voiceActive ? "bg-black" : "bg-white") : "bg-white"
                    }`}
                    animate={{ x: voiceActive ? 23 : 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
