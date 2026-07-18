"use client";

import React from "react";
import { Map, User } from "lucide-react";

interface BottomNavProps {
  activeTab: "home" | "profile";
  setActiveTab: (tab: "home" | "profile") => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <div className="relative bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-40 select-none flex-shrink-0">
      <div className="flex w-full max-w-md mx-auto items-center justify-around h-16">
        
        {/* Tab Explorar */}
        <button
          onClick={() => setActiveTab("home")}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full tap-highlight-none focus:outline-none py-1 group"
        >
          {/* Icon Container with pill background when active */}
          <div
            className={`w-16 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              activeTab === "home"
                ? "bg-brand-light text-brand scale-105"
                : "text-text-secondary group-hover:bg-gray-50"
            }`}
          >
            <Map className={`w-6.5 h-6.5 ${activeTab === "home" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          </div>
          
          {/* Always visible label underneath */}
          <span
            className={`text-[13px] tracking-wide transition-colors duration-200 ${
              activeTab === "home" ? "font-bold text-brand" : "font-semibold text-text-secondary"
            }`}
          >
            Explorar
          </span>
        </button>

        {/* Tab Perfil */}
        <button
          onClick={() => setActiveTab("profile")}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full tap-highlight-none focus:outline-none py-1 group"
        >
          {/* Icon Container with pill background when active */}
          <div
            className={`w-16 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              activeTab === "profile"
                ? "bg-brand-light text-brand scale-105"
                : "text-text-secondary group-hover:bg-gray-50"
            }`}
          >
            <User className={`w-6.5 h-6.5 ${activeTab === "profile" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          </div>
          
          {/* Always visible label underneath */}
          <span
            className={`text-[13px] tracking-wide transition-colors duration-200 ${
              activeTab === "profile" ? "font-bold text-brand" : "font-semibold text-text-secondary"
            }`}
          >
            Perfil
          </span>
        </button>
        
      </div>
    </div>
  );
}
