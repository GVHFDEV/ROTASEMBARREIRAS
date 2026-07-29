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
import TrailsView from "../components/TrailsView";
import VoiceView from "../components/VoiceView";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { fetchTouristPoints, fetchSearchHistory, recordSearch, recordScan } from "@/services/pointsService";
import type { AddressResult } from "@/services/geocodingService";
import { Landmark, Trees, Utensils, Sparkles, Compass, Navigation, Map, Route, User, PanelLeftClose, PanelLeftOpen, X, LogIn, UserPlus } from "lucide-react";

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
  const { user, loading: authLoading, preferences, updatePreferences, isAnonymous } = useAuth();

  const [points, setPoints] = useState<TouristPoint[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "trails" | "voice" | "profile">("home");
  // Desktop sidebar collapsed state (default: true = collapsed/icon-only)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TouristPoint | null>(null);
  const [activeDetailsPoint, setActiveDetailsPoint] = useState<TouristPoint | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchedPoints, setSearchedPoints] = useState<TouristPoint[]>([]);
  const [scanOrigin, setScanOrigin] = useState<"map" | "trail">("map");
  const [trailsRefreshKey, setTrailsRefreshKey] = useState(0);
  const [voiceRequestedCity, setVoiceRequestedCity] = useState<string | null>(null);

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
  const [reduceMotion, setReduceMotion] = useState(false);

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
    setReduceMotion(preferences.reduce_motion_enabled ?? false);
  }, [preferences]);

  const handleSetHighContrast = (value: boolean) => {
    setIsHighContrast(value);
    updatePreferences({ high_contrast_enabled: value }).catch(() => {});
  };

  const handleSetFontScale = (scale: "normal" | "lg" | "xl") => {
    setFontScale(scale);
    updatePreferences({ font_scale: scale }).catch(() => {});
  };

  const FONT_STEPS: Array<"normal" | "lg" | "xl"> = ["normal", "lg", "xl"];
  const handleIncreaseFontScale = () => {
    const idx = FONT_STEPS.indexOf(fontScale);
    handleSetFontScale(FONT_STEPS[Math.min(idx + 1, FONT_STEPS.length - 1)]);
  };
  const handleDecreaseFontScale = () => {
    const idx = FONT_STEPS.indexOf(fontScale);
    handleSetFontScale(FONT_STEPS[Math.max(idx - 1, 0)]);
  };

  const handleSetVLibrasActive = (value: boolean) => {
    setVLibrasActive(value);
    updatePreferences({ libras_enabled: value }).catch(() => {});
  };

  const handleSetVoiceActive = (value: boolean) => {
    setVoiceActive(value);
    updatePreferences({ audio_enabled: value }).catch(() => {});
  };

  const handleSetReduceMotion = (value: boolean) => {
    setReduceMotion(value);
    updatePreferences({ reduce_motion_enabled: value }).catch(() => {});
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

  const handleSetActiveTab = (tab: "home" | "trails" | "voice" | "profile") => {
    setActiveTab(tab);
    setActiveDetailsPoint(null);
    setIsScannerOpen(false);
    setSelectedPoint(null);
    setVoiceRequestedCity(null);
  };

  // Detect if we are on a desktop viewport (>= 1024px) — used to skip
  // the intermediate bottom-sheet preview and go straight to details.
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

  const isValidCoords = (lat: any, lng: any) =>
    typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);

  const handleSelectPointFromMapOrSearch = (point: TouristPoint) => {
    if (!point || !point.coords || !isValidCoords(point.coords.lat, point.coords.lng)) return;
    const { lat, lng } = point.coords;

    if (isDesktop) {
      // Desktop: skip preview bottom sheet, go directly to full details,
      // and offset longitude (-0.008) so the marker lands in the center of the visible map area
      addToHistory(point);
      setActiveDetailsPoint(point);
      setFlyToCoords([lat, lng - 0.008]);
    } else {
      setSelectedPoint(point);
      // Center map on selected point coords
      setFlyToCoords([lat, lng]);
    }
  };

  // Address result (Photon) — just center/zoom the map, no ponto detail
  // screen exists for a plain address, so skip selectedPoint/BottomSheet.
  const handleSelectAddress = (address: AddressResult) => {
    if (!address || !isValidCoords(address.lat, address.lng)) return;
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
    // QR confirmation only — this is the single source of truth for trail
    // progress + XP. Not the same as addToHistory's recordSearch, which
    // also fires on plain map/search taps (not proof of physical visit).
    if (user) {
      recordScan(user.id, point.id)
        .then(() => {
          if (scanOrigin === "trail") {
            setTrailsRefreshKey((prev) => prev + 1);
          } else {
            setActiveDetailsPoint(point);
          }
        })
        .catch(() => {
          if (scanOrigin !== "trail") {
            setActiveDetailsPoint(point);
          } else {
            setTrailsRefreshKey((prev) => prev + 1);
          }
        });
    } else {
      if (scanOrigin !== "trail") {
        setActiveDetailsPoint(point);
      }
    }
  };

  // Filter tourist points according to active category tag (using case-insensitive substring matching)
  const filteredPoints = selectedCategory
    ? points.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()))
    : points;

  return (
    <main className="w-full min-h-dvh bg-zinc-100 flex items-center justify-center font-sans antialiased">
      <div className={`relative w-full max-w-md h-dvh md:max-h-[850px] md:rounded-[40px] md:shadow-2xl md:border-[8px] md:border-zinc-800 bg-bg-app overflow-hidden flex flex-col lg:max-w-none lg:h-screen lg:max-h-none lg:rounded-none lg:border-0 lg:shadow-none lg:flex-row transition-colors duration-250 ${
        isHighContrast ? "theme-high-contrast" : ""
      } ${
        fontScale === "lg" ? "font-scale-lg" : fontScale === "xl" ? "font-scale-xl" : ""
      } ${
        reduceMotion ? "reduce-motion" : ""
      }`}>
        <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>

        {/* Status Bar simulation - hidden on lg: desktop */}
        <div className="hidden md:flex lg:hidden justify-between items-center px-6 py-2 bg-white text-[10px] font-bold text-text-secondary select-none flex-shrink-0">
          <span>1:41</span>
          <div className="w-32 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5" />
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-4 h-2.5 bg-text-secondary/70 rounded-xs" />
          </div>
        </div>

        {/* Desktop Left Sidebar Navigation (Visible on lg: screens)
            Collapsed by default — shows only icons. Expand button toggles labels.
            Stays fixed at z-40 so side sheets (z-60) slide over it smoothly without DOM jump.
        */}
        <aside
          className={`hidden lg:flex lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:z-40 lg:flex-shrink-0 select-none justify-between py-5 transition-all duration-300 ${
            sidebarCollapsed ? "lg:w-16 lg:px-3" : "lg:w-56 lg:px-4"
          }`}
        >
          <div className="flex flex-col gap-3">
            {/* Collapse toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-text-secondary hover:bg-gray-100 hover:text-text-main transition-all cursor-pointer self-end mb-2"
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Navigation Tabs — icons always visible, labels only when expanded */}
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => handleSetActiveTab("home")}
                className={`flex items-center gap-3 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                  sidebarCollapsed ? "justify-center px-2" : "px-3"
                } ${
                  activeTab === "home"
                    ? "bg-brand-light text-brand"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                }`}
                title="Explorar"
              >
                <Map className={`w-5 h-5 flex-shrink-0 ${activeTab === "home" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {!sidebarCollapsed && <span>Explorar</span>}
              </button>

              <button
                onClick={() => handleSetActiveTab("trails")}
                className={`flex items-center gap-3 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                  sidebarCollapsed ? "justify-center px-2" : "px-3"
                } ${
                  activeTab === "trails"
                    ? "bg-brand-light text-brand"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                }`}
                title="Trilhas"
              >
                <Route className={`w-5 h-5 flex-shrink-0 ${activeTab === "trails" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {!sidebarCollapsed && <span>Trilhas</span>}
              </button>

              <button
                onClick={() => handleSetActiveTab("voice")}
                className={`flex items-center gap-3 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                  sidebarCollapsed ? "justify-center px-2" : "px-3"
                } ${
                  activeTab === "voice"
                    ? "bg-brand-light text-brand"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                }`}
                title="Voz"
              >
                <Sparkles className={`w-5 h-5 flex-shrink-0 ${activeTab === "voice" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {!sidebarCollapsed && <span>Voz</span>}
              </button>
            </nav>
          </div>

          {/* User profile / Auth button footer in sidebar */}
          <div className="pt-3 mt-auto border-t border-gray-200/80">
            {isAnonymous ? (
              <button
                onClick={() => handleSetActiveTab("profile")}
                className={`w-full flex items-center gap-3 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                  sidebarCollapsed ? "justify-center px-2" : "px-3"
                } ${
                  activeTab === "profile"
                    ? "bg-brand-light text-brand"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                }`}
                title="Entrar ou Criar Conta"
              >
                <LogIn className={`w-5 h-5 flex-shrink-0 ${activeTab === "profile" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {!sidebarCollapsed && <span>Entrar</span>}
              </button>
            ) : user ? (
              <button
                onClick={() => handleSetActiveTab("profile")}
                className={`w-full flex items-center gap-3 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                  sidebarCollapsed ? "justify-center px-2" : "px-3"
                } ${
                  activeTab === "profile"
                    ? "bg-brand-light text-brand"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                }`}
                title="Meu Perfil"
              >
                <div className="w-7 h-7 rounded-full bg-brand-light text-brand flex items-center justify-center font-black text-xs flex-shrink-0">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="text-xs font-black text-text-main truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0] || "Visitante"}
                    </span>
                    <span className="text-[10px] font-semibold text-text-secondary truncate">{user.email}</span>
                  </div>
                )}
              </button>
            ) : null}
          </div>
        </aside>

        <div className="flex-1 relative overflow-hidden">
          {/* Single Map Layer — ALWAYS mounted in background for both mobile & desktop */}
          <div className="w-full h-full relative">
            {/* SearchBar and Category Tags (Visible on PC always, on Mobile ONLY when on "home" tab) */}
            {(activeTab === "home" || isDesktop) && (
              <>
                <SearchBar
                  points={filteredPoints}
                  onSelectPoint={handleSelectPointFromMapOrSearch}
                  onSelectAddress={handleSelectAddress}
                  onOpenScanner={() => {
                    setScanOrigin("map");
                    setIsScannerOpen(true);
                  }}
                  selectedPointId={selectedPoint?.id}
                />

                <div className="absolute top-[calc(env(safe-area-inset-top)+84px)] left-0 right-0 z-40 overflow-x-auto no-scrollbar flex gap-2 px-5 py-1 lg:top-4 lg:left-[396px] lg:right-auto lg:max-w-[calc(100vw-680px)]">
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
              </>
            )}

            <CustomMap
              points={filteredPoints}
              selectedPoint={selectedPoint}
              onSelectPoint={handleSelectPointFromMapOrSearch}
              userLocation={userLocation}
              flyToCoords={flyToCoords}
              reduceMotion={reduceMotion}
            />

            <AnimatePresence>
              {exploreSheetState === "collapsed" && (
                <motion.button
                  key="recenter-btn"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  onClick={handleRecenter}
                  className="absolute bottom-[106px] right-5 z-40 w-13 h-13 rounded-full bg-white text-brand shadow-xl border border-gray-100/50 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-90 lg:bottom-6 lg:right-6 lg:w-12 lg:h-12"
                  title="Centralizar na minha localização"
                >
                  <Navigation className="w-6 h-6 stroke-[2.3]" />
                </motion.button>
              )}
            </AnimatePresence>

            <BottomSheet
              point={selectedPoint}
              onClose={() => setSelectedPoint(null)}
              onViewDetails={handleViewDetails}
            />
          </div>

          {/* Mobile Fullscreen Tab Overlay with original smooth transitions */}
          <div className="block lg:hidden absolute inset-0 z-40 pointer-events-none">
            <AnimatePresence mode="wait">
              {activeTab === "home" ? (
                <motion.div
                  key="home-tab"
                  initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="w-full h-full pointer-events-none"
                />
              ) : activeTab === "trails" ? (
                <motion.div
                  key="trails-tab"
                  initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="absolute inset-0 z-40 bg-bg-app overflow-y-auto no-scrollbar pointer-events-auto"
                >
                  <TrailsView
                    points={points}
                    onSelectPointFromTrail={(point) => {
                      setActiveTab("home");
                      handleSelectPointFromMapOrSearch(point);
                    }}
                    onOpenScanner={() => {
                      setScanOrigin("trail");
                      setIsScannerOpen(true);
                    }}
                    refreshKey={trailsRefreshKey}
                    autoOpenCity={voiceRequestedCity}
                  />
                </motion.div>
              ) : activeTab === "voice" ? (
                <motion.div
                  key="voice-tab"
                  initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="absolute inset-0 z-40 bg-bg-app overflow-y-auto overflow-x-hidden no-scrollbar pointer-events-auto"
                >
                  <VoiceView
                    userId={user?.id || ""}
                    points={points}
                    searchedPoints={searchedPoints}
                    userLocation={userLocation}
                    goToPoint={(point) => {
                      setActiveTab("home");
                      handleSelectPointFromMapOrSearch(point);
                    }}
                    goToTrailsForCity={(city) => {
                      setVoiceRequestedCity(city);
                      setActiveTab("trails");
                    }}
                    goToTrails={() => {
                      setVoiceRequestedCity(null);
                      setActiveTab("trails");
                    }}
                    goToMap={() => setActiveTab("home")}
                    goToProfile={() => setActiveTab("profile")}
                    openScanner={() => {
                      setScanOrigin("map");
                      setIsScannerOpen(true);
                    }}
                    setHighContrast={handleSetHighContrast}
                    setVLibras={handleSetVLibrasActive}
                    setVoiceReading={handleSetVoiceActive}
                    setReduceMotion={handleSetReduceMotion}
                    increaseFontScale={handleIncreaseFontScale}
                    decreaseFontScale={handleDecreaseFontScale}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="profile-tab"
                  initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="absolute inset-0 z-40 bg-bg-app overflow-y-auto no-scrollbar pointer-events-auto"
                >
                  <ProfileView
                    searchedPoints={searchedPoints}
                    onSelectPoint={(point) => setActiveDetailsPoint(point)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Persistent Google-Maps-like Bottom Sheet — hidden on desktop due to layout conflict */}
        <AnimatePresence>
          {activeTab === "home" && !selectedPoint && !activeDetailsPoint && !isScannerOpen && (
            <ExploreBottomSheet
              key="explore-bottom-sheet"
              currentState={exploreSheetState}
              setCurrentState={setExploreSheetState}
              hideOnDesktop
            />
          )}
        </AnimatePresence>

        {/* Desktop side sheets for Trails / Voice / Profile — slide from left, over sidebar (z-[60]) */}
        <AnimatePresence>
          {activeTab !== "home" && (
            <motion.div
              key={`desktop-sidesheet-${activeTab}`}
              initial={reduceMotion ? { x: 0 } : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? { x: 0 } : { x: "-100%" }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 32, stiffness: 280 }}
              className="hidden lg:flex lg:flex-col lg:absolute lg:inset-y-0 lg:left-0 lg:w-[390px] lg:z-[60] lg:bg-bg-app lg:border-r lg:border-gray-200 lg:shadow-2xl overflow-y-auto no-scrollbar"
            >
              {/* Clean Close X Button */}
              <button
                onClick={() => handleSetActiveTab("home")}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md text-text-secondary hover:text-text-main hover:bg-gray-50 flex items-center justify-center transition-all cursor-pointer"
                title="Fechar e voltar ao mapa"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {activeTab === "trails" ? (
                  <motion.div key="dt-trails" className="w-full min-h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <TrailsView
                      points={points}
                      onSelectPointFromTrail={(point) => {
                        setActiveTab("home");
                        handleSelectPointFromMapOrSearch(point);
                      }}
                      onOpenScanner={() => {
                        setScanOrigin("trail");
                        setIsScannerOpen(true);
                      }}
                      refreshKey={trailsRefreshKey}
                      autoOpenCity={voiceRequestedCity}
                    />
                  </motion.div>
                ) : activeTab === "voice" ? (
                  <motion.div key="dt-voice" className="w-full min-h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <VoiceView
                      userId={user?.id || ""}
                      points={points}
                      searchedPoints={searchedPoints}
                      userLocation={userLocation}
                      goToPoint={(point) => {
                        setActiveTab("home");
                        handleSelectPointFromMapOrSearch(point);
                      }}
                      goToTrailsForCity={(city) => {
                        setVoiceRequestedCity(city);
                        setActiveTab("trails");
                      }}
                      goToTrails={() => {
                        setVoiceRequestedCity(null);
                        setActiveTab("trails");
                      }}
                      goToMap={() => setActiveTab("home")}
                      goToProfile={() => setActiveTab("profile")}
                      openScanner={() => {
                        setScanOrigin("map");
                        setIsScannerOpen(true);
                      }}
                      setHighContrast={handleSetHighContrast}
                      setVLibras={handleSetVLibrasActive}
                      setVoiceReading={handleSetVoiceActive}
                      setReduceMotion={handleSetReduceMotion}
                      increaseFontScale={handleIncreaseFontScale}
                      decreaseFontScale={handleDecreaseFontScale}
                    />
                  </motion.div>
                ) : activeTab === "profile" ? (
                  <motion.div key="dt-profile" className="w-full min-h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <ProfileView
                      searchedPoints={searchedPoints}
                      onSelectPoint={(point) => setActiveDetailsPoint(point)}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
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
          reduceMotionActive={reduceMotion}
          setReduceMotionActive={handleSetReduceMotion}
        />
        </MotionConfig>
      </div>
    </main>
  );
}
