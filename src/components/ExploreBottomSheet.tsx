"use client";

import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Compass, Landmark, Trees, Footprints } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ExploreBottomSheetProps {
  currentState: "collapsed" | "expanded";
  setCurrentState: (state: "collapsed" | "expanded") => void;
  hideOnDesktop?: boolean;
}

export default function ExploreBottomSheet({ currentState, setCurrentState, hideOnDesktop }: ExploreBottomSheetProps) {
  const { preferences } = useAuth();
  const reduceMotion = preferences?.reduce_motion_enabled ?? false;

  const handleDragEnd = (event: any, info: PanInfo) => {
    // Dragging up (negative y offset/velocity) expands the sheet
    if (info.offset.y < -60 || info.velocity.y < -150) {
      setCurrentState("expanded");
    } 
    // Dragging down collapses the sheet
    else if (info.offset.y > 60 || info.velocity.y > 150) {
      setCurrentState("collapsed");
    }
  };

  const toggleState = () => {
    setCurrentState(currentState === "collapsed" ? "expanded" : "collapsed");
  };

  const variants = {
    initial: {
      y: "100%",
      opacity: 0,
    },
    collapsed: {
      bottom: "calc(env(safe-area-inset-bottom) + 84px)",
      height: "90px",
      y: 0,
      opacity: 1,
      zIndex: 30,
    },
    expanded: {
      bottom: "calc(env(safe-area-inset-bottom) + 84px)",
      height: "58dvh",
      y: 0,
      opacity: 1,
      zIndex: 30,
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: { duration: reduceMotion ? 0 : 0.25 },
    },
  };

  return (
    <motion.div
      drag={reduceMotion ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      initial="initial"
      animate={currentState}
      exit="exit"
      variants={variants}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 28 }}
      className={`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-150 rounded-t-[32px] shadow-[0_-12px_32px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden select-none md:max-w-xl md:mx-auto md:rounded-t-[32px] xl:bottom-6 xl:left-4 xl:right-auto xl:w-[380px] xl:rounded-3xl xl:shadow-2xl xl:border${hideOnDesktop ? " xl:hidden" : ""}`}
    >
      {/* Drag Handle & Header */}
      <div 
        onClick={toggleState}
        className="w-full flex flex-col items-center pt-3 pb-4 cursor-pointer hover:bg-gray-50/50 transition-colors flex-shrink-0"
      >
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mb-3" />
        <div className="px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5.5 h-5.5 text-brand" />
            <h3 className="font-extrabold text-base text-text-main tracking-tight">
              Explore Governador Valadares
            </h3>
          </div>
          <span className="text-xs font-black text-brand uppercase tracking-wider bg-brand-light px-3 py-1 rounded-full">
            Vibe Local
          </span>
        </div>
      </div>

      {/* Sheet Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 no-scrollbar">
        <div className="flex flex-col gap-6 mt-2">
          {/* Quick Stats Banner */}
          <div className="bg-brand-light/40 border border-brand-light rounded-2xl p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-brand uppercase tracking-widest">Acessibilidade Ativa</span>
              <h4 className="font-extrabold text-base text-text-main">Pontos Mapeados</h4>
            </div>
            <div className="text-3xl font-black text-brand">5/5</div>
          </div>

          {/* Quick tips sections */}
          <div className="flex flex-col gap-3">
            <h4 className="font-extrabold text-sm text-text-secondary uppercase tracking-wider pl-1">Patrimônios em Destaque</h4>
            
            {/* Tour Suggestion Card 1 */}
            <div className="bg-white border border-gray-150 rounded-2xl p-4.5 flex gap-4 shadow-sm hover:border-brand/35 transition-colors cursor-pointer">
              <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center text-brand flex-shrink-0">
                <Landmark className="w-8 h-8" />
              </div>
              <div className="flex flex-col justify-center">
                <h5 className="font-bold text-sm text-text-main">Rota Histórica Cultural</h5>
                <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">
                  Visite o Mercado Municipal e a antiga Estação Ferroviária.
                </p>
              </div>
            </div>

            {/* Tour Suggestion Card 2 */}
            <div className="bg-white border border-gray-150 rounded-2xl p-4.5 flex gap-4 shadow-sm hover:border-brand/35 transition-colors cursor-pointer">
              <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center text-brand flex-shrink-0">
                <Trees className="w-8 h-8" />
              </div>
              <div className="flex flex-col justify-center">
                <h5 className="font-bold text-sm text-text-main">Lazer & Natureza</h5>
                <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">
                  Explore o Parque Natural Municipal e a Ilha dos Araújos.
                </p>
              </div>
            </div>

            {/* Accessibility Info Card */}
            <div className="bg-white border border-gray-150 rounded-2xl p-4.5 flex gap-4 shadow-sm hover:border-brand/35 transition-colors cursor-pointer">
              <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center text-brand flex-shrink-0">
                <Footprints className="w-8 h-8" />
              </div>
              <div className="flex flex-col justify-center">
                <h5 className="font-bold text-sm text-text-main">Guia de Turismo Adaptado</h5>
                <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed">
                  Locais com rampas, áudio e acessibilidade física verificada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
