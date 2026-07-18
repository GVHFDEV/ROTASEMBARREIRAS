"use client";

import React, { useEffect, useState, useCallback } from "react";
import { touristPoints as fallbackPoints, TouristPoint } from "../data/mockData";
import BottomNav from "../components/BottomNav";
import SearchBar from "../components/SearchBar";
import dynamic from "next/dynamic";
const CustomMap = dynamic(() => import("../components/CustomMap"), { ssr: false });
import BottomSheet from "../components/BottomSheet";
import PointDetails from "../components/PointDetails";
import ProfileView from "../components/ProfileView";
import QRCodeScanner from "../components/QRCodeScanner";
import LoginPage from "../components/LoginPage";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { fetchTouristPoints, fetchSearchHistory, recordSearch } from "@/services/pointsService";

function LoadingScreen() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-bg-app">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const [points, setPoints] = useState<TouristPoint[]>(fallbackPoints);
  const [activeTab, setActiveTab] = useState<"home" | "profile">("home");
  const [selectedPoint, setSelectedPoint] = useState<TouristPoint | null>(null);
  const [activeDetailsPoint, setActiveDetailsPoint] = useState<TouristPoint | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchedPoints, setSearchedPoints] = useState<TouristPoint[]>([]);

  // Load points + user history once authenticated
  useEffect(() => {
    if (!user) return;

    fetchTouristPoints()
      .then(setPoints)
      .catch(() => setPoints(fallbackPoints)); // keep mock as fallback if fetch fails

    fetchSearchHistory(user.id)
      .then(setSearchedPoints)
      .catch(() => setSearchedPoints([]));
  }, [user]);

  const persistSearch = useCallback(
    (pointId: string) => {
      if (!user) return;
      recordSearch(user.id, pointId).catch(() => {
        // non-critical — history sync fails silently, UI already updated optimistically
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

  return (
    <main className="w-full min-h-screen bg-zinc-100 flex items-center justify-center font-sans antialiased">
      <div className="relative w-full max-w-md h-screen md:max-h-[850px] md:rounded-[40px] md:shadow-2xl md:border-[8px] md:border-zinc-800 bg-bg-app overflow-hidden flex flex-col">

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
                <SearchBar
                  points={points}
                  onSelectPoint={handleSelectPointFromMapOrSearch}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  selectedPointId={selectedPoint?.id}
                />

                <CustomMap
                  points={points}
                  selectedPoint={selectedPoint}
                  onSelectPoint={handleSelectPointFromMapOrSearch}
                />

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

        <AnimatePresence>
          {activeDetailsPoint && (
            <PointDetails point={activeDetailsPoint} onBack={() => setActiveDetailsPoint(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isScannerOpen && (
            <QRCodeScanner
              points={points}
              onClose={() => setIsScannerOpen(false)}
              onScanSuccess={handleScanSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
