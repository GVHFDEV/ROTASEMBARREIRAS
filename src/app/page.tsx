"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TouristPoint } from "@/types/point";
import BottomNav from "../components/BottomNav";
import SearchBar from "../components/SearchBar";
import dynamic from "next/dynamic";
const CustomMap = dynamic(() => import("../components/CustomMap"), { ssr: false });
import BottomSheet from "../components/BottomSheet";
import PointDetails from "../components/PointDetails";
import ProfileView from "../components/ProfileView";
import QRCodeScanner from "../components/QRCodeScanner";
import LoginPage from "../components/LoginPage";
import ExploreBottomSheet from "../components/ExploreBottomSheet";
import AccessibilityMenu from "../components/AccessibilityMenu";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { fetchTouristPoints, fetchSearchHistory, recordSearch } from "@/services/pointsService";
import type { AddressResult } from "@/services/geocodingService";
import { Landmark, Trees, Utensils, Sparkles, Compass, Navigation } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="w-full h-dvh flex items-center justify-center bg-bg-app">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const CATEGORIES = ["Todos", "Patrimônio", "Cultura", "Lazer", "Gastronomia", "Natureza", "Religião"];

function getCategoryIcon(cat: string) {
  switch (cat.toLowerCase()) {
    case "patrimônio":
      return <Landmark className="w-4 h-4" />;
    case "cultura":
      return <Sparkles className="w-4 h-4" />;
    case "lazer":
      return <Trees className="w-4 h-4" />;
    case "gastronomia":
      return <Utensils className="w-4 h-4" />;
    case "natureza":
      return <Compass className="w-4 h-4" />;
    case "religião":
      return <Landmark className="w-4 h-4" />;
    default:
      return <Compass className="w-4 h-4" />;
  }
}

export default function App() {
  const { user, loading: authLoading, preferences, updatePreferences } = useAuth();

  const [points, setPoints] = useState<TouristPoint[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "profile">("home");
  const [selectedPoint, setSelectedPoint] = useState<TouristPoint | null>(null);
  const [activeDetailsPoint, setActiveDetailsPoint] = useState<TouristPoint | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchedPoints, setSearchedPoints] = useState<TouristPoint[]>([]);

  // Map Filter and Geolocation states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [exploreSheetState, setExploreSheetState] = useState<"collapsed" | "expanded">("collapsed");

  // Accessibility States — local state drives render instantly (snappy
  // toggle feel); synced from `preferences` once loaded, persisted back
  // to Supabase on every change via updatePreferences.
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState<"normal" | "lg" | "xl">("normal");
  const [vLibrasActive, setVLibrasActive] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  // Seed local toggle state from the user's saved preferences. By the time
  // authLoading flips false, AuthContext has already awaited this fetch
  // (see AuthContext.tsx), so this effect fires while <LoadingScreen /> is
  // still on screen — no flash of unstyled/wrong-theme content once the
  // real UI paints.
  useEffect(() => {
    if (!preferences) return;
    setIsHighContrast(preferences.high_contrast_enabled);
    // font_scale may be missing on rows created before that column existed
    // (pre-migration) — fall back to "normal" instead of storing undefined.
    setFontScale(preferences.font_scale ?? "normal");
    setVLibrasActive(preferences.libras_enabled);
    setVoiceActive(preferences.audio_enabled);
  }, [preferences]);

  const handleSetHighContrast = (value: boolean) => {
    setIsHighContrast(value);
    updatePreferences({ high_contrast_enabled: value }).catch(() => {});
  };

  const handleSetFontScale = (scale: "normal" | "lg" | "xl") => {
    setFontScale(scale);
    updatePreferences({ font_scale: scale }).catch(() => {});
  };

  const handleSetVLibrasActive = (value: boolean) => {
    setVLibrasActive(value);
    updatePreferences({ libras_enabled: value }).catch(() => {});
  };

  const handleSetVoiceActive = (value: boolean) => {
    setVoiceActive(value);
    updatePreferences({ audio_enabled: value }).catch(() => {});
  };

  // Load points from Supabase (public.pontos) + user history once authenticated.
  // No mock fallback — table is single source of truth, new cadastro rows show
  // up automatically on next fetch, no code change needed.
  useEffect(() => {
    if (!user) return;

    fetchTouristPoints()
      .then(setPoints)
      .catch(() => setPoints([]));

    fetchSearchHistory(user.id)
      .then(setSearchedPoints)
      .catch(() => setSearchedPoints([]));
  }, [user]);

  // Request User Geolocation on Mount
  useEffect(() => {
    if (!user) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setFlyToCoords(coords);
        },
        (error) => {
          console.warn("Geolocation warning:", error.message);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [user]);

  const handleRecenter = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setFlyToCoords(coords);
        },
        () => {
          alert("Não foi possível acessar a geolocalização. Por favor, ative as permissões de localização no seu navegador.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocalização não é suportada por este dispositivo.");
    }
  };

  const persistSearch = useCallback(
    (pointId: string) => {
      if (!user) return;
      recordSearch(user.id, pointId).catch(() => {
        // non-critical
      });
    },
    [user]
  );

  if (authLoading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  const handleSetActiveTab = (tab: "home" | "profile") => {
    setActiveTab(tab);
    setActiveDetailsPoint(null);
    setIsScannerOpen(false);
    setSelectedPoint(null);
  };

  const handleSelectPointFromMapOrSearch = (point: TouristPoint) => {
    setSelectedPoint(point);
    // Center map on selected point coords
    setFlyToCoords([point.coords.lat, point.coords.lng]);
  };

  // Address result (Photon) — just center/zoom the map, no ponto detail
  // screen exists for a plain address, so skip selectedPoint/BottomSheet.
  const handleSelectAddress = (address: AddressResult) => {
    setSelectedPoint(null);
    setFlyToCoords([address.lat, address.lng]);
  };

  const addToHistory = (point: TouristPoint) => {
    setSearchedPoints((prev) => (prev.some((p) => p.id === point.id) ? prev : [point, ...prev]));
    persistSearch(point.id);
  };

  const handleViewDetails = (point: TouristPoint) => {
    addToHistory(point);
    setActiveDetailsPoint(point);
    setSelectedPoint(null);
  };

  const handleScanSuccess = (point: TouristPoint) => {
    setIsScannerOpen(false);
    addToHistory(point);
    setActiveDetailsPoint(point);
  };

  // Filter tourist points according to active category tag (using case-insensitive substring matching)
  const filteredPoints = selectedCategory
    ? points.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()))
    : points;

  return (
    <main className="w-full min-h-dvh bg-zinc-100 flex items-center justify-center font-sans antialiased">
      <div className={`relative w-full max-w-md h-dvh md:max-h-[850px] md:rounded-[40px] md:shadow-2xl md:border-[8px] md:border-zinc-800 bg-bg-app overflow-hidden flex flex-col transition-colors duration-250 ${
        isHighContrast ? "theme-high-contrast" : ""
      } ${
        fontScale === "lg" ? "font-scale-lg" : fontScale === "xl" ? "font-scale-xl" : ""
      }`}>

        {/* Status Bar simulation */}
        <div className="hidden md:flex justify-between items-center px-6 py-2 bg-white text-[10px] font-bold text-text-secondary select-none flex-shrink-0">
          <span>1:41</span>
          <div className="w-32 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5" />
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-4 h-2.5 bg-text-secondary/70 rounded-xs" />
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "home" ? (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full relative"
              >
                {/* SearchBar overlay on map */}
                <SearchBar
                  points={filteredPoints}
                  onSelectPoint={handleSelectPointFromMapOrSearch}
                  onSelectAddress={handleSelectAddress}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  selectedPointId={selectedPoint?.id}
                />

                {/* Horizontal Category Badges list under Searchbar */}
                <div className="absolute top-[calc(env(safe-area-inset-top)+84px)] left-0 right-0 z-40 overflow-x-auto no-scrollbar flex gap-2 px-5 py-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected =
                      cat === "Todos" ? selectedCategory === null : selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === "Todos" ? null : cat)}
                        className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-full text-xs font-bold tracking-wide shadow-md border transition-all flex-shrink-0 active:scale-95 cursor-pointer ${
                          isSelected
                            ? "bg-brand border-brand text-white"
                            : "bg-white border-gray-150 text-text-main hover:bg-gray-50"
                        }`}
                      >
                        {getCategoryIcon(cat)}
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Leaflet Map */}
                <CustomMap
                  points={filteredPoints}
                  selectedPoint={selectedPoint}
                  onSelectPoint={handleSelectPointFromMapOrSearch}
                  userLocation={userLocation}
                  flyToCoords={flyToCoords}
                />

                {/* Floating GPS Recenter button above Bottom Sheet */}
                <AnimatePresence>
                  {exploreSheetState === "collapsed" && (
                    <motion.button
                      key="recenter-btn"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleRecenter}
                      className="absolute bottom-[106px] right-5 z-40 w-13 h-13 rounded-full bg-white text-brand shadow-xl border border-gray-100/50 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-90"
                      title="Centralizar na minha localização"
                    >
                      <Navigation className="w-6 h-6 stroke-[2.3]" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Selected Point Summary Card */}
                <BottomSheet
                  point={selectedPoint}
                  onClose={() => setSelectedPoint(null)}
                  onViewDetails={handleViewDetails}
                />
              </motion.div>
            ) : (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full overflow-y-auto no-scrollbar"
              >
                <ProfileView
                  searchedPoints={searchedPoints}
                  onSelectPoint={(point) => setActiveDetailsPoint(point)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={handleSetActiveTab} />

        {/* Persistent Google-Maps-like Bottom Sheet (Rendered at root layout to cover bottom navigation bar when expanded) */}
        <AnimatePresence>
          {activeTab === "home" && !selectedPoint && !activeDetailsPoint && !isScannerOpen && (
            <ExploreBottomSheet
              key="explore-bottom-sheet"
              currentState={exploreSheetState}
              setCurrentState={setExploreSheetState}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeDetailsPoint && (
            <PointDetails
              point={activeDetailsPoint}
              onBack={() => setActiveDetailsPoint(null)}
              voiceActive={voiceActive}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isScannerOpen && (
            <QRCodeScanner
              onClose={() => setIsScannerOpen(false)}
              onScanSuccess={handleScanSuccess}
            />
          )}
        </AnimatePresence>

        {/* Global Floating Accessibility Menu Button and Settings Panel */}
        <AccessibilityMenu
          isHighContrast={isHighContrast}
          setIsHighContrast={handleSetHighContrast}
          fontScale={fontScale}
          setFontScale={handleSetFontScale}
          vLibrasActive={vLibrasActive}
          setVLibrasActive={handleSetVLibrasActive}
          voiceActive={voiceActive}
          setVoiceActive={handleSetVoiceActive}
        />
      </div>
    </main>
  );
}
