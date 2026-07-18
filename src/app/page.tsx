"use client";

import React, { useState } from "react";
import { touristPoints, TouristPoint } from "../data/mockData";
import BottomNav from "../components/BottomNav";
import SearchBar from "../components/SearchBar";
import dynamic from "next/dynamic";
const CustomMap = dynamic(() => import("../components/CustomMap"), { ssr: false });
import BottomSheet from "../components/BottomSheet";
import PointDetails from "../components/PointDetails";
import ProfileView from "../components/ProfileView";
import QRCodeScanner from "../components/QRCodeScanner";
import { AnimatePresence, motion } from "framer-motion";

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "profile">("home");
  const [selectedPoint, setSelectedPoint] = useState<TouristPoint | null>(null);
  const [activeDetailsPoint, setActiveDetailsPoint] = useState<TouristPoint | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // History of searched/visited points (start with 2 points for demonstration purposes)
  const [searchedPoints, setSearchedPoints] = useState<TouristPoint[]>([
    touristPoints[1], // Praça da Estação
    touristPoints[4], // Deck do Rio Doce
  ]);

  const handleSetActiveTab = (tab: "home" | "profile") => {
    setActiveTab(tab);
    // Reset overlays when switching pages to prevent overlapping
    setActiveDetailsPoint(null);
    setIsScannerOpen(false);
    setSelectedPoint(null);
  };

  const handleSelectPointFromMapOrSearch = (point: TouristPoint) => {
    setSelectedPoint(point);
  };

  const handleViewDetails = (point: TouristPoint) => {
    // Add to history if not already present
    if (!searchedPoints.some((p) => p.id === point.id)) {
      setSearchedPoints((prev) => [point, ...prev]);
    }
    setActiveDetailsPoint(point);
    setSelectedPoint(null); // Close bottom preview sheet
  };

  const handleScanSuccess = (point: TouristPoint) => {
    setIsScannerOpen(false);
    
    // Add to history if not already present
    if (!searchedPoints.some((p) => p.id === point.id)) {
      setSearchedPoints((prev) => [point, ...prev]);
    }
    
    // Open details directly for scanned point
    setActiveDetailsPoint(point);
  };

  return (
    <main className="w-full min-h-screen bg-zinc-100 flex items-center justify-center font-sans antialiased">
      {/* 
        Mock Device Shell for Desktop, Fullscreen on Mobile.
        Enforces a clean mobile-first view-frame.
      */}
      <div className="relative w-full max-w-md h-screen md:max-h-[850px] md:rounded-[40px] md:shadow-2xl md:border-[8px] md:border-zinc-800 bg-bg-app overflow-hidden flex flex-col">
        
        {/* Status Bar simulation (only visible in device mockup mode) */}
        <div className="hidden md:flex justify-between items-center px-6 py-2 bg-white text-[10px] font-bold text-text-secondary select-none flex-shrink-0">
          <span>1:41</span>
          <div className="w-32 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5" />
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-4 h-2.5 bg-text-secondary/70 rounded-xs" />
          </div>
        </div>

        {/* Core Content Area */}
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
                {/* Search overlay at top */}
                <SearchBar
                  onSelectPoint={handleSelectPointFromMapOrSearch}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  selectedPointId={selectedPoint?.id}
                />

                {/* Main Interactive Map (Refactored to Leaflet) */}
                <CustomMap
                  points={touristPoints}
                  selectedPoint={selectedPoint}
                  onSelectPoint={handleSelectPointFromMapOrSearch}
                />

                {/* Bottom sheet for quick point preview */}
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
                  onSelectPoint={(point) => {
                    // Navigate to details directly when clicking history card
                    setActiveDetailsPoint(point);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Bottom Navigation bar */}
        <BottomNav activeTab={activeTab} setActiveTab={handleSetActiveTab} />

        {/* Fullscreen detail view of a tourist point */}
        <AnimatePresence>
          {activeDetailsPoint && (
            <PointDetails
              point={activeDetailsPoint}
              onBack={() => setActiveDetailsPoint(null)}
            />
          )}
        </AnimatePresence>

        {/* QR Code Scanner camera simulation overlay */}
        <AnimatePresence>
          {isScannerOpen && (
            <QRCodeScanner
              onClose={() => setIsScannerOpen(false)}
              onScanSuccess={handleScanSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
